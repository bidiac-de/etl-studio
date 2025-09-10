var jobID = $("#jobID").val();
var serverID = $("#serverID").val();

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
            console.log(componentTypes);
            if (componentTypes !== false) {

                var promises = [];

                for (var componentType of componentTypes) {
                    promises.push(ETL.api.get(serverID, "/configs/"+componentType+"/form"));
                }

                Promise.allSettled(promises).then(function(data) {

                    var componentTable = "";

                    for (var componentPromise of data) {
                        var component = componentPromise.value;
                        console.log(component);

                        var componentTitle = component.title;

                        componentTable += "<tr><td><i class=\"fa-solid fa-box\"></i></td><td>"+componentTitle+"</td><td><button class=\"secondary\" disabled><i class=\"fa-solid fa-sliders\"></i> Customize</button> <button><i class=\"fa-solid fa-plus\"></i> Add</button></td></tr>";

                        
                    }

                    $("#componentsTable").html(componentTable);
                });

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
        console.log("save");
        var postData = {};
        var newJobInput = $(".newJobInput");
        newJobInput.each(function(key, value) {
            var type = $(value).attr("type");
            var postValue;
            if (type == "checkbox") {
                postValue = $(value).prop("checked");
            } else if (type == "number") {
                postValue = parseFloat($(value).val());
            } else {
                postValue = $(value).val();
            }
            if (postValue != undefined) {
                postData[$(value).attr("name")] = postValue;
            }
        });
        console.log(postData);

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
        var jobDetailsFieldsetHTML = "";
        
        ETL.api.get(serverID, "/configs/job").then(function(rawJsonData) {
            var data = ETL.util.deref(rawJsonData);
            console.log(data);

            if (data.properties != undefined) {
                for (var property of data.properties) {
                    console.log(property);

                    var propertyName = property["name"];
                    var required = property["required"] ? "required" : "";
                    var schema = property["schema"];
                    var description = schema["description"] || "";
                    var title = schema["title"] || "";
                    var defaultValue = schema["default"];
                    if (defaultValue == undefined) {
                        defaultValue = "";
                    }

                    if (schema.type == "string") {
                        jobDetailsFieldsetHTML += "<label>"+title+"<input class='newJobInput' autocomplete='off' name='"+propertyName+"' value='"+defaultValue+"' type='text' "+required+"/></label>";
                    } else if (schema.type == "integer") {
                        var minimum = "";
                        if (property.minimum != undefined) {
                            minimum = "min='"+property.minimum+"'";
                        }
                        jobDetailsFieldsetHTML += "<label>"+title+"<input class='newJobInput' autocomplete='off' name='"+propertyName+"' value='"+defaultValue+"' type='number' steps='1' "+minimum+" oninput='this.value=(parseInt(this.value)||0)' "+required+"/></label>";
                    } else if (schema.type == "boolean") {
                        defaultValue = defaultValue === true ? "checked" : "";
                        jobDetailsFieldsetHTML += "<label>"+title+"<br><input class='newJobInput' style='margin-top: 3px;' autocomplete='off' name='"+propertyName+"' "+defaultValue+" type='checkbox' "+required+"/></label>";
                    } else if (schema.type == "select") {
                        jobDetailsFieldsetHTML += "<label>"+title+"<br><select class='newJobInput' name='"+propertyName+"' aria-label='"+title+"' "+required+">";
                        for (var option of schema.enum) {
                            var selected = option == defaultValue ? "selected" : "";
                            jobDetailsFieldsetHTML += "<option "+selected+" value='"+option+"'>"+option+"</option>";
                        }
                        jobDetailsFieldsetHTML += "</select></label>";
                    }

                    

                }

                $("#jobDetailsFieldset").html(jobDetailsFieldsetHTML);
                $("#newJobSaveButton").attr("disabled", false);
            } else {
                $("#jobDetailsFieldset").html("No Server connection!");
                $("#newJobSaveButton").attr("disabled", true);
            }
        });

    });


}

