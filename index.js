var darktheme = JSON.parse(localStorage.getItem("darktheme")) || false;
if (darktheme) {
    $("html").attr("data-theme", "dark");
    $("body").attr("data-theme", "dark");
} else {
    $("html").attr("data-theme", "light");
    $("body").attr("data-theme", "light");
}