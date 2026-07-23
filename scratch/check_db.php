<?php
require_once __DIR__ . '/../api/db.php';
try {
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables: " . implode(', ', $tables) . "\n";
    
    // Check if students view/table exists
    $students = $pdo->query("SELECT * FROM students LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    echo "Students sample:\n";
    print_r($students);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
