"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDistanceBetweemCoords = exports.Quaternion = exports.Vector3 = void 0;
class Vector3 {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }
}
exports.Vector3 = Vector3;
class Quaternion {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 1;
    }
}
exports.Quaternion = Quaternion;
function getDistanceBetweemCoords(x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}
exports.getDistanceBetweemCoords = getDistanceBetweemCoords;
