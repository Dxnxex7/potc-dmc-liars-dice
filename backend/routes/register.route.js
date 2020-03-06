const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
let User = require('../models/user.model');

router.route('/').post(async (req, res) => {
    try {
        //Hash new user's password with a salt
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        //Create access tokens for user
        const userToSerialize = {name: req.body.user.toLowerCase()};
        const accessToken = jwt.sign(userToSerialize, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '10m'});
        const refreshToken = jwt.sign(userToSerialize, process.env.REFRESH_TOKEN_SECRET);

        //Define all the variables before creating new user
        const username = req.body.user.toLowerCase();
        const email = req.body.email.toLowerCase();
        const password = hashedPassword;
        const refreshTokenDB = refreshToken;
        const totalGamesPlayed = Number(req.body.totalGamesPlayed);
        const totalGamesWon = Number(req.body.totalGamesWon);
        const totalGamesLost = Number(req.body.totalGamesLost);
        const winStreak = Number(req.body.winStreak);
        const leastTurnsForWin = Number(req.body.leastTurnsForWin);

        //Create new user with the User model
        const createUser = new User({
            username,
            email,
            password,
            refreshTokenDB,
            totalGamesPlayed,
            totalGamesWon,
            totalGamesLost,
            winStreak,
            leastTurnsForWin
        });

        //Save new user to the MongoDB Atlas Database
        createUser.save()
            .then(user => {
                res.cookie('refreshTokenLiarsDice', refreshToken, {path: '/auth/newAccessTokenOrLogout', httpOnly: true});
                return res.status(200).json({accessToken: accessToken, name: username});
            })
            .catch(err => res.status(400).send('serverError'));
    } catch (err) {
        res.status(500).send('serverError');
        console.log(`Server Error while creating account: ${err}`);
    };
});

router.route('/checkUsername').post((req, res) => {
    try {
        const usernameToCheck = req.body.username;
        User.findOne({username: usernameToCheck}, (err, users) => {
            if (err || !users) {
                return res.status(200).send(`usernameDoesNotExist`);
            } else {
                return res.status(401).send(`usernameAlreadyExists`);
            };
        });
    } catch (err) {
        res.status(500).send('serverError');
        console.log(`Server Error while checking username availability: ${err}`);
    };
});

router.route('/checkEmail').post((req, res) => {
    try {
        const emailToCheck = req.body.email;
        User.findOne({email: emailToCheck}, (err, users) => {
            if (err || !users) {
                return res.status(200).send(`emailDoesNotExist`);
            } else {
                return res.status(401).send(`emailAlreadyExists`);
            };
        });
    } catch (err) {
        res.status(500).send('serverError');
        console.log(`Server Error while checking email availability: ${err}`);
    };
});

module.exports = router;