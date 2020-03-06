const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const io = require('socket.io');
require('dotenv').config();

//Express server
const app = express();
const port = process.env.PORT || 3000;
const server = require('http').createServer(app);
server.listen(port, () => {
    console.log(`Server is listening on port ${port}...!`);
});

//Middleware
app.use(cors({credentials: true, origin: true}));
app.use(express.json());

//ROUTES

const registerRouter = require('./routes/register.route');
app.use('/register', registerRouter);

const loginRouter = require('./routes/login.route');
app.use('/login', loginRouter);

const authRouter = require('./routes/auth.route');
app.use('/auth', authRouter);

const gameRouter = require('./routes/game.route');
app.use('/game', gameRouter);

const lobbyRouter = require('./routes/lobby.route');
app.use('/lobby', lobbyRouter);

//Mongoose/MongoDB Atlas connection
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once('open', () => {
    console.log(`MongoDB database connection established successfully!`)
});

//Socket.io connection
const SocketIO = io.listen(server);
//Users in the lobby
const lobby = [];
//Users in games
const game = [];

//Socket.io
SocketIO.sockets.on('connection', socket => {
    //console.log(`user connected`);

    socket.on('join lobby', (isLoggedIn) => {
        lobby.push({socketID: socket.id, username: isLoggedIn});
        if (lobby.length >= 2) {
            //Grab the first two users waiting in the lobby
            const socket1 = lobby[0];
            const socket2 = lobby[1];

            //Remove these two users from the lobby
            const userLeaveLobby1 = lobby.findIndex(element => (element.socketID == socket.id));
            lobby.splice(userLeaveLobby1, 1);
            const userLeaveLobby2 = lobby.findIndex(element => (element.socketID == socket.id));
            lobby.splice(userLeaveLobby2, 1);

            //Add these two users as an object to the game array
            game.push({id1: socket1.socketID, id2: socket2.socketID});

            //Emit to these two users that their game is starting
            SocketIO.to(socket1.socketID).emit(`Game has started`, socket2.username);
            SocketIO.to(socket2.socketID).emit(`Game has started`, socket1.username);
        };
    });

    socket.on('leave lobby', () => {
        const lobbyIndex = lobby.findIndex(element => (element.socketID == socket.id));
        if (lobbyIndex !== -1) {
            lobby.splice(lobbyIndex, 1);
        };
    });

    socket.on('leave game', () => {
        const gameIndex = game.findIndex(element => (element.id1 == socket.id || element.id2 == socket.id));
        if (gameIndex !== -1) {
            //Emit to the second player that the game ended due to leave
            let secondPlayer = findSecondPlayer(socket.id);
            SocketIO.to(secondPlayer).emit(`player dc`);
            
            //Delete the game from the game array
            game.splice(gameIndex, 1);
        };
    });

    socket.on('disconnect', () => {
        //Remove users from lobby on DC if they are in the lobby
        const lobbyIndex = lobby.findIndex(element => (element.socketID == socket.id));
        if (lobbyIndex !== -1) {
            lobby.splice(lobbyIndex, 1);
        };

        //Check if the user who dc'd was in a game
        const gameIndex = game.findIndex(element => (element.id1 == socket.id || element.id2 == socket.id));
        //If the user was in a game, delete the game and alert the second player
        if (gameIndex !== -1) {
            let secondPlayer = '';
            const gameEnding = game[gameIndex];
            if (gameEnding.id1 === socket.id) {
                secondPlayer = gameEnding.id2;
            } else if (gameEnding.id2 === socket.id) {
                secondPlayer = gameEnding.id1;
            };
            //Delete the game from the game array
            game.splice(gameIndex, 1);

            //Emit to the second player that the game ended due to dc
            SocketIO.to(secondPlayer).emit(`player dc`);
        };
    });

    //GAME COMMANDS

    socket.on('player ready', (userDiceArray) => {
        //Notify opponent that user is ready to start game
        let secondPlayer = findSecondPlayer(socket.id);
        SocketIO.to(secondPlayer).emit(`opponent ready`);

        //Save user ready state in game array and begin round if both ready
        //First user who was ready is given the first turn
        const gameIndex = game.findIndex(element => (element.id1 == socket.id || element.id2 == socket.id));
        if (gameIndex !== -1) {
            const currentGame = game[gameIndex];
            if (currentGame.id1 === socket.id) {
                game[gameIndex].user1Ready = true;
                game[gameIndex].user1Dice = userDiceArray;
                if (currentGame.user2Ready === true) {
                    SocketIO.to(currentGame.id1).emit(`begin round`, {turn: 'secondTurn', dice: currentGame.user1Dice, opponentDice: currentGame.user2Dice});
                    SocketIO.to(currentGame.id2).emit(`begin round`, {turn: 'firstTurn', dice: currentGame.user2Dice, opponentDice: currentGame.user1Dice});
                    game[gameIndex].user1Ready = false;
                    game[gameIndex].user2Ready = false;
                    game[gameIndex].user1Dice = [];
                    game[gameIndex].user2Dice = [];
                };
            } else if (currentGame.id2 === socket.id) {
                game[gameIndex].user2Ready = true;
                game[gameIndex].user2Dice = userDiceArray;
                if (currentGame.user1Ready === true) {
                    SocketIO.to(currentGame.id1).emit(`begin round`, {turn: 'firstTurn', dice: currentGame.user1Dice, opponentDice: currentGame.user2Dice});
                    SocketIO.to(currentGame.id2).emit(`begin round`, {turn: 'secondTurn', dice: currentGame.user2Dice, opponentDice: currentGame.user1Dice});
                    game[gameIndex].user1Ready = false;
                    game[gameIndex].user2Ready = false;
                    game[gameIndex].user1Dice = [];
                    game[gameIndex].user2Dice = [];
                };
            };
        };
    });

    socket.on('player un-ready', () => {
        //Notify opponent that user is no longer ready to start game
        let secondPlayer = findSecondPlayer(socket.id);
        SocketIO.to(secondPlayer).emit(`opponent un-ready`);

        //Remove user ready state from game array
        const gameIndex = game.findIndex(element => (element.id1 == socket.id || element.id2 == socket.id));
        if (gameIndex !== -1) {
            const currentGame = game[gameIndex];
            if (currentGame.id1 === socket.id) {
                game[gameIndex].user1Ready = false;
                game[gameIndex].user1Dice = [];
            } else if (currentGame.id2 === socket.id) {
                game[gameIndex].user2Ready = false;
                game[gameIndex].user2Dice = [];
            };
        };
    });

    socket.on('player forfeit', () => {
        //Emit to second player that user forfeited the round
        let secondPlayer = findSecondPlayer(socket.id);
        SocketIO.to(secondPlayer).emit(`player forfeited`);

        //Mark both players as not ready on server
        const gameIndex = game.findIndex(element => (element.id1 == socket.id || element.id2 == socket.id));
        game[gameIndex].user1Ready = false;
        game[gameIndex].user2Ready = false;
    });

    socket.on('user chose bet', (betArray) => {
        let secondPlayer = findSecondPlayer(socket.id);
        SocketIO.to(secondPlayer).emit(`send bet to opponent`, betArray);
    });

    socket.on('user chose call', (result) => {
        let secondPlayer = findSecondPlayer(socket.id);
        SocketIO.to(secondPlayer).emit(`send call result to opponent`, result);
    });

    socket.on('user chose liar', (result) => {
        let secondPlayer = findSecondPlayer(socket.id);
        SocketIO.to(secondPlayer).emit(`send liar result to opponent`, result);
    });

    socket.on('game data saved', () => {
        socket.broadcast.emit(`render hiscores`);
    });

    socket.on('new game chat', (newChat) => {
        let secondPlayer = findSecondPlayer(socket.id);
        SocketIO.to(secondPlayer).emit(`update game chat`, newChat);
    });

    socket.on('new game chat info', (newChat) => {
        let secondPlayer = findSecondPlayer(socket.id);
        SocketIO.to(secondPlayer).emit(`update game chat info`, newChat);
    });

    socket.on('new lobby chat', (newChat) => {
        socket.broadcast.emit(`update lobby chat`, newChat);
    });
});

//Determine the opposing player everytime an event is emitted to the server
function findSecondPlayer(socket) {
    const gameIndex = game.findIndex(element => (element.id1 == socket || element.id2 == socket));
    const currentGame = game[gameIndex];
    if (currentGame.id1 === socket) {
        return currentGame.id2;
    } else if (currentGame.id2 === socket) {
        return currentGame.id1;
    };
};