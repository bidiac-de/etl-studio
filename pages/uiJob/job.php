<?php

    $jobName = "";

    if ($jobID > 0) {

        $jobID = intval($jobID);

        if (isset($_GET["delete"])) {

            $result = $db->query("DELETE FROM jobs WHERE jobID='$jobID'");
            header("refresh:0; url=?job=$jobID");

        } else {
            $result = $db->query("SELECT * FROM jobs WHERE jobID='$jobID'");

            $resultArray = $result->fetchArray();
            if ($resultArray) {
                $jobName = $resultArray["jobName"];
                $dt = new DateTime($resultArray['jobCreated'], new DateTimeZone("UTC"));
                $dt->setTimezone(new DateTimeZone($timeZone));
                $jobCreated = $dt->format("d.m.Y H:i:s");
            } else {
                header("refresh:0; url=./");
            }
        }
    }

?>


<link rel="stylesheet" href="pages/uiJob/job.css">

<header class="container-fluid" style="z-index: 99;">
    <div class="grid">
        <div>
            <button class="outline secondary" data-tooltip="Back" data-placement="bottom" style="float: left; margin-right: 20px;" onclick="window.location.href='./'">
                <i class="fa-solid fa-arrow-left-long"></i>
            </button>
            <h2 style="float: left;">Job</h2>
            <?php
                if ($jobName != "") {
                    ?>
                    <h2>: <?=$jobName?></h2>
                    <?php
                }
            ?>
        </div>
        <div style="direction: rtl;">
            <?php
            if ($jobID > 0) {
            ?>
            <button class="outline secondary" data-tooltip="Delete" data-placement="bottom" id="btnDelete" onclick="window.location.href+='&delete'">
                <i class="fa-solid fa-trash"></i>
            </button>
            <button class="outline secondary" data-tooltip="Settings" data-placement="bottom">
                <i class="fa-solid fa-gear"></i>
            </button>
            <button class="outline secondary" data-tooltip="Version" data-placement="bottom">
                <i class="fa-solid fa-clock-rotate-left"></i>
            </button>
            <button class="outline secondary" data-tooltip="Execute" data-placement="bottom">
                <i class="fa-solid fa-play"></i>
            </button>
            <button class="outline secondary" data-tooltip="JSON" data-placement="bottom">
                <i class="fa-solid fa-code"></i>
            </button>
            <button class="outline secondary" data-tooltip="Save" data-placement="bottom" disabled>
                <i class="fa-solid fa-floppy-disk"></i>
            </button>
            <button onclick="$('#componentDialog').attr('open', '');">
                Add component <i class="fa-solid fa-plus"></i>
            </button>

            <?php
            }
            ?>
            
        </div>
    </div>
</header>

<?php
    if ($jobID > 0) {
        ?>
        <div id="whiteboard-container">
            <div id="whiteboard"></div>
        </div>
        <div id="footer">
            <div class="grid">
                <div>
                    <div class="connectionLamp"></div>
                    <span>Execution server online</span>
                </div>
                <div>
                    
                </div>
                <div style="text-align: right; margin-right: 20px;">
                    <span>current version: <?=$jobCreated?></span>
                </div>
            </div>
        </div>

        <dialog id="componentDialog">
            <article>
                <header>
                    <div class="grid">
                        <div>
                            <h2>Components</h2>
                        </div>
                        <div style="text-align: right;">
                            <input type="search" name="search" placeholder="Search" aria-label="Search" style="width: 75%; margin-right: 10px;"/>
                            <button class="secondary" onclick="$('#componentDialog').removeAttr('open');"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                </header>    

                <br>
                <h3>Default components</h3>
                <hr>

                <table id="componentsTable">
                    <?php

                    function printComponentListElement($name, $level = 0) {
                        $style = $level == 0 ? "" : "style='padding-left: ".($level*32)."px'";
                        $extra = $level == 0 ? "" : "&#8627;&nbsp;&nbsp;&nbsp;";
                        ?>
                        <tr>
                            <td <?=$style?>><?=$extra.$name?></td>
                            <td>
                                <button class="secondary"><i class="fa-solid fa-sliders"></i> Custom</button>
                                <button><i class="fa-solid fa-plus"></i> Add</button>
                            </td>
                        </tr>
                        <?php
                    }

                    function printComponentListElementHeader($name, $level = 0) {
                        ?>
                        <tr>
                            <td><b><?=$name?></b></td>
                            <td></td>
                        </tr>
                        <?php
                    }

                    foreach ($availableComponents as $key => $value) {
                        if (is_array($value)) {
                            printComponentListElementHeader($key);
                            foreach ($value as $key2 => $value2) {
                                printComponentListElement($value2, 1);
                            }
                        } else {
                            printComponentListElement($value);
                        }
                    }
                    ?>
                </table>

                <h3>Custom components</h3>
                <hr>
                
                
            </article>
        </dialog>

        <script src="https://cdn.jsdelivr.net/npm/drawflow/dist/drawflow.min.js"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/drawflow/dist/drawflow.min.css" />
        <script src="pages/uiJob/whiteboard.drawflow.init.js"></script>

        <?php
    } else {

        if (isset($_POST["jobname"])) {
            $jobName = $db->escapeString($_POST["jobname"]);
            $jonCreatedBy = $db->escapeString($_POST["jobcreatedby"]);

            $result = $db->query("INSERT INTO jobs (jobName) VALUES ('$jobName')");
            $jobID = $db->lastInsertRowID();

            if ($jobID > 0) {
                header("refresh:0; url=?job=$jobID");
            } else {

            }
            /*print_r($result);
            print_r($result->fetchArray());*/

        }

        ?>
        <br><br>
        <main class="container">
            <h3>Create new job</h3>
            <hr>
            <form method="POST" action="?job=0" onsubmit="$(this).find('input').prop('disabled', false)">
                <fieldset>
                    <label>
                        Job name
                        <input name="jobname"/>
                    </label>
                    <label>
                        Created by
                        <input name="jobcreatedby" value="<?=$_SESSION["fullname"]?>" disabled />
                    </label>
                </fieldset>
                <button><i class="fa-solid fa-floppy-disk"></i> Save</button>
            </form>
            
        </main>
        <?php
    }
?>

<script src="pages/uiJob/job.js"></script>