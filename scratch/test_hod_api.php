<?php
// Simulate HOD session
session_start();
$_SESSION['user'] = ['id' => 1, 'role' => 'hod', 'full_name' => 'Dr. Dipali Shende'];
require_once __DIR__ . '/../api/get_hod_dashboard.php';
