<?php

    $serverID = isset($_GET["serverID"]) ? $db->escapeString($_GET["serverID"]) : 0;

    if (isset($_GET["serverID"]) && isset($_POST["key"]) && isset($_POST["description"]) && isset($_POST["host"]) && isset($_POST["protocol"]) && isset($_POST["port"])) {
        $key = $_POST["key"];
        $name = $_POST["description"];
        $hostname = $_POST["host"];
        $protocol = $_POST["protocol"];
        $port = $_POST["port"];

        $connection = $db->escapeString("$protocol://$hostname:$port");
        $name = $db->escapeString($name);
        $key = $db->escapeString($key);

        if ($_GET["serverID"] == 0) {
            $db->exec("INSERT INTO servers (host, description, access_key) VALUES ('$connection', '$name', '$key')");
        } else {
            $db->exec("UPDATE servers SET host = '$connection', description = '$name', access_key = '$key' WHERE serverID='$serverID'");
        }
        header("refresh:0; url=?server");
    }

    if (isset($_GET["serverID"]) && isset($_GET["delete"])) {
        $db->exec("DELETE FROM servers WHERE serverID='$serverID'");
        header("refresh:0; url=?server");
    }

    
    $displayname = "";
    $host = "";
    $port = "";
    $protocol = "";
    $accessKey = "";

    if (isset($_SESSION["server"][$serverID])) {
        $serverData = $_SESSION["server"][$serverID];
        $displayname = $serverData["description"];
        $accessKey = $serverData["access_key"];
        $connection = $serverData["host"];

        $connectionSplit = explode("://", $connection);
        $protocol = $connectionSplit[0];
        $connectionSplit = explode(":", $connectionSplit[1]);
        $host = $connectionSplit[0];
        $port = $connectionSplit[1];
    }

?>

<link rel="stylesheet" href="pages/uiServer/server.css">

<header class="container-fluid">
    <div class="grid">
        <div>
            <button class="outline secondary" data-tooltip="Back" data-placement="bottom" style="float: left; margin-right: 20px;" onclick="window.location.href='./'">
                <i class="fa-solid fa-arrow-left-long"></i>
            </button>
            <h2>Server</h2>
        </div>
        <div style="text-align: right;">
            <input type="search" name="search" placeholder="Search" aria-label="Search" style="width: 50%; margin-right: 10px;"/>
        </div>
    </div>
</header>

<br><br>
<main class="container">
    
    <h3 style="float: left; margin-right: 25px;">Execution server</h3>
    <button class="" style="cursor: pointer;" onclick="window.location.href='?server&serverID=0'">
        <i class="fa-solid fa-plus"></i> Add new server
    </button> 
    <hr>
    <table class="striped">
        <thead>
            <tr>
                <th class="tableFit">ID</th>
                <th style="width: 50%;">Display name</th>
                <th>Connection</th>
                <th>Access Key</th>
                <th class="tableFit">Status</th>
            </tr>
        </thead>
        <tbody id="serverTableBody">
            <?php

            foreach ($_SESSION["server"] as $key => $value) {
                $showedKey = $value['access_key'];
                $showedKey = substr($showedKey, 0, 3)."*****".substr($showedKey, -2);
                ?>
                <tr onclick="window.location.href='?server&serverID=<?=$value['serverID']?>'">
                    <td><?=$value['serverID']?></td>
                    <td><?=$value['description']?></td>
                    <td><?=$value['host']?></td>
                    <td><?=$showedKey?></td>
                    <td id="serverstatus-<?=$value['serverID']?>" style="text-align: center;"><span aria-busy="true"></span></td>
                </tr>
                <?php
            }
            ?>
        </tbody>
    </table>
    <br><hr>

</main>

<dialog id="serverDialog" <?=isset($_GET["serverID"])?"open":""?>>
    <article>
        <header>
            <div style="float: left;">
                <h2><i class="fa-solid fa-server"></i> Add new server</h2>
            </div>
            <div style="text-align: right;">
                <button class="secondary" onclick="window.location.href='?server'"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </header>

        <br>

        <div style="padding-left: 24px; padding-right: 24px;">
            <form method="POST">

                <input type="hidden" name="serverID" id="serverID" value="<?=$serverID?>">

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Display name
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="description" type="text" id="description" placeholder="Display name" value="<?=$displayname?>"/>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Protocol
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <select name="protocol" aria-label="Protocol" id="protocol">
                            <option <?=$protocol!="https"&&$protocol!="http"?"selected":""?> disabled value="">Protocol</option>
                            <option <?=$protocol=="https"?"selected":""?>>https</option>
                            <option <?=$protocol=="http"?"selected":""?>>http</option>
                        </select>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Hostname
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input type="text" name="host" placeholder="Hostname" aria-label="Hostname" id="hostname" value="<?=$host?>">
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Port
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input type="number" name="port" placeholder="Port" aria-label="Port" id="port" min="1" max="65535" step="1" value="<?=$port?>">
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Access Key
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <textarea name="key" rows="3" placeholder="Access Key" aria-label="Access Key" style="resize: none;" id="key"><?=$accessKey?></textarea>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn"></div>
                    <div class="col-sm-8 col-xs-12">
                        <p class="pico-color-red-450 errorMsg"><i class="fa-solid fa-xmark"></i> No connection possible!</p>
                    </div>
                </div>

            </form>

            <hr>

            <div style="float: right;">
                <?php
                if ($serverID > 0) {
                ?>
                <button class="secondary" id="btnServerDelete" onclick="window.location.href='?server&delete&serverID='+<?=$serverID?>"><i class="fa-solid fa-trash"></i> Delete</button>
                <?php
                }
                ?>
                <button class="secondary" id="btnServerFormReset"><i class="fa-solid fa-rotate-left"></i> Reset</button>
                <button id="btnServerAdd" disabled>
                    <?php
                    if ($serverID > 0) {
                    ?>
                    <i class="fa-solid fa-floppy-disk"></i> Save
                    <?php
                    } else {
                    ?>
                    <i class="fa-solid fa-plus"></i> Add
                    <?php
                    }
                    ?>
                    
                </button>
            </div>
        
        </div>
    
    
    </article>
</dialog>

<script src="pages/uiServer/server.js"></script>