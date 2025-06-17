const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Variables
let score = 0;
let gameSpeed = 5;
let isGameOver = false;
let player = {
    x: 50,
    y: 300,
    width: 50,
    height: 80,
    isJumping: false,
    jumpPower: 15,
    gravity: 0.8,
    velocityY: 0
};

// Obstacles Array
let obstacles = [];
let lastObstacleTime = 0;

// Game Loop
function gameLoop() {
    update();
    draw();
    if (!isGameOver) requestAnimationFrame(gameLoop);
}

function update() {
    // Player movement (gravity, jump)
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    // Ground collision
    if (player.y > 300) {
        player.y = 300;
        player.isJumping = false;
        player.velocityY = 0;
    }

    // Generate obstacles
    if (Date.now() - lastObstacleTime > 2000) {
        spawnObstacle();
        lastObstacleTime = Date.now();
    }

    // Move obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed;
        
        // Collision detection
        if (checkCollision(player, obstacle)) {
            gameOver();
        }
    });

    // Increase difficulty
    score += 0.1;
    if (score % 30 === 0) gameSpeed += 0.5;
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw player (rectangle for now)
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw obstacles
    ctx.fillStyle = 'red';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    
    // Draw score
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${Math.floor(score)}`, 20, 30);
}

function spawnObstacle() {
    const type = Math.random() > 0.5 ? 'spike' : 'bird';
    obstacles.push({
        x: canvas.width,
        y: type === 'spike' ? 320 : 250,
        width: 30,
        height: type === 'spike' ? 30 : 20,
        type
    });
}

function checkCollision(player, obstacle) {
    return (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y
    );
}

function gameOver() {
    isGameOver = true;
    alert(`Game Over! Score: ${Math.floor(score)}`);
}

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !player.isJumping) {
        player.isJumping = true;
        player.velocityY = -player.jumpPower;
    }
});

// Start Game
gameLoop();
