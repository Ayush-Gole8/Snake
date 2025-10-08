#!/usr/bin/env node

const http = require('http');
const WebSocket = require('ws');

console.log('🧪 Testing Speedy Snake Showdown Server...\n');

// Test 1: HTTP Server Health Check
function testHttpServer() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/health',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('✅ HTTP Server: OK');
                    console.log(`   Status: ${response.status}`);
                    console.log(`   Players: ${response.players}`);
                    console.log(`   Game State: ${response.gameState}\n`);
                    resolve(true);
                } catch (e) {
                    console.log('❌ HTTP Server: Invalid response\n');
                    resolve(false);
                }
            });
        });

        req.on('error', () => {
            console.log('❌ HTTP Server: Not responding\n');
            resolve(false);
        });

        req.end();
    });
}

// Test 2: WebSocket Connection
function testWebSocket() {
    return new Promise((resolve) => {
        try {
            const ws = new WebSocket('ws://localhost:3000');
            
            ws.on('open', () => {
                console.log('✅ WebSocket: Connection established');
                
                // Test join game message
                ws.send(JSON.stringify({
                    type: 'player_join',
                    payload: { playerName: 'TestPlayer' }
                }));
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    if (message.type === 'player_joined_success') {
                        console.log('✅ WebSocket: Player join successful');
                        console.log(`   Player ID: ${message.payload.playerId}\n`);
                        ws.close();
                        resolve(true);
                    }
                } catch (e) {
                    console.log('❌ WebSocket: Invalid message format\n');
                    ws.close();
                    resolve(false);
                }
            });

            ws.on('error', () => {
                console.log('❌ WebSocket: Connection failed\n');
                resolve(false);
            });

            setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
                console.log('⏰ WebSocket: Test timeout\n');
                resolve(false);
            }, 5000);

        } catch (e) {
            console.log('❌ WebSocket: Cannot connect\n');
            resolve(false);
        }
    });
}

// Test 3: Static File Serving
function testStaticFiles() {
    return new Promise((resolve) => {
        const testPaths = ['/', '/shared/constants.js'];
        let completed = 0;
        let passed = 0;

        testPaths.forEach(path => {
            const options = {
                hostname: 'localhost',
                port: 3000,
                path: path,
                method: 'GET'
            };

            const req = http.request(options, (res) => {
                completed++;
                if (res.statusCode === 200) {
                    passed++;
                    console.log(`✅ Static File: ${path} - OK`);
                } else {
                    console.log(`❌ Static File: ${path} - Status ${res.statusCode}`);
                }

                if (completed === testPaths.length) {
                    console.log(`\n📊 Static Files: ${passed}/${testPaths.length} passed\n`);
                    resolve(passed === testPaths.length);
                }
            });

            req.on('error', () => {
                completed++;
                console.log(`❌ Static File: ${path} - Request failed`);
                
                if (completed === testPaths.length) {
                    console.log(`\n📊 Static Files: ${passed}/${testPaths.length} passed\n`);
                    resolve(passed === testPaths.length);
                }
            });

            req.end();
        });
    });
}

// Run all tests
async function runTests() {
    console.log('Starting server tests...\n');
    
    const httpTest = await testHttpServer();
    const wsTest = await testWebSocket();
    const staticTest = await testStaticFiles();
    
    console.log('🎯 Test Results Summary:');
    console.log(`   HTTP Server: ${httpTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   WebSocket: ${wsTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Static Files: ${staticTest ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = httpTest && wsTest && staticTest;
    console.log(`\n🏆 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
        console.log('\n🎮 Server is ready! Open http://localhost:3000 to play!');
    } else {
        console.log('\n🔧 Please check server configuration and try again.');
    }
    
    process.exit(allPassed ? 0 : 1);
}

runTests();