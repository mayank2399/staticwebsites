window.addEventListener("DOMContentLoaded", function () {
  const canvas = this.document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = 800;
  canvas.height = 600;

  let score = 0;
  let gameOver = false;
  
  let enemies = [];
  //   enemies.push(new Enemy(canvas.width,canvas.height));

  let enemnyInterval = 1000000;
  let enemyTimer = 0;
  let lastTime = 0;

  function toggleFullScreen() {
    const elem = canvas;
    alert("pre");
    console.log(elem);
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      alert(elem.requestFullscreen);
      alert(elem.webkitRequestFullscreen);


      console.log(elem)
      if (elem.requestFullscreen) {
        alert("1");

        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        alert("2");
        elem.webkitRequestFullscreen(); // iOS Safari
      }
    } else {
      alert(3);
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  fullscreenButton.addEventListener("click", toggleFullScreen);

  class InputHandler {
    constructor() {
      this.keys = [];
      this.touchY = "";
      this.touchThreshold = 30;
      window.addEventListener("keydown", (e) => {
        if (
          (e.key === "ArrowUp" ||
            e.key === "ArrowDown" ||
            e.key === "ArrowLeft" ||
            e.key === "ArrowRight") &&
          this.keys.indexOf(e.key) === -1
        ) {
          this.keys.push(e.key);
        } else if (gameOver) {
          restartGame();
        }
      });

      window.addEventListener("keyup", (e) => {
        if (
          e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight"
        ) {
          this.keys.splice(this.keys.indexOf(e.key), 1);
        }
      });

      window.addEventListener("touchstart", (e) => {
        this.touchY = e.changedTouches[0].pageY;
      });

      window.addEventListener("touchmove", (e) => {
        const swipeDistance = e.changedTouches[0].pageY - this.touchY;
        if (
          swipeDistance < -this.touchThreshold &&
          this.keys.indexOf("swipe up") === -1
        ) {
          this.keys.push("swipe up");
        }
        if (
          swipeDistance > this.touchThreshold &&
          this.keys.indexOf("swipe down") === -1
        ) {
          this.keys.push("swipe down");
          console.log(gameOver);
          if (gameOver) restartGame();
        }
      });

      window.addEventListener("touchend", (e) => {
        console.log(this.keys);
        this.keys.splice(this.keys.indexOf("swipe up"), 1);
        this.keys.splice(this.keys.indexOf("swipe down"), 1);
      });
    }
  }

  class Player {
    constructor(gameWidth, gameHeight) {
      this.gameHeight = gameHeight;
      this.gameWidth = gameWidth;
      this.width = 200;
      this.height = 200;
      this.x = 100;
      this.y = this.gameHeight - this.height;
      this.image = document.getElementById("player");

      this.speed = 0;
      this.frameX = 0;
      this.framey = 0;

      this.vy = 0;
      this.weight = 1;

      this.maxFrame = 8;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
    }

    restart() {
      this.x = 100;
      this.y = this.gameHeight - this.height;
      this.maxFrame = 8;
      this.framey = 0;
    }
    draw(context) {
      context.strokeStyle = "white";

      context.beginPath();
      context.arc(
        this.x + this.width / 2,
        this.y + this.height / 2+20,
        this.width / 3,
        0,
        Math.PI * 2
      );
      context.stroke();
      context.fillStyle = "pink";
      // context.fillRect(this.x, this.y, this.width, this.height);
      context.drawImage(
        this.image,
        this.width * this.frameX,
        this.height * this.framey,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    update(input, deltaTime, enemies) {
      enemies.forEach((enemy) => {
        const dx =(enemy.x + enemy.width / 2 -20)- (this.x + this.width / 2);
        const dy = enemy.y + enemy.height / 2 - (this.y + this.height / 2+20);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.width / 3 + enemy.width / 3) gameOver = true;
      });
      if (this.frameTimer > this.frameInterval) {
        if (this.frameX >= this.maxFrame) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else {
        this.frameTimer += deltaTime;
      }

      this.x += this.speed;
      if (input.keys.indexOf("ArrowRight") > -1) {
        this.speed = 2;
      } else if (input.keys.indexOf("ArrowLeft") > -1) {
        this.speed = -2;
      } else if (
        (input.keys.indexOf("ArrowUp") > -1 ||
          input.keys.indexOf("swipe up") > -1) &&
        this.onGround()
      ) {
        this.vy -= 32;
      } else {
        this.speed = 0;
      }

      // horizontal movement
      if (this.x < 0) this.x = 0;
      if (this.x > this.gameWidth - this.width)
        this.x = this.gameWidth - this.width;

      // Vertical movement
      this.y += this.vy;

      if (!this.onGround()) {
        this.vy += this.weight;
        this.framey = 1;
        this.maxFrame = 5;
      } else {
        this.vy = 0;
        this.maxFrame = 8;
        this.framey = 0;
      }

      if (this.y < 0) this.y = 0;
      if (this.y > this.gameHeight - this.height)
        this.y = this.gameHeight - this.height;
    }

    onGround() {
      return this.y >= this.gameHeight - this.height;
    }
  }

  class Background {
    constructor(gameWidth, gameHeight) {
      this.gameHeight = gameHeight;
      this.gameWidth = gameWidth;
      this.image = document.getElementById("bg");
      this.x = 0;
      this.y = 0;

      this.width = 2400;
      this.height = 720;
      this.speed = 2;
    }

    draw(context) {
      context.drawImage(this.image, this.x, this.y, this.width, this.height);
      context.drawImage(
        this.image,
        this.x + this.width - this.speed,
        this.y,
        this.width,
        this.height
      );
    }

    update() {
      this.x -= this.speed;
      if (this.x < 0 - this.width) this.x = 0;
    }

    restart() {
      this.x = 0;
    }
  }

  class Enemy {
    constructor(gameWidth, gameHeight) {
      this.gameHeight = gameHeight;
      this.gameWidth = gameWidth;
      this.width = 160;
      this.height = 119;
      this.image = document.getElementById("enemy");
      this.x = this.gameWidth;
      this.y = this.gameHeight - 100;

      this.speed = 8;
      this.frameX = 0;

      this.maxFrame = 5;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
      this.speed = 8;
      this.markForDeletion = 0;
    }

    draw(context) {
      context.strokeStyle = "white";

      context.beginPath();
      context.arc(
        this.x + this.width / 2-20,
        this.y + this.height / 2,
        this.width / 3,
        0,
        Math.PI * 2
      );
      context.stroke();
      context.drawImage(
        this.image,
        this.frameX * this.width,
        0,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    update(deltaTime) {
      if (this.frameTimer > this.frameInterval) {
        if (this.frameX >= this.maxFrame) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else {
        this.frameTimer += deltaTime;
      }

      this.x -= this.speed;

      if (this.x < 0 - this.width) {
        this.markForDeletion = 1;
        score++;
      }
    }
  }


  function handleEnemies(deltaTime) {
    if (enemyTimer >= enemnyInterval) {
      enemies.push(new Enemy(canvas.width, canvas.height));
      enemyTimer = 0;
    } else {
      enemyTimer += deltaTime;
    }
    enemies.forEach((enemy) => {
      enemy.update(deltaTime);
      enemy.draw(ctx);
    });

    enemies = enemies.filter((enemy) => !enemy.markForDeletion);
  }

  function displayStatusText(context) {
    context.textAlign = "left";
    context.fillStyle = "black";
    context.font = "40px Helvetica";
    context.fillText("score : " + score, 20, 50);

    context.fillStyle = "white";
    context.fillText("score : " + score, 22, 52);

    if (gameOver) {
      context.font = "20px Helvetica";

      context.textAlign = "center";
      context.fillStyle = "black";
      context.fillText(
        "GAME OVER ! Press Enter or swipe down to restart.",
        canvas.width / 2,
        200
      );

      context.fillStyle = "white";
      context.fillText(
        "GAME OVER ! Press Enter or swipe down to restart.",
        canvas.width / 2 + 2,
        202
      );
    }
  }

  const input = new InputHandler();
  const player = new Player(canvas.width, canvas.height);
  const background = new Background(canvas.width, canvas.height);

  function restartGame() {
    player.restart();
    background.restart();
    enemies = [];
    score = 0;
    gameOver = false;
    enemyTimer=0;
    lastTime=0
    animate(0);
    
  }

  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = deltaTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.update();
    background.draw(ctx);

    player.update(input, deltaTime, enemies);
    player.draw(ctx);
    handleEnemies(deltaTime);
    displayStatusText(ctx);
    if (!gameOver) requestAnimationFrame(animate);
  }

  animate(0);
});
