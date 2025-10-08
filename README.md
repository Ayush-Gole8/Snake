# 🐍 Speedy Snake Showdown

A fast-paced, competitive multiplayer snake game where players compete to score the most points by eating valuable food within a one-minute time limit.

## 🎮 Game Features

- **Multiplayer Support**: 2-8 players can join the same game
- **Timed Arena**: 60-second matches for intense competition
- **Multiple Food Types**: 
  - 🍎 Apple (10 points) - Common
  - 🍌 Banana (25 points) - Uncommon  
  - ✨ Golden Apple (100 points) - Rare
- **Real-time Gameplay**: WebSocket-based communication for smooth multiplayer experience
- **Collision Detection**: Players are eliminated when hitting walls, themselves, or other players
- **Live Scoreboard**: Real-time player rankings and scores

## 🚀 Quick Start

### Prerequisites
- Node.js (version 16 or higher)
- A modern web browser

### Installation & Running

1. **Clone or download this project**

2. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Start the game server:**
   ```bash
   npm start
   ```

4. **Open your browser and navigate to:**
   ```
   http://localhost:3000
   ```

5. **Invite friends to join** by sharing the same URL!

## 🎯 How to Play

1. **Join the Game**: Enter your player name and click "Join Game"
2. **Wait for Players**: Minimum 2 players needed to start
3. **Get Ready**: 5-second countdown before the game begins
4. **Control Your Snake**: 
   - Use **WASD** or **Arrow Keys** to move
   - Eat food to grow and score points
   - Avoid walls, yourself, and other players
5. **Compete**: Score the most points before the 60-second timer runs out!

## 🏗️ Technical Architecture

### Client-Server Architecture
- **Server**: Authoritative game state manager using Node.js + WebSocket
- **Client**: HTML5 Canvas renderer with real-time input handling
- **Communication**: JSON-based WebSocket messages

### Game States
- `WaitingInLobby`: Players can join, waiting for minimum players
- `GameCountdown`: 5-second countdown before game starts
- `GameInProgress`: Active gameplay with real-time updates
- `GameOver`: Displaying final leaderboard

### Server Responsibilities
- Manage complete game lifecycle
- Process player inputs and prevent cheating
- Execute collision detection and scoring
- Broadcast game state at 100ms intervals
- Handle player connections/disconnections

### Client Responsibilities
- Render game visuals on HTML5 Canvas
- Capture and send user input
- Display UI elements (scores, timer, leaderboard)

## 🔧 Configuration

Game settings can be modified in `shared/constants.js`:

```javascript
const GAME_CONSTANTS = {
    BOARD_WIDTH: 50,        // Game board width
    BOARD_HEIGHT: 50,       // Game board height
    TICK_RATE: 100,         // Game update interval (ms)
    GAME_DURATION: 60,      // Game length (seconds)
    MIN_PLAYERS: 2,         // Minimum players to start
    MAX_PLAYERS: 8,         // Maximum players allowed
    INITIAL_SNAKE_LENGTH: 3 // Starting snake size
};
```

## 📁 Project Structure

```
snakeMultiplayer/
├── server/                 # Server-side code
│   ├── server.js          # Main server & WebSocket handling
│   ├── GameState.js       # Game state management
│   ├── Player.js          # Player class & snake logic
│   ├── FoodManager.js     # Food spawning & collision
│   └── package.json       # Server dependencies
├── client/                # Client-side code
│   ├── index.html         # Game UI & layout
│   └── game.js           # Canvas rendering & input
├── shared/                # Shared code
│   └── constants.js      # Game constants & types
└── README.md             # This file
```

## 🌐 WebSocket API

### Client → Server Events
- `player_join`: Join game with player name
- `player_move`: Send movement direction

### Server → Client Events
- `game_state_update`: Complete game state (players, food, timer)
- `game_countdown`: Countdown timer updates
- `player_joined`: New player joined notification
- `player_left`: Player disconnected notification
- `game_over`: Final leaderboard results
- `error_notification`: Error messages

## 🎨 Customization

### Visual Customization
- Modify colors in `client/game.js` in the `colors` object
- Adjust canvas size by changing width/height attributes
- Customize CSS styling in `client/index.html`

### Gameplay Customization
- Modify food spawn rates in `FOOD_TYPES` in `shared/constants.js`
- Adjust game timing and board size in `GAME_CONSTANTS`
- Change player limits and game duration

## 🐛 Troubleshooting

### Common Issues

1. **"Unable to join game"**
   - Game might be full (8 players max)
   - Game might already be in progress
   - Check if player name is already taken

2. **Connection Issues**
   - Ensure server is running on port 3000
   - Check firewall settings
   - Try refreshing the browser

3. **Performance Issues**
   - Close other browser tabs
   - Ensure stable internet connection
   - Try reducing the number of players

### Health Check
Visit `http://localhost:3000/health` to see server status and current game information.

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements:

- Add new food types with special effects
- Implement power-ups or special abilities
- Add sound effects and music
- Create different game modes
- Improve visual effects and animations

## 📜 License

This project is licensed under the MIT License - feel free to use and modify as needed.

---

**Have fun playing Speedy Snake Showdown! 🐍🏆**