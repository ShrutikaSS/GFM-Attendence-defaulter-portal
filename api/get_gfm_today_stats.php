<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$user = $_SESSION['user'] ?? null;
if (!$user || $user['role'] !== 'gfm') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

if (!isset($pdo) || $pdo === null) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$division = $user['division_assigned'] ?? 'A';
$division = str_replace('Div ', '', $division);

try {
    // Today's attendance
    $today = date('Y-m-d');
    $todayStmt = $pdo->prepare("
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent,
            SUM(CASE WHEN status = 'Medical Leave' THEN 1 ELSE 0 END) AS medical,
            SUM(CASE WHEN status = 'Duty Leave' THEN 1 ELSE 0 END) AS duty
        FROM attendance a
        JOIN student_details sd ON a.student_id = sd.user_id
        WHERE sd.division = :division AND a.date = :today
    ");
    $todayStmt->execute(['division' => $division, 'today' => $today]);
    $todayData = $todayStmt->fetch();

    // Overall metrics for division
    $divStmt = $pdo->prepare("
        SELECT 
            COUNT(DISTINCT s.user_id) AS total_students,
            COUNT(a.id) AS total_sessions,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS total_present,
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS total_absent
        FROM student_details s
        LEFT JOIN attendance a ON s.user_id = a.student_id
        WHERE s.division = :division
    ");
    $divStmt->execute(['division' => $division]);
    $divMetrics = $divStmt->fetch();

    // Today specific stats
    $totalMarked = (int)($todayData['total'] ?? 0);
    $presentToday = (int)($todayData['present'] ?? 0);
    $absentToday = (int)($todayData['absent'] ?? 0);
    $medicalToday = (int)($todayData['medical'] ?? 0);
    $dutyToday = (int)($todayData['duty'] ?? 0);
    $todayPct = $totalMarked > 0 ? round(($presentToday / $totalMarked) * 100, 1) : 0;

    // Attendance percentage
    $overallPct = $divMetrics['total_sessions'] > 0 
        ? round(($divMetrics['total_present'] / $divMetrics['total_sessions']) * 100, 1) 
        : 0;

    // Students below thresholds
    $warningStmt = $pdo->prepare("
        SELECT COUNT(*) FROM attendance_summary s
        JOIN student_details sd ON s.student_id = sd.user_id
        WHERE sd.division = :division 
        AND s.attendance_percentage >= 60 AND s.attendance_percentage < 75
    ");
    $warningStmt->execute(['division' => $division]);
    $warningCount = (int)$warningStmt->fetchColumn();

    $criticalStmt = $pdo->prepare("
        SELECT COUNT(*) FROM attendance_summary s
        JOIN student_details sd ON s.student_id = sd.user_id
        WHERE sd.division = :division AND s.attendance_percentage < 60
    ");
    $criticalStmt->execute(['division' => $division]);
    $criticalCount = (int)$criticalStmt->fetchColumn();

    // Recent attendance sessions
    $recentStmt = $pdo->prepare("
        SELECT a.subject, a.date, COUNT(*) as total, SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present
        FROM attendance a
        JOIN student_details sd ON a.student_id = sd.user_id
        WHERE sd.division = :division
        GROUP BY a.subject, a.date
        ORDER BY a.date DESC
        LIMIT 10
    ");
    $recentStmt->execute(['division' => $division]);
    $recent = $recentStmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => [
            'today' => [
                'total' => $totalMarked,
                'present' => $presentToday,
                'absent' => $absentToday,
                'medical' => $medicalToday,
                'duty' => $dutyToday,
                'percentage' => $todayPct
            ],
            'metrics' => [
                'total_students' => $divMetrics['total_students'] ?? 0,
                'overall_percentage' => $overallPct,
                'warning_count' => $warningCount,
                'critical_count' => $criticalCount
            ],
            'recent_sessions' => $recent
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
