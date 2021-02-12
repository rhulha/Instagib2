// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import { Vector3, Camera, Scene, MathUtils} from './three/build/three.module.js';
import { Capsule } from './three/examples/jsm/math/Capsule.js';
import { Octree } from './three/examples/jsm/math/Octree.js';
import { getTargets, AimAtTarget } from './trigger.js';
import { shoot } from './railgun.js';
import q3dm17 from './models/q3dm17.js';
import webSocket from './lib/webSocket.js';

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
    keyStates = {};
    sensitivity=500;

    getPos() {
        var s=this.playerCollider.start;
        return {x:s.x, y:s.y, z:s.z};
    }

    getRotation() {
        var r=this.camera.rotation;
        return {x:r.x, y:r.y};
    }

    /**
     * @param {Octree} worldOctree
     * @param {Octree} jumpPadsOctree
     * @param {Camera} camera
     * @param {Scene} scene
     */
    constructor(game) {
        this.game = game;
        this.kills=0;
        this.dead=false;
        this.worldOctree = game.worldOctree;
        this.jumpPadsOctree = game.jumpPadsOctree;
        this.camera = game.camera;
        this.respawn();
        document.addEventListener( 'keydown', ( event ) => { if( !event.repeat ) this.keyStates[ event.code ] = true;}, false );
        document.addEventListener( 'keyup', ( event ) => this.keyStates[ event.code ] = false, false );
        document.addEventListener( 'mousedown', (e) => {
            if (e.button == 2) {
                game.camera.zoom = 4;
                this.sensitivity *= 3;
                game.camera.updateProjectionMatrix();
            }
        });
        document.addEventListener( 'mouseup', (e) => {
            if (e.button == 2) { 
                game.camera.zoom = 1;
                this.sensitivity /= 3;
                game.camera.updateProjectionMatrix();
            }
        });
        
        document.addEventListener( 'mousedown', (e) => {
            if ( document.pointerLockElement !== document.body ) {
                document.body.requestPointerLock();
                return;
            }
            if (e.button == 0)
                shoot(game.scene, this);
        }, false );

        document.body.addEventListener( 'mousemove', ( event ) => {
            if ( document.pointerLockElement === document.body ) {
                game.camera.rotation.y -= event.movementX / this.sensitivity;
                game.camera.rotation.x -= event.movementY / this.sensitivity;
                game.camera.rotation.x = MathUtils.clamp(game.camera.rotation.x, -Math.PI/2, Math.PI/2)
            }
        }, false );
     
        this.touchPageXStart=0;
        this.touchPageYStart=0;
        this.touchPageX=0;
        this.touchPageY=0;
        this.touchRotate = false;
        document.body.addEventListener( 'touchstart', (e)=>{
            if( e.touches.length > 1) {
                shoot(game.scene, this);
            }
            this.touchPageXStart = e.touches[0].pageX;
            this.touchPageYStart = e.touches[0].pageY;
            this.touchRotate = true;
        }, false);

        document.body.addEventListener('touchmove', (e) => {
            this.touchPageX = e.touches[0].pageX;
            if( e.touches[0].pageY - this.touchPageYStart > 30) {
                this.keyStates[ 'KeyW' ] = false;
                this.keyStates[ 'KeyS' ] = true;
            } else if( e.touches[0].pageY - this.touchPageYStart < -30) {
                this.keyStates[ 'KeyW' ] = true;
                this.keyStates[ 'KeyS' ] = false;
            } else {
                this.keyStates[ 'KeyW' ] = false;
                this.keyStates[ 'KeyS' ] = false;
            }
        }, false);
        document.body.addEventListener('touchend', (e)=>{
            this.keyStates[ 'KeyW' ] = false;
            this.keyStates[ 'KeyS' ] = false;
            this.touchRotate = false;
        }, false);
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
        
        //document.getElementById("info").innerText = "playerOnFloor: "+ playerOnFloor;

        if( this.playerCollider.end.y < -40) {
            this.game.audio.gib.play();
            webSocket.send({cmd: "selfkill"});
            this.respawn();
            return;
        }

        const triggerResult = this.jumpPadsOctree.capsuleIntersect( this.playerCollider );
        if ( triggerResult ) {
            if( triggerResult.userData.classname == "trigger_push") {
                var [x,z,y] = getTargets()[triggerResult.userData.target].split(" ");
                // TODO: I think this should be this.playerCollider.start. start is where the feet are...
                var vel = AimAtTarget(this.playerCollider.end, new Vector3(x, y, z).multiplyScalar(QuakeScale), GRAVITY);
                this.playerVelocity.copy(vel);
                this.game.audio.jumppad.play();
                this.playerOnFloor=false;
            } else if( triggerResult.userData.classname == "trigger_hurt") {
                this.game.audio.gib.play();
                webSocket.send({cmd: "selfkill"});
                this.respawn();
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
        this.camera.position.copy( this.playerCollider.end );
    }

    getPlayerRelativeVector(side) {
        this.camera.getWorldDirection( this.playerDirection );
        this.playerDirection.y = 0;
        this.playerDirection.normalize();
        if( side)
            this.playerDirection.cross( this.camera.up );
        return this.playerDirection;
    }

    controls( deltaTime ) {
        this.wishdir.set(0,0,0);

        if( this.touchRotate )
            this.game.camera.rotation.y -= (this.touchPageX - this.touchPageXStart) * 0.01 * deltaTime;

        if ( this.keyStates[ 'KeyW' ] ) {
            this.wishdir.add( this.getPlayerRelativeVector(false) )
        }
        if ( this.keyStates[ 'KeyS' ] ) {
            this.wishdir.sub( this.getPlayerRelativeVector(false) )
        }
        if ( this.keyStates[ 'KeyA' ] ) {
            this.wishdir.sub( this.getPlayerRelativeVector(true) )
        }
        if ( this.keyStates[ 'KeyD' ] ) {
            this.wishdir.add( this.getPlayerRelativeVector(true) )
        }
        if ( this.keyStates[ 'Space' ] ) {
            this.wishJump=true;
            this.keyStates[ 'Space' ] = false;
        }
        if ( this.keyStates[ 'KeyK' ] ) {
            if( ! this.game.audio.gib.paused)
                return;
            this.game.audio.gib.play();
            this.respawn();
            webSocket.send({cmd: "selfkill"});
            this.keyStates[ 'KeyK' ] = false;
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

        this.game.camera.rotation.x=(-Math.PI / 2.0)*0; // look up 90° from floor
        // to convert from quake angle to our angle, I figured out this formula must be used: y=-x+270
        this.game.camera.rotation.y=(Math.PI * (-quake_angle+270) / 180.0);
    }
    
}

export {Player};
