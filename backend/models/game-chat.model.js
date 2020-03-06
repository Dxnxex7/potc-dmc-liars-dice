//import { Schema } from "mongoose";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameChatSchema = new Schema({
    username1: {type: String, required: true},
    username2: {type: String, required: true},
    chats: {type: Array, required: true}
}, {
    timestamps: true
});

const GameChat = mongoose.model('liars-dice-game-chats', gameChatSchema);

module.exports = GameChat;