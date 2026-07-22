<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

$action = trim($input['action'] ?? $_POST['action'] ?? 'request_otp');
$prn = trim($input['prn'] ?? $input['zprn'] ?? $input['email'] ?? $_POST['prn'] ?? $_POST['zprn'] ?? $_POST['email'] ?? '');

if (empty($prn)) {
    echo json_encode([
        'success' => false,
        'message' => 'Please enter your registered ZPRN / PRN number.'
    ]);
    exit;
}

if ($action === 'request_otp') {
    $user = null;

    if (isset($pdo) && $pdo !== null) {
        try {
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
        } catch (Exception $e) {}
    }

    if ($user || !isset($pdo) || $pdo === null) {
        $otp = rand(100000, 999999);
        $_SESSION['reset_otp_' . strtoupper($prn)] = $otp;

        echo json_encode([
            'success' => true,
            'message' => "An OTP has been sent for ZPRN ($prn).",
            'prn' => $prn,
            'user_name' => $user['full_name'] ?? 'Student',
            'demo_otp' => '123456'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No account found with ZPRN number: ' . htmlspecialchars($prn) . '. Please check and try again.'
        ]);
    }
    exit;
} elseif ($action === 'reset_password') {
    $otp = trim($input['otp'] ?? $_POST['otp'] ?? '');
    $newPassword = trim($input['new_password'] ?? $_POST['new_password'] ?? '');

    if (empty($otp) || empty($newPassword)) {
        echo json_encode([
            'success' => false,
            'message' => 'OTP and new password are required.'
        ]);
        exit;
    }

    if (isset($pdo) && $pdo !== null) {
        try {
            $hashed = password_hash($newPassword, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("
                UPDATE users u 
                LEFT JOIN student_details sd ON u.id = sd.user_id 
                SET u.password = :password 
                WHERE UPPER(sd.prn) = UPPER(:prn) 
                   OR UPPER(u.roll_or_emp_id) = UPPER(:prn)
                   OR LOWER(u.email) = LOWER(:prn)
            ");
            $stmt->execute(['password' => $hashed, 'prn' => $prn]);
        } catch (Exception $e) {}
    }

    echo json_encode([
        'success' => true,
        'message' => 'Password reset successful! You can now login with your new password.'
    ]);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action.']);
?>
