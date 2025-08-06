$("#description").on("keyup change", function() {
    if ($("#description").val() != "") {
        $("#btnServerAdd").removeAttr("disabled");
    } else {
        $("#btnServerAdd").prop("disabled", true);
    }
});

$("#btnServerAdd").click(function() {
    var prevBtnText = $("#btnServerAdd").html();
    $("#btnServerAdd").html("Checking").prop("disabled", true).attr("aria-busy", "true");
    var connectionStr = $("#protocol").val() + "://" +  $("#hostname").val() + ":" + $("#port").val();
    $.post("./pages/uiServer/serverValidator.php", {
        connection: connectionStr,
        accessKey: $("#key").val()
    }, function(msg) {
        console.log(msg);
        if (msg == "true") {
            $("#serverDialog .errorMsg").hide();
            setTimeout(function() {
                $("#serverDialog form").submit();
            }, 1000);
            
        } else {
            setTimeout(function() {
                $("#btnServerAdd").html(prevBtnText).prop("disabled", false).attr("aria-busy", "false");
                $("#serverDialog .errorMsg").show();
            }, 1000);
        }
    });
    
});

$("#btnServerFormReset").click(function() {
    $("#serverDialog form").trigger("reset");
});

$("#description").trigger("change");

setTimeout(function() {
    var serverTableBody = $("#serverTableBody tr");
    for (var serverTr of serverTableBody) {
        var serverID = $(serverTr).children()[0].innerHTML;
        $.post("./pages/uiServer/serverValidator.php", {
            serverID: serverID
        }, function(msg) {
            if (msg == "true") {
                $("#serverstatus-"+serverID).html("<i class=\"fa-solid fa-circle-check pico-color-green-550\"></i>");
            } else {
                $("#serverstatus-"+serverID).html("<i class=\"fa-solid fa-circle-xmark pico-color-red-550\"></i>");
            }
        });
    }
}, 1000);
