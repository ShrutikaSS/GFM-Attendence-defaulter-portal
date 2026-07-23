<?php
require_once __DIR__ . '/../api/db.php';
$result = $pdo->query("DESCRIBE notifications");
$cols = $result->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $col) {
    echo $col['Field'] . " (" . $col['Type'] . ")\n";
}
?>
