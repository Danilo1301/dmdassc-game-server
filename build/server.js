"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketUpdateNametag = exports.PacketDialogResponse = exports.PacketShowDialog = exports.PacketSetCharacterPosition = exports.PacketBulletHit = exports.PacketJoinServerStatus = exports.PacketJoinServer = void 0;
const entityCharacter_1 = require("./entityCharacter");
const player_1 = require("./player");
const utils_1 = require("./utils");
const weapon_1 = require("./weapon");
const vm = require('vm');
class PacketJoinServer {
    constructor() {
        this.serverId = "";
        this.nickname = "";
        this.version = 0;
    }
}
exports.PacketJoinServer = PacketJoinServer;
class PacketJoinServerStatus {
    constructor() {
        this.success = false;
        this.playerId = 0;
        this.weapons = [];
        this.updateRate = 0;
    }
}
exports.PacketJoinServerStatus = PacketJoinServerStatus;
class PacketBulletHit {
    constructor() {
        this.byCharacterId = -1;
        this.toCharacterId = -1;
        this.toVehicleId = -1;
        this.damage = 0.0;
    }
}
exports.PacketBulletHit = PacketBulletHit;
class PacketSetCharacterPosition {
    constructor() {
        this.id = -1;
        this.position = new utils_1.Vector3();
    }
}
exports.PacketSetCharacterPosition = PacketSetCharacterPosition;
class PacketShowDialog {
    constructor() {
        this.dialogId = 0;
        this.style = 0;
        this.title = "";
        this.info = "";
        this.button1 = "";
        this.button2 = "";
    }
}
exports.PacketShowDialog = PacketShowDialog;
class PacketDialogResponse {
    constructor() {
        this.dialogId = 0;
        this.response = 0;
        this.listitem = 0;
        this.inputtext = "";
    }
}
exports.PacketDialogResponse = PacketDialogResponse;
class PacketUpdateNametag {
    constructor() {
        this.id = 0;
        this.text = "";
    }
}
exports.PacketUpdateNametag = PacketUpdateNametag;
class Server {
    constructor(game, id) {
        this.name = "";
        this.maxPlayers = 10;
        this.weapons = [];
        this.clients = new Map();
        this.players = new Map();
        this.characters = new Map();
        this.sendPacketRate = 0.010;
        this.clientSendPacketRate = 0.010;
        this._lastSentPacket = 0;
        this.sandbox = {};
        this.game = game;
        this.id = id;
        var ak47 = new weapon_1.WeaponInfo();
        ak47.name = "AK-47";
        ak47.modelName = "ak47";
        ak47.muzzlePosition = new utils_1.Vector3(0, 0.233, 0.834);
        this.weapons.push(ak47);
        var pistol = new weapon_1.WeaponInfo();
        pistol.name = "Pistol";
        pistol.type = weapon_1.WEAPON_TYPE.PISTOL;
        pistol.modelName = "pistol";
        pistol.muzzlePosition = new utils_1.Vector3(0, 0.171, 0.353);
        this.weapons.push(pistol);
        var carGun = new weapon_1.WeaponInfo();
        carGun.name = "CarGun";
        carGun.modelName = "vehicle0";
        carGun.muzzlePosition = new utils_1.Vector3(0, 0.171, 0.353);
        this.weapons.push(carGun);
    }
    setup() {
        console.log(`Server '${this.name}' (${this.id}) created`);
        setInterval(this.update.bind(this), 0);
        this.loadScript(`

        let DIALOG_CHANGE_NICK = 0;
        

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

            if(message.toLowerCase() == "/help")
            {
                sendClientMessage(playerid, "{FFFF00}============ Commands ========================");
                sendClientMessage(playerid, "> /nick - Change your nick");
                sendClientMessage(playerid, "{FFFF00}==============================================");

                return false;
            }

            if(message.toLowerCase() == "/nick")
            {
                showChangeNickDialog(playerid);

                return false;
            }
            
        };

        function onPlayerConnect(playerid) {
            setPlayerNickname(playerid, "NiceName");

            sendClientMessage(playerid, "{FFFF00}==============================================");
            sendClientMessage(playerid, "Welcome, " + getPlayerNickname(playerid) + "!");
            sendClientMessage(playerid, "Type {FF0000}/help {FFFFFF}to a list of commands");
            sendClientMessage(playerid, "{FFFF00}==============================================");

            showChangeNickDialog(playerid);
        }

        function onDialogResponse(playerid, dialogid, response, listitem, inputtext)
        {
            if (dialogid == DIALOG_CHANGE_NICK)
            {
                if(response && inputtext.length > 0)
                {
                    setPlayerNickname(playerid, inputtext);

                    sendClientMessage(playerid, "{FFFF00}You changed your nick to {FFFFFF}" + inputtext);

                    
                }
            }


        }

        function showChangeNickDialog(playerid)
        {
            showPlayerDialog(playerid, DIALOG_CHANGE_NICK, 0, "Change Nickname", "Type your new nickname below", "Ok", "Cancel");
        }

        `);
    }
    showPlayerDialog(playerId, dialogId, style, title, info, button1, button2) {
        var packet = new PacketShowDialog();
        packet.dialogId = dialogId;
        packet.style = style;
        packet.title = title;
        packet.info = info;
        packet.button1 = button1;
        packet.button2 = button2;
        var client = this.players.get(playerId).client;
        client.send("onShowDialog", packet);
    }
    loadScript(code) {
        var server = this;
        this.sandbox = {};
        this.sandbox.log = function (text) { console.log(`[LOG: ${server.id}] ${text}`); };
        var funcs = ["showPlayerDialog", "setPlayerNickname", "sendClientMessageToAll", "sendClientMessage", "setCharacterPosition", "getPlayerNickname"];
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
    callScriptFunction(name, args = []) {
        if (!this.sandbox[name]) {
            return true;
        }
        var result = this.sandbox[name].apply(null, args) === false ? false : true;
        return result;
    }
    update() {
        this.players.forEach(player => {
            player.checkForStreamedEntities();
        });
        var time = (new Date()).getTime();
        if (time - this._lastSentPacket > this.sendPacketRate * 1000) {
            //console.log(time - this._lastSentPacket)
            this._lastSentPacket = time;
            this.clients.forEach(client => {
                for (const packet of client.storedPackets) {
                    client.socket.send(JSON.stringify({ index: packet[2], key: packet[0], data: packet[1] }));
                }
                client.storedPackets = [];
            });
        }
    }
    getPlayerNickname(playerId) {
        var player = this.players.get(playerId);
        if (!player) {
            return "";
        }
        return player.nickname;
    }
    setPlayerNickname(playerId, nickname) {
        var player = this.players.get(playerId);
        player.nickname = nickname;
        this.sendOnUpdateNametag(player);
    }
    handleClientJoin(client, joinPacket) {
        var packet = new PacketJoinServerStatus();
        if (this.clients.has(client.id)) {
            packet.success = false;
        }
        else {
            client.onServer = this;
            this.clients.set(client.id, client);
            var character = this.createCharacter();
            var player = this.createPlayer(client);
            player.nickname = joinPacket.nickname;
            player.character = character;
            character.player = player;
            player.setup();
            packet.success = true;
            packet.playerId = player.id;
            packet.weapons = this.weapons;
            packet.updateRate = this.clientSendPacketRate;
            this.onPlayerConnect(player);
        }
        client.send("onJoinServerStatus", packet);
    }
    onPlayerConnect(player) {
        if (this.callScriptFunction("onPlayerConnect", [player.id])) {
            this.sendClientMessageToAll(`{00A010}${player.nickname} joined`);
        }
    }
    onPlayerDisconnect(player) {
        if (this.callScriptFunction("onPlayerDisconnect", [player.id])) {
            this.sendClientMessageToAll(`{9B4844}${player.nickname} left`);
        }
    }
    createCharacter() {
        var character = new entityCharacter_1.default();
        character.id = 0;
        while (this.characters.has(character.id))
            character.id++;
        this.characters.set(character.id, character);
        return character;
    }
    handleClientDisconnect(client) {
        this.clients.delete(client.id);
        this.players.delete(client.player.id);
        this.characters.delete(client.player.character.id);
        this.onPlayerDisconnect(client.player);
    }
    createPlayer(client) {
        var player = new player_1.default(client, 0);
        player.id = 0;
        while (this.players.has(player.id))
            player.id++;
        client.player = player;
        this.players.set(player.id, player);
        return player;
    }
    sendOnCharacterStreamIn(forClient, character) {
        var packet = new entityCharacter_1.PacketCharacterStreamIn();
        packet.id = character.id;
        packet.nickname = character.player ? character.player.nickname : "Bot " + character.id;
        packet.position = character.position;
        packet.playerId = character.player ? character.player.id : -1;
        forClient.send("onCharacterStreamIn", packet);
    }
    characterSync(data) {
        var character = this.characters.get(data.id);
        character.position = data.position;
        character.upDownKeys = data.upDownKeys;
        character.leftRightKeys = data.leftRightKeys;
        character.aimDir = data.aimDir;
        //character.health = data.health;
        this.executeForAllClients((client) => {
            this.sendOnCharacterSync(client, character);
        });
    }
    executeForAllClients(arg0) {
        this.clients.forEach(c => {
            arg0(c);
        });
    }
    sendOnCharacterSync(forClient, character) {
        var packet = new entityCharacter_1.PacketCharacterSync();
        packet.id = character.id;
        packet.position = character.position;
        packet.rotation = character.rotation;
        packet.upDownKeys = character.upDownKeys;
        packet.leftRightKeys = character.leftRightKeys;
        packet.aimDir = character.aimDir;
        packet.health = character.health;
        forClient.send("onCharacterSync", packet);
    }
    aimSync(data) {
        var character = this.characters.get(data.id);
        character.isAiming = data.aiming;
        character.weaponId = data.weaponId;
        this.executeForAllClients((client) => {
            this.sendOnAimSync(client, character, data.hasShot);
        });
    }
    sendOnAimSync(forClient, character, hasShot) {
        var packet = new entityCharacter_1.PacketAimSync();
        packet.id = character.id;
        packet.aiming = character.isAiming;
        packet.hasShot = hasShot;
        packet.weaponId = character.weaponId;
        forClient.send("onAimSync", packet);
    }
    sendOnUpdateNametag(player) {
        var packet = new PacketUpdateNametag();
        packet.id = player.character.id;
        packet.text = player.nickname;
        this.executeForAllClients((client) => {
            client.send("onUpdateNametag", packet);
        });
    }
    bulletHit(data) {
        var byCharacter = this.characters.get(data.byCharacterId);
        var toCharacter = this.characters.get(data.toCharacterId);
        var weapon = this.weapons[byCharacter.weaponId];
        toCharacter.health -= weapon.damage;
        if (toCharacter.health <= 0) {
            toCharacter.health = 100;
            this.sendClientMessageToAll(`{FFA300}${byCharacter.player.nickname} killed ${toCharacter.player.nickname} using ${weapon.name}`);
            this.setPlayerPosition(toCharacter.player.id, 0, 5, 0);
        }
    }
    setPlayerPosition(playerId, x, y, z) {
        var player = this.players.get(playerId);
        var packet = new PacketSetCharacterPosition();
        packet.id = player.character.id;
        packet.position.x = x;
        packet.position.y = y;
        packet.position.z = z;
        this.executeForAllClients((client) => {
            client.send("onSetCharacterPosition", packet);
        });
    }
    playerText(player, text) {
        if (this.callScriptFunction("onPlayerText", [player.id, text])) {
            this.sendClientMessageToAll(`{D8C99C}${player.nickname}{FFFFFF}[${player.id}]: ${text}`);
        }
    }
    dialogResponse(player, data) {
        console.log("dialogResponse", data);
        if (this.callScriptFunction("onDialogResponse", [player.id, data.dialogId, data.response, data.listitem, data.inputtext])) {
            console.log("dialog response yay");
        }
    }
    sendClientMessageToAll(text) {
        this.executeForAllClients((client) => {
            this.sendClientMessage(client.player.id, text);
        });
    }
    sendClientMessage(playerId, text) {
        var client = this.players.get(playerId).client;
        client.send("onChatMessage", text);
    }
}
exports.default = Server;
