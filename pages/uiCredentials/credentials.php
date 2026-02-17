<?php
    $credentialID = isset($_GET["credentialID"]) ? trim((string)$_GET["credentialID"]) : "0";
    $contextType = isset($_GET["contextType"]) ? $_GET["contextType"] : "";
    $isEditMode = $credentialID !== "" && $credentialID !== "0";
?>

<link rel="stylesheet" href="pages/uiCredentials/credentials.css">

<input type="hidden" value="<?=$contextType?>" id="contextType">
<input type="hidden" value="<?=$credentialID?>" id="credentialID">

<header class="container-fluid">
    <div class="grid">
        <div>
            <button class="outline secondary" data-tooltip="Back" data-placement="bottom" style="float: left; margin-right: 20px;" onclick="window.location.href='./'">
                <i class="fa-solid fa-arrow-left-long"></i>
            </button>
            <h2>Credential Manager</h2>
        </div>
        <div style="text-align: right;">
            <input type="search" name="search" placeholder="Search" aria-label="Search" style="width: 50%; margin-right: 10px;"/>
        </div>
    </div>
</header>

<br><br>
<main class="container">
    
    <h3 style="margin-right: 25px; float: left;"><i class="fa-solid fa-key"></i> Credentials</h3>
    <button style="cursor: pointer;" onclick="window.location.href='?credentials&credentialID=0&contextType=credential'">
        <i class="fa-solid fa-plus"></i> Add new credential
    </button>
    <hr>
    <table class="striped" id="credentialTable">
        <thead>
            <tr>
                <th class="tableFit"><i class="fa-solid fa-fingerprint"></i> ID</th>
                <th><i class="fa-solid fa-key"></i> Name</th>
                <th>Host</th>
                <th>Port</th>
                <th>Database</th>
                <th>User</th>
                <th>Password Set</th>
                <th class="tableFit"></th>
            </tr>
        </thead>
        <tbody id="credentialTableBody"></tbody>
    </table>
    <br><hr>
    <br><br><br>

    <div>
        <h3 style="margin-right: 25px; float: left;"><i class="fa-solid fa-code-merge"></i> Connections Mapping</h3>
        <button style="cursor: pointer;" onclick="window.location.href='?credentials&credentialID=0&contextType=mapping'">
            <i class="fa-solid fa-plus"></i> Add new connection mapping
        </button>
        <hr>
        <table class="striped" id="credentialMappingTable">
            <thead>
                <tr id="credentialMappingTableHeadRow">
                    <th class="tableFit"><i class="fa-solid fa-fingerprint"></i> ID</th>
                    <th><i class="fa-solid fa-signature"></i> Name</th>
                    <th class="tableFit"></th>
                </tr>
            </thead>
            <tbody id="credentialMappingTableBody"></tbody>
        </table>
    </div>
    <br><hr>

</main>

<dialog id="credentialDialog" <?=isset($_GET["credentialID"])?"open":""?>>
    <article>
        <header>
            <div style="float: left;">
                <h2><i class="fa-solid fa-key"></i> <?=$isEditMode?"Show":"Add new"?> credential <?=$contextType == "mapping"? "mapping": ""?></h2>
            </div>
            <div style="text-align: right;">
                <button class="secondary" onclick="window.location.href='?credentials'"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </header>

        <br>

        

        <?php
        if ($contextType == "mapping") {
        ?>

        <div style="padding-left: 24px; padding-right: 24px;" id="formCredentialMapping">
            <form method="POST">

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Server
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <select id="newCredentialMappingServerSelection" aria-label="Server selection" required>
                            <?php
                                if (isset($_SESSION["server"])) {
                                    $server = $_SESSION["server"];
                                    foreach ($server as $key => $value) {
                                        ?><option value="<?=$key?>"><?=$value["description"]." (".$value["host"].")"?></option><?php
                                    }
                                }
                            ?>
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Credential Mapping ID
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input type="text" name="credentialID" id="credentialID" value="<?=$credentialID?>" readonly="readonly" disabled>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Name
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="name" type="text" id="name" placeholder="Name" value=""/>
                    </div>
                </div>

                <div id="credentialMappingEnvironmentFields"></div>

                <div class="row" style="margin-top: 1rem;">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Add Custom Environment
                    </div>
                    <div class="col-sm-8 col-xs-12" style="display: flex; gap: 0.5rem;">
                        <input type="text" id="customEnvironmentInput" placeholder="e.g. STAGING" style="flex: 1;">
                        <button type="button" class="secondary" id="btnAddCustomEnvironment" style="white-space: nowrap;">
                            <i class="fa-solid fa-plus"></i> Add
                        </button>
                    </div>
                </div>

            </form>

            <hr>

            <div style="float: right;">
                <?php
                if ($isEditMode) {
                ?>
                <button class="secondary" id="btnCredentialMappingDelete" onclick="window.location.href='?credentials&delete&credentialID='+<?=$credentialID?>"><i class="fa-solid fa-trash"></i> Delete</button>
                <?php
                } else {
                ?>
                <button id="btnCredentialMappingAdd">
                    <i class="fa-solid fa-plus"></i> Add
                </button>
                <?php
                }
                ?>
                    
                
            </div>
        
        </div>


        <?php
        } else if ($contextType == "credential") {
        ?>



        <div style="padding-left: 24px; padding-right: 24px;" id="formCredential">
            <form method="POST">

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Server
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <select id="newCredentialServerSelection" aria-label="Server selection" required>
                            <?php
                                if (isset($_SESSION["server"])) {
                                    $server = $_SESSION["server"];
                                    foreach ($server as $key => $value) {
                                        ?><option value="<?=$key?>"><?=$value["description"]." (".$value["host"].")"?></option><?php
                                    }
                                }
                            ?>
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Credential ID
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input type="text" name="credentialID" id="credentialID" value="<?=$credentialID?>" readonly="readonly" disabled>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Name
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="name" type="text" id="name" placeholder="Name" value=""/>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Host
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="host" type="text" id="host" placeholder="Host" value=""/>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Port
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="port" type="number" id="port" placeholder="Port" value="3306"/>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Database
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="database" type="text" id="database" placeholder="Database" value=""/>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Username
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="user" type="text" id="user" placeholder="Username" value=""/>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Password
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="password" type="text" id="password" placeholder="Password" value=""/>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Pool max size
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="pool_max_size" type="number" id="pool_max_size" placeholder="Pool max size" value="0"/>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Pool timeout in seconds
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="pool_timeout_s" type="number" id="pool_timeout_s" placeholder="Pool timeout" value="0"/>
                    </div>
                </div>


            </form>

            <hr>

            <div style="float: right;">
                <?php
                if ($isEditMode) {
                ?>
                <button class="secondary" id="btnCredentialDelete" onclick="window.location.href='?credentials&delete&credentialID='+<?=$credentialID?>"><i class="fa-solid fa-trash"></i> Delete</button>
                <?php
                } else {
                ?>
                <button id="btnCredentialAdd">
                    <i class="fa-solid fa-plus"></i> Add
                </button>
                <?php
                }
                ?>
                    
                
            </div>

            <?php
            }
            ?>
        
        </div>
    
    
    </article>
</dialog>

<script src="pages/uiCredentials/credentials.js"></script>
