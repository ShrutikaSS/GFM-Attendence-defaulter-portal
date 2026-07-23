<?php
session_start();
require_once __DIR__ . '/../api/db.php';
$_SESSION['user'] = [
    'id' => 6,
    'role' => 'student',
    'full_name' => 'Om potarkar'
];
ob_start();
include __DIR__ . '/../api/get_student_dashboard.php';
$output = ob_get_clean();
echo "Output: \n" . $output . "\n";
?>
