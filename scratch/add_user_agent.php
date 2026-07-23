<?php
require_once __DIR__ . '/../api/db.php';
try {
    $pdo->exec('ALTER TABLE attendance_logs ADD COLUMN user_agent VARCHAR(255) DEFAULT NULL');
    echo "Added to attendance_logs\n";
} catch (Exception $e) {
    echo "Logs error: " . $e->getMessage() . "\n";
}
try {
    $pdo->exec('ALTER TABLE attendance_history ADD COLUMN user_agent VARCHAR(255) DEFAULT NULL');
    echo "Added to attendance_history\n";
} catch (Exception $e) {
    echo "History error: " . $e->getMessage() . "\n";
}
?>
