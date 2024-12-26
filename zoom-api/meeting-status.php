<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$config = require_once('config.php');

$timezone = new DateTimeZone($config['timezone']);
$now = new DateTime('now', $timezone);
$start = new DateTime($config['meeting_time'], $timezone);
$timeUntilStart = $start->getTimestamp() - $now->getTimestamp();

echo json_encode([
    'success' => true,
    'started' => $timeUntilStart <= 0,
    'timeUntilStart' => max(0, $timeUntilStart),
    'startTime' => $config['meeting_time']
]);