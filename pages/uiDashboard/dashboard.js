function reloadJobListTable() {

    $("#jobTable").hide();
    $("#jobTableBody").html("");

    if (typeof server == "undefined" || server == null) {
        $("#jobTableBody").append("<tr><td colspan='4'>No servers configured.</td></tr>");
        $("#jobTable").show();
        return;
    }

    var requests = [];
    for (var serverKey in server) {
        if (!Object.prototype.hasOwnProperty.call(server, serverKey)) {
            continue;
        }
        (function (localServerID) {
            var serverInstance = server[localServerID] || {};
            var serverName = serverInstance["description"] || ("Server " + localServerID);
            requests.push(
                ETL.api.get(localServerID, "/jobs/", true).then(function (jobsList) {
                    return {
                        serverID: localServerID,
                        serverName: serverName,
                        jobsList: jobsList
                    };
                })
            );
        })(serverKey);
    }

    Promise.all(requests).then(function (results) {
        var hasJobRows = false;
        var errorRows = 0;

        for (var result of results) {
            if (result.jobsList === false) {
                errorRows += 1;
                var errorDetail = "";
                var lastErr = ETL.api._lastError;
                if (lastErr != null && typeof lastErr == "object") {
                    var envelope = (lastErr.responseJSON || {}).error || {};
                    var errCode = typeof envelope.code == "string" ? envelope.code : "";
                    var errMsg = typeof envelope.message == "string" ? envelope.message : "";
                    if (errCode != "" || errMsg != "") {
                        errorDetail = "<br><small>" +
                            (errCode != "" ? "<strong>" + ETL.render.escapeHTML(errCode) + "</strong>: " : "") +
                            ETL.render.escapeHTML(errMsg) +
                            "</small>";
                    }
                }
                $("#jobTableBody").append(
                    "<tr class='tableRowError'><td colspan='4'>" +
                    "<i class='fa-solid fa-triangle-exclamation'></i> " +
                    "Failed to load jobs from " +
                    ETL.render.escapeHTML(result.serverName) + "." +
                    errorDetail +
                    "</td></tr>"
                );
                continue;
            }

            if (!Array.isArray(result.jobsList)) {
                errorRows += 1;
                $("#jobTableBody").append(
                    "<tr class='tableRowError'><td colspan='4'>Invalid jobs response from " +
                    ETL.render.escapeHTML(result.serverName) +
                    ".</td></tr>"
                );
                continue;
            }

            for (var job of result.jobsList) {
                var jobID = job["id"];
                var jobName = job["name"] || "(unnamed)";
                var lastModified = "-";
                if (job["metadata_"] != undefined && job["metadata_"]["timestamp"] != undefined) {
                    lastModified = ETL.util.formatDate(new Date(job["metadata_"]["timestamp"]));
                }
                hasJobRows = true;
                $("#jobTableBody").append(
                    "<tr onclick=\"window.location.href='?serverID=" + result.serverID + "&job=" + jobID + "'\">" +
                    "<td>" + ETL.render.escapeHTML(jobName) + "</td>" +
                    "<td>" + ETL.render.escapeHTML(result.serverName) + "</td>" +
                    "<td>" + ETL.render.escapeHTML(lastModified) + "</td>" +
                    "<td><i class='fa-solid fa-chevron-right'></i></td>" +
                    "</tr>"
                );
            }
        }

        if (!hasJobRows && errorRows == 0) {
            $("#jobTableBody").append("<tr><td colspan='4'>No jobs found.</td></tr>");
        }

        if (hasJobRows && errorRows == 0) {
            sortTableByTh($("#thLastChange"), false);
        }
        $("#jobTable").show();
    });

}


function parseValue(val) {
    val = $.trim(val);
    if ($.isNumeric(val)) {
        return Number(val);
    }
    const iso = Date.parse(val);
    if (!isNaN(iso)) {
        return new Date(iso).getTime();
    }
    const parts = val.split("/");
    if (parts.length === 3) {
        const [d, m, y] = parts.map(Number);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
            return new Date(y, m - 1, d).getTime();
        }
    }
    return val.toLowerCase();
}

function sortTableByTh($th, asc = false) {
    const index = $th.index();
    const $table = $th.closest("table");
    const $tbody = $table.find("tbody");
    const rows = $tbody.find("tr").get();

    rows.sort((rowA, rowB) => {
        const cellA = $(rowA).children().eq(index).text();
        const cellB = $(rowB).children().eq(index).text();

        const valA = parseValue(cellA);
        const valB = parseValue(cellB);

        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
        return 0;
    });

    $.each(rows, (i, row) => $tbody.append(row));
}




$("#jobSearch").on("input", function () {
    var searchText = $(this).val().toLowerCase();
    $("#jobTableBody tr").each(function () {
        const rowText = $(this).text().toLowerCase();
        $(this).toggle(rowText.indexOf(searchText) >= 0);
    });
});

$("#refreshJobList").click(reloadJobListTable);



reloadJobListTable();
