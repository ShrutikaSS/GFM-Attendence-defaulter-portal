<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// Ensure user is logged in as GFM
$user = $_SESSION['user'] ?? null;
if (!$user || $user['role'] !== 'gfm') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

$gfm_id = $user['id'];
$division = $user['division_assigned'] ?? 'A';
$division_short = str_replace('Div ', '', $division);
$division_full = 'Div ' . $division_short;

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
            SELECT student_id, COUNT(*) AS conducted, SUM(CASE WHEN status IN ('Present', 'Medical Leave', 'Duty Leave') THEN 1 ELSE 0 END) AS attended 
            FROM attendance 
            GROUP BY student_id
        ) att ON u.id = att.student_id
        WHERE sd.division IN (:div_short, :div_full)
        ORDER BY sd.division ASC, CAST(sd.roll_no AS UNSIGNED) ASC, sd.roll_no ASC
    ");
    $studentsStmt->execute([
        'div_short' => $division_short,
        'div_full' => $division_full
    ]);
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

        if ($student['conducted'] > 0) {
            if ($pct < 60) {
                $criticalCount++;
            } elseif ($pct < 75) {
                $warningCount++;
            }
        }
    }

    $overallAvg = $totalConductedSum > 0 ? round(($totalAttendedSum / $totalConductedSum) * 100, 1) : 0;
    $defaultersCount = $warningCount + $criticalCount;

    // 2. Fetch notices targetting this division or 'ALL'
    $noticesStmt = $pdo->prepare("
        SELECT id, title, target, message, DATE_FORMAT(created_at, '%b %d, %Y') AS date 
        FROM notices 
        WHERE target IN (:div_short, :div_full) OR target = 'ALL' OR target = 'All Batches' OR created_by = :gfm_id 
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $noticesStmt->execute([
        'div_short' => $division_short,
        'div_full' => $division_full,
        'gfm_id' => $gfm_id
    ]);
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
