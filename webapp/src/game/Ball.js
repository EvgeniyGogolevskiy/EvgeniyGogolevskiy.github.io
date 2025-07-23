export class Ball {
	constructor(colors) {
	  this.color = colors[Math.floor(Math.random() * colors.length)];
	  this.element = document.createElement('div');
	  this.element.classList.add('ball');
	  this.element.style.backgroundColor = this.color;
	  this.setRandomPosition();
  
	  this.element.addEventListener('click', () => this.pop());
	}
  
	setRandomPosition() {
	  const x = Math.random() * (window.innerWidth - 40);
	  const y = Math.random() * (window.innerHeight - 40);
	  this.element.style.left = `${x}px`;
	  this.element.style.top = `${y}px`;
	}
  
	pop() {
	  this.element.remove();
	  // здесь добавим логику проверки на запрещённый/бонусный цвет
	}
  
	remove() {
	  this.element.remove();
	}
  }
  