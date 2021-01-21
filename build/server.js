"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const entity_1 = require("./entity");
const utils_1 = require("./utils");
const vm = require('vm');
class TestServerAI1 {
    constructor(server, entity) {
        this.targetPosition = new utils_1.Vector3();
        this.server = server;
        this.entity = entity;
        this.setRandomTargetPosition();
        setInterval(() => {
            this.update();
        }, 5);
        setInterval(() => {
            this.setRandomTargetPosition();
        }, 2000);
    }
    setRandomTargetPosition() {
        this.targetPosition.x = parseFloat((Math.random() * 30 - 15).toFixed(2));
        this.targetPosition.z = parseFloat((Math.random() * 30 - 15).toFixed(2));
    }
    update() {
        this.entity.position.x += (this.targetPosition.x - this.entity.position.x) / 400;
        this.entity.position.z += (this.targetPosition.z - this.entity.position.z) / 400;
        this.server.broadcastEntity(this.entity);
    }
}
function replaceData(from, to) {
    if (to == undefined) {
        return;
    }
    for (const k in from) {
        if (typeof k == "object") {
            replaceData(from[k], to[k]);
            continue;
        }
        to[k] = from[k];
    }
}
class Server {
    constructor(game, id) {
        this.maxPlayers = 10;
        this.clients = new Map();
        this.entities = new Map();
        this.sandbox = {};
        this.lastCheckedStreamed = 0;
        this.lastUpdatedStreamed = 0;
        this.game = game;
        this.id = id;
        new TestServerAI1(this, this.createEntityCharacter());
        this.createEntityVehicle();
        this.createEntityVehicle();
        this.loadScript(`

        log("Script started");

        function onPlayerText(playerid, message) {
            log("CHAT > " + playerid + ": " + message);

            if(message.includes("swear"))
            {
                sendClientMessage(playerid, "| WARNING | We don't like bad words here >:/");
                return false;
            }

            if(message == "/spawn")
            {
                setPlayerPosition(playerid, 0, 0, 0);
                sendClientMessage(playerid, "| INFO | Teleporting to spawn!");
                return false;
            }

            if(message.toLowerCase() == "/car")
            {
                createVehicle(0, 2, 0);
                sendClientMessage(playerid, "| INFO | Vehicle spawned!");
                return false;
            }
            
        };

        function onPlayerConnect(playerid) {
            sendClientMessage(playerid, "========== ==========");
            sendClientMessage(playerid, "* Welcome, " + playerid);
            sendClientMessage(playerid, "* Type /car to spawn a car");
            sendClientMessage(playerid, "========== ==========");

            //sendClientMessageToAll("A player connected!");
        }

        `);
    }
    updateEntity(data) {
        if (!this.entities.has(data.id)) {
            return;
        }
        var entity = this.entities.get(data.id);
        replaceData(data, entity);
        this.broadcastEntity(entity);
    }
    broadcastEntity(entity) {
        //console.log(`Broadcast ${entity.id} (${entity.constructor.name})`)
        this.clients.forEach((client) => {
            if (client.streamedEntities.streamedEntities.has(entity.id)) {
                //console.log(`Sending to ${client.id}`)
                client.send("data_" + entity.constructor.name, entity);
            }
        });
    }
    callScriptFunction(name, args = []) {
        if (!this.sandbox[name]) {
            return true;
        }
        var result = this.sandbox[name].apply(null, args) === false ? false : true;
        return result;
    }
    loadScript(code) {
        var server = this;
        this.sandbox = {};
        this.sandbox.log = function (text) { console.log(`[LOG: ${server.id}] ${text}`); };
        var funcs = ["sendClientMessageToAll", "sendClientMessage", "setPlayerPosition", "createVehicle"];
        for (const k of funcs) {
            this.sandbox[k] = function () {
                return server[k].bind(server).apply(null, arguments);
            };
        }
        try {
            vm.createContext(this.sandbox);
            vm.runInContext(code, this.sandbox);
        }
        catch (e) {
            console.log("Could not start server", e);
        }
    }
    destroyEntity(entity) {
        console.log(`Destroyed entity ${entity.id}`);
        this.entities.delete(entity.id);
        this.clients.forEach((client) => {
            client.send("delete_entity", entity.id);
        });
    }
    setPlayerPosition(clientId, x, y, z) {
        console.error("not defined");
        //var client = this.clients.get(clientId)!;
        //var character = client.character;
        //character.position.x = x;
        //character.position.y = y;
        //character.position.z = z;
    }
    sendClientMessageToAll(message) {
        this.clients.forEach((client) => {
            this.sendClientMessage(client.id, message);
        });
    }
    createVehicle(x, y, z) {
        this.createEntityVehicle();
    }
    sendClientMessage(clientid, message) {
        this.clients.get(clientid).send("chat_message", message);
    }
    handleJoinRequest(client) {
        this.clients.set(client.id, client);
        client.onServer = this;
        client.send("join_server_status", true);
    }
    handleDisconnect(client) {
        this.destroyEntity(client.character);
        this.clients.delete(client.id);
        //this.entities.splice(this.entities.indexOf(client.character), 1);
        this.onPlayerDisconnect(client);
    }
    createEntityCharacter() {
        var entity = new entity_1.EntityCharacter();
        entity.position.x = parseFloat((Math.random() * 6 - 3).toFixed(2));
        entity.position.y = 1;
        entity.position.z = parseFloat((Math.random() * 6 - 3).toFixed(2));
        this.setEntityId(entity);
        return entity;
    }
    createEntityVehicle() {
        var entity = new entity_1.EntityVehicle();
        entity.position.x = parseFloat((Math.random() * 6 - 3).toFixed(2));
        entity.position.y = 1;
        entity.position.z = parseFloat((Math.random() * 6 - 3).toFixed(2));
        this.setEntityId(entity);
        return entity;
    }
    onPlayerConnect(client) {
        if (this.callScriptFunction("onPlayerConnect", [client.id])) {
            this.sendClientMessageToAll("[<] " + client.id + " joined");
        }
    }
    onPlayerDisconnect(client) {
        if (this.callScriptFunction("onPlayerDisconnect", [client.id])) {
            this.sendClientMessageToAll("[<] " + client.id + " left");
        }
    }
    setEntityId(entity) {
        var ids = [];
        this.entities.forEach((e) => {
            ids.push(e.id);
        });
        entity.id = 0;
        while (ids.includes(entity.id)) {
            console.log(`${entity.id} already in use`);
            entity.id++;
        }
        console.log(`Chosen ID: ${entity.id}`);
        this.entities.set(entity.id, entity);
    }
    onPlayerText(client, message) {
        if (this.callScriptFunction("onPlayerText", [client.id, message])) {
            this.sendClientMessageToAll(client.id + ": " + message);
        }
    }
    update() {
        var time = new Date().getTime();
        if (time - this.lastCheckedStreamed >= 1000) {
            //console.log(`Checking for streamed entities`)
            this.lastCheckedStreamed = time;
            this.clients.forEach((client) => {
                client.checkForStreamedEntities();
            });
        }
    }
}
exports.default = Server;
