// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import { Box3, Vector3 } from './three/build/three.module.js';
import { Capsule } from './three/examples/jsm/math/Capsule.js';
import { getTargets, AimAtTarget } from './trigger.js';
import q3dm17 from './models/q3dm17.js';
import { shoot } from './railgun.js';
import webSocket from './lib/webSocket.js';
import camera from './camera.js';
import scene from './scene.js';
import {keyStates, mouseStates, touchStates} from './input.js';
import powerups from './powerups.js';
import game from './setup.js';
import {updateFragCounter} from './hud.js';

const GRAVITY = 30;
const QuakeScale = 0.038;

class Player {

    playerCollider = new Capsule( new Vector3( 0, 0.7, 0 ), new Vector3( 0, 2.13+0.7, 0 ), 0.7 );
    playerVelocity = new Vector3();
    enemyPos = new Vector3();
    wishdir = new Vector3(); // Quake
    wishJump=false;
    playerDirection = new Vector3();
    playerOnFloor = false;
    aliveSince = 0;
    tempBox = new Box3();
    
    getPos() {
        var s=this.playerCollider.start;
        return {x:s.x, y:s.y, z:s.z};
    }

    getRotation() {
        var r=camera.rotation;
        return {x:r.x, y:r.y};
    }

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        this.kills=0;
        this.dead=false;
        this.worldOctree = game.worldOctree;
        this.triggerOctree = game.triggerOctree;
        this.respawn();
    }

    selfKill() {
        this.game.audio.gib.play();
        webSocket.send({cmd: "selfkill"});
        this.kills--;
        updateFragCounter();
        this.respawn();
    }
    
    playerCollisions() {
        const result = this.worldOctree.capsuleIntersect( this.playerCollider );
        this.playerOnFloor = false;
        if ( result ) {
            this.playerOnFloor = result.normal.y > 0;
            if ( ! this.playerOnFloor ) {
                this.playerVelocity.addScaledVector( result.normal, - result.normal.dot( this.playerVelocity ) );
            }
            this.playerCollider.translate( result.normal.multiplyScalar( result.depth ) );
        }
        
        for(var pu_name in powerups) {
            var pu = powerups[pu_name];
            //pu.updateMatrixWorld( true );
            this.tempBox.copy( pu.geometry.boundingBox ).applyMatrix4( pu.matrixWorld );
            if( pu.visible && this.playerCollider.intersectsBox( this.tempBox )) {
                game.audio.powerup.play();
                pu.hideStart=scene.elapsed;
                pu.visible=false;
                this.kills += 5;
                webSocket.send({cmd: "powerup", "name": pu.name});
                updateFragCounter();
            }
        }
        //document.getElementById("info").innerText = "playerOnFloor: "+ playerOnFloor;

        if( this.playerCollider.end.y < -40) {
            this.selfKill();
            return;
        }

        const triggerResult = this.triggerOctree.capsuleIntersect( this.playerCollider );
        if ( triggerResult ) {
            if( triggerResult.userData.classname == "trigger_push") {
                var [x,z,y] = getTargets()[triggerResult.userData.target].split(" ");
                // TODO: I think this should be this.playerCollider.start. start is where the feet are...
                var vel = AimAtTarget(this.playerCollider.end, new Vector3(x, y, z).multiplyScalar(QuakeScale), GRAVITY);
                this.playerVelocity.copy(vel);
                this.game.audio.jumppad.play();
                this.playerOnFloor=false;
            } else if( triggerResult.userData.classname == "trigger_hurt") {
                selfKill();
            } else if( triggerResult.userData.classname == "trigger_teleport") {
                // there is only one misc_teleporter_dest for all teleporters.
                // TODO: fix this for other maps
                this.game.audio.teleport.play();
                var mtd = q3dm17.misc_teleporter_dest[0];
                this.spawn(mtd.origin, mtd.angle); 
            }
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
                this.game.audio.jump.play();
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
        camera.position.copy( this.playerCollider.end );
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

        if (mouseStates[0])
            shoot(scene, this);
        
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
            if( ! this.game.audio.gib.paused)
                return;
            this.selfKill();
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
