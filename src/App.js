import React, { useState, useEffect } from 'react';
//import { BrowserRouter as Router, Route } from "react-router-dom";
import axios from 'axios';
import './App.css';

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/home-components/Home';
import Game from './components/game-components/Game';
import Login from './components/login-components/Login';
import Register from './components/register-components/Register';

//MAIN APP COMPONENT
export default function App() {

  const [page, setPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAccessToken, setUserAccessToken] = useState('');
  const [opponentName, setOpponentName] = useState('');

  //General states to be changed on logout
  const logoutStates = () => {
    setPage('home');
    setIsLoggedIn(false);
    setUserAccessToken('');
  };

  //Check user logged in/out state on first render)
  useEffect(() => {
    axios.get('http://localhost:3000/auth/newAccessTokenOrLogout', {withCredentials: true})
      .then(res => {
        setUserAccessToken(res.data.accessToken);
        let displayName = res.data.name.charAt(0).toUpperCase() + res.data.name.slice(1);
        setIsLoggedIn(displayName);
      })
      .catch(err => {
        logoutStates();
      });
  }, []);

  //Reusable function for checking user authorization (also accepts callback function)
  const checkUserAuthorizationSlashGenerateNewAccessToken = (callback) => {
    axios.get('http://localhost:3000/auth/', {headers: {Authorization: 'Bearer ' + userAccessToken}})
      .then(res => {
        //console.log(`access token valid`);
        if (callback) {
          callback();
        };
      })
      .catch(err => {
        axios.get('http://localhost:3000/auth/newAccessTokenOrLogout', {withCredentials: true})
        .then(res => {
          //console.log(`new access token set`);
          setUserAccessToken(res.data.accessToken);
          if (callback) {
            callback();
          };
        })
        .catch(err => {
          window.location = '/';
        });
      });
  };

  //Change page, re-render
  const toLoginPage = () => {
    setPage('login');
  };

  const toRegisterPage = () => {
    setPage('register');
  };

  const toHomePage = () => {
    setPage('home');
  };

  return (
      <>
        {page === 'home' &&
          <div className="home-page">
            <Header />
            <Home checkUserAuthorizationSlashGenerateNewAccessToken={checkUserAuthorizationSlashGenerateNewAccessToken} isLoggedIn={isLoggedIn} setPage={setPage} toLoginPage={toLoginPage} logoutStates={logoutStates} setOpponentName={setOpponentName} page={page} />
            <Footer />
          </div>
        }
        {page === 'game' &&
          <div className="game-page">
            <Header />
            <Game checkUserAuthorizationSlashGenerateNewAccessToken={checkUserAuthorizationSlashGenerateNewAccessToken} isLoggedIn={isLoggedIn} setPage={setPage} opponentName={opponentName} setOpponentName={setOpponentName} />
            <Footer />
          </div>
        }
        {page === 'login' &&
          <div className="login-page">
            <Header />
            <Login toHomePage={toHomePage} toRegisterPage={toRegisterPage} setUserAccessToken={setUserAccessToken} setIsLoggedIn={setIsLoggedIn} setPage={setPage} />
            <Footer />
          </div>
        }
        {page === 'register' &&
          <div className="register-page">
            <Header />
            <Register toHomePage={toHomePage} toLoginPage={toLoginPage} setUserAccessToken={setUserAccessToken} setIsLoggedIn={setIsLoggedIn} setPage={setPage} />
            <Footer />
          </div>
        }
    </>
  )
};