// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const LOG_FILE = path.join(__dirname, 'sample.log');

// Serve our simple webpage
app.use(express.static(path.join(__dirname, 'public')));
app.get('/log', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// This runs whenever a new webpage connects to us
wss.on('connection', (ws) => {
    console.log('A client connected!');

    // First, send the last 10 lines to the new client.
    // This function is optimized for large files.
    readLastLines(LOG_FILE, 10)
        .then(lines => ws.send(lines.join('\n')))
        .catch(() => ws.send('Error reading the log file.'));
    
    ws.on('close', () => console.log('A client disconnected.'));
});

// Now, let's watch the file for any changes
let lastSize = fs.statSync(LOG_FILE).size;
fs.watch(LOG_FILE, (eventType) => {
    if (eventType === 'change') {
        const stats = fs.statSync(LOG_FILE);
        // If the file grew, read the new part
        if (stats.size > lastSize) {
            const stream = fs.createReadStream(LOG_FILE, { start: lastSize, end: stats.size });
            stream.on('data', (chunk) => {
                const newData = chunk.toString();
                // Send the new data to every connected client
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(newData);
                    }
                });
            });
            lastSize = stats.size; // Update the size for next time
        }
    }
});

// A special function to efficiently get the last N lines from a potentially huge file
async function readLastLines(filePath, lineCount) {
    const stats = fs.statSync(filePath);
    let buffer = Buffer.alloc(1024);
    const fd = fs.openSync(filePath, 'r');
    let lines = [];
    let position = stats.size;

    while (position > 0 && lines.length <= lineCount) {
        const readSize = Math.min(position, buffer.length);
        position -= readSize;
        fs.readSync(fd, buffer, 0, readSize, position);
        const chunk = buffer.slice(0, readSize).toString();
        lines = chunk.split('\n').concat(lines);
    }
    fs.closeSync(fd);
    // Remove empty lines and return the last N lines
    return lines.filter(line => line).slice(-lineCount);
}

// Start the server
const PORT = 3000;
server.listen(PORT, () => console.log(`Server is live at http://localhost:${PORT}/log`));
