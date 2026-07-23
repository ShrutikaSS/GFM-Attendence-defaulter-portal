<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$user = $_SESSION['user'] ?? null;
if (!$user) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

if (!isset($pdo) || $pdo === null) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

$studentId = (int)($input['student_id'] ?? 0);
$subject = trim($input['subject'] ?? '');
$division = trim($input['division'] ?? '');

if ($user['role'] === 'student') {
    $studentId = $user['id'];
    $sdStmt = $pdo->prepare("SELECT division FROM student_details WHERE user_id = :uid");
    $sdStmt->execute(['uid' => $studentId]);
    $sd = $sdStmt->fetch();
    if ($sd) $division = $sd['division'];
} elseif ($user['role'] === 'gfm') {
    $division = $user['division_assigned'] ?? $division;
}

try {
    // Overall summary
    $overallStmt = $pdo->prepare("
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent,
            SUM(CASE WHEN status = 'Medical Leave' THEN 1 ELSE 0 END) AS medical,
            SUM(CASE WHEN status = 'Duty Leave' THEN 1 ELSE 0 END) AS duty,
            CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) ELSE 0 END AS percentage
        FROM attendance 
        WHERE student_id = :student_id
    ");
    $overallStmt->execute(['student_id' => $studentId]);
    $overall = $overallStmt->fetch();

    // Subject-wise summary from cached table
    $subjQuery = "
        SELECT 
            subject,
            total_lectures,
            present_count,
            absent_count,
            medical_leave_count,
            duty_leave_count,
            attendance_percentage,
            status
        FROM attendance_summary 
        WHERE student_id = :student_id
    ";
    $subjParams = ['student_id' => $studentId];
    if (!empty($subject)) {
        $subjQuery .= " AND subject = :subject";
        $subjParams['subject'] = $subject;
    }
    $subjStmt = $pdo->prepare($subjQuery);
    $subjStmt->execute($subjParams);
    $subjects = $subjStmt->fetchAll();

    // Monthly trend
    $monthlyStmt = $pdo->prepare("
        SELECT 
            DATE_FORMAT(date, '%b %Y') AS month_label,
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present
        FROM attendance 
        WHERE student_id = :student_id
        GROUP BY DATE_FORMAT(date, '%Y-%m')
        ORDER BY DATE_FORMAT(date, '%Y-%m') DESC
        LIMIT 12
    ");
    $monthlyStmt->execute(['student_id' => $studentId]);
    $monthly = $monthlyStmt->fetchAll();

    // Defaulter status
    $pct = $overall['percentage'] ?? 0;
    $defaulterStatus = $pct >= 75 ? 'Regular' : ($pct >= 60 ? 'Warning' : 'Defaulter');

    echo json_encode([
        'success' => true,
        'data' => [
            'overall' => $overall,
            'subjects' => $subjects,
            'monthly' => $monthly,
            'defaulter_status' => $defaulterStatus,
            'percentage' => $pct
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error loading summary: ' . $e->getMessage()]);
}
?>
