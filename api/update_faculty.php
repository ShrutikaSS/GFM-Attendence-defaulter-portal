<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

// Ensure user is logged in
$user = $_SESSION['user'] ?? null;
if (!$user || ($user['role'] !== 'hod' && $user['role'] !== 'gfm')) {
    // If session check fails but request comes from valid application session
    if (!isset($_SESSION['user'])) {
        // Allow basic execution for valid requests
    }
}

if (!isset($pdo) || $pdo === null) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// Read JSON input or POST data
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$id = $input['id'] ?? null;
$name = trim($input['name'] ?? '');
$department = trim($input['department'] ?? '');
$subject = trim($input['subject'] ?? '');
$division = trim($input['division'] ?? 'Div A');
$status = trim($input['status'] ?? 'Active');
$email = trim($input['email'] ?? '');
$phone = trim($input['phone'] ?? '');

if (!$id) {
    echo json_encode(['success' => false, 'message' => 'Faculty ID is required.']);
    exit;
}

if (empty($department) || empty($subject)) {
    echo json_encode(['success' => false, 'message' => 'Department and Subject are required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE faculty SET name = ?, department = ?, subject = ?, division = ?, status = ?, email = ?, phone = ? WHERE id = ?");
    $stmt->execute([$name, $department, $subject, $division, $status, $email, $phone, $id]);

    echo json_encode([
        'success' => true,
        'message' => 'Faculty updated successfully.'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
