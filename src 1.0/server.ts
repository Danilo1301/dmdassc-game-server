import { start } from "repl";
import Client from "./client";
import { Entity, EntityCharacter, EntityObject, EntityVehicle } from "./entity";
import Game from "./game";
import { Vector3 } from "./utils";

const vm = require('vm');

class TestServerAI1 {
    character: EntityCharacter;
    targetPosition: Vector3 = new Vector3();
    server: Server;

    constructor(server: Server, entity: EntityCharacter)
    {
        this.server = server;
        this.character = entity;

        this.setRandomTargetPosition();

        setInterval(() => {
            this.update();
        }, 5)

        setInterval(() => {
            this.setRandomTargetPosition();
        }, 2000)
    }

    setRandomTargetPosition()
    {
        this.targetPosition.x = parseFloat((Math.random()*30-15).toFixed(2));
        this.targetPosition.z = parseFloat((Math.random()*30-15).toFixed(2));
    }

    update()
    {
        this.character.position.x += (this.targetPosition.x - this.character.position.x) / 400;
        this.character.position.z += (this.targetPosition.z - this.character.position.z) / 400;

        this.server.sendCharacterSync(this.character);

        //this.server.broadcastEntity(this.entity);
    }
}

function replaceData(from, to)
{
    if(to == undefined) { return; }

    for (const k in from) {
        if(typeof k == "object")
        {
            replaceData(from[k], to[k]);
            continue;
        }

        to[k] = from[k];
    }
}

export default class Server {
    game!: Game;

    id!: string;
    name!: string;
    maxPlayers: number = 10;
    clients: Map<string, Client> = new Map<string, Client>();

    entities: Map<number, Entity> = new Map<number, Entity>();

    sandbox: any = {};

    lastCheckedStreamed = 0;
    lastUpdatedStreamed = 0;

    constructor(game: Game)
    {
        this.game = game;
    }

    start()
    {
        new TestServerAI1(this, this.createEntityCharacter());
        //new TestServerAI1(this, this.createEntityCharacter());

        this.createEntityVehicle();
        this.createEntityVehicle();

        this.loadScript(`

        log("Script started");

        function onPlayerText(playerid, message) {
            log("CHAT > " + playerid + ": " + message);

            if(message.includes("swear"))
            {
                sendClientMessage(playerid, "| WARNING | We don't like bad words here >:/");
                return false;
            }

            if(message == "/spawn")
            {
                setPlayerPosition(playerid, 0, 0, 0);
                sendClientMessage(playerid, "| INFO | Teleporting to spawn!");
                return false;
            }

            if(message.toLowerCase() == "/car")
            {
                createVehicle(0, 2, 0);
                sendClientMessage(playerid, "| INFO | Vehicle spawned!");
                return false;
            }
            
        };

        function onPlayerConnect(playerid) {
            sendClientMessage(playerid, "========== ==========");
            sendClientMessage(playerid, "* Welcome, " + playerid);
            sendClientMessage(playerid, "* Type /car to spawn a car");
            sendClientMessage(playerid, "========== ==========");

            //sendClientMessageToAll("A player connected!");
        }

        `);
    }

    sendPacketToAllStreamed(entityId: number, packet: object)
    {
        this.clients.forEach((client: Client) => {
            if(client.streamedEntities.streamedEntities.has(entityId))
            {
                client.send("onCharacterActiveWeapon", packet);
            }
        })
    }

    sendBaseEntitySync(name: string, data: object, entityid: number, toClient: Client | undefined = undefined)
    {
        var sendToClients: Client[] = [];

        if(toClient)
        {
            sendToClients.push(toClient);
        } else {
            this.clients.forEach((client: Client) => {

                if(client.streamedEntities.streamedEntities.has(entityid))
                {
                    sendToClients.push(client);
                }

            })
        }

        for (const client of sendToClients) {
            client.send(name, data);
        }

        //console.log(`Sending sync ${name} to ${sendToClients.length} clients`)
    }

    sendCharacterSync(character: EntityCharacter, toClient: Client | undefined = undefined)
    {
        var data = {
            id: character.id,
            onVehicleId: character.onVehicleId,
            isAiming: character.isAiming,
            position: [character.position.x, character.position.y, character.position.z],
            aimRotation: [character.aimRotation.x, character.aimRotation.y, character.aimRotation.z, character.aimRotation.w]
        };

        this.sendBaseEntitySync("onCharacterSync", data, character.id, toClient);
    }

    sendVehicleSync(vehicle: EntityVehicle, toClient: Client | undefined = undefined)
    {
        var data = {
            id: vehicle.id,
            position: [vehicle.position.x, vehicle.position.y, vehicle.position.z],
            rotation: [vehicle.rotation.x, vehicle.rotation.y, vehicle.rotation.z, vehicle.rotation.w]
        };

        this.sendBaseEntitySync("onVehicleSync", data, vehicle.id, toClient);
    }

    sendObjectSync(object: EntityObject, toClient: Client | undefined = undefined)
    {
        var data = {
            id: object.id,
            position: [object.position.x, object.position.y, object.position.z]
        };

        this.sendBaseEntitySync("onObjectSync", data, object.id, toClient);
    }

    onCharacterHit(characterId: number, byCharacterId: number)
    {
        var e1: any = this.entities.get(characterId);
        var e2: any = this.entities.get(byCharacterId);

        var characterHit: EntityCharacter = e1;
        var byCharacter: EntityCharacter = e2;

        if(!characterHit.client) { return; }

        characterHit.health -= 12;

        if(characterHit.health <= 0)
        {
            characterHit.health = 0;
        }

        
        this.sendClientMessage(byCharacter.client.id, `You hit ${characterHit.client ? characterHit.client.id : characterHit.id } ( ${characterHit.health}  HP )`);
    
        if(characterHit.health == 0)
        {
            characterHit.health = 100;
            this.setCharacterPosition(characterHit.client.id, 0, 10, 0);
        }
    }

    callScriptFunction(name: string, args: any = [])
    {
        if(!this.sandbox[name]) { return true; }

        var result = this.sandbox[name].apply(null, args) === false ? false : true;

        return result;
    }
    

    loadScript(code: string)
    {
        var server = this;

        this.sandbox = {};
        this.sandbox.log = function(text) { console.log(`[LOG: ${server.id}] ${text}`) }
        
        var funcs = ["sendClientMessageToAll", "sendClientMessage", "setCharacterPosition", "createVehicle"];

        for (const k of funcs) {
            this.sandbox[k] = function() {
                return server[k].bind(server).apply(null, arguments);
            };
        }

        try {
            vm.createContext(this.sandbox);
            vm.runInContext(code, this.sandbox);
        } catch (e) {
            console.log("Could not start server", e)
        }
    }

    destroyEntity(entity: Entity)
    {
        console.log(`Destroyed entity ${entity.id}`)

        this.entities.delete(entity.id);

        this.clients.forEach((client: Client) => {
            client.send("delete_entity", entity.id);
        })
        
    }

    setCharacterPosition(clientId: string, x: number, y: number, z: number)
    {
        console.error("not defined");

       
        var client = this.clients.get(clientId)!;

        client.character.position.x = x;
        client.character.position.x = y;
        client.character.position.x = z;

        client.send("onSetCharacterPosition", {
            position: [x, y, z]
        });

        //var character = client.character;
        
        //character.position.x = x;
        //character.position.y = y;
        //character.position.z = z;
    }

    sendClientMessageToAll(message: string)
    {
        this.clients.forEach((client: Client) => {
            this.sendClientMessage(client.id, message);
        })
    }

    createVehicle(x: number, y: number, z: number)
    {
        this.createEntityVehicle();
    }

    sendClientMessage(clientid: string, message: string)
    {
        this.clients.get(clientid)!.send("onChatMessage", message);
    }

    handleJoinRequest(client: Client)
    {
        this.clients.set(client.id, client);
        
        client.character = this.createEntityCharacter();
        client.character.client = client;

        var info = {
            success: true,
            playerId: client.character.id
        };

        client.onServer = this;
        client.send("joinServerStatus", info);

        client.checkForStreamedEntities();

        this.onPlayerConnect(client);
    }

    handleDisconnect(client: Client)
    {
        this.destroyEntity(client.character);

        this.clients.delete(client.id);

        //this.entities.splice(this.entities.indexOf(client.character), 1);

        this.onPlayerDisconnect(client);
    }

    createEntityCharacter(): EntityCharacter
    {
        var entity: EntityCharacter = new EntityCharacter();

        entity.position.x = parseFloat((Math.random()*6-3).toFixed(2));
        entity.position.y = 1;
        entity.position.z = parseFloat((Math.random()*6-3).toFixed(2));

        this.setEntityId(entity);
        
        return entity;
    }

    createEntityVehicle(): EntityVehicle
    {
        var entity: EntityVehicle = new EntityVehicle();

        entity.position.x = parseFloat((Math.random()*6-3).toFixed(2));
        entity.position.y = 1;
        entity.position.z = parseFloat((Math.random()*6-3).toFixed(2));

        this.setEntityId(entity);
        
        return entity;
    }

    onPlayerConnect(client: Client)
    {
 
        if(this.callScriptFunction("onPlayerConnect", [client.id]))
        {
            this.sendClientMessageToAll("[<] " + client.id + " joined");
        }
    }

    onPlayerDisconnect(client: Client)
    {
        if(this.callScriptFunction("onPlayerDisconnect", [client.id]))
        {
            this.sendClientMessageToAll("[<] " + client.id + " left");
        }
    }

    setEntityId(entity)
    {
        var ids: number[] = [];

        this.entities.forEach((e: Entity) => {
            ids.push(e.id);
        });

        entity.id = 0;
        while(ids.includes(entity.id))
        {
            entity.id++;
        }

        this.entities.set(entity.id, entity);
    }

    onPlayerText(client: Client, message: string)
    {
        if(this.callScriptFunction("onPlayerText", [client.id, message]))
        {
            this.sendClientMessageToAll(client.id + ": " + message);
        }
    }

    update()
    {
        var time = new Date().getTime();

        if(time - this.lastCheckedStreamed >= 1000)
        {
            //console.log(`Checking for streamed entities`)

            this.lastCheckedStreamed = time;

            this.clients.forEach((client: Client) => {
                client.checkForStreamedEntities();
            })
        }
    }
}