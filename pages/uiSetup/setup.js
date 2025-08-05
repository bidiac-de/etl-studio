function validationErrorText(id="", msg="") {
    $("#"+id).attr("aria-invalid", "true");
    $("#"+id+"-validationtext").html(msg);
}

function validationOk(id="") {
    $("#"+id).attr("aria-invalid", "false");
    $("#"+id+"-validationtext").html("");
}


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