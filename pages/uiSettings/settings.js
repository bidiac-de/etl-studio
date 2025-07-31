var darktheme = JSON.parse(localStorage.getItem("darktheme")) || false;
if (darktheme) {
    $("#darktheme").attr("checked", true)
}

var consoleBufferSize = localStorage.getItem("etlConsoleLogBufferSize") || 10000;
$("#consoleBufferSize").val(consoleBufferSize);


$("#darktheme").change(function() {
    if (this.checked) {
        localStorage.setItem("darktheme", true);
        $("html").attr("data-theme", "dark");
    } else {
        localStorage.setItem("darktheme", false);
        $("html").attr("data-theme", "light");
    }
});

$("#consoleBufferSize").change(function() {
    localStorage.setItem("etlConsoleLogBufferSize", $(this).val());
});