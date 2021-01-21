"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityVehicle = exports.EntityCharacter = exports.EntityObject = exports.Entity = void 0;
const utils_1 = require("./utils");
class Entity {
    constructor() {
        this.id = -1;
        this.position = new utils_1.Vector3();
        this.velocity = new utils_1.Vector3();
        this.rotation = new utils_1.Quaternion();
    }
}
exports.Entity = Entity;
class EntityObject extends Entity {
    constructor() {
        super(...arguments);
        this.attachedTo = -1;
    }
}
exports.EntityObject = EntityObject;
class EntityCharacter extends Entity {
    constructor() {
        super(...arguments);
        this.onVehicleId = -1;
    }
}
exports.EntityCharacter = EntityCharacter;
class EntityVehicle extends Entity {
    constructor() {
        super(...arguments);
        this.modelId = -1;
    }
}
exports.EntityVehicle = EntityVehicle;
