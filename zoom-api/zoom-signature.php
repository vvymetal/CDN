
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://127.0.0.1:9999');  // jediný správný origin
header('Access-Control-Allow-Methods: POST, OPTIONS');  
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

$config = require_once('config.php');
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['meetingNumber'])) {
    http_response_code(400);
    die(json_encode(['success' => false, 'error' => 'Invalid request']));
}

$role = $data['role'] ?? 0;
$iat = time() - 30;
$exp = $iat + 60 * 60 * 2;

$header = [
    'alg' => 'HS256',
    'typ' => 'JWT'
];

$payload = [
    'sdkKey' => $config['zoom_sdk_key'],
    'mn' => $data['meetingNumber'],
    'role' => $role,
    'iat' => $iat,
    'exp' => $exp,
    'tokenExp' => $exp
];

function base64UrlEncode($data) {
    return str_replace(['+','/','='], ['-','_',''], base64_encode($data));
}

$header_encoded = base64UrlEncode(json_encode($header));
$payload_encoded = base64UrlEncode(json_encode($payload));
$signature = base64UrlEncode(hash_hmac('sha256', 
    "$header_encoded.$payload_encoded", 
    $config['zoom_sdk_secret'], 
    true
));

echo json_encode([
    'success' => true,
    'signature' => "$header_encoded.$payload_encoded.$signature",
    'sdkKey' => $config['zoom_sdk_key']
]);
