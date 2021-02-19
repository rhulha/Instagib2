// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import { Box3, Vector3 } from './three/build/three.module.js';
import { Capsule } from './three/examples/jsm/math/Capsule.js';
import q3dm17 from './models/q3dm17.js';
import { shoot } from './railgun.js';
import {sendCommand} from './networking.js';
import camera from './camera.js';
import scene from './scene.js';
import {keyStates, mouseStates, touchStates} from './input.js';
import {updateFragsCounter} from './hud.js';
import {checkPlayerPlayerCollisions, checkTriggers, checkWorld, checkPowerups} from './collisions.js'
import {audioHolder} from './audio.js';

const GRAVITY = 30;
const QuakeScale = 0.038;
const playerHeight = 3.53; // a bit crazy? Shouldn't it be 2.13 from Quake3?
const playerRadius = 0.7;
const cameraHeight = playerHeight-playerRadius;

class Player {
    /**
     * @param {Game} game
     * @param {string} name
     * @param {string} color
     */
    constructor(game, name, color) {
        this.playerCollider = new Capsule( new Vector3( 0, playerRadius, 0 ), new Vector3( 0, cameraHeight, 0 ), playerRadius );
        this.playerVelocity = new Vector3();
        this.enemyPosTemp = new Vector3();
        this.wishdir = new Vector3();
        this.wishJump=false;
        this.playerDirection = new Vector3();
        this.playerOnFloor = false;
        this.aliveSince = 0;
        this.tempBox = new Box3();
        this.tempVector = new Vector3();
        this.game = game;
        this.name = name;
        this.color = color;
        this.frags=0;
        this.dead=false;
        this.timeOfDeath=0;
        this.worldOctree = game.worldOctree;
        this.triggerOctree = game.triggerOctree;
        this.respawn();
    }

    getPos() {
        var s=this.playerCollider.start;
        return {x:s.x, y:s.y, z:s.z};
    }

    getRotation() {
        var r=camera.rotation;
        return {x:r.x, y:r.y};
    }

    fragSelf() {
        audioHolder.play("gib");
        sendCommand("fragself");
        this.frags--;
        updateFragsCounter();
        this.respawn();
    }
    
    playerCollisions() {
        checkWorld(this);
        checkPlayerPlayerCollisions(this);
        checkPowerups(this);
        checkTriggers(this);
        if( this.playerCollider.end.y < -40) {
            this.fragSelf();
            return;
        }
    }

    update( deltaTime ) {
        if ( this.playerOnFloor && this.playerVelocity.y <= 0) {
            // GROUND MOVE
            /*
            if(!this.wishJump)
                this.ApplyFriction(1, deltaTime);
            else
                this.ApplyFriction(0, deltaTime);
            */
           
            if( this.wishdir.lengthSq() == 0 ) {
                this.playerVelocity.addScaledVector( this.playerVelocity, -0.1 );
            } else {
                this.wishdir.normalize();
                this.wishdir.multiplyScalar(2*25*deltaTime); // CHANGED: 2 * 
                //document.getElementById("info").innerText = "this.wishdir.dot(this.playerVelocity): "+ this.wishdir.dot(this.playerVelocity).toFixed(2);
                if( this.wishdir.dot(this.playerVelocity) < 0 ) {
                    // user is trying to change direction, let's make it feel quick by increasing the wishdir
                    this.wishdir.multiplyScalar(10); // CHANGED: 2 * 
                }
                this.playerVelocity.add( this.wishdir );
                const damping = Math.exp( - 3 * deltaTime ) - 1;
                this.playerVelocity.addScaledVector( this.playerVelocity, damping );
                // playerVelocity.y = 0;
            }
            if(this.wishJump) {
                this.playerVelocity.y = 9;
                this.wishJump = false;
                audioHolder.play("jump");
            }
        } else {
            // AIR MOVE
            this.wishdir.normalize();
            this.wishdir.multiplyScalar(10*deltaTime); // some aircontrol
            this.playerVelocity.add( this.wishdir );
            this.playerVelocity.y -= GRAVITY * deltaTime;
        }
        const deltaPosition = this.playerVelocity.clone().multiplyScalar( deltaTime );
        this.playerCollider.translate( deltaPosition );
        this.playerCollisions();
        if(this.dead){
            this.tempVector.copy(this.playerCollider.end).lerp(this.playerCollider.start, Math.min(scene.elapsed - this.timeOfDeath, 1)); // slowly move camera down on death.
            camera.position.copy( this.tempVector );
        } else {
            camera.position.copy( this.playerCollider.end );
        }
    }

    getPlayerRelativeVector(side) {
        camera.getWorldDirection( this.playerDirection );
        this.playerDirection.y = 0;
        this.playerDirection.normalize();
        if( side)
            this.playerDirection.cross( camera.up );
        return this.playerDirection;
    }

    controls( deltaTime ) {
        this.wishdir.set(0,0,0);

        if (mouseStates[0]) {
            if(this.dead) {
                this.dead = false;
                sendCommand("respawn");
                audioHolder.play("teleport");
                this.respawn();
                document.getElementById("gun").style.visibility='visible';
                mouseStates[0]=false;
                return;
            } else {
                shoot(scene, this);
            }
        }

        if(this.dead)
            return;
    
        if( touchStates.rotate )
            camera.rotation.y -= (touchStates.pageX - touchStates.pageXStart) * 0.01 * deltaTime;

        if ( keyStates[ 'KeyW' ] ) {
            this.wishdir.add( this.getPlayerRelativeVector(false) )
        }
        if ( keyStates[ 'KeyS' ] ) {
            this.wishdir.sub( this.getPlayerRelativeVector(false) )
        }
        if ( keyStates[ 'KeyA' ] ) {
            this.wishdir.sub( this.getPlayerRelativeVector(true) )
        }
        if ( keyStates[ 'KeyD' ] ) {
            this.wishdir.add( this.getPlayerRelativeVector(true) )
        }
        if ( keyStates[ 'Space' ] ) {
            this.wishJump=true;
            keyStates[ 'Space' ] = false;
        }
        if ( keyStates[ 'KeyK' ] ) {
            if( ! audioHolder.gib.paused)
                return;
            this.fragSelf();
            keyStates[ 'KeyK' ] = false;
        }
        if ( keyStates[ 'KeyP' ] ) {
            if(!this.dead)
                return;
            var enemiesArray = Object.values(enemies);
            this.watchPlayer = enemiesArray[Math.floor(Math.random() * enemiesArray.length)]
            keyStates[ 'KeyP' ] = false;
        }
    }

    respawn() {
        var ipd = q3dm17.info_player_deathmatch;
        var rnd_ipd = ipd[Math.floor((Math.random()*ipd.length))];
        this.spawn(rnd_ipd.origin, rnd_ipd.angle);
    }

    spawn(originString, quake_angle) {
        var [x,z,y] = originString.split(" ");
        var origin = new Vector3(x,y,z).multiplyScalar(QuakeScale);
        origin.y-=0.2; // without this line, the player sinks down a bit after spawning...
        var feetPos = this.playerCollider.start.clone();
        feetPos.multiplyScalar(-1);
        feetPos.add(origin);
        this.playerCollider.translate(feetPos);
        this.playerVelocity.multiplyScalar(0);
        this.aliveSince = scene.elapsed; // the idea is to make the player invul for three seconds. And to change the model color for the duration.
        // But it is harder than I thought.

        camera.rotation.x=(-Math.PI / 2.0)*0; // look up 90° from floor
        // to convert from quake angle to our angle, I figured out this formula must be used: y=-x+270
        camera.rotation.y=(Math.PI * (-quake_angle+270) / 180.0);
    }
    
}

export {Player};
