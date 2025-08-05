<?php

    if (!isset($_SESSION["login"])) {
        $_SESSION["login"] = false;
    }
    
    if (isset($_POST["username"]) && isset($_POST["password"]) && $isSetupOk) {
        $username = $db->escapeString($_POST["username"]);
        $_SESSION["username"] = $username;

        $password = hash("sha256", "***$username###".$_POST["password"]."***somesalt<3");
        $result = $db->query("SELECT * FROM users WHERE username='$username' AND password='$password'");
        while($row = $result->fetchArray()) {
            $_SESSION["fullname"] = $row["fullname"];
            $_SESSION["userID"] = $row["userID"];
            $_SESSION["login"] = true;
            break;
        }

        header("Refresh:0");
    } 

    if (isset($_GET["logout"])) {
        session_destroy();
        header("refresh:0; url=./");
    }


?>