<?php
// Test: simulate HOD session and call API
session_start();
$_SESSION['user'] = ['id' => 1, 'role' => 'hod', 'full_name' => 'Dr. Dipali Shende'];
require_once __DIR__ . '/../api/db.php';

// Replicate API logic
$studentsCount = $pdo->query("SELECT COUNT(*) FROM student_details")->fetchColumn();
$facultyCount = $pdo->query("SELECT COUNT(*) FROM faculty")->fetchColumn();
$classesCount = $pdo->query("SELECT COUNT(DISTINCT division) FROM student_details")->fetchColumn();
if ($classesCount == 0) $classesCount = 3;

$overallAtt = $pdo->query("
    SELECT CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(CASE WHEN status IN ('Present', 'Medical Leave', 'Duty Leave') THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) ELSE 0 END 
    FROM attendance
")->fetchColumn();

$defaultersCount = $pdo->query("
    SELECT COUNT(*) FROM (
        SELECT student_id, SUM(CASE WHEN status IN ('Present', 'Medical Leave', 'Duty Leave') THEN 1 ELSE 0 END) / COUNT(*) * 100 AS pct 
        FROM attendance GROUP BY student_id
    ) s_pcts WHERE pct < 75
")->fetchColumn();

$today = date('Y-m-d');
$todayStmt = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE date = :today");
$todayStmt->execute(['today' => $today]);
$todayAttendanceCount = $todayStmt->fetchColumn();

echo json_encode([
    'success' => true,
    'data' => [
        'totalStudents' => (int)$studentsCount,
        'totalFaculty' => (int)$facultyCount,
        'totalClasses' => (int)$classesCount,
        'overallAttendance' => $overallAtt . '%',
        'defaulters' => (int)$defaultersCount,
        'pendingReports' => 0,
        'todayAttendance' => (int)$todayAttendanceCount
    ]
], JSON_PRETTY_PRINT);
