<link rel="stylesheet" href="pages/uiDashboard/dashboard.css">

<header class="container-fluid">
    <div class="grid">
        <div>
            <h2>ETL Studio</h2>
        </div>
        <div style="text-align: right;">
            <input type="search" name="search" placeholder="Search" aria-label="Search" style="width: 50%; margin-right: 10px;"/>
            <button class="outline secondary" data-tooltip="Server" data-placement="bottom" onclick="window.location.href='?server';">
                <i class="fa-solid fa-server"></i>
            </button>
            <button class="outline secondary" data-tooltip="User Management" data-placement="bottom">
                <i class="fa-solid fa-user"></i>
            </button>
            <button class="outline secondary" data-tooltip="Settings" data-placement="bottom" onclick="window.location.href='?settings';">
                <i class="fa-solid fa-gear"></i>
            </button>
            <button class="outline secondary" data-tooltip="Logout" data-placement="bottom" onclick="window.location.href='?logout';">
                <i class="fa-solid fa-right-from-bracket"></i>
            </button>
        </div>
    </div>
    
</header>
<br><br>
<main class="container">
    <?php
        if (isset($_SESSION["server"])) {
            $server = $_SESSION["server"];

            if (sizeof($server) > 0) {
                ?>
                <h3 style="float: left; margin-right: 25px;">Jobs</h3>
                <button class="" style="cursor: pointer;" onclick="window.location.href='?job=0'">
                    <i class="fa-solid fa-plus"></i> Add new job
                </button> 
                <hr>
                <table class="striped">
                    <thead>
                        <tr>
                            <th class="tableFit">ID</th>
                            <th style="width: 50%;">Name</th>
                            <th>Created by</th>
                            <th>Date</th>
                            <th class="tableFit"></th>
                        </tr>
                    </thead>
                    <tbody id="jobTableBody">
                        <?php
                        $result = $db->query("SELECT * FROM jobs ORDER BY jobCreated DESC");
                        while($row = $result->fetchArray()) {
                            $dt = new DateTime($row['jobCreated'], new DateTimeZone("UTC"));
                            $dt->setTimezone(new DateTimeZone($timeZone));
                            $createdDate = $dt->format("d.m.Y H:i");
                            ?>
                            <tr onclick="window.location.href='?job=<?=$row['jobID']?>'">
                                <td><?=$row['jobID']?></td>
                                <td><?=$row['jobName']?></td>
                                <td><?=$_SESSION["fullname"]?></td>
                                <td><?=$createdDate?></td>
                                <td><i class="fa-solid fa-chevron-right"></i></td>
                            </tr>
                            <?php
                        }
                        ?>
                    </tbody>
                </table>
                <br><hr>
                <?php
            } else {
                ?>
                <article>
                    <center>
                        <br><br>
                        <i class="fa-solid fa-triangle-exclamation pico-color-pumpkin-300" style="font-size:xxx-large;"></i><br><br>
                        <hgroup>
                            <h3>No server set up!</h3>
                            <p>Can't display something.</p>
                        </hgroup>
                        <br>
                        <button onclick="window.location.href='?server&serverID=0';" class="secondary"><i class="fa-solid fa-plus"></i> Add server</button>
                        <br><br><br>
                    </center>
                    
                </article>
                <?php
            }
            
        }
    ?>

</main>


<script src="pages/uiDashboard/dashboard.js"></script>