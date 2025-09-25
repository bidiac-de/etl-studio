var jobID = $("#jobID").val();
var serverID = $("#serverID").val();

var componentsTemplate = {};
var components = {};
var currentJobJson;
var codemirror;

var tmpFieldSettings = [];


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
                            icon = "fa-solid fa-question";
                        }

                        componentsTemplate[compType] = component;
                        componentTable += "<tr><td><div><i class=\""+icon+"\"></i></div></td><td>"+componentTitle+"</td><td><button class=\"secondary\" disabled><i class=\"fa-solid fa-sliders\"></i> Customize</button> <button onclick=\"addComponentToWhiteboard('"+compType+"')\"><i class=\"fa-solid fa-plus\"></i> Add</button></td></tr>";

                        
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
            ETL.api.put(serverID, "/jobs/"+jobID, json, true).then(function(data) {
                //console.log(data);
                loadJob(false);
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
                //codemirror.setValue(JSON.stringify(json, null, 2).replace(/"([^"]+)":/g, '$1:'));
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
        //console.log(postData);

        ETL.api.get(serverID, "/jobs/"+jobID).then(function(data) {
            if (data !== false) {
                for (var key in postData) {
                    data[key] = postData[key];
                }
                ETL.api.put(serverID, "/jobs/"+jobID, postData).then(function(data) {
                    //console.log(data);
                    if (data !== false) {
                        window.location.reload();
                    } else {
                        ETL.util.alert("Server Error", "Unexpected response from server");
                    }
                });
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
        contextMenuEditBtn();
    });

    function contextMenuEditBtn(hidden = false) {
        return new Promise(function(resolve, reject) {
            if (contextMenuSelectedComponent != undefined) {
                if (!hidden) {
                    $("#componentEditDialog").attr("open", "");
                }
                var selectedComponentID = contextMenuSelectedComponent.split("-")[1];

                ETL.render.componentEdit(selectedComponentID).then(function(result) {
                    if (result !== false) {
                        $("#componentEditDialogMain").html(result);
                        $("#btnSaveComponent").attr("disabled", false);
                        resolve(true);
                    } else {
                        $("#componentEditDialogMain").html("No Server connection!");
                        $("#btnSaveComponent").attr("disabled", true);
                        resolve(false);
                    }
                });
            }
        });
    }

    $("#btnSaveComponent").click(btnSaveComponent);

    function btnSaveComponent() {
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
    }

    $(document).on("dblclick", ".component", function(event) {
        //console.log(event);
        var component = $(event.currentTarget).closest(".component");
        //console.log(component);
        if (component.length == 1) {
            contextMenuSelectedComponent = $(component).attr("id");
            //$("#contextMenuEditBtn").click();
            contextMenuEditBtn();
        }
    });

    $(document).on("click", ".btnAddOutPortSchema", function() {
        if (contextMenuSelectedComponent != undefined) {
            selectedOutPortName = $(this).parent().parent().children().first().html();
            var selectedComponentID = contextMenuSelectedComponent.split("-")[1];
            var selectedNode = editor.getNodeFromId(selectedComponentID);
            var updateData = selectedNode.data;
            tmpFieldSettings = [];
            if (updateData["out_port_schemas"] != undefined && updateData["out_port_schemas"][selectedOutPortName] != undefined && updateData["out_port_schemas"][selectedOutPortName]["fields"] != undefined) {
                tmpFieldSettings = updateData["out_port_schemas"][selectedOutPortName]["fields"];
            }
            //console.log(tmpFieldSettings);
            openFieldDialog(selectedComponentID, selectedOutPortName);
        }
    });

    $(document).on("click", "#btnAddField", function() {
        if (contextMenuSelectedComponent != undefined) {
            var selectedComponentID = contextMenuSelectedComponent.split("-")[1];

            var newFieldName = $("#newFieldName").val();
            var newFieldDataType = $("#newFieldDataType").val();
            var newFieldNullable = $("#newFieldNullable").prop("checked");

            if (newFieldName != "") {
                tmpFieldSettings.push({
                    "name": newFieldName,
                    "data_type": newFieldDataType,
                    "nullable": newFieldNullable
                });

                openFieldDialog(selectedComponentID, selectedOutPortName);
            } else {
                $("#newFieldName").attr("aria-invalid", "true");
            }   

        }
    });

    $(document).on("click", "#btnSaveFieldDef", function() {
        if (contextMenuSelectedComponent != undefined) {
            var selectedComponentID = contextMenuSelectedComponent.split("-")[1];
            var selectedNode = editor.getNodeFromId(selectedComponentID);
            var updateData = selectedNode.data;
            if (typeof updateData["out_port_schemas"] == "object") {
                if (typeof updateData["out_port_schemas"][selectedOutPortName] != "object") {
                    updateData["out_port_schemas"][selectedOutPortName] = {
                        fields: []
                    }
                }
                updateData["out_port_schemas"][selectedOutPortName]["fields"] = tmpFieldSettings;
            }
            editor.updateNodeDataFromId(selectedComponentID, updateData);
            $('#fieldDefDialog').removeAttr('open');


        }
    });


    function openFieldDialog(selectedComponentID) {
        
        var selectedNode = editor.getNodeFromId(selectedComponentID);
        var data = selectedNode.data;
        var compType = data["comp_type"];

        ETL.api.get(serverID, "/configs/"+compType+"/full").then(function(compTypeData) {
            compTypeData = ETL.util.deref(compTypeData);
            //console.log(compTypeData);

            var fieldDef = compTypeData["$defs"]["FieldDef"];
            var fieldDefProperties = fieldDef.properties;
            var nameDef = fieldDefProperties["name"];
            var dataTypeDef = fieldDefProperties["data_type"];
            var nullableDef = fieldDefProperties["nullable"];

            var html = "";
            html += "<table><thead><tr><th>"+nameDef.title+"</th><th>"+dataTypeDef.title+"</th><th>"+nullableDef.title+"</th><th></th></tr></thead><tbody id='tableBodyFields'>";

            for (var field of tmpFieldSettings) {

                var nullableValue = field["nullable"] == true ? "checked" : "";
                
                html += "<tr>";
                html += "<td><input type='text' placeholder='"+nameDef.title+"' value='"+field["name"]+"' /></td>";
                html += "<td><select aria-label='"+dataTypeDef.title+"' value='"+field["data_type"]+"' >";
                for (var item of dataTypeDef.enum) {
                    var dataTypeSelected = field["data_type"] == item ? "selected" : "";
                    html += "<option value='"+item+"' "+dataTypeSelected+">"+item+"</option>";
                }
                html += "</select></td>";
                html += "<td><input type='checkbox' "+nullableValue+" /></td>";
                html += "<td><button class='secondary'><i class='fa-solid fa-gear'></i></button> <button class='pico-background-red-550'><i class='fa-solid fa-trash'></i></button></td>";
                html += "</tr>";
            }


            html += "<tr>";
            html += "<td><input type='text' placeholder='"+nameDef.title+"' id='newFieldName' /></td>";
            html += "<td><select aria-label='"+dataTypeDef.title+"' id='newFieldDataType'>";
            for (var item of dataTypeDef.enum) {
                html += "<option value='"+item+"'>"+item+"</option>";
            }
            html += "</select></td>";
            html += "<td><input type='checkbox' id='newFieldNullable' /></td>";
            html += "<td><button id='btnAddField'><i class='fa-solid fa-plus'></i> Add</button></td>";
            html += "</tr>";

            html += "</tbody></table>";


            $("#fieldDefDialogMain").html(html);
            $("#fieldDefDialog").attr("open", "");

        });

        
    }


    function importFromJson(data = {}) {
        return new Promise(async function(resolve, reject) {
            var components = data.components;
            if (Array.isArray(components)) {
                for (var component of components) {
                    var compType = component["comp_type"];
                    await addComponentToWhiteboard(compType, JSON.parse(JSON.stringify(component)));
                }

                for (var component of components) {
                    console.log(component);

                    var outputID = getComponentIdFromName(component.name);
                    var compType = component["comp_type"];

                    if (component.routes != undefined) {
                        for (var outputName in component.routes) {
                            var compTypeDataFull = await ETL.api.get(serverID, "/configs/"+compType+"/full");
                            var outputNameDrawflow;
                            if (compTypeDataFull != false) {
                                if (compTypeDataFull["x-class"] != undefined && compTypeDataFull["x-class"]["output_port_names"] != undefined) {
                                    for (var i in compTypeDataFull["x-class"]["output_port_names"]) {
                                        if (compTypeDataFull["x-class"]["output_port_names"][i] == outputName) {
                                            outputNameDrawflow = "output_"+(parseInt(i)+1);
                                            break;
                                        }
                                    }
                                }
                            }

                            if (outputNameDrawflow != undefined) {
                                var connections = component.routes[outputName];
                                for (var connection of connections) {
                                    console.log(connection);

                                    var inputID = getComponentIdFromName(connection.to);
                                    var inputName = connection["in_port"];
                                    var compTypeInput = editor.getNodeFromId(inputID).data["comp_type"];

                                    var compTypeDataFull = await ETL.api.get(serverID, "/configs/"+compTypeInput+"/full");
                                    var inputNameDrawflow;
                                    if (compTypeDataFull != false) {
                                        if (compTypeDataFull["x-class"] != undefined && compTypeDataFull["x-class"]["input_port_names"] != undefined) {
                                            for (var i in compTypeDataFull["x-class"]["input_port_names"]) {
                                                if (compTypeDataFull["x-class"]["input_port_names"][i] == inputName) {
                                                    inputNameDrawflow = "input_"+(parseInt(i)+1);
                                                    break;
                                                }
                                            }
                                        }
                                    }

                                    if (inputNameDrawflow != undefined) {
                                        console.log(outputID, outputNameDrawflow, inputID, inputNameDrawflow);
                                        editor.addConnection(outputID, inputID, outputNameDrawflow, inputNameDrawflow);
                                    }


                                    
                                }

                            }
                            
                        }
                    }

                    
                    // addConnection(id_output, id_input, output_class, input_class)
                }


                for (var component of $(".component")) {
                    contextMenuSelectedComponent = $(component).attr("id");
                    var result = await contextMenuEditBtn(true);
                    if (result == true) {
                        btnSaveComponent();
                    }
                }

            }
        });
        
    }


    function exportToJson() {
        return new Promise(function(resolve, reject) {
            ETL.api.get(serverID, "/jobs/"+jobID).then(function(data) {
                if (data !== false) {

                    var drawFlowExport = editor.export();
                    var drawFlowComponents = drawFlowExport["drawflow"]["Home"]["data"];

                    data["components"] = [];
                    delete data["metadata_"];

                    if (drawFlowComponents != undefined) {

                        var promiseArray = [];

                        for (var drawFlowComponentID in drawFlowComponents) {

                            (function(drawFlowComponentID) {
                                promiseArray.push(new Promise(async function(resolve2, reject2) {

                                    var drawFlowComponent = drawFlowComponents[drawFlowComponentID];
                                    var component = drawFlowComponent.data;
                                    component["layout"] = {
                                        "x_coordinate": drawFlowComponent.pos_x,
                                        "y_coordinate": drawFlowComponent.pos_y
                                    }
                                    component["routes"] = {};
                                    component["routes"]["out"] = [];

                                    var outputs = drawFlowComponent.outputs;
                                    for (var outputName in outputs) {
                                        var output = outputs[outputName];
                                        var connections = output.connections;
                                        for (var connectionNo in connections) {
                                            var connection = connections[connectionNo];
                                            var nodeID = connection.node;
                                            var node = editor.getNodeFromId(nodeID);
                                            var to = node.data.name;
                                            var toCompType = node.data["comp_type"];

                                            var compTypeData = await ETL.api.get(serverID, "/configs/"+toCompType+"/full");
                                            if (compTypeData != false) {
                                                //console.log(compTypeData);
                                                if (compTypeData["x-class"] != undefined && compTypeData["x-class"]["input_ports"] != undefined) {
                                                    var inputPortConnectionNo = parseInt(connection.output.split("_")[1]) - 1;
                                                    if (compTypeData["x-class"]["input_ports"][inputPortConnectionNo] != undefined) {
                                                        var inputName = compTypeData["x-class"]["input_ports"][inputPortConnectionNo]["name"];
                                                        component["routes"]["out"].push({
                                                            "to": to,
                                                            "in_port": inputName
                                                        });
                                                    } 
                                                }
                                            }
                                        }
                                    }
                                    resolve2(component);
                                }));
                            })(drawFlowComponentID);
                            
                        }

                        Promise.all(promiseArray).then(function(components) {
                            for (var component of components) {
                                data["components"].push(component);
                            }
                            for (var i in data["components"]) {
                                var component = data["components"][i];
                                
                                // delete empty objects and arrays
                                for (var key in component) {
                                    var value = component[key];
                                    if (value != null) {
                                        if (typeof value == "object") {
                                            if (Object.keys(value) == 0) {
                                                delete data["components"][i][key];
                                            }
                                        } else if (typeof value == "array") {
                                            if (x.length == 0) {
                                                delete data["components"][i][key];
                                            }
                                        }
                                    } else {
                                        //delete data["components"][i][key];
                                    }
                                    
                                }

                                if (typeof component["routes"] == "object" && typeof component["out_port_schemas"] == "object") {
                                    for (var outputName in component["routes"]) {
                                        if (outputName in component["out_port_schemas"]) {
                                            var fields = component["out_port_schemas"][outputName]["fields"];
                                            for (var connection of component["routes"][outputName]) {
                                                var to = connection.to;
                                                var inputName = connection["in_port"];
                                                for (var j in data["components"]) {
                                                    if (data["components"][j]["name"] == to) {
                                                        if (data["components"][j]["in_port_schemas"] == undefined) {
                                                            data["components"][j]["in_port_schemas"] = {};
                                                        }
                                                        data["components"][j]["in_port_schemas"][inputName] = {
                                                            "fields": fields
                                                        }
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                            }
                            console.log(data);
                            resolve(data);
                        });
                    }
                } else {
                    resolve(false);
                }
            });
        });
    }


    function addComponentToWhiteboard(compType, component = {}) {

        return new Promise(function(resolve, reject) {

            ETL.api.get(serverID, "/configs/"+compType+"/form").then(function(selectedComponentRaw) {
                if (selectedComponentRaw !== false) {

                    var selectedComponent = ETL.util.deref(selectedComponentRaw);
                    //console.log(selectedComponent);

                    var title = selectedComponent.title;
                    var icon = selectedComponent.icon || "fa-solid fa-question";
                    var inputPorts = selectedComponent["x-class"]["input_ports"].length || 0;
                    var outputPorts = selectedComponent["x-class"]["output_ports"].length || 0;

                    var x_coordinate = 150;
                    var y_coordinate = 300;

                    if (typeof component.layout == "object") {
                        if (component.layout["x_coordinate"] != undefined) {
                            x_coordinate = component.layout["x_coordinate"];
                        }
                        if (component.layout["y_coordinate"] != undefined) {
                            y_coordinate = component.layout["y_coordinate"];
                        }
                    }

                    var componentProperties;

                    if (Object.entries(component).length > 0) {

                        componentProperties = component;
                        delete componentProperties["layout"];
                        delete componentProperties["metadata_"];
                        delete componentProperties["routes"];
                        delete componentProperties["in_port_schemas"];

                    } else {

                        componentProperties = {
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

                    }

                    var html = "<span class='componentIcon'><i class='"+icon+"'></i></span><br><span class='componentName'>"+componentProperties["name"]+"</span>";

                    var nodeID = editor.addNode(compType, inputPorts, outputPorts, x_coordinate, y_coordinate, 'component', componentProperties, html);

                    $('#componentDialog').removeAttr('open');

                    resolve(nodeID);
                } else {
                    resolve(false);
                }
            });

        });

    }


    function getComponentIdFromName(name) {
        var data = editor.export().drawflow.Home.data;
        for (var i in data) {
            var component = data[i];
            if (component.data.name == name) {
                return i;
            }
        }
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
    var selectedOutPortName;

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


    function loadJob(importWhiteboard = true) {
        ETL.api.get(serverID, "/jobs/"+jobID).then(function(data) {
            if (data !== false) {
                var jobName = data["name"];
                var jobLastChanged = ETL.util.formatDate(new Date(data["metadata_"]["timestamp"]));

                $("#jobTitle").html(": "+jobName);
                $("#lastChanged").html(jobLastChanged);

                if (importWhiteboard) {
                    importFromJson(data);
                }

            } else {
                window.location.href="./";
            }
        });
    }


    loadJob();


} else {


    $("#newJobSaveButton").click(function() {
        var postData = ETL.util.getFormData($("#jobDetailsFieldset"));
        var serverID = $("#newJobServerSelection").find(":selected").val();

        ETL.api.post(serverID, "/jobs/", postData).then(function(data) {
            //console.log(data);
            if (data !== false) {
                window.location.href="./?serverID="+serverID+"&job="+data;
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

