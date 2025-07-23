export class Timer {
	constructor(seconds, onEnd) {
	  this.time = seconds;
	  this.onEnd = onEnd;
	  this.display = document.getElementById('timer');
	}
  
	start() {
	  this.display.textContent = this.time;
	  this.interval = setInterval(() => {
		this.time--;
		this.display.textContent = this.time;
		if (this.time <= 0) {
		  clearInterval(this.interval);
		  this.onEnd();
		}
	  }, 1000);
	}
  
	addSecond() {
	  this.time++;
	  this.display.textContent = this.time;
	}
  }
  