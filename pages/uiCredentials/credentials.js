var mappingEnvironments = [];

function normalizeServerId(value) {
    var parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        return 0;
    }
    return parsed;
}

function upsertMappingEnvironments(environments) {
    for (var environmentInfo of environments) {
        var exists = false;
        for (var existing of mappingEnvironments) {
            if (existing.value == environmentInfo.value) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            mappingEnvironments.push(environmentInfo);
        }
    }
}

function renderMappingTableHeader() {
    var html = "";
    html += "<th class='tableFit'><i class='fa-solid fa-fingerprint'></i> ID</th>";
    html += "<th><i class='fa-solid fa-signature'></i> Name</th>";
    for (var environmentInfo of mappingEnvironments) {
        var label = environmentInfo.label || environmentInfo.value;
        var icon = environmentInfo.icon || "fa-solid fa-layer-group";
        html += "<th class='tableFit'><i class='"+icon+"'></i> "+label+"</th>";
    }
    html += "<th class='tableFit'></th>";
    $("#credentialMappingTableHeadRow").html(html);
}

async function ensureMappingEnvironmentsForServer(serverID) {
    var contractReady = await ETL.contract.require(serverID);
    if (!contractReady) {
        return [];
    }
    var environments = ETL.contract.getEnvironments(serverID);
    upsertMappingEnvironments(environments);
    renderMappingTableHeader();
    return environments;
}

async function renderMappingEnvironmentFields(serverID) {
    var environments = await ensureMappingEnvironmentsForServer(serverID);
    var html = "";

    html += "<div class='row'>";
    html += "<div class='col-sm-4 col-xs-12 labelColumn'>Environment</div>";
    html += "<div class='col-sm-8 col-xs-12'>";
    html += "<select id='mappingEnvironment' aria-label='Mapping environment'>";
    for (var environmentInfo of environments) {
        var value = environmentInfo.value || "";
        var label = environmentInfo.label || value;
        html += "<option value='"+value+"'>"+label+"</option>";
    }
    html += "</select>";
    html += "</div></div>";

    for (var environmentInfo2 of environments) {
        var envValue = environmentInfo2.value || "";
        var envLabel = environmentInfo2.label || envValue;
        html += "<div class='row'>";
        html += "<div class='col-sm-4 col-xs-12 labelColumn'>Credential "+envLabel+"</div>";
        html += "<div class='col-sm-8 col-xs-12'>";
        html += "<select class='credentialMappingSelect' id='credentialMapping-"+envValue+"' data-environment='"+envValue+"' aria-label='Credential "+envLabel+"'>";
        html += "<option value=''></option>";
        html += "</select>";
        html += "</div></div>";
    }

    $("#credentialMappingEnvironmentFields").html(html);
}

async function fillMappingCredentialOptions(serverID) {
    var contextList = await ETL.api.get(serverID, "/contexts/");
    if (contextList === false) {
        return;
    }

    var optionsHtml = "<option value=''></option>";
    for (var context of contextList) {
        if (context.kind != "credentials") {
            continue;
        }
        var contextID = context.id;
        var contextName = context.name;
        optionsHtml += "<option value='"+contextID+"'>"+contextID + " - " + contextName+"</option>";
    }

    $(".credentialMappingSelect").each(function() {
        $(this).html(optionsHtml);
    });
}

async function refreshMappingDialogForServer() {
    var selectedServerID = normalizeServerId($("#newCredentialMappingServerSelection").val());
    await renderMappingEnvironmentFields(selectedServerID);
    await fillMappingCredentialOptions(selectedServerID);
}

$("#btnCredentialAdd").click(function() {
    var dataArray = $("#formCredential form").serializeArray();
    var data = {};

    for (var item of dataArray) {
        var value = item.value;
        var name = item.name;

        if (name == "pool_max_size" || name == "pool_timeout_s" || name == "port") {
            value = parseInt(value, 10);
            if (isNaN(value) || value <= 0) {
                value = null;
            }
        }
        data[name] = value;
    }

    var selectedServerID = normalizeServerId($("#newCredentialServerSelection").val());

    ETL.api.post(selectedServerID, "/contexts/credentials", {
        credentials: data
    }, true).then(function(responseData) {
        if (responseData != false) {
            window.location.href = "./?credentials";
        }
    });
});

$("#btnCredentialMappingAdd").click(async function() {
    var selectedServerID = normalizeServerId($("#newCredentialMappingServerSelection").val());
    var environments = await ensureMappingEnvironmentsForServer(selectedServerID);
    if (environments.length == 0) {
        return;
    }

    var data = {};
    data.name = $("#name").val();
    data.environment = $("#mappingEnvironment").val() || environments[0].value;
    data.credentials_ids = {};

    $(".credentialMappingSelect").each(function() {
        var environment = $(this).attr("data-environment");
        var credentialID = $(this).val();
        if (credentialID != "") {
            data.credentials_ids[environment] = credentialID;
        }
    });

    ETL.api.post(selectedServerID, "/contexts/credentials-mapping-context", {
        context: data
    }, true).then(function(responseData) {
        if (responseData != false) {
            window.location.href = "./?credentials";
        }
    });
});

$("#newCredentialMappingServerSelection").change(function() {
    refreshMappingDialogForServer();
});

async function loadCredentialTables() {
    if (typeof server == "undefined" || server == null) {
        return;
    }

    for (var envServerKey in server) {
        var envServerID = normalizeServerId(envServerKey);
        await ensureMappingEnvironmentsForServer(envServerID);
    }

    for (var serverKey in server) {
        var selectedServerID = normalizeServerId(serverKey);

        var contextList = await ETL.api.get(selectedServerID, "/contexts/");
        if (contextList === false) {
            continue;
        }

        for (var context of contextList) {
            var contextID = context.id;
            var contextName = context.name;
            var contextData = await ETL.api.get(selectedServerID, "/contexts/"+contextID);
            if (contextData === false) {
                continue;
            }

            if (context.kind == "credentials") {
                var contextHost = contextData.host;
                var contextPort = contextData.port;
                var contextDatabase = contextData.database;
                var contextUser = contextData.user;
                var contextPassword = contextData.password;

                $("#credentialTableBody").append("<tr serverid='"+selectedServerID+"' contextid='"+contextID+"'><td>"+contextID+"</td><td>"+contextName+"</td><td>"+contextHost+"</td><td>"+contextPort+"</td><td>"+contextDatabase+"</td><td>"+contextUser+"</td><td>"+contextPassword+"</td><td><button class='pico-background-red-550 btnDeleteContext'><i class='fa-solid fa-trash'></i></button></td></tr>");
            }

            if (context.kind == "context") {
                var mappingCellsHtml = "";
                for (var environmentInfo of mappingEnvironments) {
                    var hasMapping = contextData.credentials_ids != undefined && contextData.credentials_ids[environmentInfo.value] != undefined;
                    if (hasMapping) {
                        mappingCellsHtml += "<td class='tableFit'><i class='fa-solid fa-circle-check pico-color-green-500'></i></td>";
                    } else {
                        mappingCellsHtml += "<td class='tableFit'><i class='fa-solid fa-circle-minus pico-color-slate-450'></i></td>";
                    }
                }
                $("#credentialMappingTableBody").append("<tr serverid='"+selectedServerID+"' contextid='"+contextID+"'><td>"+contextID+"</td><td>"+contextName+"</td>"+mappingCellsHtml+"<td><button class='pico-background-red-550 btnDeleteContext'><i class='fa-solid fa-trash'></i></button></td></tr>");
            }
        }
    }
}

$(document).on("click", ".btnDeleteContext", function() {
    var parentTr = $(this).closest("tr");
    var selectedServerID = normalizeServerId($(parentTr).attr("serverid"));
    var selectedContextID = $(parentTr).attr("contextid");

    ETL.api.delete(selectedServerID, "/contexts/"+selectedContextID, true).then(function(result) {
        if (result) {
            window.location.reload();
        }
    });
});

(async function initCredentialsPage() {
    await loadCredentialTables();
    if ($("#newCredentialMappingServerSelection").length > 0) {
        await refreshMappingDialogForServer();
    }
})();
