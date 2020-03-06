const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
let User = require('../models/user.model');

router.route('/').post((req, res) => {
        //Define user login credentials
        const usernameOrEmail = req.body.usernameOrEmail.toLowerCase();
        const password = req.body.password;

        //Attempt to find credentials in database
        User.findOne({username: usernameOrEmail}, async (err, name) => {
            try {
                if (err || !name) {
                    User.findOne({email: usernameOrEmail}, async (err, email) => {
                        try {
                            if (err || !email) {
                                return res.status(400).send(`usernameAndEmailNotFound`);
                            } else {
                                //compare passwords with email login
                                if (await bcrypt.compare(password, email.password)) {
                                    const userToSerialize = {name: email.username};
                                    const accessToken = jwt.sign(userToSerialize, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '10m'});
                                    const refreshToken = jwt.sign(userToSerialize, process.env.REFRESH_TOKEN_SECRET);
                                    User.updateOne({email: usernameOrEmail}, {$set: {refreshTokenDB: refreshToken}})
                                        .then(user => {
                                            res.cookie('refreshTokenLiarsDice', refreshToken, {path: '/auth/newAccessTokenOrLogout', httpOnly: true});
                                            return res.status(200).json({accessToken: accessToken, name: email.username});
                                        })
                                        .catch(err => {
                                            res.status(500).send('serverError');
                                            console.log(`Server Error while logging in user via email: ${err}`);
                                        });
                                } else {
                                    return res.status(401).send(`loginFail`);
                                };
                            };
                        } catch (err) {
                            res.status(500).send('serverError');
                            console.log(`Server Error while logging in user via email: ${err}`);
                        };
                    });
                } else {
                    //compare passwords with name login
                    if (await bcrypt.compare(password, name.password)) {
                        const userToSerialize = {name: name.username};
                        const accessToken = jwt.sign(userToSerialize, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '10m'});
                        const refreshToken = jwt.sign(userToSerialize, process.env.REFRESH_TOKEN_SECRET);
                        User.updateOne({username: usernameOrEmail}, {$set: {refreshTokenDB: refreshToken}})
                            .then(user => {
                                res.cookie('refreshTokenLiarsDice', refreshToken, {path: '/auth/newAccessTokenOrLogout', httpOnly: true});
                                return res.status(200).json({accessToken: accessToken, name: name.username});
                            })
                            .catch(err => {
                                res.status(500).send('serverError');
                                console.log(`Server Error while logging in user via username: ${err}`);
                            });
                    } else {
                        return res.status(401).send(`loginFail`);
                    };
                };
            } catch (err) {
                res.status(500).send('serverError');
                console.log(`Server Error while logging in user via username: ${err}`);
            };
        });
});

module.exports = router;