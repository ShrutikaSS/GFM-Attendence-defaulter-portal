<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$user = $_SESSION['user'] ?? null;
if (!$user || $user['role'] !== 'gfm') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

if (!isset($pdo) || $pdo === null) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

$student_ids = $input['student_ids'] ?? [];

if (!is_array($student_ids) || empty($student_ids)) {
    echo json_encode(['success' => false, 'message' => 'No students provided.']);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("INSERT INTO notifications (user_id, target_role, title, message, type, is_read, created_by, created_at) VALUES (?, 'student', ?, ?, 'warning', 0, ?, NOW())");

    $title = "URGENT: Attendance Defaulter Warning";
    $message = "Your attendance has fallen below the mandatory 75% threshold. Please meet your GFM immediately and submit a valid medical certificate or leave application.";

    foreach ($student_ids as $id) {
        $stmt->execute([(int)$id, $title, $message, $user['id']]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Successfully sent warnings to ' . count($student_ids) . ' students.'
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Error sending warnings: ' . $e->getMessage()]);
}
?>
