<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$user = $_SESSION['user'] ?? null;
if (!$user || !in_array($user['role'], ['gfm', 'hod'])) {
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
$department = trim($input['department'] ?? 'Artificial Intelligence & Machine Learning');
$status = trim($input['status'] ?? '');
$search = trim($input['search'] ?? '');

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
            sd.academic_year,
            sd.gfm_name,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS attended,
            COUNT(a.id) AS total_lectures,
            CASE 
                WHEN COUNT(a.id) > 0 THEN ROUND(SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(a.id) * 100, 2)
                ELSE 0
            END AS attendance_percentage,
            COALESCE(s.status, 'Regular') AS defaulter_status
        FROM users u
        JOIN student_details sd ON u.id = sd.user_id
        LEFT JOIN attendance a ON u.id = a.student_id
            AND (:division IS NULL OR sd.division = :division)
            AND (:semester IS NULL OR a.semester = :semester)
        LEFT JOIN attendance_summary s ON u.id = s.student_id
            AND s.semester = :semester
    ";

    $params = [
        'division' => $division ?: null,
        'semester' => $semester
    ];

    $where = ["u.role = 'student'"];

    if ($division && strtoupper($division) !== 'ALL') {
        $where[] = "sd.division = :division";
    }
    if ($department) {
        $where[] = "u.department = :department";
        $params['department'] = $department;
    }
    if ($status && $status !== 'ALL') {
        $where[] = "COALESCE(s.status, 'Regular') = :status";
        $params['status'] = $status;
    }
    if ($search) {
        $where[] = "(u.full_name LIKE :search OR sd.prn LIKE :search OR sd.roll_no LIKE :search)";
        $params['search'] = "%$search%";
    }

    if (!empty($where)) {
        $query .= " WHERE " . implode(' AND ', $where);
    }

    $query .= " GROUP BY u.id, sd.roll_no, sd.prn, u.full_name, sd.division, s.status
                ORDER BY sd.division ASC, CAST(sd.roll_no AS UNSIGNED) ASC, sd.roll_no ASC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $records = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => $records,
        'total' => count($records)
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error loading class students: ' . $e->getMessage()]);
}
?>
