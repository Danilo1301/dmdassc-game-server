import Client from "./client";
import { Vector3, Quaternion } from "./utils";

export class Entity {
    id: number = -1;

    position = new Vector3();
}

export class EntityObject extends Entity {
    attachedTo: number = -1;

    rotation = new Quaternion();
}

export class EntityCharacter extends Entity {
    onVehicleId: number = -1;
    isAiming: boolean = false;

    client!: Client;

    health: number = 100;

    aimRotation = new Quaternion();
}

export class EntityVehicle extends Entity {
    modelId: number = -1;

    rotation = new Quaternion();
}