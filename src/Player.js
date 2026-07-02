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
import * as hud from './hud.js';
import {checkPlayerPlayerCollisions, checkTriggers, checkWorld, checkPowerups} from './collisions.js'
import {audioHolder} from './audio.js';
import {enemies} from './networking.js';

const QuakeScale = 0.038;
// Quake 3 movement values (bg_pmove.c / g_main.c), speeds scaled from Quake units to ours
const GRAVITY = 800 * QuakeScale;
const MAX_SPEED = 320 * QuakeScale;
const STOP_SPEED = 100 * QuakeScale;
const JUMP_VELOCITY = 270 * QuakeScale;
const ACCELERATE = 10; // per-second rates, unit-independent
const AIR_ACCELERATE = 1;
const FRICTION = 6;
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
        this.deltaPosition = new Vector3();
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
        hud.updateFragsCounter();
        this.respawn();
    }
    
    playerCollisions() {
        checkWorld(this);
        checkPlayerPlayerCollisions(this);
        if(!this.dead) {
            checkPowerups(this);
            checkTriggers(this);
        }
        if( this.playerCollider.end.y < -40) {
            this.fragSelf();
            return;
        }
    }

    applyFriction( deltaTime ) {
        const vel = this.playerVelocity;
        const speed = Math.hypot( vel.x, vel.z );
        if ( speed < 1 * QuakeScale ) {
            vel.x = 0;
            vel.z = 0;
            return;
        }
        const control = speed < STOP_SPEED ? STOP_SPEED : speed;
        const newspeed = Math.max( 0, speed - control * FRICTION * deltaTime );
        vel.x *= newspeed / speed;
        vel.z *= newspeed / speed;
    }

    accelerate( wishspeed, accel, deltaTime ) {
        const currentspeed = this.playerVelocity.dot( this.wishdir );
        const addspeed = wishspeed - currentspeed;
        if ( addspeed <= 0 )
            return;
        const accelspeed = Math.min( accel * wishspeed * deltaTime, addspeed );
        this.playerVelocity.addScaledVector( this.wishdir, accelspeed );
    }

    update( deltaTime ) {
        const wishspeed = this.wishdir.lengthSq() > 0 ? MAX_SPEED : 0;
        this.wishdir.normalize();

        let grounded = this.playerOnFloor && this.playerVelocity.y <= 0;
        if ( grounded && this.wishJump ) {
            this.playerVelocity.y = JUMP_VELOCITY;
            this.wishJump = false;
            audioHolder.play("jump");
            grounded = false; // Q3 jumps switch to air move in the same frame, skipping friction
        }
        if ( grounded ) {
            // GROUND MOVE
            this.applyFriction( deltaTime );
            this.accelerate( wishspeed, ACCELERATE, deltaTime );
        } else {
            // AIR MOVE
            this.accelerate( wishspeed, AIR_ACCELERATE, deltaTime );
            this.playerVelocity.y -= GRAVITY * deltaTime;
        }
        this.deltaPosition.copy(this.playerVelocity).multiplyScalar( deltaTime );
        this.playerCollider.translate( this.deltaPosition );
        this.playerCollisions();
        if(this.dead) {
            if( this.watchPlayer ) {
                camera.position.copy( this.watchPlayer.p );
                camera.position.x+=Math.sin(camera.rotationy)*3;
                camera.position.z+=Math.cos(camera.rotationy)*3;
                camera.position.y+=cameraHeight;
                this.tempVector.copy(this.watchPlayer.p).y+=cameraHeight;
                camera.lookAt( this.tempVector );
            } else {
                this.tempVector.copy(this.playerCollider.end).lerp(this.playerCollider.start, Math.min(scene.elapsed - this.timeOfDeath, 1)); // slowly move camera down on death.
                camera.position.copy( this.tempVector );
            }
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
                this.watchPlayer=undefined;
                hud.showGunAndCrosshairs(true);
                mouseStates[0]=false;
                return;
            } else {
                shoot(scene, this);
            }
        }
        if ( keyStates[ 'ArrowLeft' ] ) {
            camera.rotationy -= 0.02;
        }
        if ( keyStates[ 'ArrowRight' ] ) {
            camera.rotationy += 0.02;
        }

        if ( keyStates[ 'KeyP' ] ) {
            if(!this.dead) {
                this.dead=true;
                this.timeOfDeath=scene.elapsed;
                hud.hideGunAndCrosshairs(true);
            }
            var enemiesArray = Object.values(enemies);
            this.watchPlayer = enemiesArray[Math.floor(Math.random() * enemiesArray.length)]
            console.log(this.watchPlayer);
            keyStates[ 'KeyP' ] = false;
        }

        if( touchStates.rotate )
            camera.rotation.y -= (touchStates.pageX - touchStates.pageXStart) * 0.01 * deltaTime;

        if(this.dead)
            return;
        
        this.wishdir.add(this.getPlayerRelativeVector(false).multiplyScalar(keyStates['KeyW'] - keyStates['KeyS']));
        this.wishdir.add(this.getPlayerRelativeVector(true).multiplyScalar(keyStates['KeyD'] - keyStates['KeyA']));

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
