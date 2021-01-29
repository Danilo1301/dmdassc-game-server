"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketSetCharacterPosition = exports.PacketBulletHit = exports.PacketJoinServerStatus = exports.PacketJoinServer = void 0;
const entityCharacter_1 = require("./entityCharacter");
const player_1 = require("./player");
const utils_1 = require("./utils");
const weapon_1 = require("./weapon");
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
class Server {
    constructor(game, id) {
        this.name = "";
        this.maxPlayers = 10;
        this.weapons = [];
        this.clients = new Map();
        this.players = new Map();
        this.characters = new Map();
        this.game = game;
        this.id = id;
        setInterval(this.update.bind(this), 5);
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
        console.log(this.weapons);
    }
    setup() {
        console.log(`Server '${this.name}' (${this.id}) created`);
    }
    update() {
        this.players.forEach(player => {
            player.checkForStreamedEntities();
        });
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
            player.nickname = joinPacket.nickname + ` (ID ${player.id})`;
            player.character = character;
            character.player = player;
            player.setup();
            packet.success = true;
            packet.playerId = player.id;
            packet.weapons = this.weapons;
            this.sendClientMessageToAll(`{00A010}${player.nickname} joined`);
        }
        client.send("onJoinServerStatus", packet);
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
        this.sendClientMessageToAll(`{9B4844}${client.player.nickname} left`);
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
    playerText(character, text) {
        this.sendClientMessageToAll(`{D8C99C}${character.player.nickname}: {FFFFFF}${text}`);
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
