"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
const server_1 = require("./server");
const utils_1 = require("./utils");
class Game {
    constructor() {
        this.clients = new Map();
        this.servers = new Map();
    }
    start() {
        let WebSocket = require('ws');
        let wss = new WebSocket.Server({ port: 3000, 'Access-Control-Allow-Origin': "*" });
        console.log("Game.start()");
        wss.on('connection', this.onSocketConnect.bind(this));
        var serverMain = this.createServer("Main Server", { maxPlayers: 69, id: "main" });
    }
    onSocketConnect(socket) {
        var client = this.createClient(socket);
        client.setup();
    }
    createClient(socket) {
        var client = new client_1.default(this, "client_" + utils_1.getRandomId(10), socket);
        this.clients.set(client.id, client);
        return client;
    }
    createServer(name, options) {
        var server = new server_1.default(this, "server_" + utils_1.getRandomId(10));
        server.name = name;
        for (const k in options) {
            server[k] = options[k];
        }
        this.servers.set(server.id, server);
        server.setup();
        return server;
    }
}
exports.default = Game;
