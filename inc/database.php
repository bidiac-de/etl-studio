<?php

    $db;

    function openDatabase() {
        global $config;
        global $db;
        $db = new SQLite3($config["sqlitefilepath"]);
    }

    function createDatabaseScheme($username, $password) {
        global $db;
        openDatabase();
        $db->exec("CREATE TABLE IF NOT EXISTS jobs (jobID INTEGER PRIMARY KEY AUTOINCREMENT, jobName TEXT NOT NULL, jobCreatedBy INTEGER NOT NULL DEFAULT '0', jobCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
        $db->exec("CREATE TABLE IF NOT EXISTS users (userID INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, fullname TEXT NOT NULL DEFAULT '')");
    
        $username = $db->escapeString($username);
        $password = hash("sha256", "***$username###$password***somesalt<3");
        $db->exec("INSERT INTO users (username, password, fullname) VALUES ('$username', '$password', 'Administrator')");
    }

    if ($isSetupOk) {
        if (!file_exists($config["sqlitefilepath"]) && isset($_POST["username"]) && isset($_POST["password"])) {
            $username = $_POST["username"];
            $password = $_POST["password"];
            createDatabaseScheme($username, $password);
        } else {
            openDatabase();
        }
    }

    


?>