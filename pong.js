let pongWindow = null;

function openPongGame() {
  if (pongWindow) return;

  const content = openWindow("pong", "Pong Game", `
    <canvas id="pongCanvas" width="500" height="400"
      style="background:#111;display:block;margin:auto;border:2px solid #333;"></canvas>
    <div id="pongScore"
      style="text-align:center;color:#6aff6a;font-family:monospace;margin-top:6px;">
      Player: 0 &nbsp;|&nbsp; CPU: 0
    </div>
    <div id="pongTip"
      style="text-align:center;color:#aaa;font-family:monospace;font-size:12px;margin-top:4px;">
      Tip: Use ↑ and ↓ to move. Press R to restart.
    </div>
  `, 600, 580);

  const canvas = content.querySelector("#pongCanvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = content.querySelector("#pongScore");

  const paddleWidth = 12;
  const paddleHeight = 70;
  const ballSize = 12;

  const notifyMiniOS = (msg) => {
    if (typeof notify === "function") notify(msg);
    else if (window.notify) window.notify(msg);
    else alert(msg);
  };

  let playerY, cpuY, ballX, ballY, ballSpeedX, ballSpeedY;
  let playerScore, cpuScore, upPressed, downPressed, gameRunning;
  let animationFrameId;
  let windowClosed = false;

  function resetGame() {
    if (windowClosed) return;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    playerY = canvas.height / 2 - paddleHeight / 2;
    cpuY = canvas.height / 2 - paddleHeight / 2;
    playerScore = 0;
    cpuScore = 0;
    startBall();
    gameRunning = true;
    draw();
    notifyMiniOS("Pong restarted! Good luck!");
    update();
  }

  function startBall() {
    ballX = canvas.width / 2 - ballSize / 2;
    ballY = canvas.height / 2 - ballSize / 2;

    ballSpeedX = 0;
    ballSpeedY = 0;

    setTimeout(() => {
      if (windowClosed) return;
      const baseSpeed = 3;
      ballSpeedX = (Math.random() < 0.5 ? -1 : 1) * baseSpeed;
      ballSpeedY = (Math.random() * 2 - 1) * baseSpeed * 0.6;
    }, 1300);
  }

  function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNet() {
    ctx.fillStyle = "#333";
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.fillRect(canvas.width / 2 - 1, i, 2, 10);
    }
  }

  function draw() {
    if (!gameRunning || windowClosed) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawNet();
    drawRect(10, cpuY, paddleWidth, paddleHeight, "#4ca64c");
    drawRect(canvas.width - paddleWidth - 10, playerY, paddleWidth, paddleHeight, "#6aff6a");
    drawCircle(ballX + ballSize / 2, ballY + ballSize / 2, ballSize / 2, "white");

    scoreEl.textContent = `CPU: ${cpuScore}  |  Player: ${playerScore}`;
  }

  function update() {
    if (!gameRunning || windowClosed) return;

    if (upPressed && playerY > 0) playerY -= 4;
    if (downPressed && playerY + paddleHeight < canvas.height) playerY += 4;

    const cpuCenter = cpuY + paddleHeight / 2;
    if (cpuCenter < ballY + ballSize / 2 - 10) cpuY += 3;
    else if (cpuCenter > ballY + ballSize / 2 + 10) cpuY -= 3;

    if (cpuY < 0) cpuY = 0;
    if (cpuY + paddleHeight > canvas.height) cpuY = canvas.height - paddleHeight;

    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballY <= 0 || ballY + ballSize >= canvas.height) ballSpeedY *= -1;

    if (ballX <= 10 + paddleWidth && ballY + ballSize >= cpuY && ballY <= cpuY + paddleHeight) {
      ballSpeedX = Math.abs(ballSpeedX);
      const hitPos = (ballY + ballSize / 2 - (cpuY + paddleHeight / 2)) / 10;
      ballSpeedY = hitPos * 2;
    }

    if (ballX + ballSize >= canvas.width - paddleWidth - 10 &&
        ballY + ballSize >= playerY &&
        ballY <= playerY + paddleHeight) {
      ballSpeedX = -Math.abs(ballSpeedX);
      const hitPos = (ballY + ballSize / 2 - (playerY + paddleHeight / 2)) / 10;
      ballSpeedY = hitPos * 2;
    }

    if (ballX < 0) {
      playerScore++;
      notifyMiniOS("You scored!");
      startBall();
    } else if (ballX > canvas.width) {
      cpuScore++;
      notifyMiniOS("CPU scores!");
      startBall();
    }

    draw();
    animationFrameId = requestAnimationFrame(update);
  }

  const keyHandler = (e) => {
    if (windowClosed) return;
    switch (e.key) {
      case "ArrowUp": upPressed = true; break;
      case "ArrowDown": downPressed = true; break;
      case "r":
      case "R": resetGame(); break;
    }
  };

  const keyUpHandler = (e) => {
    if (e.key === "ArrowUp") upPressed = false;
    if (e.key === "ArrowDown") downPressed = false;
  };

  document.addEventListener("keydown", keyHandler);
  document.addEventListener("keyup", keyUpHandler);

  const closeBtn = content.closest(".window").querySelector(".close");
  closeBtn.addEventListener("click", () => {
    windowClosed = true;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    document.removeEventListener("keydown", keyHandler);
    document.removeEventListener("keyup", keyUpHandler);
    pongWindow = null;
  });

  resetGame();
  pongWindow = content.closest(".window");
}

console.log("pong.js loaded");
