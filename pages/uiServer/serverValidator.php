<?php

ini_set("default_socket_timeout", 2);
session_start();

function fetchJson(string $url, string $method = "GET", array $payload = []): ?array
{
    $options = [
        "http" => [
            "method" => $method,
            "timeout" => 2,
            "ignore_errors" => true,
            "header" => "Accept: application/json\r\n",
        ],
    ];

    if ($method === "POST") {
        $json = json_encode($payload);
        $options["http"]["header"] .= "Content-Type: application/json\r\n";
        $options["http"]["content"] = $json === false ? "{}" : $json;
    }

    $context = stream_context_create($options);
    $raw = @file_get_contents($url, false, $context);
    if ($raw === false) {
        return null;
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : null;
}

function validateCoreConnection(string $connection, string $accessKey): bool
{
    if (!str_starts_with($connection, "http")) {
        return false;
    }

    $base = rtrim($connection, "/");
    $capabilities = fetchJson($base . "/setup/capabilities");
    if (!is_array($capabilities)) {
        return false;
    }

    if (($capabilities["contract_version"] ?? "") !== "core-studio-v1") {
        return false;
    }

    $setupValidation = $capabilities["setup_validation"] ?? [];
    $validationRequired = (bool)($setupValidation["required"] ?? false);

    if (!$validationRequired) {
        return true;
    }

    if (trim($accessKey) === "") {
        return false;
    }

    $endpoint = $setupValidation["endpoint"] ?? "/setup/validate";
    if (!str_starts_with($endpoint, "/")) {
        $endpoint = "/" . $endpoint;
    }

    $validationResponse = fetchJson(
        $base . $endpoint,
        "POST",
        ["key" => $accessKey]
    );
    return is_array($validationResponse) && ($validationResponse["valid"] ?? false) === true;
}

if (isset($_POST["serverID"])) {
    $serverID = $_POST["serverID"];
    $connection = $_SESSION["server"]["$serverID"]["host"];
    $accessKey = $_SESSION["server"]["$serverID"]["access_key"];
    echo validateCoreConnection($connection, $accessKey) ? "true" : "false";
    exit();
}

if (isset($_POST["connection"]) && isset($_POST["accessKey"])) {
    $connection = $_POST["connection"];
    $accessKey = $_POST["accessKey"];
    echo validateCoreConnection($connection, $accessKey) ? "true" : "false";
    exit();
}

echo "false";

?>
