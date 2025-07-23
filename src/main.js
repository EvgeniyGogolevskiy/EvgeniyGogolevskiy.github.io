import { Game } from './game/Game.js';

const game = new Game();

document.getElementById('play-button').addEventListener('click', () => {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  game.start();
});
