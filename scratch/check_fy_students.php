<?php
require_once __DIR__ . '/../api/db.php';
foreach (['A', 'B', 'C'] as $div) {
    $stmt = $pdo->prepare("SELECT * FROM students WHERE year = 'FY' AND division = :div ORDER BY CAST(roll_no AS UNSIGNED) ASC, roll_no ASC");
    $stmt->execute(['div' => $div]);
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "--- FY $div (" . count($res) . " students) ---\n";
    foreach ($res as $r) {
        echo "Roll: {$r['roll_no']} | PRN: {$r['prn']} | Name: {$r['student_name']} | Pct: {$r['attendance_percentage']}%\n";
    }
}
