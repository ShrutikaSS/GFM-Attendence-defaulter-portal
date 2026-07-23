<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// Ensure user is logged in (GFM or HOD)
$user = $_SESSION['user'] ?? null;
if (!$user || !in_array($user['role'], ['gfm', 'hod'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

if (!isset($pdo) || $pdo === null) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// Parse request payload
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);
if (!is_array($input)) {
    $input = [];
}

$csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($input['csrf_token'] ?? $_POST['csrf_token'] ?? '');
if (
    empty($_SESSION['csrf_token']) ||
    empty($csrfToken) ||
    !hash_equals($_SESSION['csrf_token'], $csrfToken)
) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Security validation failed. Please refresh and try again.']);
    exit;
}

$title = trim($input['title'] ?? $_POST['title'] ?? '');
$target = trim($input['target'] ?? $_POST['target'] ?? 'All Batches');
$message = trim($input['message'] ?? $_POST['message'] ?? '');
$created_by = $user['id'];

$title = preg_replace('/[\x00-\x1F\x7F]/u', '', $title);
$target = preg_replace('/[\x00-\x1F\x7F]/u', '', $target);
$message = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $message);

if (empty($title) || empty($message)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Title and message are required.'
    ]);
    exit;
}

$titleLength = function_exists('mb_strlen') ? mb_strlen($title) : strlen($title);
$targetLength = function_exists('mb_strlen') ? mb_strlen($target) : strlen($target);
$messageLength = function_exists('mb_strlen') ? mb_strlen($message) : strlen($message);

if ($titleLength > 200 || $targetLength > 100 || $messageLength > 3000) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Notice content is too long.'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO notices (title, target, message, created_by) 
        VALUES (:title, :target, :message, :created_by)
    ");
    $stmt->execute([
        'title' => $title,
        'target' => $target,
        'message' => $message,
        'created_by' => $created_by
    ]);
    
    // Also broadcast to notifications
    $targetRole = 'all';
    $targetDivision = null;
    $notifType = 'regular';
    if ($target !== 'All Batches' && $target !== 'ALL' && $target !== 'All Classes') {
        $targetRole = 'student';
        // Assume target might be a division name like "Div A"
        $targetDivision = $target;
    }

    try {
        $notifStmt = $pdo->prepare("
            INSERT INTO notifications (target_role, target_division, type, title, message, created_by)
            VALUES (:target_role, :target_division, :type, :title, :message, :created_by)
        ");
        $notifStmt->execute([
            'target_role' => $targetRole,
            'target_division' => $targetDivision,
            'type' => $notifType,
            'title' => 'New Notice: ' . $title,
            'message' => $message,
            'created_by' => $created_by
        ]);
    } catch (Exception $e) {
        // Ignore if notification fails, notice was still created.
    }

    echo json_encode([
        'success' => true,
        'message' => 'Notice published successfully!'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while publishing the notice.'
    ]);
}
?>
