"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketAimSync = exports.PacketCharacterSync = exports.PacketCharacterStreamIn = void 0;
const utils_1 = require("./utils");
class PacketCharacterStreamIn {
    constructor() {
        this.id = -1;
        this.position = new utils_1.Vector3();
        this.nickname = "";
        this.playerId = -1;
    }
}
exports.PacketCharacterStreamIn = PacketCharacterStreamIn;
class PacketCharacterSync {
    constructor() {
        this.id = 0;
        this.position = new utils_1.Vector3();
        this.rotation = new utils_1.Quaternion();
        this.aimDir = 0.0;
        this.upDownKeys = 0.0;
        this.leftRightKeys = 0.0;
        this.health = 100.0;
    }
}
exports.PacketCharacterSync = PacketCharacterSync;
class PacketAimSync {
    constructor() {
        this.id = 0;
        this.aiming = false;
        this.hasShot = false;
        this.weaponId = -1;
    }
}
exports.PacketAimSync = PacketAimSync;
class EntityCharacter {
    constructor() {
        this.id = 0;
        this.position = new utils_1.Vector3();
        this.rotation = new utils_1.Quaternion();
        this.aimDir = 0.0;
        this.upDownKeys = 0.0;
        this.leftRightKeys = 0.0;
        this.isAiming = false;
        this.weaponId = -1;
        this.health = 100.0;
    }
}
exports.default = EntityCharacter;
