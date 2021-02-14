import game from './setup.js';

function updateFragCounter()
{
    document.getElementById("kills").innerText = ""+ (game.player.kills) + " Kills";
}

export {updateFragCounter};
