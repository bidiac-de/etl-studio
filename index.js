var darktheme = JSON.parse(localStorage.getItem("darktheme"));
if (darktheme == null) {
    darktheme = true;
    localStorage.setItem("darktheme", true);
}
if (darktheme) {
    $("html").attr("data-theme", "dark");
}


var ETL = {};

ETL.console = {};

ETL.console.getLocaleDatetime = function() {
    return new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    }) + " " + new Date().toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
    });
}

ETL.console.log = function(msg = "", showTimestamp = true, end = "\r\n") {
    var etlConsoleLog = ETL.console.get();
    if (etlConsoleLog == null) etlConsoleLog = "";
    if (etlConsoleLog.slice(-2) != "\r\n" && showTimestamp) etlConsoleLog += "\r\n";
    if (showTimestamp) etlConsoleLog += ETL.console.getLocaleDatetime() + " > ";
    etlConsoleLog += msg + end;
    var bufferSize = localStorage.getItem("etlConsoleLogBufferSize") || 10000;
    localStorage.setItem("etlConsoleLog", etlConsoleLog.slice(-bufferSize));
    ETL.console.fireChangeHandler();
}

ETL.console.get = function() {
    var etlConsoleLog = localStorage.getItem("etlConsoleLog");
    if (etlConsoleLog == null) etlConsoleLog = "";
    return etlConsoleLog;
}

ETL.console.clear = function() {
    localStorage.removeItem("etlConsoleLog");
    ETL.console.fireChangeHandler();
}

ETL.console.fireChangeHandler = function() {
    var etlConsoleLog = ETL.console.get();
    ETL.console.onChangeHandler(etlConsoleLog);
}

ETL.console.onChangeHandler = function(log) {}