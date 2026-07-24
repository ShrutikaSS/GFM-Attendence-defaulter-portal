<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$user = $_SESSION['user'] ?? null;
if (!$user || !in_array($user['role'], ['gfm', 'hod'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

if (!isset($pdo) || $pdo === null) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

$attendanceId = (int)($input['attendance_id'] ?? $input['record_id'] ?? 0);
$newStatus = trim($input['status'] ?? $input['new_status'] ?? '');
$newRemarks = trim($input['remarks'] ?? 'Regular');
$reason = trim($input['reason'] ?? '');

if (empty($attendanceId) || empty($newStatus)) {
    echo json_encode(['success' => false, 'message' => 'Attendance ID and new status are required.']);
    exit;
}

$validStatuses = ['Present', 'Absent', 'Medical Leave', 'Duty Leave'];
if (!in_array($newStatus, $validStatuses)) {
    echo json_encode(['success' => false, 'message' => 'Invalid status.']);
    exit;
}

if ($user['role'] === 'hod' && empty($reason)) {
    echo json_encode(['success' => false, 'message' => 'HOD must provide a reason for edits.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Fetch existing record
    $stmt = $pdo->prepare("SELECT * FROM attendance WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $attendanceId]);
    $record = $stmt->fetch();

    if (!$record) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Attendance record not found.']);
        exit;
    }

    $oldStatus = $record['status'];
    $oldRemarks = $record['remarks'];
    $studentId = $record['student_id'];

    // Update attendance
    $updateStmt = $pdo->prepare("
        UPDATE attendance 
        SET status = :status, remarks = :remarks, updated_at = NOW()
        WHERE id = :id
    ");
    $updateStmt->execute([
        'status' => $newStatus,
        'remarks' => $newRemarks,
        'id' => $attendanceId
    ]);

    // Insert history
    $histStmt = $pdo->prepare("
        INSERT INTO attendance_history 
        (attendance_id, student_id, old_status, new_status, old_remarks, new_remarks, edited_by, editor_name, editor_role, reason, ip_address, user_agent)
        VALUES (:attendance_id, :student_id, :old_status, :new_status, :old_remarks, :new_remarks, :edited_by, :editor_name, :editor_role, :reason, :ip, :ua)
    ");
    $histStmt->execute([
        'attendance_id' => $attendanceId,
        'student_id' => $studentId,
        'old_status' => $oldStatus,
        'new_status' => $newStatus,
        'old_remarks' => $oldRemarks,
        'new_remarks' => $newRemarks,
        'edited_by' => $user['id'],
        'editor_name' => $user['full_name'],
        'editor_role' => $user['role'],
        'reason' => $reason,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'ua' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ]);

    // Recalculate summary
    recalculateStudentSummary($pdo, $studentId);

    // Generate notification
    createNotification($pdo, $studentId, 'attendance_corrected',
        "Attendance Record Corrected",
        "Your attendance for " . $record['subject'] . " on " . $record['date'] . " was corrected from {$oldStatus} to {$newStatus}.",
        'student', $user['id']);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Attendance updated successfully.',
        'old_status' => $oldStatus,
        'new_status' => $newStatus
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Error updating attendance: ' . $e->getMessage()]);
}

function recalculateStudentSummary($pdo, $studentId) {
    $stmt = $pdo->prepare("
        SELECT 
            subject,
            semester,
            division,
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent,
            SUM(CASE WHEN status = 'Medical Leave' THEN 1 ELSE 0 END) AS medical,
            SUM(CASE WHEN status = 'Duty Leave' THEN 1 ELSE 0 END) AS duty
        FROM attendance 
        WHERE student_id = :student_id 
        GROUP BY subject, semester, division
    ");
    $stmt->execute(['student_id' => $studentId]);
    $summaries = $stmt->fetchAll();

    $upsertStmt = $pdo->prepare("
        INSERT INTO attendance_summary 
        (student_id, subject, semester, division, total_lectures, present_count, absent_count, medical_leave_count, duty_leave_count, attendance_percentage, status)
        VALUES (:student_id, :subject, :semester, :division, :total, :present, :absent, :medical, :duty, :pct, :status)
        ON DUPLICATE KEY UPDATE 
            total_lectures = :total,
            present_count = :present,
            absent_count = :absent,
            medical_leave_count = :medical,
            duty_leave_count = :duty,
            attendance_percentage = :pct,
            status = :status,
            updated_at = NOW()
    ");

    foreach ($summaries as $sum) {
        $total = (int)$sum['total'];
        $actualPresent = (int)$sum['present'];
        $attendedTotal = $actualPresent + (int)$sum['medical'] + (int)$sum['duty'];
        $pct = $total > 0 ? round(($attendedTotal / $total) * 100, 2) : 0.00;
        $status = $pct >= 75 ? 'Regular' : ($pct >= 60 ? 'Warning' : 'Defaulter');

        $upsertStmt->execute([
            'student_id' => $studentId,
            'subject' => $sum['subject'],
            'semester' => $sum['semester'],
            'division' => $sum['division'],
            'total' => $total,
            'present' => $actualPresent,
            'absent' => (int)$sum['absent'],
            'medical' => (int)$sum['medical'],
            'duty' => (int)$sum['duty'],
            'pct' => $pct,
            'status' => $status
        ]);
    }
}

function createNotification($pdo, $userId, $type, $title, $message, $targetRole, $createdBy) {
    $stmt = $pdo->prepare("
        INSERT INTO notifications (user_id, target_role, type, title, message, created_by)
        VALUES (:uid, :role, :type, :title, :message, :cb)
    ");
    $stmt->execute([
        'uid' => $userId,
        'role' => $targetRole,
        'type' => $type,
        'title' => $title,
        'message' => $message,
        'cb' => $createdBy
    ]);
}
?>
