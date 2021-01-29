import { Vector3, Camera } from './three/build/three.module.js';
import { Capsule } from './three/examples/jsm/math/Capsule.js';
import { Octree } from './three/examples/jsm/math/Octree.js';
import { targets } from './trigger.js';

const GRAVITY = 30.4;
const QuakeScale = 0.038;

class Player {

    playerCollider = new Capsule( new Vector3( 0, 0.35, 0 ), new Vector3( 0, 2.13+0.35, 0 ), 0.35 );
    playerVelocity = new Vector3();
    wishdir = new Vector3(); // Quake
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
        var gravity = GRAVITY; // 20.0*0.038;
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
        return origin2;
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
            var vel = this.AimAtTarget(this.playerCollider.end, new Vector3(x, y, z).multiplyScalar(QuakeScale));
            this.playerVelocity.copy(vel);
        }
    }

    update( deltaTime ) {
        if ( this.playerOnFloor ) {
            this.wishdir.normalize();
            var s = this.MoveGround(this.wishdir, this.playerVelocity, (50.0 / 3.0) * 0.0075)
            this.playerVelocity.copy(s);
        } else {
            //var s = this.MoveAir(this.wishdir, this.playerVelocity, (50.0 / 3.0) * 0.0075)
            //this.playerVelocity.copy(s);
            this.playerVelocity.y -= GRAVITY * deltaTime * 0.038;
        }
        const deltaPosition = this.playerVelocity.clone(); // .multiplyScalar( deltaTime );
        this.playerCollider.translate( deltaPosition );
        this.playerCollisions();
        this.camera.position.copy( this.playerCollider.end );
    }

    // accelDir: normalized direction that the player has requested to move (taking into account the movement keys and look direction)
    // prevVelocity: The current velocity of the player, before any additional calculations
    // accelerate: The server-defined player acceleration value
    // max_velocity: The server-defined maximum player velocity (this is not strictly adhered to due to strafejumping)
    Accelerate(accelDir, prevVelocity, accelerate, max_velocity, deltaTime)
    {
        var projVel = prevVelocity.dot(accelDir); // Vector projection of Current velocity onto accelDir.
        var accelVel = accelerate * deltaTime; // Accelerated velocity in direction of movment

        // If necessary, truncate the accelerated velocity so the vector projection does not exceed max_velocity
        if(projVel + accelVel > max_velocity)
            accelVel = max_velocity - projVel;

        return new Vector3().copy(prevVelocity).add(accelDir).multiplyScalar(accelVel);
    }

    // 
    MoveGround(accelDir, prevVelocity, deltaTime)
    {
        const friction = 6;
        // Apply Friction
        var speed = prevVelocity.length();
        if (speed != 0) // To avoid divide by zero errors
        {
            var drop = speed * friction * deltaTime;
            prevVelocity.multiplyScalar(Math.max(speed - drop, 0) / speed); // Scale the velocity based on friction.
        }
        const ground_accelerate = 1.0;
        const max_velocity_ground = 320;
        // ground_accelerate and max_velocity_ground are server-defined movement variables
        return this.Accelerate(accelDir, prevVelocity, ground_accelerate, max_velocity_ground, deltaTime);
    }

    MoveAir(accelDir, prevVelocity, deltaTime)
    {
        // air_accelerate and max_velocity_air are server-defined movement variables
        const air_accelerate = 0.7;
        const max_velocity_air = 1320;
        return this.Accelerate(accelDir, prevVelocity, air_accelerate, max_velocity_air, deltaTime);
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
        this.wishdir.set(0,0,0);
        if ( this.keyStates[ 'KeyW' ] ) {
            this.wishdir.add( this.getForwardVector() )
        }
        if ( this.keyStates[ 'KeyS' ] ) {
            this.wishdir.sub( this.getForwardVector() )
        }
        if ( this.keyStates[ 'KeyA' ] ) {
            this.wishdir.sub( this.getSideVector() )
        }
        if ( this.keyStates[ 'KeyD' ] ) {
            this.wishdir.add( this.getSideVector() )
        }
        if ( this.keyStates[ 'Space' ] ) {
            this.playerVelocity.y = 0.6;
            this.wishJump=true;
        }
    }
}

export {Player};
