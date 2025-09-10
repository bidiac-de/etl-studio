<?php
    $userID = intval(isset($_GET["userID"]) ? $_GET["userID"] : 0);

?>

<link rel="stylesheet" href="pages/uiUserManagement/userManagement.css">

<header class="container-fluid">
    <div class="grid">
        <div>
            <button class="outline secondary" data-tooltip="Back" data-placement="bottom" style="float: left; margin-right: 20px;" onclick="window.location.href='./'">
                <i class="fa-solid fa-arrow-left-long"></i>
            </button>
            <h2>User Management</h2>
        </div>
        <div style="text-align: right;">
            <input type="search" name="search" placeholder="Search" aria-label="Search" style="width: 50%; margin-right: 10px;"/>
        </div>
    </div>
</header>

<br><br>
<main class="container">
    
    <h3 style="margin-right: 25px;"><i class="fa-solid fa-users"></i> Users</h3><br><br><br><br><br>

    <h3 style="margin-right: 25px;"><i class="fa-solid fa-user-group"></i> Groups</h3><br><br><br><br><br>

    <h3 style="margin-right: 25px;"><i class="fa-solid fa-shield"></i> Roles</h3><br><br><br>

</main>

<dialog id="userDialog" <?=isset($_GET["userID"])?"open":""?>>
    <article>
        <header>
            <div style="float: left;">
                <h2><i class="fa-solid fa-server"></i> <?=$userID>0?"Edit":"Add new"?> user</h2>
            </div>
            <div style="text-align: right;">
                <button class="secondary" onclick="window.location.href='?user'"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </header>

        <br>

        <div style="padding-left: 24px; padding-right: 24px;">
            <form method="POST">

                <input type="hidden" name="userID" id="serverID" value="<?=$userID?>">

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Display name
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="description" type="text" id="description" placeholder="Display name" value=""/>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Protocol
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <select name="protocol" aria-label="Protocol" id="protocol">
                            <option disabled value="">Protocol</option>
                            <option>https</option>
                            <option>http</option>
                        </select>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Hostname
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input type="text" name="host" placeholder="Hostname" aria-label="Hostname" id="hostname" value="">
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Port
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input type="number" name="port" placeholder="Port" aria-label="Port" id="port" min="1" max="65535" step="1" value="">
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Access Key
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <textarea name="key" rows="3" placeholder="Access Key" aria-label="Access Key" style="resize: none;" id="key"></textarea>
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
                if ($userID > 0) {
                ?>
                <button class="secondary" id="btnServerDelete" onclick="window.location.href='?user&delete&userID='+<?=$userID?>"><i class="fa-solid fa-trash"></i> Delete</button>
                <?php
                }
                ?>
                <button class="secondary" id="btnServerFormReset"><i class="fa-solid fa-rotate-left"></i> Reset</button>
                <button id="btnServerAdd" disabled>
                    <?php
                    if ($userID > 0) {
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

<script src="pages/uiUserManagement/userManagement.js"></script>