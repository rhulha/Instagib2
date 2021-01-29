import { Vector3, Camera } from './three/build/three.module.js';
import { Capsule } from './three/examples/jsm/math/Capsule.js';
import { Octree } from './three/examples/jsm/math/Octree.js';
import { targets } from './trigger.js';

const GRAVITY = 30;

class Player {

    playerCollider = new Capsule( new Vector3( 0, 0.35, 0 ), new Vector3( 0, 2.13+0.35, 0 ), 0.35 );
    playerVelocity = new Vector3();
    playerDirection = new Vector3();
    playerOnFloor = false;
    keyStates = {};

    /**
     * @param {Octree} worldOctree
     * @param {Octree} jumpPadsOctree
     * @param {Camera} camera
     */
    constructor(worldOctree, jumpPadsOctree, camera) {
        this.worldOctree = worldOctree;
        this.jumpPadsOctree = jumpPadsOctree;
        this.camera = camera;
        this.playerCollider.translate(new Vector3( 0, 11, 0 ))
        document.addEventListener( 'keydown', ( event ) => this.keyStates[ event.code ] = true, false );
        document.addEventListener( 'keyup', ( event ) => this.keyStates[ event.code ] = false, false );
        document.addEventListener( 'mousedown', () => document.body.requestPointerLock(), false );

        document.body.addEventListener( 'mousemove', ( event ) => {
            if ( document.pointerLockElement === document.body ) {
                camera.rotation.y -= event.movementX / 500;
                camera.rotation.x -= event.movementY / 500;
            }
        }, false );
        
    }

    /**
     * @param {Vector3} origin
     * @param {Vector3} target
     */
    AimAtTarget(origin, target) {
        // var origin = new Vector.fromVector(m.mins).add(m.maxs).scale(0.5);
    
        var height = target.y - origin.y;
        var gravity = 800.0*0.038;
        var time = Math.sqrt(height / (0.5 * gravity));
        // set s.origin2 to the push velocity
        var origin2 = target.clone();
        origin2.sub(origin);
        origin2.y = 0.0;
        var dist = origin2.length();
        origin2.normalize();
    
        var forward = dist / time;
        origin2.multiplyScalar(forward);
        origin2.y = time * gravity;
        return origin2; // weird value found by experimenting
        // return origin2.scale(0.161); // weird value found by experimenting
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

        const result2 = this.jumpPadsOctree.capsuleIntersect( this.playerCollider );
        //this.playerOnFloor = false;
        if ( result2 ) {
            console.log( targets[result2.name] )
            var [x,z,y] = targets[result2.name].split(" ");

            // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
            var vel = this.AimAtTarget(this.playerCollider.end, new Vector3(x, y, z).multiplyScalar(0.038));
            this.playerVelocity.copy(vel);
            //this.playerVelocity.y = 35;
            // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

            //this.playerOnFloor = result.normal.y > 0;
            if ( ! this.playerOnFloor ) {
                //this.playerVelocity.addScaledVector( result.normal, - result.normal.dot( this.playerVelocity ) );
            }
            //this.playerCollider.translate( result.normal.multiplyScalar( result.depth ) );
        }
    }

    update( deltaTime ) {
        if ( this.playerOnFloor ) {
            const damping = Math.exp( - 3 * deltaTime ) - 1;
            this.playerVelocity.addScaledVector( this.playerVelocity, damping );
        } else {
            this.playerVelocity.y -= GRAVITY * deltaTime;
        }
        const deltaPosition = this.playerVelocity.clone().multiplyScalar( deltaTime );
        this.playerCollider.translate( deltaPosition );
        this.playerCollisions();
        this.camera.position.copy( this.playerCollider.end );
    }
    
    getForwardVector() {
        this.camera.getWorldDirection( this.playerDirection );
        this.playerDirection.y = 0;
        this.playerDirection.normalize();
        return this.playerDirection;
    }
    
    getSideVector() {
        this.camera.getWorldDirection( this.playerDirection );
        this.playerDirection.y = 0;
        this.playerDirection.normalize();
        this.playerDirection.cross( this.camera.up );
        return this.playerDirection;
    }
    
    controls( deltaTime ) {
        const speed = 25;
        if ( this.playerOnFloor ) {
            if ( this.keyStates[ 'KeyW' ] ) {
                this.playerVelocity.add( this.getForwardVector().multiplyScalar( speed * deltaTime ) );
            }
            if ( this.keyStates[ 'KeyS' ] ) {
                this.playerVelocity.add( this.getForwardVector().multiplyScalar( - speed * deltaTime ) );
            }
            if ( this.keyStates[ 'KeyA' ] ) {
                this.playerVelocity.add( this.getSideVector().multiplyScalar( - speed * deltaTime ) );
            }
            if ( this.keyStates[ 'KeyD' ] ) {
                this.playerVelocity.add( this.getSideVector().multiplyScalar( speed * deltaTime ) );
            }
            if ( this.keyStates[ 'Space' ] ) {
                this.playerVelocity.y = 35;
            }
        }
    }
}

export {Player};
