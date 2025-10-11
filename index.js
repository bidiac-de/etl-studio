/**
 * Dark theme initialization
 * Checks localStorage for dark theme preference and applies it to the HTML element
 */
var darktheme = JSON.parse(localStorage.getItem("darktheme"));
if (darktheme == null) {
    darktheme = true;
    localStorage.setItem("darktheme", true);
}
if (darktheme) {
    $("html").attr("data-theme", "dark");
}

/**
 * Main ETL namespace object
 * Contains all ETL Studio functionality organized into modules
 * @namespace ETL
 */
var ETL = {};


/**
 * Console module for ETL Studio
 * Provides logging functionality with timestamp support and localStorage persistence
 * @namespace ETL.console
 */
ETL.console = {};

/**
 * Generates a formatted locale-specific date and time string
 * @returns {string} Formatted date and time string (e.g., "January 15, 2024 2:30:45 PM")
 */
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

/**
 * Logs a message to the ETL console with optional timestamp and custom line ending
 * @param {string} [msg=""] - The message to log
 * @param {boolean} [showTimestamp=true] - Whether to include timestamp prefix
 * @param {string} [end="\r\n"] - Line ending character(s)
 */
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

/**
 * Retrieves the current ETL console log content from localStorage
 * @returns {string} The console log content as a string
 */
ETL.console.get = function() {
    var etlConsoleLog = localStorage.getItem("etlConsoleLog");
    if (etlConsoleLog == null) etlConsoleLog = "";
    return etlConsoleLog;
}

/**
 * Clears the ETL console log by removing it from localStorage and firing change handler
 */
ETL.console.clear = function() {
    localStorage.removeItem("etlConsoleLog");
    ETL.console.fireChangeHandler();
}

/**
 * Fires the console change handler with the current log content
 */
ETL.console.fireChangeHandler = function() {
    var etlConsoleLog = ETL.console.get();
    ETL.console.onChangeHandler(etlConsoleLog);
}

/**
 * Placeholder function for console change handler - can be overridden to handle log changes
 * @param {string} log - The current console log content
 */
ETL.console.onChangeHandler = function(log) {}



/**
 * API module for ETL Studio
 * Provides HTTP request functionality and error handling for server communication
 * @namespace ETL.api
 */
ETL.api = ETL.api || {};

ETL.api.timeout = 2000;

/**
 * Handles API error responses and displays user-friendly error messages
 * @param {Object} data - The error response data from the server
 * @param {Object} data.responseJSON - JSON response containing error details
 * @param {string} data.statusText - HTTP status text
 * @param {Array} data.responseJSON.detail - Array of error detail objects
 * @param {string} data.responseJSON.detail[].msg - Error message
 * @param {Array} data.responseJSON.detail[].loc - Error location array
 * @param {Object} data.responseJSON.detail[].input - Input component information
 * @param {string} data.responseJSON.detail[].input.name - Component name
 */
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

/**
 * Performs a GET request to the specified server endpoint
 * @param {number} [serverID=0] - The server ID to make the request to
 * @param {string} [endpoint=""] - The API endpoint path
 * @param {Object} [data={}] - Query parameters to send with the request
 * @param {boolean} [showError=false] - Whether to display error messages to the user
 * @returns {Promise<Object|boolean>} Promise that resolves to the response data or false on error
 */
ETL.api.get = function(serverID = 0, endpoint = "", data = {}, showError = false) {
    return new Promise(function(resolve, reject) {
        if (server[serverID] != undefined) {
            var url = server[serverID].host+endpoint;
            $.ajax({
                url: url,
                data: data,
                method: "GET",
                timeout: ETL.api.timeout,
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

/**
 * Performs a POST request to the specified server endpoint
 * @param {number} [serverID=0] - The server ID to make the request to
 * @param {string} [endpoint=""] - The API endpoint path
 * @param {Object} [data={}] - JSON data to send in the request body
 * @param {boolean} [showError=false] - Whether to display error messages to the user
 * @returns {Promise<Object|boolean>} Promise that resolves to the response data or false on error
 */
ETL.api.post = function(serverID = 0, endpoint = "", data = {}, showError = false) {
    return new Promise(function(resolve, reject) {
        if (server[serverID] != undefined) {
            var url = server[serverID].host+endpoint;
            $.ajax({
                url: url,
                data: JSON.stringify(data),
                method: "POST",
                timeout: ETL.api.timeout,
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

/**
 * Performs a PUT request to the specified server endpoint
 * @param {number} [serverID=0] - The server ID to make the request to
 * @param {string} [endpoint=""] - The API endpoint path
 * @param {Object} [data={}] - JSON data to send in the request body
 * @param {boolean} [showError=false] - Whether to display error messages to the user
 * @returns {Promise<Object|boolean>} Promise that resolves to the response data or false on error
 */
ETL.api.put = function(serverID = 0, endpoint = "", data = {}, showError = false) {
    return new Promise(function(resolve, reject) {
        if (server[serverID] != undefined) {
            var url = server[serverID].host+endpoint;
            $.ajax({
                url: url,
                data: JSON.stringify(data),
                method: "PUT",
                timeout: ETL.api.timeout,
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

/**
 * Performs a DELETE request to the specified server endpoint
 * @param {number} [serverID=0] - The server ID to make the request to
 * @param {string} [endpoint=""] - The API endpoint path
 * @param {boolean} [showError=false] - Whether to display error messages to the user
 * @returns {Promise<boolean>} Promise that resolves to true on success or false on error
 */
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



/**
 * Render module for ETL Studio
 * Provides HTML generation functionality for forms and UI components
 * @namespace ETL.render
 */
ETL.render = ETL.render || {};

/**
 * Converts a property schema to HTML form input
 * @param {Object} property - The property schema object
 * @param {string} property.name - The property name
 * @param {boolean} property.required - Whether the property is required
 * @param {Object} property.schema - The JSON schema for the property
 * @param {string} property.schema.type - The data type (string, integer, boolean, select)
 * @param {string} property.schema.description - Description of the property
 * @param {string} property.schema.title - Display title for the property
 * @param {*} property.schema.default - Default value for the property
 * @param {Array} property.schema.enum - Enum values for select type
 * @param {number} property.minimum - Minimum value for integer type
 * @param {*} [defaultValue] - Override default value
 * @returns {string} HTML string for the form input
 */
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

/**
 * Renders HTML form for job editing based on job configuration schema
 * @param {number} serverID - The server ID to fetch configuration from
 * @param {string|number} [jobID] - Optional job ID to load existing job data
 * @returns {Promise<string|boolean>} Promise that resolves to HTML string or false on error
 */
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

ETL.render.propertyRuleToHTML = function(data = {}, level = 0) {

    var operators = ["==", "!=", ">", "<", ">=", "<=", "contains"];
    var logicalOperators = ["AND", "OR", "NOT"];
    var margin = 10 + level * 15;
    var html = "";

    if (data["rules"] != undefined) {
        // multi
        var operator = data["logical_operator"];
        var rules = data["rules"];
        html += "<tr class='logicItem' level='"+level+"'><td style='padding-left: "+margin+"px'><select>";
        for (var item of logicalOperators) {
            var selected = item == operator ? "selected" : "";
            html += "<option "+selected+">"+item+"</option>";
        }
        html += "</select></td><td><button class='secondary btnAddSingleRule' style='margin-right: 10px; width: 100%;'><i class='fa-solid fa-plus'></i> Simple</button></td><td><button class='secondary btnAddLogicalRule' style='width: 100%;'><i class='fa-solid fa-plus'></i> Combined</button></td><td><button class='pico-background-red-550 btnRemoveRule'><i class='fa-solid fa-trash'></i></button></td></tr>";
        for (var rule of rules) {
            html += ETL.render.propertyRuleToHTML(rule, level + 1);
        }

    } else {
        // single
        var column = data.column;
        var operator = data.operator;
        var value = data.value;
        html += "<tr class='singleItem' level='"+level+"'><td style='padding-left: "+margin+"px'><input type='text' placeholder='Coloum' value='"+column+"'></td><td><select>";
        for (var item of operators) {
            var selected = item == operator ? "selected" : "";
            html += "<option "+selected+">"+item+"</option>";
        }
        html += "</select></td><td><input type='text' placeholder='Value' value='"+value+"'></td><td><button class='pico-background-red-550 btnRemoveRule'><i class='fa-solid fa-trash'></i></button></td></tr>";
    }
    return html;
}

/**
 * Renders HTML form for component editing based on component configuration schema
 * @param {string|number} componentID - The component ID to edit
 * @returns {Promise<string|boolean>} Promise that resolves to HTML string or false on error
 */
ETL.render.componentEdit = function(componentID) {
    return new Promise(function(resolve, reject) {

        var selectedEditComponent = editor.getNodeFromId(componentID);
        var compType = selectedEditComponent.data["comp_type"];
        //console.log(selectedEditComponent, compType);

        ETL.api.get(serverID, "/configs/"+compType+"/form").then(async function(componentFormRaw) {
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
                        } else if (propertyName == "rule") {

                            html += "<label>"+title+"</label>";
                            html += "<button class='secondary btnAddSingleRule' style='margin-right: 10px;'><i class='fa-solid fa-plus'></i> Simple Rule</button>";
                            html += "<button class='secondary btnAddLogicalRule'><i class='fa-solid fa-plus'></i> Combined Rule</button>";

                            var ruleTableContent = ETL.render.propertyRuleToHTML(selectedEditComponent.data[propertyName]);

                            html += "<table id='ruleTable'>"+ruleTableContent+"</table>";



                        }
                    }

                    if (propertyName == "context_id") {
                        var title = schema["title"] || "";
                        html += "<label>"+title+"<br><select class='formInput' name='"+propertyName+"' aria-label='"+title+"'><option value=''></option>";

                        var contextList = await ETL.api.get(serverID, "/contexts/");
                        if (contextList !== false) {
                            for (var context of contextList) {

                                var contextID = context.id;
                                var contextName = context.name;

                                if (context.kind == "context") {
                                    var selected = selectedEditComponent.data[propertyName] == contextID ? "selected" : "";

                                    html += "<option value='"+contextID+"' "+selected+">"+contextID + " - " + contextName+"</option>";


                                }
                            }
                        }

                        
                        html += "</select></label>";


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



/**
 * Utility module for ETL Studio
 * Provides helper functions for data processing, formatting, and UI interactions
 * @namespace ETL.util
 */
ETL.util = ETL.util || {};

/**
 * Resolves JSON Schema references within a schema object
 * @param {Object} schema - The schema object containing references
 * @param {string} ref - The reference path (e.g., "#/definitions/MyType")
 * @returns {*} The resolved schema object or undefined if not found
 */
ETL.util.resolveLocal = function(schema, ref) {
    const path = ref.replace(/^#\//, "").split("/");
    return path.reduce((acc, k) => acc && acc[k], schema);
}

/**
 * Recursively dereferences JSON Schema objects, resolving all $ref references
 * @param {*} obj - The object to dereference
 * @param {*} [root=obj] - The root schema object for reference resolution
 * @param {WeakMap} [seen=new WeakMap()] - Map to track circular references
 * @returns {*} The dereferenced object with all $ref resolved
 */
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

/**
 * Formats a date object to German locale string format
 * @param {Date} [date=new Date()] - The date to format
 * @returns {string} Formatted date string in German locale (DD.MM.YYYY, HH:MM:SS)
 */
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

/**
 * Displays an alert dialog with custom header and message
 * @param {string} [header="Alert"] - The alert dialog header text
 * @param {string} [message=""] - The alert dialog message content (supports HTML)
 */
ETL.util.alert = function(header = "Alert", message = "") {
    $("#alertDialog").attr("open", "");
    $("#alertDialog h2").html(header);
    $("#alertDialog p").html(message);
}

/**
 * Extracts form data from a DOM element containing form inputs
 * @param {jQuery|HTMLElement} element - The DOM element containing form inputs
 * @returns {Object} Object containing form field names as keys and their values
 */
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

/**
 * Export for Node.js/CommonJS environments
 * Makes the ETL object available for module imports
 */
// Export for Node.js/CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ETL;
}