const router = require('express').Router();
let User = require('../models/user.model');
let LobbyChat = require('../models/lobby-chat.model');

router.route('/saveLobbyChat').post((req, res) => {
    const chats = req.body.chats;

    LobbyChat.findOne({}, (err, chat) => {
        if (err || !chat) {
            //oh well
        } else {
            LobbyChat.updateOne({}, {$set: {chats: [...chat.chats, chats]}})
            .then(res => {
                return res.status(200).end();
            })
            .catch(err => {
                return res.status(400).end();
            });
        };
    });
});

router.route('/getHiscoreData').get((req, res) => {
    User.find({}, (err, users) => {
        if (err || !users) {
            return res.status(400).end();
        } else {
            let hiscoreData = [];
            users.forEach(user => {
                let leastTurnsData = '';
                if (user.leastTurnsForWin === 0) {
                    leastTurnsData = 'n/a';
                } else {
                    leastTurnsData = user.leastTurnsForWin;
                };
                const displayName = user.username.charAt(0).toUpperCase() + user.username.slice(1);
                hiscoreData.push({username: displayName, totalGamesPlayed: user.totalGamesPlayed, totalGamesWon: user.totalGamesWon, totalGamesLost: user.totalGamesLost, winStreak: user.winStreak, leastTurnsForWin: leastTurnsData});
            });
            return res.status(200).send(hiscoreData);
        };
    });
});

module.exports = router;