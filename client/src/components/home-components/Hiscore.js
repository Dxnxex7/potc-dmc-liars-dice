import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as SocketAPI from '../../api';

export default function Hiscore({page}) {

    const [hiscoreDataAll, setHiscoreDataAll] = useState([]);
    const [hiscoreData, setHiscoreData] = useState([]);
    const [hiscoreSort, setHiscoreSort] = useState('totalGamesPlayed');
    const [fetchHiscoreData, setFetchHiscoreData] = useState(1);

    const [gamesPlayedClass, setGamesPlayedClass] = useState('sortBy');
    const [gamesWonClass, setGamesWonClass] = useState('normal');
    const [gamesLostClass, setGamesLostClass] = useState('normal');
    const [winStreakClass, setWinStreakClass] = useState('normal');
    const [leastTurnsClass, setLeastTurnsClass] = useState('normal');

    //sort hiscore data function
    const compareValues = (key, order = 'asc') => {
        return function innerSort(a, b) {
            if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
              return 0;
            };
        
            const itemA = (typeof a[key] === 'string') ? a[key].toLowerCase() : a[key];
            const itemB = (typeof b[key] === 'string') ? b[key].toLowerCase() : b[key];
        
            let comparison = 0;
            if (itemA > itemB) {
              comparison = 1;
            } else if (itemA < itemB) {
              comparison = -1;
            };

            return (
              (order === 'desc') ? (comparison * -1) : comparison
            );
          };
    };

    useEffect(() => {
        //listening for data to be updated in database
        SocketAPI.renderHiscores(() => {
            setFetchHiscoreData(fetchHiscoreData + 1);
        });

        return () => {
            SocketAPI.stopListeningRenderHiscores();
        };
    }, [fetchHiscoreData]);

    //GET HISCORE DATA ON FIRST RENDER AND EVERYTIME GAME DATA IS SAVED
    useEffect(() => {
        //console.log(`hiscore sort: ${hiscoreSort}`);
        axios.get('https://pure-wildwood-93382.herokuapp.com/lobby/getHiscoreData')
            .then(res => {
                setHiscoreDataAll(res.data);
                const dataToSort = res.data;
                let sortedData = '';
                if (hiscoreSort === 'leastTurnsForWin') {
                    sortedData = dataToSort.sort(compareValues(hiscoreSort));
                } else {
                    sortedData = dataToSort.sort(compareValues(hiscoreSort, 'desc'));
                };
                const slicedData = sortedData.slice(0, 10);
                setHiscoreData(slicedData);
            })
            .catch(err => {
                console.log(`no user data for hiscores`);
                console.log(err);
                console.log(err.response);
            });
    }, [fetchHiscoreData]);

    //SORT BUTTON FUNCTIONS
    const sortByTotalGamesPlayed = () => {
        sortHiscoreData('totalGamesPlayed');
        setGamesPlayedClass('sortBy');
    };

    const sortByTotalGamesWon = () => {
        sortHiscoreData('totalGamesWon');
        setGamesWonClass('sortBy');
    };

    const sortByTotalGamesLost = () => {
        sortHiscoreData('totalGamesLost');
        setGamesLostClass('sortBy');
    };

    const sortByWinStreak = () => {
        sortHiscoreData('winStreak');
        setWinStreakClass('sortBy');
    };

    const sortByLeastTurns = () => {
        sortHiscoreData('leastTurnsForWin');
        setLeastTurnsClass('sortBy');
    };

    //UPDATE HISCORE DATA ON HISCORE SORT CHANGE
    const sortHiscoreData = (sortMethod) => {
        setHiscoreSort(sortMethod);
        const dataToSort = [...hiscoreDataAll];
        let sortedData = '';
        if (sortMethod === 'leastTurnsForWin') {
            sortedData = dataToSort.sort(compareValues(sortMethod));
        } else {
            sortedData = dataToSort.sort(compareValues(sortMethod, 'desc'));
        };
        const slicedData = sortedData.slice(0, 10);
        setHiscoreData(slicedData);

        //clear hiscore classes before setting correct class
        setGamesPlayedClass('normal');
        setGamesWonClass('normal');
        setGamesLostClass('normal');
        setWinStreakClass('normal');
        setLeastTurnsClass('normal');
    };

    //CREATE HISCORE TABLE
    const TableRow = ({row}) => (
        <tr>
            <td className="normal">{row.username}</td>
            <td className={gamesPlayedClass}>{row.totalGamesPlayed}</td>
            <td className={gamesWonClass}>{row.totalGamesWon}</td>
            <td className={gamesLostClass}>{row.totalGamesLost}</td>
            <td className={winStreakClass}>{row.winStreak}</td>
            <td className={leastTurnsClass}>{row.leastTurnsForWin}</td>
        </tr>
    )

    const Table = ({data}) => (
        <>
        <div className="hiscore-title">Liar's Dice Hiscores (top 10)</div>
        <table>
            <tbody>
                <tr>
                    <th className="no-sort-header">Player Name</th>
                    <th className={gamesPlayedClass} onClick={sortByTotalGamesPlayed}>Games Played</th>
                    <th className={gamesWonClass} onClick={sortByTotalGamesWon}>Games Won</th>
                    <th className={gamesLostClass} onClick={sortByTotalGamesLost}>Games Lost</th>
                    <th className={winStreakClass} onClick={sortByWinStreak}>Win Streak</th>
                    <th className={leastTurnsClass} onClick={sortByLeastTurns}>Least Turns</th>
                </tr>
                {data.map((row, index) => {
                    return <TableRow key={index} row={row} />
                })}
            </tbody>
        </table>
        </>
    )
    
    return (
        <div className="hiscore-table">
            <Table data={hiscoreData} />
        </div>
    )
};
