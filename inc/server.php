<?php

    if ($_SESSION["login"]) {

        $_SESSION["server"] = [];

        $result = $db->query("SELECT * FROM servers");
        while($row = $result->fetchArray()) {
            array_push($_SESSION["server"], $row);
        }

    }


    //print_r($_SESSION);

?>