<?php

    require_once("./config/config.php");
    require_once("./inc/includes.php");

    session_start();
    if (isset($_POST["username"]) && isset($_POST["password"])) {
        $_SESSION["username"] = $_POST["username"];
        $_SESSION["password"] = $_POST["password"];
        $_SESSION["fullname"] = "Sven König";
        header("Refresh:0");
    }
    if (isset($_GET["logout"])) {
        session_destroy();
        header("refresh:0; url=./");
    }

?>
<!doctype html>
<html lang="en" data-theme="light">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="color-scheme" content="light dark">
        <link rel="stylesheet" href="./libs/pico-main/css/pico.min.css">
        <link rel="stylesheet" href="./libs/pico-main/css/pico.colors.min.css">
        <link href="./libs/fontawesome-free-6.7.2-web/css/fontawesome.css" rel="stylesheet" />
        <link href="./libs/fontawesome-free-6.7.2-web/css/brands.css" rel="stylesheet" />
        <link href="./libs/fontawesome-free-6.7.2-web/css/solid.css" rel="stylesheet" />
        <link rel="stylesheet" href="./index.css">
        <script src="./libs/jquery-3.7.1.min.js"></script>
        <script src="./index.js"></script>
        <title>ETL Studio</title>
    </head>
    <body>

        <?php
            
            if(isset($_SESSION["username"]) && isset($_SESSION["password"])) {
                if (isset($_GET["job"])) {
                    $jobID = $_GET["job"];
                    include("./pages/uiJob/job.php");
                } else if (isset($_GET["settings"])) {
                    include("./pages/uiSettings/settings.php");
                } else {
                    include("./pages/uiDashboard/dashboard.php");
                }
            } else {
                include("./pages/uiLogin/login.php");
            }
        ?>

    </body>
</html>