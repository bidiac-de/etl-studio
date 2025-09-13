<?php
    require_once("inc/includes.php");
?>
<!DOCTYPE html>
<html lang="en" data-theme="light">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="color-scheme" content="light dark">

        <link rel="stylesheet" href="./libs/pico-main/css/pico.min.css">
        <link rel="stylesheet" href="./libs/pico-main/css/pico.colors.min.css">
        <link rel="stylesheet" href="./libs/fontawesome-free-7.0.0-web/css/fontawesome.min.css">
        <link rel="stylesheet" href="./libs/fontawesome-free-7.0.0-web/css/brands.min.css">
        <link rel="stylesheet" href="./libs/fontawesome-free-7.0.0-web/css/solid.min.css">
        <link rel="stylesheet" href="./libs/flexboxgrid.min.css">
        <link rel="stylesheet" href="./libs/drawflow-dist-0.0.60/drawflow.min.css">
        <link rel="stylesheet" href="./libs/drawflow-dist-0.0.60/drawflow-style.css">
        <link rel="stylesheet" href="./libs/tabler-icons-3.34.1/dist/tabler-icons.min.css">
        <link rel="stylesheet" href="./libs/codemirror-5.65.13/lib/codemirror.css">
        <link rel="stylesheet" href="./libs/codemirror-5.65.13/theme/ayu-mirage.css">
        <link rel="stylesheet" href="./index.css">

        <link rel="shortcut icon" href="./img/icon.png" type="image/png">

        <script src="./libs/codemirror-5.65.13/lib/codemirror.js"></script>
        <script src="./libs/codemirror-5.65.13/mode/javascript.js"></script>
        <script src="./libs/jquery-3.7.1.min.js"></script>
        <script src="./libs/drawflow-dist-0.0.60/drawflow.min.js"></script>
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
                    } else if (isset($_GET["user"])) {
                        include("./pages/uiUserManagement/userManagement.php");
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



        <dialog id="alertDialog">
            <article>
                <h2></h2>
                <p></p>
                <footer>
                    <button onclick="$('#alertDialog').removeAttr('open');">Okay</button>
                </footer>
            </article>
        </dialog>

    </body>
</html>