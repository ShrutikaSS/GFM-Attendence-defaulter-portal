<?php
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['HTTP_USER_AGENT'] = 'TestAgent';

session_start();
$_SESSION['user'] = [
    'id' => 1,
    'full_name' => 'Test GFM',
    'role' => 'gfm'
];

$_POST = [];
$_GET = [];
$input = [
    'class' => 'FY A',
    'subject' => 'Web Development',
    'date' => '2026-07-23',
    'lecture_number' => 1
];

// simulate file_get_contents('php://input')
file_put_contents('php://memory', json_encode($input));

require_once __DIR__ . '/../api/db.php';

// Directly run logic from attendance_entry.php
$year = 'FY';
$division = 'A';
$subject = 'Web Development';
$date = '2026-07-23';
$lecture_number = 1;

try {
    $query = "
        SELECT 
            s.student_id,
            s.roll_no,
            s.prn,
            s.student_name,
            s.attendance_percentage,
            a.status AS existing_status,
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

    function logActionTest($pdo, $userId, $userName, $role, $details) {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        $stmt = $pdo->prepare("
            INSERT INTO attendance_logs (action, user_id, user_name, user_role, details, ip_address, user_agent)
            VALUES ('attendance_entry_load', :uid, :uname, :urole, :details, :ip, :ua)
        ");
        $stmt->execute(['uid' => $userId, 'uname' => $userName, 'urole' => $role, 'details' => $details, 'ip' => $ip, 'ua' => $ua]);
    }

    logActionTest($pdo, 1, 'Test GFM', 'gfm', "Loaded attendance entry");
    
    echo "Success! Loaded " . count($students) . " students.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
