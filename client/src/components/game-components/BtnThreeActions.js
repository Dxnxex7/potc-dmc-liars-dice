import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as SocketAPI from '../../api';

export default function BtnThreeActions({checkUserAuthorizationSlashGenerateNewAccessToken, gameState, playerTurn, setPlayerTurn, userCompletesTurnStates, resetStatesOnGameFinish, setUserPreviousBet, opponentPreviousBet, setOpponentPreviousBet, userNumberOfTurns, setUserNumberOfTurns, opponentNumberOfTurns, setOpponentNumberOfTurns, setGeneralMessageText, userDice, opponentDice, isLoggedIn, opponentName, disabledButtonAction, ready, setGameResultText, setUserWonOrLost, generatePiratesQuote, sendGameChatMessageInformation}) {
    const [betDiceAmount, setBetDiceAmount] = useState(0);
    const [betDiceValue, setBetDiceValue] = useState(0);

    const amountRef = useRef();
    const valueRef = useRef();

    let btnBetText = 'Bid';
    let btnBetAction = '';
    let btnBetClass = '';
    let btnCallText = 'Call';
    let btnCallAction = '';
    let btnCallClass = '';
    let btnLIAHText = 'LIAH!';
    let btnLIAHAction = '';
    let btnLIAHClass = '';

    useEffect(() => {
        SocketAPI.sendBetToOpponent((betArray) => {
            if (betArray[0] === 10 && betArray[1] === 6) {
                setGeneralMessageText(`${opponentName} made the highest bid possible...! Will you call their bid, or call them a liar?`)
            };
            generatePiratesQuote();
            setOpponentPreviousBet(betArray);
            setOpponentNumberOfTurns(opponentNumberOfTurns + 1)
            setPlayerTurn(true);
        });

        SocketAPI.sendCallResultToOpponent((result) => {
            if (result === 'win') {
                setUserWonOrLost('lost');
                setGameResultText(`You Lost.`);
                setGeneralMessageText(`${opponentName} called your previous bid and you lost.`);
            } else if (result === 'lose') {
                setUserWonOrLost('won');
                setGameResultText(`You Won!`);
                setGeneralMessageText(`${opponentName} called your previous bid and you won!`);
            };
            resetStatesOnGameFinish();
            generatePiratesQuote();
        });

        SocketAPI.sendLIAHResultToOpponent((result) => {
            if (result === 'win') {
                setUserWonOrLost('lost');
                setGameResultText(`You Lost.`);
                setGeneralMessageText(`${opponentName} called you a liar and you lost.`);
            } else if (result === 'lose') {
                setUserWonOrLost('won');
                setGameResultText(`You Won!`);
                setGeneralMessageText(`${opponentName} called you a liar and you won!`);
            };
            resetStatesOnGameFinish();
            generatePiratesQuote();
        });

        return () => {
            SocketAPI.stopListeningGameButtonEvents();
        };
    }, [opponentNumberOfTurns]);

    //Update state when bet inputs change
    const onChangeAmount = (e) => {
        if (playerTurn === true) {
            setBetDiceAmount(parseInt(e.target.value, 10));
        } else {
            amountRef.current.value = '';
        };
    };

    const onChangeValue = (e) => {
        if (playerTurn === true) {
            setBetDiceValue(parseInt(e.target.value, 10));
        } else {
            valueRef.current.value = '';
        };
    };

    //Player choices and functions for ending games

    const choosesBet = () => {
        checkUserAuthorizationSlashGenerateNewAccessToken(() => {
            if ((betDiceAmount === 1 || betDiceAmount === 2 || betDiceAmount === 3 || betDiceAmount === 4 || betDiceAmount === 5 || betDiceAmount === 6 || betDiceAmount === 7 || betDiceAmount === 8 || betDiceAmount === 9 || betDiceAmount === 10) && (betDiceValue === 1 || betDiceValue === 2 || betDiceValue === 3 || betDiceValue === 4 || betDiceValue === 5 || betDiceValue === 6)) {
                let isBetValid = false;
                if (opponentPreviousBet[0] === 0 || (betDiceAmount === opponentPreviousBet[0] && betDiceValue > opponentPreviousBet[1]) || (betDiceAmount > opponentPreviousBet[0])) {
                    isBetValid = true;
                };
                if (isBetValid === true) {
                    generatePiratesQuote();
                    userCompletesTurnStates();
                    SocketAPI.emitUserBet([betDiceAmount, betDiceValue]);
                    setUserPreviousBet([betDiceAmount, betDiceValue]);
                    setBetDiceAmount(0);
                    setBetDiceValue(0);
                    amountRef.current.value = '';
                    valueRef.current.value = '';
                    sendGameChatMessageInformation(`${isLoggedIn}'s bid: ${betDiceAmount} (amount), ${betDiceValue} (value)`);
                } else {
                    setGeneralMessageText(`Your bid must include a higher dice value, or a higher dice amount of any dice value, based on your opponent's previous bid.`);
                };
            } else {
                setGeneralMessageText('Please correct your bid before you confirm it!');
            };
        });
    };

    const calculateAmountOfDiceOfValue = () => {
        const totalDiceArray = [...userDice, ...opponentDice];
        let amountOfDiceOfValueSearched = 0;
        totalDiceArray.forEach(el => {
            if (el === opponentPreviousBet[1]) {
                amountOfDiceOfValueSearched++;
            };
        });
        return amountOfDiceOfValueSearched;
    };

    const saveFinalScoresToDatabase = (gameData) => {
        axios.post('https://pure-wildwood-93382.herokuapp.com/game/saveGameData/', gameData)
        .then(res => {
            //console.log(`game data successfully saved!!!`);
            SocketAPI.emitGameDataSaved();
        })
        .catch(err => {
            //console.log(`error saving game data...`);
        });
    };

    const choosesCall = () => {
        checkUserAuthorizationSlashGenerateNewAccessToken(() => {
            const amountOfDiceOfValueSearched = calculateAmountOfDiceOfValue();
            let userResult = '';
            let opponentResult = '';
            let eventToEmit = '';
            if (amountOfDiceOfValueSearched >= opponentPreviousBet[0]) {
                //user wins
                userResult = 'win';
                opponentResult = 'lose';
                eventToEmit = 'win';
                setUserWonOrLost('won');
                setGameResultText(`You Won!`);
                setGeneralMessageText(`You called ${opponentName}'s previous bid and you won!`);sendGameChatMessageInformation(`${isLoggedIn} called ${opponentName}'s previous bid and won!`);
            } else {
                //user looses
                userResult = 'lose';
                opponentResult = 'win';
                eventToEmit = 'lose';
                setUserWonOrLost('lost');
                setGameResultText(`You Lost.`);
                setGeneralMessageText(`You called ${opponentName}'s previous bid and you lost.`);
                sendGameChatMessageInformation(`${isLoggedIn} called ${opponentName}'s previous bid and lost!`);
            };
            SocketAPI.emitUserCall(eventToEmit);
            saveFinalScoresToDatabase([
                {name: isLoggedIn.toLowerCase(), result: userResult, turns: userNumberOfTurns + 1},
                {name: opponentName.toLowerCase(), result: opponentResult, turns: opponentNumberOfTurns}
            ]);
            setUserNumberOfTurns(userNumberOfTurns + 1);
            resetStatesOnGameFinish();
            generatePiratesQuote();
        });
    };

    const choosesLIAH = () => {
        checkUserAuthorizationSlashGenerateNewAccessToken(() => {
            const amountOfDiceOfValueSearched = calculateAmountOfDiceOfValue();
            let userResult = '';
            let opponentResult = '';
            let eventToEmit = '';
            if (amountOfDiceOfValueSearched < opponentPreviousBet[0]) {
                //user wins
                userResult = 'win';
                opponentResult = 'lose';
                eventToEmit = 'win';
                setUserWonOrLost('won');
                setGameResultText(`You Won!`);
                setGeneralMessageText(`You called ${opponentName} a liar and you won!`);
                sendGameChatMessageInformation(`${isLoggedIn} called ${opponentName} a liar and won!`);
            } else {
                //user looses
                userResult = 'lose';
                opponentResult = 'win';
                eventToEmit = 'lose';
                setUserWonOrLost('lost');
                setGameResultText(`You Lost.`);
                setGeneralMessageText(`You called ${opponentName} a liar and you lost.`);
                sendGameChatMessageInformation(`${isLoggedIn} called ${opponentName} a liar and lost!`);
            };
            SocketAPI.emitUserLIAH(eventToEmit);
            saveFinalScoresToDatabase([
                {name: isLoggedIn.toLowerCase(), result: userResult, turns: userNumberOfTurns + 1},
                {name: opponentName.toLowerCase(), result: opponentResult, turns: opponentNumberOfTurns}
            ]);
            setUserNumberOfTurns(userNumberOfTurns + 1);
            resetStatesOnGameFinish();
            generatePiratesQuote();
        });
    };

    const gameHasNotStartedAction = () => {
        if (ready === true) {
            setGeneralMessageText(`The game has not yet started, please wait until your opponent is ready.`);
        } else {
            setGeneralMessageText(`The game has not yet started, please ready up!`);
        }
    };

    const firstTurnAction = () => {
        setGeneralMessageText(`You must make a bid on the first turn of the game.`);
    };

    const lastTurnAction = () => {
        setGeneralMessageText(`You can not bid higher than ten 6's. You must either call your opponent's previous bid, or call them a liar.`);
    };

    const notPlayersTurnAction = () => {
        setGeneralMessageText(`It is not your turn!`);
    };

    if (gameState === 0) {
        btnBetAction = gameHasNotStartedAction;
        btnBetClass = 'btn-game btn-ignore-player';
        btnCallAction = gameHasNotStartedAction;
        btnCallClass = 'btn-game btn-ignore-player';
        btnLIAHAction = gameHasNotStartedAction;
        btnLIAHClass = 'btn-game btn-ignore-player';
    } else if (gameState === 1) {
        if (playerTurn === true) {
            if (opponentPreviousBet[0] === 0 && opponentPreviousBet[1] === 0) { //first turn so cant call/liah
                btnBetAction = choosesBet;
                btnBetClass = 'btn-game btn-active-player';
                btnCallAction = firstTurnAction;
                btnCallClass = 'btn-game btn-ignore-player';
                btnLIAHAction = firstTurnAction;
                btnLIAHClass = 'btn-game btn-ignore-player';
            } else if (opponentPreviousBet[0] === 10 && opponentPreviousBet[1] === 6) { //max bet so cant bet again
                btnBetAction = lastTurnAction;
                btnBetClass = 'btn-game btn-ignore-player';
                btnCallAction = choosesCall;
                btnCallClass = 'btn-game btn-active-player';
                btnLIAHAction = choosesLIAH;
                btnLIAHClass = 'btn-game btn-active-player';
            } else {
                btnBetAction = choosesBet;
                btnBetClass = 'btn-game btn-active-player';
                btnCallAction = choosesCall;
                btnCallClass = 'btn-game btn-active-player';
                btnLIAHAction = choosesLIAH;
                btnLIAHClass = 'btn-game btn-active-player';
            };
        } else if (playerTurn === false) {
            btnBetAction = notPlayersTurnAction;
            btnBetClass = 'btn-game btn-ignore-player';
            btnCallAction = notPlayersTurnAction;
            btnCallClass = 'btn-game btn-ignore-player';
            btnLIAHAction = notPlayersTurnAction;
            btnLIAHClass = 'btn-game btn-ignore-player';
        };
    } else if (gameState === 2) {
        btnBetAction = disabledButtonAction;
        btnBetClass = 'btn-game btn-disabled';
        btnCallAction = disabledButtonAction;
        btnCallClass = 'btn-game btn-disabled';
        btnLIAHAction = disabledButtonAction;
        btnLIAHClass = 'btn-game btn-disabled';
    };

    return (
        <>
        <button className={btnLIAHClass} onClick={btnLIAHAction}>{btnLIAHText}</button>
        <button className={btnCallClass} onClick={btnCallAction}>{btnCallText}</button>
        <button className={btnBetClass} onClick={btnBetAction}>{btnBetText}</button>
        <label className="amount-of-dice-label">Amount of Dice</label>
        <input ref={amountRef} type="text" placeholder="amount 1-10..." onChange={onChangeAmount}></input>
        <br></br>
        <label className="value-of-dice-label">Value of Dice</label>
        <input ref={valueRef} type="text" placeholder="value 1-6..." onChange={onChangeValue}></input>
        </>
    )
};
