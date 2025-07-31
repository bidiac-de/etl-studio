var jobID = $("#jobID").val();

if (jobID > 0) {

    ETL.console.onChangeHandler = function(log) {
        $("#consoleText").val(log);
        $("#consoleText").scrollTop($("#consoleText")[0].scrollHeight);
    }
    ETL.console.log("open job id "+jobID);

    $("#btnOpenConsole").click(function() {
        $("#console").slideToggle(50);
        $("#consoleText").scrollTop($("#consoleText")[0].scrollHeight);
    });

    $("#btnCloseConsole").click(function() {
        $("#console").slideUp(50);
    });

    $("#btnOpenTerminalFooter").click(function() {
        $("#console").slideToggle(50);
        $("#consoleText").scrollTop($("#consoleText")[0].scrollHeight);
    });

    $("#btnExecuteScript").click(function() {
        $("#console").slideDown(50);
        ETL.console.log("upload job id " + jobID + " to execution server", true, "");
        setInterval(function() {
            ETL.console.log(".", false, "");
        }, 1000);
    });
} else {

}

