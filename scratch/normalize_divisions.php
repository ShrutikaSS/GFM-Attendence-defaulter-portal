<?php
require_once __DIR__ . '/../api/db.php';
try {
    $affected = $pdo->exec("UPDATE attendance SET division = 'A' WHERE division = 'Div A'");
    echo "Updated $affected rows from 'Div A' to 'A' in attendance table.\n";
    $affected = $pdo->exec("UPDATE attendance SET division = 'B' WHERE division = 'Div B'");
    echo "Updated $affected rows from 'Div B' to 'B' in attendance table.\n";
    $affected = $pdo->exec("UPDATE attendance SET division = 'C' WHERE division = 'Div C'");
    echo "Updated $affected rows from 'Div C' to 'C' in attendance table.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
