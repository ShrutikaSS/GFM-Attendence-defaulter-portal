<?php
require_once __DIR__ . '/../api/db.php';
$stmt = $pdo->query("DESCRIBE student_details");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
