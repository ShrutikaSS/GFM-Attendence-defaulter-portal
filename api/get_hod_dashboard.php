<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

// Ensure user is logged in as HOD
$user = $_SESSION['user'] ?? null;
if (!$user || $user['role'] !== 'hod') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

if (!isset($pdo) || $pdo === null) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

try {
    // 1. Total Students
    $studentsCount = $pdo->query("SELECT COUNT(*) FROM student_details")->fetchColumn();

    // 2. Total Faculty
    $facultyCount = $pdo->query("SELECT COUNT(*) FROM faculty")->fetchColumn();

    // 3. Total Divisions / Classes
    $classesCount = $pdo->query("SELECT COUNT(DISTINCT division) FROM student_details")->fetchColumn();
    if ($classesCount == 0) $classesCount = 3; // Fallback

    // 4. Overall Attendance %
    $overallAtt = $pdo->query("
        SELECT 
            CASE 
                WHEN COUNT(*) > 0 THEN ROUND(SUM(CASE WHEN status IN ('Present', 'Medical Leave', 'Duty Leave') THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) 
                ELSE 0 
            END 
        FROM attendance
    ")->fetchColumn();

    // 5. Defaulters Count (students with overall attendance < 75%)
    $defaultersCount = $pdo->query("
        SELECT COUNT(*) FROM (
            SELECT student_id, SUM(CASE WHEN status IN ('Present', 'Medical Leave', 'Duty Leave') THEN 1 ELSE 0 END) / COUNT(*) * 100 AS pct 
            FROM attendance 
            GROUP BY student_id
        ) s_pcts WHERE pct < 75
    ")->fetchColumn();

    echo json_encode([
        'success' => true,
        'data' => [
            'totalStudents' => (int)$studentsCount,
            'totalFaculty' => (int)$facultyCount,
            'totalClasses' => (int)$classesCount,
            'overallAttendance' => $overallAtt . '%',
            'defaulters' => (int)$defaultersCount,
            'pendingReports' => 0
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while loading HOD dashboard: ' . $e->getMessage()
    ]);
}
?>
