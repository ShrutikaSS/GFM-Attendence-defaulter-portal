<?php
// Set execution time limit to high because we are inserting 1350 records
set_time_limit(300);
require_once __DIR__ . '/db.php';

if (!$pdo) {
    die("Database connection failed. Make sure MySQL is running.\n");
}

echo "Starting attendance seeding...\n";

// Clear existing attendance records to prevent duplication
$pdo->exec("DELETE FROM attendance");

// Student target attendance rates
$students = [
    6  => ['name' => 'Om potarkar',     'rate' => 0.92], // Div A
    7  => ['name' => 'Akib Momin',      'rate' => 0.85], // Div A
    8  => ['name' => 'Sachin tompe',    'rate' => 0.58], // Div A
    9  => ['name' => 'Ram Mutthe',      'rate' => 0.94], // Div B
    10 => ['name' => 'Yash lahase',     'rate' => 0.68], // Div B
    11 => ['name' => 'Sumit Kulkarni',   'rate' => 0.79], // Div B
    12 => ['name' => 'Mahesh Jadhav',   'rate' => 0.88], // Div C
    13 => ['name' => 'Pushkar Mali',    'rate' => 0.55], // Div C
    14 => ['name' => 'rushi mane',      'rate' => 0.72], // Div C
];

$subjects = [
    'Web Development',
    'Data Structures',
    'Database Systems',
    'Computer Networks',
    'Software Engineering'
];

$remarks_present = ['Regular', 'Punctual & Interactive', 'Active participation', 'Good attention'];
$remarks_absent = ['Absent', 'No notice submitted', 'Medical Leave Approved', 'On Duty (NSS)', 'Leave Approved'];

// Date range: last 45 calendar days, skipping weekends, to get 30 sessions per subject
$dates = [];
$currentDate = new DateTime('2026-07-21'); // Base date matching system timeline
$daysBack = 50;

while (count($dates) < 30 && $daysBack > 0) {
    $currentDate->modify('-1 day');
    $dayOfWeek = $currentDate->format('N'); // 1 (Mon) to 7 (Sun)
    if ($dayOfWeek < 6) { // Weekday
        $dates[] = $currentDate->format('Y-m-d');
    }
    $daysBack--;
}
// Sort dates ascending so history renders chronologically
$dates = array_reverse($dates);

// Begin transaction for speed
$pdo->beginTransaction();

try {
    $stmt = $pdo->prepare("INSERT INTO attendance (student_id, subject, date, lecture_number, status, remarks) VALUES (?, ?, ?, ?, ?, ?)");

    foreach ($students as $id => $info) {
        foreach ($subjects as $subject) {
            foreach ($dates as $date) {
                // Determine status based on student's target rate
                $rand = mt_rand(0, 100) / 100;
                $status = ($rand <= $info['rate']) ? 'Present' : 'Absent';
                
                // Pick a remark
                if ($status === 'Present') {
                    $remarks = $remarks_present[array_rand($remarks_present)];
                } else {
                    $remarks = $remarks_absent[array_rand($remarks_absent)];
                }
                
                // Fixed lecture number
                
                $stmt->execute([$id, $subject, $date, 1, $status, $remarks]);
            }
        }
    }
    
    $pdo->commit();
    echo "Successfully seeded " . (count($students) * count($subjects) * count($dates)) . " attendance records.\n";
} catch (Exception $e) {
    $pdo->rollBack();
    echo "Error seeding attendance: " . $e->getMessage() . "\n";
}
?>
