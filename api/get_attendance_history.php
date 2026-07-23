<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$user = $_SESSION['user'] ?? null;
if (!$user || !in_array($user['role'], ['gfm', 'hod', 'student'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

if (!isset($pdo) || $pdo === null) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

$studentId = (int)($input['student_id'] ?? 0);
$division = trim($input['division'] ?? '');
if (strtoupper($division) === 'ALL') $division = '';

$subject = trim($input['subject'] ?? '');
if (strtoupper($subject) === 'ALL') $subject = '';

$semester = trim($input['semester'] ?? '');
if (strtoupper($semester) === 'ALL') $semester = '';

$startDate = trim($input['start_date'] ?? '');
$endDate = trim($input['end_date'] ?? '');

$statusFilter = trim($input['status'] ?? '');
if (strtoupper($statusFilter) === 'ALL') $statusFilter = '';

$limit = (int)($input['limit'] ?? 100);
$offset = (int)($input['offset'] ?? 0);

if ($user['role'] === 'student') {
    $studentId = $user['id'];
    $sdStmt = $pdo->prepare("SELECT division, semester FROM student_details WHERE user_id = :uid");
    $sdStmt->execute(['uid' => $studentId]);
    $sd = $sdStmt->fetch();
    if ($sd) {
        $division = $sd['division'];
        $semester = $sd['semester'];
    }
}

try {
    $query = "
        SELECT 
            a.id,
            a.student_id,
            u.full_name,
            sd.prn,
            sd.roll_no,
            a.subject,
            a.date,
            a.lecture_number,
            a.status,
            a.remarks,
            a.semester,
            a.division,
            a.created_at,
            a.updated_at,
            ah.old_status,
            ah.new_status,
            ah.editor_name,
            ah.editor_role,
            ah.reason,
            ah.timestamp AS edited_at
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        JOIN student_details sd ON a.student_id = sd.user_id
        LEFT JOIN attendance_history ah ON ah.attendance_id = a.id
    $whereSql = " WHERE 1=1";
    $params = [];

    if ($studentId > 0) {
        $whereSql .= " AND a.student_id = :student_id";
        $params['student_id'] = $studentId;
    }
    if (!empty($subject)) {
        $whereSql .= " AND a.subject = :subject";
        $params['subject'] = $subject;
    }
    if (!empty($division)) {
        $whereSql .= " AND a.division = :division";
        $params['division'] = $division;
    }
    if (!empty($semester)) {
        $whereSql .= " AND a.semester = :semester";
        $params['semester'] = $semester;
    }
    if (!empty($startDate)) {
        $whereSql .= " AND a.date >= :start_date";
        $params['start_date'] = $startDate;
    }
    if (!empty($endDate)) {
        $whereSql .= " AND a.date <= :end_date";
        $params['end_date'] = $endDate;
    }
    if (!empty($statusFilter)) {
        $whereSql .= " AND a.status = :status";
        $params['status'] = $statusFilter;
    }

    $query = "
        SELECT 
            a.id,
            a.student_id,
            u.full_name,
            sd.prn,
            sd.roll_no,
            a.subject,
            a.date,
            a.lecture_number,
            a.status,
            a.remarks,
            a.semester,
            a.division,
            a.created_at,
            a.updated_at,
            ah.old_status,
            ah.new_status,
            ah.editor_name,
            ah.editor_role,
            ah.reason,
            ah.timestamp AS edited_at
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        JOIN student_details sd ON a.student_id = sd.user_id
        LEFT JOIN attendance_history ah ON ah.attendance_id = a.id
        {$whereSql}
        ORDER BY a.date DESC, a.id DESC LIMIT :limit OFFSET :offset
    ";

    $stmt = $pdo->prepare($query);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $records = $stmt->fetchAll();

    $countQuery = "
        SELECT COUNT(*) FROM attendance a
        JOIN users u ON a.student_id = u.id
        JOIN student_details sd ON a.student_id = sd.user_id
        {$whereSql}
    ";
    $countStmt = $pdo->prepare($countQuery);
    foreach ($params as $key => $val) {
        $countStmt->bindValue($key, $val);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'data' => $records,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error loading history: ' . $e->getMessage()]);
}
?>
