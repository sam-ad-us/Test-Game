// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Variables
let score = 0;
let gameSpeed = 5;
let isGameOver = false;
let isGameStarted = false;
let lastObstacleTime = 0;
let lastPowerUpTime = 0;
let currentSkin = 'default';

// Player Object
let player = {
    x: 50,
    y: 300,
    width: 60,
    height: 80,
    isJumping: false,
    jumpPower: 15,
    gravity: 0.8,
    velocityY: 0,
    state: 'running',
    slideDuration: 0,
    powerUps: {
        shield: false,
        doublePoints: false,
        speedBoost: false
    }
};

// Game Objects
let obstacles = [];
let powerUps = [];
let clouds = [];

// Sprite Images
const sprites = {
    backgrounds: {
        default: new Image(),
        ninja: new Image(),
        robot: new Image()
    },
    player: {
        default: { run: new Image(), jump: new Image(), slide: new Image() },
        ninja: { run: new Image(), jump: new Image(), slide: new Image() },
        robot: { run: new Image(), jump: new Image(), slide: new Image() }
    },
    obstacles: {
        spike: new Image(),
        bird: new Image(),
        pit: new Image(),
        arrow: new Image()
    },
    powerUps: {
        shield: new Image(),
        doublePoints: new Image(),
        speedBoost: new Image()
    },
    enemy: new Image()
};

sprites.backgrounds.default.src = 'images/background.png';
sprites.backgrounds.ninja.src = 'images/background_ninja.png';
sprites.backgrounds.robot.src = 'images/background_robot.png';

sprites.player.default.run.src = 'images/player_run.png';
sprites.player.default.jump.src = 'images/player_jump.png';
sprites.player.default.slide.src = 'images/player_slide.png';

sprites.player.ninja.run.src = 'images/ninja_run.png';
sprites.player.ninja.jump.src = 'images/ninja_jump.png';
sprites.player.ninja.slide.src = 'images/ninja_slide.png';

sprites.player.robot.run.src = 'images/robot_run.png';
sprites.player.robot.jump.src = 'images/robot_jump.png';
sprites.player.robot.slide.src = 'images/robot_slide.png';

sprites.obstacles.spike.src = 'images/spike.png';
sprites.obstacles.bird.src = 'images/bird.png';
sprites.obstacles.pit.src = 'images/pit.png';
sprites.obstacles.arrow.src = 'images/arrow.png';

sprites.powerUps.shield.src = 'images/shield.png';
sprites.powerUps.doublePoints.src = 'images/double_points.png';
sprites.powerUps.speedBoost.src = 'images/speed_boost.png';

sprites.enemy.src = 'images/enemy.png';

const animations = {
    playerRun: { frame: 0, frameCount: 0, totalFrames: 4 },
    cloudMove: { frame: 0, frameCount: 0, totalFrames: 2 }
};

function init() {
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 100 + 20,
            width: 80,
            height: 40,
            speed: Math.random() * 1 + 0.5
        });
    }
    gameLoop();
}

function gameLoop() {
    if (!isGameOver) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

function update() {
    if (!isGameStarted) return;

    updatePlayer();

    if (Date.now() - lastObstacleTime > 1500 - (gameSpeed * 10)) {
        spawnObstacle();
        lastObstacleTime = Date.now();
    }

    if (Date.now() - lastPowerUpTime > 10000 && Math.random() > 0.7) {
        spawnPowerUp();
        lastPowerUpTime = Date.now();
    }

    updateObstacles();
    updatePowerUps();
    updateClouds();
    updateAnimations();

    score += player.powerUps.doublePoints ? 0.2 : 0.1;
    if (score % 30 === 0) gameSpeed += 0.2;
}

function updatePlayer() {
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    if (player.y > 300) {
        player.y = 300;
        player.isJumping = false;
        player.velocityY = 0;
        if (player.state === 'jumping') player.state = 'running';
    }

    if (player.state === 'sliding') {
        player.slideDuration++;
        if (player.slideDuration > 30) {
            player.state = 'running';
            player.slideDuration = 0;
        }
    }

    if (player.powerUps.shield && score % 100 === 0) player.powerUps.shield = false;
    if (player.powerUps.speedBoost && score % 150 === 0) {
        player.powerUps.speedBoost = false;
        gameSpeed = Math.max(5, gameSpeed - 2);
    }
    if (player.powerUps.doublePoints && score % 200 === 0) player.powerUps.doublePoints = false;
}

function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed * (player.powerUps.speedBoost ? 1.5 : 1);

        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            continue;
        }

        if (checkCollision(player, obstacles[i])) {
            if (player.powerUps.shield) {
                player.powerUps.shield = false;
                obstacles.splice(i, 1);
            } else {
                gameOver();
                return;
            }
        }
    }
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].x -= gameSpeed;
        if (powerUps[i].x + powerUps[i].width < 0) powerUps.splice(i, 1);
        if (checkCollision(player, powerUps[i])) {
            collectPowerUp(powerUps[i].type);
            powerUps.splice(i, 1);
        }
    }
}

function updateClouds() {
    for (let i = 0; i < clouds.length; i++) {
        clouds[i].x -= clouds[i].speed;
        if (clouds[i].x + clouds[i].width < 0) {
            clouds[i].x = canvas.width;
            clouds[i].y = Math.random() * 100 + 20;
        }
    }
}

function updateAnimations() {
    if (player.state === 'running') {
        animations.playerRun.frameCount++;
        if (animations.playerRun.frameCount >= 8) {
            animations.playerRun.frame = (animations.playerRun.frame + 1) % animations.playerRun.totalFrames;
            animations.playerRun.frameCount = 0;
        }
    }
    animations.cloudMove.frameCount++;
    if (animations.cloudMove.frameCount >= 15) {
        animations.cloudMove.frame = (animations.cloudMove.frame + 1) % animations.cloudMove.totalFrames;
        animations.cloudMove.frameCount = 0;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sprites.backgrounds[currentSkin], 0, 0, canvas.width, canvas.height);
    drawClouds();
    drawPlayer();
    drawObstacles();
    drawPowerUps();
    drawEnemy();
    drawUI();
    if (!isGameStarted) drawStartScreen();
    if (isGameOver) drawGameOverScreen();
}

function drawStartScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('RUN OR DIE', canvas.width/2, canvas.height/2 - 50);
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to start', canvas.width/2, canvas.height/2);
    ctx.fillText('Arrow Up to Jump | Arrow Down to Slide', canvas.width/2, canvas.height/2 + 30);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 50);
    ctx.fillText(`Score: ${Math.floor(score)}`, canvas.width/2, canvas.height/2);
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to Restart', canvas.width/2, canvas.height/2 + 50);
}

function drawClouds() {
    clouds.forEach(cloud => {
        ctx.drawImage(
            sprites.backgrounds[currentSkin],
            animations.cloudMove.frame * 100, 0, 100, 50,
            cloud.x, cloud.y, cloud.width, cloud.height
        );
    });
}

function drawPlayer() {
    const skin = sprites.player[currentSkin];
    let sprite;
    switch (player.state) {
        case 'running': sprite = skin.run; break;
        case 'jumping': sprite = skin.jump; break;
        case 'sliding': sprite = skin.slide; break;
    }
    ctx.drawImage(
        sprite,
        animations.playerRun.frame * (sprite.width / animations.playerRun.totalFrames),
        0,
        sprite.width / animations.playerRun.totalFrames,
        sprite.height,
        player.x,
        player.state === 'sliding' ? player.y + 20 : player.y,
        player.width,
        player.state === 'sliding' ? player.height - 20 : player.height
    );
    if (player.powerUps.shield) {
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, Math.max(player.width, player.height) / 2 + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

function drawObstacles() {
    obstacles.forEach(ob => ctx.drawImage(sprites.obstacles[ob.type], ob.x, ob.y, ob.width, ob.height));
}

function drawPowerUps() {
    powerUps.forEach(pu => ctx.drawImage(sprites.powerUps[pu.type], pu.x, pu.y, pu.width, pu.height));
}

function drawEnemy() {
    const enemyX = player.x - 200 + (Math.sin(score / 20) * 30);
    ctx.drawImage(sprites.enemy, enemyX, 310, 80, 70);
}

function drawUI() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${Math.floor(score)}`, 20, 30);
    const highScore = localStorage.getItem('highScore') || 0;
    ctx.fillText(`High Score: ${highScore}`, canvas.width - 150, 30);
}

function spawnObstacle() {
    const types = ['spike', 'bird', 'pit', 'arrow'];
    const type = types[Math.floor(Math.random() * types.length)];
    const ob = { x: canvas.width, type, width: 40, height: 40 };
    if (type === 'spike') { ob.y = 320; ob.height = 30; }
    if (type === 'bird') { ob.y = 250; ob.width = 50; ob.height = 30; }
    if (type === 'pit') { ob.y = 320; ob.width = 80; ob.height = 10; }
    if (type === 'arrow') { ob.y = Math.random() > 0.5 ? 270 : 310; ob.width = 60; ob.height = 10; }
    obstacles.push(ob);
}

function spawnPowerUp() {
    const types = ['shield', 'doublePoints', 'speedBoost'];
    const type = types[Math.floor(Math.random() * types.length)];
    powerUps.push({ x: canvas.width, y: 280, width: 30, height: 30, type });
}

function collectPowerUp(type) {
    player.powerUps[type] = true;
    if (type === 'speedBoost') gameSpeed += 2;
}

function checkCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function gameOver() {
    isGameOver = true;
    saveHighScore(Math.floor(score));
}

function resetGame() {
    score = 0; gameSpeed = 5; isGameOver = false;
    obstacles = []; powerUps = [];
    player = {
        ...player,
        x: 50,
        y: 300,
        isJumping: false,
        velocityY: 0,
        state: 'running',
        slideDuration: 0,
        powerUps: {
            shield: false,
            doublePoints: false,
            speedBoost: false
        }
    };
    gameLoop();
}

function saveHighScore(score) {
    const highScore = localStorage.getItem('highScore') || 0;
    if (score > highScore) localStorage.setItem('highScore', score);
}

document.addEventListener('keydown', e => {
    if (!isGameStarted && e.code === 'Space') { isGameStarted = true; return; }
    if (isGameOver && e.code === 'Space') { resetGame(); return; }
    if (e.code === 'Space' && !player.isJumping && player.state !== 'sliding') {
        player.isJumping = true;
        player.velocityY = -player.jumpPower;
        player.state = 'jumping';
    }
    if (e.key === 'ArrowDown' && !player.isJumping && player.state !== 'sliding') {
        player.state = 'sliding';
        player.slideDuration = 0;
    }
});

init();
