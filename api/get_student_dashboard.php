<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

// Ensure user is logged in as student
$user = $_SESSION['user'] ?? null;
if (!$user || $user['role'] !== 'student') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

$student_id = $user['id'];

if (!isset($pdo) || $pdo === null) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

try {
    // 1. Fetch Profile Info
    $profileStmt = $pdo->prepare("
        SELECT u.full_name, u.email, u.department, sd.prn, sd.roll_no, sd.semester, sd.division, sd.phone, sd.guardian_contact, sd.academic_year, sd.gfm_name, sd.avatar_url 
        FROM users u 
        JOIN student_details sd ON u.id = sd.user_id 
        WHERE u.id = :student_id
    ");
    $profileStmt->execute(['student_id' => $student_id]);
    $profile = $profileStmt->fetch();

    if (!$profile) {
        echo json_encode(['success' => false, 'message' => 'Student details not found.']);
        exit;
    }

    if (empty($profile['department']) || $profile['department'] === 'Computer Engineering') {
        $profile['department'] = 'Artificial Intelligence & Machine Learning';
    }

    $division = $profile['division'];

    // 2. Fetch Overall Attendance Stats
    $statsStmt = $pdo->prepare("
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN status IN ('Present', 'Medical Leave', 'Duty Leave') THEN 1 ELSE 0 END) AS attended,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS missed
        FROM attendance 
        WHERE student_id = :student_id
    ");
    $statsStmt->execute(['student_id' => $student_id]);
    $statsData = $statsStmt->fetch();

    $totalClasses = (int)($statsData['total'] ?? 0);
    $classesAttended = (int)($statsData['attended'] ?? 0);
    $classesMissed = (int)($statsData['missed'] ?? 0);
    $overallAttendance = $totalClasses > 0 ? round(($classesAttended / $totalClasses) * 100, 1) : 0;

    $stats = [
        'totalClasses' => $totalClasses,
        'classesAttended' => $classesAttended,
        'classesMissed' => $classesMissed,
        'overallAttendance' => $overallAttendance,
        'minimumRequired' => 75,
        'targetGoal' => 95
    ];

    // 3. Fetch Subject Breakdown
    $subjectStatsStmt = $pdo->prepare("
        SELECT 
            subject, 
            COUNT(*) AS total, 
            SUM(CASE WHEN status IN ('Present', 'Medical Leave', 'Duty Leave') THEN 1 ELSE 0 END) AS present, 
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent 
        FROM attendance 
        WHERE student_id = :student_id 
        GROUP BY subject
    ");
    $subjectStatsStmt->execute(['student_id' => $student_id]);
    $dbSubjects = $subjectStatsStmt->fetchAll();

    // Map subjects to icons
    $subjectIcons = [
        'Web Development' => 'fa-code',
        'Data Structures' => 'fa-diagram-project',
        'Database Systems' => 'fa-database',
        'Computer Networks' => 'fa-network-wired',
        'Software Engineering' => 'fa-cubes'
    ];

    $subjects = [];
    $idCounter = 1;

    // Fetch all faculty once to assign to subject cards
    $facultyStmt = $pdo->prepare("SELECT name, subject FROM faculty");
    $facultyStmt->execute();
    $facultyList = $facultyStmt->fetchAll();
    $facultyMap = [];
    foreach ($facultyList as $fac) {
        $facultyMap[$fac['subject']] = $fac['name'];
    }

    foreach ($dbSubjects as $sub) {
        $subTotal = (int)$sub['total'];
        $subPresent = (int)$sub['present'];
        $subAbsent = (int)$sub['absent'];
        $subPercent = $subTotal > 0 ? round(($subPresent / $subTotal) * 100, 1) : 0;
        
        $subjects[] = [
            'id' => $idCounter++,
            'name' => $sub['subject'],
            'faculty' => $facultyMap[$sub['subject']] ?? 'Faculty',
            'total' => $subTotal,
            'present' => $subPresent,
            'absent' => $subAbsent,
            'percent' => $subPercent,
            'icon' => $subjectIcons[$sub['subject']] ?? 'fa-book'
        ];
    }

    // 4. Fetch Monthly Trend Data
    $monthlyStmt = $pdo->prepare("
        SELECT 
            DATE_FORMAT(date, '%b') as month_name, 
            COUNT(*) as total, 
            SUM(CASE WHEN status IN ('Present', 'Medical Leave', 'Duty Leave') THEN 1 ELSE 0 END) as present 
        FROM attendance 
        WHERE student_id = :student_id 
        GROUP BY DATE_FORMAT(date, '%Y-%m'), DATE_FORMAT(date, '%b') 
        ORDER BY DATE_FORMAT(date, '%Y-%m')
    ");
    $monthlyStmt->execute(['student_id' => $student_id]);
    $dbMonthly = $monthlyStmt->fetchAll();

    $months = [];
    $values = [];
    foreach ($dbMonthly as $mon) {
        $monTotal = (int)$mon['total'];
        $monPresent = (int)$mon['present'];
        $months[] = $mon['month_name'];
        $values[] = $monTotal > 0 ? round(($monPresent / $monTotal) * 100, 1) : 0;
    }

    // Fallback if monthly data is empty (e.g. no logs)
    if (empty($months)) {
        $months = ['Jun', 'Jul'];
        $values = [$overallAttendance, $overallAttendance];
    }

    $monthlyData = [
        'months' => $months,
        'values' => $values,
        'avgAttendance' => $overallAttendance . '%'
    ];

    // 5. Fetch Notices (Removed as they are now handled by the notifications table)
    $notifications = [];

    // 5.5 Fetch Personal Notifications (from notifications table)
    $persNotifStmt = $pdo->prepare("
        SELECT * FROM notifications 
        WHERE user_id = :student_id 
           OR target_role = 'student' 
           OR target_role = 'all' 
        ORDER BY created_at DESC 
        LIMIT 15
    ");
    $persNotifStmt->execute(['student_id' => $student_id]);
    $dbPersNotifs = $persNotifStmt->fetchAll();

    foreach ($dbPersNotifs as $pn) {
        $timeStr = date('M d, Y', strtotime($pn['created_at']));
        $notifType = strtoupper($pn['type'] ?: 'WARNING'); // Default to WARNING if not set
        if ($notifType === 'DANGER' || $notifType === 'ALERT') {
            $notifType = 'WARNING';
        }
        $notifications[] = [
            'id' => 'pn_' . $pn['id'],
            'title' => $pn['title'],
            'desc' => $pn['message'],
            'time' => $timeStr,
            'unread' => ((int)$pn['is_read'] === 0),
            'type' => $notifType,
            'icon' => $notifType === 'WARNING' ? 'fa-triangle-exclamation' : 'fa-bell',
            'bgClass' => $notifType === 'WARNING' ? 'icon-bg-red' : 'icon-bg-blue'
        ];
    }

    // Sort combined notifications by date descending (we use time roughly, or just leave as is since personal notifications are important)
    usort($notifications, function($a, $b) {
        return strtotime($b['time']) - strtotime($a['time']);
    });

    // 6. Fetch Schedules
    $schedStmt = $pdo->prepare("SELECT id, title, time, room, status FROM schedules WHERE division = :division");
    $schedStmt->execute(['division' => $division]);
    $schedule = $schedStmt->fetchAll();

    // 7. Fetch Attendance History
    $historyStmt = $pdo->prepare("
        SELECT a.date, a.subject, a.status, a.remarks, a.lecture_number
        FROM attendance a
        WHERE a.student_id = :student_id 
        ORDER BY a.date DESC, a.id DESC
    ");
    $historyStmt->execute(['student_id' => $student_id]);
    $dbHistory = $historyStmt->fetchAll();

    $history = [];
    $absentDates = [];

    foreach ($dbHistory as $hist) {
        $subName = $hist['subject'];
        $history[] = [
            'date' => $hist['date'],
            'subject' => $subName,
            'faculty' => $facultyMap[$subName] ?? 'Faculty',
            'status' => $hist['status'],
            'percent' => $overallAttendance . '%',
            'remarks' => $hist['remarks']
        ];

        if ($hist['status'] === 'Absent') {
            $absentDates[] = [
                'date' => $hist['date'],
                'subject' => $subName,
                'remarks' => $hist['remarks'],
                'lecture' => $hist['lecture_number']
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'student' => [
                'name' => $profile['full_name'],
                'rollNo' => $profile['roll_no'],
                'department' => $profile['department'],
                'semester' => $profile['semester'],
                'division' => $profile['division'],
                'email' => $profile['email'],
                'phone' => $profile['phone'] ?? 'N/A',
                'academicYear' => $profile['academic_year'],
                'gfmName' => $profile['gfm_name'],
                'guardianContact' => $profile['guardian_contact'] ?? 'N/A',
                'avatarUrl' => $profile['avatar_url'] ?: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'
            ],
            'stats' => $stats,
            'subjects' => $subjects,
            'monthlyData' => $monthlyData,
            'notifications' => $notifications,
            'schedule' => $schedule,
            'history' => $history,
            'absent_dates' => $absentDates
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while loading dashboard: ' . $e->getMessage()
    ]);
}
?>
