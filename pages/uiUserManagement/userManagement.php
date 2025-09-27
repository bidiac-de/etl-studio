<?php
    $userID = intval(isset($_GET["userID"]) ? $_GET["userID"] : 0);

    $username = "";
    $fullname = "";

    if ($userID > 0) {
        $result = $db->query("SELECT * FROM users WHERE userID='$userID'");
        while($row = $result->fetchArray()) {
            $username = $row["username"];
            $fullname = $row["fullname"];
        }
    }

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
    
    <h3 style="margin-right: 25px; float: left;"><i class="fa-solid fa-users"></i> Users</h3>
    <button style="cursor: pointer;" onclick="window.location.href='?user&userID=0'">
        <i class="fa-solid fa-plus"></i> Add new user
    </button>
    <hr>
    <table class="striped" id="userTable">
        <thead>
            <tr>
                <th class="tableFit"><i class="fa-solid fa-fingerprint"></i> ID</th>
                <th style="width: 30%;"><i class="fa-solid fa-signature"></i> Username</th>
                <th style="width: 30%;">Fullname</th>
                <th id="thLastChange"><i class="fa-solid fa-clock-rotate-left"></i> Last login</th>
                <th class="tableFit"></th>
            </tr>
        </thead>
        <tbody id="userTableBody">
            <?php
                $result = $db->query("SELECT * FROM users ORDER BY userID DESC");
                while($row = $result->fetchArray()) {
                    /*$dt = new DateTime($row['jobCreated'], new DateTimeZone("UTC"));
                    $dt->setTimezone(new DateTimeZone($timeZone));
                    $createdDate = $dt->format("d.m.Y H:i");*/
                    $lastLogin = "01.01.1970 01:00 Uhr";
                    ?>
                    <tr onclick="window.location.href='?user&userID=<?=$row['userID']?>'">
                        <td><?=$row['userID']?></td>
                        <td><?=$row['username']?></td>
                        <td><?=$row["fullname"]?></td>
                        <td><?=$lastLogin?></td>
                        <td><i class="fa-solid fa-chevron-right"></i></td>
                    </tr>
                    <?php
                }
            ?>
        </tbody>
    </table>
    <br><hr>

    <!--<h3 style="margin-right: 25px;"><i class="fa-solid fa-user-group"></i> Groups</h3>
    <hr>
    <br><br><br><br><br>

    <h3 style="margin-right: 25px;"><i class="fa-solid fa-shield"></i> Roles</h3>
    <hr>
    <br><br><br>-->

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

                

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        User ID
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input type="text" name="userID" id="userID" value="<?=$userID?>" readonly="readonly" disabled>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Username
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="username" type="text" id="username" placeholder="Username" value="<?=$username?>"/>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Fullname
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="fullname" type="text" id="fullname" placeholder="Fullname" value="<?=$fullname?>"/>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Password
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="password" type="password" id="password" placeholder="Password" />
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-xs-12 labelColumn">
                        Repeat
                    </div>
                    <div class="col-sm-8 col-xs-12">
                        <input name="password2" type="password" id="password2" placeholder="Repeat" />
                    </div>
                </div>


            </form>

            <hr>

            <div style="float: right;">
                <?php
                if ($userID > 0) {
                ?>
                <button class="secondary" id="btnUserDelete" onclick="window.location.href='?user&delete&userID='+<?=$userID?>"><i class="fa-solid fa-trash"></i> Delete</button>
                <?php
                }
                ?>
                <button id="btnUserAdd">
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