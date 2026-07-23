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

$targetRole = trim($input['target_role'] ?? $user['role']);
$user_id = (int)($input['user_id'] ?? 0);
$unreadOnly = filter_var($input['unread_only'] ?? false, FILTER_VALIDATE_BOOLEAN);
$limit = (int)($input['limit'] ?? 50);

try {
    $query = "
        SELECT id, title, message, type, is_read, created_at
        FROM notifications
        WHERE 1=1
    ";
    $params = [];

    if ($user_id > 0) {
        $query .= " AND user_id = :user_id";
        $params['user_id'] = $user_id;
    } else {
        if ($targetRole === 'all') {
            $query .= " AND target_role = 'all'";
        } else {
            $query .= " AND (target_role = :role OR target_role = 'all')";
            $params['role'] = $targetRole;
        }
    }

    if ($unreadOnly) {
        $query .= " AND is_read = 0";
    }

    $query .= " ORDER BY created_at DESC LIMIT :limit";

    $stmt = $pdo->prepare($query);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $notifications = $stmt->fetchAll();

    // Mark as read if user_id specified
    if ($user_id > 0) {
        $markStmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = :uid AND is_read = 0");
        $markStmt->execute(['uid' => $user_id]);
    }

    echo json_encode([
        'success' => true,
        'data' => $notifications,
        'unread_count' => count(array_filter($notifications, fn($n) => !$n['is_read']))
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error loading notifications: ' . $e->getMessage()]);
}
?>
