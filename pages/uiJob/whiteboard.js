/*var isMovingWhiteboard = false;
var whiteboardMarginLeft = 0;
var whiteboardMarginTop = 0;
var mouseStartX = 0;
var mouseStartY = 0;
var whiteboardStartX = 0;
var whiteboardStartY = 0;

$("#whiteboard").on("mousedown", function(event) {
    isMovingWhiteboard = true;
    mouseStartX = event.clientX;
    mouseStartY = event.clientY;
    whiteboardStartX = whiteboardMarginLeft;
    whiteboardStartY = whiteboardMarginTop;
});

$("#whiteboard").on("mouseup", function() {
    isMovingWhiteboard = false;
});

$("#whiteboard").on("mouseleave", function() {
    isMovingWhiteboard = false;
});

$("#whiteboard").on("mousemove", function(element) {
    if (isMovingWhiteboard) {
        whiteboardMarginLeft = element.clientX - mouseStartX + whiteboardStartX;
        whiteboardMarginTop = element.clientY - mouseStartY + whiteboardStartY;
        setWhiteboardMarginAndSize();
    }
});


function setWhiteboardMarginAndSize() {
    if (whiteboardMarginLeft > -20) whiteboardMarginLeft = whiteboardMarginLeft % 20 - 20;
    if (whiteboardMarginTop > -20) whiteboardMarginTop = whiteboardMarginTop % 20 - 20;

    var whiteboardWidth = $("#whiteboard").width();
    var whiteboardHeight = $("#whiteboard").height();
    var whiteboardZoom = parseFloat($("#whiteboard").css("zoom"));
    var whiteboardContainerWidth = $("#whiteboard-container").width();
    var whiteboardContainerHeight = $("#whiteboard-container").height();
    var overlapX = whiteboardContainerWidth - whiteboardWidth * whiteboardZoom - whiteboardMarginLeft;
    var overlapY = whiteboardContainerHeight - whiteboardHeight * whiteboardZoom - whiteboardMarginTop;

    if (overlapX > 0) $("#whiteboard").width(whiteboardWidth + (overlapX / whiteboardZoom) + "px");
    if (overlapY > 0) $("#whiteboard").height(whiteboardHeight + (overlapY / whiteboardZoom) + "px");

    $("#whiteboard").css({
        "margin-left": whiteboardMarginLeft,
        "margin-top": whiteboardMarginTop
    });
}

function setWhiteboardZoom(zoom = 1) {
    if (zoom < 0.5) zoom = 0.5;
    if (zoom > 2) zoom = 2;
    $("#whiteboard").css("zoom", zoom);
    $("#zoomText").html(Math.floor(zoom * 100) + "%");
    setWhiteboardMarginAndSize();
}

document.getElementById("whiteboard").addEventListener("wheel", function(e) {
    e.preventDefault();
    var newZoom = parseFloat($("#whiteboard").css("zoom")) - e.deltaY * 0.005;
    setWhiteboardZoom(newZoom);
});

$("#zoomNeutral").click(function() {
    setWhiteboardZoom(1);
});

$("#zoomIncrement").click(function() {
    var currentZoom = parseFloat($("#whiteboard").css("zoom"));
    var newZoom = Math.round(currentZoom / 0.05) * 0.05 + 0.05;
    console.log(newZoom);
    setWhiteboardZoom(newZoom);
});

$("#zoomDecrement").click(function() {
    var currentZoom = parseFloat($("#whiteboard").css("zoom"));
    setWhiteboardZoom(Math.round(currentZoom / 0.05) * 0.05 - 0.05);
});*/




function addComponentToWhiteboard(compType) {
    var selectedComponent = structuredClone(components[compType]);
    console.log(selectedComponent);

    var title = selectedComponent.title;
    var icon = selectedComponent.icon || "fa-solid fa-question";
    var inputPorts = selectedComponent["x-class"]["input_ports"].length || 0;
    var outputPorts = selectedComponent["x-class"]["output_ports"].length || 0;

    var html = "<span class='componentIcon'><i class='"+icon+"'></i></span><br><span class='componentName'>"+title+"</span>";

    editor.addNode('componentID', inputPorts, outputPorts, 150, 300, 'component', {}, html);

}


var drawflow = document.getElementById("drawflow");
var editor = new Drawflow(drawflow);

editor.editor_mode = "edit";
editor.zoom_value = 0.01;

editor.start();

editor.on("zoom", function(zoom_level) {
    $("#zoomText").html(Math.round(zoom_level * 100) + "%");
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