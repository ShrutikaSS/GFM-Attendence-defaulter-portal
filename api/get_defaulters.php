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
$input = json_decode($rawInput, true);

$division = trim($input['division'] ?? ($user['division_assigned'] ?? ''));
$semester = trim($input['semester'] ?? 'Semester VI');
$category = trim($input['category'] ?? 'ALL'); // WARNING, CRITICAL, ALL

if ($user['role'] === 'gfm' && empty($division)) {
    echo json_encode(['success' => false, 'message' => 'Division is required.']);
    exit;
}

try {
    $query = "
        SELECT 
            u.id AS user_id,
            sd.roll_no,
            sd.prn,
            u.full_name,
            sd.division,
            sd.phone,
            sd.guardian_contact,
            sd.academic_year,
            s.attendance_percentage,
            s.total_lectures,
            s.present_count,
            s.status AS defaulter_status
        FROM users u
        JOIN student_details sd ON u.id = sd.user_id
        JOIN attendance_summary s ON u.id = s.student_id
        WHERE s.semester = :semester
    ";

    $params = ['semester' => $semester];

    if ($user['role'] === 'gfm') {
        $query .= " AND sd.division = :division";
        $params['division'] = $division;
    }

    if ($category === 'WARNING') {
        $query .= " AND s.attendance_percentage >= 60 AND s.attendance_percentage < 75 AND s.status = 'Warning'";
    } elseif ($category === 'CRITICAL') {
        $query .= " AND s.attendance_percentage < 60 AND s.status = 'Defaulter'";
    } else {
        $query .= " AND s.status != 'Regular'";
    }

    $query .= " ORDER BY s.attendance_percentage ASC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $records = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => $records,
        'total' => count($records),
        'category' => $category
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error loading defaulters: ' . $e->getMessage()]);
}
?>
