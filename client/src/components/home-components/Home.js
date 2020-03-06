import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as SocketAPI from '../../api';
import DMCLOGO from '../../images/POTC-DMC-Logo.png';

import Hiscore from './Hiscore';

export default function Home({checkUserAuthorizationSlashGenerateNewAccessToken, isLoggedIn, setPage, toLoginPage, logoutStates, setOpponentName, page}) {

    const [joinButton, setJoinButton] = useState(false);
    const [joinLobbyErrorText, setJoinLobbyErrorText] = useState('');
    const [lobbyChat, setLobbyChat] =  useState([]);
    const [lobbyChatInput, setLobbyChatInput] =  useState('');

    const lobbyChatRef = useRef();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current.scrollIntoView({ behavior: "auto" })
    };

    useEffect(scrollToBottom, [lobbyChat]);

    useEffect(() => {
        SocketAPI.gameHasStarted((opName) => {
            checkUserAuthorizationSlashGenerateNewAccessToken(() => {
                setOpponentName(opName);
                setPage('game');
            });
        });

        return () => {
            SocketAPI.stopListeningGameHasStarted();
        };
    }, []);

    useEffect(() => {
        SocketAPI.updateLobbyChat(newChat => {
            setLobbyChat([...lobbyChat, newChat]);
        });

        return () => {
            SocketAPI.stopListeningUpdateLobbyChat();
        };
    }, [lobbyChat]);

    //Logout user functionality
    const logoutNow = () => {
        SocketAPI.emitLeaveLobby();
        logoutStates();
        setJoinButton(false);
        setJoinLobbyErrorText('');
        axios.post('https://pure-wildwood-93382.herokuapp.com/auth/newAccessTokenOrLogout/', 'data lol', {withCredentials: true})
            .then(res => {
                //console.log(`successfully logged out!!!`);
            })
            .catch(err => {
                //console.log(`error logging out...`);
            });
    };

    //Join and leave lobby, and initiate game
    const joinLobby = () => {
        if (isLoggedIn !== false) {
            checkUserAuthorizationSlashGenerateNewAccessToken(() => {
                SocketAPI.emitJoinLobby(isLoggedIn);
                setJoinButton(true);
                setJoinLobbyErrorText(`Waiting for another player to join...`);
            });
        } else {
            setJoinLobbyErrorText(`You must login to play Liar's Dice!`);
        };
    };

    const leaveLobby = () => {
        checkUserAuthorizationSlashGenerateNewAccessToken(() => {
            SocketAPI.emitLeaveLobby();
            setJoinButton(false);
            setJoinLobbyErrorText('');
        });
    };

    //LOBBY CHAT MESSAGE SENDING

    const updateLobbyChatInputState = (e) => {
        setLobbyChatInput(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            sendLobbyChatMessage();
        }
    };

    const sendLobbyChatMessageFunction = () => {
        if (lobbyChatInput !== '') {
            let messageFrom = '';
            if (isLoggedIn !== false) {
                messageFrom = isLoggedIn.toLowerCase();
            } else {
                messageFrom = 'guest';
            };
            const newChat = {from: messageFrom, message: lobbyChatInput};
            //update state
            setLobbyChat([...lobbyChat, newChat]);
            //save in chat database
            axios.post('https://pure-wildwood-93382.herokuapp.com/lobby/saveLobbyChat', {chats: newChat})
            .then(res => {
                //yay
            })
            .catch(err => {
                //oh well
            });
            //send to opponent to update their state
            SocketAPI.emitNewLobbyChat(newChat);
            //clear states and focus
            setLobbyChatInput('');
            lobbyChatRef.current.value = '';
            lobbyChatRef.current.focus();
        } else {
            lobbyChatRef.current.focus();
        };
    };

    const sendLobbyChatMessage = () => {
        if (isLoggedIn === false) {
            sendLobbyChatMessageFunction();
        } else {
            checkUserAuthorizationSlashGenerateNewAccessToken(() => {
                sendLobbyChatMessageFunction();
            });
        };
    };

    return (
        <div className="home-container">
            <div className="home-screen">
                <div className="lobby-main">
                    <div className="play-area">
                        <div className="join-button">
                            {joinButton === false &&
                                <button className="btn-join-lobby" onClick={joinLobby}>Play Now!</button>
                            }
                            {joinButton === true &&
                                <button className="btn-leave-lobby" onClick={leaveLobby}>Leave the lobby...</button>
                            }
                        </div>
                        <div className="join-error-text">{joinLobbyErrorText}</div>
                    </div>
                    <div className="logo-area">
                        <img className="logo-home" src={DMCLOGO} alt="Pirates of the Caribbean: Dead Man's Chest; Logo" />
                    </div>
                    <div className="login-area">
                        {isLoggedIn === false &&
                            <div className="login-text">You are not logged in.</div>
                        }
                        {isLoggedIn !== false &&
                            <div className="login-text">Welcome, {isLoggedIn}!</div>
                        }
                        <div className="login-button">
                            {isLoggedIn === false &&
                                <button className="btn-login" onClick={toLoginPage}>Login/Register</button>
                            }
                            {isLoggedIn !== false &&
                                <button className="btn-logout" onClick={logoutNow}>Logout</button>
                            }
                        </div>
                    </div>
                </div>
                <div className="lobby-chat">
                    <div className="chat-title">Lobby Chat</div>
                    <div className="all-chat-messages">
                        {lobbyChat.map((value, index) => {
                        return (
                            <React.Fragment key={index}>
                                {isLoggedIn === false && 
                                    <div className="lobby-chat-message other-color">
                                        <div className="message-from">From {value.from.charAt(0).toUpperCase() + value.from.slice(1)}:</div>
                                        <div className="message-content">{value.message}</div>
                                    </div>
                                }
                                {isLoggedIn !== false && 
                                    <>
                                    {value.from === isLoggedIn.toLowerCase() && 
                                        <div className="lobby-chat-message user-color">
                                            <div className="message-from">You:</div>
                                            <div className="message-content">{value.message}</div>
                                        </div>
                                    }
                                    {value.from !== isLoggedIn.toLowerCase() && 
                                        <div className="lobby-chat-message other-color">
                                            <div className="message-from">From {value.from.charAt(0).toUpperCase() + value.from.slice(1)}:</div>
                                            <div className="message-content">{value.message}</div>
                                        </div>
                                    }
                                    </>
                                }
                            </React.Fragment>
                        )
                        })
                        }
                        <label ref={messagesEndRef} className="empty-div"/>
                    </div>
                    <input ref={lobbyChatRef} onChange={updateLobbyChatInputState} onKeyDown={handleKeyDown} type="text" className="lobby-chat-input" placeholder="chat to lobby..."></input>
                    <button className="lobby-chat-button" onClick={sendLobbyChatMessage}>Send</button>
                </div>
                <Hiscore page={page} />
            </div>
        </div>
    )
};
