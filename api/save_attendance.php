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

$classInput = trim($input['class'] ?? $input['division'] ?? '');
$year = 'FY';
$division = '';

if ($classInput === 'FY A' || $classInput === 'A') {
    $division = 'A';
} elseif ($classInput === 'FY B' || $classInput === 'B') {
    $division = 'B';
} elseif ($classInput === 'FY C' || $classInput === 'C') {
    $division = 'C';
} else {
    $parts = explode(' ', $classInput);
    if (count($parts) >= 2) {
        $year = strtoupper(trim($parts[0]));
        $division = strtoupper(trim($parts[1]));
    } else {
        $division = $classInput;
    }
}

$subject = trim($input['subject'] ?? '');
$date = trim($input['date'] ?? '');
$lecture_number = (int)($input['lecture_number'] ?? 1);
$semester = trim($input['semester'] ?? 'Semester VI');
$department = trim($input['department'] ?? 'Artificial Intelligence & Machine Learning');
$records = $input['records'] ?? [];
$update_existing = filter_var($input['update_existing'] ?? false, FILTER_VALIDATE_BOOLEAN);
$reason = trim($input['reason'] ?? '');

if (empty($subject) || empty($date) || empty($division) || empty($records)) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit;
}

if ($user['role'] === 'hod' && empty($reason) && $update_existing) {
    echo json_encode(['success' => false, 'message' => 'HOD must provide a reason for attendance changes.']);
    exit;
}

try {
    $pdo->beginTransaction();

    $validStatuses = ['Present', 'Absent', 'Medical Leave', 'Duty Leave'];
    $duplicatesFound = [];
    $savedCount = 0;
    $updatedCount = 0;

    // First, check for existing records
    $checkStmt = $pdo->prepare("
        SELECT id, student_id, status, remarks 
        FROM attendance 
        WHERE subject = :subject AND date = :date AND lecture_number = :lecture_number
    ");
    $checkStmt->execute(['subject' => $subject, 'date' => $date, 'lecture_number' => $lecture_number]);
    $existingMap = [];
    while ($row = $checkStmt->fetch()) {
        $existingMap[$row['student_id']] = $row;
    }

    foreach ($records as $rec) {
        $student_id = (int)$rec['student_id'];
        $status = trim($rec['status'] ?? 'Present');
        $remarks = trim($rec['remarks'] ?? 'Regular');

        if (!in_array($status, $validStatuses)) {
            $status = 'Present';
        }

        if (isset($existingMap[$student_id])) {
            if (!$update_existing) {
                $duplicatesFound[] = [
                    'student_id' => $student_id,
                    'old_status' => $existingMap[$student_id]['status'],
                    'new_status' => $status
                ];
                continue;
            }

            $oldStatus = $existingMap[$student_id]['status'];
            $oldRemarks = $existingMap[$student_id]['remarks'];
            $attendanceId = $existingMap[$student_id]['id'];

            $updateStmt = $pdo->prepare("
                UPDATE attendance 
                SET status = :status, remarks = :remarks, updated_at = NOW()
                WHERE id = :id
            ");
            $updateStmt->execute([
                'status' => $status,
                'remarks' => $remarks,
                'id' => $attendanceId
            ]);

            // Insert into history
            $histStmt = $pdo->prepare("
                INSERT INTO attendance_history 
                (attendance_id, student_id, old_status, new_status, old_remarks, new_remarks, edited_by, editor_name, editor_role, reason, ip_address, user_agent)
                VALUES (:attendance_id, :student_id, :old_status, :new_status, :old_remarks, :new_remarks, :edited_by, :editor_name, :editor_role, :reason, :ip, :ua)
            ");
            $histStmt->execute([
                'attendance_id' => $attendanceId,
                'student_id' => $student_id,
                'old_status' => $oldStatus,
                'new_status' => $status,
                'old_remarks' => $oldRemarks,
                'new_remarks' => $remarks,
                'edited_by' => $user['id'],
                'editor_name' => $user['full_name'],
                'editor_role' => $user['role'],
                'reason' => $reason,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'ua' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ]);

            $updatedCount++;
        } else {
            $insertStmt = $pdo->prepare("
                INSERT INTO attendance 
                (student_id, subject, date, lecture_number, status, remarks, semester, division, year, department_id, created_by)
                VALUES (:student_id, :subject, :date, :lecture_number, :status, :remarks, :semester, :division, :year, :department_id, :created_by)
            ");
            $insertStmt->execute([
                'student_id' => $student_id,
                'subject' => $subject,
                'date' => $date,
                'lecture_number' => $lecture_number,
                'status' => $status,
                'remarks' => $remarks,
                'semester' => $semester,
                'division' => $division,
                'year' => $year,
                'department_id' => 1,
                'created_by' => $user['id']
            ]);
            $savedCount++;
        }
    }

    $pdo->commit();

    // Recalculate summaries for affected students
    $affectedIds = array_map(function($rec) { return (int)$rec['student_id']; }, $records);
    foreach ($affectedIds as $sid) {
        recalculateStudentSummary($pdo, $sid);
    }

    // Generate notifications for warning/defaulters
    generateNotifications($pdo, $affectedIds, $user);

    logAction($pdo, $user['id'], $user['full_name'], $user['role'],
        "Saved attendance: $savedCount new, $updatedCount updated for $subject on $date");

    $message = "Attendance saved successfully. $savedCount new records, $updatedCount updated.";
    if (!empty($duplicatesFound)) {
        $message .= " " . count($duplicatesFound) . " records had existing entries but were not updated (update_existing was false).";
    }

    echo json_encode([
        'success' => true,
        'message' => $message,
        'saved' => $savedCount,
        'updated' => $updatedCount,
        'duplicates_skipped' => $duplicatesFound
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Error saving attendance: ' . $e->getMessage()]);
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

function generateNotifications($pdo, $studentIds, $editor) {
    foreach ($studentIds as $sid) {
        $stmt = $pdo->prepare("
            SELECT SUM(present_count) AS total_present, SUM(total_lectures) AS total_lectures,
                   SUM(medical_leave_count) AS medical, SUM(duty_leave_count) AS duty
            FROM attendance_summary 
            WHERE student_id = :sid
        ");
        $stmt->execute(['sid' => $sid]);
        $row = $stmt->fetch();

        if (!$row || (int)$row['total_lectures'] === 0) continue;

        $totalLectures = (int)$row['total_lectures'];
        // Treat medical and duty leave as present for the overall percentage
        $totalPresent = (int)$row['total_present'] + (int)$row['medical'] + (int)$row['duty'];
        $pct = round(($totalPresent / $totalLectures) * 100, 2);

        if ($pct < 60) {
            createNotification($pdo, $sid, 'critical_defaulter', 
                "Critical Attendance Alert", 
                "Your attendance has dropped to {$pct}%. You are now classified as a CRITICAL DEFAULTER. Immediate action required.", 
                'student', $editor['id']);
            createNotification($pdo, $sid, 'warning', 
                "Attendance Warning", 
                "Your attendance is at {$pct}%. Please maintain regular attendance to avoid academic penalties.", 
                'student', $editor['id']);
        } elseif ($pct < 75) {
            createNotification($pdo, $sid, 'warning', 
                "Attendance Warning", 
                "Your attendance is at {$pct}%. You are in the WARNING category. Maintain attendance above 75%.", 
                'student', $editor['id']);
        } else {
            createNotification($pdo, $sid, 'regular', 
                "Attendance Updated", 
                "Your attendance record has been updated. Current: {$pct}%. Keep up the good work!", 
                'student', $editor['id']);
        }
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

function logAction($pdo, $userId, $userName, $role, $details) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    $stmt = $pdo->prepare("
        INSERT INTO attendance_logs (action, user_id, user_name, user_role, details, ip_address, user_agent)
        VALUES ('save_attendance', :uid, :uname, :urole, :details, :ip, :ua)
    ");
    $stmt->execute(['uid' => $userId, 'uname' => $userName, 'urole' => $role, 'details' => $details, 'ip' => $ip, 'ua' => $ua]);
}
?>
