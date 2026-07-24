<?php
require_once __DIR__ . '/db.php';

if (!$pdo) {
    die("DB connection failed\n");
}

echo "Recalculating attendance summaries...\n";

$pdo->beginTransaction();

try {
    // Clear existing summaries
    $pdo->exec("DELETE FROM attendance_summary");

    // Get all distinct students
    $stmt = $pdo->query("SELECT DISTINCT student_id FROM attendance");
    $students = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $upsert = $pdo->prepare("
        INSERT INTO attendance_summary 
        (student_id, subject, semester, division, total_lectures, present_count, absent_count, medical_leave_count, duty_leave_count, attendance_percentage, status)
        SELECT 
            student_id,
            subject,
            COALESCE(semester, 'Semester VI'),
            COALESCE(division, 'Div A'),
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
            SUM(CASE WHEN status = 'Medical Leave' THEN 1 ELSE 0 END) as medical,
            SUM(CASE WHEN status = 'Duty Leave' THEN 1 ELSE 0 END) as duty,
            CASE 
                WHEN COUNT(*) > 0 THEN ROUND(SUM(CASE WHEN status IN ('Present', 'Medical Leave', 'Duty Leave') THEN 1 ELSE 0 END) / COUNT(*) * 100, 2)
                ELSE 0
            END as pct,
            CASE 
                WHEN COUNT(*) > 0 AND ROUND(SUM(CASE WHEN status IN ('Present', 'Medical Leave', 'Duty Leave') THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) >= 75 THEN 'Regular'
                WHEN COUNT(*) > 0 AND ROUND(SUM(CASE WHEN status IN ('Present', 'Medical Leave', 'Duty Leave') THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) >= 60 THEN 'Warning'
                ELSE 'Defaulter'
            END as status
        FROM attendance
        GROUP BY student_id, subject, semester, division
    ");

    $upsert->execute();
    echo "Summaries updated for " . count($students) . " students.\n";

    $pdo->commit();
    echo "Done!\n";
} catch (Exception $e) {
    $pdo->rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}
?>
