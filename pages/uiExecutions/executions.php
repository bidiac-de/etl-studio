<?php
    $selectedServerID = intval(isset($_GET["serverID"]) ? $_GET["serverID"] : 0);
?>

<link rel="stylesheet" href="pages/uiExecutions/executions.css">

<input type="hidden" id="executionServerID" value="<?=$selectedServerID?>">

<header class="container-fluid">
    <div class="grid">
        <div>
            <button class="outline secondary" data-tooltip="Back" data-placement="bottom" style="float: left; margin-right: 20px;" onclick="window.location.href='./'">
                <i class="fa-solid fa-arrow-left-long"></i>
            </button>
            <h2>Execution Log</h2>
        </div>
        <div style="text-align: right;">
            <button class="secondary" id="btnRefreshExecutions">
                <i class="fa-solid fa-arrows-rotate"></i> Refresh
            </button>
        </div>
    </div>
</header>

<br><br>
<main class="container">
    <div class="grid executionFilters">
        <label>
            Server
            <select id="executionServerSelection" aria-label="Server selection"></select>
        </label>
        <label>
            Job
            <select id="executionJobFilter" aria-label="Job filter">
                <option value="">All jobs</option>
            </select>
        </label>
        <label>
            Environment
            <select id="executionEnvFilter" aria-label="Environment filter">
                <option value="">All environments</option>
            </select>
        </label>
        <label>
            Status
            <select id="executionStatusFilter" aria-label="Status filter">
                <option value="">All statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="RUNNING">Running</option>
                <option value="RETRYING">Retrying</option>
            </select>
        </label>
        <label>
            Search
            <input type="search" id="executionSearch" placeholder="Search executions">
        </label>
    </div>

    <hr>

    <table class="striped" id="executionTable">
        <thead>
            <tr>
                <th>Job</th>
                <th>Environment</th>
                <th>Status</th>
                <th>Started</th>
                <th>Finished</th>
                <th>Duration</th>
                <th class="tableFit"></th>
            </tr>
        </thead>
        <tbody id="executionTableBody">
            <tr>
                <td colspan="7"><span aria-busy="true"></span></td>
            </tr>
        </tbody>
    </table>

    <div style="text-align: center; margin-top: 1rem;">
        <button class="secondary" id="btnLoadMore" style="display: none;">Load more</button>
    </div>
</main>

<dialog id="executionDetailDialog">
    <article>
        <header>
            <div class="grid">
                <div>
                    <h2 id="executionDetailTitle">Execution Detail</h2>
                </div>
                <div style="text-align: right;">
                    <button class="secondary" id="btnCloseExecutionDetail"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
        </header>

        <div id="executionDetailInfo"></div>

        <h4>Attempts</h4>
        <table class="striped" id="executionAttemptTable">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Finished</th>
                    <th>Error</th>
                </tr>
            </thead>
            <tbody id="executionAttemptTableBody"></tbody>
        </table>

        <h4>Logs</h4>
        <div class="executionLogArea" id="executionLogArea">
            <em>No logs available.</em>
        </div>

        <footer>
            <button class="secondary" id="btnCloseExecutionDetailFooter">Close</button>
        </footer>
    </article>
</dialog>

<script src="pages/uiExecutions/executions.js"></script>
