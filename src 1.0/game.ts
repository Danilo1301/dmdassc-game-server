import Client from "./client";
import Server from "./server";

export default class Game {
  clients: Map<string, Client> = new Map<string, Client>();
  servers: Map<string, Server> = new Map<string, Server>();

  start()
  {
    let WebSocket = require('ws');
    let wss = new WebSocket.Server({port: 3000, 'Access-Control-Allow-Origin': "*"});

    console.log("Game.start()")

    wss.on('connection', this.onSocketConnect.bind(this));

    var serverMain = this.createServer("main", {maxPlayers: 69, id: "main"});
    //var serverTest = this.createServer("test", {maxPlayers: 0});

    setInterval(() => this.update.bind(this)(), 0);
  }

  update()
    {
        this.servers.forEach((server: Server) => {
            server.update();
        })
    }

    createServer(name: string, options: object = {}): Server
    {
        var server: Server = new Server(this);
        server.name = name;

        server.id = "SERVER:" + this.getRandomId();

        for (const k in options) {
            console.log(k)
            server[k] = options[k];
        }

        this.servers.set(server.id, server);

        server.start();

        return server;
    }

    getServersList()
    {
        var list: any = [];

        this.servers.forEach((server: Server) => {

            list.push({
                id: server.id,
                name: server.name,
                players: server.clients.size,
                maxPlayers: server.maxPlayers
            });
        })

        return list;
    }

    onSocketConnect(socket): void
    {
        var client: Client = this.createClient(socket);

        console.log("Connected " + client.id)

        socket.on('message', function(message) {
            var msg = JSON.parse(message);

            client.onReceiveMessage(msg.key, msg.data);
        });

        socket.on('close', function() {
            client.onDisconnect();
        });


        //autoconnect
        this.servers.forEach((server: Server) => {
            //server.handleJoinRequest(client);
        });
    }

    createClient(socket): Client
    {
        var client = new Client(this, "CLIENT:" + this.getRandomId(), socket);
        this.clients.set(client.id, client);
        return client;
    }

    getRandomId(): string
    {
        return "" + Math.round(Math.random()*99999999);
    }
}