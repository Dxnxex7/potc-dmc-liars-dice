//import { Schema } from "mongoose";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lobbyChatSchema = new Schema({
    chats: {type: Array, required: true}
}, {
    timestamps: true
});

const LobbyChat = mongoose.model('liars-dice-lobby-chats', lobbyChatSchema);

module.exports = LobbyChat;