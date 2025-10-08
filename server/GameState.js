const { v4: uuidv4 } = require('uuid');
const Player = require('./Player');
const { FoodManager } = require('./FoodManager');
const { GAME_CONSTANTS, GAME_STATES, EVENT_TYPES } = require('../shared/constants');

class GameState {
    constructor() {
        this.state = GAME_STATES.WAITING_IN_LOBBY;
        this.players = new Map();
        this.foodManager = new FoodManager();
        this.gameTimer = GAME_CONSTANTS.GAME_DURATION;
        this.countdownTimer = 5;
        this.gameLoopInterval = null;
        this.countdownInterval = null;
        this.eventCallbacks = new Map();
    }

    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventCallbacks.has(event)) {
            this.eventCallbacks.get(event).forEach(callback => callback(data));
        }
    }

    addPlayer(playerId, playerName) {
        if (this.players.size >= GAME_CONSTANTS.MAX_PLAYERS) {
            return false;
        }

        if (this.state !== GAME_STATES.WAITING_IN_LOBBY) {
            return false;
        }

        // Generate spawn position
        const spawnPosition = this.generateSpawnPosition();
        const player = new Player(playerId, playerName, spawnPosition.x, spawnPosition.y);
        this.players.set(playerId, player);

        this.emit(EVENT_TYPES.PLAYER_JOINED, { playerName, playerId });
        
        // Check if we have enough players to start
        if (this.players.size >= GAME_CONSTANTS.MIN_PLAYERS) {
            this.startCountdown();
        }

        return true;
    }

    removePlayer(playerId) {
        if (this.players.has(playerId)) {
            this.players.delete(playerId);
            this.emit(EVENT_TYPES.PLAYER_LEFT, { playerId });

            // If we're in countdown and don't have enough players, return to lobby
            if (this.state === GAME_STATES.GAME_COUNTDOWN && this.players.size < GAME_CONSTANTS.MIN_PLAYERS) {
                this.returnToLobby();
            }
            
            // If we're in game and no players left, end the game
            if (this.state === GAME_STATES.GAME_IN_PROGRESS && this.players.size === 0) {
                this.endGame();
            }
        }
    }

    generateSpawnPosition() {
        const spacing = Math.floor(GAME_CONSTANTS.BOARD_WIDTH / Math.max(this.players.size + 1, 4));
        const x = Math.min(GAME_CONSTANTS.INITIAL_SNAKE_LENGTH + (this.players.size * spacing), 
                          GAME_CONSTANTS.BOARD_WIDTH - GAME_CONSTANTS.INITIAL_SNAKE_LENGTH);
        const y = Math.floor(GAME_CONSTANTS.BOARD_HEIGHT / 2);
        return { x, y };
    }

    startCountdown() {
        if (this.state !== GAME_STATES.WAITING_IN_LOBBY) return;

        this.state = GAME_STATES.GAME_COUNTDOWN;
        this.countdownTimer = 5;

        this.countdownInterval = setInterval(() => {
            this.emit(EVENT_TYPES.GAME_COUNTDOWN, { seconds: this.countdownTimer });
            this.countdownTimer--;

            if (this.countdownTimer < 0) {
                clearInterval(this.countdownInterval);
                this.startGame();
            }
        }, 1000);
    }

    startGame() {
        this.state = GAME_STATES.GAME_IN_PROGRESS;
        this.gameTimer = GAME_CONSTANTS.GAME_DURATION;

        // Reset all players
        this.players.forEach(player => {
            player.isAlive = true;
            player.score = 0;
            const spawnPos = this.generateSpawnPosition();
            player.snakeBody = player.initializeSnake(spawnPos.x, spawnPos.y);
        });

        // Clear food and start spawning
        this.foodManager.foodItems = [];

        this.gameLoopInterval = setInterval(() => {
            this.tick();
        }, GAME_CONSTANTS.TICK_RATE);

        // Game timer
        const gameTimerInterval = setInterval(() => {
            this.gameTimer--;
            if (this.gameTimer <= 0) {
                clearInterval(gameTimerInterval);
                this.endGame();
            }
        }, 1000);
    }

    tick() {
        if (this.state !== GAME_STATES.GAME_IN_PROGRESS) return;

        // Move all players
        this.players.forEach(player => {
            if (player.isAlive) {
                player.move();
                
                // Check collisions
                if (player.checkWallCollision() || 
                    player.checkSelfCollision() || 
                    player.checkPlayerCollision(Array.from(this.players.values()))) {
                    player.eliminate();
                } else {
                    // Check food collision
                    const eatenFood = this.foodManager.checkFoodCollision(player.snakeBody[0]);
                    if (eatenFood) {
                        player.score += eatenFood.points;
                        player.grow();
                    } else {
                        player.shrink();
                    }
                }
            }
        });

        // Spawn food
        const occupiedPositions = this.getAllOccupiedPositions();
        if (Math.random() < 0.3) { // 30% chance to spawn food each tick
            this.foodManager.spawnFood(occupiedPositions);
        }

        // Broadcast game state
        this.emit(EVENT_TYPES.GAME_STATE_UPDATE, this.getGameStateSnapshot());
    }

    getAllOccupiedPositions() {
        const positions = [];
        this.players.forEach(player => {
            if (player.isAlive) {
                positions.push(...player.snakeBody);
            }
        });
        return positions;
    }

    endGame() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }

        this.state = GAME_STATES.GAME_OVER;
        
        // Create leaderboard
        const leaderboard = Array.from(this.players.values())
            .map(player => ({ 
                id: player.id, 
                name: player.name, 
                score: player.score,
                isAlive: player.isAlive
            }))
            .sort((a, b) => b.score - a.score);

        this.emit(EVENT_TYPES.GAME_OVER, { leaderboard });

        // Return to lobby after 10 seconds
        setTimeout(() => {
            this.returnToLobby();
        }, 10000);
    }

    returnToLobby() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        this.state = GAME_STATES.WAITING_IN_LOBBY;
        this.gameTimer = GAME_CONSTANTS.GAME_DURATION;
        this.foodManager.foodItems = [];

        // Reset all players
        this.players.forEach(player => {
            player.score = 0;
            player.isAlive = true;
            const spawnPos = this.generateSpawnPosition();
            player.snakeBody = player.initializeSnake(spawnPos.x, spawnPos.y);
        });
    }

    handlePlayerMove(playerId, direction) {
        const player = this.players.get(playerId);
        if (player && player.isAlive && this.state === GAME_STATES.GAME_IN_PROGRESS) {
            player.changeDirection(direction);
        }
    }

    getGameStateSnapshot() {
        return {
            timer: this.gameTimer,
            players: Array.from(this.players.values()).map(player => player.toJSON()),
            foodItems: this.foodManager.toJSON()
        };
    }

    getCurrentState() {
        return this.state;
    }
}

module.exports = GameState;