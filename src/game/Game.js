import { Ball } from './Ball.js';
import { Timer } from './Timer.js';
import { ScoreManager } from './ScoreManager.js';

export class Game {
  constructor() {
    this.field = document.getElementById('game-field');
    this.timer = new Timer(60, this.endGame.bind(this));
    this.scoreManager = new ScoreManager();
    this.colors = ['red', 'blue', 'green', 'yellow', 'white', 'purple'];
  }

  start() {
    this.timer.start();
    this.spawnInterval = setInterval(() => this.spawnBall(), 500);
    this.colorChangeInterval = setInterval(() => this.updateSpecialColors(), 5000);
  }

  spawnBall() {
    const ball = new Ball(this.colors);
    this.field.appendChild(ball.element);
    setTimeout(() => ball.remove(), 1000);
  }

  updateSpecialColors() {
    // логика смены запрещённого и бонусного цвета
  }

  endGame() {
    clearInterval(this.spawnInterval);
    clearInterval(this.colorChangeInterval);
    alert(`Игра окончена. Очки: ${this.scoreManager.score}`);
    location.reload();
  }
}
