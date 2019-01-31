
var ndjson = require('ndjson');
var fs = require('fs');
// var counter = 0;
// var arr = [];
// var categoryName = "backpack";
// var strRaw = "full_simplified_" + categoryName;
// var strMine = "data_" + categoryName;
// var done = false;
// fs.createReadStream('./data/' + strRaw + '.ndjson')
// 	.pipe(ndjson.parse())
// 	.on('data', function (obj) {

// 		if (obj.drawing.length > 20 && obj.drawing.length < 30) {
// 			var data = {
// 				name: obj.word,
// 				drawing: obj.drawing
// 			}
// 			counter++;
// 			arr.push(data);
// 			console.log("counter " + counter)
// 		}
// 		if (counter > 2000 && !done) {
// 			fs.appendFile('./data/' + strMine + '.json', JSON.stringify(arr), function (err) {
// 				if (err) throw err;
// 				console.log('Saved!');
// 			});
// 			done = true;
// 		}



// 	})
//game deneme
var soloPlayerQueue = [];
var intervals = [];
const adminPass = "1";
var admin;
var admininterval;
var onlinePlayers = [];
var rooms = [];
var soloRooms = [];
//var soloPlayerCount = 0;
var id = 5;
var counter = 0;
const Room = require('./Room.js');
const Bot = require('./Bot.js');
const Player = require('./Player.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server, { pingTimeout: 85000 });
var util = require('util');
// for (var i = 0; i < 10; i++) {
// 	var room = new Room(1, 1, i, io, 6);
// 	soloRooms.push(room);
// 	counter++;
// }
//server.listen(process.env.PORT || 5000);








server.listen(5000);
app.set('views', './views');
app.use(express.static('public'));
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/views/index.html');
});
app.use(function (req, res, next) {// browsera cizimi yollamak için ekledim
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});
app.get('/getImage', function (req, res, next) {
	var dictionary = [
		"aircraft carrier",
		"alarm clock",
		"ambulance",
		"ant",
		"anvil",
		"arm",
		"asparagus",
		"backpack",
		"basket",
		"bat",
		"bathtub",
		"beach",
		"cat"
	]
	var rand = Math.random(1) * 12;
	var ind = Math.round(rand);
	console.log("ind")
	console.log(ind);
	var fullArray = [];
	var arr = []
	new Promise(function (resolve, reject) {
		fs.readFile('./data/data_' + dictionary[12] + '.json', function (err, data) {
			console.log(data)
			fullArray = JSON.parse(data);
			console.log(fullArray)
			resolve()
		});
	}).then(() => {
		console.log("fullarray[0]")
		console.log(fullArray[0])
		var ind2 = Math.round(Math.random(1) * fullArray.length);
		console.log(fullArray.length);
		var arr = fullArray[11].drawing
		//console.log(req.body);
		var d = {
			index: ind2,
			drawing: arr
		}
		console.log("d arr");
		console.log(d);
		res.send(JSON.stringify(d));
	})



})

console.log('server is starting');
io.sockets.on('connection', function (socket) {
	//var currentRoomID = 0; // roomu var mı yok mu disconnect icin
	socket.on('gotOnline', onlinePlayersHandle);
	socket.on('adminGotOnline', adminOnlineHandle);
	socket.on('disconnect', disc);
	socket.on('disconnectFromRoom', disc);
	console.log('connected => ' + socket.id);
	socket.on('chatMessage', mesajDagit);
	//socket.on('createGameRoom', createGameRoom);
	socket.on('joinGame', joinRoom);
	socket.on('leaveRoom', leaveRoomHandle);
	socket.on('leaveSoloRoom', leaveSoloRoomHandle);

	socket.on('startTouchMsg', startTouchEmit);
	socket.on('moveTouchMsg', moveTouchEmit);
	socket.on('upTouchMsg', upTouchEmit);

	socket.on('clearCanvas', clearCanvasEmit);
	socket.on('thicknessChange', thichnessChangeEmit);
	socket.on('colorChange', colorChangeEmit);

	socket.on('getInfo', getInfo);

	socket.on('createRoomForFriend', createRoomForFriend);
	socket.on('acceptGameRequestMsg', acceptGameRequestHandle);
	socket.on('declineGameRequestMsg', declineGameRequestHandle);
	socket.on('inviteFriend', inviteFriendHandle);
	socket.on('oyunuBaslatMsg', oyunuBaslatHandle);

	socket.on('destroy', destroyHandle);

	socket.on('playSolo', playSoloHandle);
	socket.on('cancelSolo', cancelSoloHandle);

	function destroyHandle() {

	}
	function cancelSoloHandle(data) {
		var index;
		for (var i = 0; i < soloPlayerQueue.length; i++) {
			if (data.email === soloPlayerQueue[i].email) {
				index = i;
			}
		}
		soloPlayerQueue.splice(index, 1);
		clearInterval(intervals[index]);
		intervals.splice(index, 1);
		console.log("intervals");
		console.log(intervals);
	}
	function playSoloHandle(data) {
		console.log("play solo");
		console.log(data);


		soloPlayerQueue.push(new Player(socket, data.email, data.userIcon, data.userName, data.userFrame));
		var counter = 0;
		var inter = setInterval(() => {
			socket.emit('matchmakingTime', counter + 1);
			counter++;
			console.log(counter)
			if (counter === 4) {
				assignPlayers();
				console.log(soloPlayerQueue)
			}
		}, 1000)
		intervals.push(inter);

		//addPlayerToSoloRoom(data)
	}

	async function getBotNames(number) {
		return new Promise(function (resolve, reject) {
			fs.readFile('./data/new_usernames.txt', function (err, data) {
				var arr = data.toString().split("\n");
				var rand = Math.floor(Math.random(1) * arr.length);
				var returnArray = [];
				for (var i = 0; i < number; i++) {
					returnArray.push(arr[(rand + i) % arr.length])
				}
				resolve(returnArray)
			});
		})
	}

	async function createBots(number, roomID) {
		var botNames = await getBotNames(number);
		var botIcons = getBotIcons(number);
		var botFrames = getBotFrames(number);
		var bots = []
		for (var i = 0; i < number; i++) {
			bots.push(new Bot(io, "email", botIcons[i], botNames[i], botFrames[i], roomID))
		}
		return bots;


	}
	function getBotIcons(number) {
		var icons = ["Tilki", "Kedi", "Koyun", "İnek"];
		var returnIcons = []
		for (var i = 0; i < number; i++) {
			returnIcons.push(icons[Math.floor(Math.random(1) * icons.length)])
		}
		return returnIcons;

	}
	function getBotFrames(number) {
		var frames = ["Zikzak", "Kalp", "Gökkuşağı"];
		var returnFrames = []
		for (var i = 0; i < number; i++) {
			returnFrames.push(frames[Math.floor(Math.random(1) * frames.length)])
		}
		return returnFrames;
	}


	async function assignPlayers() {
		var newRoom = createNewRoom("", "");
		if (soloPlayerQueue.length < 5) {
			for (var k = 0; k < soloPlayerQueue.length; k++) {
				clearInterval(intervals[k]);
			}
			intervals.splice(0, soloPlayerQueue.length);// interval clear

			var number = 5 - soloPlayerQueue.length;
			roomPlayers = soloPlayerQueue.splice(0, soloPlayerQueue.length);

			await createBots(number, newRoom.getRoomID()).then((bots) => {
				console.log("bots");
				console.log(bots);
				for (var i = 0; i < number; i++) {
					roomPlayers.push(bots[i]);
				}
			});
		} else {
			for (var k = 0; k < 5; k++) {
				clearInterval(intervals[k]);
			}
			intervals.splice(0, 5); // interval clear

			roomPlayers = soloPlayerQueue.splice(0, 5);
		}
		console.log("room players")
		console.log(roomPlayers);
		for (var i = 0; i < 5; i++) {
			newRoom.addPlayer(roomPlayers[i]);
			if (roomPlayers[i].type === "Player") {
				console.log("roomplayer")
				console.log(roomPlayers[i].socket.id);
				roomPlayers[i].socket.join(parseInt(newRoom.getRoomID()));
				roomPlayers[i].setRoomID(newRoom.getRoomID());
				//io.to(roomPlayers[i].socket.id).emit("goSoloGameRoom", roomPlayers[i]);
				roomPlayers[i].socket.emit("goSoloGameRoom", roomPlayers[i].getInfo());
			}

		}
		newRoom.startGame();
	}
	function createNewRoom(socketID, email) {
		if (socketID != "" && email != "") {
			var bulundu = false, index = 0, newRoom;
			for (var i = 0; i < rooms.length; i++) { //soloroomsu rooms yapıom
				if (rooms[i] === -1) {
					bulundu = true;
					index = i;
				}
			}

			if (bulundu) {
				newRoom = new Room(socketID, email, index + 1, io, 5)
				rooms[i] = newRoom;
			} else {
				newRoom = new Room(socketID, email, rooms.length + 1, io, 5);
				rooms.push(newRoom);
			}
		} else {
			var bulundu = false, index = 0, newRoom;
			for (var i = 0; i < rooms.length; i++) { //soloroomsu rooms yapıom
				if (rooms[i] === -1) {
					bulundu = true;
					index = i;
				}
			}

			if (bulundu) {
				newRoom = new Room(1, 1, index + 1, io, 6)
				rooms[i] = newRoom;
			} else {
				newRoom = new Room(1, 1, rooms.length + 1, io, 6);
				rooms.push(newRoom);
			}
		}

		return newRoom
	}

	// function addPlayerToSoloRoom(data) {//eski priorityli solo odaya ekleme
	// 	var eklencekOda = 5000;
	// 	var eklenecekOdaPriority = 0;
	// 	if (soloPlayerCount === 0) {
	// 		soloRooms[0].addPlayer(socket.id, data);
	// 		socket.join(parseInt(0));
	// 		console.log("eklencek oda " + 0);
	// 		console.log("socket.emit('goSoloGameRoom', 0);");
	// 		socket.emit('goSoloGameRoom', 0);
	// 		soloPlayerCount++;
	// 	} else {

	// 		for (var i = 0; i < soloRooms.length; i++) {
	// 			if (soloRooms[i].isGamePlaying === false) {// odada oyun oynanmıo
	// 				if (soloRooms[i].currentCapacity < soloRooms[i].capacity) {// kapasitesi yeterli
	// 					if (soloRooms[i].currentCapacity === 3 && eklenecekOdaPriority < getPriority(soloRooms[i].currentCapacity)) {// 2 oyuncu varsa ona önceli
	// 						eklencekOda = i;
	// 						eklenecekOdaPriority = getPriority(soloRooms[i].currentCapacity);
	// 					} else if (soloRooms[i].currentCapacity === 2 && eklenecekOdaPriority < getPriority(soloRooms[i].currentCapacity)) {
	// 						eklencekOda = i;
	// 						eklenecekOdaPriority = getPriority(soloRooms[i].currentCapacity);
	// 					} else if (soloRooms[i].currentCapacity === 4 && eklenecekOdaPriority < getPriority(soloRooms[i].currentCapacity)) {
	// 						eklencekOda = i;
	// 						eklenecekOdaPriority = getPriority(soloRooms[i].currentCapacity);
	// 					} else if (soloRooms[i].currentCapacity === 5 && eklenecekOdaPriority < getPriority(soloRooms[i].currentCapacity)) {
	// 						eklencekOda = i;
	// 						eklenecekOdaPriority = getPriority(soloRooms[i].currentCapacity);
	// 					} else if (soloRooms[i].currentCapacity === 1 && eklenecekOdaPriority < getPriority(soloRooms[i].currentCapacity)) {
	// 						eklencekOda = i;
	// 						eklenecekOdaPriority = getPriority(soloRooms[i].currentCapacity);
	// 					}
	// 				}
	// 			}
	// 		}
	// 		console.log("eklencekoda " + eklencekOda);
	// 		soloRooms[eklencekOda].addPlayer(socket.id, data);
	// 		socket.join(parseInt(eklencekOda));
	// 		console.log("eklencek oda " + eklencekOda);
	// 		console.log("addplayertosoloroom");
	// 		socket.emit('goSoloGameRoom', eklencekOda);
	// 		soloPlayerCount++;
	// 	}
	// }
	function botPlay() {
		var dictionary = [
			"aircraft carrier", "alarm clock", "ambulance", "ant", "anvil", "arm", "asparagus", "backpack", "basket", "bat", "bathtub", "beach", "cat"
		]
		var rand = Math.random(1) * 12;
		var ind = Math.round(rand);
		console.log(ind);
		var fullArray = [];
		var arr = []
		new Promise(function (resolve, reject) {
			fs.readFile('./data/data_' + dictionary[12] + '.json', function (err, data) {
				fullArray = JSON.parse(data);
				resolve()
			});
		}).then(() => {
			console.log(fullArray[0])
			var ind2 = Math.round(Math.random(1) * fullArray.length);
			console.log(fullArray.length);
			var arr = fullArray[ind2].drawing
			//console.log(req.body);
			var d = {
				index: ind2,
				drawing: arr
			}
			console.log("d arr");
			console.log(d);
			res.send(JSON.stringify(d));
		})



	}
	function oyunuBaslatHandle(data) {
		var room;
		var isOwner = false;
		for (var k = 0; k < rooms.length; k++) {
			if (data.email === rooms[k].getOwnerEmail()) {
				isOwner = true;
				room = rooms[k];
			}
		}
		if (!isOwner) {
			socket.emit('baslatReply', 'Odanın sahibi siz degilsiniz');
			console.log('Odanın sahibi siz degilsiniz')
		} else {
			if (room.getPlayerNumber() < 2) {
				socket.emit('baslatReply', 'Oyuna baslamak icin en az 2 oyuncu gerekli');
				console.log('Oyuna baslamak icin en az 2 oyuncu gerekli')
			} else {
				room.startGame();
			}
		}
	}
	function acceptGameRequestHandle(data) {//inviter, invited
		var ownerID;
		for (var i = 0; i < onlinePlayers.length; i++) {
			if (onlinePlayers[i].user.email === data.inviter.email) {
				ownerID = onlinePlayers[i].socketID
			}
		}
		for (var k = 0; k < rooms.length; k++) {
			if (ownerID === rooms[k].getOwnerID()) {
				var newPlayer = new Player(socket, data.email, data.userIcon, data.userName, data.userFrame);
				newPlayer.setRoomID(rooms[k].getRoomID());
				rooms[k].addPlayer(newPlayer);//kullanıcıyı datayla gelen odaya ekle
				socket.join(parseInt(rooms[k].getRoomID()));
				socket.emit('goGameRoom', newPlayer.getInfo());//roomID i yolluom
			}
		}

	}
	function declineGameRequestHandle(data) {
		var ownerID;
		var roomID;
		for (var i = 0; i < onlinePlayers.length; i++) {
			if (onlinePlayers[i].user.email === data.inviter.email) {
				ownerID = onlinePlayers[i].socketID
			}
		}
		for (var k = 0; k < rooms.length; k++) {
			if (ownerID === rooms[k].getOwnerID()) {
				roomID = rooms[k].getRoomID();
				rooms[k].declinedInvite(socket.id, data.invited);
				console.log("declinegamerequest to room");
			}
		}

	}
	function inviteFriendHandle(data) {
		var owner = {
			email: data.email,
			userIcon: data.userIcon,
			userName: data.userName
		}
		var friend = data.friend;
		var ownerID;
		var data = {};
		var isOnline = false;
		for (var i = 0; i < onlinePlayers.length; i++) {
			if (onlinePlayers[i].user.email === friend.email) {
				io.to(onlinePlayers[i].socketID).emit('incomingGameInvite', owner);
				isOnline = true;
			}
		}
		console.log(isOnline);
		if (!isOnline) {
			data = {
				isOnline: isOnline,
				message: 'Oyuncu çevrimiçi değil',
				userName: friend.userName
			}
			console.log("online diil");
			socket.emit('isOnline', data);
		} else {
			console.log("online");
			for (var i = 0; i < onlinePlayers.length; i++) {
				if (onlinePlayers[i].user.email === owner.email) {
					ownerID = onlinePlayers[i].socketID
				}
			}

			for (var k = 0; k < rooms.length; k++) {
				if (ownerID === rooms[k].getOwnerID()) {
					roomID = rooms[k].getRoomID();
					rooms[k].addPlayertoInvitedList(friend);// arkadası invited listesine ekle loading yapcaz
				}
			}
			data = {
				isOnline: isOnline,
				message: 'Oyuncu davet edildi',
				userName: friend.userName
			}
			socket.emit('isOnline', data);
		}
	}
	function onlinePlayersHandle(data) {
		console.log(data);
		console.log(onlinePlayers)
		var alreadyIn = false;
		for (var i = 0; i < onlinePlayers.length; i++) {//baştan savma bu sorunun nedenini tam bul
			if (onlinePlayers[i].socketID === data.socketID) {
				alreadyIn = true;
			}
		}
		if (!alreadyIn) {
			onlinePlayers.push(data);
			console.log(data.user.email + " is now online -- socket id -> " + data.socketID);
		}

		//data { user , socketID}
	}
	function adminFeed() {
		io.to(admin).emit('onlinePlayerInfo', onlinePlayers);
		console.log("player bilgisi gönderiliyor");
		console.log(onlinePlayers);
	}
	function adminOnlineHandle(data) {
		if (data === adminPass) {
			console.log("password dogru");
			admin = socket.id;
			admininterval = setInterval(adminFeed, 5000);
		}
	}
	function createRoomForFriend(data) {//oda olusturma

		// email: data.email,
		// userIcon: data.userIcon,
		// userName: data.userName,
		// userFrame: data.userFrame

		var ownerGotRoom = false;
		for (var i = 0; i < rooms.length; i++) {
			if (socket.id === rooms[i].getOwnerID()) {
				ownerGotRoom = true;
				index = i;
			}
		}
		if (!ownerGotRoom) {
			//roomID = Math.random(10);
			var newRoom = createNewRoom(socket.id, data.email);
			//var room = new Room(socket.id, data.email, counter, io, 5); //odayı yaratmak isteyenin odası yoksa yeni room yarat rooms arayine ekle
			console.log('emit createGameResponse created room for ' + data.email);
			var newPlayer = new Player(socket, data.email, data.userIcon, data.userName, data.userFrame)
			newRoom.addPlayer(newPlayer);
			//room.addPlayer(socket.id, owner);//kullanıcıyı datayla gelen odaya ekle
			socket.join(parseInt(newRoom.getRoomID()));
			newPlayer.setRoomID(newRoom.getRoomID());
			socket.emit('goGameRoom', newPlayer.getInfo());//info yolluom roomid username userframe usericon ...
		} else {
			console.log('user owns a room ' + socket.id);
		}


	}
	function leaveRoomHandle(data) {
		console.log("leave room");
		console.log(onlinePlayers)
		for (var i = 0; i < rooms.length; i++) {
			if (rooms[i].getRoomID() === data.roomID) {
				rooms[i].leaveRoom("party", socket.id, destroyRoom, addInvitable)
			}
		}
	}
	function destroyRoom(roomID) {
		var index;
		for (var i = 0; i < rooms.length; i++) {
			console.log("roomID " + roomID + " room[i].id " + rooms[i].getRoomID() + " i " + i)
			if (roomID === rooms[i].getRoomID()) {
				index = i;
			}
		}
		rooms.splice(index, 1);
		console.log("room destroyed index " + index);
		printRooms();
	}
	function printRooms() {
		for (var i = 0; i < rooms.length; i++) {
			rooms[i].ownerID;
		}
	}
	function addInvitable(socketID, ownerID) {
		for (var m = 0; m < onlinePlayers.length; m++) {
			if (socketID == onlinePlayers[m].socketID) {
				io.to(ownerID).emit('addFriendToInvitelist', onlinePlayers[m].user.email);//invite atılabilen playerlara ekleme yapıom gamescreende
			}
		}
	}
	function leaveSoloRoomHandle(data) {
		for (var i = 0; i < rooms.length; i++) {
			if (rooms[i].getRoomID() === data.roomID) {
				rooms[i].leaveRoom("solo", socket.id, destroyRoom, addInvitable);

			}
		}

	}
	function disconnectPlayer() {
		//console.log("got disconnected : " + socket.id);
		//console.log(currentRoomID);
		//********* room ownersa çıktıysa napcam onu bulmam lazım  ?? ?
		if (socket.rooms[1] !== "") {
			for (var k = 0; k < rooms.length; k++) {
				if (socket.rooms[1] === rooms[k].getRoomID()) {
					socket.leave(socket.rooms[1]);
					rooms[k].disconnectPlayer(socket.id);
					console.log('Got disconnect: ' + socket.id + ' from RoomID ' + socket.rooms[1]);
					console.log(rooms[k].printPlayers());
				}
			}
		} else {
			console.log("got disconnected : " + socket.id);
		}

		//io.sockets.emit('users', userNames);//çıkıs ve girişte kullanıcı adlarını hepsine yolluom
	}
	function disc() {//********* room ownersa çıktıysa napcam onu bulmam lazım  ?? ?
		console.log("************************************");
		if (socket.id === admin) {
			console.log("disconnecting admin");
			clearInterval(admininterval);
		} else {
			var odasivar = false;
			var roomIndex;
			for (var i = 0; i < rooms.length; i++) {
				if (rooms[i].searchPlayer(socket.id) === true) {
					console.log("player had a room leaving that room");
					console.log("Disconnected " + socket.id + " from Room: " + rooms[i].getRoomID());
					socket.leave(rooms[i].getRoomID());

					odasivar = true;
					if (socket.adapter.rooms[parseInt(rooms[i].getRoomID())] !== undefined) {//son kişi de cıkınca undefined oluo
						console.log("--------------------------------------------------");
						console.log("Room : " + rooms[i].getRoomID() + " da bulunan oyuncular");
						console.log(socket.adapter.rooms[parseInt(rooms[i].getRoomID())].sockets);
					}
					for (var m = 0; m < onlinePlayers.length; m++) {
						if (socket.id == onlinePlayers[m].socketID) {
							if (socket.id !== rooms[i].getOwnerID()) {
								io.to(rooms[i].getOwnerID()).emit('addFriendToInvitelist', onlinePlayers[m].user.email);//invite atılabilen playerlara ekleme yapıom gamescreende
							}

						}
					}
					var d = {
						roomID: rooms[i].getRoomID(),
						socketID: socket.id//useless
					}
					leaveRoomHandle(d);
					//rooms[i].leaveRoom(socket.id);//

				}
			}
			if (!odasivar) {
				console.log("User had no room disconnected " + socket.id);
			}
			var spliceindex;
			for (var k = 0; k < onlinePlayers.length; k++) {
				if (socket.id == onlinePlayers[k].socketID) {
					spliceindex = k;
					console.log("removing " + onlinePlayers[k].user.email + " from onlineplayers array");

				}
			}
			onlinePlayers.splice(spliceindex, 1);
			console.log("suanda online olan oyuncular")
			for (var k = 0; k < onlinePlayers.length; k++) {
				console.log(onlinePlayers[k].user.email);
			}
		}

	}

	// function createGameRoom(){
	// 	var ownerGotRoom = false;
	// 	//var roomID = 1;
	// 	var index;
	// 	for(var i = 0; i < rooms.length; i++){
	// 		if(socket.id === rooms[i].getOwnerID()){
	// 			ownerGotRoom = true;
	// 			index = i;
	//
	// 		}
	// 	}
	//
	// 	if(!ownerGotRoom){
	// 		//roomID = Math.random(10);
	// 		var room = new Room(socket.id, counter, io); //odayı yaratmak isteyenin odası yoksa yeni room yarat rooms arayine ekle
	// 		rooms.push(room);
	// 		console.log('emit createGameResponse created room for ' + socket.id);
	// 		var data = {
	// 		ownerGotRoom: ownerGotRoom,
	// 		roomID: counter
	//
	// 		}
	// 		counter++;
	// 	}else{
	// 		console.log('user owns a room ' + socket.id);
	// 		var data = {
	// 		ownerGotRoom: ownerGotRoom,
	// 		roomID: rooms[index].getRoomID()
	//
	// 		}
	// 	}
	// 	socket.emit('createGameResponse', data);
	// }
	function joinRoom(data) {
		var roomExist = false;
		var datasend = "böyle bir oda bulunmuyor";
		console.log(data);
		for (var i = 0; i < rooms.length; i++) {

			if (parseInt(data.roomID) === rooms[i].getRoomID()) {
				roomExist = true;
				console.log("oda var bu idli");
				for (var k = 0; k < rooms.length; k++) {//kullanıcı zaten bir odadaysa once o odadan cıkar
					if (rooms[k].searchPlayer(socket.id) === true) {
						socket.leave(rooms[k].getRoomID());
						rooms[k].leaveRoom(socket.id);
						console.log("user leaving room " + rooms[k].getRoomID());
					}
				}
				rooms[i].addPlayer(socket.id, data);//kullanıcıyı datayla gelen odaya ekle
				socket.join(parseInt(data.roomID));
				console.log(socket.id + " " + data.roomID + " kanalına girdi");
				/*if(rooms[i].getPlayerNumber() > 0){
					rooms[i].startGame(io);
				}*/
				datasend = data.roomID;
				//console.log(socket.adapter.rooms[parseInt(data)].sockets);

				rooms[i].printPlayers();
			}
		}
		var data1 = {
			roomID: datasend,
			roomExist: roomExist
		}
		socket.emit('joinGameResponse', data1);
	}

	function mesajDagit(data) {
		console.log("data");
		console.log(data)
		if (data.message !== "" && data.message !== " ") {
			for (var k = 0; k < rooms.length; k++) {
				if (rooms[k].getRoomID() === parseInt(data.roomID)) {
					rooms[k].checkCorrectWord(socket.id, data);
				}
			}

		}

	}


	function startTouchEmit(data) {
		//io.sockets.emit('startTouchMsg', data);
		socket.to(parseInt(data.roomID)).emit('startTouchMsg', data);
		//socket.broadcast.emit('startTouchMsg', data);
		// console.log("startTouch dagıtılıyor");
		// console.log(data);

	}
	function moveTouchEmit(data) {
		// normalde bu olcak
		// console.log("moveTouch dagıtılıyor");
		// console.log(data);

		socket.to(parseInt(data.roomID)).emit('moveTouchMsg', data);
		//socket.broadcast.emit('moveTouchMsg', data);
		//io.sockets.emit('moveTouchMsg', data);
		//console.log("moveTouch dagıtılıyor");
	}
	function upTouchEmit(data) {//direk roomid gelio
		//io.sockets.emit('upTouchMsg');

		socket.to(parseInt(data)).emit('upTouchMsg');
		//socket.broadcast.emit('upTouchMsg');
		// console.log("upTouch dagıtılıyor");
		// console.log("roomid uptouch " + data);
	}
	function clearCanvasEmit(data) {//direk roomid gelio
		socket.to(parseInt(data)).emit('clearCanvasMsg');
		//socket.broadcast.emit('clearCanvasMsg');
		console.log('clearcanvas emit ');
	}
	function thichnessChangeEmit(data) {
		socket.to(parseInt(data.roomID)).emit('thicknessChangeMsg', data.thickness);
		//socket.broadcast.emit('thicknessChangeMsg', data);
		console.log('thicknessChange emit ');
	}

	function colorChangeEmit(data) {
		socket.to(parseInt(data.roomID)).emit('colorChangeMsg', data.deger);
		//socket.broadcast.emit('colorChangeMsg', data);
	}
	function getInfo(data) {
		//io.sockets.emit('upTouchMsg');
		console.log('ROOMS');
		for (var i = 0; i < rooms.length; i++) {
			console.log('room owner ' + rooms[i].getOwnerID());
			console.log('room ID ' + rooms[i].getRoomID());
			rooms[i].printPlayers();
		}

	}
});

//game deneme
