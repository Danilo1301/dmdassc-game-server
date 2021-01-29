"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeaponInfo = exports.WEAPON_TYPE = void 0;
const utils_1 = require("./utils");
var WEAPON_TYPE;
(function (WEAPON_TYPE) {
    WEAPON_TYPE[WEAPON_TYPE["PISTOL"] = 0] = "PISTOL";
    WEAPON_TYPE[WEAPON_TYPE["RIFLE"] = 1] = "RIFLE";
})(WEAPON_TYPE = exports.WEAPON_TYPE || (exports.WEAPON_TYPE = {}));
class WeaponInfo {
    constructor() {
        this.name = "";
        this.modelName = "";
        this.type = WEAPON_TYPE.RIFLE;
        this.muzzlePosition = new utils_1.Vector3();
        this.damage = 8;
        this.maxAmmo = 30;
        this.reloadTime = 0.8;
        this.timeBetweenShots = 0.2;
    }
}
exports.WeaponInfo = WeaponInfo;
