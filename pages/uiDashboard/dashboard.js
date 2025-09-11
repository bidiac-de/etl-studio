function reloadJobListTable() {

    $("#jobTable").hide();
    $("#jobTableBody").html("");

    console.log(server);

    for (var serverID in server) {
        serverInstance = server[serverID];
        var serverName = serverInstance["description"];
        
        ETL.api.get(serverID, "/jobs/").then(function(jobsList) {
            if (jobsList !== false) {
                for (var job of jobsList) {
                    console.log(job);
                    var jobID = job["id"];
                    var jobName = job["name"];
                    var lastModified = ETL.util.formatDate(new Date(job["metadata_"]["timestamp"]));

                    $("#jobTableBody").append("<tr onclick=\"window.location.href='?serverID="+serverID+"&job="+jobID+"'\"><td>"+jobName+"</td><td>"+serverName+"</td><td>"+lastModified+"</td><td><i class='fa-solid fa-chevron-right'></i></td></tr>");

                }
            }

            sortTableByTh($("#thLastChange"), false);
            $("#jobTable").show();
        });

    }


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




$("#jobSearch").on("input", function() {
    var searchText = $(this).val().toLowerCase();
    $("#jobTableBody tr").each(function() {
      const rowText = $(this).text().toLowerCase();
      $(this).toggle(rowText.indexOf(searchText) >= 0);
    });
});

$("#refreshJobList").click(reloadJobListTable);



reloadJobListTable();