<?php

    ini_set("default_socket_timeout", 2);
    session_start();

    if (isset($_POST["serverID"])) {
        $serverID = $_POST["serverID"];
        $connection = $_SESSION["server"]["$serverID"]["host"];
        $accessKey = $_SESSION["server"]["$serverID"]["access_key"];
        $result = file_get_contents("$connection/setup?key=$accessKey");
        echo $result;
    }

    if (isset($_POST["connection"]) && isset($_POST["accessKey"])) {
        $connection = $_POST["connection"];
        $accessKey = $_POST["accessKey"];

        if (str_starts_with($connection, "http")) {
            $result = file_get_contents("$connection/setup?key=$accessKey");
            echo $result;
        } else {
            echo "false";
        }
    }

?>