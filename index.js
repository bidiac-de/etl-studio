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

/**
 * Generates a formatted locale-specific date and time string
 * @returns {string} Formatted date and time string (e.g., "January 15, 2024 2:30:45 PM")
 */
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

/**
 * Logs a message to the ETL console with optional timestamp and custom line ending
 * @param {string} [msg=""] - The message to log
 * @param {boolean} [showTimestamp=true] - Whether to include timestamp prefix
 * @param {string} [end="\r\n"] - Line ending character(s)
 */
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

/**
 * Retrieves the current ETL console log content from localStorage
 * @returns {string} The console log content as a string
 */
ETL.console.get = function() {
    var etlConsoleLog = localStorage.getItem("etlConsoleLog");
    if (etlConsoleLog == null) etlConsoleLog = "";
    return etlConsoleLog;
}

/**
 * Clears the ETL console log by removing it from localStorage and firing change handler
 */
ETL.console.clear = function() {
    localStorage.removeItem("etlConsoleLog");
    ETL.console.fireChangeHandler();
}

/**
 * Fires the console change handler with the current log content
 */
ETL.console.fireChangeHandler = function() {
    var etlConsoleLog = ETL.console.get();
    ETL.console.onChangeHandler(etlConsoleLog);
}

/**
 * Placeholder function for console change handler - can be overridden to handle log changes
 * @param {string} log - The current console log content
 */
ETL.console.onChangeHandler = function(log) {}