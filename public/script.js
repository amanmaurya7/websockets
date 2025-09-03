// public/script.js
const logContent = document.getElementById('log-content');

// Connect to the WebSocket server we just made
const socket = new WebSocket(`ws://${window.location.host}`);

// This runs every time the server sends us a message
socket.onmessage = (event) => {
    // Just add the new text to our page
    logContent.textContent += event.data + '\n';
    // And scroll to the bottom to see the latest
    window.scrollTo(0, document.body.scrollHeight);
};

socket.onopen = () => console.log('Connected to log server!');
socket.onclose = () => console.log('Disconnected from log server.');
