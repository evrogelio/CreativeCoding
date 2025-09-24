import p5 from "p5";

const ITERATIONS = 5, PADDING = 0;

function setup(p: p5) {
  p.createCanvas(p.windowWidth, p.windowHeight);
  p.background(0);
  p.stroke(0);
  p.noFill();
  let squares: Square[] = [{ x: (p.windowWidth - p.windowHeight) / 2, y: PADDING, length: p.windowHeight - PADDING * 2 }];

  p.rect(squares[0].x, squares[0].y, squares[0].length);
  for (let i = 0; i < ITERATIONS; i++) {
    if (i == ITERATIONS - 1) p.fill(255);
    const new_squares: Square[] = [];

    for (let j = 0; j < squares.length; j++) {
      const current_square = squares[j];
      for (let k = 0; k < 9; k++) {
        if (k == 4) continue;
        const new_square = calculate_square(current_square, k);
        p.rect(new_square.x, new_square.y, new_square.length);
        new_squares.push(new_square);
      }
    }
    squares = new_squares;
  }
}


function resize(p: p5) {
  p.resizeCanvas(p.windowWidth, p.windowHeight);
  p.background(0);
}

new p5((p: p5) => {
  p.setup = () => setup(p);
  p.windowResized = () => resize(p)
})



type Square = {
  x: number;
  y: number;
  length: number;
}

function calculate_square(current_square: Square, index: number): Square {
  const new_lenght = current_square.length / 3;
  const new_square: Square = {
    x: current_square.x + new_lenght * (index % 3),
    y: current_square.y + new_lenght * Math.floor(index / 3),
    length: new_lenght
  }
  return new_square;
}
