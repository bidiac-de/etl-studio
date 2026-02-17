(function(root, factory) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = factory(root, true);
    } else {
        factory(root, false);
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function(root, isTestMode) {

    function normalizeServerId(value) {
        var parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    function formatDuration(startedAt, finishedAt) {
        if (!startedAt) {
            return "-";
        }
        var start = new Date(startedAt);
        var end = finishedAt ? new Date(finishedAt) : new Date();
        var diffMs = end - start;
        if (diffMs < 0) {
            return "-";
        }
        if (diffMs < 1000) {
            return diffMs + "ms";
        }
        var totalSeconds = Math.floor(diffMs / 1000);
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;
        if (hours > 0) {
            return hours + "h " + minutes + "m " + seconds + "s";
        }
        if (minutes > 0) {
            return minutes + "m " + seconds + "s";
        }
        return seconds + "s";
    }

    function statusBadgeHTML(status) {
        var cssClass = "executionStatusPill";
        if (status === "SUCCESS" || status === "FAILED" || status === "RUNNING" || status === "RETRYING") {
            cssClass += " executionStatus" + status;
        }
        return "<span class='" + cssClass + "'>" + status + "</span>";
    }

    function formatDateTime(isoString) {
        if (!isoString) {
            return "-";
        }
        var d = new Date(isoString);
        if (Number.isNaN(d.getTime())) {
            return isoString;
        }
        return d.toLocaleString();
    }

    var api = {
        normalizeServerId: normalizeServerId,
        formatDuration: formatDuration,
        statusBadgeHTML: statusBadgeHTML,
        formatDateTime: formatDateTime
    };

    if (isTestMode) {
        return api;
    }

    // --- DOM / Page logic ---

    var selectedServerID = normalizeServerId($("#executionServerID").val());
    var currentExecutions = [];
    var currentJobs = [];
    var currentTotal = 0;
    var currentOffset = 0;
    var PAGE_SIZE = 50;
    var pollTimer = null;

    function serverIds() {
        var ids = [];
        if (typeof server === "undefined" || server == null) {
            return ids;
        }
        for (var key in server) {
            ids.push(normalizeServerId(key));
        }
        ids.sort(function(a, b) { return a - b; });
        return ids;
    }

    function fillServerSelection() {
        var ids = serverIds();
        var html = "";
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            var label = server[id] != undefined ? server[id].description : ("Server " + id);
            var selected = id === selectedServerID ? "selected" : "";
            html += "<option value='" + id + "' " + selected + ">" + label + "</option>";
        }
        $("#executionServerSelection").html(html);
        if (selectedServerID === 0 && ids.length > 0) {
            selectedServerID = ids[0];
            $("#executionServerSelection").val(String(selectedServerID));
        }
    }

    async function fillJobFilter() {
        var jobs = await ETL.api.get(selectedServerID, "/jobs/");
        currentJobs = Array.isArray(jobs) ? jobs : [];
        var html = "<option value=''>All jobs</option>";
        for (var i = 0; i < currentJobs.length; i++) {
            var job = currentJobs[i];
            html += "<option value='" + ETL.render.escapeHTML(job.id) + "'>" + ETL.render.escapeHTML(job.name) + "</option>";
        }
        $("#executionJobFilter").html(html);
    }

    async function fillEnvironmentFilter() {
        var contractReady = await ETL.contract.require(selectedServerID);
        if (!contractReady) {
            return;
        }
        var environments = ETL.contract.getEnvironments(selectedServerID);
        var html = "<option value=''>All environments</option>";
        for (var i = 0; i < environments.length; i++) {
            var env = environments[i];
            html += "<option value='" + ETL.render.escapeHTML(env.value) + "'>" + ETL.render.escapeHTML(env.label || env.value) + "</option>";
        }
        $("#executionEnvFilter").html(html);
    }

    function jobNameById(jobId) {
        for (var i = 0; i < currentJobs.length; i++) {
            if (String(currentJobs[i].id) === String(jobId)) {
                return currentJobs[i].name;
            }
        }
        return jobId;
    }

    function renderExecutionRows() {
        var search = String($("#executionSearch").val() || "").toLowerCase();
        var html = "";
        var rowCount = 0;

        for (var i = 0; i < currentExecutions.length; i++) {
            var item = currentExecutions[i];
            var jobName = jobNameById(item.job_id);

            var textForSearch = (
                String(jobName) + " " +
                String(item.environment || "") + " " +
                String(item.status) + " " +
                String(item.id)
            ).toLowerCase();

            if (search !== "" && textForSearch.indexOf(search) < 0) {
                continue;
            }

            rowCount += 1;
            var duration = formatDuration(item.started_at, item.finished_at);

            html += "<tr>";
            html += "<td>" + ETL.render.escapeHTML(jobName) + "</td>";
            html += "<td>" + ETL.render.escapeHTML(item.environment || "-") + "</td>";
            html += "<td>" + statusBadgeHTML(item.status) + "</td>";
            html += "<td><small>" + ETL.render.escapeHTML(formatDateTime(item.started_at)) + "</small></td>";
            html += "<td><small>" + ETL.render.escapeHTML(formatDateTime(item.finished_at)) + "</small></td>";
            html += "<td><small>" + ETL.render.escapeHTML(duration) + "</small></td>";
            html += "<td class='tableFit'><div class='executionActionRow'>";
            html += "<button class='secondary btnExecutionDetail' data-id='" + ETL.render.escapeHTML(item.id) + "'><i class='fa-solid fa-eye'></i></button>";
            html += "</div></td>";
            html += "</tr>";
        }

        if (rowCount === 0) {
            html = "<tr><td colspan='7'>No executions found.</td></tr>";
        }
        $("#executionTableBody").html(html);

        // Show/hide load more button
        if (currentExecutions.length < currentTotal) {
            $("#btnLoadMore").show();
        } else {
            $("#btnLoadMore").hide();
        }
    }

    async function loadExecutions(append) {
        if (!append) {
            currentOffset = 0;
            currentExecutions = [];
        }

        var params = {
            limit: PAGE_SIZE,
            offset: currentOffset
        };
        var jobId = $("#executionJobFilter").val();
        var envFilter = $("#executionEnvFilter").val();
        var statusFilter = $("#executionStatusFilter").val();

        if (jobId) { params.job_id = jobId; }
        if (envFilter) { params.environment = envFilter; }
        if (statusFilter) { params.status = statusFilter; }

        var queryString = Object.keys(params).map(function(key) {
            return encodeURIComponent(key) + "=" + encodeURIComponent(params[key]);
        }).join("&");

        var result = await ETL.api.get(selectedServerID, "/execution/executions?" + queryString);
        if (result === false) {
            return;
        }

        var rows = result.data || [];
        currentTotal = result.total || 0;

        if (append) {
            currentExecutions = currentExecutions.concat(rows);
        } else {
            currentExecutions = rows;
        }
        currentOffset = currentExecutions.length;

        renderExecutionRows();
        startPollIfNeeded();
    }

    async function openExecutionDetail(executionId) {
        var result = await ETL.api.get(selectedServerID, "/execution/executions/" + executionId);
        if (result === false) {
            return;
        }

        var exec = result.execution;
        var attempts = result.attempts || [];
        var jobName = jobNameById(exec.job_id);

        $("#executionDetailTitle").text("Execution: " + jobName);

        var infoHtml = "<table>";
        infoHtml += "<tr><td><strong>ID</strong></td><td>" + ETL.render.escapeHTML(exec.id) + "</td></tr>";
        infoHtml += "<tr><td><strong>Job</strong></td><td>" + ETL.render.escapeHTML(jobName) + "</td></tr>";
        infoHtml += "<tr><td><strong>Environment</strong></td><td>" + ETL.render.escapeHTML(exec.environment || "-") + "</td></tr>";
        infoHtml += "<tr><td><strong>Status</strong></td><td>" + statusBadgeHTML(exec.status) + "</td></tr>";
        infoHtml += "<tr><td><strong>Started</strong></td><td>" + ETL.render.escapeHTML(formatDateTime(exec.started_at)) + "</td></tr>";
        infoHtml += "<tr><td><strong>Finished</strong></td><td>" + ETL.render.escapeHTML(formatDateTime(exec.finished_at)) + "</td></tr>";
        infoHtml += "<tr><td><strong>Duration</strong></td><td>" + ETL.render.escapeHTML(formatDuration(exec.started_at, exec.finished_at)) + "</td></tr>";
        if (exec.error) {
            infoHtml += "<tr><td><strong>Error</strong></td><td><code>" + ETL.render.escapeHTML(exec.error) + "</code></td></tr>";
        }
        infoHtml += "</table>";
        $("#executionDetailInfo").html(infoHtml);

        // Render attempts
        var attHtml = "";
        for (var i = 0; i < attempts.length; i++) {
            var att = attempts[i];
            attHtml += "<tr>";
            attHtml += "<td>" + att.attempt_index + "</td>";
            attHtml += "<td>" + statusBadgeHTML(att.status) + "</td>";
            attHtml += "<td><small>" + ETL.render.escapeHTML(formatDateTime(att.started_at)) + "</small></td>";
            attHtml += "<td><small>" + ETL.render.escapeHTML(formatDateTime(att.finished_at)) + "</small></td>";
            attHtml += "<td><small>" + ETL.render.escapeHTML(att.error || "-") + "</small></td>";
            attHtml += "</tr>";
        }
        if (attHtml === "") {
            attHtml = "<tr><td colspan='5'>No attempts recorded.</td></tr>";
        }
        $("#executionAttemptTableBody").html(attHtml);

        // Load logs
        await loadExecutionLogs(executionId);

        // If still running, start live polling for this detail
        if (exec.status === "RUNNING" || exec.status === "RETRYING") {
            startDetailPoll(executionId);
        }

        $("#executionDetailDialog").attr("open", "");
    }

    async function loadExecutionLogs(executionId) {
        var logs = await ETL.api.get(selectedServerID, "/execution/executions/" + executionId + "/logs?tail=200");
        if (logs === false || !logs.lines || logs.lines.length === 0) {
            $("#executionLogArea").html("<em>No logs available.</em>");
            return;
        }
        var logHtml = "";
        for (var i = 0; i < logs.lines.length; i++) {
            logHtml += ETL.render.escapeHTML(logs.lines[i]) + "\n";
        }
        $("#executionLogArea").html(logHtml);
        // Auto-scroll to bottom
        var logArea = document.getElementById("executionLogArea");
        if (logArea) {
            logArea.scrollTop = logArea.scrollHeight;
        }
    }

    var detailPollTimer = null;

    function startDetailPoll(executionId) {
        stopDetailPoll();
        detailPollTimer = setInterval(async function() {
            await loadExecutionLogs(executionId);
            // Also refresh the progress
            var progress = await ETL.api.get(selectedServerID, "/execution/executions/" + executionId + "/progress");
            if (progress !== false && (progress.status === "SUCCESS" || progress.status === "FAILED")) {
                stopDetailPoll();
                await openExecutionDetail(executionId);
            }
        }, 3000);
    }

    function stopDetailPoll() {
        if (detailPollTimer) {
            clearInterval(detailPollTimer);
            detailPollTimer = null;
        }
    }

    function startPollIfNeeded() {
        stopPoll();
        var hasRunning = false;
        for (var i = 0; i < currentExecutions.length; i++) {
            if (currentExecutions[i].status === "RUNNING" || currentExecutions[i].status === "RETRYING") {
                hasRunning = true;
                break;
            }
        }
        if (hasRunning) {
            pollTimer = setInterval(function() {
                loadExecutions(false);
            }, 3000);
        }
    }

    function stopPoll() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    async function initPage() {
        if ($("#executionServerSelection").length === 0) {
            return;
        }

        fillServerSelection();
        if (selectedServerID === 0 && serverIds().length > 0) {
            selectedServerID = serverIds()[0];
        }
        $("#executionServerSelection").val(String(selectedServerID));

        await fillJobFilter();
        await fillEnvironmentFilter();
        await loadExecutions(false);

        // Event listeners
        $("#executionServerSelection").on("change", async function() {
            selectedServerID = normalizeServerId($(this).val());
            await fillJobFilter();
            await fillEnvironmentFilter();
            await loadExecutions(false);
        });

        $("#executionJobFilter, #executionEnvFilter, #executionStatusFilter").on("change", function() {
            loadExecutions(false);
        });

        $("#executionSearch").on("input", renderExecutionRows);

        $("#btnRefreshExecutions").on("click", function() {
            loadExecutions(false);
        });

        $("#btnLoadMore").on("click", function() {
            loadExecutions(true);
        });

        $(document).on("click", ".btnExecutionDetail", function() {
            var execId = $(this).attr("data-id");
            openExecutionDetail(execId);
        });

        $("#btnCloseExecutionDetail, #btnCloseExecutionDetailFooter").on("click", function(event) {
            event.preventDefault();
            stopDetailPoll();
            $("#executionDetailDialog").removeAttr("open");
        });
    }

    $(initPage);

    return api;
});
