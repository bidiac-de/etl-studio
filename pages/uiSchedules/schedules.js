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

    function parseJsonObject(raw) {
        var text = typeof raw === "string" ? raw.trim() : "";
        if (text === "") {
            return {};
        }
        var parsed = JSON.parse(text);
        if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("Advanced trigger JSON must be an object.");
        }
        return parsed;
    }

    function mergeTriggerArgs(typedArgs, advancedArgs) {
        var merged = {};
        var typed = typedArgs || {};
        var advanced = advancedArgs || {};
        for (var key in typed) {
            merged[key] = typed[key];
        }
        for (var key2 in advanced) {
            merged[key2] = advanced[key2];
        }
        return merged;
    }

    function triggerKnownKeys(triggerType) {
        if (triggerType === "interval") {
            return [
                "weeks",
                "days",
                "hours",
                "minutes",
                "seconds",
                "start_date",
                "end_date",
                "timezone",
                "jitter"
            ];
        }
        if (triggerType === "cron") {
            return [
                "year",
                "month",
                "day",
                "week",
                "day_of_week",
                "hour",
                "minute",
                "second",
                "start_date",
                "end_date",
                "timezone",
                "jitter"
            ];
        }
        if (triggerType === "date") {
            return ["run_date", "date", "timezone"];
        }
        return [];
    }

    function splitAdvancedArgs(triggerType, triggerArgs) {
        var known = triggerKnownKeys(triggerType);
        var typed = {};
        var advanced = {};
        var args = triggerArgs || {};
        for (var key in args) {
            if (known.indexOf(key) >= 0) {
                typed[key] = args[key];
            } else {
                advanced[key] = args[key];
            }
        }
        return {
            typed: typed,
            advanced: advanced
        };
    }

    function buildTypedTriggerArgs(triggerType, values) {
        var args = {};
        if (triggerType === "interval") {
            var unit = values.intervalUnit || "minutes";
            var amount = parseInt(values.intervalValue, 10);
            if (Number.isNaN(amount) || amount <= 0) {
                throw new Error("Interval value must be greater than 0.");
            }
            args[unit] = amount;
            if (values.intervalStartDate) {
                args.start_date = values.intervalStartDate;
            }
            if (values.intervalEndDate) {
                args.end_date = values.intervalEndDate;
            }
            if (values.intervalTimezone) {
                args.timezone = values.intervalTimezone;
            }
            if (values.intervalJitter) {
                var intervalJitter = parseInt(values.intervalJitter, 10);
                if (!Number.isNaN(intervalJitter) && intervalJitter > 0) {
                    args.jitter = intervalJitter;
                }
            }
            return args;
        }

        if (triggerType === "cron") {
            var cronFields = [
                "year",
                "month",
                "day",
                "week",
                "day_of_week",
                "hour",
                "minute",
                "second"
            ];
            var hasScheduleField = false;
            for (var i = 0; i < cronFields.length; i++) {
                var field = cronFields[i];
                var inputName = "cron" + field.split("_").map(function(part) {
                    return part.charAt(0).toUpperCase() + part.slice(1);
                }).join("");
                var value = values[inputName];
                if (value !== undefined && String(value).trim() !== "") {
                    args[field] = String(value).trim();
                    hasScheduleField = true;
                }
            }
            if (!hasScheduleField) {
                throw new Error("Cron trigger requires at least one scheduling field.");
            }
            if (values.cronStartDate) {
                args.start_date = values.cronStartDate;
            }
            if (values.cronEndDate) {
                args.end_date = values.cronEndDate;
            }
            if (values.cronTimezone) {
                args.timezone = values.cronTimezone;
            }
            if (values.cronJitter) {
                var cronJitter = parseInt(values.cronJitter, 10);
                if (!Number.isNaN(cronJitter) && cronJitter > 0) {
                    args.jitter = cronJitter;
                }
            }
            return args;
        }

        if (triggerType === "date") {
            if (!values.dateRunDate || String(values.dateRunDate).trim() === "") {
                throw new Error("Date trigger requires a run date.");
            }
            args.run_date = values.dateRunDate;
            if (values.dateTimezone) {
                args.timezone = values.dateTimezone;
            }
            return args;
        }

        return args;
    }

    function summarizeTrigger(triggerType, triggerArgs) {
        var args = triggerArgs || {};
        if (triggerType === "interval") {
            var intervalUnits = ["weeks", "days", "hours", "minutes", "seconds"];
            for (var i = 0; i < intervalUnits.length; i++) {
                var unit = intervalUnits[i];
                if (args[unit] != undefined) {
                    return "Every " + args[unit] + " " + unit;
                }
            }
        }
        if (triggerType === "cron") {
            return [
                args.minute || "*",
                args.hour || "*",
                args.day || "*",
                args.month || "*",
                args.day_of_week || "*"
            ].join(" ");
        }
        if (triggerType === "date") {
            return args.run_date || args.date || "-";
        }
        return "-";
    }

    var api = {
        normalizeServerId: normalizeServerId,
        parseJsonObject: parseJsonObject,
        mergeTriggerArgs: mergeTriggerArgs,
        splitAdvancedArgs: splitAdvancedArgs,
        buildTypedTriggerArgs: buildTypedTriggerArgs,
        summarizeTrigger: summarizeTrigger
    };

    if (isTestMode) {
        return api;
    }

    var selectedServerID = normalizeServerId($("#scheduleServerID").val());
    var initialJobID = String($("#scheduleJobID").val() || "");
    var schedulesById = {};
    var currentJobs = [];
    var currentEnvironments = [];
    var currentSchedules = [];

    function serverIds() {
        var ids = [];
        if (typeof server === "undefined" || server == null) {
            return ids;
        }
        for (var key in server) {
            ids.push(normalizeServerId(key));
        }
        ids.sort(function(a, b) {
            return a - b;
        });
        return ids;
    }

    function toDateTimeLocal(value) {
        if (typeof value !== "string" || value.trim() === "") {
            return "";
        }
        var normalized = value.trim();
        if (normalized.indexOf(" ") > -1 && normalized.indexOf("T") === -1) {
            normalized = normalized.replace(" ", "T");
        }
        if (normalized.length >= 16 && normalized.indexOf("Z") === -1 && normalized.indexOf("+") === -1) {
            return normalized.slice(0, 16);
        }
        var dateObj = new Date(normalized);
        if (Number.isNaN(dateObj.getTime())) {
            return "";
        }
        var year = dateObj.getFullYear();
        var month = String(dateObj.getMonth() + 1).padStart(2, "0");
        var day = String(dateObj.getDate()).padStart(2, "0");
        var hours = String(dateObj.getHours()).padStart(2, "0");
        var minutes = String(dateObj.getMinutes()).padStart(2, "0");
        return year + "-" + month + "-" + day + "T" + hours + ":" + minutes;
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
        $("#scheduleServerSelection").html(html);
        if (selectedServerID === 0 && ids.length > 0) {
            selectedServerID = ids[0];
            $("#scheduleServerSelection").val(String(selectedServerID));
        }
    }

    function fillEnvironmentSelect() {
        var html = "";
        for (var i = 0; i < currentEnvironments.length; i++) {
            var item = currentEnvironments[i];
            var value = item.value || "";
            var label = item.label || value;
            html += "<option value='" + ETL.render.escapeHTML(value) + "'>" + ETL.render.escapeHTML(label) + "</option>";
        }
        $("#scheduleEnvironment").html(html);
    }

    function fillJobSelects() {
        var filterHtml = "<option value=''>All jobs</option>";
        var dialogHtml = "";

        for (var i = 0; i < currentJobs.length; i++) {
            var job = currentJobs[i];
            var selected = initialJobID !== "" && String(job.id) === String(initialJobID) ? "selected" : "";
            var option = "<option value='" + ETL.render.escapeHTML(job.id) + "' " + selected + ">" + ETL.render.escapeHTML(job.name) + "</option>";
            filterHtml += option;
            dialogHtml += option;
        }

        $("#scheduleJobSelection").html(filterHtml);
        $("#scheduleJob").html(dialogHtml);

        if (initialJobID !== "") {
            $("#scheduleJobSelection").val(initialJobID);
            $("#scheduleJob").val(initialJobID);
        }
    }

    function scheduleStateLabel(item) {
        if (item.is_paused) {
            return "<span class='scheduleStatusPill scheduleStatusPaused'>Paused</span>";
        }
        return "<span class='scheduleStatusPill'>Active</span>";
    }

    function renderScheduleRows() {
        var filterJobID = String($("#scheduleJobSelection").val() || "");
        var search = String($("#scheduleSearch").val() || "").toLowerCase();
        var html = "";
        var rowsRendered = 0;

        schedulesById = {};
        for (var i = 0; i < currentSchedules.length; i++) {
            var item = currentSchedules[i];
            schedulesById[item.id] = item;
            if (filterJobID !== "" && String(item.job_id) !== filterJobID) {
                continue;
            }

            var jobName = item.job_id;
            for (var j = 0; j < currentJobs.length; j++) {
                if (String(currentJobs[j].id) === String(item.job_id)) {
                    jobName = currentJobs[j].name;
                    break;
                }
            }

            var textForSearch = (
                String(item.name) + " " +
                String(jobName) + " " +
                String(item.environment) + " " +
                String(item.trigger_type)
            ).toLowerCase();

            if (search !== "" && textForSearch.indexOf(search) < 0) {
                continue;
            }

            rowsRendered += 1;
            var triggerSummary = summarizeTrigger(item.trigger_type, item.trigger_args);
            var pauseBtn = item.is_paused
                ? "<button class='secondary btnScheduleAction' data-action='resume' data-id='" + ETL.render.escapeHTML(item.id) + "'><i class='fa-solid fa-play'></i></button>"
                : "<button class='secondary btnScheduleAction' data-action='pause' data-id='" + ETL.render.escapeHTML(item.id) + "'><i class='fa-solid fa-pause'></i></button>";

            html += "<tr>";
            html += "<td>" + ETL.render.escapeHTML(item.name) + "</td>";
            html += "<td>" + ETL.render.escapeHTML(jobName) + "</td>";
            html += "<td>" + ETL.render.escapeHTML(item.environment) + "</td>";
            html += "<td><small>" + ETL.render.escapeHTML(item.trigger_type + " - " + triggerSummary) + "</small></td>";
            html += "<td>" + scheduleStateLabel(item) + "</td>";
            html += "<td class='tableFit'><div class='scheduleActionRow'>";
            html += "<button class='secondary btnScheduleAction' data-action='edit' data-id='" + ETL.render.escapeHTML(item.id) + "'><i class='fa-solid fa-pen'></i></button>";
            html += pauseBtn;
            html += "<button class='secondary btnScheduleAction' data-action='run' data-id='" + ETL.render.escapeHTML(item.id) + "'><i class='fa-solid fa-bolt'></i></button>";
            html += "<button class='pico-background-red-550 btnScheduleAction' data-action='delete' data-id='" + ETL.render.escapeHTML(item.id) + "'><i class='fa-solid fa-trash'></i></button>";
            html += "</div></td>";
            html += "</tr>";
        }

        if (rowsRendered === 0) {
            html = "<tr><td colspan='6'>No schedules found for this filter.</td></tr>";
        }
        $("#scheduleTableBody").html(html);
    }

    function resetTriggerEditors() {
        var ids = [
            "#intervalValue",
            "#intervalUnit",
            "#intervalStartDate",
            "#intervalEndDate",
            "#intervalTimezone",
            "#intervalJitter",
            "#cronMinute",
            "#cronHour",
            "#cronDay",
            "#cronMonth",
            "#cronDayOfWeek",
            "#cronSecond",
            "#cronWeek",
            "#cronYear",
            "#cronStartDate",
            "#cronEndDate",
            "#cronTimezone",
            "#cronJitter",
            "#dateRunDate",
            "#dateTimezone"
        ];
        for (var i = 0; i < ids.length; i++) {
            $(ids[i]).val("");
        }
        $("#intervalValue").val("1");
        $("#intervalUnit").val("minutes");
    }

    function showTriggerEditor(triggerType) {
        $(".triggerEditor").hide();
        if (triggerType === "interval") {
            $("#triggerEditorInterval").show();
        } else if (triggerType === "cron") {
            $("#triggerEditorCron").show();
        } else {
            $("#triggerEditorDate").show();
        }
    }

    function readTypedInputs() {
        return {
            intervalValue: $("#intervalValue").val(),
            intervalUnit: $("#intervalUnit").val(),
            intervalStartDate: $("#intervalStartDate").val(),
            intervalEndDate: $("#intervalEndDate").val(),
            intervalTimezone: $("#intervalTimezone").val(),
            intervalJitter: $("#intervalJitter").val(),
            cronMinute: $("#cronMinute").val(),
            cronHour: $("#cronHour").val(),
            cronDay: $("#cronDay").val(),
            cronMonth: $("#cronMonth").val(),
            cronDayOfWeek: $("#cronDayOfWeek").val(),
            cronSecond: $("#cronSecond").val(),
            cronWeek: $("#cronWeek").val(),
            cronYear: $("#cronYear").val(),
            cronStartDate: $("#cronStartDate").val(),
            cronEndDate: $("#cronEndDate").val(),
            cronTimezone: $("#cronTimezone").val(),
            cronJitter: $("#cronJitter").val(),
            dateRunDate: $("#dateRunDate").val(),
            dateTimezone: $("#dateTimezone").val()
        };
    }

    function fillTypedInputs(triggerType, typedArgs) {
        var args = typedArgs || {};
        if (triggerType === "interval") {
            var unitCandidates = ["weeks", "days", "hours", "minutes", "seconds"];
            for (var i = 0; i < unitCandidates.length; i++) {
                var unit = unitCandidates[i];
                if (args[unit] != undefined) {
                    $("#intervalUnit").val(unit);
                    $("#intervalValue").val(String(args[unit]));
                    break;
                }
            }
            $("#intervalStartDate").val(toDateTimeLocal(args.start_date));
            $("#intervalEndDate").val(toDateTimeLocal(args.end_date));
            $("#intervalTimezone").val(args.timezone || "");
            $("#intervalJitter").val(args.jitter != undefined ? String(args.jitter) : "");
            return;
        }

        if (triggerType === "cron") {
            $("#cronMinute").val(args.minute || "");
            $("#cronHour").val(args.hour || "");
            $("#cronDay").val(args.day || "");
            $("#cronMonth").val(args.month || "");
            $("#cronDayOfWeek").val(args.day_of_week || "");
            $("#cronSecond").val(args.second || "");
            $("#cronWeek").val(args.week || "");
            $("#cronYear").val(args.year || "");
            $("#cronStartDate").val(toDateTimeLocal(args.start_date));
            $("#cronEndDate").val(toDateTimeLocal(args.end_date));
            $("#cronTimezone").val(args.timezone || "");
            $("#cronJitter").val(args.jitter != undefined ? String(args.jitter) : "");
            return;
        }

        if (triggerType === "date") {
            $("#dateRunDate").val(toDateTimeLocal(args.run_date || args.date));
            $("#dateTimezone").val(args.timezone || "");
        }
    }

    function openScheduleDialog(item) {
        $("#scheduleDialogID").val(item ? item.id : "");
        $("#scheduleDialogTitle").text(item ? "Edit Schedule" : "Add Schedule");
        $("#scheduleName").val(item ? item.name : "");
        $("#scheduleJob").val(item ? item.job_id : ($("#scheduleJob option:first").val() || ""));
        $("#schedulePaused").prop("checked", item ? !!item.is_paused : false);

        var triggerType = item ? item.trigger_type : "interval";
        $("#scheduleTriggerType").val(triggerType);
        showTriggerEditor(triggerType);
        resetTriggerEditors();

        if (item) {
            $("#scheduleEnvironment").val(item.environment);
            var split = splitAdvancedArgs(triggerType, item.trigger_args || {});
            fillTypedInputs(triggerType, split.typed);
            $("#scheduleTriggerArgsJson").val(JSON.stringify(split.advanced, null, 2));
        } else {
            $("#scheduleTriggerArgsJson").val("{}");
        }
        $("#scheduleDialog").attr("open", "");
    }

    function closeScheduleDialog() {
        $("#scheduleDialog").removeAttr("open");
    }

    async function loadServerData(serverID) {
        var contractReady = await ETL.contract.require(serverID);
        if (!contractReady) {
            return false;
        }

        currentEnvironments = ETL.contract.getEnvironments(serverID);
        fillEnvironmentSelect();

        var jobs = await ETL.api.get(serverID, "/jobs/");
        currentJobs = Array.isArray(jobs) ? jobs : [];
        fillJobSelects();

        var schedules = await ETL.api.get(serverID, "/schedules/");
        currentSchedules = Array.isArray(schedules) ? schedules : [];
        renderScheduleRows();
        return true;
    }

    async function saveSchedule() {
        var scheduleID = String($("#scheduleDialogID").val() || "");
        var payload = {
            name: String($("#scheduleName").val() || "").trim(),
            job_id: String($("#scheduleJob").val() || ""),
            environment: String($("#scheduleEnvironment").val() || ""),
            trigger_type: String($("#scheduleTriggerType").val() || ""),
            trigger_args: {},
            paused: $("#schedulePaused").prop("checked") === true
        };

        if (payload.name === "" || payload.job_id === "" || payload.environment === "") {
            ETL.util.alert("Invalid Input", "Name, job, and environment are required.");
            return;
        }

        var typedValues = readTypedInputs();
        var typedArgs;
        var advancedArgs;
        try {
            typedArgs = buildTypedTriggerArgs(payload.trigger_type, typedValues);
            advancedArgs = parseJsonObject($("#scheduleTriggerArgsJson").val());
        } catch (error) {
            ETL.util.alert("Invalid Trigger", ETL.render.escapeHTML(String(error.message || error)));
            return;
        }

        payload.trigger_args = mergeTriggerArgs(typedArgs, advancedArgs);

        $("#btnSaveSchedule").prop("disabled", true);
        var result = false;
        if (scheduleID === "") {
            result = await ETL.api.post(selectedServerID, "/schedules/", payload, true);
        } else {
            result = await ETL.api.put(selectedServerID, "/schedules/" + scheduleID, payload, true);
        }
        $("#btnSaveSchedule").prop("disabled", false);

        if (result !== false) {
            closeScheduleDialog();
            await loadServerData(selectedServerID);
        }
    }

    async function handleScheduleAction(action, scheduleID) {
        if (!scheduleID) {
            return;
        }
        if (action === "edit") {
            openScheduleDialog(schedulesById[scheduleID]);
            return;
        }

        if (action === "delete") {
            if (!window.confirm("Delete this schedule?")) {
                return;
            }
            var deleted = await ETL.api.delete(selectedServerID, "/schedules/" + scheduleID, true);
            if (deleted) {
                await loadServerData(selectedServerID);
            }
            return;
        }

        if (action === "pause" || action === "resume") {
            var endpoint = "/schedules/" + scheduleID + "/" + action;
            var toggled = await ETL.api.post(selectedServerID, endpoint, {}, true);
            if (toggled !== false) {
                await loadServerData(selectedServerID);
            }
            return;
        }

        if (action === "run") {
            var started = await ETL.api.post(selectedServerID, "/schedules/" + scheduleID + "/run-now", {}, true);
            if (started !== false) {
                ETL.util.alert("<i class='fa-solid fa-bolt pico-color-green-500'></i> Triggered", "Schedule triggered successfully.");
            }
        }
    }

    async function initPage() {
        if ($("#scheduleServerSelection").length === 0) {
            return;
        }

        fillServerSelection();
        if (selectedServerID === 0 && serverIds().length > 0) {
            selectedServerID = serverIds()[0];
        }
        $("#scheduleServerSelection").val(String(selectedServerID));

        await loadServerData(selectedServerID);

        $("#scheduleServerSelection").on("change", async function() {
            selectedServerID = normalizeServerId($(this).val());
            initialJobID = "";
            await loadServerData(selectedServerID);
        });

        $("#scheduleJobSelection").on("change", renderScheduleRows);
        $("#scheduleSearch").on("input", renderScheduleRows);
        $("#btnRefreshSchedules").on("click", async function() {
            await loadServerData(selectedServerID);
        });
        $("#btnCreateSchedule").on("click", function() {
            openScheduleDialog(null);
        });

        $("#scheduleTriggerType").on("change", function() {
            showTriggerEditor(String($(this).val() || "interval"));
        });

        $("#btnCloseScheduleDialog, #btnCancelScheduleDialog").on("click", function(event) {
            event.preventDefault();
            closeScheduleDialog();
        });

        $("#btnSaveSchedule").on("click", async function(event) {
            event.preventDefault();
            await saveSchedule();
        });

        $(document).on("click", ".btnScheduleAction", async function() {
            var action = $(this).attr("data-action");
            var scheduleID = $(this).attr("data-id");
            await handleScheduleAction(action, scheduleID);
        });
    }

    $(initPage);

    return api;
});
