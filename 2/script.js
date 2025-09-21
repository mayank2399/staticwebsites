const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");

const CANVAS_HEIGHT = (canvas.height = 800);
const CANVAS_WIDTH = (canvas.width = 800);

const backgroundImage1 = new Image();
backgroundImage1.src = "layers/layer-1.png";

const backgroundImage2 = new Image();
backgroundImage2.src = "layers/layer-2.png";

const backgroundImage3 = new Image();
backgroundImage3.src = "layers/layer-3.png";

const backgroundImage4 = new Image();
backgroundImage4.src = "layers/layer-4.png";

const backgroundImage5 = new Image();
backgroundImage5.src = "layers/layer-5.png";


let x = 0;
gameSpeed = 4;
let gameFrame=0;
const slider=document.getElementById('slider');
slider.value=gameSpeed;

const showGameSpeed=document.getElementById('showGameSpeed');
showGameSpeed.innerText=gameSpeed;

slider.addEventListener('change',function(e){
    gameSpeed=e.target.value;
    showGameSpeed.innerHTML=gameSpeed;
});

class Layer {
  constructor(image, speedModifier) {
    this.x = 0;
    this.y = 0;
    this.width = 2400;
    this.height = 800;
    // this.x2 = this.width;
    this.image = image;
    this.speed = speedModifier * gameSpeed;
    this.speedModifier = speedModifier;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    ctx.drawImage(this.image, this.x+this.width, this.y, this.width, this.height);
  }
  update() {
    this.speed = gameSpeed * this.speedModifier;
    // if (this.x <= -this.width) {
    //   this.x = 0;
    // }
    // // if (this.x2 <= -this.width) {
    // //   this.x2 = this.width + this.x - this.speed;
    // // }

    // 1this.x=Math.floor(this.x-this.speed);
    this.x=gameFrame*this.speed%this.width;
    // this.x2=Math.floor(this.x2-this.speed);
  }
}


const l1 = new Layer(backgroundImage1, .2);
const l2 = new Layer(backgroundImage2, .4);
const l3 = new Layer(backgroundImage3, .6);
const l4 = new Layer(backgroundImage4, .8);
const l5 = new Layer(backgroundImage5, 1);

const layers=[l1,l2,l3,l4,l5];
function animate() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // ctx.drawImage(backgroundImage4,x,0);
  // x-=gameSpeed;
  // if(x<-1000)x=0;

  layers.forEach(layer=>{
    layer.update();
    layer.draw();
  });
  gameFrame--;
  requestAnimationFrame(animate);
}

animate();
