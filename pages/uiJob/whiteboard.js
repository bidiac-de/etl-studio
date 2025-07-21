var isMovingWhiteboard = false;
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

        $("#whiteboard").css({
            "margin-left": whiteboardMarginLeft,
            "margin-top": whiteboardMarginTop
        });
    }
});