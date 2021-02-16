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
import {updateFragsCounter} from './hud.js';
import { enemies, Enemy } from "./networking.js";

const GRAVITY = 30;
const QuakeScale = 0.038;
const playerHeight = 3.53; // a bit crazy? Shouldn't it be 2.13 from Quake3?
const playerRadius = 0.7;
const cameraHeight = playerHeight-playerRadius;

class Player {

    playerCollider = new Capsule( new Vector3( 0, playerRadius, 0 ), new Vector3( 0, cameraHeight, 0 ), playerRadius );
    playerVelocity = new Vector3();
    enemyPosTemp = new Vector3();
    wishdir = new Vector3();
    wishJump=false;
    playerDirection = new Vector3();
    playerOnFloor = false;
    aliveSince = 0;
    tempBox = new Box3();
    tempVector = new Vector3();
    
    /**
     * @param {Game} game
     */
    constructor(game, name, color) {
        this.game = game;
        this.name = name;
        this.color = color;
        this.frags=0;
        this.dead=false;
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
        this.game.audio.gib.play();
        webSocket.send({cmd: "fragself"});
        this.frags--;
        updateFragsCounter();
        this.respawn();
    }
    
    playerCollisions() {
        this.checkWorld();
        this.checkPlayerPlayerCollisions();
        this.checkPowerups();
        this.checkTriggers();
        if( this.playerCollider.end.y < -40) {
            this.fragSelf();
            return;
        }
    }

    checkPlayerPlayerCollisions() {
        for (var enemy_id in enemies) {
            /** @type {Enemy} */
            const enemy = enemies[enemy_id];
            const bottom = this.playerCollider.start.y - playerRadius;
            const top = this.playerCollider.end.y + playerRadius;
            // this.playerCollider.start - playerRadius is the location of our feet
            // enemy.p - playerRadius is the location of the enemy feet (lowest point)
            // enemy.p + playerHeight is the location of the enemy head (highest point)
            if (bottom < enemy.p.y + playerHeight // the player feet are below the enemy tip of the head
                && top > enemy.p.y - playerRadius) // and the player tip of the head is above the enemy feet
            {
                // at this point we have a potential collision since the player and the enemy are at the same height.
                // cameraHeight-playerRadius is the distance between the two points that make up the playerCollider capsule.
                if (this.playerCollider.start.y > enemy.p.y + cameraHeight - playerRadius) {
                    // at this point the player feet sphere center is above the enemy head sphere center
                    // remember that enemy.p is not a real Vector3
                    enemy.p.y += cameraHeight - playerRadius;
                    var dt = this.playerCollider.start.distanceTo(enemy.p);
                    if (dt < playerRadius * 2) {
                        //console.log("collision detected");
                        this.playerVelocity.addScaledVector(this.tempVector, -this.tempVector.dot(this.playerVelocity));
                        this.playerCollider.translate(this.tempVector.multiplyScalar(playerRadius * 2 - dt));
                    }
                    enemy.p.y -= cameraHeight - playerRadius;
                } else if (this.playerCollider.end.y < enemy.p.y) {
                    // at this point the player head sphere center is below the enemy feet sphere center
                    var dt = this.playerCollider.end.distanceTo(enemy.p); // consider using dtSquared.
                    if (dt < playerRadius * 2) {
                        //console.log("collision detected");
                        this.playerVelocity.addScaledVector(this.tempVector, -this.tempVector.dot(this.playerVelocity));
                        this.playerCollider.translate(this.tempVector.multiplyScalar(playerRadius * 2 - dt));
                    }
                } else {
                    // at this point we can do a simple cylinder collision check.
                    // In other words we can check the distance between two spheres at the same height.
                    var temp = enemy.p.y;
                    enemy.p.y = this.playerCollider.start.y;
                    var dt = this.playerCollider.start.distanceTo(enemy.p);
                    if (dt < playerRadius * 2) {
                        //console.log("collision detected");
                        this.tempVector.copy(this.playerCollider.start).sub(enemy.p).normalize(); // build a normal from enemy sphere to player sphere 
                        this.playerVelocity.addScaledVector(this.tempVector, -this.tempVector.dot(this.playerVelocity));
                        this.playerCollider.translate(this.tempVector.multiplyScalar(playerRadius * 2 - dt));
                    }
                    enemy.p.y = temp;
                }
            }
        }
    }

    checkTriggers() {
        const triggerResult = this.triggerOctree.capsuleIntersect(this.playerCollider);
        if (triggerResult) {
            if (triggerResult.userData.classname == "trigger_push") {
                var [x, z, y] = getTargets()[triggerResult.userData.target].split(" ");
                // TODO: I think this should be this.playerCollider.start. start is where the feet are...
                var vel = AimAtTarget(this.playerCollider.end, new Vector3(x, y, z).multiplyScalar(QuakeScale), GRAVITY);
                this.playerVelocity.copy(vel);
                this.game.audio.jumppad.play();
                this.playerOnFloor = false;
            } else if (triggerResult.userData.classname == "trigger_hurt") {
                fragSelf();
            } else if (triggerResult.userData.classname == "trigger_teleport") {
                // there is only one misc_teleporter_dest for all teleporters.
                // TODO: fix this for other maps
                this.game.audio.teleport.play();
                var mtd = q3dm17.misc_teleporter_dest[0];
                this.spawn(mtd.origin, mtd.angle);
            }
        }
    }

    checkWorld() {
        const result = this.worldOctree.capsuleIntersect(this.playerCollider);
        this.playerOnFloor = false;
        if (result) {
            this.playerOnFloor = result.normal.y > 0;
            if (!this.playerOnFloor) {
                this.playerVelocity.addScaledVector(result.normal, -result.normal.dot(this.playerVelocity));
            }
            this.playerCollider.translate(result.normal.multiplyScalar(result.depth));
        }
    }

    checkPowerups() {
        for (var pu_name in powerups) {
            var pu = powerups[pu_name];
            //pu.updateMatrixWorld( true );
            this.tempBox.copy(pu.geometry.boundingBox).applyMatrix4(pu.matrixWorld);
            if (pu.visible && this.playerCollider.intersectsBox(this.tempBox)) {
                game.audio.powerup.play();
                pu.hideStart = scene.elapsed;
                pu.visible = false;
                this.frags += 3;
                webSocket.send({ cmd: "powerup", "name": pu.name });
                updateFragsCounter();
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
