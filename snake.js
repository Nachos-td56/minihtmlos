let snakeWindow = null;

function openSnakeGame() {
  if (snakeWindow) return;

  const content = openWindow("snake", "Snake Game", `
    <canvas id="snakeCanvas" width="500" height="400" 
      style="background:#111;display:block;margin:auto;border:2px solid #333;"></canvas>
    <div id="snakeScore" 
      style="text-align:center;color:#6aff6a;font-family:monospace;margin-top:6px;">
      Score: 0
    </div>
    <div id="snakeTip"
      style="text-align:center;color:#aaa;font-family:monospace;font-size:12px;margin-top:4px;">
      Tip: Use arrow keys to move. Press R to restart.
    </div>
  `, 600, 580);

  const canvas = content.querySelector("#snakeCanvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = content.querySelector("#snakeScore");

  const gridSize = 20;
  let snake, direction, nextDirection, food, score, gameOver;
  const speed = 180;
  let gameLoopTimeout = null;
  let windowClosed = false;

  const notifyMiniOS = (msg) => {
    if (typeof notify === "function") notify(msg);
    else if (window.notify) window.notify(msg);
    else alert(msg);
  };

  window.addEventListener("keydown", e => {
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
  });

  function resetGame() {
    if (windowClosed) return;
    if (gameLoopTimeout) clearTimeout(gameLoopTimeout);

    snake = [
      { x: 200, y: 200 },
      { x: 180, y: 200 },
      { x: 160, y: 200 }
    ];
    direction = "right";
    nextDirection = "right";
    score = 0;
    gameOver = false;
    scoreEl.textContent = `Score: ${score}`;
    placeFood();
    notifyMiniOS("Snake restarted! Good luck!");
    gameLoop();
  }

  function placeFood() {
    const maxX = Math.floor((canvas.width - gridSize) / gridSize);
    const maxY = Math.floor((canvas.height - gridSize) / gridSize);
    food = {
      x: Math.floor(Math.random() * (maxX + 1)) * gridSize,
      y: Math.floor(Math.random() * (maxY + 1)) * gridSize
    };
    while (snake.some(s => s.x === food.x && s.y === food.y)) {
      food.x = Math.floor(Math.random() * (maxX + 1)) * gridSize;
      food.y = Math.floor(Math.random() * (maxY + 1)) * gridSize;
    }
  }

  function drawRect(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, gridSize, gridSize);
  }

  function drawGame() {
    if (windowClosed) return;

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawRect(food.x, food.y, "red");
    snake.forEach((seg,i) => drawRect(seg.x, seg.y, i===0?"#6aff6a":"#4ca64c"));
  }

  function moveSnake() {
    if (gameOver || windowClosed) return;

    direction = nextDirection;
    const head = {...snake[0]};
    switch(direction){
      case "up": head.y -= gridSize; break;
      case "down": head.y += gridSize; break;
      case "left": head.x -= gridSize; break;
      case "right": head.x += gridSize; break;
    }

    if(head.x<0||head.x>=canvas.width||head.y<0||head.y>=canvas.height){ endGame(); return; }

    if(snake.some((s,i)=>i>0 && s.x===head.x && s.y===head.y)){ endGame(); return; }

    snake.unshift(head);

    if(head.x===food.x && head.y===food.y){
      score++;
      scoreEl.textContent = `Score: ${score}`;
      placeFood();
      if(score%5===0) notifyMiniOS(`Score reached ${score}!`);
    } else snake.pop();
  }

  function endGame() {
    gameOver = true;
    notifyMiniOS(`Game Over! Final score: ${score}`);
  }

  const keyHandler = (e) => {
    if (windowClosed) return;
    switch(e.key){
      case "ArrowUp": if(direction!=="down") nextDirection="up"; break;
      case "ArrowDown": if(direction!=="up") nextDirection="down"; break;
      case "ArrowLeft": if(direction!=="right") nextDirection="left"; break;
      case "ArrowRight": if(direction!=="left") nextDirection="right"; break;
      case "r": case "R": resetGame(); break;
    }
  };

  document.addEventListener("keydown", keyHandler);

  function gameLoop() {
    if (gameOver || windowClosed) return;

    moveSnake();
    drawGame();
    gameLoopTimeout = setTimeout(gameLoop, speed);
  }

  const closeBtn = content.closest(".window").querySelector(".close");
  closeBtn.addEventListener("click", ()=>{
    windowClosed = true;
    document.removeEventListener("keydown", keyHandler);
    if (gameLoopTimeout) clearTimeout(gameLoopTimeout);
    snakeWindow = null;
  });

  resetGame();
  snakeWindow = content.closest(".window");
}

console.log("snake.js loaded");
