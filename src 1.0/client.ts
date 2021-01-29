import { Entity, EntityCharacter, EntityObject, EntityVehicle } from "./entity";

import Game from "./game";
import Server from "./server";
import { getDistanceBetweemCoords } from "./utils";

class StreamEntitiesHelper
{
    client: Client;
    streamedEntities: Map<number, Entity> = new Map<number, Entity>();

    constructor(client: Client)
    {
        this.client = client;
    }

    entityStreamedIn(entity)
    {
        if(entity.constructor.name == "EntityCharacter") this.onCharacterStreamIn(entity);
        if(entity.constructor.name == "EntityVehicle") this.onVehicleStreamIn(entity);
        if(entity.constructor.name == "EntityObject") this.onObjectStreamIn(entity);

        console.log(`Entity ${entity.id} (${entity.constructor.name}) streamed in for ${this.client.id}`)
    }

    entityStreamedOut(entity)
    {
        if(entity.constructor.name == "EntityCharacter") this.onCharacterStreamOut(entity);
        if(entity.constructor.name == "EntityVehicle") this.onVehicleStreamOut(entity);
        if(entity.constructor.name == "EntityObject") this.onObjectStreamOut(entity);

        console.log(`Entity ${entity.id} (${entity.constructor.name}) streamed out for ${this.client.id}`)
    }

    onCharacterStreamIn(character: EntityCharacter)
    {
        this.client.send("onCharacterStreamIn", {
            id: character.id,
            position: [character.position.x, character.position.y, character.position.z]
        });

        this.client.onServer.sendCharacterSync(character);
    }

    onVehicleStreamIn(vehicle: EntityVehicle)
    {
        this.client.send("onVehicleStreamIn", {
            id: vehicle.id,
            position: [vehicle.position.x, vehicle.position.y, vehicle.position.z]
        });

        this.client.onServer.sendVehicleSync(vehicle);
    }

    onObjectStreamIn(object: EntityObject)
    {
        this.client.send("onObjectStreamInt", {
            id: object.id,
            position: [object.position.x, object.position.y, object.position.z]
        });

        this.client.onServer.sendObjectSync(object);
    }


    onCharacterStreamOut(character: EntityCharacter)
    {
        this.client.send("onCharacterStreamOut", {
            id: character.id
        });
    }

    onVehicleStreamOut(vehicle: EntityVehicle)
    {
        this.client.send("onVehicleStreamOut", {
            id: vehicle.id
        });
    }

    onObjectStreamOut(object: EntityObject)
    {
        this.client.send("onObjectStreamOut", {
            id: object.id
        });
    }

    check()
    {
        
        var character = this.client.character;
        var server = this.client.onServer;

        if(!character || !server) { return; }

        server.entities.forEach((entity: Entity) => {

            var distance = getDistanceBetweemCoords(
                character.position.x,
                character.position.z,
                entity.position.x,
                entity.position.z
            );

            if(distance < 10)
            {
                if(!this.streamedEntities.has(entity.id))
                {
                    this.streamedEntities.set(entity.id, entity);

                    this.entityStreamedIn(entity);
                }
            } else {
                if(this.streamedEntities.has(entity.id))
                {
                    this.streamedEntities.delete(entity.id);

                    this.entityStreamedOut(entity);                    
                    
                }
            }
        })
    }
}




export default class Client {
    game: Game;

    id: string;
    socket;
    onServer!: Server;
    character!: EntityCharacter;

    streamedEntities: StreamEntitiesHelper = new StreamEntitiesHelper(this);

    constructor(game: Game, id: string, socket)
    {
        this.game = game;
        this.id = id;
        this.socket = socket;
    }

    onReceiveMessage(key: string, data: any)
    {
        //console.log(`Client message ${this.id}: ${key}`, data)

        if(key == "get_servers_list") return this.send("servers_list", this.game.getServersList());

        if(key == "join_server")
        {
            var serverId = data;
            var server: Server = this.game.servers.get(serverId)!;

            server.handleJoinRequest(this);
        }

        if(key == "characterSync")
        {
            var entity: any = this.onServer.entities.get(data.id)!;
            var character: EntityCharacter = entity;

            character.onVehicleId = data.onVehicleId;
            character.isAiming = data.isAiming;

            character.position.x = data.position[0];
            character.position.y = data.position[1];
            character.position.z = data.position[2];

            character.aimRotation.x = data.aimRotation[0];
            character.aimRotation.y = data.aimRotation[1];
            character.aimRotation.z = data.aimRotation[2];
            character.aimRotation.w = data.aimRotation[3];

            this.onServer.sendCharacterSync(character);
        }

        if(key == "vehicleSync")
        {
            var entity: any = this.onServer.entities.get(data.id)!;
            var vehicle: EntityVehicle = entity;

            vehicle.position.x = data.position[0];
            vehicle.position.y = data.position[1];
            vehicle.position.z = data.position[2];

            vehicle.rotation.x = data.rotation[0];
            vehicle.rotation.y = data.rotation[1];
            vehicle.rotation.z = data.rotation[2];
            vehicle.rotation.w = data.rotation[3];

            this.onServer.sendVehicleSync(vehicle);
        }

        if(key == "objectSync")
        {
            var entity: any = this.onServer.entities.get(data.id)!;
            var object: EntityObject = entity;

            object.position.x = data.position[0];
            object.position.y = data.position[1];
            object.position.z = data.position[2];

            this.onServer.sendObjectSync(object);
        }

        if(key == "characterActiveWeapon")
        {
            this.onServer.sendPacketToAllStreamed(this.character.id, data);
        }

        if(key == "characterHit")
        {
            this.onServer.onCharacterHit(data.characterId, data.byCharacterId);

            //this.onServer.sendPacketToAllStreamed(this.character.id, data);
        }

        if(key == "playerText")
        {
            this.onServer.onPlayerText(this, data);
        }
    }

    send(key: string, data: any)
    {
        this.socket.send(JSON.stringify({key: key, data: data}));
    }

    onDisconnect()
    {
        if(this.onServer) this.onServer.handleDisconnect(this);
        console.log(this.id, "disconnected")
    }

    checkForStreamedEntities()
    {
        this.streamedEntities.check();
    }
}