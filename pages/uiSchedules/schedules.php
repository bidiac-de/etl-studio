<?php
    $selectedServerID = intval(isset($_GET["serverID"]) ? $_GET["serverID"] : 0);
    $selectedJobID = isset($_GET["jobID"]) ? $_GET["jobID"] : "";
?>

<link rel="stylesheet" href="pages/uiSchedules/schedules.css">

<input type="hidden" id="scheduleServerID" value="<?=$selectedServerID?>">
<input type="hidden" id="scheduleJobID" value="<?=htmlspecialchars($selectedJobID, ENT_QUOTES)?>">

<header class="container-fluid">
    <div class="grid">
        <div>
            <button class="outline secondary" data-tooltip="Back" data-placement="bottom" style="float: left; margin-right: 20px;" onclick="window.location.href='./'">
                <i class="fa-solid fa-arrow-left-long"></i>
            </button>
            <h2>Schedules</h2>
        </div>
        <div style="text-align: right;">
            <button id="btnCreateSchedule">
                <i class="fa-solid fa-plus"></i> Add schedule
            </button>
            <button class="secondary" id="btnRefreshSchedules">
                <i class="fa-solid fa-arrows-rotate"></i> Refresh
            </button>
        </div>
    </div>
</header>

<br><br>
<main class="container">
    <div class="grid scheduleFilters">
        <label>
            Server
            <select id="scheduleServerSelection" aria-label="Server selection"></select>
        </label>
        <label>
            Job
            <select id="scheduleJobSelection" aria-label="Job filter">
                <option value="">All jobs</option>
            </select>
        </label>
        <label>
            Search
            <input type="search" id="scheduleSearch" placeholder="Search schedules">
        </label>
    </div>

    <hr>

    <table class="striped" id="scheduleTable">
        <thead>
            <tr>
                <th>Name</th>
                <th>Job</th>
                <th>Environment</th>
                <th>Trigger</th>
                <th>Status</th>
                <th class="tableFit"></th>
            </tr>
        </thead>
        <tbody id="scheduleTableBody">
            <tr>
                <td colspan="6"><span aria-busy="true"></span></td>
            </tr>
        </tbody>
    </table>
</main>

<dialog id="scheduleDialog">
    <article>
        <header>
            <div class="grid">
                <div>
                    <h2 id="scheduleDialogTitle">Add Schedule</h2>
                </div>
                <div style="text-align: right;">
                    <button class="secondary" id="btnCloseScheduleDialog"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
        </header>

        <input type="hidden" id="scheduleDialogID" value="">

        <fieldset>
            <label>
                Name
                <input id="scheduleName" type="text" placeholder="Schedule name" required>
            </label>

            <label>
                Job
                <select id="scheduleJob" aria-label="Schedule job" required></select>
            </label>

            <div class="grid">
                <label>
                    Environment
                    <select id="scheduleEnvironment" aria-label="Schedule environment" required></select>
                </label>
                <label>
                    Trigger Type
                    <select id="scheduleTriggerType" aria-label="Schedule trigger type" required>
                        <option value="interval">Interval</option>
                        <option value="cron">Cron</option>
                        <option value="date">Date</option>
                    </select>
                </label>
            </div>

            <label>
                <input id="schedulePaused" type="checkbox">
                Start paused
            </label>
        </fieldset>

        <fieldset id="triggerEditorInterval" class="triggerEditor">
            <legend>Interval</legend>
            <div class="grid">
                <label>
                    Every
                    <input id="intervalValue" type="number" min="1" step="1" value="1">
                </label>
                <label>
                    Unit
                    <select id="intervalUnit" aria-label="Interval unit">
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="seconds">Seconds</option>
                    </select>
                </label>
            </div>
            <div class="grid">
                <label>
                    Start Date
                    <input id="intervalStartDate" type="datetime-local">
                </label>
                <label>
                    End Date
                    <input id="intervalEndDate" type="datetime-local">
                </label>
            </div>
            <div class="grid">
                <label>
                    Timezone
                    <input id="intervalTimezone" type="text" placeholder="UTC">
                </label>
                <label>
                    Jitter (seconds)
                    <input id="intervalJitter" type="number" min="1" step="1">
                </label>
            </div>
        </fieldset>

        <fieldset id="triggerEditorCron" class="triggerEditor">
            <legend>Cron</legend>
            <div class="grid">
                <label>Minute<input id="cronMinute" type="text" placeholder="*/5"></label>
                <label>Hour<input id="cronHour" type="text" placeholder="*"></label>
                <label>Day<input id="cronDay" type="text" placeholder="*"></label>
                <label>Month<input id="cronMonth" type="text" placeholder="*"></label>
            </div>
            <div class="grid">
                <label>Day of Week<input id="cronDayOfWeek" type="text" placeholder="mon-fri"></label>
                <label>Second<input id="cronSecond" type="text" placeholder="0"></label>
                <label>Week<input id="cronWeek" type="text"></label>
                <label>Year<input id="cronYear" type="text"></label>
            </div>
            <div class="grid">
                <label>Start Date<input id="cronStartDate" type="datetime-local"></label>
                <label>End Date<input id="cronEndDate" type="datetime-local"></label>
                <label>Timezone<input id="cronTimezone" type="text" placeholder="UTC"></label>
                <label>Jitter (seconds)<input id="cronJitter" type="number" min="1" step="1"></label>
            </div>
        </fieldset>

        <fieldset id="triggerEditorDate" class="triggerEditor">
            <legend>Date</legend>
            <div class="grid">
                <label>
                    Run Date
                    <input id="dateRunDate" type="datetime-local">
                </label>
                <label>
                    Timezone
                    <input id="dateTimezone" type="text" placeholder="UTC">
                </label>
            </div>
        </fieldset>

        <fieldset>
            <legend>Advanced Trigger JSON</legend>
            <small class="fieldDescription">Advanced JSON overrides typed fields when keys overlap.</small>
            <textarea id="scheduleTriggerArgsJson" rows="7" spellcheck="false">{}</textarea>
        </fieldset>

        <footer>
            <button class="secondary" id="btnCancelScheduleDialog">Cancel</button>
            <button id="btnSaveSchedule"><i class="fa-solid fa-floppy-disk"></i> Save</button>
        </footer>
    </article>
</dialog>

<script src="pages/uiSchedules/schedules.js"></script>
