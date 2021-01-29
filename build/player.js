"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Player {
    constructor(client, id) {
        this.nickname = "";
        this.streamedCharacters = new Map();
        this.client = client;
        this.id = id;
    }
    setup() {
        console.log(`Created player '${this.nickname}' (${this.id})`);
    }
    checkForStreamedEntities() {
        this.client.onServer.characters.forEach(character => {
            if (!this.streamedCharacters.has(character.id)) {
                this.streamedCharacters.set(character.id, character);
                this.client.onServer.sendOnCharacterStreamIn(this.client, character);
            }
        });
    }
}
exports.default = Player;
