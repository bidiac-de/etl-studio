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

    $("#openComponentsDialog").click(function(event) {
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
                        var icon = component["icon"];

                        

                        if (typeof icon != "string") {
                            icon = "fa-solid fa-box";
                        }

                        console.log(component);
                        console.log(icon);

                        componentsTemplate[compType] = component;
                        componentTable += "<tr><td><i class=\""+icon+"\"></i></td><td>"+componentTitle+"</td><td><button class=\"secondary\" disabled><i class=\"fa-solid fa-sliders\"></i> Customize</button> <button onclick=\"addComponentToWhiteboard('"+compType+"')\"><i class=\"fa-solid fa-plus\"></i> Add</button></td></tr>";

                        
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

                var codemirrorOptions = {
                    mode: { 
                        name: "javascript", 
                        json: true 
                    },
                    lineNumbers: true,
                    matchBrackets: true,
                    autoCloseBrackets: true,
                    readOnly: true
                };

                if (darktheme) {
                    codemirrorOptions.theme = "ayu-mirage";
                }

                codemirror = CodeMirror.fromTextArea(document.getElementById("codemirror"), codemirrorOptions);
                codemirror.setSize("100%", "calc(100% - 70px)");
                codemirror.setValue(JSON.stringify(json, null, 2).replace(/"([^"]+)":/g, '$1:'));

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

    $("#zoomNeutral").click(function() {
        var maxSteps = 100;
        while (editor.zoom != 1 && maxSteps > 0) {
            if (editor.zoom > 1) {
                editor.zoom_out();
            } else {
                editor.zoom_in();
            }
            maxSteps--;
        }
    });

    $("#zoomIncrement").click(function() {
        for (var i = 0; i < 10; i++) {
            editor.zoom_in();
        }
    });

    $("#zoomDecrement").click(function() {
        for (var i = 0; i < 10; i++) {
            editor.zoom_out();
        }
    });

    $("#contextMenuDeleteBtn").click(function() {
        if (contextMenuSelectedComponent != undefined) {
            editor.removeNodeId(contextMenuSelectedComponent);
            contextMenuSelectedComponent = undefined;
        }
        if (contextMenuSelectedConnection != undefined) {
            var nodeInput = contextMenuSelectedConnection[1].split("-")[1];
            var nodeOutput = contextMenuSelectedConnection[2].split("-")[1];
            var output = contextMenuSelectedConnection[3];
            var input = contextMenuSelectedConnection[4];

            editor.removeSingleConnection(nodeOutput, nodeInput, output, input);
            contextMenuSelectedConnection = undefined;
        }
    });

    $("#contextMenuEditBtn").click(function() {
        if (contextMenuSelectedComponent != undefined) {
            $("#componentEditDialog").attr("open", "");
            var selectedComponentID = contextMenuSelectedComponent.split("-")[1];

            ETL.render.componentEdit(selectedComponentID).then(function(result) {
                if (result !== false) {
                    $("#componentEditDialogMain").html(result);
                    $("#btnSaveComponent").attr("disabled", false);
                } else {
                    $("#componentEditDialogMain").html("No Server connection!");
                    $("#btnSaveComponent").attr("disabled", true);
                }
            });
        }
    });

    $("#btnSaveComponent").click(function() {
        if (contextMenuSelectedComponent != undefined) {
            var selectedComponentID = contextMenuSelectedComponent.split("-")[1];
            var newData = ETL.util.getFormData($("#componentEditDialogMain"));
            var selectedNode = editor.getNodeFromId(selectedComponentID);
            var updateData = selectedNode.data;
            for (var key in newData) {
                var value = newData[key];
                updateData[key] = value;
            }
            editor.updateNodeDataFromId(selectedComponentID, updateData);
            $("#"+contextMenuSelectedComponent).find(".componentName").html(updateData.name);
            $('#componentEditDialog').removeAttr('open');
        }
    });

    $(document).on("dblclick", ".component", function(event) {
        console.log(event);
        var component = $(event.currentTarget).closest(".component");
        console.log(component);
        if (component.length == 1) {
            contextMenuSelectedComponent = $(component).attr("id");
            $("#contextMenuEditBtn").click();
        }
    });



    function exportToJson() {
        return new Promise(function(resolve, reject) {
            ETL.api.get(serverID, "/jobs/"+jobID).then(function(data) {
                if (data !== false) {

                    var drawFlowExport = editor.export();
                    var drawFlowComponents = drawFlowExport["drawflow"]["Home"]["data"];

                    data["components"] = [];

                    if (drawFlowComponents != undefined) {
                        for (var drawFlowComponentID in drawFlowComponents) {
                            var drawFlowComponent = drawFlowComponents[drawFlowComponentID];
                            console.log(drawFlowComponent);
                            var component = drawFlowComponent.data;
                            component["layout"] = {
                                "x_coordinate": drawFlowComponent.pos_x,
                                "y_coordinate": drawFlowComponent.pos_y
                            }
                            data["components"].push(component);
                        }
                    }
                    resolve(data);
                } else {
                    resolve(false);
                }
            });
        });
    }


    function addComponentToWhiteboard(compType) {

        ETL.api.get(serverID, "/configs/"+compType+"/form").then(function(selectedComponentRaw) {
            if (selectedComponentRaw !== false) {
                //var selectedComponent = structuredClone(componentsTemplate[compType]);
                //console.log(selectedComponent);

                var selectedComponent = ETL.util.deref(selectedComponentRaw);
                console.log(selectedComponent);

                var title = selectedComponent.title;
                var icon = selectedComponent.icon || "fa-solid fa-question";
                var inputPorts = selectedComponent["x-class"]["input_ports"].length || 0;
                var outputPorts = selectedComponent["x-class"]["output_ports"].length || 0;

                var x_coordinate = 150;
                var y_coordinate = 300;

                var componentProperties = {
                    "comp_type": compType
                }

                for (var property of selectedComponent.properties) {
                    var propertyName = property.name;
                    var propertyValue = undefined;
                    var propertyDefault = property.schema.default;
                    var propertyType = property.schema.type;

                    if (propertyType == "string") {
                        propertyValue = propertyDefault || "";
                    } else if (propertyType == "object") {
                        propertyValue = propertyDefault || {};
                    } else if (propertyType == "integer") {
                        propertyValue = propertyDefault || 0;
                    }

                    if (propertyValue != undefined) {
                        componentProperties[propertyName] = propertyValue;
                    } else {
                        componentProperties[propertyName] = {};
                    }
                }

                if (componentProperties["name"] == "") {
                    componentProperties["name"] = selectedComponent["title"];
                }

                while (componentNameExists(componentProperties["name"])) {
                    componentProperties["name"] += "_new";
                }

                var html = "<span class='componentIcon'><i class='"+icon+"'></i></span><br><span class='componentName'>"+componentProperties["name"]+"</span>";

                editor.addNode(compType, inputPorts, outputPorts, x_coordinate, y_coordinate, 'component', componentProperties, html);

                $('#componentDialog').removeAttr('open');
            }
        });

    }


    function componentNameExists(name) {
        var data = editor.export().drawflow.Home.data;
        for (var i in data) {
            var component = data[i];
            if (component.data.name == name) {
                return true;
            }
        }
        return false;
    }


    $(document).on("click", function() {
        $("#contextMenu").hide();
    });


    var drawflow = document.getElementById("drawflow");
    var editor = new Drawflow(drawflow);
    var contextMenuSelectedConnection;
    var contextMenuSelectedComponent;

    editor.editor_mode = "edit";
    editor.zoom_value = 0.01;
    editor.reroute = false;
    editor.snap = true;
    editor.grid = true;
    editor.grid_size = 20;

    editor.start();

    editor.on("zoom", function(zoom_level) {
        $("#zoomText").html(Math.round(zoom_level * 100) + "%");
    });

    editor.on("contextmenu", function(event) {

        var component = $(event.srcElement).closest(".component");
        var connection = $(event.srcElement).closest(".connection");

        if (component.length == 1 || connection.length == 1) {

            $("#contextMenu").css({ 
                top: event.pageY, 
                left: event.pageX + 10
            }).show();

            if (component.length == 1) {
                contextMenuSelectedComponent = $(component).attr("id");
                $("#contextMenuEditBtn").show();
            } else {
                contextMenuSelectedConnection = $(connection).attr("class").split(" ");
                $("#contextMenuEditBtn").hide();
            }
        }

    });


    ETL.api.get(serverID, "/jobs/"+jobID).then(function(data) {
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

