import p5 from "p5";


const Y_MARGIN = 100;
const GRID_SIZE = 20;
const CELL_SIZE = (window.innerHeight - 2 * Y_MARGIN )/(GRID_SIZE);
const X_MARGIN = (window.innerWidth - CELL_SIZE * GRID_SIZE)/2;


type Direction = 0 | 90 | 180 | 270;

class Grid {
  
  private pause = false;
  private moveInterval = 200;
  private lastMoveTime = 0;

  private p: p5;
  private cells: Cell[] = [];
  private snakeHead: SnakeBlock;

  private playerDirection: Direction = 0;

  hasAdvanceInThisCurrentDir: boolean = false;

  constructor(p: p5){
    this.p = p;
    for(let i = 0; i < GRID_SIZE; i++){
      for(let j = 0; j < GRID_SIZE; j++) {
        this.cells.push(new Cell(GRID_SIZE * i + j, p))
      }
    }
    this.snakeHead = new SnakeBlock(this.cells[(this.cells.length - GRID_SIZE -2)/2], this.p);
    this.snakeHead.attachChild(new SnakeBlock(this.cells[this.snakeHead.position.index + 2], p))
    // this.snakeHead.attachChild(new SnakeBlock(this.cells[this.snakeHead.position.index + 3], p))

    this.generateFood()
  }

  move(){
    if(this.pause) return;
    let modifier = 0;
    switch (this.playerDirection) {
      case 0:
        modifier = 1;
        break;
      case 90:
        modifier = -GRID_SIZE;
        break;
      case 180:
        modifier = -1;
        break;
      case 270:
        modifier = GRID_SIZE;
        break;
    }
    const nextCell = this.validateCollisions(this.snakeHead.position.index, modifier);

    if(nextCell == undefined) return this.endGame();

    const lastCell = this.snakeHead.move(nextCell);
    if(nextCell.isFood) {

      this.snakeHead.attachChild(new SnakeBlock(lastCell, this.p));
      nextCell.isFood = false;
      this.generateFood()
    }
    this.hasAdvanceInThisCurrentDir = true; 
  }
  
  changeDirection(direction: Direction) {
    if(Math.abs(this.playerDirection - direction) == 180 || !this.hasAdvanceInThisCurrentDir) return
    this.playerDirection = direction;
    this.hasAdvanceInThisCurrentDir = false;
  }

  generateFood(){
    let randCellIndex = Math.floor(Math.random() * GRID_SIZE * GRID_SIZE);
    let cell = this.cells[randCellIndex];
    while(cell.snakeBlock){
      randCellIndex++;
      if(randCellIndex == GRID_SIZE * GRID_SIZE) randCellIndex = 0;
      cell = this.cells[randCellIndex];
    }

    cell.isFood = true;

  }
  

  // Checks collisions with border of grid and with snake
  // Returns the cell where the head should be next, or undefined if collided
  private validateCollisions(currentIndex: number, modifier: number): Cell | undefined {
    // Get XY coordinates
    const x = currentIndex % GRID_SIZE + modifier % GRID_SIZE;
    const y = Math.floor(currentIndex / GRID_SIZE) + Math.floor(modifier / GRID_SIZE);
    // Check if snake collides out of bounds
    if (!(x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE)) return undefined;

    // Get next cell
    const nextCell = this.cells[currentIndex + modifier];
    
    // Check if collides with snake
    if (nextCell.snakeBlock) return undefined;
    
    return nextCell;
  }

  endGame(){
    console.log('Game Over');
    this.pause = true;
  }

  draw(){

    if(!(this.p.millis() - this.lastMoveTime > this.moveInterval)) return;
    
    this.move();
    this.lastMoveTime = this.p.millis();
    this.cells.forEach(cell=>cell.draw()); 
    this.snakeHead.draw();
    
  }
}


class SnakeBlock {

  private child: SnakeBlock | undefined;

  position: Cell;

  private p: p5;

  constructor(position: Cell, p: p5){
    this.position = position;
    this.p = p;
  }
  

  draw(){
    this.p.fill(20);
    this.p.rect(...this.position.getCoordinates(), CELL_SIZE);
    if(this.child) this.child.draw();
  }

  move(newPos: Cell): Cell{
    this.position.snakeBlock = false;

    let lastCell: Cell = this.position;
    if(this.child) lastCell = this.child.move(this.position);
    
    this.position = newPos;
    newPos.snakeBlock = true;
    return lastCell;
    
  }

  attachChild(child: SnakeBlock): void{
    if(this.child) return this.child.attachChild(child)
    this.child = child;
  }
}


class Cell {

  private px: number;
  private py: number;
  private p: p5;
  index: number;
  
  isFood: boolean = false;
  snakeBlock: boolean = false;

  constructor(index:number, p: p5) {
    this.index = index;
    this.px = (index % GRID_SIZE) * CELL_SIZE + X_MARGIN;
    this.py = Math.floor(index/GRID_SIZE) * CELL_SIZE + Y_MARGIN;
    this.p = p;
  }

  draw() {
    this.p.fill(128);
    if(this.isFood) this.p.fill(255);
    this.p.rect(this.px, this.py, CELL_SIZE);

  }

  getCoordinates(): [number, number] {
    return [this.px, this.py]
  }
}


function setup(p: p5, grid: Grid) {
  p.createCanvas(p.windowWidth, p.windowHeight);
  p.background(0);
  p.stroke(255);
  p.noFill();
  grid.draw()
}

function draw(grid: Grid) {
  grid.draw()
}

function resize(p: p5) {
  p.resizeCanvas(p.windowWidth, p.windowHeight);
  p.background(0);
}

function inputManager(key: string, grid: Grid) {
  switch (key) {
    case 'w':
      grid.changeDirection(90);
      break;
    case 'a':
      grid.changeDirection(180);
      break;
    case 's':
      grid.changeDirection(270);
      break;
    case 'd':
      grid.changeDirection(0);
      break;

    default:
      break;
  }
}

new p5((p: p5) => {
  const grid = new Grid(p);
  p.setup = () => setup(p, grid);
  p.windowResized = () => resize(p);
  p.draw = () => draw(grid);
  p.keyPressed = () => inputManager(p.key, grid)
})
