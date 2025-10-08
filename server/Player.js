const { v4: uuidv4 } = require('uuid');
const { GAME_CONSTANTS, DIRECTIONS } = require('../shared/constants');

class Player {
    constructor(id, name, x, y) {
        this.id = id;
        this.name = name;
        this.score = 0;
        this.isAlive = true;
        this.direction = DIRECTIONS.RIGHT;
        this.snakeBody = this.initializeSnake(x, y);
        this.lastDirection = this.direction;
    }

    initializeSnake(startX, startY) {
        const body = [];
        for (let i = 0; i < GAME_CONSTANTS.INITIAL_SNAKE_LENGTH; i++) {
            body.push([startX - i, startY]);
        }
        return body;
    }

    move() {
        if (!this.isAlive) return;

        const head = [...this.snakeBody[0]];
        
        switch (this.direction) {
            case DIRECTIONS.UP:
                head[1] -= 1;
                break;
            case DIRECTIONS.DOWN:
                head[1] += 1;
                break;
            case DIRECTIONS.LEFT:
                head[0] -= 1;
                break;
            case DIRECTIONS.RIGHT:
                head[0] += 1;
                break;
        }

        this.snakeBody.unshift(head);
        this.lastDirection = this.direction;
    }

    grow() {
        // Don't remove the tail, effectively growing the snake
    }

    shrink() {
        if (this.snakeBody.length > 0) {
            this.snakeBody.pop();
        }
    }

    changeDirection(newDirection) {
        // Prevent reversing into itself
        const opposites = {
            [DIRECTIONS.UP]: DIRECTIONS.DOWN,
            [DIRECTIONS.DOWN]: DIRECTIONS.UP,
            [DIRECTIONS.LEFT]: DIRECTIONS.RIGHT,
            [DIRECTIONS.RIGHT]: DIRECTIONS.LEFT
        };

        if (opposites[newDirection] !== this.lastDirection) {
            this.direction = newDirection;
        }
    }

    checkSelfCollision() {
        const head = this.snakeBody[0];
        for (let i = 1; i < this.snakeBody.length; i++) {
            if (head[0] === this.snakeBody[i][0] && head[1] === this.snakeBody[i][1]) {
                return true;
            }
        }
        return false;
    }

    checkWallCollision() {
        const head = this.snakeBody[0];
        return head[0] < 0 || head[0] >= GAME_CONSTANTS.BOARD_WIDTH ||
               head[1] < 0 || head[1] >= GAME_CONSTANTS.BOARD_HEIGHT;
    }

    checkPlayerCollision(otherPlayers) {
        const head = this.snakeBody[0];
        for (const otherPlayer of otherPlayers) {
            if (otherPlayer.id === this.id || !otherPlayer.isAlive) continue;
            
            for (const segment of otherPlayer.snakeBody) {
                if (head[0] === segment[0] && head[1] === segment[1]) {
                    return true;
                }
            }
        }
        return false;
    }

    eliminate() {
        this.isAlive = false;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            score: this.score,
            isAlive: this.isAlive,
            direction: this.direction,
            snakeBody: this.snakeBody
        };
    }
}

module.exports = Player;