/**
 * 贪吃蛇游戏主逻辑
 */

class SnakeGame {
    constructor() {
        // 初始化游戏元素
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.scoreElement = document.getElementById('score');
        
        // 游戏配置
        this.tileSize = 20;
        this.initialSpeed = 200;
        this.speedIncrement = 20;
        this.foodCount = 0;
        this.score = 0;
        this.isPaused = false;
        this.isGameOver = false;

        // 设置画布大小
        this.resizeCanvas();
        
        // 初始化事件监听
        this.initEventListeners();
    }

    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // 开始按钮
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        
        // 暂停按钮
        document.getElementById('pause-button').addEventListener('click', () => this.togglePause());
        
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 窗口大小改变
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 添加全屏按钮事件监听
        document.getElementById('fullscreen-button').addEventListener('click', () => this.toggleFullscreen());
        
        // 添加全屏变化监听
        document.addEventListener('fullscreenchange', () => {
            this.resizeCanvas();
        });
    }

    /**
     * 调整画布大小
     */
    resizeCanvas() {
        // 使用视口尺寸，包括状态栏区域
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // 确保网格尺寸能被整除
        this.gridSize = this.tileSize;
        this.cols = Math.floor(this.canvas.width / this.gridSize);
        this.rows = Math.floor(this.canvas.height / this.gridSize);

        // 重新生成食物，确保在新的范围内
        if (this.food) {
            this.generateFood();
        }

        // 如果蛇存在，确保蛇在有效范围内
        if (this.snake) {
            this.snake = this.snake.map(segment => ({
                x: Math.min(segment.x, this.cols - 1),
                y: Math.min(segment.y, this.rows - 1)
            }));
        }
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.startScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        
        // 初始化蛇的位置在屏幕中心
        const centerX = Math.floor(this.cols / 2);
        const centerY = Math.floor(this.rows / 2);
        this.snake = [{x: centerX, y: centerY}];
        
        this.direction = 'right';
        this.nextDirection = 'right';
        this.generateFood();
        this.isGameOver = false;
        this.score = 0;
        this.foodCount = 0;
        this.scoreElement.textContent = '0';
        
        // 开始游戏循环
        this.gameLoop();
    }

    /**
     * 生成食物
     */
    generateFood() {
        const maxX = this.cols - 1;
        const maxY = this.rows - 1;
        
        do {
            this.food = {
                x: Math.floor(Math.random() * maxX),
                y: Math.floor(Math.random() * maxY)
            };
        } while (this.snake.some(segment => 
            segment.x === this.food.x && segment.y === this.food.y));
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        if (this.isPaused || this.isGameOver) return;
        
        this.update();
        this.draw();
        
        // 计算当前速度
        const currentSpeed = this.initialSpeed - Math.floor(this.foodCount / 5) * this.speedIncrement;
        
        setTimeout(() => requestAnimationFrame(() => this.gameLoop()), 
            Math.max(currentSpeed, 50));
    }

    /**
     * 更新游戏状态
     */
    update() {
        // 更新蛇的方向
        this.direction = this.nextDirection;
        
        // 计算新的头部位置
        const head = {...this.snake[0]};
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }
        
        // 检查碰撞
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }
        
        // 移动蛇
        this.snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.foodCount++;
            this.score += 10;
            this.scoreElement.textContent = this.score;
            this.generateFood();
        } else {
            this.snake.pop();
        }
    }

    /**
     * 绘制游戏画面
     */
    draw() {
        // 清空画布并绘制背景
        this.ctx.fillStyle = '#f5f5f7';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        
        // 绘制垂直线
        for (let x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.gridSize, 0);
            this.ctx.lineTo(x * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.gridSize);
            this.ctx.lineTo(this.canvas.width, y * this.gridSize);
            this.ctx.stroke();
        }
        
        // 绘制蛇
        this.ctx.fillStyle = '#5856D6';
        this.snake.forEach(segment => {
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
        });
        
        // 绘制食物
        this.ctx.fillStyle = '#FF2D55';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 1,
            this.gridSize - 1
        );
    }

    /**
     * 检查碰撞
     */
    checkCollision(head) {
        // 检查边界碰撞
        if (head.x < 0 || head.x >= this.cols ||
            head.y < 0 || head.y >= this.rows) {
            return true;
        }
        
        // 检查自身碰撞
        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    /**
     * 处理键盘输入
     */
    handleKeyPress(e) {
        switch (e.key) {
            case 'ArrowUp':
                if (this.direction !== 'down') this.nextDirection = 'up';
                break;
            case 'ArrowDown':
                if (this.direction !== 'up') this.nextDirection = 'down';
                break;
            case 'ArrowLeft':
                if (this.direction !== 'right') this.nextDirection = 'left';
                break;
            case 'ArrowRight':
                if (this.direction !== 'left') this.nextDirection = 'right';
                break;
        }
    }

    /**
     * 切换暂停状态
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.gameLoop();
        }
    }

    /**
     * 切换全屏模式
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`全屏请求失败: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * 游戏结束处理
     */
    gameOver() {
        this.isGameOver = true;
        alert(`游戏结束！得分：${this.score}`);
        this.gameScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.score = 0;
        this.foodCount = 0;
        this.scoreElement.textContent = '0';
    }
}

// 初始化游戏
window.onload = () => {
    new SnakeGame();
}; 