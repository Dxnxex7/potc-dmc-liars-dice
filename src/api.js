import openSocket from 'socket.io-client';
const socket = openSocket('https://pure-wildwood-93382.herokuapp.com/');

//Check for connection
if (socket !== undefined) {
    //console.log(`Connected to socket.io!!!`);
};

//LOBBY EVENTS
export function emitJoinLobby(isLoggedIn) {
    socket.emit('join lobby', isLoggedIn);
};

export function emitLeaveLobby() {
    socket.emit('leave lobby');
};

export function gameHasStarted(cb) {
    socket.on('Game has started', msg => {
        cb(msg);
    });
};

export function stopListeningGameHasStarted() {
    socket.off('Game has started');
};

//END GAME EVENTS
export function gameEndDueToDC(cb) {
    socket.on('player dc', () => {
        cb();
    });
};

export function emitLeaveGame() {
    socket.emit('leave game');
};

//BEFORE ROUND EVENTS
export function emitPlayerReady(userDiceArray) {
    socket.emit('player ready', userDiceArray);
};

export function emitPlayerUnReady() {
    socket.emit('player un-ready');
};

export function opponentReady(cb) {
    socket.on('opponent ready', () => {
        cb();
    });
};

export function opponentUnReady(cb) {
    socket.on('opponent un-ready', () => {
        cb();
    });
};

export function beginRound(cb) {
    socket.on('begin round', (msg) => {
        cb(msg);
    });
};

export function stopListeningGameComponentEvents() {
    socket.off('player dc');
    socket.off('opponent ready');
    socket.off('opponent un-ready');
    socket.off('begin round');
};

//END ROUND EVENTS
export function emitPlayerForfeit() {
    socket.emit('player forfeit');
};

export function playerForfeited(cb) {
    socket.on('player forfeited', () => {
        cb();
    });
};

export function stopListeningPlayerForfeited() {
    socket.off('player forfeited');
};

//ROUND EVENTS
export function emitUserBet(betArray) {
    socket.emit('user chose bet', betArray);
};

export function sendBetToOpponent(cb) {
    socket.on('send bet to opponent', msg => {
        cb(msg);
    });
};

export function emitUserCall(result) {
    socket.emit('user chose call', result);
};

export function sendCallResultToOpponent(cb) {
    socket.on('send call result to opponent', msg => {
        cb(msg);
    });
};

export function emitUserLIAH(result) {
    socket.emit('user chose liar', result);
};

export function sendLIAHResultToOpponent(cb) {
    socket.on('send liar result to opponent', msg => {
        cb(msg);
    });
};

export function stopListeningGameButtonEvents() {
    socket.off('send bet to opponent');
    socket.off('send call result to opponent');
    socket.off('send liar result to opponent');
};

export function emitGameDataSaved() {
    socket.emit('game data saved');
};

export function renderHiscores(cb) {
    socket.on('render hiscores', () => {
        cb();
    });
};

export function stopListeningRenderHiscores() {
    socket.off('render hiscores');
};

//GAME CHAT

//chat
export function emitNewGameChat(newChat) {
    socket.emit('new game chat', newChat);
};

export function updateGameChat(cb) {
    socket.on('update game chat', msg => {
        cb(msg);
    });
};

export function stopListeningUpdateGameChat() {
    socket.off('update game chat');
};

//info
export function emitNewGameChatInfo(newChat) {
    socket.emit('new game chat info', newChat);
};

export function updateGameChatInfo(cb) {
    socket.on('update game chat info', msg => {
        cb(msg);
    });
};

export function stopListeningUpdateGameChatInfo() {
    socket.off('update game chat info');
};

//LOBBY CHAT

export function emitNewLobbyChat(newChat) {
    socket.emit('new lobby chat', newChat);
};

export function updateLobbyChat(cb) {
    socket.on('update lobby chat', msg => {
        cb(msg);
    });
};

export function stopListeningUpdateLobbyChat() {
    socket.off('update lobby chat');
};