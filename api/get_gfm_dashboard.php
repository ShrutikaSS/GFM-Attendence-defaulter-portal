<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

function normalizeDivision($value) {
    $normalized = trim((string)($value ?? ''));
    if ($normalized === '') {
        return 'FY A';
    }
    $map = [
        'div a' => 'FY A',
        'div b' => 'FY B',
        'div c' => 'FY C',
        'fy a' => 'FY A',
        'fy b' => 'FY B',
        'fy c' => 'FY C',
        'se comp-a' => 'FY A',
        'se comp a' => 'FY A',
        'se comp-b' => 'FY B',
        'se comp b' => 'FY B',
        'se comp-c' => 'FY C',
        'se comp c' => 'FY C',
        'se computer - division a' => 'FY A',
        'se computer - division b' => 'FY B',
        'se computer - division c' => 'FY C'
    ];
    $lower = strtolower($normalized);
    return $map[$lower] ?? $normalized;
}

// Ensure user is logged in as GFM
$user = $_SESSION['user'] ?? null;
if (!$user || $user['role'] !== 'gfm') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

$gfm_id = $user['id'];
$division = normalizeDivision($user['division_assigned'] ?? 'FY A');

if (!isset($pdo) || $pdo === null) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

try {
    // 1. Fetch Students in Division with their Attendance Stats
    $studentsStmt = $pdo->prepare("
        SELECT 
            u.id, 
            sd.roll_no AS roll, 
            u.full_name AS name, 
            sd.division AS `div`, 
            u.email, 
            sd.phone,
            COALESCE(att.conducted, 0) AS conducted,
            COALESCE(att.attended, 0) AS attended
        FROM users u 
        JOIN student_details sd ON u.id = sd.user_id 
        LEFT JOIN (
            SELECT student_id, COUNT(*) AS conducted, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS attended 
            FROM attendance 
            GROUP BY student_id
        ) att ON u.id = att.student_id
        ORDER BY CAST(sd.roll_no AS UNSIGNED) ASC, sd.roll_no ASC
    ");
    $studentsStmt->execute();
    $studentsList = $studentsStmt->fetchAll();

    // Calculate aggregated metrics
    $totalStudents = count($studentsList);
    $warningCount = 0;
    $criticalCount = 0;
    $sumPercentages = 0;
    $totalConductedSum = 0;
    $totalAttendedSum = 0;

    foreach ($studentsList as &$student) {
        $student['conducted'] = (int)$student['conducted'];
        $student['attended'] = (int)$student['attended'];
        $pct = $student['conducted'] > 0 ? ($student['attended'] / $student['conducted']) * 100 : 0;
        
        $totalConductedSum += $student['conducted'];
        $totalAttendedSum += $student['attended'];

        if ($pct < 60) {
            $criticalCount++;
        } elseif ($pct < 75) {
            $warningCount++;
        }
    }

    $overallAvg = $totalConductedSum > 0 ? round(($totalAttendedSum / $totalConductedSum) * 100, 1) : 0;
    $defaultersCount = $warningCount + $criticalCount;

    // 2. Fetch notices targetting this division or 'ALL'
    $noticesStmt = $pdo->prepare("
        SELECT id, title, target, message, DATE_FORMAT(created_at, '%b %d, %Y') AS date 
        FROM notices 
        WHERE target = :division OR target = 'ALL' OR target = 'All Batches' OR created_by = :gfm_id 
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $noticesStmt->execute(['division' => $division, 'gfm_id' => $gfm_id]);
    $noticesList = $noticesStmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => [
            'division' => $division,
            'students' => $studentsList,
            'notices' => $noticesList,
            'metrics' => [
                'totalStudents' => $totalStudents,
                'defaultersCount' => $defaultersCount,
                'criticalCount' => $criticalCount,
                'warningCount' => $warningCount,
                'overallAvg' => $overallAvg,
                'totalConducted' => $totalStudents > 0 ? round($totalConductedSum / $totalStudents) : 0
            ]
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while loading GFM dashboard: ' . $e->getMessage()
    ]);
}
?>
