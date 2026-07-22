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
    $stmt = $pdo->query("
        SELECT 
            sd.roll_no AS roll,
            sd.prn,
            u.full_name AS name,
            sd.division,
            COALESCE(att.conducted, 0) AS sessions,
            COALESCE(att.attended, 0) AS attended,
            CASE 
                WHEN COALESCE(att.conducted, 0) > 0 THEN ROUND(COALESCE(att.attended, 0) / COALESCE(att.conducted, 0) * 100, 0)
                ELSE 0
            END AS attendance_pct,
            latest.latest_date
        FROM users u 
        JOIN student_details sd ON u.id = sd.user_id 
        LEFT JOIN (
            SELECT student_id, COUNT(*) AS conducted, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS attended 
            FROM attendance 
            GROUP BY student_id
        ) att ON u.id = att.student_id
        LEFT JOIN (
            SELECT student_id, MAX(date) AS latest_date
            FROM attendance
            GROUP BY student_id
        ) latest ON u.id = latest.student_id
        WHERE u.role = 'student'
        ORDER BY sd.division ASC, CAST(sd.roll_no AS UNSIGNED) ASC
    ");
    
    $records = $stmt->fetchAll();
    foreach ($records as &$record) {
        $record['division'] = normalizeDivision($record['division'] ?? 'FY A');
    }

    echo json_encode([
        'success' => true,
        'data' => $records
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while loading attendance summaries: ' . $e->getMessage()
    ]);
}
?>
