import { Vector3, Camera, Clock } from './three/build/three.module.js';
import { Capsule } from './three/examples/jsm/math/Capsule.js';
import { Octree } from './three/examples/jsm/math/Octree.js';
import { targets } from './trigger.js';
import { AimAtTarget } from './AimAtTarget.js';

const GRAVITY = 20;
const QuakeScale = 0.038;
const moveSpeed = 7.0;  // Ground move speed
const runAcceleration = 14;   // Ground accel
const runDeacceleration = 10;   // Deacceleration that occurs when running on the ground
const airAcceleration = 2.0;   // Ground accel
const airDeacceleration = 2.0;   // Ground accel
const jumpSpeed = 8.0;  // The speed at which the character's up axis gains when hitting jump
const friction = 6;

class Player {

    playerCollider = new Capsule( new Vector3( 0, 0.35, 0 ), new Vector3( 0, 2.13+0.35, 0 ), 0.35 );
    playerVelocity = new Vector3();
	wishdir = new Vector3(); // Quake
    playerDirection = new Vector3();
    playerOnFloor = false;
    keyStates = {};
    wishJump=false;

    clamp(num, min, max) {
        return num <= min ? min : num >= max ? max : num;
    }

    /**
     * @param {Octree} worldOctree
     * @param {Octree} jumpPadsOctree
     * @param {Camera} camera
     */
    constructor(worldOctree, jumpPadsOctree, camera, clock) {
        this.worldOctree = worldOctree;
        this.jumpPadsOctree = jumpPadsOctree;
        this.camera = camera;
        this.clock = clock;
        this.playerCollider.translate(new Vector3( 11, 3, 11 ))
        document.addEventListener( 'keydown', ( event ) => this.keyStates[ event.code ] = true, false );
        document.addEventListener( 'keyup', ( event ) => this.keyStates[ event.code ] = false, false );
        document.addEventListener( 'mousedown', () => document.body.requestPointerLock(), false );

        document.body.addEventListener( 'mousemove', ( event ) => {
            if ( document.pointerLockElement === document.body ) {
                camera.rotation.y -= event.movementX / 500;
                camera.rotation.x -= event.movementY / 500;
                camera.rotation.x = this.clamp(camera.rotation.x, -Math.PI/2, Math.PI/2)
            }
        }, false );
    }
    
    playerCollisions() {
        const result = this.worldOctree.capsuleIntersect( this.playerCollider );
        this.playerOnFloor = false;
        if ( result ) {
            this.playerOnFloor = result.normal.y > 0;
            if ( ! this.playerOnFloor ) {
                // this is what happens if we hit the ceiling
                //this.playerVelocity.addScaledVector( result.normal, - result.normal.dot( this.playerVelocity ) );
            }
            this.playerCollider.translate( result.normal.multiplyScalar( result.depth ) );
        }

        // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX JUMP PADS
        if( this.jumpPadsOctree ) {
            const result2 = this.jumpPadsOctree.capsuleIntersect( this.playerCollider );
            if ( result2 ) {
                console.log( targets[result2.name] )
                var [x,z,y] = targets[result2.name].split(" ");
                var vel = AimAtTarget(this.playerCollider.end, new Vector3(x, y, z).multiplyScalar(QuakeScale), GRAVITY);
                this.playerVelocity.copy(vel);
            }
        }
        // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    }

    update( deltaTime ) {
        if ( this.playerOnFloor ) {
            this.GroundMove(deltaTime);
        } else {
            this.AirMove(deltaTime);
            //this.playerVelocity.y = - GRAVITY * deltaTime;
        }
        this.playerCollider.translate( this.playerVelocity );
        this.playerCollisions();
        this.camera.position.copy( this.playerCollider.end );
        document.getElementById("info").innerText = "" + this.playerVelocity.y;
    }
    
    AirMove(deltaTime) {
        var accel;
        this.wishdir.normalize()
        var wishspeed = this.wishdir.length()
        wishspeed *= moveSpeed

        if (this.playerVelocity.dot(this.wishdir) < 0)
            accel = airDeacceleration;
        else
            accel = airAcceleration;
        
        this.Accelerate(this.wishdir, wishspeed, accel, deltaTime); //  accel
        
        this.playerVelocity.y -= GRAVITY * deltaTime
    }

    GroundMove(deltaTime) {
        // Do not apply friction if the player is queueing up the next jump
        if(!this.wishJump)
            this.ApplyFriction(1, deltaTime);
        else
            this.ApplyFriction(0, deltaTime);

        this.wishdir.normalize();
        var wishspeed = this.wishdir.length();
        wishspeed *= moveSpeed;
        this.wishdir.normalize();

        this.Accelerate(this.wishdir, wishspeed, runAcceleration, deltaTime);

        // Reset the gravity velocity
        
        // But this breaks with playerCollisions() since that function moves us up a bit.
        // So we need some downwards movement each frame, so we stay on the floor?!
        // this.playerVelocity.y = 0; 
        
        if(this.wishJump) {
            this.playerVelocity.y = jumpSpeed*0.3;
            this.wishJump = false;
        }
    }

    /**
     * Calculates wish acceleration based on player's cmd wishes
     * @param {Vector3} wishdir
     * @param {number} wishspeed
     * @param {number} accel
     */
    Accelerate(wishdir, wishspeed, accel, deltaTime)
    {
        var currentspeed = this.playerVelocity.dot(wishdir);
        var addspeed = wishspeed - currentspeed;
        if(addspeed <= 0)
            return;
        var accelspeed = accel * deltaTime * wishspeed;
        if(accelspeed > addspeed)
            accelspeed = addspeed;

        this.playerVelocity.x += accelspeed * wishdir.x;
        this.playerVelocity.z += accelspeed * wishdir.z;
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
        }
        if ( this.keyStates[ 'KeyK' ] ) {
            this.playerCollider.copy(new Capsule( new Vector3( 0, 0.35, 0 ), new Vector3( 0, 2.13+0.35, 0 ), 0.35 ));
            this.playerCollider.translate(new Vector3( 11, 3, 11 ));
            this.playerVelocity = new Vector3();
        }
    }

    ApplyFriction(t, deltaTime) {
        var vec = this.playerVelocity.clone();
    
        vec.y = 0.0;
        var speed = vec.length();
        var drop = 0.0;
    
        if(this.playerOnFloor)
        {
            var control = (speed < runDeacceleration ? runDeacceleration : speed);
            drop = control * friction * deltaTime * t;
        }
    
        var newspeed = speed - drop;
        if(newspeed < 0)
            newspeed = 0;
        if(speed > 0)
            newspeed /= speed;
    
        this.playerVelocity.x *= newspeed;
        this.playerVelocity.z *= newspeed;
    }
}

export {Player};
