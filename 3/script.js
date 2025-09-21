const canvas=document.getElementById('canvas1');
const ctx=canvas.getContext('2d');

const CANVAS_HEIGHT=canvas.height=600;
const CANVAS_WIDTH=canvas.width=800;

// enemy1={
//     x:10,
//     y:50,
//     width: 100,
//     height:50
// }

const enemy1Img=new Image();
enemy1Img.src="enemy1.png";

let gameFrame=0;
class Enemy{
    constructor(){
        this.x=Math.random()*CANVAS_WIDTH;
        this.y=Math.random()*CANVAS_HEIGHT;

        this.speed=Math.random()*4-2;
        this.spriteWidth=293;
        this.spriteHeight=155;

        this.width=  this.spriteWidth/2.5;
        this.height=this.spriteHeight/2.5;
        this.frame=2;
        this.frameSpeed= Math.floor(Math.random()*3+1);
    }

    update(){
        this.x+= Math.random()*5 -2.5;
        this.y += Math.random()*5 -2.5;

        if(gameFrame%this.frameSpeed===0){
            this.frame>4?this.frame=0:this.frame++;
        }
    }

    draw(){
        // ctx.fillRect(this.x,this.y,this.width,this.height);
        ctx.drawImage(enemy1Img,this.frame*this.spriteWidth,0,this.spriteWidth,this.spriteHeight,
            this.x,this.y,this.width,this.height
        );
    }
}

enemiesArray=[];
for(let i=0;i<10;i++){
    enemiesArray.push(new Enemy());
}
const enemy1=new Enemy();
function animate(){
    console.log("sadfsd")
    ctx.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);

    // enemy1.x++;
    // enemy1.y++;
    // ctx.fillRect(enemy1.x,enemy1.y,enemy1.width,enemy1.height);
    // enemy1.update();
    // enemy1.draw();

    enemiesArray.forEach(enemey=>{
        enemey.update();
        enemey.draw();
    });
    requestAnimationFrame(animate)
}
animate();