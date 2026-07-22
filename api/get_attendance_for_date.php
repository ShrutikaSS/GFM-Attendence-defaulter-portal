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

$user = $_SESSION['user'] ?? null;
if (!$user || $user['role'] !== 'gfm') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

$defaultDivision = normalizeDivision($user['division_assigned'] ?? 'FY A');
$division = normalizeDivision($_GET['division'] ?? $defaultDivision);
$date = trim($_GET['date'] ?? '');
$subject = trim($_GET['subject'] ?? '');
$month = trim($_GET['month'] ?? '');

if (empty($date) && empty($month)) {
    $date = date('Y-m-d');
}

if (!isset($pdo) || $pdo === null) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

try {
    if (!empty($month)) {
        $monthStart = $month . '-01';
        $monthEnd = date('Y-m-t', strtotime($monthStart));
    } elseif (!empty($date)) {
        $monthStart = date('Y-m-01', strtotime($date));
        $monthEnd = date('Y-m-t', strtotime($date));
    } else {
        $monthStart = date('Y-m-01');
        $monthEnd = date('Y-m-t');
    }

    $studentsStmt = $pdo->prepare("
        SELECT u.id, sd.roll_no AS roll, u.full_name AS name, sd.division AS student_division, u.email, sd.phone
        FROM users u
        JOIN student_details sd ON u.id = sd.user_id
        ORDER BY CAST(sd.roll_no AS UNSIGNED) ASC, sd.roll_no ASC
    ");
    $studentsStmt->execute();
    $studentsListRaw = $studentsStmt->fetchAll();
    $studentsList = array_filter($studentsListRaw, function($student) use ($division) {
        return normalizeDivision($student['student_division'] ?? '') === $division;
    });

    $attendanceStmt = $pdo->prepare("
        SELECT student_id, status
        FROM attendance
        WHERE date = :date AND subject = :subject
    ");
    $attendanceStmt->execute([
        'date' => $date ?: $monthStart,
        'subject' => $subject
    ]);

    $attendanceMap = [];
    while ($row = $attendanceStmt->fetch()) {
        $attendanceMap[(int)$row['student_id']] = $row['status'];
    }

    $students = [];
    foreach ($studentsList as $student) {
        $studentId = (int)$student['id'];
        $status = $attendanceMap[$studentId] ?? null;
        $students[] = [
            'id' => $studentId,
            'roll' => $student['roll'],
            'name' => $student['name'],
            'div' => normalizeDivision($student['student_division'] ?? ''),
            'email' => $student['email'],
            'phone' => $student['phone'],
            'status' => $status ?: 'Present'
        ];
    }

    $calendarStmt = $pdo->prepare("
        SELECT DISTINCT a.date
        FROM attendance a
        JOIN student_details sd ON a.student_id = sd.user_id
        WHERE a.subject = :subject
          AND a.date BETWEEN :month_start AND :month_end
          AND sd.division = :division
        ORDER BY a.date ASC
    ");
    $calendarStmt->execute([
        'subject' => $subject,
        'month_start' => $monthStart,
        'month_end' => $monthEnd,
        'division' => $division
    ]);
    $calendarDates = array_column($calendarStmt->fetchAll(), 'date');

    echo json_encode([
        'success' => true,
        'date' => $date ?: $monthStart,
        'subject' => $subject,
        'students' => $students,
        'calendarDates' => $calendarDates
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while loading attendance for the selected date: ' . $e->getMessage()
    ]);
}
?>
