<?php
require_once __DIR__ . '/../api/db.php';
$res = $pdo->query("SELECT division_assigned FROM gfm_details LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
print_r($res);
?>
