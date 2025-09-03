🚀 Overview
This project is a web-based implementation of the classic Linux command tail -f. It provides a real-time view of a log file, streaming new log entries to the browser as they are added to the file, without requiring a page refresh.

This application is designed to be lightweight, efficient, and scalable, demonstrating core concepts of real-time web development and Node.js file system handling.

✨ Features
Real-time Updates: New log entries are pushed to the client instantly using WebSockets.

Initial Context: Displays the last 10 lines of the log file when a user first visits the page.

Multi-client Support: Handles multiple concurrent clients, broadcasting updates to all of them.

Efficient File Reading: Reads only the newly added content from the log file, not the entire file on each change. This is crucial for performance with large files.

Simple & Clean UI: A minimalist, terminal-like interface for easy viewing of logs.

💻 Tech Stack
Backend: Node.js, Express.js

Real-time Communication: ws (A popular WebSocket library for Node.js)

Frontend: Vanilla JavaScript, HTML5, CSS3

📁 Project Structure
/log-watcher
|-- public/
|   |-- index.html      # The main frontend page
|   |-- script.js       # Client-side WebSocket logic
|-- server.js           # The core backend server and file watching logic
|-- sample.log          # The log file being monitored
|-- package.json        # Project dependencies and scripts
|-- README.md           # You are here!

⚙️ Setup and Usage
Follow these steps to get the application running on your local machine.

Prerequisites
Node.js (v14 or higher)

npm (comes with Node.js)

1. Clone or Download the Code
Download the project files into a new directory on your machine.

2. Install Dependencies
Open your terminal in the project directory and run:

npm install

This will install express and ws.

3. Run the Server
Start the application with the following command:

node server.js

You should see the message: Server is listening on port 3000.

4. View in Browser
Open your web browser and navigate to:

http://localhost:3000/log

You will see the last 10 lines from sample.log.

5. Test Real-time Updates
To see the real-time functionality in action, open a separate terminal (do not close the server terminal) and run this command to append a new line to the log file:

echo "A new log entry at $(date)" >> sample.log

As soon as you press Enter, the new line will instantly appear in your browser window without a refresh. You can open multiple browser tabs to verify that all clients receive the update.

🛠️ How It Works: A Detailed Code Breakdown
This section provides a line-by-line explanation of the core logic in both the backend (server.js) and frontend (public/script.js).

Backend (server.js)
The backend is responsible for watching the file, managing client connections, and broadcasting updates.

// server.js

// 1. Import necessary libraries
// 'express' for creating the web server.
// 'http' to create an HTTP server, which is needed to host the WebSocket server.
// 'ws' is the WebSocket library for real-time communication.
// 'fs' (File System) for reading and watching the log file.
// 'path' to handle file and directory paths correctly.
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// 2. Setup Server and WebSocket
const app = express();
// Create an HTTP server from the Express app. This is a crucial step.
const server = http.createServer(app); 
// Create a WebSocket server and attach it to the HTTP server.
const wss = new WebSocket.Server({ server }); 

const LOG_FILE_PATH = path.join(__dirname, 'sample.log');

// 3. Serve the frontend files
// This tells Express to serve static files (like HTML, CSS, JS) from the 'public' directory.
app.use(express.static(path.join(__dirname, 'public')));

// Create a specific route for '/log' to serve our main HTML page.
app.get('/log', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 4. WebSocket Connection Logic
// This event listener runs whenever a new client connects to the WebSocket server.
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Step A: Send last 10 lines to the newly connected client
    // Read the entire log file asynchronously.
    fs.readFile(LOG_FILE_PATH, 'utf8', (err, data) => {
        if (err) {
            ws.send('Error reading log file.');
            return;
        }
        // Split the file content into an array of lines.
        const lines = data.trim().split('\n');
        // Get the last 10 elements from the array.
        const last10Lines = lines.slice(-10).join('\n');
        // Send these 10 lines ONLY to the client that just connected.
        ws.send(last10Lines);
    });

    // This event listener runs when a client disconnects.
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// 5. File Watching Logic
// Get the initial size of the log file to know where to start reading from later.
let lastSize = fs.statSync(LOG_FILE_PATH).size; 

// Use Node.js's native, efficient file watcher.
fs.watch(LOG_FILE_PATH, (eventType, filename) => {
    // We only care about the 'change' event.
    if (eventType === 'change') {
        // Step B: Read only the new content and broadcast to all clients
        // Get the latest stats of the file (including its new size).
        fs.stat(LOG_FILE_PATH, (err, stats) => {
            if (err) return;

            // If the file's new size is greater, it means new content was added.
            if (stats.size > lastSize) {
                // Create a read stream to read ONLY the new part of the file.
                // We start reading from the last known size (`lastSize`).
                const stream = fs.createReadStream(LOG_FILE_PATH, { start: lastSize, end: stats.size });
                
                // As the new data chunk is read...
                stream.on('data', (chunk) => {
                    const newData = chunk.toString('utf8');
                    // ...broadcast it to ALL connected clients.
                    wss.clients.forEach((client) => {
                        // Check if the client's connection is still open before sending.
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(newData);
                        }
                    });
                });
                // Update `lastSize` to the new file size for the next change.
                lastSize = stats.size;
            }
        });
    }
});


// 6. Start the server
const PORT = 3000;
// Start the HTTP server (which also starts the WebSocket server).
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

Frontend (public/script.js)
The frontend script is simple. It connects to the WebSocket server and displays any messages it receives.

// script.js

// Get the HTML element where we will display the logs.
const logContainer = document.getElementById('log-container');

// Construct the WebSocket URL. It's the same host, but with 'ws://' protocol.
const wsUrl = `ws://${window.location.host}`;
// Create a new WebSocket object to connect to the server.
const socket = new WebSocket(wsUrl);

// This function runs once the connection is successfully established.
socket.onopen = () => {
    console.log('WebSocket connection established');
};

// This is the most important part: it runs every time a message is received from the server.
socket.onmessage = (event) => {
    // The actual data sent by the server is in 'event.data'.
    const logData = event.data;
    // Append the new log data to our display container, adding a newline.
    logContainer.textContent += logData + '\n'; 

    // Automatically scroll the page to the bottom to show the latest message.
    window.scrollTo(0, document.body.scrollHeight);
};

// This function runs if there's a connection error.
socket.onerror = (error) => {
    console.error('WebSocket Error:', error);
    logContainer.textContent += 'Error connecting to the server.\n';
};

// This function runs when the connection is closed.
socket.onclose = () => {
    console.log('WebSocket connection closed');
    logContainer.textContent += 'Connection closed.\n';
};

🤔 Discussion Points & Improvements
This section covers key design decisions and potential ways to make the application more robust.

Efficiency (fs.watch vs. fs.watchFile): We use fs.watch because it relies on OS-level events and is more performant than fs.watchFile, which polls the file at regular intervals.

Log Rotation/Truncation: The current implementation does not handle log rotation (when the file is emptied). This could be fixed by adding a check: if newSize < lastSize, reset lastSize to 0 and notify clients.

Handling Large Files (Initial Load): For multi-GB files, reading the entire file to get the last 10 lines is inefficient. A better approach would be to read the file in small chunks from the end until 10 newline characters are found.

Error Handling: More robust error handling can be added, such as handling the case where the log file is deleted and recreated while the server is running.

Scalability: To handle thousands of users, the application could be scaled horizontally with a load balancer. A message bus like Redis Pub/Sub or Kafka could be used to publish file changes to all server instances, which then forward them to their respective clients.
