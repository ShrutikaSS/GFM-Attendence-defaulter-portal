<?php
session_start();
$_SESSION['user'] = ['id' => 1, 'role' => 'gfm'];

// Mock input
$_POST = [];
$rawInput = json_encode(['student_ids' => [6, 7]]); // Student IDs for testing
file_put_contents('php://memory', $rawInput); // This doesn't work well to mock php://input

// Instead, I'll test it via the db directly
require_once __DIR__ . '/../api/db.php';
$stmt = $pdo->prepare("INSERT INTO notifications (user_id, target_role, title, message, type, is_read, created_at) VALUES (?, 'student', ?, ?, 'danger', 0, NOW())");
$stmt->execute([6, 'Test', 'Test msg']);
print_r($pdo->query("SELECT * FROM notifications WHERE user_id = 6 ORDER BY created_at DESC LIMIT 1")->fetchAll(PDO::FETCH_ASSOC));
?>
