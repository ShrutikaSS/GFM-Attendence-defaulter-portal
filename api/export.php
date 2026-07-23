<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$user = $_SESSION['user'] ?? null;
if (!$user || !in_array($user['role'], ['gfm', 'hod'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

if (!isset($pdo) || $pdo === null) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// Read payload from form POST or JSON body
$payload = [];
if (isset($_POST['payload']) && is_string($_POST['payload'])) {
    $decoded = json_decode($_POST['payload'], true);
    if (is_array($decoded)) {
        $payload = $decoded;
    }
} else {
    $rawInput = file_get_contents('php://input');
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $payload = $decoded;
    }
}

$division = trim($payload['division'] ?? ($user['division_assigned'] ?? ''));
$semester = trim($payload['semester'] ?? 'Semester VI');
$subject = trim($payload['subject'] ?? '');
$startDate = trim($payload['start_date'] ?? '');
$endDate = trim($payload['end_date'] ?? '');
$status = trim($payload['status'] ?? '');
$format = trim($payload['format'] ?? 'excel');

if ($user['role'] === 'gfm' && empty($division)) {
    echo json_encode(['success' => false, 'message' => 'Division is required.']);
    exit;
}

try {
    $query = "
        SELECT 
            sd.roll_no,
            sd.prn,
            u.full_name,
            sd.division,
            a.subject,
            a.date,
            a.lecture_number,
            a.status,
            a.remarks,
            a.created_at
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        JOIN student_details sd ON a.student_id = sd.user_id
        WHERE 1=1
    ";

    $params = [];

    if (!empty($division)) {
        $query .= " AND sd.division = :division";
        $params['division'] = $division;
    }
    if (!empty($semester)) {
        $query .= " AND a.semester = :semester";
        $params['semester'] = $semester;
    }
    if (!empty($subject)) {
        $query .= " AND a.subject = :subject";
        $params['subject'] = $subject;
    }
    if (!empty($startDate)) {
        $query .= " AND a.date >= :start_date";
        $params['start_date'] = $startDate;
    }
    if (!empty($endDate)) {
        $query .= " AND a.date <= :end_date";
        $params['end_date'] = $endDate;
    }
    if (!empty($status)) {
        $query .= " AND a.status = :status";
        $params['status'] = $status;
    }

    $query .= " ORDER BY sd.division ASC, sd.roll_no ASC, a.date DESC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $records = $stmt->fetchAll();

    if ($format === 'json') {
        echo json_encode([
            'success' => true,
            'data' => $records,
            'total' => count($records),
            'filters' => $payload
        ]);
        exit;
    }

    if ($format === 'pdf') {
        exportPDF($records, $division, $semester, $subject);
    } else {
        exportExcel($records, $division, $semester, $subject);
    }

    exit;

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Export error: ' . $e->getMessage()]);
}

function exportExcel($records, $division, $semester, $subject) {
    $filename = 'attendance_export_' . date('Y-m-d_H-i-s') . '.csv';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');

    $output = fopen('php://output', 'w');
    fputcsv($output, ['Roll No', 'PRN', 'Student Name', 'Division', 'Subject', 'Date', 'Lecture', 'Status', 'Remarks']);
    
    foreach ($records as $row) {
        fputcsv($output, [
            $row['roll_no'],
            $row['prn'],
            $row['full_name'],
            $row['division'],
            $row['subject'],
            $row['date'],
            $row['lecture_number'],
            $row['status'],
            $row['remarks']
        ]);
    }
    
    fclose($output);
    exit;
}

function exportPDF($records, $division, $semester, $subject) {
    $filename = 'attendance_report_' . date('Y-m-d_H-i-s') . '.html';
    
    $html = '<!DOCTYPE html><html><head><title>Attendance Report</title>';
    $html .= '<style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #1a365d; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #1a365d; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
    </style></head><body>';
    $html .= '<h1>Attendance Report</h1>';
    $html .= '<p><strong>Division:</strong> ' . htmlspecialchars($division) . '</p>';
    $html .= '<p><strong>Semester:</strong> ' . htmlspecialchars($semester) . '</p>';
    $html .= '<p><strong>Subject:</strong> ' . htmlspecialchars($subject) . '</p>';
    $html .= '<p><strong>Generated:</strong> ' . date('Y-m-d H:i:s') . '</p>';
    $html .= '<table><tr><th>Roll No</th><th>PRN</th><th>Name</th><th>Division</th><th>Subject</th><th>Date</th><th>Lecture</th><th>Status</th><th>Remarks</th></tr>';
    
    foreach ($records as $row) {
        $html .= '<tr>';
        $html .= '<td>' . htmlspecialchars($row['roll_no']) . '</td>';
        $html .= '<td>' . htmlspecialchars($row['prn']) . '</td>';
        $html .= '<td>' . htmlspecialchars($row['full_name']) . '</td>';
        $html .= '<td>' . htmlspecialchars($row['division']) . '</td>';
        $html .= '<td>' . htmlspecialchars($row['subject']) . '</td>';
        $html .= '<td>' . htmlspecialchars($row['date']) . '</td>';
        $html .= '<td>' . htmlspecialchars($row['lecture_number']) . '</td>';
        $html .= '<td>' . htmlspecialchars($row['status']) . '</td>';
        $html .= '<td>' . htmlspecialchars($row['remarks']) . '</td>';
        $html .= '</tr>';
    }
    
    $html .= '</table></body></html>';
    
    header('Content-Type: text/html');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo $html;
    exit;
}
?>
