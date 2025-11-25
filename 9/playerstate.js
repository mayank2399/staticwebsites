import { Dust, Fire, Splash } from "./particles.js";

const states = {
  SITTING: 0,
  RUNNING: 1,
  JUMPING: 2,
  FALLING: 3,
  ROLLING: 4,
  DIVING: 5,
  HIT: 6,
};

class State {
  constructor(state, game) {
    this.state = state;
    this.game = game;
  }
}

export class Sitting extends State {
  constructor(game) {
    super("SITING", game);
  }

  entry() {
    this.game.player.frameX = 0;
    this.game.player.frameY = 5;
    this.game.player.maxFrame = 4;
  }

  handleInput(input) {
    if (input.includes("ArrowLeft") || input.includes("ArrowRight")) {
      this.game.player.setState(states.RUNNING, 1);
    } else if (input.includes("Enter")) {
      this.game.player.setState(states.ROLLING, 2);
    }
  }
}
export class Running extends State {
  constructor(game) {
    super("RUNNING", game);
  }

  entry() {
    this.game.player.frameX = 0;
    this.game.player.frameY = 3;
    this.game.player.maxFrame = 6;
  }

  handleInput(input) {
    this.game.particles.unshift(
      new Dust(
        this.game,
        this.game.player.x + this.game.player.width * 0.6,
        this.game.player.y + this.game.player.height
      )
    );
    if (input.includes("ArrowDown")) {
      this.game.player.setState(states.SITTING, 0);
    }

    if (input.includes("ArrowUp")) {
      this.game.player.setState(states.JUMPING, 1);
    } else if (input.includes("Enter")) {
      this.game.player.setState(states.ROLLING, 2);
    }
  }
}

export class Jumping extends State {
  constructor(game) {
    super("JUMPING", game);
    // this.game.player = game.player;
  }

  entry() {
    this.game.player.frameX = 0;
    if (this.game.player.onGround()) this.game.player.vy -= 20;
    this.game.player.frameY = 1;
    this.maxFrame = 6;
  }

  handleInput(input) {
    if (this.game.player.vy > this.game.player.weight) {
      this.game.player.setState(states.FALLING, 1);
    } else if (input.includes("Enter")) {
      this.game.player.setState(states.ROLLING, 2);
    } else if (input.includes("ArrowDown")) {
      this.game.player.setState(states.DIVING, 0);
    }
  }
}

export class Falling extends State {
  constructor(game) {
    super("FALLING", game);
    // this.game.player = game.player;
  }

  entry() {
    this.game.player.frameX = 0;
    this.game.player.frameY = 2;
    this.maxFrame = 6;
  }

  handleInput(input) {
    if (this.game.player.onGround()) {
      this.game.player.setState(states.RUNNING, 1);
    } else if (input.includes("ArrowDown")) {
      this.game.player.setState(states.DIVING, 0);
    }
  }
}

export class Rolling extends State {
  constructor(game) {
    super("ROLLING", game);
    // this.game.player = game.player;
  }

  entry() {
    this.game.player.frameX = 0;
    this.game.player.frameY = 6;
    this.maxFrame = 6;
  }

  handleInput(input) {
    this.game.particles.unshift(
      new Fire(
        this.game,
        this.game.player.x + this.game.player.width * 0.6,
        this.game.player.y + this.game.player.height
      )
    );

    if (!input.includes("Enter") && this.game.player.onGround()) {
      this.game.player.setState(states.RUNNING, 1);
    } else if (!input.includes("Enter") && !this.game.player.onGround()) {
      this.game.player.setState(states.DIVING, 1);
    } else if (
      input.includes("Enter") &&
      input.includes("ArrowUp") &&
      this.game.player.onGround()
    ) {
      this.game.player.vy -= 27;
    } else if (input.includes("ArrowDown")) {
      this.game.player.setState(states.DIVING, 0);
    }
  }
}

export class Diving extends State {
  constructor(game) {
    super("DIVING", game);
    // this.game.player = game.player;
  }

  entry() {
    this.game.player.frameX = 0;
    this.game.player.frameY = 6;
    this.maxFrame = 6;
  }

  handleInput(input) {
    this.game.particles.unshift(
      new Fire(
        this.game,
        this.game.player.x + this.game.player.width * 0.6,
        this.game.player.y + this.game.player.height
      )
    );

    if (this.game.player.onGround()) {
      this.game.player.setState(states.RUNNING, 1);
      for (let i = 0; i < 30; i++) {
        this.game.particles.unshift(
          new Splash(
            this.game,
            this.game.player.x + this.game.player.width * 0.5,
            this.game.player.y + this.game.player.height
          )
        );
      }
    }
  }
}

export class Hit extends State {
  constructor(game) {
    super("HIT", game);
  }

  entry() {
    this.game.player.frameX = 0;
    this.game.player.frameY = 4;
    this.maxFrame = 10;
  }

  handleInput(input) {
    // this.game.player.frameX++;
    console.log(this.game.player.frameX);
    if (this.game.player.frameX >= 6 && this.game.player.onGround()) {
      this.game.player.setState(states.RUNNING, 1);
    } else if (this.game.player.frameX >= 6 && !this.game.player.onGround()) {
      this.game.player.setState(states.ROLLING, 1);
    }
  }
}
