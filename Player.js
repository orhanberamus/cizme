class Player {
    constructor(socket, email, userIcon, userName, userFrame) {
        this.socket = socket;
        this.email = email;
        this.userIcon = userIcon;
        this.userName = userName;
        this.userFrame = userFrame;
        this.type = "Player";
        this.roomID;
    }
    setRoomID(roomID) {
        this.roomID = roomID;
    }
    getInfo() {
        return {
            email: this.email,
            userIcon: this.userIcon,
            userName: this.userName,
            userFrame: this.userFrame,
            roomID: this.roomID
        }
    }
}
module.exports = Player;