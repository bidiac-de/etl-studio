var formReadyToSubmit = false;

/**
 * Handles login button click event
 * Triggers form submission
 */
$("#btnLogin").click(function() {
    $("form").submit();
});

/**
 * Handles form submission event
 * Validates username and password fields before submission
 * @param {Event} e - The form submission event
 * @returns {boolean} False if validation fails, true if ready to submit
 */
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