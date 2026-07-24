<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$user = $_SESSION['user'] ?? null;
if (!$user) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$currentPassword = $input['current_password'] ?? '';
$newPassword = $input['new_password'] ?? '';

if (empty($currentPassword) || empty($newPassword)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = :id");
    $stmt->execute(['id' => $user['id']]);
    $dbPass = $stmt->fetchColumn();

    if (!password_verify($currentPassword, $dbPass) && $currentPassword !== $dbPass) { // Fallback for unhashed seeds
        echo json_encode(['success' => false, 'message' => 'Current password is incorrect.']);
        exit;
    }

    $hashedPass = password_hash($newPassword, PASSWORD_BCRYPT);
    $updateStmt = $pdo->prepare("UPDATE users SET password = :pass WHERE id = :id");
    $updateStmt->execute(['pass' => $hashedPass, 'id' => $user['id']]);

    echo json_encode(['success' => true, 'message' => 'Password updated successfully.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error updating password.']);
}
?>
