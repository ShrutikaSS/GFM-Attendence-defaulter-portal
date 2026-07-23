<?php
require_once __DIR__ . '/../api/db.php';
try {
    $stmt = $pdo->query("UPDATE student_details SET semester = 'Semester II'");
    echo "Successfully updated " . $stmt->rowCount() . " rows to Semester II.\n";
    
    // Also update any other places where semester might be saved, like attendance table
    $stmt2 = $pdo->query("UPDATE attendance SET semester = 'Semester II' WHERE year = 'FY'");
    echo "Updated attendance records as well.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
