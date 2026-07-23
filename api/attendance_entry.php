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
$input = json_decode($rawInput, true) ?? [];

$classInput = trim($input['class'] ?? $input['division'] ?? $_GET['class'] ?? $_GET['division'] ?? $_POST['class'] ?? $_POST['division'] ?? '');
$year = 'FY';
$division = '';

if ($classInput === 'FY A' || $classInput === 'A') {
    $division = 'A';
} elseif ($classInput === 'FY B' || $classInput === 'B') {
    $division = 'B';
} elseif ($classInput === 'FY C' || $classInput === 'C') {
    $division = 'C';
} else {
    // Attempt splitting string if format like "FY A"
    $parts = explode(' ', $classInput);
    if (count($parts) >= 2) {
        $year = strtoupper(trim($parts[0]));
        $division = strtoupper(trim($parts[1]));
    }
}

$subject = trim($input['subject'] ?? $_GET['subject'] ?? '');
$date = trim($input['date'] ?? $_GET['date'] ?? date('Y-m-d'));
$lecture_number = (int)($input['lecture_number'] ?? $_GET['lecture_number'] ?? 1);

if (empty($division)) {
    echo json_encode(['success' => false, 'message' => 'Please select a valid class (FY A, FY B, or FY C).']);
    exit;
}

try {
    $query = "
        SELECT 
            s.student_id,
            s.roll_no,
            s.prn,
            s.student_name,
            s.year,
            s.division,
            s.semester,
            s.email,
            s.department,
            s.phone,
            s.academic_year,
            s.gfm_name,
            s.avatar_url,
            s.attendance_percentage,
            a.status AS existing_status,
            a.remarks AS existing_remarks,
            a.id AS attendance_id
        FROM students s
        LEFT JOIN attendance a ON a.student_id = s.student_id 
            AND a.subject = :subject 
            AND a.date = :date 
            AND a.lecture_number = :lecture_number
        WHERE s.year = :year AND s.division = :division
        ORDER BY CAST(s.roll_no AS UNSIGNED) ASC, s.roll_no ASC
    ";

    $params = [
        'year' => $year,
        'division' => $division,
        'subject' => $subject,
        'date' => $date,
        'lecture_number' => $lecture_number
    ];

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $students = $stmt->fetchAll();

    logAction($pdo, $user['id'], $user['full_name'], $user['role'], 
        "Loaded attendance entry for $subject | $year $division | $date | Lecture $lecture_number");

    echo json_encode([
        'success' => true,
        'data' => [
            'students' => $students,
            'config' => [
                'year' => $year,
                'division' => $division,
                'subject' => $subject,
                'date' => $date,
                'lecture_number' => $lecture_number
            ]
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error loading students: ' . $e->getMessage()]);
}

function logAction($pdo, $userId, $userName, $role, $details) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    $stmt = $pdo->prepare("
        INSERT INTO attendance_logs (action, user_id, user_name, user_role, details, ip_address, user_agent)
        VALUES ('attendance_entry_load', :uid, :uname, :urole, :details, :ip, :ua)
    ");
    $stmt->execute(['uid' => $userId, 'uname' => $userName, 'urole' => $role, 'details' => $details, 'ip' => $ip, 'ua' => $ua]);
}
?>
