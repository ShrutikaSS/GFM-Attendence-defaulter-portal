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

$action = trim($input['action'] ?? 'mark_read');
$notificationId = (int)($input['notification_id'] ?? 0);

try {
    if ($action === 'mark_read' && $notificationId > 0) {
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = :id");
        $stmt->execute(['id' => $notificationId]);
    } elseif ($action === 'mark_all_read') {
        $targetRole = $user['role'];
        $stmt = $pdo->prepare("
            UPDATE notifications 
            SET is_read = 1 
            WHERE target_role = :role OR target_role = 'all' OR user_id = :uid
        ");
        $stmt->execute(['role' => $targetRole, 'uid' => $user['id']]);
    }

    // Return updated counts
    $unreadStmt = $pdo->prepare("
        SELECT COUNT(*) FROM notifications 
        WHERE (target_role = :role OR target_role = 'all' OR user_id = :uid) AND is_read = 0
    ");
    $unreadStmt->execute(['role' => $user['role'], 'uid' => $user['id']]);
    $unreadCount = (int)$unreadStmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'unread_count' => $unreadCount
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
