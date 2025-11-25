import { StandingLeft,StandingRight } from "./state.js";
export default class Player{
    constructor(gamewidth,gameheight){
        this.gameheight=gameheight;
        this.gamewidth=gamewidth;
        this.states=[new StandingLeft(this),new StandingRight(this)];
        this.currentState=this.states[1];
        this.image=document.getElementById('dog');
        this.width=200;
        this.height=181.83;
        this.x=this.gamewidth/2-this.width/2;
        this.y=this.gameheight-this.height-10;

        this.frameX=0;
        this.frameY=0;
    }

    draw(context){
        context.drawImage(this.image,this.width*this.frameX,this.height*this.frameY,this.width,this.height,
            this.x,this.y,this.width,this.height);
    }
    setState(state){

        this.currentState=this.states[state];
        this.currentState.enter();
        console.log(this.currentState)
        // this.currentState
    }

    update(input){
        this.currentState.handleInput(input);
    }
}