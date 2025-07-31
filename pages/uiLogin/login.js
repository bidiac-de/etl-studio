var formReadyToSubmit = false;

$("#btnLogin").click(function() {
    $("form").submit();
});

$("form").submit(function(e) {
    if ($("input[name='username']").val() == "") {
        $("input[name='username']").attr("aria-invalid", "true");
        return false;
    }
    if ($("input[name='password']").val() == "") {
        $("input[name='password']").attr("aria-invalid", "true");
        return false;
    }

    $("#btnLogin").attr("aria-busy", "true");
    setTimeout(function() {
        formReadyToSubmit = true;
        $("form").submit();
    }, 2000);
    return formReadyToSubmit;
});