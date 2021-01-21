"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
class StreamEntitiesHelper {
    constructor(client) {
        this.streamedEntities = new Map();
        this.client = client;
    }
    check() {
        var character = this.client.character;
        var server = this.client.onServer;
        if (!character || !server) {
            return;
        }
        server.entities.forEach((entity) => {
            var distance = utils_1.getDistanceBetweemCoords(character.position.x, character.position.z, entity.position.x, entity.position.z);
            if (distance < 15) {
                if (!this.streamedEntities.has(entity.id)) {
                    this.streamedEntities.set(entity.id, entity);
                    server.broadcastEntity(entity);
                    console.log(`Entity ${entity.id} streamed in for ${character.id}`);
                }
            }
            else {
                if (this.streamedEntities.has(entity.id)) {
                    this.client.send("delete_entity", entity.id);
                    this.streamedEntities.delete(entity.id);
                    console.log(`Entity ${entity.id} streamed out for ${character.id}`);
                }
            }
        });
    }
}
class Client {
    constructor(game, id, socket) {
        this.streamedEntities = new StreamEntitiesHelper(this);
        this.game = game;
        this.id = id;
        this.socket = socket;
    }
    onReceiveMessage(key, data) {
        //console.log(`Client message ${this.id}: ${key}`, data)
        if (key == "get_servers_list")
            return this.send("servers_list", this.game.getServersList());
        if (key == "join_server") {
            var serverId = data;
            var server = this.game.servers.get(serverId);
            server.handleJoinRequest(this);
        }
        if (key == "get_initial_info") {
            this.character = this.onServer.createEntityCharacter();
            this.send("initial_info", { playerId: this.character.id });
            this.checkForStreamedEntities();
            this.onServer.entities.forEach((e) => {
                this.onServer.broadcastEntity(e);
            });
            this.onServer.onPlayerConnect(this);
        }
        if (key == "update_EntityCharacter" || key == "update_EntityVehicle") {
            this.onServer.updateEntity(data);
        }
        if (key == "user_chat") {
            this.onServer.onPlayerText(this, data);
        }
    }
    send(key, data) {
        this.socket.send(JSON.stringify({ key: key, data: data }));
    }
    onDisconnect() {
        if (this.onServer)
            this.onServer.handleDisconnect(this);
        console.log(this.id, "disconnected");
    }
    checkForStreamedEntities() {
        this.streamedEntities.check();
    }
}
exports.default = Client;
