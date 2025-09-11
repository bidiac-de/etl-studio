<?php

    if (isset($_GET["serverID"])) {
        $serverID = $_GET["serverID"];
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
            <h2 id="jobTitle"></h2>
        </div>
        <div style="direction: rtl;">
            <?php
            if ($jobID > 0) {
            ?>
            <button class="outline secondary" data-tooltip="Delete" data-placement="bottom" id="btnDelete" onclick="$('#deleteDialog').attr('open', '');">
                <i class="fa-solid fa-trash"></i>
            </button>
            <button class="outline secondary" data-tooltip="Settings" data-placement="bottom" id="btnSettings">
                <i class="fa-solid fa-gear"></i>
            </button>
            <!--<button class="outline secondary" data-tooltip="Version" data-placement="bottom">
                <i class="fa-solid fa-clock-rotate-left"></i>
            </button>-->
            <button class="outline secondary" data-tooltip="Execute" data-placement="bottom" id="btnExecuteScript">
                <i class="fa-solid fa-play"></i>
            </button>
            <button class="outline secondary" data-tooltip="Console" data-placement="bottom" id="btnOpenConsole">
                <i class="fa-solid fa-terminal"></i>
            </button>
            <button class="outline secondary" data-tooltip="JSON" data-placement="bottom">
                <i class="fa-solid fa-code"></i>
            </button>
            <button class="outline secondary" data-tooltip="Save" data-placement="bottom" disabled>
                <i class="fa-solid fa-floppy-disk"></i>
            </button>
            <button id="openComponentsDialog">
                Add component <i class="fa-solid fa-plus"></i>
            </button>

            <?php
            }
            ?>
            
        </div>
    </div>
</header>

<input type="hidden" value="<?=$jobID?>" id="jobID">
<input type="hidden" value="<?=$serverID?>" id="serverID">

<?php
    if ($jobID > 0) {
        ?>
        <div id="whiteboard-container">
            <div id="whiteboard"></div>
        </div>
        <div id="console">
            <div class="title">
                <span><i class="fa-solid fa-terminal"></i></span>
                <span>Console</span>
            </div>
            <span id="btnCloseConsole"><i class="fa-solid fa-square-xmark"></i></span>
            <textarea id="consoleText" readonly></textarea>
        </div>
        <div id="footer">
            <div class="grid">
                <div class="leftFooter">
                    <span class="btn" id="btnOpenTerminalFooter"><i class="fa-solid fa-terminal"></i></span>
                    <span class="btn">
                        <i class="fa-solid fa-clock-rotate-left" style="margin-right: 5px;"></i>
                        <span id="lastChanged"></span>
                    </span>
                </div>
                <div></div>
                <div style="text-align: right; margin-right: 10px; user-select: none;">
                    <span id="zoomNeutral" style="margin-right: 5px;"><i class="fa-solid fa-expand"></i></span>
                    <span id="zoomDecrement"><i class="fa-solid fa-minus"></i></span>
                    <span id="zoomText">100%</span>
                    <span id="zoomIncrement"><i class="fa-solid fa-plus"></i></span>
                </div>
            </div>
        </div>

        <progress id="jobProgress"></progress>

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
                <div id="componentsTableDiv">
                    <table id="componentsTable"></table>
                </div>
            </article>
        </dialog>

        <dialog id="settingsDialog">
            <article>
                <header>
                    <div class="grid">
                        <div>
                            <h2>Job Settings</h2>
                        </div>
                        <div style="text-align: right;">
                            <input type="search" name="search" placeholder="Search" aria-label="Search" style="width: 75%; margin-right: 10px;"/>
                            <button class="secondary" onclick="$('#settingsDialog').removeAttr('open');"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                </header>
                
                <div id="settingsDialogMain"></div>

                <footer>
                    <button id="btnSaveJobSettings"><i class="fa-solid fa-floppy-disk"></i> Save</button>
                </footer>

            </article>
        </dialog>


        <dialog id="deleteDialog">
            <article>
                <h2>Confirm</h2>
                <p>Are you sure to delete the job? It can't be undone.</p>
                <footer>
                    <button class="secondary" onclick="$('#deleteDialog').removeAttr('open');">Cancel</button>
                    <button id="btnConfirmDelete"><i class="fa-solid fa-trash"></i> Delete</button>
                </footer>
            </article>
        </dialog>



        <script src="pages/uiJob/whiteboard.js"></script>

        <?php
    } else {



        ?>
        <br><br>
        <main class="container">
            <h3><i class="fa-solid fa-diagram-project"></i> Create new job</h3>
            <hr>
            <fieldset>
                <label>
                    Server
                    <select id="newJobServerSelection" name="select" aria-label="Server selection" required>
                        <option selected disabled value="">Select</option>
                        <?php
                            if (isset($_SESSION["server"])) {
                                $server = $_SESSION["server"];
                                foreach ($server as $key => $value) {
                                    ?><option value="<?=$key?>"><?=$value["description"]." (".$value["host"].")"?></option><?php
                                }
                            }
                        ?>
                    </select>
                </label>
                <div id="jobDetailsFieldset"></div>

            </fieldset>
            <button id="newJobSaveButton" disabled><i class="fa-solid fa-floppy-disk"></i> Save</button>
        </main>
        <?php
    }
?>

<script src="pages/uiJob/job.js"></script>