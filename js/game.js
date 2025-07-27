window.addEventListener("DOMContentLoaded", () => {
    const tg = window.Telegram.WebApp;
    tg.ready();

    const user = tg.initDataUnsafe?.user;
    if (user) {
        alert(`Привет, ${user.first_name}!`);
		resetGame();
    } else {
        alert("WebApp API не работает. Запусти через Telegram.");
    }
	
	fetchLeaderboard();

	// Конфигурация игры
	const GAME_DURATION = 60;
	const BALL_SIZE_MIN = 40;
	const BALL_SIZE_MAX = 60;
	
	// Все доступные цвета
	const allColors = [
		"#FF0000", // Красный
		"#0000FF", // Синий
		"#00FF00", // Зелёный
		"#FFFF00", // Жёлтый
		"#FFFFFF", // Белый
		"#800080"  // Фиолетовый
	];

	// Переменные игры
	let score = 0;
	let timeLeft = GAME_DURATION;
	let highScore = localStorage.getItem("highScore") || 0;
	let attemptsLeft = localStorage.getItem("attemptsLeft") || 3;
	let currentDangerColor = "#FF0000"; // Начинаем с красного
	let currentBonusColor = "#00FF00";  // Начинаем с зелёного
	let isGameRunning = false;
	let gameInterval, timerInterval, colorChangeInterval;

	// Элементы DOM
	const gameArea = document.getElementById("game");
	const scoreDisplay = document.getElementById("score");
	const timerDisplay = document.getElementById("timer");
	const highScoreDisplay = document.getElementById("highScore");
	const attemptsLeftDisplay = document.getElementById("attemptsLeft");
	const dangerColorDisplay = document.querySelector("#dangerColor span");
	const bonusColorDisplay = document.querySelector("#bonusColor span");
	const helpDangerColor = document.getElementById("helpDangerColor");
	const helpBonusColor = document.getElementById("helpBonusColor");

	// Инициализация
	//highScoreDisplay.textContent = highScore;
	//attemptsLeftDisplay.textContent = attemptsLeft;
	dangerColorDisplay.textContent = "Красный";
	dangerColorDisplay.style.color = currentDangerColor;
	bonusColorDisplay.textContent = "Зелёный";
	bonusColorDisplay.style.color = currentBonusColor;
	helpDangerColor.style.color = currentDangerColor;
	helpBonusColor.style.color = currentBonusColor;

	// Запуск игры
	document.getElementById("startBtn").addEventListener("click", async () => {
		const ok = await checkAndUseAttempt();
		if (!ok) return;
		startGame();
	});
	document.getElementById("helpBtn").addEventListener("click", showHelp);
	document.getElementById("closeHelp").addEventListener("click", hideHelp);
	document.getElementById("closeGameOver").addEventListener("click", hideGameOver);
	document.getElementById("ratingBtn").addEventListener("click", () => {
		document.getElementById("ratingModal").style.display = "block";
		fetchLeaderboard(); // подгружаем данные
	});
	document.getElementById("closeRating").addEventListener("click", () => {
		document.getElementById("ratingModal").style.display = "none";
	});
	document.addEventListener("DOMContentLoaded", () => {
		updateAttemptsLeft();
	});

	async function checkAndUseAttempt() {
		const userId = window.Telegram.WebApp.initDataUnsafe?.user?.id;
		if (!userId) {
			alert("Ошибка: пользователь Telegram не найден.");
			return false;
		}
	
		const response = await fetch("http://localhost:3000/attempts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId })
		});
	
		const result = await response.json();
		if (!result.success) {
			alert("❌ У вас закончились бесплатные попытки на сегодня!");
			return false;
		}
	
		return true;
	}

	async function updateAttemptsLeft() {
		const userId = window.Telegram.WebApp.initDataUnsafe?.user?.id;
		const response = await fetch(`http://localhost:3000/attempts-left?userId=${userId}`);
		const result = await response.json();
		document.getElementById("attemptsLeft").textContent =
			`Попытки на сегодня: ${result.attemptsLeft}`;
	}

	function startGame() {
		if (isGameRunning) return;
		
		resetGame();
		isGameRunning = true;
		document.getElementById("startBtn").disabled = true;
		
		// Таймер
		timerInterval = setInterval(() => {
			timeLeft--;
			timerDisplay.textContent = `Время: ${timeLeft}`;
			
			if (timeLeft <= 0) endGame();
		}, 1000);
		
		// Генерация шаров
		gameInterval = setInterval(createBall, 400);
		
		// Смена цветов каждые 5-15 сек
		colorChangeInterval = setInterval(changeColors, randomInt(5000, 15000));
	}

	function createBall() {
		if (!isGameRunning) return;
		
		const ball = document.createElement("div");
		ball.className = "ball";
		
		const size = randomInt(BALL_SIZE_MIN, BALL_SIZE_MAX);
		const x = randomInt(0, gameArea.offsetWidth - size);
		const y = randomInt(0, gameArea.offsetHeight - size);
		
		// Определяем тип шара (20% - запрещённый, 15% - бонусный, 65% - обычный)
		const ballType = Math.random();
		let ballColor, isDanger = false, isBonus = false;
		
		if (ballType < 0.2) {
			// Запрещённый шар
			ballColor = currentDangerColor;
			isDanger = true;
		} else if (ballType < 0.35) {
			// Бонусный шар
			ballColor = currentBonusColor;
			isBonus = true;
		} else {
			// Обычный шар (любой цвет, кроме запрещённого и бонусного)
			const availableColors = allColors.filter(color => 
				color !== currentDangerColor && color !== currentBonusColor
			);
			ballColor = availableColors[randomInt(0, availableColors.length - 1)];
		}
		
		ball.style.width = `${size}px`;
		ball.style.height = `${size}px`;
		ball.style.left = `${x}px`;
		ball.style.top = `${y}px`;
		ball.style.background = ballColor;
		
		if (isDanger) {
			ball.classList.add("danger");
			ball.dataset.danger = "true";
		} else if (isBonus) {
			ball.classList.add("bonus");
			ball.dataset.bonus = "true";
		}
		
		ball.addEventListener("click", handleBallClick);
		gameArea.appendChild(ball);
		
		setTimeout(() => {
			if (ball.parentNode) ball.remove();
		}, 1000);
	}

	function changeColors() {
		// Выбираем новый запрещённый цвет (не совпадающий с бонусным)
		let newDangerColor;
		do {
			newDangerColor = allColors[randomInt(0, allColors.length - 1)];
		} while (newDangerColor === currentBonusColor);
		
		// Выбираем новый бонусный цвет (не совпадающий с запрещённым)
		let newBonusColor;
		do {
			newBonusColor = allColors[randomInt(0, allColors.length - 1)];
		} while (newBonusColor === newDangerColor);
		
		// Обновляем цвета
		currentDangerColor = newDangerColor;
		currentBonusColor = newBonusColor;
		
		// Обновляем отображение
		dangerColorDisplay.textContent = getColorName(currentDangerColor);
		dangerColorDisplay.style.color = currentDangerColor;
		bonusColorDisplay.textContent = getColorName(currentBonusColor);
		bonusColorDisplay.style.color = currentBonusColor;
		helpDangerColor.style.color = currentDangerColor;
		helpBonusColor.style.color = currentBonusColor;
		
		// Анимация смены запрещённого цвета
		flashBackground(currentDangerColor);
	}

	function getColorName(color) {
		const names = {
			"#FF0000": "Красный",
			"#0000FF": "Синий",
			"#00FF00": "Зелёный",
			"#FFFF00": "Жёлтый",
			"#FFFFFF": "Белый",
			"#800080": "Фиолетовый"
		};
		return names[color] || color;
	}

	function handleBallClick(e) {
		const ball = e.target;
		
		if (ball.dataset.danger === "true") {
			createPopEffect(ball, true);
			endGame();
		} else if (ball.dataset.bonus === "true") {
			createPopEffect(ball, false);
			timeLeft++;
			timerDisplay.textContent = `Время: ${timeLeft}`;
			score++;
			scoreDisplay.textContent = `Очки: ${score}`;
			
			// Анимация добавления времени
			timerDisplay.style.color = "#00FF00";
			setTimeout(() => timerDisplay.style.color = "white", 300);
		} else {
			createPopEffect(ball, false);
			score++;
			scoreDisplay.textContent = `Очки: ${score}`;
		}
		
		ball.remove();
	}

	function createPopEffect(ball, isDanger) {
		// 1. Получаем позицию относительно gameArea
		const ballRect = ball.getBoundingClientRect();
		const gameRect = gameArea.getBoundingClientRect();
		const x = ballRect.left - gameRect.left;
		const y = ballRect.top - gameRect.top;

		// 2. Основной эффект лопания
		const popEffect = document.createElement("div");
		popEffect.className = "ball-pop-animation";
		popEffect.style.left = `${x}px`;
		popEffect.style.top = `${y}px`;
		popEffect.style.width = `${ball.offsetWidth}px`;
		popEffect.style.height = `${ball.offsetHeight}px`;
		popEffect.style.background = ball.style.background;
		gameArea.appendChild(popEffect);

		// 3. Создаём 8 осколков
		for (let i = 0; i < 8; i++) {
			const angle = (i / 4) * Math.PI; // Равномерное распределение
			const fragment = document.createElement("div");
			fragment.className = "ball-fragment";
			
			// Позиция в центре шара
			fragment.style.left = `${x + ball.offsetWidth/2}px`;
			fragment.style.top = `${y + ball.offsetHeight/2}px`;
			
			// Случайный размер и движение
			const size = randomInt(5, ball.offsetWidth/4);
			fragment.style.width = `${size}px`;
			fragment.style.height = `${size}px`;
			fragment.style.background = isDanger ? "#ff0000" : "#ffffff";
			fragment.style.setProperty('--tx', Math.cos(angle) * 2);
			fragment.style.setProperty('--ty', Math.sin(angle) * 2);
			
			gameArea.appendChild(fragment);
			setTimeout(() => fragment.remove(), 500);
		}

		// 4. Удаляем эффекты через время
		setTimeout(() => popEffect.remove(), 300);
	}

	function flashBackground(color) {
		gameArea.style.setProperty('--flash-color', color);
		gameArea.classList.add('flash-effect');
		
		setTimeout(() => {
			gameArea.classList.remove('flash-effect');
		}, 500);
	}

	function endGame() {
		isGameRunning = false;
		clearInterval(gameInterval);
		clearInterval(timerInterval);
		clearInterval(colorChangeInterval);
		document.getElementById("startBtn").disabled = false;
	
		// Показываем результат
		document.getElementById("finalScore").textContent = `Ваш счёт: ${score}`;
		document.getElementById("gameOverModal").style.display = "block";
	
		// Обновляем рекорд
		if (score > highScore) {
			highScore = score;
			localStorage.setItem("highScore", highScore);
			highScoreDisplay.textContent = `Лучший счёт: ${highScore}`;
		}
		updateAttemptsLeft();
	
		// === Отправка результата на сервер (если есть Telegram WebApp) ===
		if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe?.user) {
			const user = Telegram.WebApp.initDataUnsafe.user;
	
			const payload = {
				telegramId: user.id,
				name: user.first_name || "Игрок",
				score: score
			};
	
			fetch("http://localhost:3000/submit-score", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(payload)
			})
			.then(res => res.json())
			.then(data => {
				console.log("✔ Очки отправлены:", data);
	
				// Обновляем таблицу лидеров после успешной отправки
				fetchLeaderboard();
			})
			.catch(err => {
				console.error("❌ Ошибка при отправке очков:", err);
			});
		} else {
			console.warn("⚠️ Telegram WebApp API недоступен, очки не отправлены");
		}
	}

	function resetGame() {
		gameArea.innerHTML = "";
		score = 0;
		timeLeft = GAME_DURATION;
		scoreDisplay.textContent = `Очки: ${score}`;
		timerDisplay.textContent = `Время: ${timeLeft}`;
		currentDangerColor = "#FF0000";
		currentBonusColor = "#00FF00";
		dangerColorDisplay.textContent = "Красный";
		dangerColorDisplay.style.color = currentDangerColor;
		bonusColorDisplay.textContent = "Зелёный";
		bonusColorDisplay.style.color = currentBonusColor;
		helpDangerColor.style.color = currentDangerColor;
		helpBonusColor.style.color = currentBonusColor;
	}

	function showHelp() {
		document.getElementById("helpModal").style.display = "block";
	}

	function hideHelp() {
		document.getElementById("helpModal").style.display = "none";
	}

	function hideGameOver() {
		document.getElementById("gameOverModal").style.display = "none";
	}

	function randomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
});

function fetchLeaderboard() {
	fetch("http://localhost:3000/leaderboard")
		.then(response => response.json())
		.then(data => {
			const leaderboardList = document.getElementById("leaderboardList");
			leaderboardList.innerHTML = "";

			data.forEach(entry => {
				const li = document.createElement("li");
				li.textContent = `${entry.name}: ${entry.score}`;
				leaderboardList.appendChild(li);
			});
		})
		.catch(err => {
			console.error("❌ Ошибка загрузки таблицы лидеров:", err);
		});
}
