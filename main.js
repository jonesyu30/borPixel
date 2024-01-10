
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var coordsShift = {x:0, y:0};
var visibleBox = 10;
var pixelPerBox = Math.max(
    Math.floor(canvas.width / visibleBox),
    Math.floor(canvas.height / visibleBox),
);
const initialpixelPerBox = pixelPerBox;
var scale = pixelPerBox/initialpixelPerBox;

function DrawBoxOutline(){
    ctx.strokeStyle = 'LightGray'
    for (var i = (coordsShift.y%pixelPerBox); i < canvas.height; i += pixelPerBox) {
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
    }
    for (var i = (coordsShift.x%pixelPerBox); i < canvas.width; i += pixelPerBox) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
    }
    ctx.stroke();  
}
DrawBoxOutline();

//init array
var THE_ARRAY = [];
const canvasSize = 1024;
for (var i = 1; i <= canvasSize; i++) {
    var temp = [];
    for (var j = 1; j <= canvasSize; j++) {
        temp.push(0);
    }
    THE_ARRAY.push(temp);
}


canvas.addEventListener("mousedown", (event) => {
    // console.log(event);
    if(event.ctrlKey) return;
    var x = (Math.floor((event.clientX-coordsShift.x) / pixelPerBox));
    var y = (Math.floor((event.clientY-coordsShift.y) / pixelPerBox));
    if(y < 0 || y >= THE_ARRAY.length) return;
    if(x < 0 || x >= THE_ARRAY[y].length) return;
    THE_ARRAY[y][x] = 1 - THE_ARRAY[y][x];
    
    console.log(x, y);
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.rect(x*pixelPerBox + coordsShift.x, y*pixelPerBox + coordsShift.y, pixelPerBox, pixelPerBox);
    ctx.fill();
});

canvas.addEventListener("touchmove", (event) =>{
    switch (event.touches.length) {
        case 2:
            var center = {
                x:(event.touches[0].clientX + event.touches[1].clientX)/2,
                y:(event.touches[0].clientY + event.touches[1].clientY)/2,
            }
            handleMove(center.x, center.y);


            if(lastTouches[0] == null){
                lastTouches[0] = event.touches[0];
                lastTouches[1] = event.touches[1];
            }
            var lastDistance = Math.hypot(lastTouches[0].clientX - lastTouches[1].clientX, 
                                            lastTouches[0].clientY - lastTouches[1].clientY)
            var thisDistance = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, 
                                            event.touches[0].clientY - event.touches[1].clientY)
            handleZoom((lastDistance - thisDistance)*5, center.x, center.y)

            lastTouches[0] = event.touches[0];
            lastTouches[1] = event.touches[1];



            event.preventDefault();
            break;
        default:
            break;
    }
});

drawCanvas = function () {
    var topLeft = {
        x:Math.max(Math.floor(-coordsShift.x/pixelPerBox), 0),
        y:Math.max(Math.floor(-coordsShift.y/pixelPerBox), 0)
    }
    
    ctx.fillStyle = '#313639';
    ctx.beginPath();
    for (var y = topLeft.y; y <= topLeft.y+visibleBox; y++) {
        if(!THE_ARRAY[y]) continue;
        var drawY = y*pixelPerBox+coordsShift.y;
        for (var x = topLeft.x; x <= topLeft.x+visibleBox; x++) {
            if(!THE_ARRAY[y][x]) continue;
            if (THE_ARRAY[y][x]) {
                ctx.rect(x*pixelPerBox+coordsShift.x, drawY, pixelPerBox, pixelPerBox);
            }
        }
    }
    ctx.fill();
}

var lastPos = {};
var lastTouches = [];
canvas.addEventListener('mouseup', () =>{
    lastPos = {};
})
canvas.addEventListener('touchstart', (event) =>{
    // event.preventDefault();
})
canvas.addEventListener('touchend', (event) =>{
    if(event.touches.length >= 1){
        lastPos = {};
        lastTouches = [];
    }
    // event.preventDefault();
})

var handleMove = function(clientX, clientY){
    if(lastPos.x == null || lastPos.y == null){
        lastPos.x = clientX;
        lastPos.y = clientY;
    }else{
        var deltaX = clientX - lastPos.x;
        var deltaY = clientY - lastPos.y;
        coordsShift.x += deltaX;
        coordsShift.y += deltaY;
        lastPos.x = clientX;
        lastPos.y = clientY;
    }
    // console.log(coordsShift);
    updateCanvas();
}

var handleZoom = function(zoomScale, centerX, centerY){//scale = -100 or 100
    if(zoomScale > 0){
        if(visibleBox >= 100) return;
        pixelPerBox *= (1 - zoomScale/1000); // smaller box

        console.log(zoomScale/1000)
        var newMapClientCoord = windowToMap(centerX, centerY, pixelPerBox);
        var oldMapClientCoord = windowToMap(centerX, centerY, pixelPerBox/(1 - zoomScale/1000));
        var oldShiftCoord = windowToMap(coordsShift.x, coordsShift.y, pixelPerBox);
        var deltaCoordsShift = mapToWindow(oldShiftCoord.x + newMapClientCoord.x - oldMapClientCoord.x, 
            oldShiftCoord.y + newMapClientCoord.y - oldMapClientCoord.y, pixelPerBox);
        coordsShift.x = deltaCoordsShift.x;
        coordsShift.y = deltaCoordsShift.y;
    }
    if(zoomScale < 0){
        if(visibleBox <= 1) return;
        pixelPerBox /= (1 - -zoomScale/1000); // larger box

        var newMapClientCoord = windowToMap(centerX, centerY, pixelPerBox);
        var oldMapClientCoord = windowToMap(centerX, centerY, pixelPerBox*(1 - -zoomScale/1000));
        var oldShiftCoord = windowToMap(coordsShift.x, coordsShift.y, pixelPerBox);
        var deltaCoordsShift = mapToWindow(oldShiftCoord.x + newMapClientCoord.x - oldMapClientCoord.x, 
            oldShiftCoord.y + newMapClientCoord.y - oldMapClientCoord.y, pixelPerBox);
        coordsShift.x = deltaCoordsShift.x;
        coordsShift.y = deltaCoordsShift.y;
    }

    visibleBox = Math.floor(Math.max(canvas.width/pixelPerBox, canvas.height/pixelPerBox));
    updateCanvas();
}

canvas.addEventListener("mousemove", (event) => {
    if(!event.ctrlKey) return;
    if(!event.buttons) return;
    handleMove(event.clientX, event.clientY);
});

function windowToMap(winX, winY, ppB){
    mapX = (winX - coordsShift.x)/ppB*initialpixelPerBox;
    mapY = (winY - coordsShift.y)/ppB*initialpixelPerBox;
    return({x:mapX, y:mapY})
}
function mapToWindow(mapX, mapY, ppB){
    winX = mapX/initialpixelPerBox*ppB + coordsShift.x;
    winY = mapY/initialpixelPerBox*ppB + coordsShift.y;
    return({x:winX, y:winY})
}

canvas.addEventListener("wheel", (event) =>{
    handleZoom(event.deltaY, event.clientX, event.clientY)
})

var updateCanvas = function(){
    ctx.fillStyle = '#F9F6EE';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();
    DrawBoxOutline();
    drawCanvas();
}


console.log('i will push this...')