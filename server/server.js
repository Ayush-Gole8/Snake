const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const GameState = require('./GameState');
const { EVENT_TYPES, DIRECTIONS } = require('../shared/constants');

const app = express();

// Set proper MIME types
express.static.mime.define({'application/javascript': ['js']});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Serve shared files from shared directory
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// Game instance
const game = new GameState();
const clients = new Map(); // Map client WebSocket to player ID

// Set up game event handlers
game.on(EVENT_TYPES.GAME_STATE_UPDATE, (gameState) => {
    broadcast(EVENT_TYPES.GAME_STATE_UPDATE, gameState);
});

game.on(EVENT_TYPES.GAME_COUNTDOWN, (data) => {
    broadcast(EVENT_TYPES.GAME_COUNTDOWN, data);
});

game.on(EVENT_TYPES.PLAYER_JOINED, (data) => {
    broadcast(EVENT_TYPES.PLAYER_JOINED, data);
});

game.on(EVENT_TYPES.PLAYER_LEFT, (data) => {
    broadcast(EVENT_TYPES.PLAYER_LEFT, data);
});

game.on(EVENT_TYPES.GAME_OVER, (data) => {
    broadcast(EVENT_TYPES.GAME_OVER, data);
});

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    // Send current game state to new client
    ws.send(JSON.stringify({
        type: 'game_status',
        payload: {
            state: game.getCurrentState(),
            players: Array.from(game.players.values()).map(p => ({ id: p.id, name: p.name, score: p.score }))
        }
    }));

    ws.on('message', (message) => {
        try {
            const { type, payload } = JSON.parse(message);
            handleClientMessage(ws, type, payload);
        } catch (error) {
            console.error('Error parsing message:', error);
            sendError(ws, 'Invalid message format');
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        const playerId = clients.get(ws);
        if (playerId) {
            game.removePlayer(playerId);
            clients.delete(ws);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

function handleClientMessage(ws, type, payload) {
    switch (type) {
        case EVENT_TYPES.PLAYER_JOIN:
            handlePlayerJoin(ws, payload);
            break;
            
        case EVENT_TYPES.PLAYER_MOVE:
            handlePlayerMove(ws, payload);
            break;
            
        default:
            sendError(ws, `Unknown message type: ${type}`);
    }
}

function handlePlayerJoin(ws, payload) {
    const { playerName } = payload;
    
    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
        sendError(ws, 'Invalid player name');
        return;
    }

    if (playerName.length > 20) {
        sendError(ws, 'Player name too long (max 20 characters)');
        return;
    }

    // Check if player name is already taken
    const existingPlayer = Array.from(game.players.values()).find(p => p.name === playerName.trim());
    if (existingPlayer) {
        sendError(ws, 'Player name already taken');
        return;
    }

    const playerId = uuidv4();
    const success = game.addPlayer(playerId, playerName.trim());
    
    if (success) {
        clients.set(ws, playerId);
        ws.send(JSON.stringify({
            type: 'player_joined_success',
            payload: { playerId, playerName: playerName.trim() }
        }));
    } else {
        sendError(ws, 'Unable to join game (game full or in progress)');
    }
}

function handlePlayerMove(ws, payload) {
    const { direction } = payload;
    const playerId = clients.get(ws);
    
    if (!playerId) {
        sendError(ws, 'Player not registered');
        return;
    }

    const validDirections = Object.values(DIRECTIONS);
    if (!validDirections.includes(direction)) {
        sendError(ws, 'Invalid direction');
        return;
    }

    game.handlePlayerMove(playerId, direction);
}

function broadcast(type, payload) {
    const message = JSON.stringify({ type, payload });
    
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function sendError(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: EVENT_TYPES.ERROR_NOTIFICATION,
            payload: { message }
        }));
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        players: game.players.size,
        gameState: game.getCurrentState(),
        timestamp: new Date().toISOString()
    });
});

// Favicon endpoint
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🐍 Speedy Snake Showdown Server running on port ${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} to play the game`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down server gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Shutting down server gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});