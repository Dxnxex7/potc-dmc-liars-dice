import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as SocketAPI from '../../api';

import BtnStartGame from './BtnStartGame';
import BtnLeave from './BtnLeave';
import BtnThreeActions from './BtnThreeActions';

import Dice1 from '../../images/plain-dice-1.png';
import Dice2 from '../../images/plain-dice-2.png';
import Dice3 from '../../images/plain-dice-3.png';
import Dice4 from '../../images/plain-dice-4.png';
import Dice5 from '../../images/plain-dice-5.png';
import Dice6 from '../../images/plain-dice-6.png';
import DiceQuestionMark from '../../images/question-mark-dice.png';

export default function Game({checkUserAuthorizationSlashGenerateNewAccessToken, isLoggedIn, setPage, opponentName, setOpponentName}) {

    //Game state: 0 = not started, 1 = started, 2 = ended
    const [gameState, setGameState] = useState(0);
    const [userDice, setUserDice] = useState(0);
    const [opponentDice, setOpponentDice] = useState(0);
    const [leave, setLeave] = useState(0);
    const [ready, setReady] = useState(false);
    const [forfeit, setForfeit] = useState(0);
    const [gamesPlayed, setGamesPlayed] = useState(0);
    const [playerTurn, setPlayerTurn] = useState(false);
    const [userPreviousBet, setUserPreviousBet] = useState([0, 0]);
    const [opponentPreviousBet, setOpponentPreviousBet] = useState([0, 0]);
    const [userNumberOfTurns, setUserNumberOfTurns] = useState(0);
    const [opponentNumberOfTurns, setOpponentNumberOfTurns] = useState(0);
    const [leaveErrorText, setLeaveErrorText] = useState('');
    const [playErrorText, setPlayErrorText] = useState('');
    const [generalMessageText, setGeneralMessageText] = useState('');
    const [gameResultText, setGameResultText] = useState(`Ready to Play?`);
    const [gameChat, setGameChat] = useState([]);
    const [gameChatInput, setGameChatInput] = useState('');
    const [userWonOrLost, setUserWonOrLost] = useState('');
    const [piratesQuote, setPiratesQuote] = useState('');

    const gameChatRef = useRef();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        axios.post('https://pure-wildwood-93382.herokuapp.com/game/getGameChat', {username1: isLoggedIn.toLowerCase(), username2: opponentName.toLowerCase()})
            .then(res => {
                setGameChat(res.data);
            })
            .catch(err => {
                //console.log(`no game chat history to display`);
            });
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current.scrollIntoView({ behavior: "auto" })
    };

    useEffect(scrollToBottom, [gameChat]);

    useEffect(() => {
        SocketAPI.gameEndDueToDC(() => {
            resetStates();
            setGameState(2);
            setGeneralMessageText(`${opponentName} disconnected and this game session has ended.`);
            const newChat = {from: '[game info]', message: `${opponentName} disconnected. Game session ended.`};
            setGameChat([...gameChat, newChat]);
        });

        SocketAPI.opponentReady(() => {
            setPlayErrorText(`Opponent is ready...`);
        });
    
        SocketAPI.opponentUnReady(() => {
            setPlayErrorText(`Opponent is no longer ready.`);
        });
    
        SocketAPI.beginRound((msg) => {
            checkUserAuthorizationSlashGenerateNewAccessToken(() => {
                setGameState(1);
                setLeaveErrorText('');
                setPlayErrorText('');
                setGeneralMessageText('');
                setUserDice(msg.dice);
                setOpponentDice(msg.opponentDice);
                setUserPreviousBet([0, 0]);
                setOpponentPreviousBet([0, 0]);
                setUserNumberOfTurns(0);
                setOpponentNumberOfTurns(0);
                setUserWonOrLost('');
                setGameResultText('Playing...');
                if (msg.turn === `firstTurn`) {
                    setPlayerTurn(true);
                    const newChat = {from: '[game info]', message: `Game started! You have the first turn!`};
                    setGameChat([...gameChat, newChat]);       
                } else {
                    setPlayerTurn(false);
                    const newChat = {from: '[game info]', message: `Game started! Goodluck!`};
                    setGameChat([...gameChat, newChat]);
                };
            });
        });

        return () => {
            SocketAPI.stopListeningGameComponentEvents();
        };
    }, [gameChat, opponentName]);

    useEffect(() => {
        SocketAPI.playerForfeited(() => {
            resetStates();
            setGameState(0);
            setLeaveErrorText('');
            setPlayErrorText('');
            setUserWonOrLost('');
            setGameResultText(`${opponentName} Forfeited.`);
            setGeneralMessageText(`${opponentName} has forfeited this game.`);
            setGamesPlayed(gamesPlayed + 1); 
        });

        return () => {
            SocketAPI.stopListeningPlayerForfeited();
        };
    }, [opponentName, gamesPlayed]);

    useEffect(() => {
        SocketAPI.updateGameChat(newChat => {
            setGameChat([...gameChat, newChat]);
        });

        SocketAPI.updateGameChatInfo(newChat => {
            setGameChat([...gameChat, newChat]);
        });

        return () => {
            SocketAPI.stopListeningUpdateGameChat();
            SocketAPI.stopListeningUpdateGameChatInfo();
        };
    }, [gameChat]);

     //Generic state changes when user completes turn
     const userCompletesTurnStates = () => {
        setPlayerTurn(false);
        setUserNumberOfTurns(userNumberOfTurns + 1);
        setLeaveErrorText('');
        setPlayErrorText('');
        setGeneralMessageText('');
        setLeave(0);
        setForfeit(0);
    };

    //Generic reset all game states when game finishes
    const resetStatesOnGameFinish = () => {
        setLeave(0);
        setForfeit(0);
        setReady(false);
        setPlayerTurn(false);
        setGameState(0);
        setLeaveErrorText('');
        setPlayErrorText('');
        setGamesPlayed(gamesPlayed + 1);
    };

    //Generic reset all game states when game ends due to dc
    const resetStates = () => {
        setLeave(0);
        setForfeit(0);
        setLeaveErrorText('');
        setPlayErrorText('');
        setReady(false);
        setPlayerTurn(false);
    };

    //Game ended because either: Player DC or Player went back to Home

    const playerLeave = () => {
        checkUserAuthorizationSlashGenerateNewAccessToken(() => {
            setLeave(1);
            setLeaveErrorText('Are you sure you want to forfeit this game and return Home?');
        });
    };

    const playerConfirmLeave = () => {
        checkUserAuthorizationSlashGenerateNewAccessToken(() => {
            setPage('home');
            setOpponentName('');
            SocketAPI.emitLeaveGame();
        });
    };

    //GAME COMMANDS

    //Beginning a round
    const playerReady = () => {
        checkUserAuthorizationSlashGenerateNewAccessToken(() => {
            const diceRoll1 = Math.round((Math.random() * 5) + 1);
            const diceRoll2 = Math.round((Math.random() * 5) + 1);
            const diceRoll3 = Math.round((Math.random() * 5) + 1);
            const diceRoll4 = Math.round((Math.random() * 5) + 1);
            const diceRoll5 = Math.round((Math.random() * 5) + 1);
            const userDiceArray = [diceRoll1, diceRoll2, diceRoll3, diceRoll4, diceRoll5];
            SocketAPI.emitPlayerReady(userDiceArray);
            setReady(true);
            setPlayErrorText('Waiting for opponent to accept...');
            setGeneralMessageText('');
        });
    };

    const playerUnReady = () => {
        checkUserAuthorizationSlashGenerateNewAccessToken(() => {
            SocketAPI.emitPlayerUnReady();
            setReady(false);
            setPlayErrorText('You are no longer ready.');
            setGeneralMessageText('');
        });
    };

    //Player forfeits
    const playerForfeit = () => {
        checkUserAuthorizationSlashGenerateNewAccessToken(() => {
            setForfeit(1);
            setPlayErrorText('Are you sure you want to forfeit this game?')
        });
    };

    const playerConfirmForfeit = () => {
        checkUserAuthorizationSlashGenerateNewAccessToken(() => {
            resetStates();
            setGameState(0);
            setLeaveErrorText('');
            setPlayErrorText('');
            setUserWonOrLost('');
            setGameResultText('You Forfeited.');
            setGeneralMessageText('You have forfeited this game.');
            setGamesPlayed(gamesPlayed + 1);
            SocketAPI.emitPlayerForfeit();
            sendGameChatMessageInformation(`${isLoggedIn} forfeited. Neither player wins.`);
        });
    };

    //update game information messages
    const disabledButtonAction = () => {
        setGeneralMessageText(`This game session has ended. Please use the 'Return Home' action to return home and find a new opponent.`);
    };

    //generate random pirates quote
    const generatePiratesQuote = () => {
        let quotes = [
            `"I challenge Davy Jones." - Will Turner`,
            `"Accepted." - Davy Jones`,
            `"I wager everything I own." - Will Turner`,
            `"I only bet on what's dearest to a man's heart. Else there's no way to tell if he's bluffing." - Davy Jones`,
            `"What a man is willing to risk, or not to risk - that' a measure of his soul." - Davy Jones`,
            `"I wager a hundred years of service." - Will Turner`,
            `"You're a desperate man. What could be the cause?... It can only be a woman." - Davy Jones`,
            `"A woman need not cause you to be desperate... if you choose the right woman." - Will Turner`,
            `"I remember now... you're the one that hopes to get married. But your fate is to be married to this ship." - Davy Jones`,
            `"I choose my own fate." - Will Turner`,
            `"Then it wouldn't be fate, would it?" - Davy Jones`,
            `"Another game." - Will Turner`,
            `"You can't best the devil twice, son." - Davy Jones`,
            `"Then why are you walking away?" - Will Turner`,
            `"The stakes?" - Davy Jones`,
            `"I wager my soul. An eternity of servitude." - Will Turner`,
            `"What was it you said about that which is dearest to a man's heart? I want this." - Will Turner`,
            `"How do you know of the key?" - Davy Jones`,
            `"That's not part of the game, is it?" - Will Turner`,
            `"You can still walk away." - Will Turner`,
            `"I'm in. Matching his wager. An eternity in service to you." - Bootstrap Bill`,
            `"The die's been cast. Your bid, Captain." - Bootstrap Bill`,
            `"Welcome to the crew, lad..." - Davy Jones`,
            `"Twelve fives. Call me a liar, or up the bid." - Bootstrap Bill`,
            `"And be called a liar myself for my trouble." - Davy Jones`,
            `"Bootstrap Bill you're a liar and you will spend an eternity on this ship!" - Davy Jones`,
            `"Master Turner, feel free to go ashore... the very next time we make port! Haha.." - Davy Jones`,
            `"You fool! Why did you do that?" - Will Turner`,
            `"I couldn't let you lose." - Bootstrap Bill`,
            `"It was never about winning or losing." - Will Turner`,
            `"The key... you just wanted to know where it was." - Bootstrap Bill`
        ]
        let rand = quotes[Math.floor(Math.random() * quotes.length)];
        setPiratesQuote(rand);
    };

    //GAME CHAT MESSAGE SENDING

    const updateGameChatInputState = (e) => {
        setGameChatInput(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            sendGameChatMessage();
        }
    };

    const sendGameChatMessage = () => {
        checkUserAuthorizationSlashGenerateNewAccessToken(() => {
            if (gameChatInput !== '') {
                const newChat = {from: isLoggedIn.toLowerCase(), message: gameChatInput};
                //update state
                setGameChat([...gameChat, newChat]);
                //save in chat database
                axios.post('https://pure-wildwood-93382.herokuapp.com/game/saveGameChat', {username1: isLoggedIn.toLowerCase(), username2: opponentName.toLowerCase(), chats: newChat})
                .then(res => {
                    //yay
                })
                .catch(err => {
                    //oh well
                });
                //send to opponent to update their state
                SocketAPI.emitNewGameChat(newChat);
                //clear states and focus
                setGameChatInput('');
                gameChatRef.current.value = '';
                gameChatRef.current.focus();
            } else {
                gameChatRef.current.focus();
            };
        });
    };

    const sendGameChatMessageInformation = (infoMessage) => {
        const newChat = {from: '[game info]', message: infoMessage};
        //update state
        setGameChat([...gameChat, newChat]);                
        //send to opponent to update their state
        SocketAPI.emitNewGameChatInfo(newChat);
    };

    return (
        <div className="game-container">
            <div className="game-screen">
                <div className="game-left">
                    <div className="game-opponent">
                        {opponentDice === 0 &&
                            <div className="dice-container-opponent hide-opponent-dice">
                                <img className="dice" src={Dice1} alt="opponent dice"/>
                                <img className="dice" src={Dice2} alt="opponent dice"/>
                                <img className="dice" src={Dice3} alt="opponent dice"/>
                                <img className="dice" src={Dice4} alt="opponent dice"/>
                                <img className="dice" src={Dice5} alt="opponent dice"/>
                            </div>
                        }
                        {gameState === 1 && 
                            <div className="dice-container-opponent question-mark-dice">
                                <img className="dice" src={DiceQuestionMark} alt="opponent dice"/>
                                <img className="dice" src={DiceQuestionMark} alt="opponent dice"/>
                                <img className="dice" src={DiceQuestionMark} alt="opponent dice"/>
                                <img className="dice" src={DiceQuestionMark} alt="opponent dice"/>
                                <img className="dice" src={DiceQuestionMark} alt="opponent dice"/>
                            </div>
                        }
                        {(opponentDice !== 0 && gameState !== 1) && 
                            <div className="dice-container-opponent">
                            <> 
                            {/*First Dice */}
                            {opponentDice[0] === 1 && 
                                <img className="dice" src={Dice1} alt="opponent dice"/>
                            }
                            {opponentDice[0] === 2 && 
                                <img className="dice" src={Dice2} alt="opponent dice"/>
                            }
                            {opponentDice[0] === 3 && 
                                <img className="dice" src={Dice3} alt="opponent dice"/>
                            }
                            {opponentDice[0] === 4 && 
                                <img className="dice" src={Dice4} alt="opponent dice"/>
                            }
                            {opponentDice[0] === 5 && 
                                <img className="dice" src={Dice5} alt="opponent dice"/>
                            }
                            {opponentDice[0] === 6 && 
                                <img className="dice" src={Dice6} alt="opponent dice"/>
                            }
                            {/*Second Dice */}
                            {opponentDice[1] === 1 && 
                                <img className="dice" src={Dice1} alt="opponent dice"/>
                            }
                            {opponentDice[1] === 2 && 
                                <img className="dice" src={Dice2} alt="opponent dice"/>
                            }
                            {opponentDice[1] === 3 && 
                                <img className="dice" src={Dice3} alt="opponent dice"/>
                            }
                            {opponentDice[1] === 4 && 
                                <img className="dice" src={Dice4} alt="opponent dice"/>
                            }
                            {opponentDice[1] === 5 && 
                                <img className="dice" src={Dice5} alt="opponent dice"/>
                            }
                            {opponentDice[1] === 6 && 
                                <img className="dice" src={Dice6} alt="opponent dice"/>
                            }
                            {/*Third Dice */}
                            {opponentDice[2] === 1 && 
                                <img className="dice" src={Dice1} alt="opponent dice"/>
                            }
                            {opponentDice[2] === 2 && 
                                <img className="dice" src={Dice2} alt="opponent dice"/>
                            }
                            {opponentDice[2] === 3 && 
                                <img className="dice" src={Dice3} alt="opponent dice"/>
                            }
                            {opponentDice[2] === 4 && 
                                <img className="dice" src={Dice4} alt="opponent dice"/>
                            }
                            {opponentDice[2] === 5 && 
                                <img className="dice" src={Dice5} alt="opponent dice"/>
                            }
                            {opponentDice[2] === 6 && 
                                <img className="dice" src={Dice6} alt="opponent dice"/>
                            }
                            {/*Fourth Dice */}
                            {opponentDice[3] === 1 && 
                                <img className="dice" src={Dice1} alt="opponent dice"/>
                            }
                            {opponentDice[3] === 2 && 
                                <img className="dice" src={Dice2} alt="opponent dice"/>
                            }
                            {opponentDice[3] === 3 && 
                                <img className="dice" src={Dice3} alt="opponent dice"/>
                            }
                            {opponentDice[3] === 4 && 
                                <img className="dice" src={Dice4} alt="opponent dice"/>
                            }
                            {opponentDice[3] === 5 && 
                                <img className="dice" src={Dice5} alt="opponent dice"/>
                            }
                            {opponentDice[3] === 6 && 
                                <img className="dice" src={Dice6} alt="opponent dice"/>
                            }
                            {/*Fifth Dice */}
                            {opponentDice[4] === 1 && 
                                <img className="dice" src={Dice1} alt="opponent dice"/>
                            }
                            {opponentDice[4] === 2 && 
                                <img className="dice" src={Dice2} alt="opponent dice"/>
                            }
                            {opponentDice[4] === 3 && 
                                <img className="dice" src={Dice3} alt="opponent dice"/>
                            }
                            {opponentDice[4] === 4 && 
                                <img className="dice" src={Dice4} alt="opponent dice"/>
                            }
                            {opponentDice[4] === 5 && 
                                <img className="dice" src={Dice5} alt="opponent dice"/>
                            }
                            {opponentDice[4] === 6 && 
                                <img className="dice" src={Dice6} alt="opponent dice"/>
                            }
                            </> 
                            </div>
                        }
                        <div className="opponent-name">{opponentName}'s Dice</div>
                    </div>
                    <div className="game-actions">
                        <div className="actions-right">
                            <div className="actions-top">
                                <BtnLeave gameState={gameState} leave={leave} playerLeave={playerLeave} playerConfirmLeave={playerConfirmLeave} />
                                <div className="leave-text-box">{leaveErrorText}</div>
                            </div>
                            <div className="actions-middle">
                                <BtnStartGame gameState={gameState} ready={ready} playerReady={playerReady} playerUnReady={playerUnReady} forfeit={forfeit} playerForfeit={playerForfeit} playerConfirmForfeit={playerConfirmForfeit} disabledButtonAction={disabledButtonAction} gamesPlayed={gamesPlayed} />
                                <div className="play-text-box">{playErrorText}</div>
                            </div>
                            <div className="actions-bottom">
                                <BtnThreeActions checkUserAuthorizationSlashGenerateNewAccessToken={checkUserAuthorizationSlashGenerateNewAccessToken} gameState={gameState} playerTurn={playerTurn} setPlayerTurn={setPlayerTurn} userCompletesTurnStates={userCompletesTurnStates} resetStatesOnGameFinish={resetStatesOnGameFinish} setUserPreviousBet={setUserPreviousBet} opponentPreviousBet={opponentPreviousBet} setOpponentPreviousBet={setOpponentPreviousBet} userNumberOfTurns={userNumberOfTurns} setUserNumberOfTurns={setUserNumberOfTurns} opponentNumberOfTurns={opponentNumberOfTurns} setOpponentNumberOfTurns={setOpponentNumberOfTurns} setGeneralMessageText={setGeneralMessageText} userDice={userDice} opponentDice={opponentDice} isLoggedIn={isLoggedIn} opponentName={opponentName} disabledButtonAction={disabledButtonAction} ready={ready} setGameResultText={setGameResultText} setUserWonOrLost={setUserWonOrLost} generatePiratesQuote={generatePiratesQuote} sendGameChatMessageInformation={sendGameChatMessageInformation} />
                            </div>
                        </div>
                        <div className="text-boxes-left">
                            {gameState === 2 &&
                                <div className="game-result-text-box user-neutral text-box">{opponentName} Disconnected...</div>
                            }
                            {(userWonOrLost === 'won' && gameState !== 2) &&
                                <div className="game-result-text-box user-won text-box">{gameResultText}</div>
                            }
                            {(userWonOrLost === 'lost' && gameState !== 2) &&
                                <div className="game-result-text-box user-lost text-box">{gameResultText}</div>
                            }
                            {(userWonOrLost === '' && gameState !== 2) &&
                                <div className="game-result-text-box user-neutral text-box">{gameResultText}</div>
                            }
                            {gameState === 0 && 
                                <div className="current-players-turn op-turn text-box">
                                    <div className="turn-text">Current Player's Turn</div>
                                    <div className="turn-name">n/a</div>
                                </div>
                            }
                            {(playerTurn === true && gameState !== 0) && 
                                <div className="current-players-turn user-turn text-box">
                                    <div className="turn-text">Current Player's Turn</div>
                                    <div className="turn-name">{isLoggedIn}</div>
                                </div>
                            }
                            {(playerTurn === false && gameState !== 0) && 
                                <div className="current-players-turn op-turn text-box">
                                    <div className="turn-text">Current Player's Turn</div>
                                    <div className="turn-name">{opponentName}</div>
                                </div>
                            }
                            <div className="user-total-turns text-box">
                                <div className="turns-text">Your Total Turns This Game</div>
                                <div className="turns-number">{userNumberOfTurns}</div>
                            </div>
                            <div className="user-prev-bet text-box">
                                <div className="user-prev-text">Your Previous Bid</div>
                                {userPreviousBet[0] === 0 &&
                                    <div className="user-prev-bid">n/a</div>
                                }
                                {userPreviousBet[0] === 1 &&
                                    <div className="user-prev-bid">One {userPreviousBet[1]}</div>
                                }
                                {userPreviousBet[0] === 2 &&
                                    <div className="user-prev-bid">Two {userPreviousBet[1]}'s</div>
                                }
                                {userPreviousBet[0] === 3 &&
                                    <div className="user-prev-bid">Three {userPreviousBet[1]}'s</div>
                                }
                                {userPreviousBet[0] === 4 &&
                                    <div className="user-prev-bid">Four {userPreviousBet[1]}'s</div>
                                }
                                {userPreviousBet[0] === 5 &&
                                    <div className="user-prev-bid">Five {userPreviousBet[1]}'s</div>
                                }
                                {userPreviousBet[0] === 6 &&
                                    <div className="user-prev-bid">Six {userPreviousBet[1]}'s</div>
                                }
                                {userPreviousBet[0] === 7 &&
                                    <div className="user-prev-bid">Seven {userPreviousBet[1]}'s</div>
                                }
                                {userPreviousBet[0] === 8 &&
                                    <div className="user-prev-bid">Eight {userPreviousBet[1]}'s</div>
                                }
                                {userPreviousBet[0] === 9 &&
                                    <div className="user-prev-bid">Nine {userPreviousBet[1]}'s</div>
                                }
                                {userPreviousBet[0] === 10 &&
                                    <div className="user-prev-bid">Ten {userPreviousBet[1]}'s</div>
                                }
                            </div>
                            <div className="opponent-prev-bet text-box"> 
                                <div className="op-prev-text">Opponent's Previous Bid</div>
                                {opponentPreviousBet[0] === 0 && 
                                    <div className="op-prev-bid">n/a</div>
                                }
                                {opponentPreviousBet[0] === 1 && 
                                    <div className="op-prev-bid">One {opponentPreviousBet[1]}</div>
                                }
                                {opponentPreviousBet[0] === 2 && 
                                    <div className="op-prev-bid">Two {opponentPreviousBet[1]}'s</div>
                                }
                                {opponentPreviousBet[0] === 3 && 
                                    <div className="op-prev-bid">Three {opponentPreviousBet[1]}'s</div>
                                }
                                {opponentPreviousBet[0] === 4 && 
                                    <div className="op-prev-bid">Four {opponentPreviousBet[1]}'s</div>
                                }
                                {opponentPreviousBet[0] === 5 && 
                                    <div className="op-prev-bid">Five {opponentPreviousBet[1]}'s</div>
                                }
                                {opponentPreviousBet[0] === 6 && 
                                    <div className="op-prev-bid">Six {opponentPreviousBet[1]}'s</div>
                                }
                                {opponentPreviousBet[0] === 7 && 
                                    <div className="op-prev-bid">Seven {opponentPreviousBet[1]}'s</div>
                                }
                                {opponentPreviousBet[0] === 8 && 
                                    <div className="op-prev-bid">Eight {opponentPreviousBet[1]}'s</div>
                                }
                                {opponentPreviousBet[0] === 9 && 
                                    <div className="op-prev-bid">Nine {opponentPreviousBet[1]}'s</div>
                                }
                                {opponentPreviousBet[0] === 10 && 
                                    <div className="op-prev-bid">Ten {opponentPreviousBet[1]}'s</div>
                                }
                            </div>
                            <div className="general-text-box text-box">{generalMessageText}</div>
                            <div className="quotes-text-box text-box">{piratesQuote}</div>
                        </div>
                    </div>
                    <div className="game-self">
                        <div className="user-name">Your Dice</div>
                        <div className="user-login">(logged in as {isLoggedIn})</div>
                        {userDice === 0 &&
                            <div className="dice-container-user hide-user-dice">
                                <img className="dice" src={Dice1} alt="user dice"/>
                                <img className="dice" src={Dice2} alt="user dice"/>
                                <img className="dice" src={Dice3} alt="user dice"/>
                                <img className="dice" src={Dice4} alt="user dice"/>
                                <img className="dice" src={Dice5} alt="user dice"/>
                            </div>
                        }
                        {userDice !== 0 && 
                            <div className="dice-container-user">
                            <> 
                            {/*First Dice */}
                            {userDice[0] === 1 && 
                                <img className="dice" src={Dice1} alt="user dice"/>
                            }
                            {userDice[0] === 2 && 
                                <img className="dice" src={Dice2} alt="user dice"/>
                            }
                            {userDice[0] === 3 && 
                                <img className="dice" src={Dice3} alt="user dice"/>
                            }
                            {userDice[0] === 4 && 
                                <img className="dice" src={Dice4} alt="user dice"/>
                            }
                            {userDice[0] === 5 && 
                                <img className="dice" src={Dice5} alt="user dice"/>
                            }
                            {userDice[0] === 6 && 
                                <img className="dice" src={Dice6} alt="user dice"/>
                            }
                            {/*Second Dice */}
                            {userDice[1] === 1 && 
                                <img className="dice" src={Dice1} alt="user dice"/>
                            }
                            {userDice[1] === 2 && 
                                <img className="dice" src={Dice2} alt="user dice"/>
                            }
                            {userDice[1] === 3 && 
                                <img className="dice" src={Dice3} alt="user dice"/>
                            }
                            {userDice[1] === 4 && 
                                <img className="dice" src={Dice4} alt="user dice"/>
                            }
                            {userDice[1] === 5 && 
                                <img className="dice" src={Dice5} alt="user dice"/>
                            }
                            {userDice[1] === 6 && 
                                <img className="dice" src={Dice6} alt="user dice"/>
                            }
                            {/*Third Dice */}
                            {userDice[2] === 1 && 
                                <img className="dice" src={Dice1} alt="user dice"/>
                            }
                            {userDice[2] === 2 && 
                                <img className="dice" src={Dice2} alt="user dice"/>
                            }
                            {userDice[2] === 3 && 
                                <img className="dice" src={Dice3} alt="user dice"/>
                            }
                            {userDice[2] === 4 && 
                                <img className="dice" src={Dice4} alt="user dice"/>
                            }
                            {userDice[2] === 5 && 
                                <img className="dice" src={Dice5} alt="user dice"/>
                            }
                            {userDice[2] === 6 && 
                                <img className="dice" src={Dice6} alt="user dice"/>
                            }
                            {/*Fourth Dice */}
                            {userDice[3] === 1 && 
                                <img className="dice" src={Dice1} alt="user dice"/>
                            }
                            {userDice[3] === 2 && 
                                <img className="dice" src={Dice2} alt="user dice"/>
                            }
                            {userDice[3] === 3 && 
                                <img className="dice" src={Dice3} alt="user dice"/>
                            }
                            {userDice[3] === 4 && 
                                <img className="dice" src={Dice4} alt="user dice"/>
                            }
                            {userDice[3] === 5 && 
                                <img className="dice" src={Dice5} alt="user dice"/>
                            }
                            {userDice[3] === 6 && 
                                <img className="dice" src={Dice6} alt="user dice"/>
                            }
                            {/*Fifth Dice */}
                            {userDice[4] === 1 && 
                                <img className="dice" src={Dice1} alt="user dice"/>
                            }
                            {userDice[4] === 2 && 
                                <img className="dice" src={Dice2} alt="user dice"/>
                            }
                            {userDice[4] === 3 && 
                                <img className="dice" src={Dice3} alt="user dice"/>
                            }
                            {userDice[4] === 4 && 
                                <img className="dice" src={Dice4} alt="user dice"/>
                            }
                            {userDice[4] === 5 && 
                                <img className="dice" src={Dice5} alt="user dice"/>
                            }
                            {userDice[4] === 6 && 
                                <img className="dice" src={Dice6} alt="user dice"/>
                            }
                            </> 
                            </div>
                        }
                    </div>
                </div>
                <div className="game-right">
                    <div className="rules">
                        <div className="codex-title">Liar's Dice Codex</div>
                        <div className="codex-rule">1. When both players are ready the game begins. During the game you can only see your own dice, and not your opponent's.</div>
                        <div className="codex-rule">2. You take turns bidding on the total "amount" of dice of a certain "value".</div>
                        <div className="codex-rule">3. You can call your opponent a liar by using the 'LIAH!' action, or you can agree to their bid by using the 'Call' action.</div>
                        <div className="codex-rule">4. If the bid reaches the maximum (ten 6's), then the next player must either call their opponent's bid or call them a liar.</div>
                        <div className="codex-rule">5. Game data is only saved after a game has been successfully completed. You can rematch your opponent after a game.</div>
                    </div>
                    <div className="chat">
                        <div className="chat-title">Private Chat</div>
                        <div className="all-chat-messages">
                            {gameChat.map((value, index) => {
                            return (
                                <React.Fragment key={index}>
                                    {value.from === '[game info]' && 
                                        <div className="game-chat-message info-color">
                                            <div className="message-from">{value.from}</div>
                                            <div className="message-content">{value.message}</div>
                                        </div>
                                    }
                                    {value.from === isLoggedIn.toLowerCase() && 
                                        <div className="game-chat-message user-color">
                                            <div className="message-from">You:</div>
                                            <div className="message-content">{value.message}</div>
                                        </div>
                                    }
                                    {(value.from !== isLoggedIn.toLowerCase() && value.from !== '[game info]') && 
                                        <div className="game-chat-message op-color">
                                            <div className="message-from">From {value.from.charAt(0).toUpperCase() + value.from.slice(1)}:</div>
                                            <div className="message-content">{value.message}</div>
                                        </div>
                                    }
                                </React.Fragment>
                            )
                            })
                            }
                            <label ref={messagesEndRef} className="empty-div"/>
                        </div>
                       <input ref={gameChatRef} onChange={updateGameChatInputState} onKeyDown={handleKeyDown} type="text" className="game-chat-input" placeholder="say hi..."></input>
                       <button className="game-chat-button" onClick={sendGameChatMessage}>Send</button>
                    </div>
                </div>
            </div>
        </div>
    )
};