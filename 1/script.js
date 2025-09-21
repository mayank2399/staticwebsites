const canvas1 = document.getElementById("canvas1");

const ctx = canvas1.getContext("2d");
const CANVAS_WIDTH = (canvas1.width = 600);
const CANVAS_HEIGHT = (canvas1.height = 600);

// let x=0;

const playerImage = new Image();
playerImage.src = "cuberunner.png";

const spriteWidth = 257;
const spriteHeight = 204;

let counter = 0;
let size = 12;

let framex = 0;
let frameY = 1;



const data={
    "player":{
        "width":300,
        "height":410,
        "frames":3
    },
    "coin":{
        "width":257,
        "height":440,
        "frames":3
    }
}


function animate() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // ctx.fillRect(x,50,100,100);

  // Takes 9 arguments image,source (x,y,width,height), destination (x,y,width,height)
  ctx.drawImage(
    playerImage,
    framex * 300,
    frameY * 710,
    spriteWidth,
    spriteHeight,
    0,
    0,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );
  counter++;
  if (counter % size === 0) {
    if (framex < 2) framex++;
    else framex = 0;
  }
  requestAnimationFrame(animate);
}

animate();
