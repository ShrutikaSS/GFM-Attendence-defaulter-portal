<?php
// This script re-seeds the database with properly hashed passwords
// Run via: C:\xampp\php\php.exe setup_db.php

$host = '127.0.0.1';
$dbname = 'attendance_db';
$username = 'root';
$password_db = '';

try {
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $username, $password_db, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `attendance_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `attendance_db`");

    echo "Database selected.\n";

    // Drop tables
    $pdo->exec("DROP TABLE IF EXISTS `schedules`");
    $pdo->exec("DROP TABLE IF EXISTS `notices`");
    $pdo->exec("DROP TABLE IF EXISTS `attendance`");
    $pdo->exec("DROP TABLE IF EXISTS `faculty`");
    $pdo->exec("DROP TABLE IF EXISTS `gfm_details`");
    $pdo->exec("DROP TABLE IF EXISTS `student_details`");
    $pdo->exec("DROP TABLE IF EXISTS `users`");

    echo "Old tables dropped.\n";

    // Create users table
    $pdo->exec("CREATE TABLE `users` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `full_name` VARCHAR(100) NOT NULL,
        `email` VARCHAR(100) NOT NULL UNIQUE,
        `password` VARCHAR(255) NOT NULL,
        `role` ENUM('student','gfm','hod') NOT NULL,
        `department` VARCHAR(100) DEFAULT 'Artificial Intelligence & Machine Learning',
        `roll_or_emp_id` VARCHAR(50) DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE `student_details` (
        `user_id` INT PRIMARY KEY,
        `prn` VARCHAR(50) NOT NULL UNIQUE,
        `roll_no` VARCHAR(50) NOT NULL,
        `semester` VARCHAR(20) DEFAULT 'Semester VI',
        `division` VARCHAR(10) DEFAULT 'Div A',
        `phone` VARCHAR(20) DEFAULT NULL,
        `guardian_contact` VARCHAR(100) DEFAULT NULL,
        `academic_year` VARCHAR(20) DEFAULT '2025 - 2026',
        `gfm_name` VARCHAR(100) DEFAULT NULL,
        `avatar_url` VARCHAR(255) DEFAULT NULL,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE `gfm_details` (
        `user_id` INT PRIMARY KEY,
        `division_assigned` VARCHAR(10) NOT NULL,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE `faculty` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        `department` VARCHAR(100) NOT NULL,
        `subject` VARCHAR(100) NOT NULL,
        `division` VARCHAR(50) NOT NULL,
        `email` VARCHAR(100) DEFAULT NULL,
        `phone` VARCHAR(20) DEFAULT NULL,
        `status` ENUM('Active','On Leave') DEFAULT 'Active'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE `attendance` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `student_id` INT NOT NULL,
        `subject` VARCHAR(100) NOT NULL,
        `date` DATE NOT NULL,
        `time_slot` VARCHAR(50) DEFAULT NULL,
        `status` ENUM('Present','Absent') NOT NULL,
        `remarks` VARCHAR(255) DEFAULT 'Regular',
        FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE `notices` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `title` VARCHAR(200) NOT NULL,
        `target` VARCHAR(100) NOT NULL,
        `message` TEXT NOT NULL,
        `created_by` INT DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE `schedules` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `division` VARCHAR(10) NOT NULL,
        `title` VARCHAR(100) NOT NULL,
        `time` VARCHAR(100) NOT NULL,
        `room` VARCHAR(100) NOT NULL,
        `status` VARCHAR(50) DEFAULT 'Upcoming'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    echo "Tables created.\n";

    // Student PRN mapping for passwords
    $prnMap = [
        6 => '125UAM1001',
        7 => '125UAM1002',
        8 => '125UAM1003',
        9 => '125UAM1004',
        10 => '125UAM1005',
        11 => '125UAM1006',
        12 => '125UAM1007',
        13 => '125UAM1008',
        14 => '125UAM1009'
    ];

    // Helper to generate password hash
    function makeUserPassword($role, $fullName, $email, $userId, $prnMap) {
        if ($role === 'student' && isset($prnMap[$userId])) {
            return password_hash(strtoupper($prnMap[$userId]), PASSWORD_BCRYPT);
        }
        $cleanName = preg_replace('/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i', '', trim($fullName));
        $firstName = strtolower(trim(explode(' ', $cleanName)[0]));
        if (empty($firstName)) {
            $firstName = strtolower(trim(explode('@', $email)[0]));
        }
        return password_hash($firstName . '123', PASSWORD_BCRYPT);
    }

    echo "Passwords hashed (PRN for Students, <firstname>123 for Faculty).\n";

    // Seed Users
    $usersStmt = $pdo->prepare("INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role`, `department`, `roll_or_emp_id`) VALUES (?, ?, ?, ?, ?, ?, ?)");

    $usersData = [
        [1,  'Dr. Dipali Shende',    'hod@college.edu',        'hod',     'Artificial Intelligence & Machine Learning', 'HOD-001'],
        [3,  'Omkar Wadekar',        'omkar@college.edu',      'gfm',     'Artificial Intelligence & Machine Learning', 'GFM-A101'],
        [4,  'Pushkaraj Sonalkar',   'pushkaraj@college.edu',  'gfm',     'Artificial Intelligence & Machine Learning', 'GFM-B102'],
        [5,  'Shrutika Saudagar',    'shrutika@college.edu',   'gfm',     'Artificial Intelligence & Machine Learning', 'GFM-C103'],
        [6,  'Om potarkar',          'om@gmail.com',           'student', 'Artificial Intelligence & Machine Learning', '1'],
        [7,  'Akib Momin',           'akib@gmail.com',         'student', 'Artificial Intelligence & Machine Learning', '2'],
        [8,  'Sachin tompe',         'sachin@gmail.com',       'student', 'Artificial Intelligence & Machine Learning', '3'],
        [9,  'Ram Mutthe',           'ram@gmail.com',          'student', 'Artificial Intelligence & Machine Learning', '1'],
        [10, 'Yash lahase',          'yash@gmail.com',         'student', 'Artificial Intelligence & Machine Learning', '2'],
        [11, 'Sumit Kulkarni',       'sumit@gmail.com',        'student', 'Artificial Intelligence & Machine Learning', '3'],
        [12, 'Mahesh Jadhav',        'mahesh@gmail.com',       'student', 'Artificial Intelligence & Machine Learning', '1'],
        [13, 'Pushkar Mali',         'pushkar@gmail.com',      'student', 'Artificial Intelligence & Machine Learning', '2'],
        [14, 'rushi mane',           'rushi@gmail.com',        'student', 'Artificial Intelligence & Machine Learning', '3'],
    ];

    foreach ($usersData as $u) {
        $hashedPass = makeUserPassword($u[3], $u[1], $u[2], $u[0], $prnMap);
        $usersStmt->execute([$u[0], $u[1], $u[2], $hashedPass, $u[3], $u[4], $u[5]]);
    }
    echo "Users seeded.\n";

    // Seed GFM details
    $gfmStmt = $pdo->prepare("INSERT INTO `gfm_details` (`user_id`, `division_assigned`) VALUES (?, ?)");
    $gfmStmt->execute([3, 'Div A']);
    $gfmStmt->execute([4, 'Div B']);
    $gfmStmt->execute([5, 'Div C']);
    echo "GFM details seeded.\n";

    // Seed student details
    $sdStmt = $pdo->prepare("INSERT INTO `student_details` (`user_id`, `prn`, `roll_no`, `semester`, `division`, `phone`, `guardian_contact`, `academic_year`, `gfm_name`, `avatar_url`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $studentDetails = [
        [6,  '125UAM1001', '1', 'Semester VI', 'Div A', '+91 98765 43201', '+91 98220 11201 (Father)', '2025 - 2026', 'Omkar Wadekar',      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250'],
        [7,  '125UAM1002', '2', 'Semester VI', 'Div A', '+91 98765 43202', '+91 98220 11202 (Father)', '2025 - 2026', 'Omkar Wadekar',      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'],
        [8,  '125UAM1003', '3', 'Semester VI', 'Div A', '+91 98765 43203', '+91 98220 11203 (Father)', '2025 - 2026', 'Omkar Wadekar',      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=250'],
        [9,  '125UAM1004', '1', 'Semester VI', 'Div B', '+91 98765 43204', '+91 98220 11204 (Father)', '2025 - 2026', 'Pushkaraj Sonalkar', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=250'],
        [10, '125UAM1005', '2', 'Semester VI', 'Div B', '+91 98765 43205', '+91 98220 11205 (Father)', '2025 - 2026', 'Pushkaraj Sonalkar', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250'],
        [11, '125UAM1006', '3', 'Semester VI', 'Div B', '+91 98765 43206', '+91 98220 11206 (Father)', '2025 - 2026', 'Pushkaraj Sonalkar', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250'],
        [12, '125UAM1007', '1', 'Semester VI', 'Div C', '+91 98765 43207', '+91 98220 11207 (Father)', '2025 - 2026', 'Shrutika Saudagar',  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250'],
        [13, '125UAM1008', '2', 'Semester VI', 'Div C', '+91 98765 43208', '+91 98220 11208 (Father)', '2025 - 2026', 'Shrutika Saudagar',  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250'],
        [14, '125UAM1009', '3', 'Semester VI', 'Div C', '+91 98765 43209', '+91 98220 11209 (Father)', '2025 - 2026', 'Shrutika Saudagar',  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'],
    ];

    foreach ($studentDetails as $sd) {
        $sdStmt->execute($sd);
    }
    echo "Student details seeded.\n";

    // Seed Faculty
    $facStmt = $pdo->prepare("INSERT INTO `faculty` (`name`, `department`, `subject`, `division`, `email`, `phone`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $faculty = [
        ['Prof. D. Shah',        'Artificial Intelligence & Machine Learning', 'Database Systems',     'Div A', 'dipali.shah@college.edu',  '+91 98765 43210', 'Active'],
        ['Prof. N. Joshi',       'Artificial Intelligence & Machine Learning', 'Web Development',      'Div A', 'nidhi.joshi@college.edu',  '+91 91234 56789', 'On Leave'],
        ['Prof. R. Mehta',       'Artificial Intelligence & Machine Learning', 'Computer Networks',    'Div B', 'rohan.mehta@college.edu',  '+91 93322 11009', 'Active'],
        ['Prof. A. V. Kulkarni', 'Artificial Intelligence & Machine Learning', 'Data Structures',      'Div B', 'kulkarni@college.edu',     '+91 94433 22110', 'Active'],
        ['Prof. P. T. Joshi',    'Artificial Intelligence & Machine Learning', 'Software Engineering', 'Div C', 'joshi@college.edu',        '+91 98112 23344', 'Active'],
    ];
    foreach ($faculty as $f) {
        $facStmt->execute($f);
    }
    echo "Faculty seeded.\n";

    // Seed Notices
    $noticeStmt = $pdo->prepare("INSERT INTO `notices` (`title`, `target`, `message`, `created_by`, `created_at`) VALUES (?, ?, ?, ?, ?)");
    $notices = [
        ['Mid-Term Attendance Defaulter List Released', 'Div A', 'All students with attendance below 75% are required to submit leave applications with medical certificates by Friday.', 3, '2026-07-18 10:00:00'],
        ['Parent-Teacher Meeting Scheduled', 'Critical Defaulters', 'Parent-teacher meeting scheduled for all students falling under critical defaulter category (<60%).', 3, '2026-07-15 14:30:00'],
        ['Urgent Notice: Review Meeting for Division B', 'Div B', 'A feedback session for Division B is scheduled on Thursday to review attendance issues.', 4, '2026-07-20 09:15:00'],
    ];
    foreach ($notices as $n) {
        $noticeStmt->execute($n);
    }
    echo "Notices seeded.\n";

    // Seed Schedules
    $schedStmt = $pdo->prepare("INSERT INTO `schedules` (`division`, `title`, `time`, `room`, `status`) VALUES (?, ?, ?, ?, ?)");
    $schedules = [
        ['Div A', 'Web Development Lab',       '09:30 AM - 11:30 AM', 'Computer Lab 4',    'Completed'],
        ['Div A', 'Data Structures Lecture',   '11:45 AM - 12:45 PM', 'Auditorium Hall B', 'Ongoing'],
        ['Div A', 'Database Systems',          '01:30 PM - 02:30 PM', 'Classroom 302',     'Upcoming'],
        ['Div B', 'Computer Networks Lab',     '09:30 AM - 11:30 AM', 'Computer Lab 2',    'Completed'],
        ['Div B', 'Data Structures Lab',       '11:45 AM - 12:45 PM', 'Computer Lab 3',    'Ongoing'],
        ['Div B', 'Database Systems',          '01:30 PM - 02:30 PM', 'Classroom 303',     'Upcoming'],
        ['Div C', 'Software Engineering',      '09:30 AM - 11:30 AM', 'Classroom 304',     'Completed'],
        ['Div C', 'Web Development Lab',       '11:45 AM - 12:45 PM', 'Computer Lab 4',    'Ongoing'],
        ['Div C', 'Data Structures',           '01:30 PM - 02:30 PM', 'Auditorium Hall B', 'Upcoming'],
    ];
    foreach ($schedules as $s) {
        $schedStmt->execute($s);
    }
    echo "Schedules seeded.\n";

    // Seed Attendance (realistic data across 50 days for all 9 students, 5 subjects)
    $subjects = ['Web Development', 'Data Structures', 'Database Systems', 'Computer Networks', 'Software Engineering'];
    $studentIds = [6 => 92, 7 => 88, 8 => 58, 9 => 85, 10 => 78, 11 => 70, 12 => 95, 13 => 72, 14 => 80];
    // target percentages: Om~92%, Akib~88%, Sachin~58% (critical), Ram~85%, Yash~78%, Sumit~70%, Mahesh~95%, Pushkar~72%, Rushi~80%

    $attStmt = $pdo->prepare("INSERT INTO `attendance` (`student_id`, `subject`, `date`, `time_slot`, `status`, `remarks`) VALUES (?, ?, ?, ?, ?, ?)");
    $timeSlots = ['09:30 AM - 10:30 AM', '10:30 AM - 11:30 AM', '11:45 AM - 12:45 PM', '01:30 PM - 02:30 PM', '02:30 PM - 03:30 PM'];

    $baseDate = new DateTime('2026-05-01');

    foreach ($studentIds as $studId => $targetPct) {
        foreach ($subjects as $si => $subject) {
            $slot = $timeSlots[$si % count($timeSlots)];
            for ($day = 0; $day < 50; $day++) {
                $date = clone $baseDate;
                $date->modify("+$day days");
                $dow = (int)$date->format('N'); // 1=Mon 7=Sun
                if ($dow >= 6) continue; // skip weekends

                $rand = rand(1, 100);
                $status = ($rand <= $targetPct) ? 'Present' : 'Absent';
                $remarks = ($status === 'Present') ? 'Regular' : 'Absent';

                $attStmt->execute([$studId, $subject, $date->format('Y-m-d'), $slot, $status, $remarks]);
            }
        }
    }
    echo "Attendance records seeded.\n";

    echo "\n=== DATABASE SETUP COMPLETE ===\n";
    echo "Login credentials:\n";
    echo "  HOD:     hod@college.edu        / hod123\n";
    echo "  GFM A:   omkar@college.edu      / gfm123\n";
    echo "  GFM B:   pushkaraj@college.edu  / gfm123\n";
    echo "  GFM C:   shrutika@college.edu   / gfm123\n";
    echo "  Student: om@gmail.com           / student123\n";
    echo "  Student: akib@gmail.com         / student123\n";
    echo "  Student: sachin@gmail.com       / student123\n";
    echo "  Student: ram@gmail.com          / student123\n";
    echo "  Student: yash@gmail.com         / student123\n";
    echo "  Student: sumit@gmail.com        / student123\n";
    echo "  Student: mahesh@gmail.com       / student123\n";
    echo "  Student: pushkar@gmail.com      / student123\n";
    echo "  Student: rushi@gmail.com        / student123\n";

} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>
