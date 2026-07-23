<?php
session_start();
$_SESSION['user'] = ['id' => 3, 'role' => 'gfm', 'full_name' => 'Omkar Wadekar'];

$ch = curl_init('http://localhost/GFM-Attendence-defaulter-portal/api/attendance_entry.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['class' => 'FY A', 'subject' => 'Web Development', 'date' => '2026-07-23']));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Cookie: ' . session_name() . '=' . session_id()]);

$response = curl_exec($ch);
curl_close($ch);

echo "API Response for FY A:\n";
echo $response;
