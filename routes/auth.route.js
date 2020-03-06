const router = require('express').Router();
const jwt = require('jsonwebtoken');
let User = require('../models/user.model');

//USER ACTION AUTHORIZATION ROUTE (get whether the access token is valid or not)
router.route('/').get((req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).send('invalidAccessToken');
    };
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).send('invalidAccessToken');
        } else {
            return res.status(200).end();
        };
    });
});

//LOGOUT ROUTE (post the refresh token cookie to invalidate)
router.route('/newAccessTokenOrLogout').post(grabRefreshTokenFromCookieHeader, authenticateRefreshToken, (req, res) => {
    //Delete refresh token cookie
    res.clearCookie('refreshTokenLiarsDice', {path: '/auth/newAccessTokenOrLogout', httpOnly: true});

    //Define user to logout
    const userToLogout = req.user;

    //Delete refresh token from MonogDB Atlas database
    User.updateOne({username: userToLogout}, {$set: {refreshTokenDB: ''}})
        .then(user => {
            return res.status(200).end();
        })
        .catch(err => {
            return res.status(500).send('error invalidating refresh token');
        });
});

//NEW ACCESS TOKEN ROUTE (get a new access token from the refresh token cookie)
router.route('/newAccessTokenOrLogout').get(grabRefreshTokenFromCookieHeader, authenticateRefreshToken, (req, res) => {
    const userToSerialize = {name: req.user};
    const accessToken = jwt.sign(userToSerialize, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '10m'});
    return res.status(200).json({accessToken: accessToken, name: req.user});
  
});

function grabRefreshTokenFromCookieHeader(req, res, next) {
    //Find the refresh token cookie
    let cookieHeader = req.headers['cookie'];
    if (cookieHeader) {
        const findCookie = cookieHeader.search('refreshTokenLiarsDice=');
        if (findCookie !== -1) {
            cookieHeader = cookieHeader.substring(findCookie);
            const findCookieEnd = cookieHeader.search(';');
            if (findCookieEnd !== -1) {
                cookieHeader = cookieHeader.substring(0, findCookieEnd);
                req.cookieHeader = cookieHeader.substring(22);
                next();
            } else {
                req.cookieHeader = cookieHeader.substring(22);
                next();
            };
        } else {
            res.clearCookie('refreshTokenLiarsDice', {path: '/auth/newAccessTokenOrLogout', httpOnly: true});
            return res.status(400).send(`noRefreshTokenCookie`);
        };
    } else {
        res.clearCookie('refreshTokenLiarsDice', {path: '/auth/newAccessTokenOrLogout', httpOnly: true});
        return res.status(400).send(`noRefreshTokenCookie`);
    };
};

function authenticateRefreshToken(req, res, next) {
    const refreshTokenReceived = req.cookieHeader;
    jwt.verify(refreshTokenReceived, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            res.clearCookie('refreshTokenLiarsDice', {path: '/auth/newAccessTokenOrLogout', httpOnly: true});
            return res.status(400).send(`invalidRefreshToken`);
        } else {
            User.findOne({username: user.name, refreshTokenDB: refreshTokenReceived}, (err, users) => {
                if (err || !users) {
                    res.clearCookie('refreshTokenLiarsDice', {path: '/auth/newAccessTokenOrLogout', httpOnly: true});
                    return res.status(400).send(`invalidRefreshToken`);
                } else {
                    req.user = user.name;
                    next();
                };
            });
        };
    });
};

module.exports = router;