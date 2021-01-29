"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomId = exports.Quaternion = exports.Vector3 = void 0;
class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
exports.Vector3 = Vector3;
class Quaternion {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}
exports.Quaternion = Quaternion;
function getRandomId(size) {
    var id = "";
    for (let i = 0; i < size; i++) {
        id += Math.floor(Math.random() * 9);
    }
    return id;
}
exports.getRandomId = getRandomId;
