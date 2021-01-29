export class Vector3 {
    x: number = 0;
    y: number = 0;
    z: number = 0;
}

export class Quaternion {
    x: number = 0;
    y: number = 0;
    z: number = 0;
    w: number = 1;
}

export function getDistanceBetweemCoords(x1, y1, x2, y2)
{
    var dx = x1 - x2;
    var dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}