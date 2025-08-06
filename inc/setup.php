<?php

    $isSetupOk = file_exists("config.json");
    $config = [];

    if (isset($_POST["sqlitefilepath"]) && isset($_POST["username"]) && isset($_POST["password"]) && !$isSetupOk) {
        $config["sqlitefilepath"] = $_POST["sqlitefilepath"];
        file_put_contents("config.json", json_encode($config));
        $isSetupOk = file_exists("config.json");
    }

    if ($isSetupOk) {
        $config = json_decode(file_get_contents("config.json"), true);
    } else {
        session_destroy();
    }

?>