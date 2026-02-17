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
ETL.runtime = ETL.runtime || {};
if (ETL.runtime.editor === undefined) {
    ETL.runtime.editor = null;
}
if (ETL.runtime.serverID === undefined) {
    ETL.runtime.serverID = 0;
}


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
ETL.contract = ETL.contract || {};

ETL.api.timeout = 2000;
ETL.api._lastError = null;
ETL.contract.requiredVersion = "core-studio-v1";
ETL.contract.cache = ETL.contract.cache || {};
ETL.contract.blocked = false;

ETL.contract.block = function(message) {
    if (ETL.contract.blocked) {
        return;
    }
    ETL.contract.blocked = true;
    var html = "";
    html += "<div id='contractBlocker' style='position: fixed; inset: 0; z-index: 99999; background: rgba(10,10,10,0.94); color: #fff; display: flex; align-items: center; justify-content: center; text-align: center; padding: 2rem;'>";
    html += "<div style='max-width: 720px;'>";
    html += "<h2 style='margin-bottom: 1rem;'><i class='fa-solid fa-plug-circle-xmark'></i> Core/Studio Contract Error</h2>";
    html += "<p style='margin-bottom: 0.8rem;'>"+message+"</p>";
    html += "<p style='opacity: 0.8;'>Required contract: <code>"+ETL.contract.requiredVersion+"</code></p>";
    html += "</div></div>";
    $("body").append(html);
};

ETL.api._serverHost = function(serverID = 0) {
    if (typeof server == "undefined" || server[serverID] == undefined) {
        return false;
    }
    return server[serverID].host;
};

ETL.api._request = function(serverID, endpoint, method, data, showError, rawContract) {
    return new Promise(function(resolve) {
        var host = ETL.api._serverHost(serverID);
        if (host === false) {
            resolve(false);
            return;
        }

        var executeRequest = function() {
            var ajaxOptions = {
                url: host + endpoint,
                method: method,
                timeout: ETL.api.timeout,
                success: function(responseData) {
                    resolve(responseData);
                },
                error: function(responseData) {
                    ETL.api._lastError = responseData;
                    if (showError) {
                        ETL.api.onError(responseData);
                    }
                    resolve(false);
                }
            };

            if (method == "GET") {
                ajaxOptions.data = data;
            } else if (method == "POST" || method == "PUT" || method == "PATCH") {
                ajaxOptions.data = JSON.stringify(data || {});
                ajaxOptions.contentType = "application/json; charset=utf-8";
            }

            $.ajax(ajaxOptions);
        };

        if (rawContract || endpoint.indexOf("/setup/") === 0) {
            executeRequest();
            return;
        }

        ETL.contract.require(serverID).then(function(isReady) {
            if (!isReady) {
                resolve(false);
                return;
            }
            executeRequest();
        });
    });
};

ETL.contract._isCapabilitiesPayloadValid = function(payload) {
    if (payload == null || typeof payload != "object") {
        return false;
    }
    if (!Array.isArray(payload.environments)) {
        return false;
    }
    if (!Array.isArray(payload.rule_operators)) {
        return false;
    }
    if (!Array.isArray(payload.rule_logical_operators)) {
        return false;
    }
    if (!Array.isArray(payload.data_types)) {
        return false;
    }
    if (payload.setup_validation == null || typeof payload.setup_validation != "object") {
        return false;
    }
    return true;
};

ETL.api.getCapabilities = function(serverID = 0) {
    return ETL.api._request(
        serverID,
        "/setup/capabilities",
        "GET",
        {},
        false,
        true
    );
};

ETL.contract.require = function(serverID = 0) {
    return new Promise(function(resolve) {
        var cached = ETL.contract.cache[serverID];
        if (cached != undefined) {
            resolve(true);
            return;
        }

        ETL.api.getCapabilities(serverID).then(function(capabilities) {
            if (capabilities === false || capabilities == null || typeof capabilities != "object") {
                ETL.contract.block("Unable to load core capabilities. Please verify the core server is reachable and upgraded.");
                resolve(false);
                return;
            }
            if (capabilities.contract_version !== ETL.contract.requiredVersion) {
                ETL.contract.block("Core contract version mismatch. Core reports '" + String(capabilities.contract_version || "unknown") + "' but studio requires '" + ETL.contract.requiredVersion + "'.");
                resolve(false);
                return;
            }
            if (!ETL.contract._isCapabilitiesPayloadValid(capabilities)) {
                ETL.contract.block("Connected core returned an invalid capabilities payload.");
                resolve(false);
                return;
            }
            ETL.contract.cache[serverID] = capabilities;
            resolve(true);
        });
    });
};

ETL.contract.get = function(serverID = 0) {
    return ETL.contract.cache[serverID] || null;
};

ETL.contract.getEnvironments = function(serverID = 0) {
    var data = ETL.contract.get(serverID);
    return data != null && Array.isArray(data.environments) ? data.environments : [];
};

ETL.contract.getRuleOperators = function(serverID = 0) {
    var data = ETL.contract.get(serverID);
    return data != null && Array.isArray(data.rule_operators) ? data.rule_operators : [];
};

ETL.contract.getRuleLogicalOperators = function(serverID = 0) {
    var data = ETL.contract.get(serverID);
    return data != null && Array.isArray(data.rule_logical_operators) ? data.rule_logical_operators : [];
};

ETL.contract.getDataTypes = function(serverID = 0) {
    var data = ETL.contract.get(serverID);
    return data != null && Array.isArray(data.data_types) ? data.data_types : [];
};

ETL.contract.bootstrap = function() {
    if (typeof server == "undefined" || server == null) {
        return Promise.resolve(true);
    }

    var serverIDs = [];
    for (var key in server) {
        serverIDs.push(parseInt(key, 10));
    }
    if (serverIDs.length == 0) {
        return Promise.resolve(true);
    }

    return Promise.all(serverIDs.map(function(id) {
        return ETL.contract.require(id);
    })).then(function(results) {
        for (var result of results) {
            if (result !== true) {
                return false;
            }
        }
        return true;
    });
};

/**
 * Handles API error responses and displays user-friendly error messages
 * @param {Object} data - The error response data from the server
 * @param {Object} data.responseJSON - JSON response containing error envelope
 * @param {string} data.statusText - HTTP status text
 */
ETL.api.onError = function(data) {
    console.log(data);

    var title = "Server Error";
    var htmlErrorMsg = "Unexpected response from server.";
    var responseJson = data.responseJSON || {};
    var error = responseJson.error || {};

    if (typeof error.code == "string") {
        title = error.code;
    }
    if (typeof error.message == "string") {
        htmlErrorMsg = "<kbd>Message: " + error.message + "</kbd>";
    }

    if (Array.isArray(error.details) && error.details.length > 0) {
        htmlErrorMsg += "<br><br><kbd>Details:</kbd><br>";
        for (var item of error.details) {
            if (item.msg != undefined) {
                htmlErrorMsg += "<small>" + item.msg + "</small><br>";
            }
        }
    }

    ETL.util.alert(
        "<i class='fa-solid fa-triangle-exclamation pico-color-red-550'></i> Error: " + title,
        htmlErrorMsg
    );
    
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
    return ETL.api._request(serverID, endpoint, "GET", data, showError, false);
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
    return ETL.api._request(serverID, endpoint, "POST", data, showError, false);
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
    return ETL.api._request(serverID, endpoint, "PUT", data, showError, false);
}

/**
 * Performs a DELETE request to the specified server endpoint
 * @param {number} [serverID=0] - The server ID to make the request to
 * @param {string} [endpoint=""] - The API endpoint path
 * @param {boolean} [showError=false] - Whether to display error messages to the user
 * @returns {Promise<boolean>} Promise that resolves to true on success or false on error
 */
ETL.api.delete = function(serverID = 0, endpoint = "", showError = false) {
    return new Promise(function(resolve) {
        ETL.api._request(serverID, endpoint, "DELETE", {}, showError, false).then(function(result) {
            resolve(result !== false);
        });
    });
}



/**
 * Render module for ETL Studio
 * Provides HTML generation functionality for forms and UI components
 * @namespace ETL.render
 */
ETL.render = ETL.render || {};

ETL.render.escapeHTML = function(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

ETL.render.jsonFieldDefault = function(schemaType, value) {
    if (value === undefined || value === null || value === "") {
        return schemaType == "array" ? "[]" : "{}";
    }

    if (typeof value == "string") {
        var trimmed = value.trim();
        if (trimmed == "") {
            return schemaType == "array" ? "[]" : "{}";
        }
        try {
            var parsed = JSON.parse(trimmed);
            return JSON.stringify(parsed, null, 2);
        } catch (error) {
            return value;
        }
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch (error) {
        return schemaType == "array" ? "[]" : "{}";
    }
}

ETL.render.prettyFieldName = function(propertyName = "") {
    if (typeof propertyName != "string") {
        return "Field";
    }
    var human = propertyName.replace(/[_-]+/g, " ").trim();
    if (human == "") {
        return "Field";
    }
    return human.replace(/\b\w/g, function(char) {
        return char.toUpperCase();
    });
}

ETL.render.schemaDescriptionHTML = function(description = "") {
    if (typeof description != "string" || description.trim() == "") {
        return "";
    }
    return "<small class='fieldDescription'>" + ETL.render.escapeHTML(description) + "</small>";
}

ETL.render.normalizeProperties = function(rootSchema) {
    if (rootSchema == null || typeof rootSchema != "object") {
        return [];
    }

    var props = rootSchema["properties"];
    if (Array.isArray(props)) {
        return props;
    }

    if (props != null && typeof props == "object") {
        var required = Array.isArray(rootSchema["required"]) ? rootSchema["required"] : [];
        var normalized = [];
        for (var name in props) {
            if (!Object.prototype.hasOwnProperty.call(props, name)) {
                continue;
            }
            var schema = props[name];
            if (schema == null || typeof schema != "object") {
                continue;
            }
            normalized.push({
                name: name,
                schema: schema,
                required: required.indexOf(name) >= 0
            });
        }
        return normalized;
    }

    return [];
}

ETL.render._simpleNullableUnionBranch = function(schema, unionKey) {
    var union = schema[unionKey];
    if (!Array.isArray(union) || union.length != 2) {
        return null;
    }

    var nonNullBranch = null;
    var hasNullBranch = false;
    for (var branch of union) {
        if (branch != null && typeof branch == "object" && branch.type == "null") {
            hasNullBranch = true;
            continue;
        }
        if (branch != null && typeof branch == "object" && nonNullBranch == null) {
            nonNullBranch = branch;
            continue;
        }
        return null;
    }

    if (!hasNullBranch || nonNullBranch == null) {
        return null;
    }
    return nonNullBranch;
}

ETL.render.normalizeSchema = function(schema, propertyName = "") {
    var normalized = {};
    if (schema != null && typeof schema == "object") {
        for (var key in schema) {
            normalized[key] = schema[key];
        }
    }

    var nullableBranch = ETL.render._simpleNullableUnionBranch(normalized, "anyOf");
    if (nullableBranch == null) {
        nullableBranch = ETL.render._simpleNullableUnionBranch(normalized, "oneOf");
    }

    if (nullableBranch != null) {
        var merged = {};
        for (var branchKey in nullableBranch) {
            merged[branchKey] = nullableBranch[branchKey];
        }
        for (var schemaKey in normalized) {
            if (schemaKey == "anyOf" || schemaKey == "oneOf") {
                continue;
            }
            merged[schemaKey] = normalized[schemaKey];
        }
        merged["nullable"] = true;
        normalized = merged;
    }

    if (
        Array.isArray(normalized["enum"]) &&
        (normalized["type"] == "string" || normalized["type"] == undefined || normalized["type"] == null)
    ) {
        normalized["type"] = "select";
    }

    if (typeof normalized["title"] != "string" || normalized["title"].trim() == "") {
        normalized["title"] = ETL.render.prettyFieldName(propertyName);
    }

    return normalized;
}

/**
 * Converts a property schema to HTML form input
 * @param {Object} property - The property schema object
 * @param {string} property.name - The property name
 * @param {boolean} property.required - Whether the property is required
 * @param {Object} property.schema - The JSON schema for the property
 * @param {string} property.schema.type - The data type (string, integer, number, boolean, select, array, object)
 * @param {string} property.schema.description - Description of the property
 * @param {string} property.schema.title - Display title for the property
 * @param {*} property.schema.default - Default value for the property
 * @param {Array} property.schema.enum - Enum values for select type
 * @param {*} [defaultValue] - Override default value
 * @returns {string} HTML string for the form input
 */
ETL.render.propertyToHTML = function(property, defaultValue = undefined) {
    var propertyName = property["name"];
    var required = property["required"] ? "required" : "";
    var schema = ETL.render.normalizeSchema(property["schema"], propertyName);
    var description = schema["description"] || "";
    var title = schema["title"] || "";
    var nullableAttr = schema["nullable"] === true ? "data-nullable='true'" : "";
    var helper = ETL.render.schemaDescriptionHTML(description);
    if (defaultValue === undefined) {
        defaultValue = schema["default"];
        if (defaultValue == undefined) {
            defaultValue = "";
        }
    }
    if (schema["nullable"] === true && defaultValue === null && schema.type != "boolean") {
        defaultValue = "";
    }

    var jobDetailsFieldsetHTML = "";

    var nullableClearBtn = "";
    if (schema["nullable"] === true) {
        nullableClearBtn = " <button type='button' class='secondary outline btnClearNullable' data-target='" + propertyName + "' style='font-size:0.7rem;padding:0.15rem 0.35rem;vertical-align:middle;' title='Clear to null'><i class='fa-solid fa-xmark'></i></button>";
    }

    if (schema.type == "string" && schema.widget == "textarea") {
        jobDetailsFieldsetHTML += "<label class='generatedField'>" + ETL.render.escapeHTML(title) + nullableClearBtn + "<br><textarea class='formInput' autocomplete='off' name='" + propertyName + "' rows='6' " + nullableAttr + " " + required + ">" + ETL.render.escapeHTML(defaultValue) + "</textarea>" + helper + "</label>";
    } else if (schema.type == "string") {
        jobDetailsFieldsetHTML += "<label class='generatedField'>" + ETL.render.escapeHTML(title) + nullableClearBtn + "<input class='formInput' autocomplete='off' name='" + propertyName + "' value='" + ETL.render.escapeHTML(defaultValue) + "' type='text' " + nullableAttr + " " + required + "/>" + helper + "</label>";
    } else if (schema.type == "integer" || schema.type == "number") {
        var minimum = "";
        if (schema.minimum != undefined) {
            minimum = "min='" + ETL.render.escapeHTML(schema.minimum) + "'";
        }
        var maximum = "";
        if (schema.maximum != undefined) {
            maximum = "max='" + ETL.render.escapeHTML(schema.maximum) + "'";
        }
        var step = schema.type == "integer" ? "1" : "any";
        var numberValue = defaultValue;
        if (numberValue == null) {
            numberValue = "";
        }
        jobDetailsFieldsetHTML += "<label class='generatedField'>" + ETL.render.escapeHTML(title) + "<input class='formInput' autocomplete='off' name='" + propertyName + "' value='" + ETL.render.escapeHTML(numberValue) + "' type='number' step='" + step + "' data-number-kind='" + schema.type + "' " + minimum + " " + maximum + " " + nullableAttr + " " + required + "/>" + helper + "</label>";
    } else if (schema.type == "boolean") {
        defaultValue = defaultValue === true ? "checked" : "";
        jobDetailsFieldsetHTML += "<label class='generatedField'>" + ETL.render.escapeHTML(title) + "<br><input class='formInput' style='margin-top: 3px;' autocomplete='off' name='" + propertyName + "' " + defaultValue + " type='checkbox' " + required + "/>" + helper + "</label>";
    } else if (schema.type == "select") {
        var selectValue = defaultValue;
        if (selectValue == null) {
            selectValue = "";
        }
        jobDetailsFieldsetHTML += "<label class='generatedField'>" + ETL.render.escapeHTML(title) + "<br><select class='formInput' name='" + propertyName + "' aria-label='" + ETL.render.escapeHTML(title) + "' " + nullableAttr + " " + required + ">";
        for (var option of schema.enum) {
            var selected = option == selectValue ? "selected" : "";
            jobDetailsFieldsetHTML += "<option " + selected + " value='" + ETL.render.escapeHTML(option) + "'>" + ETL.render.escapeHTML(option) + "</option>";
        }
        jobDetailsFieldsetHTML += "</select>" + helper + "</label>";
    } else if (schema.type == "array" || schema.type == "object") {
        var jsonDefault = "";
        if (!(schema["nullable"] === true && (defaultValue === null || defaultValue === ""))) {
            jsonDefault = ETL.render.jsonFieldDefault(schema.type, defaultValue);
        }
        jobDetailsFieldsetHTML += "<label class='generatedField'>" + ETL.render.escapeHTML(title) + "<br><textarea class='formInput jsonInput' autocomplete='off' name='" + propertyName + "' data-json='true' data-json-type='" + schema.type + "' " + nullableAttr + " rows='8' " + required + ">" + ETL.render.escapeHTML(jsonDefault) + "</textarea>" + helper + "</label>";
        jobDetailsFieldsetHTML += "<button type='button' class='secondary outline btnFormatJson' data-target='" + propertyName + "' style='font-size:0.75rem;padding:0.2rem 0.5rem;margin-top:-0.5rem;margin-bottom:0.5rem;'>Format JSON</button>";
    } else {
        var fallbackType = "object";
        if (Array.isArray(defaultValue)) {
            fallbackType = "array";
        } else if (defaultValue != null && typeof defaultValue == "object") {
            fallbackType = "object";
        }
        var fallbackDefault = ETL.render.jsonFieldDefault(fallbackType, defaultValue);
        if (schema["nullable"] === true && (defaultValue === null || defaultValue === "")) {
            fallbackDefault = "";
        }
        jobDetailsFieldsetHTML += "<label class='generatedField'>" + ETL.render.escapeHTML(title) + "<br><textarea class='formInput jsonInput' autocomplete='off' name='" + propertyName + "' data-json='true' data-json-type='" + fallbackType + "' " + nullableAttr + " rows='8' " + required + ">" + ETL.render.escapeHTML(fallbackDefault) + "</textarea>" + helper + "</label>";
        jobDetailsFieldsetHTML += "<button type='button' class='secondary outline btnFormatJson' data-target='" + propertyName + "' style='font-size:0.75rem;padding:0.2rem 0.5rem;margin-top:-0.5rem;margin-bottom:0.5rem;'>Format JSON</button>";
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
            var properties = ETL.render.normalizeProperties(data);

            var html = "";

            if (properties.length > 0) {

                if (jobID != undefined) {
                    ETL.api.get(serverID, "/jobs/"+jobID).then(function(jobData) {
                        if (jobData !== false) {
                            for (var property of properties) {
                                var propertyName = property["name"];
                                html += ETL.render.propertyToHTML(property, jobData[propertyName]);
                            }
                            resolve(html);
                        } else {
                            resolve(false);
                        }
                    });
                } else {
                    for (var property of properties) {
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

    var currentServerID = 0;
    if (typeof serverID != "undefined") {
        currentServerID = parseInt(serverID, 10) || 0;
    }
    var operators = ETL.contract.getRuleOperators(currentServerID);
    var logicalOperators = ETL.contract.getRuleLogicalOperators(currentServerID);
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
ETL.render.componentEdit = async function(componentID, options = {}) {
    try {
        var editorInstance = options.editor;
        if (editorInstance == null && ETL.runtime != null) {
            editorInstance = ETL.runtime.editor;
        }
        if (editorInstance == null && typeof editor != "undefined") {
            editorInstance = editor;
        }
        if (editorInstance == null || typeof editorInstance.getNodeFromId != "function") {
            return false;
        }

        var currentServerID = options.serverID;
        if (currentServerID == null && ETL.runtime != null) {
            currentServerID = ETL.runtime.serverID;
        }
        if (currentServerID == null && typeof serverID != "undefined") {
            currentServerID = serverID;
        }
        currentServerID = parseInt(currentServerID, 10);
        if (Number.isNaN(currentServerID)) {
            currentServerID = 0;
        }

        var selectedEditComponent = editorInstance.getNodeFromId(componentID);
        if (
            selectedEditComponent == null ||
            selectedEditComponent.data == null ||
            typeof selectedEditComponent.data != "object"
        ) {
            return false;
        }

        var compType = selectedEditComponent.data["comp_type"];
        if (typeof compType != "string" || compType == "") {
            return false;
        }

        var componentFormRaw = await ETL.api.get(currentServerID, "/configs/"+compType+"/form");
        if (componentFormRaw === false) {
            return false;
        }
        var data = ETL.util.deref(componentFormRaw);
        var html = "";
        var renderedFieldCount = 0;
        var properties = ETL.render.normalizeProperties(data);
        var hasPropertiesSource = data != null && typeof data == "object" && data.properties != undefined;

        if (!hasPropertiesSource) {
            return false;
        }

        var uiHints = data["x-ui"];
        if (uiHints == null || typeof uiHints != "object") {
            ETL.contract.block("Component form schema is missing required x-ui hints.");
            return false;
        }

        var contextSelectorHint = uiHints["context_selector"] || {};
        var ruleBuilderHint = uiHints["rule_builder"] || {};
        var portSchemaHint = uiHints["port_schema_editor"] || {};

        var contextFieldName = contextSelectorHint["field"];
        var contextSourceEndpoint = contextSelectorHint["source_endpoint"] || "/contexts/";
        var contextKeysEndpoint = contextSelectorHint["keys_endpoint"] || contextSourceEndpoint;
        var ruleFieldName = ruleBuilderHint["field"];
        var portSchemaFields = Array.isArray(portSchemaHint["fields"]) ? portSchemaHint["fields"] : [];

        // x-ui sections: group fields into collapsible fieldsets
        var uiSections = Array.isArray(uiHints["sections"]) ? uiHints["sections"] : [];
        var fieldToSection = {};
        for (var si = 0; si < uiSections.length; si++) {
            var section = uiSections[si];
            var sectionFields = Array.isArray(section["fields"]) ? section["fields"] : [];
            for (var sf = 0; sf < sectionFields.length; sf++) {
                fieldToSection[sectionFields[sf]] = si;
            }
        }
        var openSection = -1;

        for (var property of properties) {
            if (property == null || typeof property != "object") {
                continue;
            }
            var propertyName = property["name"];
            if (typeof propertyName != "string" || propertyName == "") {
                continue;
            }

            var schema = ETL.render.normalizeSchema(property["schema"], propertyName);
            var title = schema["title"] || "";
            var description = schema["description"] || "";
            var helper = ETL.render.schemaDescriptionHTML(description);
            var nullableAttr = schema["nullable"] === true ? "data-nullable='true'" : "";

            if (propertyName == contextFieldName) {
                html += "<label class='generatedField'>" + ETL.render.escapeHTML(title) + "<br><select class='formInput' name='" + propertyName + "' aria-label='" + ETL.render.escapeHTML(title) + "' data-context-selector='true' data-context-keys-endpoint='" + ETL.render.escapeHTML(contextKeysEndpoint) + "' " + nullableAttr + "><option value=''></option>";
                var contextList = await ETL.api.get(currentServerID, contextSourceEndpoint);
                if (Array.isArray(contextList)) {
                    for (var context of contextList) {
                        var contextID = context.id;
                        var contextName = context.name;
                        if (context.kind == "context") {
                            var selected = selectedEditComponent.data[propertyName] == contextID ? "selected" : "";
                            html += "<option value='" + ETL.render.escapeHTML(contextID) + "' " + selected + ">" + ETL.render.escapeHTML(contextName + (context.description ? " (" + context.description + ")" : "")) + "</option>";
                        }
                    }
                }
                html += "</select>" + helper + "</label>";
                html += "<small class='fieldDescription'>Use <code>${ctx.key}</code> for environment-aware context values.</small>";
                html += "<div class='contextTemplateAssist' data-context-assist-for='" + ETL.render.escapeHTML(propertyName) + "'><div class='contextTemplateKeys'></div></div>";
                renderedFieldCount += 1;
                continue;
            }

            if (propertyName == ruleFieldName) {
                html += "<label class='generatedField'>" + ETL.render.escapeHTML(title) + helper + "</label>";
                html += "<button class='secondary btnAddSingleRule' style='margin-right: 10px;'><i class='fa-solid fa-plus'></i> Simple Rule</button>";
                html += "<button class='secondary btnAddLogicalRule'><i class='fa-solid fa-plus'></i> Combined Rule</button>";
                var ruleTableContent = ETL.render.propertyRuleToHTML(selectedEditComponent.data[propertyName]);
                html += "<table id='ruleTable'>"+ruleTableContent+"</table>";
                renderedFieldCount += 1;
                continue;
            }

            if (portSchemaFields.indexOf(propertyName) >= 0) {
                var portNames = [];
                var classMeta = data["x-class"] || {};
                if (propertyName.indexOf("out_port_") === 0 && Array.isArray(classMeta["output_port_names"])) {
                    portNames = classMeta["output_port_names"];
                } else if (propertyName.indexOf("in_port_") === 0 && Array.isArray(classMeta["input_port_names"])) {
                    portNames = classMeta["input_port_names"];
                }
                portNames = Array.from(new Set(portNames));
                if (propertyName.indexOf("out_port_") === 0 && Array.isArray(selectedEditComponent.data["extra_output_ports"])) {
                    for (var extraOutputPort of selectedEditComponent.data["extra_output_ports"]) {
                        var extraOutputPortName = "";
                        if (typeof extraOutputPort == "string") {
                            extraOutputPortName = extraOutputPort;
                        } else if (extraOutputPort != null && typeof extraOutputPort == "object") {
                            extraOutputPortName = String(extraOutputPort["name"] || "");
                        }
                        if (extraOutputPortName != "") {
                            portNames.push(extraOutputPortName);
                        }
                    }
                }
                if (propertyName.indexOf("in_port_") === 0 && Array.isArray(selectedEditComponent.data["extra_input_ports"])) {
                    for (var extraInputPort of selectedEditComponent.data["extra_input_ports"]) {
                        var extraInputPortName = "";
                        if (typeof extraInputPort == "string") {
                            extraInputPortName = extraInputPort;
                        } else if (extraInputPort != null && typeof extraInputPort == "object") {
                            extraInputPortName = String(extraInputPort["name"] || "");
                        }
                        if (extraInputPortName != "") {
                            portNames.push(extraInputPortName);
                        }
                    }
                }
                var existingSchemaMap = selectedEditComponent.data[propertyName];
                if (existingSchemaMap != null && typeof existingSchemaMap == "object") {
                    for (var schemaPortName in existingSchemaMap) {
                        portNames.push(schemaPortName);
                    }
                }
                portNames = Array.from(new Set(portNames));

                html += "<label class='generatedField'>" + ETL.render.escapeHTML(title) + helper + "</label>";
                html += "<table class='tablePortSchema' data-schema-field='"+propertyName+"'>";
                for (var portName of portNames) {
                    html += "<tr><td>"+portName+"</td>";
                    html += "<td><button class='btnEditPortSchema secondary' data-schema-field='"+propertyName+"' data-port-name='"+portName+"'><i class='fa-solid fa-pencil'></i> Edit schema</button></td></tr>";
                }
                html += "</table>";
                renderedFieldCount += 1;
                continue;
            }

            // Section grouping: close previous and open new section if needed
            if (uiSections.length > 0) {
                var targetSection = fieldToSection[propertyName];
                if (targetSection !== undefined && targetSection !== openSection) {
                    if (openSection >= 0) {
                        html += "</fieldset>";
                    }
                    var sectionLabel = uiSections[targetSection]["label"] || "Section";
                    html += "<fieldset class='componentSection'><legend style='cursor:pointer;'>" + ETL.render.escapeHTML(sectionLabel) + "</legend>";
                    openSection = targetSection;
                } else if (targetSection === undefined && openSection >= 0) {
                    html += "</fieldset>";
                    openSection = -1;
                }
            }

            html += ETL.render.propertyToHTML(property, selectedEditComponent.data[propertyName]);
            renderedFieldCount += 1;
        }

        // Close any open section
        if (openSection >= 0) {
            html += "</fieldset>";
        }

        if (renderedFieldCount == 0) {
            return "<div class='generatedField'>No configurable fields are available for this component schema.</div>";
        }

        return html;
    } catch (error) {
        return false;
    }
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

ETL.util.applyComponentEditDialogResult = function(result) {
    if (typeof result == "string" && result.trim() != "") {
        $("#componentEditDialogMain").html(result);
        $("#btnSaveComponent").attr("disabled", false);
        return true;
    }

    $("#componentEditDialogMain").html("No Server connection!");
    $("#btnSaveComponent").attr("disabled", true);
    return false;
}

ETL.util.insertTextAtCursor = function(inputElement, text) {
    if (inputElement == null || typeof inputElement.value != "string") {
        return false;
    }

    var element = inputElement;
    if (typeof element.selectionStart == "number" && typeof element.selectionEnd == "number") {
        var start = element.selectionStart;
        var end = element.selectionEnd;
        element.value = element.value.slice(0, start) + text + element.value.slice(end);
        element.selectionStart = start + text.length;
        element.selectionEnd = start + text.length;
    } else {
        element.value += text;
    }

    if (typeof element.dispatchEvent == "function") {
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return true;
}

ETL.util.initContextTemplateAssist = function(container, serverID) {
    var rootElement = $(container);
    if (rootElement.length == 0) {
        return;
    }

    var localServerID = parseInt(serverID, 10);
    if (Number.isNaN(localServerID)) {
        localServerID = 0;
    }

    rootElement.off("focusin.contextAssist");
    rootElement.on("focusin.contextAssist", ".formInput", function() {
        rootElement.data("contextAssistFocusedInput", this);
    });

    rootElement.find("select[data-context-selector='true']").each(function() {
        var selector = $(this);
        var fieldName = selector.attr("name");
        if (!fieldName) {
            return;
        }

        var endpointBase = selector.attr("data-context-keys-endpoint") || "/contexts/";
        var assistBox = rootElement.find("[data-context-assist-for='" + fieldName + "']");
        var keysContainer = assistBox.find(".contextTemplateKeys");
        if (keysContainer.length == 0) {
            return;
        }

        function buildKeysEndpoint(contextID) {
            var normalizedEndpoint = String(endpointBase || "").trim();
            if (normalizedEndpoint == "") {
                normalizedEndpoint = "/contexts/";
            }
            if (normalizedEndpoint.indexOf("{id}") >= 0) {
                var replaced = normalizedEndpoint.replace("{id}", encodeURIComponent(contextID));
                if (replaced.endsWith("/keys")) {
                    return replaced;
                }
                return replaced.replace(/\/$/, "") + "/keys";
            }
            return normalizedEndpoint.replace(/\/$/, "") + "/" + encodeURIComponent(contextID) + "/keys";
        }

        function renderKeys(contextID) {
            if (typeof contextID != "string" || contextID.trim() == "") {
                keysContainer.html("<small class='fieldDescription'>Select a context to load available keys.</small>");
                return;
            }

            ETL.api
                .get(localServerID, buildKeysEndpoint(contextID))
                .then(function(result) {
                    if (result === false || result == null || !Array.isArray(result.keys)) {
                        keysContainer.html("<small class='fieldDescription'>Unable to load context keys.</small>");
                        return;
                    }

                    if (result.keys.length == 0) {
                        keysContainer.html("<small class='fieldDescription'>No reusable keys available for this context.</small>");
                        return;
                    }

                    var html = "<small class='fieldDescription'>Available keys:</small>";
                    html += "<div class='contextTemplateTokens'>";
                    var renderedTokenCount = 0;
                    for (var item of result.keys) {
                        var keyName = item.key;
                        if (typeof keyName != "string" || keyName.trim() == "") {
                            continue;
                        }
                        var token = "${ctx." + keyName + "}";
                        var badge = item.secret === true ? " <small>(secret)</small>" : "";
                        html += "<button type='button' class='outline secondary btnInsertContextToken' data-token='" + ETL.render.escapeHTML(token) + "'>" + ETL.render.escapeHTML(token) + badge + "</button>";
                        renderedTokenCount += 1;
                    }
                    html += "</div>";
                    if (renderedTokenCount == 0) {
                        keysContainer.html("<small class='fieldDescription'>No reusable keys available for this context.</small>");
                        return;
                    }
                    keysContainer.html(html);
                })
                .catch(function() {
                    keysContainer.html("<small class='fieldDescription'>Unable to load context keys.</small>");
                });
        }

        selector.off("change.contextAssist");
        selector.on("change.contextAssist", function() {
            renderKeys(String($(this).val() || ""));
        });

        renderKeys(String(selector.val() || ""));
    });

    rootElement.off("click.contextAssist");
    rootElement.on("click.contextAssist", ".btnInsertContextToken", function() {
        var token = $(this).attr("data-token") || "";
        var focusedInput = rootElement.data("contextAssistFocusedInput");
        if (!focusedInput) {
            focusedInput = rootElement.find("input.formInput[type='text'], textarea.formInput").first()[0];
        }
        if (!focusedInput) {
            return;
        }
        ETL.util.insertTextAtCursor(focusedInput, token);
        if (typeof focusedInput.focus == "function") {
            focusedInput.focus();
        }
    });
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
        if (postData.__form_error__ === true) {
            return;
        }
        var type = $(value).attr("type");
        var isNullable = $(value).attr("data-nullable") == "true";
        var postValue;
        if ($(value).attr("data-json") == "true") {
            var rawValue = $(value).val();
            var valueString = typeof rawValue == "string" ? rawValue.trim() : "";
            if (valueString == "") {
                if (isNullable) {
                    postValue = null;
                } else {
                    var jsonType = $(value).attr("data-json-type");
                    valueString = jsonType == "array" ? "[]" : "{}";
                }
            }
            if (postValue === undefined) {
                try {
                    postValue = JSON.parse(valueString);
                    $(value).removeAttr("aria-invalid");
                } catch (error) {
                    $(value).attr("aria-invalid", "true");
                    ETL.util.alert(
                        "Invalid JSON",
                        "Field <code>" +
                            String($(value).attr("name") || "") +
                            "</code> contains invalid JSON."
                    );
                    postData.__form_error__ = true;
                    return;
                }
            }
        } else if (type == "checkbox") {
            postValue = $(value).prop("checked");
        } else if (type == "number") {
            var rawNumber = $(value).val();
            var numberValue = typeof rawNumber == "string" ? rawNumber.trim() : String(rawNumber || "");
            if (numberValue == "") {
                postValue = isNullable ? null : undefined;
            } else {
                var numberKind = $(value).attr("data-number-kind");
                if (numberKind == "integer") {
                    postValue = parseInt(numberValue, 10);
                } else {
                    postValue = parseFloat(numberValue);
                }
                if (Number.isNaN(postValue)) {
                    postValue = isNullable ? null : undefined;
                }
            }
        } else {
            postValue = $(value).val();
            if (isNullable && postValue === "") {
                postValue = null;
            }
        }
        if (postValue !== undefined) {
            postData[$(value).attr("name")] = postValue;
        }
    });
    if (postData.__form_error__ === true) {
        return false;
    }
    return postData;
}

/**
 * Component configuration UX event handlers
 */
/* istanbul ignore next: browser-only DOM event binding */
if (typeof $ !== "undefined" && typeof document !== "undefined" && typeof document.addEventListener === "function") {
    // Format JSON button
    $(document).on("click", ".btnFormatJson", function() {
        var targetName = $(this).attr("data-target");
        var textarea = $("textarea[name='" + targetName + "']");
        if (textarea.length === 0) { return; }
        var raw = textarea.val();
        try {
            var parsed = JSON.parse(raw);
            textarea.val(JSON.stringify(parsed, null, 2));
            textarea.removeClass("jsonInvalid");
        } catch (e) {
            textarea.addClass("jsonInvalid");
        }
    });

    // JSON validation on blur
    $(document).on("blur", "textarea.jsonInput", function() {
        var raw = $(this).val().trim();
        if (raw === "" && $(this).attr("data-nullable") === "true") {
            $(this).removeClass("jsonInvalid");
            return;
        }
        try {
            JSON.parse(raw);
            $(this).removeClass("jsonInvalid");
        } catch (e) {
            $(this).addClass("jsonInvalid");
        }
    });

    // Clear nullable field
    $(document).on("click", ".btnClearNullable", function() {
        var targetName = $(this).attr("data-target");
        var field = $(".formInput[name='" + targetName + "']");
        if (field.is("textarea")) {
            field.val("");
        } else if (field.is("select")) {
            field.val("");
        } else {
            field.val("");
        }
    });
}

/**
 * Export for Node.js/CommonJS environments
 * Makes the ETL object available for module imports
 */
// Export for Node.js/CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ETL;
}

/* istanbul ignore next: browser-only auto bootstrap path */
if (typeof window !== "undefined" && (typeof module === "undefined" || !module.exports)) {
    ETL.contract.bootstrap();
}
