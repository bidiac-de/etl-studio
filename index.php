<?php
    require_once("inc/includes.php");
?>
<!doctype html>
<html lang="en" data-theme="light">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="color-scheme" content="light dark">
        <link rel="stylesheet" href="./libs/pico-main/css/pico.min.css">
        <link rel="stylesheet" href="./libs/pico-main/css/pico.colors.min.css">
        <link href="./libs/fontawesome-free-7.0.0-web/css/fontawesome.min.css" rel="stylesheet" />
        <link href="./libs/fontawesome-free-7.0.0-web/css/brands.min.css" rel="stylesheet" />
        <link href="./libs/fontawesome-free-7.0.0-web/css/solid.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="./libs/flexboxgrid.min.css">
        <link rel="stylesheet" href="./index.css">
        <script src="./libs/jquery-3.7.1.min.js"></script>
        <script src="./index.js"></script>
        <title>ETL Studio</title>
    </head>
    <body>

        <?php

            if ($isSetupOk) {
                if($_SESSION["login"] == "1") {
                    if (isset($_GET["job"])) {
                        $jobID = $_GET["job"];
                        include("./pages/uiJob/job.php");
                    } else if (isset($_GET["settings"])) {
                        include("./pages/uiSettings/settings.php");
                    } else if (isset($_GET["server"])) {
                        include("./pages/uiServer/server.php");
                    } else {
                        include("./pages/uiDashboard/dashboard.php");
                    }
                } else {
                    include("./pages/uiLogin/login.php");
                }
            } else {
                include("./pages/uiSetup/setup.php");
            }
            
            
        ?>

    </body>
</html>