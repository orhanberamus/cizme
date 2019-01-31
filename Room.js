'use strict';
class Room {

	constructor(ownerID, ownerEmail, roomID, io, capacity) {
		this.ownerID = ownerID;
		this.ownerEmail = ownerEmail;
		this.roomID = roomID;
		this.io = io;
		this.capacity = capacity;
		this.currentCapacity = 0;
		this.players = [];
		this.playerEmails = [];
		this.playerPoints = [];
		this.playerTurns = [];
		this.playerInfos = [];
		this.isGameStop = false;
		this.isGamePlaying = false;
		this.invitedPlayers = [];
		this.oynananturn = 0;
		this.k = 0;
		this.anlatilanKelime = "";
		this.botWordIndex = 0;
		this.chosenBotWords = [
			"aircraft carrier", "alarm clock", "ambulance", "ant", "anvil", "arm", "asparagus", "cat"
		]
		this.kelimeler = ["Bisiklet", "Uçak", "At", "Ayı", "Telefon", "Kitap", "Oyuncak", "Kol", "Ayna", "Yemek", "Okul", "Halhal", "Battaniye", "Şamdan", "Mancınık",
			"Tarak", "Yelpaze", "Ütü", "Anahtarlık", "Ruj", "Büyüteç", "Mikser", "Ayna", "Kapan", "Pipo", "Bavul", "Meşale", "Mezura", "Tripot", "Matara", "Çelenk", "Sünger", "Sınıf", "Tahta", "Silgi",
			"Yumurta", "Balon", "Şehzade", "Baba", "Kurşun", "Yılan", "Kamera", "Kayık", "Bot", "Buzdolabı", "Abaküs", "Ahize", "Alyans", "Anten", "Atkı", "Bardak", "Basketbol", "Biberon",
			"Bikini", "Boya", "Cetvel", "Çadır", "Çaydanlık", "Darbuka", "Falçata", "Fiş", "Bumerang", "Füze", "Giyotin", "Hançer", "Harita", "İğne", "Kadeh", "Kalemtraş", "Kepçe", "Kırbaç",
			"Kiremit", "Klavye", "Ponpon", "Kulaklık", "Küpe", "Küvet", "Levye", "Mandal", "Maske", "Merdiven", "Mızrak", "Mum"];
		this.bilenler = [];
		this.raunds = 5;
		this.chosenWords = [];
		//console.log(this.io);
	}

	addPlayer(player) {
		if (this.currentCapacity < this.capacity) {
			if (this.isGamePlaying) {
				this.updatePlayerTurns(player.socket.id);
			}
			// this.playerEmails.push(data.email);
			// this.playerInfos.push(data);
			this.players.push(player);
			this.playerInfos.push(player.getInfo())
			this.playerPoints.push(0);//0 puanı atanıo
			this.currentCapacity++;
			if (this.capacity === 6) {

				setTimeout(() => {
					this.emitPoints();
				}, 1000);
			} else {// arkadas odasıysa
				var spliceIndex;
				for (var k = 0; k < this.invitedPlayers.length; k++) {
					if (this.invitedPlayers[k].email === player.email) {
						spliceIndex = k;
					}
				}
				this.invitedPlayers.splice(spliceIndex, 1);// odaya eklenince invitedlardan sil // yeni
				// for (var i = 0; i < this.invitedPlayers.length; i++) {
				// 	console.log("invited player " + this.invitedPlayers[i].userName);
				// 	console.log("index " + this.playerEmails.indexOf(player.email));
				// }

				//console.log(this.io);
				//this.io.in(0).emit('countDownMsg', 2);
				//console.log("*****************");
				this.io.in(this.roomID).emit('invitedPlayers', this.invitedPlayers);
				setTimeout(() => {
					this.emitPoints();
				}, 1000);
			}
			if (this.players.length > 1 && this.isGamePlaying === false) {
				//	this.startGame();
			}

			//console.log(this.io);
		} else {
			console.log('oda dolu');
		}
	}
	declinedInvite(playerID, data) {// data = invited
		var spliceIndex;
		for (var k = 0; k < this.invitedPlayers.length; k++) {
			if (this.invitedPlayers[k].email === data.email) {
				spliceIndex = k;
			}
		}
		this.io.in(this.roomID).emit('declinedInvite', data);
		console.log("emit declinedinvite to game room  splice index =  " + spliceIndex);
		this.invitedPlayers.splice(spliceIndex, 1);// kabul etmeyince invitedlardan sil // yeni
		this.io.in(this.roomID).emit('invitedPlayers', this.invitedPlayers);
		setTimeout(() => {
			this.emitPoints();
		}, 1000);
	}
	addPlayertoInvitedList(friend) {
		this.invitedPlayers.push(friend);
		this.io.in(this.roomID).emit('invitedPlayers', this.invitedPlayers);
		setTimeout(() => {
			this.emitPoints();
		}, 1000);
	}
	printPlayers() {
		console.log("Room no " + this.roomID);
		console.log('players');
		//console.log(this.io);
		for (var i = 0; i < this.players.length; i++) {
			console.log(this.players[i].email);
		}
	}
	getOwnerID() {
		return this.ownerID;
	}
	getOwnerEmail() {
		return this.ownerEmail;
	}
	getRoomID() {
		return this.roomID;
	}

	/*disconnectPlayer(playerID){
		 var i = this.players.indexOf(playerID);
			this.players.splice(i, 1); //arraylerden id ve name i cıkar
      //userNames.splice(i, 1);
		this.currentCapacity--;
		if(this.currentcapacity < 2){
			this.isGameStop = true;
		}
	}*/
	leaveRoom(type, socketID, destroyRoom, addInvitable) {
		var index;

		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].type === "Player") {
				if (this.players[i].socket.id === socketID) {
					index = i;
				}
			}

		}
		if (this.getOwnerID() === socketID) {//owner cıkıyo
			if (this.players.length === 1) {//odada bitek owner varmıs o da cıkıyo
				//rooms.splice(i, 1); //callback lazım dısarıya destroylatcam
				//destroy room
				destroyRoom(this.roomID);

			} else {// odada baskaları da var onlara odanın baskanlıgını ver
				this.players.splice(index, 1);
				this.ownerID = this.players[0].socket.id; // ilk sıradakine ownerlıgı veriom
				this.playerPoints.splice(index, 1);
				for (var i = 0; i < this.playerTurns.length; i++) {
					if (socketID === this.playerTurns[i]) {
						this.playerTurns.splice(i, 1);
					}
				}
			}//kekoca ama anlaması kolay die böyle yazıom
		} else {// owner dısında biri cıkıyo
			this.players.splice(index, 1);
			this.playerPoints.splice(index, 1);
			for (var i = 0; i < this.playerTurns.length; i++) {
				if (socketID === this.playerTurns[i]) {
					this.playerTurns.splice(i, 1);
				}
			}
			if (type === "party") {
				addInvitable(socketID, this.ownerID);
			} else {// solo odaysa son oyuncu cıktıysa geriye botlar kaldıysa
				this.checkSoloDestroy(destroyRoom)
			}

		}

		if (this.players.length < 2) {// **** herkesi odadan cıkarmam lazım onu yapmadım
			this.isGameStop = true;
		}

		this.emitPoints();
		//console.log(this.playerInfos);
		//userNames.splice(i, 1);
	}
	checkSoloDestroy(destroyRoom) {
		var isEmpty = true;
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].type === "Player") {
				isEmpty = false;
			}
		}
		if (isEmpty) {
			destroyRoom();
		}
	}
	getPlayerNumber() {
		return this.players.length;
	}
	searchPlayer(playerID) {
		var bulundu = false;
		for (var i = 0; i < this.players.length; i++) {
			if (playerID === this.players[i].socket.id) {
				bulundu = true;
			} else {
				bulundu = false;
			}
		}
		return bulundu;
	}

	convertToRegex(str) {
		var array = [];
		for (var i = 0; i < str.length; i++) {
			// 0-9 a-z A-Z
			if ((str.charCodeAt(i) >= 48 && str.charCodeAt(i) <= 57) || (str.charCodeAt(i) >= 65 && str.charCodeAt(i) <= 90) || (str.charCodeAt(i) >= 97 && str.charCodeAt(i) <= 122
				|| str.charCodeAt(i) === 231 || str.charCodeAt(i) === 287 || str.charCodeAt(i) === 351 || str.charCodeAt(i) === 252 || str.charCodeAt(i) === 246)
			) {
				array.push("[" + str.charAt(i) + "]");
			}
		}
		var sonuc = array.join("");
		//console.log(sonuc);
		return new RegExp(sonuc, "gi");

	}
	generateWords() {
		var totalWords;
		var geciciWords = this.kelimeler.slice();
		var chosenWords = [];
		totalWords = this.getPlayerNumber() * this.raunds;
		for (var i = 0; i < totalWords; i++) {
			var rand = Math.floor(Math.random() * geciciWords.length);
			chosenWords.push(geciciWords[rand]);
			geciciWords.splice(rand, 1);
		}
		this.chosenWords = chosenWords;
		console.log(chosenWords);
	}
	emitPoints() {
		//console.log(this.players)
		var data = {
			userData: this.playerInfos,
			points: this.playerPoints,
			ownerEmail: this.ownerEmail
		}
		//console.log("roomid " + this.roomID);

		this.io.in(this.roomID).emit('points', data);
	}
	updatePoints() {
		var data = {
			players: this.playerEmails,
			points: this.playerPoints,
		}
		this.io.in(this.roomID).emit('updatePoints', data);
	}


	resetGameParameters() {
		this.isGamePlaying = false;
		this.anlatilanKelime = "";
		this.k = 0;
		this.oynananturn = 0;
		this.bilenler = [];
	}
	findTheWinner() {
		var birinciPuan = this.playerPoints[0];
		var birinciIndex = 0;
		for (var i = 1; i < this.playerPoints.length; i++) {
			if (this.playerPoints[i] > birinciPuan) {
				birinciPuan = this.playerPoints[i];
				birinciIndex = i;
			}
		}
		var data = {
			drawingPlayer: " ",
			frame: this.getFrameFromID(this.playerTurns[this.k]),
			message: "OYUN BİTTİ KAZANAN " + this.playerInfos[birinciIndex].userName
		}
		console.log("oyun bitti");
		/*var data1 = {
			playerEmails: this.playerEmails,
			playerPoints: this.playerPoints
		}*/
		this.io.in(this.roomID).emit('gameInfo', data);// update firebase mesajı yolla //herkesi anasayfaya yollama mesajı yolla
		this.updatePoints();
		// setTimeout(() => {
		// 	this.io.in(this.roomID).emit('goHome');
		// 	console.log("gohometriggered");
		// },10000);

		//this.io.in(this.roomID).emit('updatePoints', data1);
	}
	checkCorrectWord(playerID, data) {
		console.log("checkcorrect ")
		var alreadyanswered = false;
		if (this.anlatilanKelime.length !== 0) {//oyun baslamadıysa bırka muhabbet etsinler
			for (var k = 0; k < this.bilenler.length; k++) {
				if (this.bilenler[k] === playerID) {
					alreadyanswered = true;
				}
			}
			if (!alreadyanswered) {//zaten bilmemişse check et
				console.log("checking for " + data.message);
				console.log("regex anlatilan kelime " + this.anlatilanKelime);
				if (data.message.match(this.anlatilanKelime)) {
					var i = this.players.indexOf(this.findPlayer(playerID));
					var anlatan = this.players.indexOf(this.findPlayer(this.playerTurns[this.k]));
					if (this.bilenler.length === 0) {
						this.playerPoints[i] += 5;
						this.playerPoints[anlatan] += 1;
						this.bilenler.push(playerID);
						this.io.to(playerID).emit('bildin');

					}
					else if (this.bilenler.length === 1) {
						this.playerPoints[i] += 4;
						this.playerPoints[anlatan] += 1;
						this.bilenler.push(playerID);
						this.io.to(playerID).emit('bildin');

					}
					else if (this.bilenler.length === 2) {
						this.playerPoints[i] += 3;
						this.playerPoints[anlatan] += 1;
						this.bilenler.push(playerID);
						this.io.to(playerID).emit('bildin');

					}
					else if (this.bilenler.length === 3) {
						this.playerPoints[i] += 2;
						this.playerPoints[anlatan] += 1;
						this.bilenler.push(playerID);
						this.io.to(playerID).emit('bildin');

					}
					else if (this.bilenler.length === 4) {
						this.playerPoints[i] += 1;
						this.playerPoints[anlatan] += 1;
						this.bilenler.push(playerID);
						this.io.to(playerID).emit('bildin');

					}
					this.emitPoints();
				}
				else {//bilemediyse kelimeyi kendi roomundakilere yolluom
					// console.log(this.roomID + " numaralı odadan servera mesaj geldi dagitiliyor");
					// var tobeAppendtoChat =  data.userName + ": " + data.message;
					// this.io.in(this.roomID).emit('textm', tobeAppendtoChat);
					console.log(this.roomID + " numaralı odadan servera mesaj geldi dagitiliyor");
					console.log(data.userName);
					console.log(data.message);
					this.io.in(this.roomID).emit('textm', data);
				}
			} else {
				console.log(this.roomID + " numaralı odadan servera mesaj geldi dagitiliyor");
				console.log(data.userName);
				console.log(data.message);
				var tobeAppendtoChat = data.userName + ": " + data.message;
				this.io.in(this.roomID).emit('textm', data);
			}

		} else {
			console.log(this.roomID + " numaralı odadan servera mesaj geldi dagitiliyor");
			console.log(data.userName);
			console.log(data.message);
			var tobeAppendtoChat = data.userName + ": " + data.message;
			this.io.in(this.roomID).emit('textm', data);
		}


	}
	generatePlayerTurns(firstPlayerIndex) {
		var playerTurns = [];
		for (var i = 0; i < this.players.length * this.raunds; i++) {
			playerTurns[i] = this.players[(0 + i) % this.players.length].socket.id;//yeni arraye yerlestirme baslangıc firstindex
		}
		this.playerTurns = playerTurns;
	}
	updatePlayerTurns(newPlayerID) {
		var start = this.players.length;//ilk turun sonundan eklemeye baslıom yeni geleni her turun sonuna eklenio
		var newArray = this.playerTurns.slice();
		console.log("players lenght " + this.players.length);
		var startartis = 1;
		for (var k = 0; k < this.raunds - 1; k++) { // 1 2 3 4 indeks artısı

			for (var n = 0; n < this.players.length; n++) {
				var receiverindex = (start) + startartis;
				var giverindex = start;

				this.playerTurns[receiverindex] = newArray[giverindex];

				start++;
			}
			startartis++;
		}
		for (var i = 0; i < this.raunds; i++) {
			if (i === 0) {
				this.playerTurns[this.players.length] = newPlayerID;
			} else {
				this.playerTurns[this.players.length + (i * (this.players.length + 1))] = newPlayerID;;
			}
		}
	}
	startGame() {
		this.isGameStop = false;
		this.isGamePlaying = true;
		var rand = Math.random() * this.getPlayerNumber();
		//console.log("random " + rand);
		var firstPlayerIndex = Math.floor(rand); //get starting player index
		//console.log(firstPlayerIndex); this.generatePlayerTurns(this.getPlayers(), firstPlayerIndex, raunds);
		this.generateWords();
		this.generatePlayerTurns(firstPlayerIndex);
		this.playGame();

	}
	playGame() {
		this.ara();

	}
	ara() {
		this.anlatilanKelime = "";
		this.bilenler = [];
		var t = 3;
		console.log("Ara");

		if (this.k === 0) {
			var currentDrawer = this.findPlayer(this.playerTurns[this.k])
			if (currentDrawer.type !== "Bot") {
				console.log("currentDrawer.getInfo()")
				console.log(currentDrawer.getInfo())
				this.io.to(this.playerTurns[this.k]).emit('goDrawScreen', currentDrawer.getInfo());

				setTimeout(() => {
					this.io.in(this.roomID).emit('clearCanvasMsg');
				}, 1000);
			}

		} else {
			var currentDrawer = this.findPlayer(this.playerTurns[this.k]);
			var lastDrawer = this.findPlayer(this.playerTurns[this.k - 1]);
			if (currentDrawer.type !== "Bot") {
				this.io.to(this.playerTurns[this.k]).emit('goDrawScreen', currentDrawer.getInfo());
			}
			if (lastDrawer.type !== "Bot") {
				this.io.to(this.playerTurns[this.k - 1]).emit('goBackGameScreen', lastDrawer.getInfo());
			}
			setTimeout(() => {
				this.io.in(this.roomID).emit('clearCanvasMsg');
			}, 1000);
			console.log(currentDrawer.email + " navigate ")
			console.log(lastDrawer.email + "back ")
		}
		var data = {
			drawingPlayer: " ",
			frame: currentDrawer.userFrame,
			message: "Ara"
		}
		//this.io.in(this.roomID).emit('goBackGameScreen');
		//this.io.to(this.playerTurns[this.k]).emit('goDrawScreen');
		this.emitPoints();
		this.io.in(this.roomID).emit('gameInfo', data);
		this.araInternal = setInterval(() => {
			this.emitPoints();
			//console.log(this.isGameStop);
			if (!this.isGameStop) {//disconnecten true olduysa bidaki arada oyun durcak
				if (t === -1) {
					//io.sockets.emit('countDownMsg', "Süre doldu");
					this.io.in(this.roomID).emit('countDownMsg', 0);
					console.log("Süre doldu");
					this.playturn();
					clearInterval(this.araInternal);

					//startGame();
					//clearInterval(this);

				} else {
					//io.sockets.emit('countDownMsg', t);
					this.io.in(this.roomID).emit('countDownMsg', t);
					if (this.oynananturn === this.playerTurns.length) {//Oyun tamamlandı
						this.findTheWinner();
						this.resetGameParameters();
						this.io.in(this.roomID).emit('countDownMsg', " ");
						clearInterval(this.araInternal);
					} else {
						//console.log(t);
					}
				}
				t = t - 1;
			} else {
				data.message = "oyuncu yetersizliginden oyun durdu";
				this.io.in(this.roomID).emit('gameInfo', data);
				this.resetGameParameters();
				clearInterval(this.araInternal);

			}

		}, 1000);
	}
	findPlayer(socketID) {
		var player;
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].socket.id === socketID) {
				player = this.players[i]
			}
		}
		return player;

	}
	playturn() {
		var m = 10;// cizim suresi
		this.emitPoints();
		var currentDrawer = this.findPlayer(this.playerTurns[this.k]);
		console.log("Simdi ciziyor " + currentDrawer.userName);
		var data = {
			drawingPlayer: currentDrawer.email,
			frame: currentDrawer.userFrame,
			message: currentDrawer.userName + " çiziyor"
		}

		this.io.in(this.roomID).emit('gameInfo', data);

		if (currentDrawer.type === "Bot") {
			this.anlatilanKelime = this.convertToRegex(this.chosenBotWords[this.botWordIndex]);
			currentDrawer.draw(this.anlatilanKelime);
			this.playturnInterval = setInterval(() => {

				if (m === -1) {
					this.io.in(this.roomID).emit('countDownMsg', "Süre doldu");
					console.log("Süre doldu");
					currentDrawer.stop();
					this.botWordIndex++;
					this.oynananturn++;
					this.ara(this.playerTurns);
					clearInterval(this.playturnInterval);

					//startGame();
					//clearInterval(this);

				} else {
					//io.sockets.emit('countDownMsg', t);
					this.io.in(this.roomID).emit('countDownMsg', m);
					//console.log(m);
				}
				m = m - 1;
			}, 1000);
		} else {
			console.log(this.k)
			console.log(this.chosenWords[this.k])
			this.io.to(this.playerTurns[this.k]).emit('anlatilanKelime', this.chosenWords[this.k]);//playerTurnsde socketid tutuyorum
			this.anlatilanKelime = this.convertToRegex(this.chosenWords[this.k]);//regex halini tutuom
			this.playturnInterval = setInterval(() => {

				if (m === -1) {
					//io.sockets.emit('countDownMsg', "Süre doldu");
					this.io.in(this.roomID).emit('countDownMsg', "Süre doldu");
					console.log("Süre doldu");
					this.io.to(this.playerTurns[this.k]).emit('anlatilanKelime', ' ');
					this.k++;
					this.oynananturn++;
					this.ara(this.playerTurns);
					clearInterval(this.playturnInterval);

					//startGame();
					//clearInterval(this);

				} else {
					//io.sockets.emit('countDownMsg', t);
					this.io.in(this.roomID).emit('countDownMsg', m);
					//console.log(m);
				}
				m = m - 1;
			}, 1000);
		}


	}

}
module.exports = Room;
