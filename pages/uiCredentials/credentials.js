var serverID = $("#serverID").val();
var credentialID = $("#credentialID").val();

$("#btnCredentialAdd").click(function() {

    var dataArray = $("#formCredential form").serializeArray();
    var data = {};

    for (var item of dataArray) {
        var value = item.value;
        var name = item.name;

        if (name == "pool_max_size" || name == "pool_timeout_s" || name == "port") {
            value = parseInt(value);
            if (isNaN(value) || value <= 0) {
                value = null;
            }
        }
        data[name] = value;
    }

    console.log(data);

    var serverID = $("#newCredentialServerSelection").val();

    ETL.api.post(serverID, "/contexts/credentials", {
        credentials: data
    }, true).then(function(data) {
        console.log(data);
        if (data != false) {
            window.location.href = "./?credentials";
        }
    });

});


$("#btnCredentialMappingAdd").click(function() {
    var data = {};

    var credentialDev = $("#credentialDev").val();
    var credentialTest = $("#credentialTest").val();
    var credentialProd = $("#credentialProd").val();

    data.name = $("#name").val();
    data.environment = "DEV";
    data["credentials_ids"] = {};

    if (credentialDev != "") {
        data["credentials_ids"]["DEV"] = credentialDev;
    }
    if (credentialTest != "") {
        data["credentials_ids"]["TEST"] = credentialTest;
    }
    if (credentialProd != "") {
        data["credentials_ids"]["PROD"] = credentialProd;
    }

    console.log(data);

    var serverID = $("#newCredentialMappingServerSelection").val();

    /*console.log(JSON.stringify({context: data}));
    return;*/

    ETL.api.post(serverID, "/contexts/credentials-mapping-context", {
        context: data
    }, true).then(function(data) {
        if (data != false) {
            window.location.href = "./?credentials";
        }
    });
});


$("#newCredentialMappingServerSelection").change(newCredentialMappingServerSelection);

function newCredentialMappingServerSelection() {
    $("#credentialDev").html("<option value=''></option>");
    $("#credentialTest").html("<option value=''></option>");
    $("#credentialProd").html("<option value=''></option>");
    var serverID = $("#newCredentialMappingServerSelection").val();
    ETL.api.get(serverID, "/contexts/").then(function(contextList) {
        if (contextList !== false) {
            console.log(contextList);
            var html = "";
            for (var context of contextList) {
                if (context.kind != "credentials") continue;
                var contextID = context.id;
                var contextName = context.name;

                html += "<option value='"+contextID+"'>"+contextID + " - " +contextName+"</option>";

            }
            $("#credentialDev").append(html);
            $("#credentialTest").append(html);
            $("#credentialProd").append(html);
        }
    });
}


for (var serverID in server) {
    serverInstance = server[serverID];
    var serverName = serverInstance["description"];

    (function(serverID) {
        ETL.api.get(serverID, "/contexts/").then(async function(contextList) {
            if (contextList !== false) {
                for (var context of contextList) {

                    var contextID = context.id;
                    var contextName = context.name;
                    var contextData = await ETL.api.get(serverID, "/contexts/"+contextID);


                    if (contextData !== false) {
                        if (context.kind == "credentials") {
                            var contextHost = contextData.host;
                            var contextPort = contextData.port;
                            var contextDatabase = contextData.database;
                            var contextUser = contextData.user;
                            var contextPassword = contextData.password;

                            $("#credentialTableBody").append("<tr serverid='"+serverID+"' contextid='"+contextID+"'><td>"+contextID+"</td><td>"+contextName+"</td><td>"+contextHost+"</td><td>"+contextPort+"</td><td>"+contextDatabase+"</td><td>"+contextUser+"</td><td>"+contextPassword+"</td><td><button class='pico-background-red-550 btnDeleteContext'><i class='fa-solid fa-trash'></i></button></td></tr>");
                        }

                        if (context.kind == "context") {

                            var checkIcon = "<i class='fa-solid fa-circle-check pico-color-green-500'></i>";

                            $("#credentialMappingTableBody").append("<tr serverid='"+serverID+"' contextid='"+contextID+"'><td>"+contextID+"</td><td>"+contextName+"</td><td>"+checkIcon+"</td><td>"+checkIcon+"</td><td>"+checkIcon+"</td><td><button class='pico-background-red-550 btnDeleteContext'><i class='fa-solid fa-trash'></i></button></td></tr>");
                        }

                    }
                }
            }
        });
    })(serverID);

}


$(document).on("click", ".btnDeleteContext", function() {
    var parentTr = $(this).closest("tr");
    var selectedServerID = $(parentTr).attr("serverid");
    var selectedContextID = $(parentTr).attr("contextid");

    ETL.api.delete(selectedServerID, "/contexts/"+selectedContextID, function(data) {
        window.location.reload();
    });

})


newCredentialMappingServerSelection();


if (credentialID > 0) {
    ETL.api.get();
}