// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import game from './setup.js';
import {enemies} from './networking.js';

function updateFragsCounter()
{
    document.getElementById("frags").innerText = ""+ (game.player.frags) + " frags";
}

function updateTopFragsCounter(playerWithMostFrags)
{
    document.getElementById("topfrags").innerText = "top score: "+ playerWithMostFrags.name + " " + playerWithMostFrags.frags;
}

function updateInfoText(text)
{
    document.getElementById("info").innerText = text;
}

function ac(type, father) {
    return father.appendChild(document.createElement(type));
}

function addTableRow(t, name, frags) {
    var tr = ac("tr", t);
    var td_name = ac("td", tr);
    var td_frags = ac("td", tr);
    td_name.innerText = name;
    td_frags.innerText = frags;
}

function displayScore() {
    document.getElementById("score").style.visibility="visible";
    var t = document.getElementById("score_table");
    t.innerHTML = '';
    addTableRow(t, "NAME", "FRAGS");
    var array = Object.values(enemies);
    array.push(game.player);
    array.sort((a,b)=>b.frags-a.frags).forEach(e=>addTableRow(t, e.name, e.frags));
}

function hideScore() {
    document.getElementById("score").style.visibility="hidden";
}

function hideGunAndCrosshairs() {
    document.getElementById("gun").style.visibility="hidden";
    document.getElementById("crosshair").style.visibility="hidden";
}

function showGunAndCrosshairs() {
    document.getElementById("gun").style.visibility="visible";
    document.getElementById("crosshair").style.visibility="visible";
}


export {updateInfoText, updateFragsCounter, updateTopFragsCounter, displayScore, hideScore, ac, hideGunAndCrosshairs, showGunAndCrosshairs};
