// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import { MathUtils} from './three/build/three.module.js';
import { shoot } from './railgun.js';
import camera from './camera.js';
import game from './setup.js';
import {sendCommand} from './networking.js';
import {displayScore, hideScore} from './hud.js';
import { audioHolder } from './audio.js';

var keyStates = {};
var touchStates = {};
var mouseStates = {};
mouseStates.sensitivity = 500; // higher values are slower

window.sensitivity = (val) => {
    console.log("old sensitivity: " + mouseStates.sensitivity);
    if( val > 0 || val < 0 )
        mouseStates.sensitivity = val;
    return "done";
}

window.volume = (val) => {
    console.log("old volume: " + audioHolder.volume);
    if( val > 0 || val < 0 )
        audioHolder.volume = val;
    return "done";
}

window.fov = (val) => {
    console.log("old fov: " + camera.fov);
    if( val > 0 || val < 0 ) {
        camera.fov = val;
        camera.updateProjectionMatrix();
    }
    return "done";
}
console.log("Feel free to change volume(0.4), sensitivity(500) higher is slower or fov(75).")

document.body.addEventListener( 'mousemove', ( event ) => {
    if ( document.pointerLockElement === document.body ) {
        camera.rotation.y -= event.movementX / Math.abs(mouseStates.sensitivity);
        camera.rotation.x -= event.movementY / mouseStates.sensitivity;
        camera.rotation.x = MathUtils.clamp(camera.rotation.x, -Math.PI/2, Math.PI/2)
    }
}, false );

document.addEventListener( 'mousedown', (e) => {
    if ( document.pointerLockElement !== document.body ) {
        document.body.requestPointerLock();
        return;
    }
    mouseStates[e.button]=true;
    if (e.button == 2) {
        camera.zoom = 4;
        mouseStates.sensitivity *= 3;
        camera.updateProjectionMatrix();
    }
});
document.addEventListener( 'mouseup', (e) => {
    mouseStates[e.button]=false;
    if (e.button == 2) { 
        camera.zoom = 1;
        mouseStates.sensitivity /= 3;
        camera.updateProjectionMatrix();
    }
});


document.addEventListener( 'keydown', ( event ) => {
    if( event.repeat )
        return;
    keyStates[ event.code ] = true;
    if( event.code == "KeyQ") {
        displayScore();
    }
}, false );

document.addEventListener( 'keyup', ( event ) => {
    keyStates[ event.code ] = false;
    if( event.code == "KeyQ") {
        hideScore();
    }
}, false );

touchStates.pageXStart=0;
touchStates.pageYStart=0;
touchStates.pageX=0;
touchStates.pageY=0;
touchStates.rotate = false;

document.body.addEventListener( 'touchstart', (e)=>{
    if( e.touches.length > 1) {
        shoot(game.scene, game.player);
        document.getElementById("gun").style.visibility='hidden'; // Gun is too big on mobiles. TODO: don't hide, make smaller.
    }
    touchStates.pageXStart = e.touches[0].pageX;
    touchStates.pageYStart = e.touches[0].pageY;
    touchStates.rotate = true;
}, false);

document.body.addEventListener('touchmove', (e) => {
    touchStates.pageX = e.touches[0].pageX;
    if( e.touches[0].pageY - touchStates.pageYStart > 30) {
        keyStates[ 'KeyW' ] = false;
        keyStates[ 'KeyS' ] = true;
    } else if( e.touches[0].pageY - touchStates.pageYStart < -30) {
        keyStates[ 'KeyW' ] = true;
        keyStates[ 'KeyS' ] = false;
    } else {
        keyStates[ 'KeyW' ] = false;
        keyStates[ 'KeyS' ] = false;
    }
}, false);

document.body.addEventListener('touchend', (e)=>{
    keyStates[ 'KeyW' ] = false;
    keyStates[ 'KeyS' ] = false;
    touchStates.rotate = false;
}, false);

document.addEventListener("keydown", (event)=>{	
    if (event.key === "Enter") {	
        //sendCommand("sendTestData");
    }	
});

export {keyStates, mouseStates, touchStates};
