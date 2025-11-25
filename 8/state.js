export const states={
    STANDING_LEFT: 0,
    STANDING_RIGHT: 1,
}

class State{
    constructor(state){
        this.state=state;
    }
}

export class StandingLeft extends State{

    constructor(player){
        super('STANDING LEFT');
        this.player=player;
    }

    enter(){
        this.player.frameY=0;
    }

    handleInput(input){
        console.log(input);
        if(input==='PRESS RIGHT') this.player.setState(states.STANDING_RIGHT);
    }
}


export class StandingRight extends State{

    constructor(player){
        super('STANDING RIGHT');
        this.player=player;
    }

    enter(){
        this.player.frameY=1;
    }

    handleInput(input){
        if(input==='PRESS LEFT') this.player.setState(states.STANDING_LEFT);
    }
}