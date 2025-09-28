import p5 from "p5";


const Y_MARGIN = 100;
const GRID_SIZE = 20;
const CELL_SIZE = (window.innerHeight - 2 * Y_MARGIN) / (GRID_SIZE);
const X_MARGIN = (window.innerWidth - CELL_SIZE * GRID_SIZE) / 2;

type Direction = 0 | 90 | 180 | 270; // R U L D


// The grid acts as a Game Manager
// Handles the input events, player direction
// TODO: 
//      - Keep score
//      - Have a special food that just stays there for X amount of time, just gives points
class Grid {

  private pause = false;
  private moveInterval = 200;
  private lastMoveTime = 0;

  private p: p5;

  // Array of all the cells flat
  // [[1,2,3], [4,5,6],[7,8,9]] => [1,2,3,4,5,6,7,8,9]
  private cells: Cell[] = [];

  // Only keeps track of the head, anthing else does not matter
  private snakeHead: SnakeBlock;

  private playerDirection: Direction = 0;

  // Fixes bug in movement
  hasAdvanceInThisCurrentDir: boolean = false;

  constructor(p: p5) {
    this.p = p;
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        this.cells.push(new Cell(GRID_SIZE * i + j, p))
      }
    }

    // Spawns head in the "middle"
    this.snakeHead = new SnakeBlock(this.cells[(this.cells.length - GRID_SIZE - 2) / 2], this.p);
    // Spawns first tail block
    this.snakeHead.attachChild(new SnakeBlock(this.cells[this.snakeHead.position.index + 1], p))

    this.generateFood()
  }

  move() {
    if (this.pause) return;

    // Stores how to get to the next cell in the array 
    // L and R movements are +- 1
    // U and D movements are +- GRID_SIZE, or skip a whole row
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

    // Validates Collision with borders and snake blocks
    // Returns the cell to move the head or undefined if collided
    const nextCell = this.validateCollisions(this.snakeHead.position.index, modifier);

    // Ends the game
    if (nextCell == undefined) return this.endGame();

    // Moves the head, and in that the connected blocks
    // Returns the cell where the last block WAS
    // If the next block is food, spawns a new block there
    const lastCell = this.snakeHead.move(nextCell);
    if (nextCell.isFood) {

      this.snakeHead.attachChild(new SnakeBlock(lastCell, this.p));
      nextCell.isFood = false;
      this.generateFood()
    }

    // Part of the movement bugfix
    this.hasAdvanceInThisCurrentDir = true;
  }

  changeDirection(direction: Direction) {
    // Can only change direction after you have advanced 1 block
    if (Math.abs(this.playerDirection - direction) == 180 || !this.hasAdvanceInThisCurrentDir) return
    this.playerDirection = direction;
    this.hasAdvanceInThisCurrentDir = false;
  }

  // Randomly selects a cell to make it food 
  // If the cell has a snake block, checks the one to the right
  generateFood() {
    let randCellIndex = Math.floor(Math.random() * GRID_SIZE * GRID_SIZE);
    let cell = this.cells[randCellIndex];
    while (cell.snakeBlock) {
      randCellIndex++;
      if (randCellIndex == GRID_SIZE * GRID_SIZE) randCellIndex = 0;
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

    // Returns the valid block
    return nextCell;
  }

  endGame() {
    // Just pauses the game
    console.log('Game Over');
    this.pause = true;
  }

  draw() {

    // Only applies movement every moveInterval milliseconds
    // TODO: reduce the moveInterval parameter proportional to the score to make it harder
    if (!(this.p.millis() - this.lastMoveTime > this.moveInterval)) return;

    this.move();
    this.lastMoveTime = this.p.millis();
    this.cells.forEach(cell => cell.draw());
    this.snakeHead.draw();

  }
}

// The building block of a snake
// Resembles a linked list:
// Each block only knows of the next block
class SnakeBlock {

  // Stores a reference to the next block, can be empty
  private child: SnakeBlock | undefined;


  // Keeps a reference of its position
  position: Cell;

  private p: p5;

  constructor(position: Cell, p: p5) {
    this.position = position;
    this.p = p;
  }


  draw() {
    this.p.fill(20);
    this.p.rect(...this.position.getCoordinates(), CELL_SIZE);
    if (this.child) this.child.draw();
  }


  move(newPos: Cell): Cell {

    // Makes its cell an empty cell
    this.position.snakeBlock = false;

    // Asumes this is the last block and makes its position the last position 
    // This is used as the place where new blocks are spawned
    let lastCell: Cell = this.position;

    // Moves its child if exists, its child returns its last position
    // Overwrites the last position with the child last position
    //
    // This happens sort of recursively, the last cell gets replaced with the child lastCell until theres no child
    // That gets returned up the chain until it gets to the head snakeBlock, that returns it to the Grid
    if (this.child) lastCell = this.child.move(this.position);


    // Updates its own new position
    this.position = newPos;
    // Tells the cell now has a snakeblock
    newPos.snakeBlock = true;

    // Returns the last cell
    return lastCell;

  }
  // Another "recursive" method
  attachChild(child: SnakeBlock): void {
    // If theres already a child in this snakeBlock, this method get executed with the child
    // So, if the child has a child, it gets executed with that blocks
    // Eventually a child wont have a child of its own
    if (this.child) return this.child.attachChild(child)

    // Then it gets stored
    this.child = child;
  }
}

// Main block of the game area
class Cell {

  private px: number;
  private py: number;
  private p: p5;
  index: number;

  isFood: boolean = false;
  snakeBlock: boolean = false;

  constructor(index: number, p: p5) {

    // Calculates the pixel postion based on the index
    this.index = index;
    this.px = (index % GRID_SIZE) * CELL_SIZE + X_MARGIN;
    this.py = Math.floor(index / GRID_SIZE) * CELL_SIZE + Y_MARGIN;
    this.p = p;
  }

  draw() {
    // Draws a box, gray if normal, white if food
    this.p.fill(128);
    if (this.isFood) this.p.fill(255);
    this.p.rect(this.px, this.py, CELL_SIZE);

  }

  getCoordinates(): [number, number] {
    // Returns an array of the x, y coordinates
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

// WASD Controller
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
