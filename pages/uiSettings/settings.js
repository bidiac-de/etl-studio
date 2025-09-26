var darktheme = JSON.parse(localStorage.getItem("darktheme")) || false;
if (darktheme) {
    $("#darktheme").attr("checked", true)
}

var consoleBufferSize = localStorage.getItem("etlConsoleLogBufferSize") || 10000;
$("#consoleBufferSize").val(consoleBufferSize);


/**
 * Handles dark theme toggle change event
 * Updates localStorage and applies theme to HTML element
 */
$("#darktheme").change(function() {
    if (this.checked) {
        localStorage.setItem("darktheme", true);
        $("html").attr("data-theme", "dark");
    } else {
        localStorage.setItem("darktheme", false);
        $("html").attr("data-theme", "light");
    }
});

/**
 * Handles console buffer size change event
 * Updates localStorage with new buffer size value
 */
$("#consoleBufferSize").change(function() {
    localStorage.setItem("etlConsoleLogBufferSize", $(this).val());
});