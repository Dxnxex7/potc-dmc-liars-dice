import React from 'react';

export default function BtnLeave({gameState, leave, playerLeave, playerConfirmLeave}) {
    let btnText = '';
    let btnAction = '';
    let btnClass = '';
    if (gameState === 0 || gameState === 2) {
            btnText = `Return Home`;
            btnAction = playerConfirmLeave;
            btnClass = `btn-game btn-active-player`;
    } else if (gameState === 1) {
        if (leave === 0) {
            btnText = 'Return Home';
            btnAction = playerLeave;
            btnClass = 'btn-game btn-active-player';
        } else if (leave === 1) {
            btnText = 'Confirm Return Home';
            btnAction = playerConfirmLeave;
            btnClass = 'btn-game btn-warn-player';
        };
    };
    return (
        <div className="leave-button">
            <button className={btnClass} onClick={btnAction}>{btnText}</button>
        </div>
    )
}
