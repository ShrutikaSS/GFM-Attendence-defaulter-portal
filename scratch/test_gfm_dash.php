<?php
session_start();
require_once __DIR__ . '/../api/db.php';
$_SESSION['user'] = [
    'id' => 1,
    'role' => 'gfm',
    'division_assigned' => 'A'
];
ob_start();
include __DIR__ . '/../api/get_gfm_dashboard.php';
$output = ob_get_clean();
echo "Output: \n" . $output . "\n";
?>
