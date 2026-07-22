<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

// Read JSON or POST payload
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

$email = trim($input['email'] ?? $_POST['email'] ?? '');
$password = trim($input['password'] ?? $_POST['password'] ?? '');
$role = trim($input['role'] ?? $_POST['role'] ?? 'student');

if (empty($email) || empty($password)) {
    echo json_encode([
        'success' => false,
        'message' => 'Email and password are required.'
    ]);
    exit;
}

if (!isset($pdo) || $pdo === null) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed. Please ensure MySQL is running.'
    ]);
    exit;
}

$matchedUser = null;

try {
    // 1. Fetch base user info
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => $email]);
    $dbUser = $stmt->fetch();

    if ($dbUser) {
        $dbUser['department'] = 'Artificial Intelligence & Machine Learning';
        // 2. Verify password (bcrypt or name123 fallback)
        $cleanName = preg_replace('/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i', '', trim($dbUser['full_name']));
        $firstName = strtolower(trim(explode(' ', $cleanName)[0]));
        $emailPrefix = strtolower(trim(explode('@', $dbUser['email'])[0]));

        $passValid = password_verify($password, $dbUser['password']);

        if (!$passValid && $dbUser['role'] === 'student') {
            $prnStmt = $pdo->prepare("SELECT prn FROM student_details WHERE user_id = :user_id");
            $prnStmt->execute(['user_id' => $dbUser['id']]);
            $sd = $prnStmt->fetch();
            if ($sd && !empty($sd['prn'])) {
                if (strtoupper(trim($password)) === strtoupper(trim($sd['prn']))) {
                    $passValid = true;
                }
            }
        }

        if (!$passValid) {
            if (
                strtolower($password) === $firstName . '123' ||
                strtolower($password) === $emailPrefix . '123' ||
                strtolower($password) === strtolower($dbUser['role']) . '123' ||
                $password === $dbUser['password']
            ) {
                $passValid = true;
            }
        }

        if ($passValid) {
            // 3. Load role-specific profile details
            if ($dbUser['role'] === 'student') {
                $studentStmt = $pdo->prepare("SELECT prn, roll_no, semester, division, phone, guardian_contact, academic_year, gfm_name, avatar_url FROM student_details WHERE user_id = :user_id");
                $studentStmt->execute(['user_id' => $dbUser['id']]);
                $studentDetails = $studentStmt->fetch();
                
                $matchedUser = [
                    'id' => $dbUser['id'],
                    'full_name' => $dbUser['full_name'],
                    'email' => $dbUser['email'],
                    'role' => $dbUser['role'],
                    'department' => $dbUser['department'],
                    'roll_or_emp_id' => $dbUser['roll_or_emp_id'],
                    'prn' => $studentDetails['prn'] ?? '',
                    'roll_no' => $studentDetails['roll_no'] ?? '',
                    'semester' => $studentDetails['semester'] ?? 'Semester VI',
                    'division' => $studentDetails['division'] ?? 'Div A',
                    'phone' => $studentDetails['phone'] ?? '',
                    'guardian_contact' => $studentDetails['guardian_contact'] ?? '',
                    'academic_year' => $studentDetails['academic_year'] ?? '2025 - 2026',
                    'gfm_name' => $studentDetails['gfm_name'] ?? 'Prof. Aniket Verma',
                    'avatar_url' => $studentDetails['avatar_url'] ?? ''
                ];
            } elseif ($dbUser['role'] === 'gfm') {
                $gfmStmt = $pdo->prepare("SELECT division_assigned FROM gfm_details WHERE user_id = :user_id");
                $gfmStmt->execute(['user_id' => $dbUser['id']]);
                $gfmDetails = $gfmStmt->fetch();
                
                $matchedUser = [
                    'id' => $dbUser['id'],
                    'full_name' => $dbUser['full_name'],
                    'email' => $dbUser['email'],
                    'role' => $dbUser['role'],
                    'department' => $dbUser['department'],
                    'roll_or_emp_id' => $dbUser['roll_or_emp_id'],
                    'division_assigned' => $gfmDetails['division_assigned'] ?? 'Div A'
                ];
            } else { // HOD
                $matchedUser = [
                    'id' => $dbUser['id'],
                    'full_name' => $dbUser['full_name'],
                    'email' => $dbUser['email'],
                    'role' => $dbUser['role'],
                    'department' => $dbUser['department'],
                    'roll_or_emp_id' => $dbUser['roll_or_emp_id']
                ];
            }
        }
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred during database lookup: ' . $e->getMessage()
    ]);
    exit;
}

if (!$matchedUser) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email or password.'
    ]);
    exit;
}

if ($role && $matchedUser['role'] !== $role) {
    echo json_encode([
        'success' => false,
        'message' => 'Selected role ("' . ucfirst($role) . '") does not match account role ("' . ucfirst($matchedUser['role']) . '"). Please select the correct role.'
    ]);
    exit;
}

// Save active session
$_SESSION['user'] = $matchedUser;
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

$redirectMap = [
    'student' => 'dashboards/student.html',
    'gfm' => 'dashboards/gfm.html',
    'hod' => 'hod/dashboard.html'
];

$targetPage = $redirectMap[$matchedUser['role']] ?? 'index.html';

echo json_encode([
    'success' => true,
    'message' => 'Login successful!',
    'redirect' => $targetPage,
    'user' => $matchedUser,
    'csrf_token' => $_SESSION['csrf_token']
]);
?>
