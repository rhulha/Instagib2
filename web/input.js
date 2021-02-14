// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import { MathUtils} from './three/build/three.module.js';
import { shoot } from './railgun.js';
import camera from './camera.js';
import game from './setup.js';
import {sendCommand} from './networking.js';

var sensitivity=500;
var keyStates = {};
var touchStates = {};
var mouseStates = {};

window.sensitivity = (val) => {
    console.log("old sensitivity: " + sensitivity);
    if( val > 0 || val < 0 )
        sensitivity = val;
}

document.body.addEventListener( 'mousemove', ( event ) => {
    if ( document.pointerLockElement === document.body ) {
        camera.rotation.y -= event.movementX / sensitivity;
        camera.rotation.x -= event.movementY / sensitivity;
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
        sensitivity *= 3;
        camera.updateProjectionMatrix();
    }
});
document.addEventListener( 'mouseup', (e) => {
    mouseStates[e.button]=false;
    if (e.button == 2) { 
        camera.zoom = 1;
        sensitivity /= 3;
        camera.updateProjectionMatrix();
    }
});

document.addEventListener( 'keydown', ( event ) => { if( !event.repeat ) keyStates[ event.code ] = true;}, false );
document.addEventListener( 'keyup', ( event ) => keyStates[ event.code ] = false, false );

touchStates.pageXStart=0;
touchStates.pageYStart=0;
touchStates.pageX=0;
touchStates.pageY=0;
touchStates.rotate = false;

document.body.addEventListener( 'touchstart', (e)=>{
    if( e.touches.length > 1) {
        shoot(game.scene, game.player);
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
        sendCommand("sendTestData");
    }	
});

export {keyStates, mouseStates, touchStates};

