<?php

    chdir("../../");

    if (isset($_POST["sqlitefilepath"])) {

        $sqlitefilepath = $_POST["sqlitefilepath"];
        if (file_exists($sqlitefilepath)) {
            if (is_dir($sqlitefilepath)) {
                echo "Path is a directory!";
            } else {
                echo "File already exists!";
            }
        } else {
            if (!is_writable(dirname($sqlitefilepath))) {
                echo "Check write permissions!";
            }
        }
        exit();
    }

    if (isset($_POST["host"])) {
        
    }

?>