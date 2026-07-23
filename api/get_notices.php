<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($pdo) || $pdo === null) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.'
    ]);
    exit;
}

$scope = strtolower(trim($_GET['scope'] ?? 'public'));
$limit = (int) ($_GET['limit'] ?? 6);
$limit = max(1, min($limit, 20));

$user = $_SESSION['user'] ?? null;

if ($scope === 'all') {
    if (!$user || ($user['role'] ?? '') !== 'hod') {
        echo json_encode([
            'success' => false,
            'message' => 'Unauthorized access.'
        ]);
        exit;
    }

    $query = "
        SELECT
            n.id,
            n.title,
            n.target,
            n.message,
            DATE_FORMAT(n.created_at, '%b %d, %Y') AS date,
            n.created_at,
            COALESCE(u.full_name, 'System') AS created_by_name
        FROM notices n
        LEFT JOIN users u ON n.created_by = u.id
        ORDER BY n.created_at DESC
        LIMIT :limit
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
} else {
    $query = "
        SELECT
            n.id,
            n.title,
            n.target,
            n.message,
            DATE_FORMAT(n.created_at, '%b %d, %Y') AS date,
            n.created_at,
            COALESCE(u.full_name, 'Department Admin') AS created_by_name
        FROM notices n
        LEFT JOIN users u ON n.created_by = u.id
        WHERE n.target IN ('ALL', 'All Batches', 'All Classes')
        ORDER BY n.created_at DESC
        LIMIT :limit
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
}

$notices = $stmt->fetchAll();

echo json_encode([
    'success' => true,
    'notices' => $notices
]);
?>
