<?php

    $db;

    function openDatabase() {
        global $sqliteDatabasePath;
        global $db;
        $db = new SQLite3($sqliteDatabasePath);
    }

    function createDatabaseScheme() {
        global $db;
        openDatabase();
        $db->exec("CREATE TABLE IF NOT EXISTS jobs (
                    jobID INTEGER PRIMARY KEY AUTOINCREMENT, 
                    jobName TEXT NOT NULL,
                    jobCreatedBy INTEGER NOT NULL DEFAULT '0',
                    jobCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )");
    }


    if (!file_exists($sqliteDatabasePath)) {
        createDatabaseScheme();
    } else {
        openDatabase();
    }


?>