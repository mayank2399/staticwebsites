import Player from "./player.js";
import InputHandler from "./inputHandler.js";
import { Background } from "./background.js";
import { FlyEnemny, GroundEnemny, ClimbingEnemny } from "./enemy.js";
import { UI } from "./UI.js";
window.addEventListener("load", function () {
  const canvas = this.document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = this.window.innerWidth;
  canvas.height = 500;

  class Game {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.groundMargin = 80;
      this.player = new Player(this);
      this.input = new InputHandler(this);
      this.background = new Background(this);
      this.speed = 0;
      this.maxSpeed = 6;
      this.enemies = [];
      this.enemyTimer = 0;
      this.enemyInterval = 1000;
      this.debug = false;
      this.score = 0;
      this.fontColor = "black";
      this.ui = new UI(this);
      this.particles = [];
      this.player.currentState = this.player.state[0];
      this.player.currentState.entry();
      this.collision = [];
      this.timer=0;
      this.maxTime=2000;
      this.gameOver=false;
    }

    update(deltaTime) {
      this.timer+=deltaTime;
      if(this.timer>this.maxTime)
        this.gameOver=true;

      this.background.update();
      this.player.update(this.input.keys, deltaTime);

      if (this.enemyTimer > this.enemyInterval) {
        this.enemyTimer = 0;
        this.addEnemy();
      } else {
        this.enemyTimer += deltaTime;
      }
      this.enemies.forEach((enemy) => {
        enemy.update(deltaTime);
        if (enemy.markForDeletion)
          this.enemies.splice(this.enemies.indexOf(enemy), 1);
      });

      this.particles.forEach((particle, index) => {
        particle.update(ctx);
        if (particle.markForDeletion) this.particles.splice(index, 1);
      });

      if (this.particles.length > 50) {
        this.particles = this.particles.slice(0, 50);
      }

      this.collision.forEach((collisionObj, index) => {
        collisionObj.update(deltaTime);
        if (collisionObj.markForDeletion)
          this.collision.splice(this.collision.indexOf(collisionObj), 1);
      });
    }

    draw(context) {
      this.background.draw(context);
      this.player.draw(context);
      this.enemies.forEach((enemy) => {
        enemy.draw(context);
      });
      this.ui.draw(context);

      this.particles.forEach((particle, index) => {
        particle.draw(ctx);
      });

      this.collision.forEach((collisionObj, index) => {
        collisionObj.draw(ctx);
      });
    }

    addEnemy() {
      if (this.speed > 0 && Math.random() < 0.5)
        this.enemies.push(new GroundEnemny(this));
      else if (this.speed > 0) this.enemies.push(new ClimbingEnemny(this));

      this.enemies.push(new FlyEnemny(this));
      console.log(this.enemies);
    }
  }

  const game = new Game(canvas.width, canvas.height);

  let lastTime = 0;

  function animate(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.draw(ctx);
    game.update(deltaTime);
    requestAnimationFrame(animate);
  }

  animate(0);
});
