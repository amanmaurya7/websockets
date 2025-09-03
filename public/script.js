// script.js
const logContainer = document.getElementById('log-container');

// URL mein 'http' ko 'ws' se replace karna hai
const wsUrl = `ws://${window.location.host}`;
const socket = new WebSocket(wsUrl);

socket.onopen = () => {
    console.log('WebSocket connection established');
};

// Yeh function tab chalega jab server se koi message aayega
socket.onmessage = (event) => {
    // event.data mein server ka bheja hua text hota hai
    const logData = event.data;
    logContainer.textContent += logData + '\n'; // Naye data ko container mein jod do

    // Automatically scroll to the bottom
    window.scrollTo(0, document.body.scrollHeight);
};

socket.onerror = (error) => {
    console.error('WebSocket Error:', error);
    logContainer.textContent += 'Error connecting to the server.\n';
};

socket.onclose = () => {
    console.log('WebSocket connection closed');
    logContainer.textContent += 'Connection closed.\n';
};
