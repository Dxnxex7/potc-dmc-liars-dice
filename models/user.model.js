//import { Schema } from "mongoose";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {type: String, required: true, unique: true, trim: true, minlength: 3},
    email: {type: String, required: true, unique: true, trim: true, minlength: 3},
    password: {type: String, required: true, unique: true, trim: true, minlength: 3},
    refreshTokenDB: {type: String, required: true},
    totalGamesPlayed: {type: Number, required: true},
    totalGamesWon: {type: Number, required: true},
    totalGamesLost: {type: Number, required: true},
    winStreak: {type: Number, required: true},
    winStreakPeak: {type: Number, required: true},
    leastTurnsForWin: {type: Number, required: true}
}, {
    timestamps: true
});

const User = mongoose.model('liars-dice-users', userSchema);

module.exports = User;