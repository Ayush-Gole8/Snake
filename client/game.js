class SnakeGameClient {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ws = null;
        this.playerId = null;
        this.playerName = null;
        this.gameState = null;
        this.currentState = 'Connecting...';
        
        this.cellSize = 16; // 800/50 = 16 pixels per cell
        this.colors = {
            players: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
            food: {
                Apple: '#FF0000',
                Banana: '#FFFF00', 
                GoldenApple: '#FFD700'
            },
            background: '#000000',
            grid: '#111111'
        };

        this.init();
    }

    init() {
        this.connectWebSocket();
        this.setupEventListeners();
        this.drawGrid();
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to server');
            this.updateGameState('Connected - Enter name to join');
        };

        this.ws.onmessage = (event) => {
            try {
                const { type, payload } = JSON.parse(event.data);
                this.handleServerMessage(type, payload);
            } catch (error) {
                console.error('Error parsing server message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('Disconnected from server');
            this.updateGameState('Disconnected - Reconnecting...');
            setTimeout(() => this.connectWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleServerMessage(type, payload) {
        switch (type) {
            case 'game_status':
                this.updateGameState(this.formatGameState(payload.state));
                this.updatePlayerList(payload.players || []);
                break;
                
            case 'game_state_update':
                this.gameState = payload;
                this.updateTimer(payload.timer);
                this.updatePlayerList(payload.players);
                this.render();
                break;

            case 'game_countdown':
                this.showCountdown(payload.seconds);
                break;

            case 'player_joined':
                this.hideError();
                break;

            case 'player_joined_success':
                this.playerId = payload.playerId;
                this.playerName = payload.playerName;
                this.hideJoinForm();
                this.hideError();
                break;

            case 'player_left':
                // Player list will be updated via game_state_update
                break;

            case 'game_over':
                this.showGameOver(payload.leaderboard);
                this.hideCountdown();
                break;

            case 'error_notification':
                this.showError(payload.message);
                break;

            default:
                console.log('Unknown message type:', type);
        }
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            if (!this.playerId || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
                return;
            }

            let direction = null;
            
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    direction = 'up';
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    direction = 'down';
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    direction = 'left';
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    direction = 'right';
                    break;
            }

            if (direction) {
                event.preventDefault();
                this.sendMove(direction);
            }
        });

        // Enter key for joining
        document.getElementById('playerName').addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.joinGame();
            }
        });
    }

    joinGame() {
        const nameInput = document.getElementById('playerName');
        const name = nameInput.value.trim();
        
        if (!name) {
            this.showError('Please enter a player name');
            return;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'player_join',
                payload: { playerName: name }
            }));
        } else {
            this.showError('Not connected to server');
        }
    }

    sendMove(direction) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'player_move',
                payload: { direction }
            }));
        }
    }

    render() {
        if (!this.gameState) return;

        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw food
        this.drawFood();
        
        // Draw snakes
        this.drawSnakes();
    }

    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawFood() {
        this.gameState.foodItems.forEach(food => {
            const x = food.position.x * this.cellSize;
            const y = food.position.y * this.cellSize;
            
            this.ctx.fillStyle = this.colors.food[food.type];
            
            if (food.type === 'GoldenApple') {
                // Add glow effect for golden apple
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 10;
            }
            
            if (food.type === 'Banana') {
                // Draw oval for banana
                this.ctx.beginPath();
                this.ctx.ellipse(
                    x + this.cellSize/2, 
                    y + this.cellSize/2, 
                    this.cellSize/2 - 1, 
                    this.cellSize/3, 
                    0, 0, 2 * Math.PI
                );
                this.ctx.fill();
            } else {
                // Draw circle for apples
                this.ctx.beginPath();
                this.ctx.arc(
                    x + this.cellSize/2, 
                    y + this.cellSize/2, 
                    this.cellSize/2 - 1, 
                    0, 2 * Math.PI
                );
                this.ctx.fill();
            }
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
        });
    }

    drawSnakes() {
        this.gameState.players.forEach((player, index) => {
            if (!player.isAlive || player.snakeBody.length === 0) return;
            
            const color = this.colors.players[index % this.colors.players.length];
            
            player.snakeBody.forEach((segment, segmentIndex) => {
                const x = segment[0] * this.cellSize;
                const y = segment[1] * this.cellSize;
                
                // Head is slightly different color and has eyes
                if (segmentIndex === 0) {
                    // Draw head
                    this.ctx.fillStyle = this.lightenColor(color, 20);
                    this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
                    
                    // Draw eyes
                    this.ctx.fillStyle = '#FFFFFF';
                    const eyeSize = 2;
                    const eyeOffset = 3;
                    
                    switch (player.direction) {
                        case 'up':
                            this.ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                            this.ctx.fillRect(x + this.cellSize - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
                            break;
                        case 'down':
                            this.ctx.fillRect(x + eyeOffset, y + this.cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                            this.ctx.fillRect(x + this.cellSize - eyeOffset - eyeSize, y + this.cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                            break;
                        case 'left':
                            this.ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                            this.ctx.fillRect(x + eyeOffset, y + this.cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                            break;
                        case 'right':
                            this.ctx.fillRect(x + this.cellSize - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
                            this.ctx.fillRect(x + this.cellSize - eyeOffset - eyeSize, y + this.cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                            break;
                    }
                } else {
                    // Draw body
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
                }
                
                // Highlight own snake
                if (player.id === this.playerId) {
                    this.ctx.strokeStyle = '#FFD700';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
                }
            });
        });
    }

    lightenColor(color, percent) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        return '#' + 
            Math.min(255, Math.floor(r + (255 - r) * percent / 100)).toString(16).padStart(2, '0') +
            Math.min(255, Math.floor(g + (255 - g) * percent / 100)).toString(16).padStart(2, '0') +
            Math.min(255, Math.floor(b + (255 - b) * percent / 100)).toString(16).padStart(2, '0');
    }

    updateGameState(state) {
        this.currentState = state;
        document.getElementById('gameState').textContent = state;
    }

    updateTimer(seconds) {
        document.getElementById('timer').textContent = seconds;
    }

    updatePlayerList(players) {
        const playerList = document.getElementById('playerList');
        playerList.innerHTML = '';
        
        // Sort players by score (descending)
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        
        sortedPlayers.forEach((player, index) => {
            const li = document.createElement('li');
            li.className = 'player-item';
            
            if (!player.isAlive) {
                li.classList.add('dead');
            }
            
            if (player.id === this.playerId) {
                li.classList.add('me');
            }
            
            li.innerHTML = `
                <span>${index + 1}. ${player.name}</span>
                <span>${player.score} pts</span>
            `;
            
            playerList.appendChild(li);
        });
    }

    showCountdown(seconds) {
        const countdown = document.getElementById('countdown');
        countdown.textContent = seconds > 0 ? seconds : 'GO!';
        countdown.style.display = 'block';
        
        if (seconds <= 0) {
            setTimeout(() => this.hideCountdown(), 1000);
        }
    }

    hideCountdown() {
        document.getElementById('countdown').style.display = 'none';
    }

    showGameOver(leaderboard) {
        this.updateGameState('Game Over');
        
        // Update player list with final standings
        const playerList = document.getElementById('playerList');
        playerList.innerHTML = '';
        playerList.parentElement.classList.add('leaderboard');
        
        leaderboard.forEach((player, index) => {
            const li = document.createElement('li');
            li.className = 'player-item';
            
            if (player.id === this.playerId) {
                li.classList.add('me');
            }
            
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            
            li.innerHTML = `
                <span>${medal} ${index + 1}. ${player.name}</span>
                <span>${player.score} pts</span>
            `;
            
            playerList.appendChild(li);
        });
        
        setTimeout(() => {
            playerList.parentElement.classList.remove('leaderboard');
            this.showJoinForm();
        }, 10000);
    }

    showError(message) {
        const errorEl = document.getElementById('errorMessage');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => this.hideError(), 5000);
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    hideJoinForm() {
        document.getElementById('joinForm').style.display = 'none';
    }

    showJoinForm() {
        document.getElementById('joinForm').style.display = 'flex';
        document.getElementById('playerName').value = '';
        this.playerId = null;
        this.playerName = null;
    }

    formatGameState(state) {
        switch (state) {
            case 'WaitingInLobby':
                return 'Waiting for players...';
            case 'GameCountdown':
                return 'Game starting...';
            case 'GameInProgress':
                return 'Game in progress';
            case 'GameOver':
                return 'Game over';
            default:
                return state;
        }
    }
}

// Global functions
function joinGame() {
    if (window.gameClient) {
        window.gameClient.joinGame();
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    window.gameClient = new SnakeGameClient();
});