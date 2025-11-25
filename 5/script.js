const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// document.body.style.touchAction = "none";
// document.body.style.overflow = "hidden";



function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Optional: redraw background / UI if needed
  ctx.font = "50px Impact"; // reset font after resize
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas(); // initial call

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

function drawGameOver() {
  ctx.textAlign = "center";
  ctx.fillStyle = "black";
  ctx.fillText(
    "GAME OVER, your score is " + score,
    canvas.width / 2,
    canvas.height / 2
  );

  ctx.fillStyle = "white";
  ctx.fillText(
    "GAME OVER, your score is " + score,
    canvas.width / 2 + 5,
    5 + canvas.height / 2
  );
}
gameover = false;
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
    this.image.onclick = () => {
      handleClickOrTouch(); 
      console.log("clicked");
      this.object.markedForDeletion = true;
      score++;
      explosions.push(new Explosion(object.x, object.y, object.width));
      console.log(explosions);
    };
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
    // if(this.x<=30) { this.x=30; this.y=this.y-this.directionY;}
    if (this.x < 0 - this.width) this.makedForDeletion = true;
    this.timeSinceFlap += deltaTime;
    if (this.timeSinceFlap > this.flapInterval) {
      if (this.frame > this.maxFrame) this.frame = 0;
      else this.frame++;
      this.timeSinceFlap = 0;
      this.timeSinceFlap = 0;
    }
    if (this.x < 0 - this.width) gameover = true;
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
    this.image.src = "bomb.png";


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
    if (this.frame === 0) this.sound.play();
    this.timeSinceLastFrame += deltaTime;
    if (this.timeSinceLastFrame > this.frameInterval) {
      this.frame++;
      this.timeSinceLastFrame = 0;
      if (this.frame > 5) this.makedForDeletion = true;
    }
  }
  draw() {
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth + 10,
      this.spriteHeight,
      this.x,
      this.y,
      this.size,
      this.size
    );
  }
}

window.addEventListener("click", handleClickOrTouch);
canvas.addEventListener("touchstart", handleClickOrTouch, { passive: false });
function handleClickOrTouch(e) {
  e.preventDefault(); // prevent scrolling on mobile

  // Get client coordinates
  let clientX = e.clientX;
  let clientY = e.clientY;

  // Touch events: get from touches[0]
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }

  const rect = collisionCanvas.getBoundingClientRect();
  const scaleX = collisionCanvas.width / rect.width;
  const scaleY = collisionCanvas.height / rect.height;

  const x = Math.floor((clientX - rect.left) * scaleX);
  const y = Math.floor((clientY - rect.top) * scaleY);

  const pixel = collisionCtx.getImageData(x, y, 1, 1).data;

  ravens.forEach((object) => {
    if (
      object.randomColor[0] === pixel[0] &&
      object.randomColor[1] === pixel[1] &&
      object.randomColor[2] === pixel[2]
    ) {
      object.makedForDeletion = true;
      score++;
      explosions.push(new Explosion(object.x, object.y, object.width));
      console.log("Explosion triggered:", explosions.length);
    }
  });
}


// canvas.addEventListener("click", function (e) {
//   const detectPixenlColor = collisionCtx.getBoundingClientRect(e.x, e.y, 1, 1);
//   const pc = detectPixenlColor.data;
//   console.log(pc);
//   ravens.forEach((object) => {
//     if (
//       object.randomColor[0] === pc[0] &&
//       object.randomColor[1] === pc[1] &&
//       object.randomColor[2] === pc[2]
//     ) {
//       object.makedForDeletion = true;
//       score++;
//       explosions.push(new Explosion(object.x, object.y, object.width));
//       console.log(explosions);
//     }
//   });
// });

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
  [...ravens, ...explosions].forEach((raven) => {
    raven.update(deltaTime);
    raven.draw();
  });

  ravens = ravens.filter((raven) => !raven.makedForDeletion);
  explosions = explosions.filter((explosion) => !explosion.makedForDeletion);

  r.draw();
  // if(!gameover)
  requestAnimationFrame(animate);
  // else drawGameOver()
}

animate(0);
