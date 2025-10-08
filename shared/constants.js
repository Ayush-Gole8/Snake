// Shared constants and types for the game
const GAME_CONSTANTS = {
    BOARD_WIDTH: 50,
    BOARD_HEIGHT: 50,
    TICK_RATE: 100, // milliseconds
    GAME_DURATION: 60, // seconds
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 8,
    INITIAL_SNAKE_LENGTH: 3
};

const GAME_STATES = {
    WAITING_IN_LOBBY: 'WaitingInLobby',
    GAME_COUNTDOWN: 'GameCountdown',
    GAME_IN_PROGRESS: 'GameInProgress',
    GAME_OVER: 'GameOver'
};

const DIRECTIONS = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right'
};

const FOOD_TYPES = {
    APPLE: { type: 'Apple', points: 10, spawnRate: 0.7 },
    BANANA: { type: 'Banana', points: 25, spawnRate: 0.25 },
    GOLDEN_APPLE: { type: 'GoldenApple', points: 100, spawnRate: 0.05 }
};

const EVENT_TYPES = {
    // Client to Server
    PLAYER_JOIN: 'player_join',
    PLAYER_MOVE: 'player_move',
    
    // Server to Client
    GAME_STATE_UPDATE: 'game_state_update',
    GAME_COUNTDOWN: 'game_countdown',
    PLAYER_JOINED: 'player_joined',
    PLAYER_LEFT: 'player_left',
    GAME_OVER: 'game_over',
    ERROR_NOTIFICATION: 'error_notification'
};

// Export for use in both server and client
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GAME_CONSTANTS,
        GAME_STATES,
        DIRECTIONS,
        FOOD_TYPES,
        EVENT_TYPES
    };
}