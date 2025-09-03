// server.js

// 1. Import necessary libraries
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// 2. Setup Server and WebSocket
const app = express();
const server = http.createServer(app); // Express server ko http server mein wrap karna zaroori hai WebSocket ke liye
const wss = new WebSocket.Server({ server }); // WebSocket server ko http server se attach karna

const LOG_FILE_PATH = path.join(__dirname, 'sample.log');

// 3. Serve the frontend files
// Jab koi 'http://localhost:3000/' pe jaayega, to 'public' folder ki files serve hongi
app.use(express.static(path.join(__dirname, 'public')));

// Jab koi specifically '/log' pe jaayega, to hum 'index.html' bhejenge
app.get('/log', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 4. WebSocket Connection Logic
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Step A: Send last 10 lines to the newly connected client
    fs.readFile(LOG_FILE_PATH, 'utf8', (err, data) => {
        if (err) {
            ws.send('Error reading log file.');
            return;
        }
        const lines = data.trim().split('\n');
        const last10Lines = lines.slice(-10).join('\n');
        ws.send(last10Lines); // Sirf naye client ko bhej rahe hain
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// 5. File Watching Logic
let lastSize = fs.statSync(LOG_FILE_PATH).size; // File ka initial size store karlo

fs.watch(LOG_FILE_PATH, (eventType, filename) => {
    if (eventType === 'change') {
        // Step B: Read only the new content and broadcast to all clients
        fs.stat(LOG_FILE_PATH, (err, stats) => {
            if (err) return;

            // Agar file ka size badha hai, tabhi naya content hai
            if (stats.size > lastSize) {
                const stream = fs.createReadStream(LOG_FILE_PATH, { start: lastSize, end: stats.size });
                stream.on('data', (chunk) => {
                    const newData = chunk.toString('utf8');
                    // Broadcast new data to all connected clients
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(newData);
                        }
                    });
                });
                lastSize = stats.size; // Size ko update kardo
            }
        });
    }
});


// 6. Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
