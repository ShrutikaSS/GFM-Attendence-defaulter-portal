<?php
require_once __DIR__ . '/../api/db.php';
echo "student_details divisions:\n";
print_r($pdo->query("SELECT DISTINCT division FROM student_details")->fetchAll(PDO::FETCH_COLUMN));

echo "\ngfm_details divisions:\n";
print_r($pdo->query("SELECT DISTINCT division_assigned FROM gfm_details")->fetchAll(PDO::FETCH_COLUMN));

echo "\nattendance divisions:\n";
print_r($pdo->query("SELECT DISTINCT division FROM attendance")->fetchAll(PDO::FETCH_COLUMN));
