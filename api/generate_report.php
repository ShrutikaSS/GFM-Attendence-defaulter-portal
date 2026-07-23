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

$reportType = trim($input['report_type'] ?? 'daily');
$division = trim($input['division'] ?? ($user['division_assigned'] ?? ''));
$subject = trim($input['subject'] ?? '');
$semester = trim($input['semester'] ?? '');
$startDate = trim($input['start_date'] ?? '');
$endDate = trim($input['end_date'] ?? '');
$studentId = (int)($input['student_id'] ?? 0);

try {
    $where = ["1=1"];
    $params = [];

    if ($user['role'] === 'gfm' && $division) {
        $where[] = "sd.division = :division";
        $params['division'] = $division;
    }
    if ($division && $user['role'] === 'hod') {
        $where[] = "sd.division = :division";
        $params['division'] = $division;
    }
    if ($semester) {
        $where[] = "a.semester = :semester";
        $params['semester'] = $semester;
    }
    if ($subject) {
        $where[] = "a.subject = :subject";
        $params['subject'] = $subject;
    }
    if ($studentId > 0) {
        $where[] = "a.student_id = :student_id";
        $params['student_id'] = $studentId;
    }

    // Date filters based on report type
    $today = date('Y-m-d');
    switch ($reportType) {
        case 'daily':
            $where[] = "a.date = :date";
            $params['date'] = $startDate ?: $today;
            break;
        case 'weekly':
            $where[] = "a.date >= :start_date";
            $params['start_date'] = $startDate ?: date('Y-m-d', strtotime('-7 days'));
            $where[] = "a.date <= :end_date";
            $params['end_date'] = $endDate ?: $today;
            break;
        case 'monthly':
            $where[] = "a.date >= :start_date";
            $params['start_date'] = $startDate ?: date('Y-m-01');
            $where[] = "a.date <= :end_date";
            $params['end_date'] = $endDate ?: $today;
            break;
        case 'semester':
            // No date filter for semester
            break;
    }

    $whereClause = implode(' AND ', $where);

    // Summary stats
    $summaryQuery = "
        SELECT 
            COUNT(DISTINCT a.student_id) AS total_students,
            COUNT(*) AS total_records,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS total_present,
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS total_absent,
            SUM(CASE WHEN a.status = 'Medical Leave' THEN 1 ELSE 0 END) AS total_medical,
            SUM(CASE WHEN a.status = 'Duty Leave' THEN 1 ELSE 0 END) AS total_duty,
            CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) ELSE 0 END AS attendance_percentage
        FROM attendance a
        JOIN student_details sd ON a.student_id = sd.user_id
        WHERE $whereClause
    ";

    $summaryStmt = $pdo->prepare($summaryQuery);
    $summaryStmt->execute($params);
    $summary = $summaryStmt->fetch();

    // Detailed records
    $detailQuery = "
        SELECT 
            sd.roll_no,
            sd.prn,
            u.full_name,
            sd.division,
            a.subject,
            a.date,
            a.lecture_number,
            a.status,
            a.remarks
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        JOIN student_details sd ON a.student_id = sd.user_id
        WHERE $whereClause
        ORDER BY sd.division ASC, sd.roll_no ASC, a.date DESC
        LIMIT 500
    ";

    $detailStmt = $pdo->prepare($detailQuery);
    $detailStmt->execute($params);
    $details = $detailStmt->fetchAll();

    // Subject-wise breakdown if no specific subject
    $subjectQuery = "
        SELECT 
            a.subject,
            COUNT(*) AS total,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present,
            CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) ELSE 0 END AS percentage
        FROM attendance a
        JOIN student_details sd ON a.student_id = sd.user_id
        WHERE $whereClause
        GROUP BY a.subject
        ORDER BY percentage DESC
    ";

    $subjectStmt = $pdo->prepare($subjectQuery);
    $subjectStmt->execute($params);
    $subjectBreakdown = $subjectStmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => [
            'report_type' => $reportType,
            'summary' => $summary,
            'subject_breakdown' => $subjectBreakdown,
            'details' => $details,
            'generated_at' => date('Y-m-d H:i:s'),
            'generated_by' => $user['full_name']
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error generating report: ' . $e->getMessage()]);
}
?>
