<?php
require_once __DIR__ . '/../api/db.php';
try {
    $pdo->exec("UPDATE gfm_details SET division_assigned = 'A' WHERE division_assigned = 'Div A'");
    $pdo->exec("UPDATE gfm_details SET division_assigned = 'B' WHERE division_assigned = 'Div B'");
    $pdo->exec("UPDATE gfm_details SET division_assigned = 'C' WHERE division_assigned = 'Div C'");
    echo "Updated gfm_details.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
