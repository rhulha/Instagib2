import { Vector3, Camera, Scene} from './three/build/three.module.js';
import { Capsule } from './three/examples/jsm/math/Capsule.js';
import { Octree } from './three/examples/jsm/math/Octree.js';
import { getTargets, AimAtTarget } from './trigger.js';
import { shoot } from './railgun.js';
import audio from './audio.js';
            
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
    

    clamp(num, min, max) {
        return num <= min ? min : num >= max ? max : num;
    }

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
        this.worldOctree = game.worldOctree;
        this.jumpPadsOctree = game.jumpPadsOctree;
        this.camera = game.camera;
        this.playerCollider.translate(new Vector3( 0, 11, 0 ));
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
                game.camera.rotation.x = this.clamp(game.camera.rotation.x, -Math.PI/2, Math.PI/2)
            }
        }, false );
     
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

        const result2 = this.jumpPadsOctree.capsuleIntersect( this.playerCollider );
        if ( result2 ) {
            console.log( getTargets()[result2.name] )
            var [x,z,y] = getTargets()[result2.name].split(" ");
            var vel = AimAtTarget(this.playerCollider.end, new Vector3(x, y, z).multiplyScalar(QuakeScale), GRAVITY);
            this.playerVelocity.copy(vel);
            audio.jumppad.play();
        }
    }

    update( deltaTime ) {

        if ( this.playerOnFloor ) {
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
                this.playerVelocity.add( this.wishdir );
                const damping = Math.exp( - 3 * deltaTime ) - 1;
                this.playerVelocity.addScaledVector( this.playerVelocity, damping );
                // playerVelocity.y = 0;
            }
            if(this.wishJump) {
                this.playerVelocity.y = 9;
                this.wishJump = false;
                audio.jump.play();
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
            this.playerCollider.copy(new Capsule( new Vector3( 0, 0.35, 0 ), new Vector3( 0, 2.13+0.35, 0 ), 0.35 ));
            this.playerCollider.translate(new Vector3( 0, 11, 0 ));
            this.playerVelocity = new Vector3();
        }
    }
}

export {Player};
