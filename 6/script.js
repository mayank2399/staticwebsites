const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 800;

class Game {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.enemies = [];
    this.#addNewEnemy();
    console.log(this.enemies);
    this.enemyInterval = 1000;
    // this.lastTime=0;
    this.enemyTimer = 0;
    // this.score=0;
    // this.fontSize=25;
    // this.fontFamily='Helvetica';
    // this.gameOver=false;
    // this.lives=5;
    // this.gameTime=0;
    // this.timeLimit=30000;
    // this.speed=1;
  }

  update(deltaTime) {
    if (this.enemyTimer > this.enemyInterval) {
      this.#addNewEnemy();
      this.enemyTimer = 0;
    } else {
      this.enemyTimer += deltaTime;
    }

    this.enemies = this.enemies.filter((object) => !object.makedForDeletion);
    if (this.enemies.length === 0) this.#addNewEnemy();
    this.enemies.forEach((object) => object.update(deltaTime));
  }
  draw(context) {
    this.enemies.forEach((object) => object.draw(context));
    this.enemies.sort((a, b) => a.y - b.y);
  }

  #addNewEnemy() {
    this.enemies.push(new Worm(this));
      this.enemies.push(new Ghost(this));
  }
}

class Enemy {
  constructor(game) {
    this.game = game;
    this.x = game.width;
    this.y = Math.random() * this.game.height - 50;
    this.makedForDeletion = false;

  }

  update(deltaTime) {
    // console.log(this.x);
    this.x -= this.speed*deltaTime;
    if (this.x < 0 - this.width) this.makedForDeletion = true;
  }
  draw(ctx) {
    // console.log(this.x);
    ctx.fillStyle = "black";
    // ctx.fillRect(this.x,this.y,this.width,this.height);
    // ctx.fillRect(this.x,this.y,50,50);
    ctx.drawImage(
      this.image,
       0,0,
        this.spriteWidth ,
        this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

class Worm extends Enemy {
  constructor(game) {
    super(game);
    this.image= new Image();
    this.image.src="enemy_worm.png";
    this.spriteWidth=229;
    this.spriteHeight=171;
    this.width = this.spriteWidth/2;
    this.height = this.spriteHeight/2 ;
    this.speed = Math.random() * 0.1 + 0.1;
  }
}
class Ghost extends Enemy {
  constructor(game) {
    super(game);
    this.image= new Image();
    this.image.src="enemy_ghost.png";
    this.spriteWidth=229;
    this.spriteHeight=171;
    this.width = this.spriteWidth/2;
    this.height = this.spriteHeight/2 ;
    this.speed = Math.random() * 0.1 + 0.1;
  }

    draw(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    super.draw(ctx);
    ctx.restore();
    }
}

let lastTime = 1;
let game = new Game(ctx, canvas.width, canvas.height);
function animate(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  game.update(deltaTime);
  game.draw(ctx);
  requestAnimationFrame(animate);
}
animate(0);
