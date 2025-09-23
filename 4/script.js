const canvas=document.getElementById("canvas1");
const ctx=canvas.getContext();

const CANVAS_WIDTH=canvas.width=500;
const CANVAS_HEIGHT=canvas.height=y00;

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

    }
    update(){
        this.frame++;
    }
    draw(){
        ctx.drawImage(this.image,this.spreadwidth*this.frame,0,this.spreadwidth,
            this.spreadHeight,this.x,this.y,this.width,this.height);
        
    }
}

