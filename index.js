var darktheme = JSON.parse(localStorage.getItem("darktheme"));
if (darktheme == null) {
    darktheme = true;
    localStorage.setItem("darktheme", true);
}
if (darktheme) {
    $("html").attr("data-theme", "dark");
}


var ETL = {};


/** Console */

ETL.console = {};

ETL.console.getLocaleDatetime = function() {
    return new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    }) + " " + new Date().toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
    });
}

ETL.console.log = function(msg = "", showTimestamp = true, end = "\r\n") {
    var etlConsoleLog = ETL.console.get();
    if (etlConsoleLog == null) etlConsoleLog = "";
    if (etlConsoleLog.slice(-2) != "\r\n" && showTimestamp) etlConsoleLog += "\r\n";
    if (showTimestamp) etlConsoleLog += ETL.console.getLocaleDatetime() + " > ";
    etlConsoleLog += msg + end;
    var bufferSize = localStorage.getItem("etlConsoleLogBufferSize") || 10000;
    localStorage.setItem("etlConsoleLog", etlConsoleLog.slice(-bufferSize));
    ETL.console.fireChangeHandler();
}

ETL.console.get = function() {
    var etlConsoleLog = localStorage.getItem("etlConsoleLog");
    if (etlConsoleLog == null) etlConsoleLog = "";
    return etlConsoleLog;
}

ETL.console.clear = function() {
    localStorage.removeItem("etlConsoleLog");
    ETL.console.fireChangeHandler();
}

ETL.console.fireChangeHandler = function() {
    var etlConsoleLog = ETL.console.get();
    ETL.console.onChangeHandler(etlConsoleLog);
}

ETL.console.onChangeHandler = function(log) {}



/** API */

ETL.api = ETL.api || {};

ETL.api.onError = function(data) {
    console.log(data);

    var title = "Server Error";
    var htmlErrorMsg = "Unexpected response from server";

    if (data.responseJSON != undefined && data.responseJSON.detail != undefined && data.responseJSON.detail.length > 0) {
        var errorDetail = data.responseJSON.detail[0];
        var msg = errorDetail.msg || "Unexpected response from server";
        var loc = errorDetail.loc || [];
        title = data.statusText || "Server Error";

        htmlErrorMsg = "<br>";
        if (loc.length > 0) {
            htmlErrorMsg += "<kbd>Location";
            for (var item of loc) {
                htmlErrorMsg += ' <i class="fa-solid fa-chevron-right"></i> ' + item;
            }
            htmlErrorMsg += "</kbd><br><br>";
        }

        if (errorDetail.input != undefined && errorDetail.input.name != undefined) {
            htmlErrorMsg += "<kbd>Component: "+errorDetail.input.name+"</kbd><br><br>";
        }
        
        htmlErrorMsg += "<kbd>Message: "+msg+"</kbd>";
    }

    ETL.util.alert("<i class='fa-solid fa-triangle-exclamation pico-color-red-550'></i> Error: " + title, htmlErrorMsg);
    
}

ETL.api.get = function(serverID = 0, endpoint = "", data = {}, showError = false) {
    return new Promise(function(resolve, reject) {
        if (server[serverID] != undefined) {
            var url = server[serverID].host+endpoint;
            $.ajax({
                url: url,
                data: data,
                method: "GET",
                timeout: 2000,
                success: function(data) {
                    resolve(data);
                },
                error: function(data) {
                    if (showError) {
                        ETL.api.onError(data);
                    }
                    resolve(false);
                }
            });
        } else {
            resolve(false);
        }
    });
}

ETL.api.post = function(serverID = 0, endpoint = "", data = {}, showError = false) {
    return new Promise(function(resolve, reject) {
        if (server[serverID] != undefined) {
            var url = server[serverID].host+endpoint;
            $.ajax({
                url: url,
                data: JSON.stringify(data),
                method: "POST",
                timeout: 2000,
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    resolve(data);
                },
                error: function(data) {
                    if (showError) {
                        ETL.api.onError(data);
                    }
                    resolve(false);
                }
            });
        } else {
            resolve(false);
        }
    });
}

ETL.api.put = function(serverID = 0, endpoint = "", data = {}, showError = false) {
    return new Promise(function(resolve, reject) {
        if (server[serverID] != undefined) {
            var url = server[serverID].host+endpoint;
            $.ajax({
                url: url,
                data: JSON.stringify(data),
                method: "PUT",
                timeout: 2000,
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    resolve(data);
                },
                error: function(data) {
                    if (showError) {
                        ETL.api.onError(data);
                    }
                    resolve(false);
                }
            });
        } else {
            resolve(false);
        }
    });
}

ETL.api.delete = function(serverID = 0, endpoint = "", showError = false) {
    return new Promise(function(resolve, reject) {
        if (server[serverID] != undefined) {
            var url = server[serverID].host+endpoint;
            $.ajax({
                url: url,
                method: "DELETE",
                timeout: 2000,
                success: function(data) {
                    resolve(true);
                },
                error: function(data) {
                    if (showError) {
                        ETL.api.onError(data);
                    }
                    resolve(false);
                }
            });
        } else {
            resolve(false);
        }
    });
}



/** Render */

ETL.render = ETL.render || {};

ETL.render.propertyToHTML = function(property, defaultValue = undefined) {
    //console.log(property);
    var propertyName = property["name"];
    var required = property["required"] ? "required" : "";
    var schema = property["schema"];
    var description = schema["description"] || "";
    var title = schema["title"] || "";
    if (defaultValue === undefined) {
        defaultValue = schema["default"];
        if (defaultValue == undefined) {
            defaultValue = "";
        }
    }
    
    jobDetailsFieldsetHTML = "";

    if (schema.type == "string") {
        jobDetailsFieldsetHTML += "<label>"+title+"<input class='formInput' autocomplete='off' name='"+propertyName+"' value='"+defaultValue+"' type='text' "+required+"/></label>";
    } else if (schema.type == "integer") {
        var minimum = "";
        if (property.minimum != undefined) {
            minimum = "min='"+property.minimum+"'";
        }
        jobDetailsFieldsetHTML += "<label>"+title+"<input class='formInput' autocomplete='off' name='"+propertyName+"' value='"+defaultValue+"' type='number' steps='1' "+minimum+" oninput='this.value=(parseInt(this.value)||0)' "+required+"/></label>";
    } else if (schema.type == "boolean") {
        defaultValue = defaultValue === true ? "checked" : "";
        jobDetailsFieldsetHTML += "<label>"+title+"<br><input class='formInput' style='margin-top: 3px;' autocomplete='off' name='"+propertyName+"' "+defaultValue+" type='checkbox' "+required+"/></label>";
    } else if (schema.type == "select") {
        jobDetailsFieldsetHTML += "<label>"+title+"<br><select class='formInput' name='"+propertyName+"' aria-label='"+title+"' "+required+">";
        for (var option of schema.enum) {
            var selected = option == defaultValue ? "selected" : "";
            jobDetailsFieldsetHTML += "<option "+selected+" value='"+option+"'>"+option+"</option>";
        }
        jobDetailsFieldsetHTML += "</select></label>";
    }

    return jobDetailsFieldsetHTML;
}

ETL.render.jobEdit = function(serverID, jobID = undefined) {
    return new Promise(function(resolve, reject) {
        ETL.api.get(serverID, "/configs/job").then(function(rawJsonData) {
            var data = ETL.util.deref(rawJsonData);
            //console.log(data);

            var html = "";

            if (data.properties != undefined) {

                if (jobID != undefined) {
                    ETL.api.get(serverID, "/jobs/"+jobID).then(function(jobData) {
                        if (jobData !== false) {
                            //console.log(jobData);
                            for (var property of data.properties) {
                                var propertyName = property["name"];
                                //console.log(propertyName);
                                //console.log(jobData[propertyName]);
                                html += ETL.render.propertyToHTML(property, jobData[propertyName]);
                            }
                            resolve(html);
                        } else {
                            resolve(false);
                        }
                    });
                } else {
                    for (var property of data.properties) {
                        html += ETL.render.propertyToHTML(property);
                    }
                    resolve(html);
                }                
            } else {
                resolve(false);
            }
        });
    });
}

ETL.render.componentEdit = function(componentID) {
    return new Promise(function(resolve, reject) {

        var selectedEditComponent = editor.getNodeFromId(componentID);
        var compType = selectedEditComponent.data["comp_type"];
        //console.log(selectedEditComponent, compType);

        ETL.api.get(serverID, "/configs/"+compType+"/form").then(function(componentFormRaw) {
            var data = ETL.util.deref(componentFormRaw);
            var html = "";

            if (data.properties != undefined) {

                for (var property of data.properties) {
                    var propertyName = property["name"];
                    var schema = property["schema"];
                    var title = schema["title"] || "";

                    if (schema.type == "object") {
                        if (propertyName == "out_port_schemas") {
                            html += "<label>"+title+"</label>";
                            html += "<table id='tableOutPortSchema'>";
                            if (data["x-class"] != undefined && data["x-class"]["output_port_names"] != undefined) {
                                for (var portName of data["x-class"]["output_port_names"]) {
                                    html += "<tr><td>"+portName+"</td>";
                                    html += "<td><button class='btnAddOutPortSchema secondary'><i class='fa-solid fa-pencil'></i> Edit schema</button></td></tr>";
                                }
                            }
                            html += "</table>";
                        }
                    }

                    html += ETL.render.propertyToHTML(property, selectedEditComponent.data[propertyName]);
                    
                }

                


                resolve(html);             
            } else {
                resolve(false);
            }

        });
    });
}



/** Util */

ETL.util = ETL.util || {};

ETL.util.resolveLocal = function(schema, ref) {
    const path = ref.replace(/^#\//, "").split("/");
    return path.reduce((acc, k) => acc && acc[k], schema);
}

ETL.util.deref = function(obj, root = obj, seen = new WeakMap()) {
    if (Array.isArray(obj)) {
        return obj.map(i => ETL.util.deref(i, root, seen));
    }

    if (obj && typeof obj === "object") {
        if (seen.has(obj)) {
            return seen.get(obj);
        }
        if (obj.$ref && typeof obj.$ref === "string" && obj.$ref.startsWith("#/")) {
            const resolved = ETL.util.resolveLocal(root, obj.$ref);
            if (!resolved) return null; // falls ungültig
            return ETL.util.deref(resolved, root, seen);
        }

        const out = Array.isArray(obj) ? [] : {};
        seen.set(obj, out);

        for (const k of Object.keys(obj)) {
            out[k] = ETL.util.deref(obj[k], root, seen);
        }
        return out;
    }

    return obj;
}

ETL.util.formatDate = function(date = new Date()) {
    return date.toLocaleString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

ETL.util.alert = function(header = "Alert", message = "") {
    $("#alertDialog").attr("open", "");
    $("#alertDialog h2").html(header);
    $("#alertDialog p").html(message);
}

ETL.util.getFormData = function(element) {
    var postData = {};
    var newJobInput = $(element).find(".formInput");
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
    return postData;
}

// Export for Node.js/CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ETL;
}