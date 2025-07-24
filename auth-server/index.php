<?php

require_once('database.php');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$request = json_decode(file_get_contents('php://input'), true);
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

$db = new AuthDatabase();

// Prüfe ob User existieren
if (!$db->hasUsers()) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'No users found. Please run: php init-admin.php'
    ]);
    exit;
}

if ($method === 'POST' && $path === '/login') {
    $username = $request['username'] ?? '';
    $password = $request['password'] ?? '';
    
    $user = $db->verifyUser($username, $password);
    if ($user) {
        $token = bin2hex(random_bytes(32));
        
        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'username' => $user['username'],
                'fullname' => $user['fullname'],
                'role' => $user['role']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid credentials'
        ]);
    }
} else if ($method === 'POST' && $path === '/verify') {
    $token = $request['token'] ?? '';
    
    // Simple token verification (in production: use JWT or session storage)
    if (strlen($token) === 64) {
        echo json_encode([
            'success' => true,
            'valid' => true
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'valid' => false
        ]);
    }
} else if ($method === 'GET' && $path === '/users') {
    // Admin endpoint to list users (in production: add proper authentication)
    $users = $db->getAllUsers();
    echo json_encode([
        'success' => true,
        'users' => $users
    ]);
} else if ($method === 'POST' && $path === '/register') {
    $username = $request['username'] ?? '';
    $password = $request['password'] ?? '';
    $fullname = $request['fullname'] ?? '';
    $role = $request['role'] ?? 'user';
    
    if (empty($username) || empty($password) || empty($fullname)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields'
        ]);
        exit;
    }
    
    try {
        $db->addUser($username, $password, $fullname, $role);
        echo json_encode([
            'success' => true,
            'message' => 'User created successfully'
        ]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Username already exists'
        ]);
    }
} else {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Endpoint not found'
    ]);
}

?> 