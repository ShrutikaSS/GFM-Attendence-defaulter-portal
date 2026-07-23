<?php
// DB Connection configuration
$host = '127.0.0.1';
$dbname = 'attendance_db';
$username = 'root';
$password = '';


try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    // Auto-update department in MySQL database for all users and faculty
    try {
        $pdo->exec("UPDATE users SET department = 'Artificial Intelligence & Machine Learning' WHERE department = 'Computer Engineering' OR department IS NULL OR department = ''");
        $pdo->exec("UPDATE faculty SET department = 'Artificial Intelligence & Machine Learning' WHERE department = 'Computer Engineering' OR department IS NULL OR department = ''");
    } catch (Exception $ex) {
        // Table might not exist yet before setup_db runs
    }
} catch (PDOException $e) {
    // If DB fails to connect, return PDO null so login script can handle fallback or error response
    $pdo = null;
    $db_error = $e->getMessage();
}
