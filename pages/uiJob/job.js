var jobID = $("#jobID").val();
var serverID = parseInt($("#serverID").val(), 10);
if (isNaN(serverID)) {
    serverID = 0;
}

var componentsTemplate = {};
var components = {};
var currentJobJson;
var codemirror;

//var tmpFieldSettings = [];


if (jobID != "0") {
    ETL.contract.require(serverID).then(function(contractReady) {
    if (!contractReady) {
        return;
    }

    /**
     * Handles console log changes by updating the console text area and scrolling to bottom
     * @param {string} log - The console log content to display
     */
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
        return;
        $("#console").slideToggle(50);
        $("#consoleText").scrollTop($("#consoleText")[0].scrollHeight);
    });

    function renderExecutionMenu() {
        var environments = ETL.contract.getEnvironments(serverID);
        var html = "";
        for (var environmentInfo of environments) {
            var value = environmentInfo.value || "";
            var label = environmentInfo.label || value;
            var icon = environmentInfo.icon || "fa-solid fa-play";
            html += "<div class='btnExecutionMenu' environment='"+value+"'><i class='"+icon+"'></i>"+label+"</div>";
        }
        $("#executionMenu").html(html);
    }

    renderExecutionMenu();

    var executionLiveState = {
        executionID: null,
        environment: null,
        progressPoll: null,
        logsPoll: null,
        progressErrorShown: false,
        logsErrorShown: false
    };

    function clearExecutionPolling() {
        if (executionLiveState.progressPoll != null) {
            clearInterval(executionLiveState.progressPoll);
            executionLiveState.progressPoll = null;
        }
        if (executionLiveState.logsPoll != null) {
            clearInterval(executionLiveState.logsPoll);
            executionLiveState.logsPoll = null;
        }
    }

    function isTerminalExecutionStatus(status) {
        return status == "SUCCESS" || status == "FAILED" || status == "CANCELLED";
    }

    function setExecutionPanelStatus(status) {
        var value = status || "UNKNOWN";
        $("#executionStatusValue").text(value);
        $("#executionStatusPanel").attr("data-status", value);
    }

    function renderExecutionComponents(components) {
        var bodyHtml = "";
        if (Array.isArray(components) && components.length > 0) {
            for (var item of components) {
                var componentName = item.component_name || item.component_id || "-";
                bodyHtml += "<tr>";
                bodyHtml += "<td>" + ETL.render.escapeHTML(componentName) + "</td>";
                bodyHtml += "<td>" + ETL.render.escapeHTML(String(item.status || "-")) + "</td>";
                bodyHtml += "<td>" + ETL.render.escapeHTML(String(item.rows_received || 0)) + "</td>";
                bodyHtml += "<td>" + ETL.render.escapeHTML(String(item.rows_forwarded || 0)) + "</td>";
                bodyHtml += "<td>" + ETL.render.escapeHTML(String(item.error_count || 0)) + "</td>";
                bodyHtml += "</tr>";
            }
        } else {
            bodyHtml = "<tr><td colspan='5'><small>No component metrics available yet.</small></td></tr>";
        }
        $("#executionStatusComponentsBody").html(bodyHtml);
    }

    function renderExecutionSnapshot(snapshot) {
        if (snapshot == null || typeof snapshot != "object") {
            return;
        }
        var status = String(snapshot.status || "UNKNOWN");
        setExecutionPanelStatus(status);
        if (snapshot.execution_id != undefined) {
            $("#executionStatusExecutionID").text(String(snapshot.execution_id));
        }
        if (snapshot.environment != undefined && snapshot.environment !== null) {
            $("#executionStatusEnvironment").text(String(snapshot.environment));
        }
        $("#executionStatusAttempt").text(String(snapshot.active_attempt || 0));
        $("#executionStatusRowsReceived").text(String(snapshot.rows_received_total || 0));
        $("#executionStatusRowsForwarded").text(String(snapshot.rows_forwarded_total || 0));
        renderExecutionComponents(snapshot.components);

        var lastError = snapshot.last_error;
        if (typeof lastError == "string" && lastError.trim() != "") {
            $("#executionStatusError")
                .html("<strong>Last Error:</strong> " + ETL.render.escapeHTML(lastError))
                .show();
        } else {
            $("#executionStatusError").hide().html("");
        }
    }

    function renderExecutionLogs(logPayload) {
        if (logPayload == null || typeof logPayload != "object") {
            return;
        }
        var lines = Array.isArray(logPayload.lines) ? logPayload.lines : [];
        var logElement = $("#executionStatusLogs");
        logElement.text(lines.join("\n"));
        if (logElement.length > 0) {
            logElement.scrollTop(logElement[0].scrollHeight);
        }
    }

    function pollExecutionProgress() {
        if (executionLiveState.executionID == null) {
            return;
        }
        ETL.api
            .get(serverID, "/execution/executions/" + executionLiveState.executionID + "/progress")
            .then(function(snapshot) {
                if (snapshot === false) {
                    if (!executionLiveState.progressErrorShown) {
                        ETL.util.alert(
                            "Execution status unavailable",
                            "Could not load live execution progress right now."
                        );
                        executionLiveState.progressErrorShown = true;
                    }
                    return;
                }
                executionLiveState.progressErrorShown = false;
                renderExecutionSnapshot(snapshot);
                if (isTerminalExecutionStatus(String(snapshot.status || ""))) {
                    clearExecutionPolling();
                    pollExecutionLogs();
                }
            });
    }

    function pollExecutionLogs() {
        if (executionLiveState.executionID == null) {
            return;
        }
        ETL.api
            .get(serverID, "/execution/executions/" + executionLiveState.executionID + "/logs?tail=180")
            .then(function(logPayload) {
                if (logPayload === false) {
                    if (!executionLiveState.logsErrorShown) {
                        ETL.util.alert(
                            "Execution logs unavailable",
                            "Could not load live execution logs right now."
                        );
                        executionLiveState.logsErrorShown = true;
                    }
                    return;
                }
                executionLiveState.logsErrorShown = false;
                renderExecutionLogs(logPayload);
            });
    }

    function startExecutionLiveView(executionID, environment) {
        clearExecutionPolling();
        executionLiveState.executionID = executionID;
        executionLiveState.environment = environment || "-";
        executionLiveState.progressErrorShown = false;
        executionLiveState.logsErrorShown = false;

        $("#executionStatusPanel").removeClass("executionPanelHidden");
        setExecutionPanelStatus("STARTING");
        $("#executionStatusExecutionID").text(String(executionID || "-"));
        $("#executionStatusEnvironment").text(String(environment || "-"));
        $("#executionStatusAttempt").text("0");
        $("#executionStatusRowsReceived").text("0");
        $("#executionStatusRowsForwarded").text("0");
        $("#executionStatusError").hide().html("");
        $("#executionStatusComponentsBody").html("<tr><td colspan='5'><small>Waiting for execution telemetry...</small></td></tr>");
        $("#executionStatusLogs").text("");

        pollExecutionProgress();
        pollExecutionLogs();
        executionLiveState.progressPoll = setInterval(pollExecutionProgress, 1000);
        executionLiveState.logsPoll = setInterval(pollExecutionLogs, 2000);
    }

    $("#btnExecuteScript").click(function(event) {

        allowExecutionMenuHide = false;
        $("#executionMenu").css({ 
            top: event.pageY + 15, 
            left: event.pageX - 75
        }).show();

        setTimeout(function() {
            allowExecutionMenuHide = true;
        }, 1000);
        
        /*$("#console").slideDown(50);
        ETL.console.log("upload job id " + jobID + " to execution server", true, "");
        setInterval(function() {
            ETL.console.log(".", false, "");
        }, 1000);*/

        /*ETL.api.post(serverID, "/execution/"+jobID, {}, true).then(function(data) {
            console.log(data);
        });*/

    });

    $(document).on("click", ".btnExecutionMenu", function() {
        var environment = $(this).attr("environment");
        $("#executionMenu").hide();

        ETL.api.post(serverID, "/execution/"+jobID, {
            environment: environment
        }, true).then(function(data) {
            if (data !== false) {
                if (data.status == "started" && data.execution_id != undefined) {
                    ETL.util.alert(
                        "<i class='fa-solid fa-circle-check pico-color-green-550'></i> Job started",
                        "Execution ID: <code>" + ETL.render.escapeHTML(String(data.execution_id)) + "</code>"
                    );
                    startExecutionLiveView(String(data.execution_id), environment);
                } else if (data.status == "started") {
                    ETL.util.alert(
                        "<i class='fa-solid fa-circle-check pico-color-green-550'></i> Job started",
                        "Execution started, but no execution ID was returned."
                    );
                }
            }
            
        });
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
        ETL.api.get(serverID, "/configs/component_types").then(function(componentTypes) {
            if (componentTypes !== false) {

                var promises = [];

                for (var componentType of componentTypes) {
                    promises.push(ETL.api.get(serverID, "/configs/"+componentType+"/form"));
                }

                Promise.allSettled(promises).then(function(data) {

                    var componentTable = "";

                    for (var componentPromise of data) {
                        if (componentPromise.status != "fulfilled") {
                            continue;
                        }
                        var componentRaw = componentPromise.value;
                        if (componentRaw === false || componentRaw == null || typeof componentRaw != "object") {
                            continue;
                        }

                        var component = ETL.util.deref(componentRaw);
                        if (component == null || typeof component != "object") {
                            continue;
                        }

                        var componentTitle = component.title;
                        var compType = component["comp-type"];
                        if (typeof compType != "string" || compType == "") {
                            continue;
                        }
                        var icon = component["icon"];

                        if (typeof icon != "string") {
                            icon = "fa-solid fa-question";
                        }

                        componentsTemplate[compType] = component;
                        componentTable += "<tr><td><div><i class=\""+icon+"\"></i></div></td><td>"+componentTitle+"</td><td><button class=\"secondary\" disabled><i class=\"fa-solid fa-sliders\"></i> Customize</button> <button class='btnAddComponentToWhiteboard' data-comp-type='"+ETL.render.escapeHTML(compType)+"'><i class=\"fa-solid fa-plus\"></i> Add</button></td></tr>";

                        
                    }

                    if (componentTable == "") {
                        componentTable = "<tr><td colspan='3'>No components available from core.</td></tr>";
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
        $("#btnSave").prop("disabled", true);
        exportToJson().then(function(json) {
            ETL.api.put(serverID, "/jobs/"+jobID, json, true).then(function(data) {
                //console.log(data);
                loadJob(false);
            });
        });
    });

    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            $("#btnSave").click();
        }
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
        if (postData === false) {
            return;
        }
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

                ETL.render
                    .componentEdit(selectedComponentID, { editor: editor, serverID: serverID })
                    .then(function(result) {
                        var applied = ETL.util.applyComponentEditDialogResult(result);
                        if (applied && ETL.util != undefined && typeof ETL.util.initContextTemplateAssist == "function") {
                            ETL.util.initContextTemplateAssist($("#componentEditDialogMain"), serverID);
                        }
                        resolve(applied);
                    })
                    .catch(function() {
                        resolve(ETL.util.applyComponentEditDialogResult(false));
                    });
            } else {
                resolve(false);
            }
        });
    }


    function deepSet(obj, path, value) {
        const lastIndex = path.length - 1;
        const last = path[lastIndex];

        for (let i = 0; i < lastIndex; i++) {
            const key = path[i];

            if (!obj[key] && i < lastIndex) {
                obj[key] = {};
            }
            obj = obj[path[i]];
        }

        if (Array.isArray(obj[last])) {
            obj[last].push(value);
        } else {
            obj[last] = value;
        }
    }

    var componentSchemaFullCache = {};

    function normalizePortName(portValue) {
        if (typeof portValue == "string") {
            return portValue;
        }
        if (portValue != null && typeof portValue == "object" && typeof portValue.name == "string") {
            return portValue.name;
        }
        return "";
    }

    function mergePortNames(basePortNames = [], extraPorts = [], schemaMap = {}) {
        var names = [];
        for (var basePortName of basePortNames) {
            if (typeof basePortName == "string" && basePortName != "") {
                names.push(basePortName);
            }
        }
        if (Array.isArray(extraPorts)) {
            for (var extraPort of extraPorts) {
                var extraPortName = normalizePortName(extraPort);
                if (extraPortName != "") {
                    names.push(extraPortName);
                }
            }
        }
        if (schemaMap != null && typeof schemaMap == "object") {
            for (var schemaPortName in schemaMap) {
                names.push(schemaPortName);
            }
        }
        return Array.from(new Set(names));
    }

    async function getComponentSchemaFull(compType) {
        if (componentSchemaFullCache[compType] != undefined) {
            return componentSchemaFullCache[compType];
        }
        var schema = await ETL.api.get(serverID, "/configs/" + compType + "/full");
        if (schema !== false) {
            schema = ETL.util.deref(schema);
            componentSchemaFullCache[compType] = schema;
            return schema;
        }
        return false;
    }

    async function getPortNamesForComponent(compType, componentData, direction = "output") {
        var schemaFull = await getComponentSchemaFull(compType);
        if (schemaFull === false) {
            return [];
        }

        var classMeta = schemaFull["x-class"] || {};
        if (direction == "input") {
            return mergePortNames(
                classMeta["input_port_names"] || [],
                componentData["extra_input_ports"] || [],
                componentData["in_port_schemas"] || {}
            );
        }
        return mergePortNames(
            classMeta["output_port_names"] || [],
            componentData["extra_output_ports"] || [],
            componentData["out_port_schemas"] || {}
        );
    }

    async function syncNodePorts(nodeID, compType, componentData) {
        var expectedInputPorts = await getPortNamesForComponent(compType, componentData, "input");
        var expectedOutputPorts = await getPortNamesForComponent(compType, componentData, "output");

        var node = editor.getNodeFromId(nodeID);
        if (node == undefined) {
            return;
        }

        var currentInputs = Object.keys(node.inputs || {}).length;
        var currentOutputs = Object.keys(node.outputs || {}).length;

        while (currentInputs > expectedInputPorts.length) {
            editor.removeNodeInput(nodeID, "input_" + currentInputs);
            currentInputs--;
        }
        while (currentInputs < expectedInputPorts.length) {
            editor.addNodeInput(nodeID);
            currentInputs++;
        }

        while (currentOutputs > expectedOutputPorts.length) {
            editor.removeNodeOutput(nodeID, "output_" + currentOutputs);
            currentOutputs--;
        }
        while (currentOutputs < expectedOutputPorts.length) {
            editor.addNodeOutput(nodeID);
            currentOutputs++;
        }
    }


    function getRulesSchema() {
        /*var ruleExample = {
            "logical_operator": "OR",
            "rules": [
                { "column": "name", "operator": "==", "value": "Alice" },
                { "column": "name", "operator": "==", "value": "Charlie" }
            ]
        }*/

        var rules = {};
        var pos = [];

        var ruleItemsTr = $("#ruleTable tr");
        for (var item of ruleItemsTr) {
            var level = parseInt($(item).attr("level"));
            var itemType = $(item).attr("class");

            for (var i = 0; i < pos.length - level - 1; i++) {
                pos.pop();
            }   

            if (pos[level] == undefined) {
                pos[level] = 0;
            } else {
                pos[level]++;
            }
            
            if (itemType == "logicItem") {
                var operator = $(item).find("select").val();
                var ruleItem = {
                    "logical_operator": operator,
                    "rules": []
                };
                if (level > 0) {
                    var path = ["rules"];
                    for (var i = 1; i < level; i++) {
                        path.push(pos[i]);
                        path.push("rules");
                    }
                    deepSet(rules, path, ruleItem);
                } else {
                    rules = ruleItem;
                }
            } else if (itemType == "singleItem") {
                var operator = $(item).find("select").val();
                var column = $($(item).find("input")[0]).val();
                var value = $($(item).find("input")[1]).val();
                var ruleItem = {
                    "column": column,
                    "operator": operator,
                    "value": value
                };
                if (level > 0) {
                    var path = ["rules"];
                    for (var i = 1; i < level; i++) {
                        path.push(pos[i]);
                        path.push("rules");
                    }
                    deepSet(rules, path, ruleItem);
                } else {
                    rules = ruleItem;
                }
            }

        }

        return rules;
    }


    $("#btnSaveComponent").click(btnSaveComponent);

    async function btnSaveComponent() {
        if (contextMenuSelectedComponent != undefined) {
            var selectedComponentID = contextMenuSelectedComponent.split("-")[1];
            var newData = ETL.util.getFormData($("#componentEditDialogMain"));
            if (newData === false) {
                return;
            }
            var selectedNode = editor.getNodeFromId(selectedComponentID);
            var updateData = selectedNode.data;
            for (var key in newData) {
                var value = newData[key];
                updateData[key] = value;
            }
            var rules = getRulesSchema();
            if (Object.keys(rules).length > 0) {
                updateData["rule"] = rules;
            }
            editor.updateNodeDataFromId(selectedComponentID, updateData);
            await syncNodePorts(selectedComponentID, updateData["comp_type"], updateData);
            $("#"+contextMenuSelectedComponent).find(".componentName").html(updateData.name);
            $('#componentEditDialog').removeAttr('open');
            editor.updateConnectionNodes(contextMenuSelectedComponent);
        }
        onWhiteboardChange();
    }

    $(document).on("dblclick", ".component", function(event) {
        var component = $(event.currentTarget).closest(".component");
        if (component.length == 1) {
            contextMenuSelectedComponent = $(component).attr("id");
            contextMenuEditBtn();
        }
    });

    $(document).on("click", ".btnEditPortSchema", function() {
        if (contextMenuSelectedComponent != undefined) {
            var selectedPortNameValue = $(this).attr("data-port-name");
            var selectedSchemaField = $(this).attr("data-schema-field");
            var selectedComponentID = contextMenuSelectedComponent.split("-")[1];
            openFieldDialog(selectedComponentID, selectedSchemaField, selectedPortNameValue);
        }
    });

    $(document).on("click", "#btnAddField", function() {
        if (contextMenuSelectedComponent != undefined) {
            var html = createFieldDefElement();
            $("#fieldDefDialogMainTable").append(html);
        }
    });


    $(document).on("click", ".btnDeleteFieldDef", function() {
        $(this).closest("tr").remove();
    });

    $(document).on("click", ".btnAddSubFieldDef", function() {
        var parentTr = $(this).closest("tr");
        var depth = parseInt($(parentTr).attr("depth")) + 1;

        var dataType = $(parentTr).find(".dataType").val();
        if (dataType == "array" && $(parentTr).next().attr("depth") == depth) {
            return;
        }
        var html = "";
        if (dataType == "enum") {
            html = createFieldDefElement(depth, "", "", false, true);
        } else {
            html = createFieldDefElement(depth);
        }
        $(html).insertAfter(parentTr);
    });

    $(document).on("change", ".dataType", function() {
        var dataType = $(this).val();
        var parentTr = $(this).closest("tr");
        var btnAddSubFieldDef = $(parentTr).find(".btnAddSubFieldDef");

        if (dataType == "object" || dataType == "array" || dataType == "enum") {
            $(btnAddSubFieldDef).prop("disabled", false);
        } else {
            $(btnAddSubFieldDef).prop("disabled", true);
        }
    });


    function createFieldDefElement(depth = 0, name = "", type = "", nullable = false, isEnum = false) {
        var dataTypeDefEnum = ETL.contract.getDataTypes(serverID);

        var left = 14 + 10 * depth;
        var spaces = "";
        for (var i = 0; i < depth * 10; i++) {
            spaces += "&nbsp;";
        }
        var html = "<tr depth='"+depth+"'>";
        html += "<td style='padding-left: "+left+"px;'><input type='text' placeholder='Name' value='"+name+"' class='name' /></td>";
        if (!isEnum) {
            html += "<td><select class='dataType'>";
            for (var item of dataTypeDefEnum) {
                var selected = item == type ? "selected" : "";
                html += "<option value='"+item+"' "+selected+">"+item+"</option>";
            }
            html += "</select></td>";
            var checked = nullable ? "checked" : "";
            html += "<td><input type='checkbox' "+checked+" class='nullable' /></td>";
        } else {
            html += "<td></td><td></td>";
        }

        var disabled = "disabled";
        if (type == "object" || type == "array" || type == "enum") {
            disabled = "";
        }
        
        html += "<td><button class='secondary btnAddSubFieldDef' "+disabled+"><i class='fa-solid fa-plus'></i></button> <button class='pico-background-red-550 btnDeleteFieldDef'><i class='fa-solid fa-trash'></i></button></td>";
        html += "</tr>";

        return html;
    }


    function setValueAtPath(obj, path, value) {
        let current = obj;
        var dataType;
        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            current = current[key];
            if (current == undefined) {
                break;
            }
            dataType = current["data_type"];
            if (dataType == "object") {
                current = current["children"];
            } else if (dataType == "array") {
                if (i < path.length - 2) {
                    current = current["item"];
                }
            } else if (dataType == "enum") {
                current = current["enum_values"];
            }
        }
        if (dataType == "object") {
            current[path[path.length - 1]] = value;
        } else if (dataType == "array") {
            if (current != undefined) {
                current["item"] = value;
            }
        } else if (dataType == "enum") {
            current[path[path.length - 1]] = value;
        } else {
            current[path[path.length - 1]] = value;
        }
        
    }

    $(document).on("click", "#btnSaveFieldDef", function() {

        if (contextMenuSelectedComponent != undefined) {
            var selectedComponentID = contextMenuSelectedComponent.split("-")[1];
            var selectedNode = editor.getNodeFromId(selectedComponentID);
            var updateData = selectedNode.data;

            var fields = [];
            var tableBodyFields = $("#tableBodyFields tr");
            var isError = false;
            var fieldPos = [];

            for (var index = 0; index < tableBodyFields.length; index++) {

                var line = $(tableBodyFields[index]);
                var depth = parseInt($(line).attr("depth"));
                var name = $(line).find(".name").val();
                var dataType = $(line).find(".dataType").val();
                var nullable = $(line).find(".nullable").prop("checked");
                
            
                if (name == "") {
                    $(line).find(".name").attr("aria-invalid", "true");
                    isError = true;
                } else {
                    $(line).find(".name").removeAttr("aria-invalid");

                    if (fieldPos.length == depth) {
                        fieldPos[depth] = 0;
                    } else {
                        fieldPos[depth]++;
                    }

                    var times = fieldPos.length - depth - 1;
                    for (var i = 0; i < times; i++) {
                        fieldPos.pop();
                    }

                    var field = {
                        "name": name,
                        "data_type": dataType,
                        "nullable": nullable
                    }

                    if (dataType == "object") {
                        field["children"] = [];
                    } else if (dataType == "array") {
                        field["item"] = null;
                    } else if (dataType == "enum") {
                        field["enum_values"] = [];
                    } else if (dataType == undefined) {
                        field = name;
                    }
                    
                    setValueAtPath(fields, fieldPos, field);
                }
            }

            console.log(fields);

            if (isError) {
                return;
            }

            if (typeof selectedPortSchemaField == "string" && selectedPortSchemaField != "") {
                if (typeof updateData[selectedPortSchemaField] != "object" || updateData[selectedPortSchemaField] == null) {
                    updateData[selectedPortSchemaField] = {};
                }
                if (typeof updateData[selectedPortSchemaField][selectedPortName] != "object") {
                    updateData[selectedPortSchemaField][selectedPortName] = {
                        fields: []
                    };
                }
                updateData[selectedPortSchemaField][selectedPortName]["fields"] = fields;
            }
            
            editor.updateNodeDataFromId(selectedComponentID, updateData);
            $('#fieldDefDialog').removeAttr('open');


        }
    });


    function openFieldDialog(selectedComponentID, selectedSchemaField, selectedPortNameValue) {
        
        var selectedNode = editor.getNodeFromId(selectedComponentID);
        var data = selectedNode.data;
        var fields = [];
        selectedPortSchemaField = selectedSchemaField;
        selectedPortName = selectedPortNameValue;

        console.log(data);

        if (
            selectedSchemaField != undefined &&
            data[selectedSchemaField] != undefined &&
            data[selectedSchemaField][selectedPortNameValue] != undefined &&
            data[selectedSchemaField][selectedPortNameValue]["fields"] != undefined
        ) {
            fields = data[selectedSchemaField][selectedPortNameValue]["fields"];
        }

        $("#tableBodyFields").html("");

        for (var field of fields) {
            var html = createFieldDefElement(0, field["name"], field["data_type"], field["nullable"]);
            $("#tableBodyFields").append(html);
        }

        $("#fieldDefDialog").attr("open", "");
        
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
                    //console.log(component);

                    var outputID = getComponentIdFromName(component.name);
                    var compType = component["comp_type"];

                    if (component.routes != undefined) {
                        for (var outputName in component.routes) {
                            var outputNameDrawflow;
                            var outputPortNames = await getPortNamesForComponent(compType, component, "output");
                            var outputPortIndex = outputPortNames.indexOf(outputName);
                            if (outputPortIndex >= 0) {
                                outputNameDrawflow = "output_" + (outputPortIndex + 1);
                            }

                            if (outputNameDrawflow != undefined) {
                                var connections = component.routes[outputName];
                                for (var connection of connections) {
                                    //console.log(connection);

                                    var inputID = getComponentIdFromName(connection.to);
                                    var inputName = connection["in_port"];
                                    var inputNode = editor.getNodeFromId(inputID);
                                    var compTypeInput = inputNode.data["comp_type"];

                                    var inputNameDrawflow;
                                    var inputPortNames = await getPortNamesForComponent(compTypeInput, inputNode.data, "input");
                                    var inputPortIndex = inputPortNames.indexOf(inputName);
                                    if (inputPortIndex >= 0) {
                                        inputNameDrawflow = "input_" + (inputPortIndex + 1);
                                    }

                                    if (inputNameDrawflow != undefined) {
                                        //console.log(outputID, outputNameDrawflow, inputID, inputNameDrawflow);
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
                        await btnSaveComponent();
                    }
                }

            }
            resolve();
            $("#btnSave").prop("disabled", true);
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
                                    //component["routes"]["out"] = [];

                                    var outputs = drawFlowComponent.outputs;
                                    for (var outputName in outputs) {
                                        var fromCompType = component["comp_type"];
                                        var realOutputName = "out";
                                        var outputPortNames = await getPortNamesForComponent(fromCompType, component, "output");
                                        var outputPortIndex = parseInt(outputName.split("_")[1]) - 1;
                                        if (outputPortNames[outputPortIndex] != undefined) {
                                            realOutputName = outputPortNames[outputPortIndex];
                                        }
                                        component["routes"][realOutputName] = [];

                                        
                                        var output = outputs[outputName];
                                        var connections = output.connections;
                                        for (var connectionNo in connections) {
                                            var connection = connections[connectionNo];
                                            var nodeID = connection.node;
                                            var node = editor.getNodeFromId(nodeID);
                                            var to = node.data.name;
                                            var toCompType = node.data["comp_type"];

                                            var inputPortNames = await getPortNamesForComponent(toCompType, node.data, "input");
                                            var inputPortConnectionNo = parseInt(connection.output.split("_")[1]) - 1;
                                            var inputName = inputPortNames[inputPortConnectionNo];
                                            if (typeof inputName != "string" || inputName == "") {
                                                inputName = "in";
                                            }
                                            component["routes"][realOutputName].push({
                                                "to": to,
                                                "in_port": inputName
                                            });
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

        console.log("addComponentToWhiteboard");
        console.log(compType);

        return new Promise(function(resolve, reject) {

            ETL.api.get(serverID, "/configs/"+compType+"/form").then(function(selectedComponentRaw) {
                if (selectedComponentRaw !== false) {

                    var selectedComponent = ETL.util.deref(selectedComponentRaw);
                    console.log(selectedComponent);

                    var title = selectedComponent.title;
                    var icon = selectedComponent.icon || "fa-solid fa-question";
                    var inputPortNames = selectedComponent["x-class"]["input_port_names"] || [];
                    var outputPortNames = selectedComponent["x-class"]["output_port_names"] || [];

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

                        var selectedComponentProperties = ETL.render.normalizeProperties(selectedComponent);
                        for (var property of selectedComponentProperties) {
                            var propertyName = property.name;
                            var propertyValue = undefined;
                            var normalizedSchema = ETL.render.normalizeSchema(property.schema, propertyName);
                            var propertyDefault = normalizedSchema.default;
                            var propertyType = normalizedSchema.type;

                            if (propertyType == "string") {
                                propertyValue = propertyDefault || "";
                            } else if (propertyType == "object") {
                                propertyValue = propertyDefault || {};
                            } else if (propertyType == "array") {
                                propertyValue = propertyDefault || [];
                            } else if (propertyType == "integer") {
                                propertyValue = propertyDefault || 0;
                            } else if (propertyType == "number") {
                                propertyValue = propertyDefault || 0;
                            } else if (propertyDefault == null && normalizedSchema.nullable === true) {
                                propertyValue = null;
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

                    if (Array.isArray(componentProperties["extra_input_ports"])) {
                        inputPortNames = mergePortNames(
                            inputPortNames,
                            componentProperties["extra_input_ports"],
                            componentProperties["in_port_schemas"] || {}
                        );
                    }
                    if (Array.isArray(componentProperties["extra_output_ports"])) {
                        outputPortNames = mergePortNames(
                            outputPortNames,
                            componentProperties["extra_output_ports"],
                            componentProperties["out_port_schemas"] || {}
                        );
                    }

                    var inputPorts = inputPortNames.length;
                    var outputPorts = outputPortNames.length;

                    var html = "<span class='componentIcon'><i class='"+icon+"'></i></span><br><span class='componentName'>"+componentProperties["name"]+"</span>";

                    var nodeID = editor.addNode(compType, inputPorts, outputPorts, x_coordinate, y_coordinate, 'component', componentProperties, html);

                    $('#componentDialog').removeAttr('open');

                    syncNodePorts(nodeID, compType, componentProperties).then(function() {
                        resolve(nodeID);
                    });
                } else {
                    resolve(false);
                }
            });

        });

    }

    $(document).on("click", ".btnAddComponentToWhiteboard", function() {
        var compType = $(this).attr("data-comp-type");
        if (typeof compType == "string" && compType != "") {
            addComponentToWhiteboard(compType);
        }
    });


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

    function onWhiteboardChange() {
        $("#btnSave").prop("disabled", false);
    }


    $(document).on("click", function() {
        $("#contextMenu").hide();
        if (allowExecutionMenuHide) {
            $("#executionMenu").hide();
        }
    });

    $(document).on("click", ".btnAddSingleRule", function() {
        console.log(this);
        var closestTr = $(this).closest("tr");
        var subQuantity = $(closestTr).length;
        var level = 0;
        if ($(closestTr).length > 0) {
            level = parseInt($(closestTr).attr("level")) + 1;
        }
        var margin = 10 + level * 15;
        if (subQuantity > 0 || (subQuantity == 0 && $("#ruleTable tr").length == 0)) {
            var html = "<tr class='singleItem' level='"+level+"'><td style='padding-left: "+margin+"px'><input type='text' placeholder='Coloum'></td><td><select>";
            var operators = ETL.contract.getRuleOperators(serverID);
            for (var item of operators) {
                html += "<option>"+item+"</option>";
            }
            html += "</select></td><td><input type='text' placeholder='Value'></td><td><button class='pico-background-red-550 btnRemoveRule'><i class='fa-solid fa-trash'></i></button></td></tr>";
            if ($(closestTr).length > 0) {
                $(html).insertAfter(closestTr);
            } else {
                $("#ruleTable").append(html);
            }
            
        }
        
    });

    $(document).on("click", ".btnAddLogicalRule", function() {
        console.log(this);
        var closestTr = $(this).closest("tr");
        var level = 0;
        if ($(closestTr).length > 0) {
            level = parseInt($(closestTr).attr("level")) + 1;
        }
        var margin = 10 + level * 15;
        if (true) {
            var html = "<tr class='logicItem' level='"+level+"'><td style='padding-left: "+margin+"px'><select>";
            var logicalOperators = ETL.contract.getRuleLogicalOperators(serverID);
            for (var item of logicalOperators) {
                html += "<option>"+item+"</option>";
            }
            html += "</select></td><td><button class='secondary btnAddSingleRule' style='margin-right: 10px; width: 100%;'><i class='fa-solid fa-plus'></i> Simple</button></td><td><button class='secondary btnAddLogicalRule' style='width: 100%;'><i class='fa-solid fa-plus'></i> Combined</button></td><td><button class='pico-background-red-550 btnRemoveRule'><i class='fa-solid fa-trash'></i></button></td></tr>";
            if ($(closestTr).length > 0) {
                $(html).insertAfter(closestTr);
            } else {
                $("#ruleTable").append(html);
            }
        }
    });

    $(document).on("click", ".btnRemoveRule", function() {
        $(this).closest("tr").remove();
    });

    var allowExecutionMenuHide = true;
    var drawflow = document.getElementById("drawflow");
    var editor = new Drawflow(drawflow);
    var contextMenuSelectedConnection;
    var contextMenuSelectedComponent;
    var selectedPortSchemaField;
    var selectedPortName;

    editor.editor_mode = "edit";
    editor.zoom_value = 0.01;
    editor.reroute = false;
    editor.snap = true;
    editor.grid = true;
    editor.grid_size = 20;

    editor.start();
    ETL.runtime = ETL.runtime || {};
    ETL.runtime.editor = editor;
    ETL.runtime.serverID = serverID;

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

    editor.on("nodeCreated", onWhiteboardChange);
    editor.on("nodeRemoved", onWhiteboardChange);
    editor.on("nodeDataChanged", onWhiteboardChange);
    editor.on("nodeMoved", onWhiteboardChange);
    editor.on("connectionCreated", onWhiteboardChange);
    editor.on("connectionRemoved", onWhiteboardChange);



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
    $(window).on("beforeunload", clearExecutionPolling);

    });


} else {


    $("#newJobSaveButton").click(function() {
        var postData = ETL.util.getFormData($("#jobDetailsFieldset"));
        if (postData === false) {
            return;
        }
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
