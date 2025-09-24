import p5 from "p5"

function setup(p: p5) {
  p.createCanvas(p.windowWidth, p.windowHeight);
}

function draw(p: p5) {
  p.frameRate(60);

  p.background(0)

  const SIZE = 25;
  const cols = Math.ceil(p.windowWidth / SIZE);
  const rows = Math.ceil(p.windowHeight / SIZE);

  p.noStroke()
  p.ellipseMode(p.CORNER)

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = i * SIZE
      const y = j * SIZE


      p.fill(Math.floor((j / rows) * 255), 0, Math.floor((i / cols) * 255),)

      p.ellipse(x, y, SIZE, SIZE)

    }
  }
}

function resize(p: p5) {
  p.resizeCanvas(p.windowWidth, p.windowHeight);
  p.background(0);
}

new p5((p: p5) => {
  p.setup = () => setup(p);
  p.windowResized = () => resize(p)
  p.draw = () => draw(p)
})

