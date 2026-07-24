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

$fullName = trim($input['full_name'] ?? '');
$email = trim($input['email'] ?? '');
$department = trim($input['department'] ?? '');

if (empty($fullName) || empty($email) || empty($department)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

try {
    // Check if email is already used by someone else
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email AND id != :id");
    $stmt->execute(['email' => $email, 'id' => $user['id']]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Email address is already in use by another account.']);
        exit;
    }

    $updateStmt = $pdo->prepare("UPDATE users SET full_name = :fname, email = :email, department = :dept WHERE id = :id");
    $updateStmt->execute([
        'fname' => $fullName,
        'email' => $email,
        'dept' => $department,
        'id' => $user['id']
    ]);
    
    // Update session data
    $_SESSION['user']['full_name'] = $fullName;
    $_SESSION['user']['email'] = $email;
    $_SESSION['user']['department'] = $department;

    echo json_encode(['success' => true, 'message' => 'Profile updated successfully.']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error updating profile.']);
}
?>
