<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=attendance_db;charset=utf8mb4','root','', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$stmt = $pdo->query('SELECT division, COUNT(*) AS cnt FROM student_details GROUP BY division');
foreach ($stmt as $row) {
    echo $row['division'] . ': ' . $row['cnt'] . "\n";
}
$students = $pdo->query('SELECT id, roll_no, division FROM student_details WHERE division = "FY B"')->fetchAll(PDO::FETCH_ASSOC);
echo "--- FY B students ---\n";
foreach ($students as $s) {
    echo $s['id'] . ' ' . $s['roll_no'] . ' ' . $s['division'] . "\n";
}
