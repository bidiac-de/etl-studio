var jobID = $("#jobID").val();
var serverID = $("#serverID").val();

var componentsTemplate = {};
var components = {};
var currentJobJson;
var codemirror;


if (jobID != "0") {

    ETL.console.onChangeHandler = function(log) {
        $("#consoleText").val(log);
        $("#consoleText").scrollTop($("#consoleText")[0].scrollHeight);
    }
    ETL.console.log("open job id "+jobID);

    $("#btnOpenConsole").click(function() {
        $("#console").slideToggle(50);
        $("#consoleText").scrollTop($("#consoleText")[0].scrollHeight);
    });

    $("#btnCloseConsole").click(function() {
        $("#console").slideUp(50);
    });

    $("#btnOpenTerminalFooter").click(function() {
        $("#console").slideToggle(50);
        $("#consoleText").scrollTop($("#consoleText")[0].scrollHeight);
    });

    $("#btnExecuteScript").click(function() {
        $("#console").slideDown(50);
        ETL.console.log("upload job id " + jobID + " to execution server", true, "");
        setInterval(function() {
            ETL.console.log(".", false, "");
        }, 1000);
    });

    $("#btnConfirmDelete").click(function() {
        ETL.api.delete(serverID, "/jobs/"+jobID).then(function(result) {
            if (result) {
                window.location.href="./";
            }
        });
    });

    $("#openComponentsDialog").click(function() {
        $("#componentsTable").html("");
        $("#componentDialog").attr("open", "");
        ETL.api.get(serverID, "/configs/component_types/").then(function(componentTypes) {
            if (componentTypes !== false) {

                var promises = [];

                for (var componentType of componentTypes) {
                    promises.push(ETL.api.get(serverID, "/configs/"+componentType+"/form"));
                }

                Promise.allSettled(promises).then(function(data) {

                    var componentTable = "";

                    for (var componentPromise of data) {
                        var component = ETL.util.deref(componentPromise.value);
                        var componentTitle = component.title;
                        var compType = component["comp-type"];

                        componentsTemplate[compType] = component;
                        componentTable += "<tr><td><i class=\"fa-solid fa-box\"></i></td><td>"+componentTitle+"</td><td><button class=\"secondary\" disabled><i class=\"fa-solid fa-sliders\"></i> Customize</button> <button onclick=\"addComponentToWhiteboard('"+compType+"')\"><i class=\"fa-solid fa-plus\"></i> Add</button></td></tr>";

                        
                    }

                    $("#componentsTable").html(componentTable);
                });

            }
        });
    });

    $("#btnSettings").click(function() {
        ETL.render.jobEdit(serverID, jobID).then(function(result) {
            if (result !== false) {
                $("#settingsDialogMain").html(result);
                $('#settingsDialog').attr('open', '');
            }
        });
    });

    $("#btnSave").click(function() {
        exportToJson().then(function(json) {
            ETL.api.put(serverID, "/jobs/"+jobID, json).then(function(data) {
                console.log(data);
                if (data == false) {
                    ETL.util.alert("Server Error", "Unexpected response from server");
                }
            });
        });
    });

    $("#btnJSON").click(function() {
        if (codemirror == undefined) {

            $(this).html('<i class="fa-solid fa-display"></i>');
            $(this).attr("data-tooltip", "Whiteboard");
            $("#openComponentsDialog").prop("disabled", true);

            exportToJson().then(function(json) {

                codemirror = CodeMirror.fromTextArea(document.getElementById("codemirror"), {
                    mode: { 
                        name: "javascript", 
                        json: true 
                    },
                    lineNumbers: true,
                    matchBrackets: true,
                    autoCloseBrackets: true,
                    theme: "ayu-mirage",
                    readOnly: true
                });

                codemirror.setSize("100%", "calc(100% - 70px)");

                codemirror.setValue(JSON.stringify(json, null, 2));
            });
        } else {
            codemirror.toTextArea();
            codemirror = undefined;

            $(this).html('<i class="fa-solid fa-code"></i>');
            $(this).attr("data-tooltip", "JSON");
            $("#openComponentsDialog").prop("disabled", false);
        }
        $("#codemirror").toggle();
        $("#drawflow").toggle();

        

        
    });

    $("#btnSaveJobSettings").click(function() {
        var postData = ETL.util.getFormData($("#settingsDialogMain"));
        console.log(postData);

        ETL.api.get(serverID, "/jobs/"+jobID).then(function(data) {
            if (data !== false) {
                for (var key in postData) {
                    data[key] = postData[key];
                }
                ETL.api.put(serverID, "/jobs/"+jobID, postData).then(function(data) {
                    console.log(data);
                    if (data !== false) {
                        window.location.reload();
                    } else {
                        ETL.util.alert("Server Error", "Unexpected response from server");
                    }
                });
            } else {
                ETL.util.alert("Server Error", "Unexpected response from server");
            }
        });
    });


    ETL.api.get(serverID, "/jobs/"+jobID).then(function(data) {
        console.log(data);
        if (data !== false) {
            var jobName = data["name"];
            var jobLastChanged = ETL.util.formatDate(new Date(data["metadata_"]["timestamp"]));

            $("#jobTitle").html(": "+jobName);
            $("#lastChanged").html(jobLastChanged);

        } else {
            window.location.href="./";
        }
    });


} else {


    $("#newJobSaveButton").click(function() {
        var postData = ETL.util.getFormData($("#jobDetailsFieldset"));
        var serverID = $("#newJobServerSelection").find(":selected").val();

        console.log(postData);

        ETL.api.post(serverID, "/jobs/", postData).then(function(data) {
            console.log(data);
            if (data !== false) {
                window.location.href="./?serverID="+serverID+"&job="+data;
            } else {
                ETL.util.alert("Server Error", "Unexpected response from server");
            }
        });
    });


    $("#newJobServerSelection").change(function() {
        var serverID = $(this).find(":selected").val();
    
        ETL.render.jobEdit(serverID).then(function(result) {
            if (result !== false) {
                $("#jobDetailsFieldset").html(result);
                $("#newJobSaveButton").attr("disabled", false);
            } else {
                $("#jobDetailsFieldset").html("No Server connection!");
                $("#newJobSaveButton").attr("disabled", true);
            }
        });

    });


}

