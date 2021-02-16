import game from './setup.js';

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

export {updateInfoText, updateFragsCounter, updateTopFragsCounter};
