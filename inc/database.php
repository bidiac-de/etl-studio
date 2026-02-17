<?php

$db;

function openDatabase()
{
    global $config;
    global $db;
    $db = new SQLite3($config["sqlitefilepath"]);
}

function createDatabaseScheme($username, $password)
{
    global $db;
    openDatabase();
    $db->exec("CREATE TABLE IF NOT EXISTS jobs (jobID INTEGER PRIMARY KEY AUTOINCREMENT, jobName TEXT NOT NULL, jobCreatedBy INTEGER NOT NULL DEFAULT '0', jobCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
    $db->exec("CREATE TABLE IF NOT EXISTS users (userID INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, fullname TEXT NOT NULL DEFAULT '')");
    $db->exec("CREATE TABLE IF NOT EXISTS servers (serverID INTEGER PRIMARY KEY AUTOINCREMENT, host TEXT NOT NULL, access_key TEXT NOT NULL, description TEXT NOT NULL DEFAULT '')");

    $username = $db->escapeString($username);
    $password = hash("sha256", "***$username###$password***somesalt<3");
    $db->exec("INSERT INTO users (username, password, fullname) VALUES ('$username', '$password', 'Administrator')");
}

if ($isSetupOk) {
    if (!file_exists($config["sqlitefilepath"]) && isset($_POST["username"]) && isset($_POST["password"])) {
        $username = $_POST["username"];
        $password = $_POST["password"];
        createDatabaseScheme($username, $password);
    } else if (file_exists($config["sqlitefilepath"])) {
        openDatabase();

        // Guard: if the DB file exists but is empty (e.g. after a
        // reset while the server was running), the expected tables
        // won't be there.  Remove the empty DB and config so the
        // full setup flow can restart cleanly.
        $tableCheck = @$db->querySingle(
            "SELECT count(*) FROM sqlite_master WHERE type='table' AND name IN ('users','servers','jobs')"
        );
        if ($tableCheck < 3) {
            @$db->close();
            @unlink($config["sqlitefilepath"]);
            @unlink("config.json");
            session_destroy();
            $isSetupOk = false;
        }
    } else {
        // DB file doesn't exist and this isn't a setup POST —
        // reset config so the full setup page is shown.
        @unlink("config.json");
        session_destroy();
        $isSetupOk = false;
    }
}




?>