var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);
var fs = require('fs');

io.on('connection', function(socket){
    console.log(' ID: ' + socket.id + ' connected from: ' + socket.request.connection.remoteAddress);
    socket.on('update rooms',function() {
        var room = [];
        room[1] = JSON.parse(fs.readFileSync("rooms/room1.json"));
        room[2] = JSON.parse(fs.readFileSync("rooms/room2.json"));
        room[3] = JSON.parse(fs.readFileSync("rooms/room3.json"));
        room[4] = JSON.parse(fs.readFileSync("rooms/room4.json"));
        room[5] = JSON.parse(fs.readFileSync("rooms/room5.json"));
        socket.emit('update rooms', room);
    });

    socket.on('join room',function(room){
        console.log(room.username + ' tried joining room ' + room.id);
        var dir = "rooms/room"+room.id+".json";
        var roomData = JSON.parse(fs.readFileSync(dir));
        var getRoom = {
            "id":room.id,
            "playerNo":null
        };
        if(roomData.playerCount != 2){
            roomData.playerCount++;
            if(roomData.player1.empty){
                roomData.player1.name = room.username;
                roomData.player1.empty = 0;
                getRoom.playerNo = 1;
            }else{
                roomData.player2.name = room.username;
                roomData.player2.empty = 0;
                getRoom.playerNo = 2;
            }

            fs.writeFileSync(dir,JSON.stringify(roomData));
            socket.emit('join room',getRoom);
            console.log(room.username + ' successfully joined Room ' + room.id);
        }else{
            console.log(room.username + ' was denied access to Room' + room.id + '(ROOM FULL)');
        }
    });

    socket.on('leave room',function(room){
        if(room.id!=0) {
            console.log(room.name + ' left room ' + room.id);
            var dir = "rooms/room" + room.id + ".json";
            var roomData = JSON.parse(fs.readFileSync(dir));
            if (room.playerNo == 1) {
                roomData.player1.empty = 1;
                roomData.player1.name = "";
                roomData.player1.ready = 0;
                roomData.player1.walls = 10;
            } else {
                roomData.player2.empty = 1;
                roomData.player2.name = "";
                roomData.player2.ready = 0;
                roomData.player2.walls = 10;
            }
            roomData.playerCount--;
            fs.writeFileSync(dir, JSON.stringify(roomData));
        }
    });

    socket.on('update player list',function(room){
        if(room!=0) {
            var dir = "rooms/room" + room + ".json";
            var roomData = JSON.parse(fs.readFileSync(dir));
            socket.broadcast.emit('update player list', roomData);
            socket.emit('update player list', roomData);
        }
    });

    socket.on('ready',function(data){
        var dir = "rooms/room"+data.id+".json";
        var roomData = JSON.parse(fs.readFileSync(dir));
        if(data.playerNo==1){
            if(!roomData.player1.ready) {
                roomData.player1.ready = 1;
            }else{
                roomData.player1.ready = 0;
            }
        }else{
            if(!roomData.player2.ready) {
                roomData.player2.ready = 1;
            }else{
                roomData.player2.ready = 0;
            }
        }
        socket.broadcast.emit('update player list', roomData);
        socket.emit('update player list', roomData);
        if(roomData.player1.ready && roomData.player2.ready){
            roomData.turn = 1;
            socket.emit('start game',data.id);
            socket.broadcast.emit('start game',data.id);
            socket.emit('change turn',roomData);
            socket.broadcast.emit('change turn',roomData);
        }
        fs.writeFileSync(dir, JSON.stringify(roomData));
    });

    socket.on('change turn',function(data){
        var dir = "rooms/room"+data.id+".json";
        var roomData = JSON.parse(fs.readFileSync(dir));
        if(roomData.turn==1){
            roomData.turn = 2;
        }else{
            roomData.turn = 1;
        }

        if(data.wall.moved) {
            if (data.player.id == 1) {
                roomData.player1.walls--;
            } else {
                roomData.player2.walls--;
            }
        }

        socket.emit('change turn',roomData);
        socket.broadcast.emit('change turn',roomData);

        var moveData = data;
        socket.broadcast.emit('move other',moveData);
        fs.writeFileSync(dir, JSON.stringify(roomData));
    });

    socket.on('reset room',function(room){
        var dir = "rooms/room"+room+".json";
        var roomData = JSON.parse(fs.readFileSync(dir));
        roomData.playerCount = 0;
        roomData.player1.ready = 0;
        roomData.player1.empty = 1;
        roomData.player1.name = "";
        roomData.player1.walls = 10;
        roomData.player2.ready = 0;
        roomData.player2.empty = 1;
        roomData.player2.name = "";
        roomData.player2.walls = 10;

        fs.writeFileSync(dir, JSON.stringify(roomData));
    });
    socket.on('disconnect', function(){
        console.log('ID: ' + socket.id + ' from ' + socket.request.connection.remoteAddress +' disconnected...');
    });
});

http.listen(process.env.PORT || 3000, function(){
    console.log('listening on port: '+ process.env.PORT);
    poke();
});

function poke(){
    console.log('Poke!');
    setTimeout(poke,59000);
}