<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

$prn = trim($input['prn'] ?? $input['zprn'] ?? $input['email'] ?? $_POST['prn'] ?? $_POST['zprn'] ?? $_POST['email'] ?? '');
$newPassword = trim($input['new_password'] ?? $input['password'] ?? $_POST['new_password'] ?? $_POST['password'] ?? '');

if (empty($prn)) {
    echo json_encode([
        'success' => false,
        'message' => 'Please enter your registered ZPRN / PRN number.'
    ]);
    exit;
}

if (empty($newPassword)) {
    echo json_encode([
        'success' => false,
        'message' => 'Please enter your new password.'
    ]);
    exit;
}

$userFound = false;

if (isset($pdo) && $pdo !== null) {
    try {
        // Find user by PRN in student_details or roll_or_emp_id / email in users
        $stmt = $pdo->prepare("
            SELECT u.id, u.full_name, u.email 
            FROM users u 
            LEFT JOIN student_details sd ON u.id = sd.user_id 
            WHERE UPPER(sd.prn) = UPPER(:prn) 
               OR UPPER(u.roll_or_emp_id) = UPPER(:prn)
               OR LOWER(u.email) = LOWER(:prn)
            LIMIT 1
        ");
        $stmt->execute(['prn' => $prn]);
        $user = $stmt->fetch();

        if ($user) {
            $userFound = true;
            $hashed = password_hash($newPassword, PASSWORD_BCRYPT);
            $updateStmt = $pdo->prepare("UPDATE users SET password = :password WHERE id = :id");
            $updateStmt->execute(['password' => $hashed, 'id' => $user['id']]);
        }
    } catch (Exception $e) {}
} else {
    // Demo mode fallback
    $userFound = true;
}

if ($userFound) {
    echo json_encode([
        'success' => true,
        'message' => 'Password reset successful! You can now log in with your new password.'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'No account found matching ZPRN: ' . htmlspecialchars($prn) . '. Please check your ZPRN number.'
    ]);
}
?>
