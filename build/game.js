"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
const server_1 = require("./server");
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
        var serverMain = this.createServer("main", { maxPlayers: 69, id: "main" });
        //var serverTest = this.createServer("test", {maxPlayers: 0});
        setInterval(() => this.update.bind(this)(), 0);
    }
    update() {
        this.servers.forEach((server) => {
            server.update();
        });
    }
    createServer(name, options = {}) {
        var server = new server_1.default(this);
        server.name = name;
        server.id = "SERVER:" + this.getRandomId();
        for (const k in options) {
            console.log(k);
            server[k] = options[k];
        }
        this.servers.set(server.id, server);
        server.start();
        return server;
    }
    getServersList() {
        var list = [];
        this.servers.forEach((server) => {
            list.push({
                id: server.id,
                name: server.name,
                players: server.clients.size,
                maxPlayers: server.maxPlayers
            });
        });
        return list;
    }
    onSocketConnect(socket) {
        var client = this.createClient(socket);
        console.log("Connected " + client.id);
        socket.on('message', function (message) {
            var msg = JSON.parse(message);
            client.onReceiveMessage(msg.key, msg.data);
        });
        socket.on('close', function () {
            client.onDisconnect();
        });
        //autoconnect
        this.servers.forEach((server) => {
            //server.handleJoinRequest(client);
        });
    }
    createClient(socket) {
        var client = new client_1.default(this, "CLIENT:" + this.getRandomId(), socket);
        this.clients.set(client.id, client);
        return client;
    }
    getRandomId() {
        return "" + Math.round(Math.random() * 99999999);
    }
}
exports.default = Game;
