class Enemy{
    constructor(){
        this.frameX=0;
        this.frameY=0;
        this.fps=20;
        this.frameInterval=1000/this.fps;
        this.frameTimer=0;
        this.markForDeletion=false;
        
    }

    update(deltaTime){
        this.x-=this.speedX+ this.game.speed;
        this.y+=this.speedY;
        if(this.frameTimer>this.frameInterval){
            this.frameTimer=0;
            if(this.frameX<this.maxFrame) this.frameX++;
            else this.frameX=0;

        }else{
            this.frameTimer+=deltaTime;
        }

        if(this.x<0-this.width) this.markForDeletion=true;
    }

    draw(context){
            if(this.game.debug)
       context.strokeRect(this.x,this.y,this.width,this.height);
        context.drawImage(this.image,this.frameX*this.width,0,this.width,this.height,
            this.x,this.y,this.width,this.height
        )
    }
}


export class FlyEnemny extends Enemy{
    constructor(game){
        super();
        this.game=game;
        this.width=60;
        this.height=44;
        this.x=this.game.gameWidth;
        this.y=Math.random() * this.game.gameHeight*0.5;
        this.speedX=Math.random() * 2;
        this.speedY=0;
        this.image=document.getElementById('enemy_fly');
        this.maxFrame=5;
        this.angle=0;
        this.va=Math.random()*0.1+0.1;
    }

    update(deltaTime){
        super.update(deltaTime);
        this.angle+=this.va;
        this.y+=Math.sin(this.angle);
    }
}

export class GroundEnemny extends Enemy{

    constructor(game){
        super();
        this.game=game;
        this.width=60;
        this.height=87;
        this.x=this.game.gameWidth;
        this.y=this.game.gameHeight-this.height-this.game.groundMargin;
        this.image=document.getElementById("enemy_plant");
        this.speedX=0;
        this.speedY=0;
        this.maxFrame=1;
   }

}

export class ClimbingEnemny extends Enemy{
    constructor(game){
        super();
        this.game=game;
        this.width=120;
        this.height= 144;
        this.x=this.game.gameWidth;
        this.y=Math.random() *this.game.gameHeight*0.5;
        this.image=document.getElementById("enemy_spider_big");
        this.speedX=0;
        this.speedY= Math.random() >0.5 ?1 :-1;
        this.maxFrame=5;
        
    }

    update(deltaTime){
        super.update(deltaTime);
        if(this.y>this.game.gameHeight-this.height-this.game.groundMargin) this.speedY*=-1;
        if(this.y<-this.height) this.markForDeletion=true;
    }

    draw(context){
        super.draw(context);
        context.beginPath();
        context.moveTo(this.x+this.width/2,0);
        context.lineTo(this.x+this.width/2,this.y+50);
        context.stroke();
    }
}