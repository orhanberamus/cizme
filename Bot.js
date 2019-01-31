'use strict';
var ndjson = require('ndjson');
var fs = require('fs');
class Bot {
    constructor(io, email, userIcon, userName, userFrame, roomID) {
        this.io = io;
        this.email = "1@1.com";
        this.userIcon = userIcon;
        this.userName = userName;
        this.userFrame = userFrame;
        this.roomID = roomID;
        this.type = "Bot";
        this.isDrawing = false;
        this.socket = {
            id: 1
        }


    }
    getInfo() {
        return {
            email: this.email,
            userIcon: this.userIcon,
            userName: this.userName,
            userFrame: this.userFrame
        }
    }
    draw(drawing) {
        this.isDrawing = true;
        drawing = "cat";
        var rand = Math.random(1) * 12;
        var ind = Math.round(rand);
        var fullArray = [];
        new Promise(function (resolve, reject) {
            fs.readFile('./data/data_' + drawing + '.json', function (err, data) {
                fullArray = JSON.parse(data);
                resolve()
            });
        }).then(async () => {
            var ind2 = Math.round(Math.random(1) * fullArray.length);
            var arr = fullArray[11].drawing;
            var sendData = {
                senderWidth: 320,
                senderHeight: 320

            }
            for (var i = 0; i < arr.length; i++) {
                for (var j = 0; j < arr[i][0].length; j++) {
                    for (var k = 0; k < arr[i].length; k++) {// 2 x y
                        if (k === 0) {
                            sendData.x = parseFloat(arr[i][k][j] + 50)
                            // console.log("x" + j + " " + arr[i][k][j]);
                        } else {
                            sendData.y = parseFloat(arr[i][k][j] + 50);
                            //console.log("y" + j + " " + arr[i][k][j]);
                        }

                    }
                    await new Promise(resolve => {
                        if (this.isDrawing) {
                            setTimeout(() => {
                                if (j === 0) {
                                    this.io.to(parseInt(this.roomID)).emit('startTouchMsg', sendData);
                                }
                                this.io.to(parseInt(this.roomID)).emit('moveTouchMsg', sendData);
                                this.io.to(parseInt(this.roomID)).emit('upTouchMsg', this.roomID);
                                this.io.to(parseInt(this.roomID)).emit('startTouchMsg', sendData);
                                resolve();
                            }, 50)
                        } else {
                            resolve();
                        }

                    });

                }

            }
        })
    }
    stop() {
        this.isDrawing = false;
    }
}
module.exports = Bot;