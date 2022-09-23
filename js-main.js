
window.onload=function() {
	canv=document.getElementById("gc");
	ctx=canv.getContext("2d");
    document.addEventListener("click", handleClick);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    refreshGrid();
}

function refreshGrid() {
    const height = Number(document.getElementById("height").value);
    const width = Number(document.getElementById("width").value);
    const cursorx = Number(document.getElementById("cursorx").value);
    const cursory = Number(document.getElementById("cursory").value);
    setup(height, width, cursorx, cursory);
    draw();
}

function startAnimation() {
    const height = Number(document.getElementById("height").value);
    const width = Number(document.getElementById("width").value);
    const cursorx = Number(document.getElementById("cursorx").value);
    const cursory = Number(document.getElementById("cursory").value);
    if(height !== grid.height || width !== grid.width || cursorx !== cursor[0] || cursory !== cursor[1]) {
        setup(height, width, cursorx, cursory);
    }
    const fps = Number(document.getElementById("fps").value);
    mainInterval = setInterval(main, 1000/fps);
}

function saveGrid() {
    let text = "const savedGrid = [";
    for(let i=0; i<grid.height; i++) {
        text += "[";
        for(let j=0; j<grid.width; j++) {
            text += grid.cells[i][j].alive ? "true" : "false";
            if(j < grid.width-1) {
                text += ",";
            }
        }
        text += "]";
        if(i < grid.height-1) {
            text += ",";
        }
        text += "\n";
    }
    text += "];"

    document.getElementById("output").innerText = text;
}

function setup(_height, _width, _cursorx, _cursory) {
    // import saved grid if available
    if(typeof(detailGrid) !== "undefined") {
        _height = detailGrid.height;
        _width = detailGrid.width;
        document.getElementById("height").value = _height;
        document.getElementById("width").value = _width;
    } else if(typeof(savedGrid) !== "undefined") {
        _height = savedGrid.length;
        _width = savedGrid[0].length;
        document.getElementById("height").value = _height;
        document.getElementById("width").value = _width;
    }

    // define global grid object
    grid = {
        height: _height,
		width: _width,
        cells: [],
        color: "#66B",
        scale: canv.width/Math.max(_height,_width),
        complete: false,
        filled: 0
    };
    cursor = [_cursory, _cursorx];

    // populate grid with new cells
    for(let i=0; i<grid.height; ++i) {
        grid.cells.push([]);
        for(let j=0; j<grid.width; ++j) {
            grid.cells[i].push(new Cell(i,j));
        }
    }

    // update cells with saved grid data if available
    if(typeof(detailGrid) !== "undefined") {
        for(let i=0; i<detailGrid.height; i++) {
            for(let j=0; j<detailGrid.width; j++) {
                grid.cells[i][j].walls = {...detailGrid.cells[i][j].walls};
                grid.cells[i][j].visited = detailGrid.cells[i][j].visited;
                grid.cells[i][j].alive = detailGrid.cells[i][j].alive;
                grid.cells[i][j].color = detailGrid.cells[i][j].color;
            }
        }
    } else if(typeof(savedGrid) !== "undefined") {
        for(let i=0; i<savedGrid.length; i++) {
            for(let j=0; j<savedGrid[i].length; j++) {
                if(grid.cells[i][j].alive !== savedGrid[i][j]) {
                    grid.cells[i][j].toggleAlive();
                }
            }
        }
    }
}

function Cell(i,j) {
    this.i = i;
    this.j = j;
    stack = [];
    this.walls = {
        top: true,
        right: true,
        bottom: true,
        left: true
    };
    this.visited = false;
    this.alive = true;
    this.color = "#BBB";

    this.toggleAlive = function() {
        this.alive = !this.alive;
        this.color = this.alive ? "#BBB" : "#555";
    }

    this.visit = function() {
        this.visited = true;
        // this.color = "#449"; // blue
        // this.color = "#39b397"; // teal
        this.color = "#222"; // dark gray
    }

    this.getCellCorner = function() {
        if(!this.walls.top && !this.walls.right && this.walls.bottom && this.walls.left) return 0;
        if(this.walls.top && !this.walls.right && !this.walls.bottom && this.walls.left) return 1;
        if(this.walls.top && this.walls.right && !this.walls.bottom && !this.walls.left) return 2;
        if(!this.walls.top && this.walls.right && this.walls.bottom && !this.walls.left) return 3;
        return -1;
    }

    this.show = function() {
        // collect UI selections
        const showGrid = document.getElementById("griddisplay").checked;
        const showLine = document.getElementById("linedisplay").checked;
        const roundLine = document.getElementById("roundline").checked;
        const showMaze = document.getElementById("mazedisplay").checked;
        const showWalls = document.getElementById("wallsdisplay").checked;

        // define current cell details
        const x = this.j*grid.scale,
              y = this.i*grid.scale,
              midX = x+grid.scale/2,
              midY = y+grid.scale/2,
              cellCorner = this.getCellCorner();
        
        // fill cell (modify if cursor or hidden)
        ctx.fillStyle = this.color;
        if(this.i == cursor[0] && this.j == cursor[1]) {
            ctx.fillStyle = "#494";
        }
        if(!showMaze && this.visited) {
            ctx.fillStyle = "white";
        }
        ctx.fillRect(x,y,grid.scale,grid.scale);

        // show walls
        ctx.strokeStyle = "white";
        ctx.lineWidth = "1";
        ctx.lineCap = "round";
        if(!showMaze && showWalls) {
            ctx.strokeStyle = "#222";
        }
        if(this.walls.top) line(x,y,x+grid.scale,y);
        if(this.walls.right) line(x+grid.scale,y,x+grid.scale,y+grid.scale);
        if(this.walls.bottom) line(x+grid.scale,y+grid.scale,x,y+grid.scale);
        if(this.walls.left) line(x,y+grid.scale,x,y);

        // draw line inside maze
        if(showLine) {
            ctx.strokeStyle="#222";
            ctx.lineWidth=grid.scale*0.5;
            if(roundLine) {
                ctx.lineCap="round";
                switch(cellCorner) {
                    case 0:
                        arc(x+grid.scale,y,grid.scale/2,Math.PI/2,Math.PI);
                        break;
                    case 1:
                        arc(x+grid.scale,y+grid.scale,grid.scale/2,Math.PI,3*Math.PI/2);
                        break;
                    case 2:
                        arc(x,y+grid.scale,grid.scale/2,3*Math.PI/2,2*Math.PI);
                        break;
                    case 3:
                        arc(x,y,grid.scale/2,0,Math.PI/2);
                        break;
                    default:
                        if(!this.walls.top) line(midX,midY,midX,y);
                        if(!this.walls.right) line(midX,midY,x+grid.scale,midY);
                        if(!this.walls.bottom) line(midX,midY,midX,y+grid.scale);
                        if(!this.walls.left) line(midX,midY,x,midY);
                        break;
                }
            } else {
                ctx.lineCap = "square";
                if(!this.walls.top) line(midX,midY,midX,y);
                if(!this.walls.right) line(midX,midY,x+grid.scale,midY);
                if(!this.walls.bottom) line(midX,midY,midX,y+grid.scale);
                if(!this.walls.left) line(midX,midY,x,midY);
            }
        }
    }
}

// draw arc path
function arc(x,y,r,start,end) {
    ctx.beginPath();
    ctx.arc(x,y,r,start,end);
    ctx.stroke();
    ctx.closePath();
}

// draw line path
function line(x1,y1,x2,y2) {
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
    ctx.closePath();
}

// returns boolean representing if some cells in the grid are unvisited
function some_unvisited() {
    for(let i=0; i<grid.height; ++i) {
        for(let j=0; j<grid.width; ++j) {
            if(!grid.cells[i][j].visited && grid.cells[i][j].alive) {
                return true;
            }
        }
    }
    return false;
}

// returns array of unvisited neighbors to input cell, c
function neighbors_unvisited(c) {
    let n = [];
    if(c[1] > 0 && !grid.cells[c[0]][c[1]-1].visited && grid.cells[c[0]][c[1]-1].alive) n.push([c[0],c[1]-1]);
    if(c[0] < grid.height-1 && !grid.cells[c[0]+1][c[1]].visited && grid.cells[c[0]+1][c[1]].alive) n.push([c[0]+1,c[1]]);
    if(c[1] < grid.width-1 && !grid.cells[c[0]][c[1]+1].visited && grid.cells[c[0]][c[1]+1].alive) n.push([c[0],c[1]+1]);
    if(c[0] > 0 && !grid.cells[c[0]-1][c[1]].visited && grid.cells[c[0]-1][c[1]].alive) n.push([c[0]-1,c[1]]);
    return n;
}

// main compute loop which calculates the maze path
function compute() {
    if(!grid.complete) {
        grid.cells[cursor[0]][cursor[1]].visit();
        if(some_unvisited()) {
            let n = neighbors_unvisited(cursor);
            if(n.length) {
                let choice = n[Math.floor(Math.random()*n.length)];
                stack.push([cursor[0],cursor[1]]);
                grid.filled++;
                if(choice[1] < cursor[1]) {
                    grid.cells[cursor[0]][cursor[1]].walls.left = false;
                    grid.cells[choice[0]][choice[1]].walls.right = false;
                } else if(choice[1] > cursor[1]) {
                    grid.cells[cursor[0]][cursor[1]].walls.right = false;
                    grid.cells[choice[0]][choice[1]].walls.left = false;
                } else if(choice[0] < cursor[0]) {
                    grid.cells[cursor[0]][cursor[1]].walls.top = false;
                    grid.cells[choice[0]][choice[1]].walls.bottom = false;
                } else if(choice[0] > cursor[0]) {
                    grid.cells[cursor[0]][cursor[1]].walls.bottom = false;
                    grid.cells[choice[0]][choice[1]].walls.top = false;
                }
                cursor[0] = choice[0];
                cursor[1] = choice[1];
            } else if(stack.length) {
                let removed = stack.pop();
                cursor[0] = removed[0];
                cursor[1] = removed[1];
            } else {
                console.log("complete");
                grid.complete = true;
                cursor = [-1,-1];
            }
        } else {
            console.log("complete");
            grid.complete = true;
            cursor = [-1,-1];
        }
    } else {
        clearInterval(mainInterval);
    }
}

function draw() {
    const showGrid = document.getElementById("griddisplay").checked;
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,canv.width,canv.height);
    for(let i=0; i<grid.height; ++i) {
        for(let j=0; j<grid.width; ++j) {
            if(grid.cells[i][j].visited || showGrid) grid.cells[i][j].show();
        }
    }
}

function drawLocal() {
    const showGrid = document.getElementById("griddisplay").checked;
    if(cursor[0] > 0) {
        if(cursor[1] > 0) {
            // SHOW ABOVE AND LEFT
            if(grid.cells[cursor[0]-1][cursor[1]-1].visited || showGrid) {
                grid.cells[cursor[0]-1][cursor[1]-1].show();
            }
        }
        // SHOW DIRECTLY ABOVE
        if(grid.cells[cursor[0]-1][cursor[1]].visited || showGrid) {
            grid.cells[cursor[0]-1][cursor[1]].show();
        }
        if(cursor[1] < grid.width-1) {
            // SHOW ABOVE AND RIGHT
            if(grid.cells[cursor[0]-1][cursor[1]+1].visited || showGrid) {
                grid.cells[cursor[0]-1][cursor[1]+1].show();
            }
        }
    }
    if(cursor[1] > 0) {
        // SHOW LEFT
        if(grid.cells[cursor[0]][cursor[1]-1].visited || showGrid) {
            grid.cells[cursor[0]][cursor[1]-1].show();
        }
    }
    if(cursor[1] < grid.width-1) {
        // SHOW RIGHT
        if(grid.cells[cursor[0]][cursor[1]+1].visited || showGrid) {
            grid.cells[cursor[0]][cursor[1]+1].show();
        }
    }
    if(cursor[0] < grid.height-1) {
        if(cursor[1] > 0) {
            // SHOW BELOW AND LEFT
            if(grid.cells[cursor[0]+1][cursor[1]-1].visited || showGrid) {
                grid.cells[cursor[0]+1][cursor[1]-1].show();
            }
        }
        // SHOW DIRECTLY BELOW
        if(grid.cells[cursor[0]+1][cursor[1]].visited || showGrid) {
            grid.cells[cursor[0]+1][cursor[1]].show();
        }
        if(cursor[1] < grid.width-1) {
            // SHOW BELOW AND RIGHT
            if(grid.cells[cursor[0]+1][cursor[1]+1].visited || showGrid) {
                grid.cells[cursor[0]+1][cursor[1]+1].show();
            }
        }
    }
}

function main() {
    compute();
    drawLocal();
}

let cursorType = 0;
let isDrawing = false;
function changeCursor(type) {
    console.log("updating cursor type to",type);
    switch(type) {
        case 0:
            cursorType = 0;
            if(!document.getElementById("pointcursor").classList.contains("selected")) {
                document.getElementById("pointcursor").classList += "selected";
            }
            document.getElementById("pencursor").classList.remove("selected");
            document.getElementById("erasercursor").classList.remove("selected");
            break;
        case 1:
            cursorType = 1;
            if(!document.getElementById("pencursor").classList.contains("selected")) {
                document.getElementById("pencursor").classList += "selected";
            }
            document.getElementById("pointcursor").classList.remove("selected");
            document.getElementById("erasercursor").classList.remove("selected");
            break;
        case 2:
            cursorType = 2;
            if(!document.getElementById("erasercursor").classList.contains("selected")) {
                document.getElementById("erasercursor").classList += "selected";
            }
            document.getElementById("pointcursor").classList.remove("selected");
            document.getElementById("pencursor").classList.remove("selected");
            break;
        default:
            console.log("unrecognized cursor type",type);
            break;
    }
}

function handleClick(evt) {
    if(cursorType !== 0) return;
    const clicked = getClickedCell(evt);
    if(clicked) {
        grid.cells[clicked.y][clicked.x].toggleAlive();
        grid.cells[clicked.y][clicked.x].show();
    }
}

function handleMouseDown(evt) {
    isDrawing = true;
    handleMouseMove(evt);
}

function handleMouseUp(evt) {
    isDrawing = false;
}

function handleMouseMove(evt) {
    let hovered;
    if(!isDrawing) return;
    switch(cursorType) {
        case 0:
            return;
        case 1:
            hovered = getClickedCell(evt);
            if(hovered && grid.cells[hovered.y][hovered.x].alive) {
                grid.cells[hovered.y][hovered.x].toggleAlive();
                grid.cells[hovered.y][hovered.x].show();
            }
            break;
        case 2:
            hovered = getClickedCell(evt);
            if(hovered && !grid.cells[hovered.y][hovered.x].alive) {
                grid.cells[hovered.y][hovered.x].toggleAlive();
                grid.cells[hovered.y][hovered.x].show();
            }
            break;
        default:
            console.log("unrecognized cursor type in handleMouseDown");
            break;
    }
}

function getClickedCell(evt) {
    const mouseX = evt.pageX;
    const mouseY = evt.pageY;
    const canvX = window.pageXOffset + canv.getBoundingClientRect().left;
    const canvY = window.pageYOffset + canv.getBoundingClientRect().top;

    const x = mouseX - canvX;
    const y = mouseY - canvY;

    if(x < 0 || y < 0 || x > grid.width * grid.scale || y > grid.height * grid.scale) return false;

    const cellX = Math.floor(x / grid.scale);
    const cellY = Math.floor(y / grid.scale);

    return {x:cellX, y:cellY};
}

function toggleImg() {
    const checked = document.getElementById("imgdisplay").checked;
    document.getElementById("img").style.visibility = checked ? "visible" : "hidden";
}