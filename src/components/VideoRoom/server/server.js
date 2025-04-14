// IMPORTING ALL NECESSARY MODULES AND LIBRARIES

// express peerjs server
const { ExpressPeerServer } = require('peer');  // function used to create PeerJS server
// express - web framework for Node.js
const express = require('express');
// http - core Node.js module to create an HTTP server
const http = require('http');

// CREATING SERVER AND SETTING UP APPLICATION

// creating an instance of Express application
const app = express(); // app - will be used to define routes and middleware for the web server

// create an HTTP server by passing the Express 'app' object to 'http.createServer()'
const server = http.createServer(app);

// set up PeerJS server on top of existing Express server
const peerServer = ExpressPeerServer(server, {
    path: '/videocall', // Path for PeerJS
});

// mount the PeerJS server on the '/peerjs' path ofC the Express application
app.use('/peerjs', peerServer);

// Serve the connection tracker UI
app.use(express.static('public'));

server.listen(9000, () => {
    console.log('Server started on http://localhost:9000');
});

// manage peerjs connections

let connectedClients = [];

peerServer.on('connection', (client) => {
    console.log('Client connected. Client id:', client.getId());

    connectedClients.push(client.getId());
});

peerServer.on('disconnect', (client) => {
    console.log('Client disconnected. Client id:', client.getId());
    connectedClients = connectedClients.filter(id => id !== client.getId()); // Remove the client ID from the array
});