import React from 'react';

export default function BtnStartGame({gameState, ready, playerReady, playerUnReady, forfeit, playerForfeit, playerConfirmForfeit, gamesPlayed, disabledButtonAction}) {
    let btnText = '';
    let btnAction = '';
    let btnClass = '';
    if (gameState === 0) {
        if (ready === false) {
            if (gamesPlayed >= 1) {
                btnText = 'Rematch!';
            } else {
                btnText = 'Roll Dice!';
            };
            btnAction = playerReady;
            btnClass = 'btn-game btn-active-player';
        } else if (ready === true) {
            btnText = 'Un-Ready';
            btnAction = playerUnReady;
            btnClass = 'btn-game btn-active-player';
        };
    } else if (gameState === 1) {
        if (forfeit === 0) {
            btnText = 'Forfeit';
            btnAction = playerForfeit;
            btnClass = 'btn-game btn-active-player';
        } else if (forfeit === 1) {
            btnText = 'Confirm Forfeit';
            btnAction = playerConfirmForfeit;
            btnClass = 'btn-game btn-warn-player';
        };
    } else if (gameState === 2) {
        btnText = 'Disconnected';
        btnAction = disabledButtonAction;
        btnClass = 'btn-game btn-disabled';
    };
    return (
        <div className="start-button">
            <button className={btnClass} onClick={btnAction}>{btnText}</button>
        </div>
    )
};