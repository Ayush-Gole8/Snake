const { v4: uuidv4 } = require('uuid');
const { FOOD_TYPES, GAME_CONSTANTS } = require('../shared/constants');

class FoodItem {
    constructor(type, x, y) {
        this.id = uuidv4();
        this.type = type;
        this.position = { x, y };
        this.points = FOOD_TYPES[type.toUpperCase()].points;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            position: this.position
        };
    }
}

class FoodManager {
    constructor() {
        this.foodItems = [];
        this.maxFoodItems = 15;
    }

    spawnFood(occupiedPositions) {
        if (this.foodItems.length >= this.maxFoodItems) {
            return;
        }

        // Find a random unoccupied position
        let attempts = 0;
        let position;
        
        do {
            position = {
                x: Math.floor(Math.random() * GAME_CONSTANTS.BOARD_WIDTH),
                y: Math.floor(Math.random() * GAME_CONSTANTS.BOARD_HEIGHT)
            };
            attempts++;
        } while (this.isPositionOccupied(position, occupiedPositions) && attempts < 50);

        if (attempts >= 50) {
            return; // Unable to find free position
        }

        // Determine food type based on spawn rates
        const rand = Math.random();
        let foodType;
        
        if (rand < FOOD_TYPES.GOLDEN_APPLE.spawnRate) {
            foodType = FOOD_TYPES.GOLDEN_APPLE.type;
        } else if (rand < FOOD_TYPES.GOLDEN_APPLE.spawnRate + FOOD_TYPES.BANANA.spawnRate) {
            foodType = FOOD_TYPES.BANANA.type;
        } else {
            foodType = FOOD_TYPES.APPLE.type;
        }

        const foodItem = new FoodItem(foodType, position.x, position.y);
        this.foodItems.push(foodItem);
    }

    isPositionOccupied(position, occupiedPositions) {
        // Check if position is occupied by existing food
        for (const food of this.foodItems) {
            if (food.position.x === position.x && food.position.y === position.y) {
                return true;
            }
        }

        // Check if position is occupied by snake segments
        for (const pos of occupiedPositions) {
            if (pos[0] === position.x && pos[1] === position.y) {
                return true;
            }
        }

        return false;
    }

    checkFoodCollision(playerHead) {
        for (let i = this.foodItems.length - 1; i >= 0; i--) {
            const food = this.foodItems[i];
            if (food.position.x === playerHead[0] && food.position.y === playerHead[1]) {
                const eatenFood = this.foodItems.splice(i, 1)[0];
                return eatenFood;
            }
        }
        return null;
    }

    toJSON() {
        return this.foodItems.map(food => food.toJSON());
    }
}

module.exports = { FoodItem, FoodManager };