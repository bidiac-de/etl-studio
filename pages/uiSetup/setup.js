/**
 * Displays validation error message for a form field
 * @param {string} [id=""] - The ID of the form field
 * @param {string} [msg=""] - The error message to display
 */
function validationErrorText(id="", msg="") {
    $("#"+id).attr("aria-invalid", "true");
    $("#"+id+"-validationtext").html(msg);
}

/**
 * Clears validation error for a form field
 * @param {string} [id=""] - The ID of the form field
 */
function validationOk(id="") {
    $("#"+id).attr("aria-invalid", "false");
    $("#"+id+"-validationtext").html("");
}


/**
 * Validates SQLite file path by checking if it's not empty and making server request
 * @returns {Promise<boolean>} Promise that resolves to true if valid, false otherwise
 */
function validateSqlitefilepath() {
    return new Promise(function(resolve, reject) {
        if ($("#sqlitefilepath").val() == "") {
            validationErrorText("sqlitefilepath", "Can't be empty!");
            resolve(false);
        } else {
            $.post("./pages/uiSetup/setupValidator.php", {
                sqlitefilepath: $("#sqlitefilepath").val()
            }, function(msg) {
                if (msg == "") {
                    validationOk("sqlitefilepath");
                    resolve(true);
                } else {
                    validationErrorText("sqlitefilepath", msg);
                    resolve(false);
                }
            });
        }
    });
}

/**
 * Validates username field by checking if it's not empty
 * @returns {Promise<boolean>} Promise that resolves to true if valid, false otherwise
 */
function validateUsername() {
    return new Promise(function(resolve, reject) {
        if ($("#username").val() == "") {
            validationErrorText("username", "Can't be empty!");
            resolve(false);
        } else {
            validationOk("username");
            resolve(true);
        }
    });
}

/**
 * Validates password fields by checking if password is not empty and passwords match
 * @returns {Promise<boolean>} Promise that resolves to true if valid, false otherwise
 */
function validatePassword() {
    return new Promise(function(resolve, reject) {
        var password = $("#password").val();
        var passwordRepeat = $("#passwordRepeat").val();

        if (password == "") {
            validationErrorText("password", "Can't be empty!");
            resolve(false);
        } else if (password != passwordRepeat) {
            validationErrorText("passwordRepeat", "Passwords do not match!");
            resolve(false);
        } else {
            validationOk("password");
            validationOk("passwordRepeat");
            resolve(true);
        }

    });
}


$("#btnNext").click(function() {
    Promise.all([
        validateSqlitefilepath(),
        validateUsername(),
        validatePassword(),
    ]).then(function(res) {
        if(res.every(function(value) {
            return value == true;
        })) {
            $("#btnNext").html("Finish");
            $("#btnNext").prop("disabled", true);
            $("#btnNext").attr("aria-busy", "true");
            setTimeout(function() {
                $("form").submit();
            }, 2000);
        }
    });
});


$("#sqlitefilepath").on("keyup change", validateSqlitefilepath);
$("#username").on("keyup change", validateUsername);
$("#password").on("keyup change", validatePassword);
$("#passwordRepeat").on("keyup change", validatePassword);