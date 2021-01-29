"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Client {
    constructor(game, id, socket) {
        this.game = game;
        this.id = id;
        this.socket = socket;
    }
    setup() {
        this.socket.on('message', message => {
            try {
                var packet = JSON.parse(message);
                this.onReceivePacket(packet.key, packet.data);
            }
            catch (error) {
                console.log("Error processing packet ", message, error);
            }
        });
        this.socket.on('close', this.onDisconnect.bind(this));
        this.onConnect();
    }
    send(key, data) {
        this.socket.send(JSON.stringify({ key: key, data: data }));
    }
    onReceivePacket(key, data) {
        //console.log(`${this.id}: Received ${key}`, data)
        if (key == "join_server") {
            var packet = data;
            var server;
            if (server = this.game.servers.get(packet.serverId)) {
                server.handleClientJoin(this, data);
            }
            else {
                console.log("Server not found");
            }
        }
        if (key == "characterSync") {
            this.onServer.characterSync(data);
        }
        if (key == "aimSync") {
            this.onServer.aimSync(data);
        }
        if (key == "bulletHit") {
            this.onServer.bulletHit(data);
        }
        if (key == "playerText") {
            this.onServer.playerText(this.player.character, data);
        }
    }
    onConnect() {
        console.log(`Client ${this.id} connected`);
    }
    onDisconnect() {
        console.log(`Client ${this.id} disconnected`);
        if (this.onServer)
            this.onServer.handleClientDisconnect(this);
    }
}
exports.default = Client;
