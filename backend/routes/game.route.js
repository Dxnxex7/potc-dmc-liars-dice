const router = require('express').Router();
let User = require('../models/user.model');
let GameChat = require('../models/game-chat.model');

router.route('/saveGameData').post((req, res) => {
    const players = req.body;
    players.forEach(player => {
        User.findOne({username: player.name}, (err, user) => {
            if (err || !user) {
                //oh well
            } else if (player.result === 'win') {
                const playersLeastTurns = user.leastTurnsForWin;
                if (player.turns < playersLeastTurns || playersLeastTurns === 0) {
                    User.updateOne({username: player.name}, {$set: {leastTurnsForWin: player.turns}})
                    .then(user => {
                        //woo hoo
                    })
                    .catch(err => {
                        //oh well
                    });
                };
                User.updateOne({username: player.name}, {$inc: {totalGamesPlayed: 1, totalGamesWon: 1, winStreak: 1}})
                .then(user => {
                    //woo hoo
                })
                .catch(err => {
                    //oh well
                });
            } else if (player.result === 'lose') {
                User.updateOne({username: player.name}, {$inc: {totalGamesPlayed: 1, totalGamesLost: 1}}, {$set: {winStreak: 0}})
                .then(user => {
                    //woo hoo
                })
                .catch(err => {
                    //oh well
                });
                User.updateOne({username: player.name}, {$set: {winStreak: 0}})
                .then(user => {
                    //woo hoo
                })
                .catch(err => {
                    //oh well
                });
            };
        });
    });
    res.status(200).end();
});

router.route('/getGameChat').post((req, res) => {
    const user1 = req.body.username1;
    const user2 = req.body.username2;
    GameChat.findOne({username1: user1, username2: user2}, (err, chat1) => {
        if (err || !chat1) {
            GameChat.findOne({username1: user2, username2: user1}, (err, chat2) => {
                if (err || !chat2) {
                    return res.status(400).end();
                } else {
                    return res.status(200).send(chat2.chats);
                };
            });
        } else {
            return res.status(200).send(chat1.chats);
        };
    });
});

router.route('/saveGameChat').post((req, res) => {
    const username1 = req.body.username1;
    const username2 = req.body.username2;
    const chats = req.body.chats;

    GameChat.findOne({username1: username1, username2: username2}, (err, chat1) => {
        if (err || !chat1) {
            GameChat.findOne({username1: username2, username2: username1}, (err, chat2) => {
                if (err || !chat2) {
                    const newGameChat = new GameChat({
                        username1,
                        username2,
                        chats
                    });
                    newGameChat.save()
                        .then(res => {
                            return res.status(200).end();
                        })
                        .catch(err => {
                            return res.status(400).end();
                        });
                } else {
                    GameChat.updateOne({username1: username2, username2: username1}, {$set: {chats: [...chat2.chats, chats]}})
                        .then(res => {
                            return res.status(200).end();
                        })
                        .catch(err => {
                            return res.status(400).end();
                        });
                };
            });
        } else {
            GameChat.updateOne({username1: username1, username2: username2}, {$set: {chats: [...chat1.chats, chats]}})
                .then(res => {
                    return res.status(200).end();
                })
                .catch(err => {
                    return res.status(400).end();
                });
        };
    });
});

module.exports = router;