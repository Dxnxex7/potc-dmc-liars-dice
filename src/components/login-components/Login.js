import React, { useState, useRef } from 'react'
import axios from 'axios';

export default function Login({toHomePage, toRegisterPage, setUserAccessToken, setIsLoggedIn, setPage}) {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorLoginText, setErrorLoginText] = useState('');

    //unused
    const passwordRef = useRef();

    const onSubmit = (e) => {
        e.preventDefault();
        if (usernameOrEmail !== '' && password !== '') {
            const newLogin = {
                usernameOrEmail: usernameOrEmail,
                password: password,
            };
            axios.post('https://pure-wildwood-93382.herokuapp.com/login/', newLogin, {withCredentials: true})
                .then(res => {
                    if (res.data.accessToken) {
                        console.log('successfully got access token');
                        setUserAccessToken(res.data.accessToken);
                        let displayName = res.data.name.charAt(0).toUpperCase() + res.data.name.slice(1);
                        setIsLoggedIn(displayName);
                        setPage('home');
                    };
                })
                .catch(err => {
                    if (err.response.data === 'usernameAndEmailNotFound') {
                        setErrorLoginText(`Username/Email does not exist.`);
                    } else if (err.response.data === `loginFail`) {
                        setErrorLoginText(`Password incorrect.`);
                    } else if (err.response.data === 'serverError') {
                        setErrorLoginText(`There was a server error while attempting to log you in. Please try again.`);
                    };
                });
        } else {
            setErrorLoginText(`Please enter all your information and try again.`);
        }
    };

    const onUsernameOrEmailChange = (e) => {
        setUsernameOrEmail(e.target.value);
    };

    const onPasswordChange = (e) => {
        setPassword(e.target.value);
    };

    return (
        <>
        <div className="login-section">
            <div className="login-form">
                <div className="login-title">Welcome Back!</div>
                <form className="login-input-group" onSubmit={onSubmit}>
                    <label className="login-subtitle">Username or Email</label>
                    <input type="text" className="login-field" onChange={onUsernameOrEmailChange}></input>
                    <label className="login-subtitle">Password</label>
                    <input ref={passwordRef} type="text" className="login-field" onChange={onPasswordChange}></input>
                    <button type="submit" className="login-submit">Login!</button>
                    <div className="login-submit-error">{errorLoginText}</div>
                    <button className="login-btn-to-register" onClick={toRegisterPage}>Don't have an account? Create one now!</button>
                    <br></br>
                    <button className="login-btn-to-home" onClick={toHomePage}>Back to Home</button>
                </form>
            </div>
        </div>
        </>
    )
};
