import {CollisionAnimation} from  './collisionAnimation.js';
import { Sitting, Running, Jumping, Falling,Rolling,Diving,Hit } from "./playerstate.js";
export default class Player {
  constructor(game) {
    this.game = game;
    this.width = 100;
    this.height = 91.3;
    this.x = 10;
    this.y = this.game.gameHeight - this.height- this.game.groundMargin;
    this.image = document.getElementById("player");
    this.maxSpeed = 10;
    this.speed = 0;
    this.weight = 1;
    this.vy = 0;
    this.frameY = 0;

    this.state = [
      new Sitting(this.game),
      new Running(this.game),
      new Jumping(this.game),
      new Falling(this.game),
      new Rolling(this.game),
      new Diving(this.game),
      new Hit(this.game)
    ];
        this.maxFrame = 5;


    this.frameX = 0;

    this.fps = 20;
    this.frameInterval = 1000 / this.fps;
    this.frameTimer = 0;
  }

  update(input, deltaTime) {
    this.checkCollision();
    this.currentState.handleInput(input);
    this.x += this.speed;
    if (input.includes("ArrowRight")) this.speed = this.maxSpeed;
    else if (input.includes("ArrowLeft")) this.speed = -this.maxSpeed;
    else this.speed = 0;

    if (this.x < 0) this.x = 0;
    if (this.x > this.game.gameWidth - this.width)
      this.x = this.game.gameWidth - this.width;

    // if (input.includes("ArrowUp") && this.onGround()) this.vy -= 20;
    this.y += this.vy;
    if (!this.onGround()) this.vy += this.weight;
    else this.vy = 0;
    // if(this.y>(this.game.gameHeight-this.height)){
    //     this.y=this.game.gameHeight-this.height;
    // }
    if (this.frameTimer > this.frameInterval) {
      this.frameTimer = 0;
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = 0;
    } else {
      this.frameTimer += deltaTime;
    }
  }

  draw(context) {
    if(this.game.debug)
       context.strokeRect(this.x,this.y,this.width,this.height);
    context.drawImage(
      this.image,
      this.frameX * this.width,
      this.frameY * this.height,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }

  onGround() {
    return this.y >= this.game.gameHeight - this.height-this.game.groundMargin;
  }

  setState(state,speed) {
    this.currentState = this.state[state];
    console.log(state)
    this.currentState.entry();
    this.game.speed=this.game.maxSpeed* speed;
  }


  checkCollision(){
    this.game.enemies.forEach(enemy => {
        if(
          enemy.x<this.x+this.width&&
          enemy.x + enemy.width > this.x &&
          enemy.y <this.y +this.height &&
          enemy.y+enemy.height>this.y

        ){
          enemy.markForDeletion=true;
          this.game.collision.push(new CollisionAnimation(this.game,enemy.x+enemy.width*0.5,
            enemy.height*0.5+enemy.y
          ))
          if(this.currentState===this.state[4]||this.currentState===this.state[5]){
          this.game.score++;
          }else{
            this.setState(6,0);
          }
        }
    });
  }
}
