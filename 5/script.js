const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const collisionCanvas = document.getElementById("collisionCanvas");
const collisionCtx = collisionCanvas.getContext("2d");
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;

let timeTONextRaven = 0;
let ravenInterval = 500;
let lastTime = 0;
let score = 0;
ctx.font = "50px Impact";

function drawScore() {
  ctx.fillStyle = "black";
  ctx.fillText("Score: " + score, 50, 75);
  ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, 55, 80);
}

class Raven {
  constructor() {
    this.spriteWidth = 271;
    this.spriteHeight = 194;
    this.sizeModifier = Math.random() * 0.6 + 0.4;
    this.width = 100 * this.sizeModifier;
    this.height = 50 * this.sizeModifier;
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height - this.height);
    this.directionX = Math.random() * 5 + 3;
    this.directionY = Math.random() * 5 - 2.5;
    this.makedForDeletion = false;
    this.image = new Image();
    this.image.src = "raven.png";
    this.frame = 0;
    this.maxFrame = 4;
    this.timeSinceFlap = 0;
    this.flapInterval = Math.random() * 50 + 50;

    this.randomColor = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
    ];
    this.color =
      "rgb(" +
      this.randomColor[0] +
      "," +
      this.randomColor[1] +
      "," +
      this.randomColor[2] +
      ")";
  }

  update(deltaTime) {
    if (this.y < 0 || this.y > canvas.height - this.height)
      this.directionY = this.directionY * -1;
    this.x -= this.directionX;
    this.y += this.directionY;
    if (this.x < 0 - this.width) this.makedForDeletion = true;
    this.timeSinceFlap += deltaTime;
    if (this.timeSinceFlap > this.flapInterval) {
      if (this.frame > this.maxFrame) this.frame = 0;
      else this.frame++;
      this.timeSinceFlap = 0;
      this.timeSinceFlap = 0;
    }
  }

  draw() {
    collisionCtx.fillStyle = this.color;
    collisionCtx.fillRect(this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

const r = new Raven();
let ravens = [];
let explosions = [];
class Explosion {
  constructor(x, y, size) {
    this.image = new Image();
    this.image.src = "boom.png";  
    this.spriteWidth = 200;
    this.spriteHeight = 179;
    this.size = size;
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.sound = new Audio();
    this.sound.src = "boom.wav";
    this.timeSinceLastFrame = 0;
    this.frameInterval = 200;
    // this.makedForDeletion = false;
    // this.sound.play();
  }

  update(deltaTime) {
    this.timeSinceLastFrame += deltaTime;    
    if (this.timeSinceLastFrame > this.frameInterval) {
      this.frame++;
      this.timeSinceLastFrame = 0;
      // if (this.frame > 5) this.makedForDeletion = true;
    }
  }
  draw() {  
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,  this.spriteWidth,
      this.spriteHeight,
      this.x,this.y,this.size,this.size );
    }
}
window.addEventListener("click", function (e) {
  const detectPixenlColor = collisionCtx.getImageData(e.x, e.y, 1, 1);
  console.log(detectPixenlColor);
  const pc = detectPixenlColor.data;
  ravens.forEach((object) => {
    console.log(object.randomColor, pc);
    if (
      object.randomColor[0] === pc[0] &&
      object.randomColor[1] === pc[1] &&
      object.randomColor[2] === pc[2]
    ) {
      object.makedForDeletion = true;
      score++;
      console.log(score);
    }
  });
});

function animate(timestamp) {
  collisionCtx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  r.update();
  // timeTONextRaven+=1;

  let deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  timeTONextRaven += deltaTime;
  if (timeTONextRaven > ravenInterval) {
    ravens.push(new Raven());
    timeTONextRaven = 0;
    ravens.sort(function (a, b) {
      return a.width - b.width;
    });
  }
  // timeTONextRaven+=deltaTime;
  // console.log(lastTime);

  drawScore();
  [...ravens].forEach((raven) => {
    raven.update(deltaTime);
    raven.draw();
  });

  ravens = ravens.filter((raven) => !raven.makedForDeletion);

  r.draw();
  requestAnimationFrame(animate);
}

animate(0);
