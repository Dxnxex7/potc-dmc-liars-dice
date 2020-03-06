import React, { useState, useRef } from 'react';
import axios from 'axios';

export default function Register({toHomePage, toLoginPage, setUserAccessToken, setIsLoggedIn, setPage}) {
    //field values
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    //whether current field value will be accepted
    const [acceptUsername, setAcceptUsername] = useState(false);
    const [acceptEmail, setAcceptEmail] = useState(false);
    const [acceptPassword, setAcceptPassword] = useState(false);
    //error message for each field
    const [errorUsername, setErrorUsername] = useState('');
    const [errorEmail, setErrorEmail] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    //error message on submit form
    const [errorRegisterText, setErrorRegisterText] = useState('');
    //Refs for fields
    const usernameRef = useRef();
    const emailRef = useRef();
    const passwordRef = useRef();

    const onSubmit = (e) => {
        e.preventDefault();
        if (acceptUsername && acceptEmail && acceptPassword) {
            const newRegister = {
                user: username,
                email: email,
                password: password,
                totalGamesPlayed: 0,
                totalGamesWon: 0,
                totalGamesLost: 0,
                winStreak: 0,
                winStreakPeak: 0,
                leastTurnsForWin: 0
            };
            setUsername('');
            setEmail('');
            setPassword('');
            setAcceptUsername(false);
            setAcceptEmail(false);
            setAcceptPassword(false);
            setErrorUsername('');
            setErrorEmail('');
            setErrorPassword('');
            usernameRef.current.value = '';
            emailRef.current.value = '';
            passwordRef.current.value = '';
            setErrorRegisterText(`Attempting to create account...`);
            axios.post('https://pure-wildwood-93382.herokuapp.com/register/', newRegister, {withCredentials: true})
                .then(res => {
                    if (res.data.accessToken) {
                        setUserAccessToken(res.data.accessToken);
                        let displayName = res.data.name.charAt(0).toUpperCase() + res.data.name.slice(1);
                        setIsLoggedIn(displayName);
                        setPage('home');
                    };
                })
                .catch(err => {
                    if (err.response.data === `serverError`) {
                        setErrorRegisterText(`There was a server error while creating your account. Please try again.`);
                    };
                });

        } else {
            setErrorRegisterText(`Fields contain invalid information. Please update your information and submit again.`);
        };
    };

    const onUsernameChange = (e) => {
        const usernameLC = e.target.value.toLowerCase();
        setUsername(usernameLC);
        const doesUsernameIncludeAt = usernameLC.includes('@');
        if (usernameLC === '') {
            setAcceptUsername(false);
            setErrorUsername('');
        } else if (usernameLC === 'guest' || usernameLC === '[game info]') {
            setAcceptUsername(false);
            setErrorUsername(`This username is reserved, please try again.`);
        } else if (doesUsernameIncludeAt) {
            setAcceptUsername(false);
            setErrorUsername(`Your username can not include the '@' character.`);
        } else if (usernameLC.length < 3) {
            setAcceptUsername(false);
            setErrorUsername('Your username must be at least 3 characters long.');
        } else if (usernameLC.length > 12) {
            setAcceptUsername(false);
            setErrorUsername('Your username must not be more than 12 characters long.');
        } else {
            const usernameToCheck = {username: usernameLC};
            axios.post('https://pure-wildwood-93382.herokuapp.com/register/checkUsername', usernameToCheck)
                .then(res => {
                    if (res.data === `usernameDoesNotExist`) {
                        setAcceptUsername(true);
                        setErrorUsername(`This username is available!`);
                    };
                })
                .catch(err => {
                    if (err.response.data === `usernameAlreadyExists`) {
                        setAcceptUsername(false);
                        setErrorUsername(`This username is taken.`);
                    } else if(err.response.data === `serverError`) {
                        setErrorUsername(`There was a server error while checking username availability. Please try again.`);
                    };
                });
        };
    };

    const onEmailChange = (e) => {
        const emailLC = e.target.value.toLowerCase();
        setEmail(emailLC);
        const doesEmailIncludeAt = emailLC.includes('@');
        const doesEmailIncludeDot = emailLC.includes('.');
        let isLastCharacterAtOrDot = emailLC.split('');
        isLastCharacterAtOrDot = isLastCharacterAtOrDot.pop();
        if (emailLC === '') {
            setAcceptEmail(false);
            setErrorEmail('');
        } else if (emailLC.length < 5 || !doesEmailIncludeAt || !doesEmailIncludeDot || isLastCharacterAtOrDot === '@' || isLastCharacterAtOrDot === '.') {
            setAcceptEmail(false);
            setErrorEmail('Your email must be a valid email address.')
        } else {
            const emailToCheck = {email: emailLC};
            axios.post('https://pure-wildwood-93382.herokuapp.com/register/checkEmail', emailToCheck)
                .then(res => {
                    if (res.data === `emailDoesNotExist`) {
                        setAcceptEmail(true);
                        setErrorEmail(`This email is not in use!`);
                    };
                })
                .catch(err => {
                    if (err.response.data === `emailAlreadyExists`) {
                        setAcceptEmail(false);
                        setErrorEmail(`This email is already in use.`);
                    } else if(err.response.data === `serverError`) {
                        setErrorEmail(`There was a server error while checking email availability. Please try again.`);
                    };
                });
        };
    };

    const onPasswordChange = (e) => {
        const passwordCS = e.target.value;
        setPassword(passwordCS);
        if (passwordCS === '') {
            setAcceptPassword(false);
            setErrorPassword('');
        } else if (passwordCS.length < 5) {
            setAcceptPassword(false);
            setErrorPassword('Your password must contain at least 5 characters.');
        } else if (passwordCS.length >= 15) {
            setAcceptPassword(true);
            setErrorPassword(`Your password's strength is: Strong`);
        } else if (passwordCS.length >= 10) {
            setAcceptPassword(true);
            setErrorPassword(`Your password's strength is: Moderate`);
        } else if (passwordCS.length >= 5) {
            setAcceptPassword(true);
            setErrorPassword(`Your password's strength is: Weak`);
        };
    };

    let acceptUsernameClass = '';
    let acceptEmailClass = '';
    let acceptPasswordClass = '';
    if (acceptUsername === false) {
        acceptUsernameClass = "register-error-username-deny";
    } else {
        acceptUsernameClass = "register-error-username-accept";
    };
    if (acceptEmail === false) {
        acceptEmailClass = "register-error-email-deny";
    } else {
        acceptEmailClass = "register-error-email-accept";
    };
    if (acceptPassword === false) {
        acceptPasswordClass = "register-error-password-deny";
    } else {
        acceptPasswordClass = "register-error-password-accept";
    };

    return (
        <>
        <div className="register-section">
            <div className="register-form">
                <div className="register-title">Welcome!</div>
                <form className="register-input-group" onSubmit={onSubmit}>
                    <label className="register-subtitle">Username</label>
                    <br></br>
                    <input ref={usernameRef} type="text" className="register-field" placeholder="find an available name!" onChange={onUsernameChange}></input>
                    <div className={acceptUsernameClass}>{errorUsername}</div>
                    <label className="register-subtitle">Email</label>
                    <br></br>
                    <input ref={emailRef} type="text" className="register-field" placeholder="example@email.com" onChange={onEmailChange}></input>
                    <div className={acceptEmailClass}>{errorEmail}</div>
                    <label className="register-subtitle">Password</label>
                    <br></br>
                    <input ref={passwordRef} type="text" className="register-field" placeholder="secure password please!" onChange={onPasswordChange}></input>
                    <div className={acceptPasswordClass}>{errorPassword}</div>
                    <button type="submit" className="register-submit">Register Now!</button>
                    <div className="register-submit-error">{errorRegisterText}</div>
                    <button className="register-btn-to-login" onClick={toLoginPage}>Already have an account? Login now!</button>
                    <br></br>
                    <button className="register-btn-to-home" onClick={toHomePage}>Back to Home</button>
                </form>
            </div>
        </div>
        </>
    )
};