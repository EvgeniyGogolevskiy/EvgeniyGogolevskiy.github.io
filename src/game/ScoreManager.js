export class ScoreManager {
	constructor() {
	  this.score = 0;
	  this.display = document.getElementById('score');
	}
  
	add(points = 1) {
	  this.score += points;
	  this.display.textContent = this.score;
	}
  }
  