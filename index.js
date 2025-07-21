var darktheme = JSON.parse(localStorage.getItem("darktheme")) || false;
if (darktheme) {
    $("html").attr("data-theme", "dark");
}