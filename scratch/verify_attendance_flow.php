<?php
// Test attendance entry load API and save attendance API for FY A, FY B, FY C
require_once __DIR__ . '/../api/db.php';

// Mock session user
$_SESSION['user'] = [
    'id' => 3,
    'full_name' => 'Omkar Wadekar',
    'email' => 'omkar@college.edu',
    'role' => 'gfm',
    'department' => 'Artificial Intelligence & Machine Learning'
];

echo "=== TESTING API ATTENDANCE LOAD ===\n";
foreach (['FY A', 'FY B', 'FY C'] as $className) {
    // Call PHP logic inline
    $classInput = $className;
    $parts = explode(' ', $classInput);
    $year = $parts[0];
    $division = $parts[1];
    
    $query = "
        SELECT 
            s.student_id,
            s.roll_no,
            s.prn,
            s.student_name,
            s.year,
            s.division,
            s.attendance_percentage
        FROM students s
        WHERE s.year = :year AND s.division = :division
        ORDER BY CAST(s.roll_no AS UNSIGNED) ASC, s.roll_no ASC
    ";
    $stmt = $pdo->prepare($query);
    $stmt->execute(['year' => $year, 'division' => $division]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Class $className: Loaded " . count($students) . " students.\n";
    foreach ($students as $st) {
        echo "  - Roll: {$st['roll_no']}, PRN: {$st['prn']}, Name: {$st['student_name']}, Pct: {$st['attendance_percentage']}%\n";
    }
}

echo "\n=== TESTING ATTENDANCE SAVE & REAL-TIME RECALCULATION ===\n";
// Save attendance for FY A (students 6, 7, 8)
$records = [
    ['student_id' => 6, 'status' => 'Present', 'remarks' => 'Regular'],
    ['student_id' => 7, 'status' => 'Present', 'remarks' => 'Regular'],
    ['student_id' => 8, 'status' => 'Absent', 'remarks' => 'Medical']
];

$date = date('Y-m-d');
$subject = 'Web Development';

foreach ($records as $rec) {
    $insertStmt = $pdo->prepare("
        INSERT INTO attendance (student_id, subject, date, lecture_number, status, remarks, semester, division, year, created_by)
        VALUES (:student_id, :subject, :date, 1, :status, :remarks, 'Semester I', 'A', 'FY', 3)
        ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks)
    ");
    $insertStmt->execute([
        'student_id' => $rec['student_id'],
        'subject' => $subject,
        'date' => $date,
        'status' => $rec['status'],
        'remarks' => $rec['remarks']
    ]);
}

// Recalculate summary
foreach ([6, 7, 8] as $sid) {
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present
        FROM attendance WHERE student_id = :student_id
    ");
    $stmt->execute(['student_id' => $sid]);
    $res = $stmt->fetch();
    $total = (int)$res['total'];
    $present = (int)$res['present'];
    $pct = $total > 0 ? round(($present / $total) * 100, 2) : 0;
    
    $up = $pdo->prepare("
        INSERT INTO attendance_summary (student_id, subject, semester, division, total_lectures, present_count, attendance_percentage, status)
        VALUES (:sid, :subj, 'Semester I', 'A', :tot, :pres, :pct, 'Regular')
        ON DUPLICATE KEY UPDATE total_lectures = :tot, present_count = :pres, attendance_percentage = :pct
    ");
    $up->execute(['sid' => $sid, 'subj' => $subject, 'tot' => $total, 'pres' => $present, 'pct' => $pct]);
}

echo "Recalculated FY A students after marking attendance for $subject on $date:\n";
$stmt = $pdo->prepare("SELECT student_id, roll_no, student_name, attendance_percentage FROM students WHERE year = 'FY' AND division = 'A' ORDER BY CAST(roll_no AS UNSIGNED) ASC");
$stmt->execute();
$updatedStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($updatedStudents as $st) {
    echo "  - Student ID: {$st['student_id']} | Roll: {$st['roll_no']} | Name: {$st['student_name']} | New Pct: {$st['attendance_percentage']}%\n";
}
