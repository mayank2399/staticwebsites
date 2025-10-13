const canvas=document.getElementById("canvas1");
const ctx=canvas.getContext('2d');

const CANVAS_WIDTH=canvas.width=500;
const CANVAS_HEIGHT=canvas.height=650;

let canvaPosition=canvas.getBoundingClientRect();

class Explosion{
    constructor(x,y){
        this.x=x;
        this.y=y;
        this.spreadwidth=200;
        this.spreadHeight=179;
        this.width=this.spreadwidth/2;
        this.height=this.spreadHeight/2;
        this.image=new Image();
        this.image.src='boom.png';
        this.frame=0;
        this.timer=0;
        this.sound= new Audio();
        this.sound.src='bomb.wav'
    }
    
    update(){
        if(this.frame===0) this.sound.play();
        this.timer++;
        if(this.timer%5==0){

        this.frame++;
        }
    }
    draw(){
        ctx.drawImage(this.image,this.spreadwidth*this.frame,0,this.spreadwidth,
            this.spreadHeight,this.x,this.y,this.width,this.height);
        
    }
}

let exploisions=[]
window.addEventListener('click',function(e){

    // ctx.fillRect(e.x-canvaPosition.left-25,e.y-canvaPosition.top-25,50,50);
    exploisions.push(new Explosion(e.x-canvaPosition.left-25,e.y-canvaPosition.top-25))
});


function animate(){
        ctx.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);

    for(let i=0;i<exploisions.length;i++){
        exploisions[i].update();
        exploisions[i].draw();
    }
    requestAnimationFrame(animate)
}

animate();


