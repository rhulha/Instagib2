import { Vector3, Camera, Clock } from './three/build/three.module.js';
import { Capsule } from './three/examples/jsm/math/Capsule.js';
import { Octree } from './three/examples/jsm/math/Octree.js';
import { targets } from './trigger.js';

const GRAVITY = 20;
const QuakeScale = 0.038;
const moveSpeed = 7.0/3;  // Ground move speed
const runAcceleration = 14;   // Ground accel
const runDeacceleration = 10;   // Deacceleration that occurs when running on the ground
const airAcceleration = 2.0;   // Ground accel
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
    result_normal_y;
    got_result;

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
        this.playerCollider.translate(new Vector3( 0, 11, 0 ))
        document.addEventListener( 'keydown', ( event ) => this.keyStates[ event.code ] = true, false );
        document.addEventListener( 'keyup', ( event ) => this.keyStates[ event.code ] = false, false );
        document.addEventListener( 'mousedown', () => document.body.requestPointerLock(), false );

        document.body.addEventListener( 'mousemove', ( event ) => {
            if ( document.pointerLockElement === document.body ) {
                camera.rotation.y -= event.movementX / 500;
                camera.rotation.x -= event.movementY / 500;
                if(camera.rotation.x < -Math.PI/2)
                    camera.rotation.x = -Math.PI/2;
                else if(camera.rotation.x > Math.PI/2)
                    camera.rotation.x = Math.PI/2;
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
        var gravity = GRAVITY*QuakeScale;
        var time = Math.sqrt(height / (0.5 * gravity));
        // set s.origin2 to the push velocity
        var origin2 = target.clone();
        origin2.sub(origin);
        origin2.y = 0.0;
        var dist = origin2.length();
        origin2.normalize();
    
        var forward = dist / time;
        origin2.multiplyScalar(forward);
        origin2.y = time * gravity*2;
        return origin2;
    }
    
    playerCollisions() {
        const result = this.worldOctree.capsuleIntersect( this.playerCollider );
        this.playerOnFloor = false;
        if ( result ) {
            this.got_result=true;
            this.result_normal_y=result.normal.y;
            this.playerOnFloor = result.normal.y > 0;
            if ( ! this.playerOnFloor ) {
                // this is what happens if we hit the ceiling
                this.playerVelocity.addScaledVector( result.normal, - result.normal.dot( this.playerVelocity ) );
            }
            this.playerCollider.translate( result.normal.multiplyScalar( result.depth ) );
        } else {
            this.got_result=false;
        }
 
        if( this.playerOnFloor)
            document.getElementById("info").innerText = "got_result: "+ this.got_result;
            //document.getElementById("info").innerText = "result_normal_y: "+ this.result_normal_y;
        else
            document.getElementById("info").innerText = "got_result: "+ this.got_result;

        // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX JUMP PADS
        if( this.jumpPadsOctree ) {
            const result2 = this.jumpPadsOctree.capsuleIntersect( this.playerCollider );
            if ( result2 ) {
                console.log( targets[result2.name] )
                var [x,z,y] = targets[result2.name].split(" ");
                var vel = this.AimAtTarget(this.playerCollider.end, new Vector3(x, y, z).multiplyScalar(QuakeScale));
                this.playerVelocity.copy(vel);
            }
        }
        // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
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

    GroundMove(deltaTime) {
        // Do not apply friction if the player is queueing up the next jump
        if(!this.wishJump)
            this.ApplyFriction(1, deltaTime);
        else
            this.ApplyFriction(0, deltaTime);

        this.wishdir.normalize();
        var wishspeed = this.wishdir.length();
        //if( wishspeed > 0)
        if( this.playerOnFloor)
            document.getElementById("info").innerText = "result_normal_y: "+ this.result_normal_y;
        else
            document.getElementById("info").innerText = "playerOnFloor: "+ this.playerOnFloor;
        wishspeed *= moveSpeed;
        this.wishdir.normalize();

        this.Accelerate(this.wishdir, wishspeed, runAcceleration, deltaTime);

        // Reset the gravity velocity
        
        // But this breaks with playerCollisions() since that function moves us up a bit.
        // So we need some downwards movement each frame, so we stay on the floor?!
        // this.playerVelocity.y = 0; 
        
        if(this.wishJump) {
            this.playerVelocity.y = jumpSpeed;
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

    update( deltaTime ) {
        if ( this.playerOnFloor ) {
            this.GroundMove(deltaTime);
        } else {
            this.playerVelocity.y = - GRAVITY * deltaTime;
        }
        this.playerCollider.translate( this.playerVelocity );
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
            this.wishJump=true;
        }
        if ( this.keyStates[ 'KeyK' ] ) {
            this.playerCollider.copy(new Capsule( new Vector3( 0, 0.35, 0 ), new Vector3( 0, 2.13+0.35, 0 ), 0.35 ));
            this.playerCollider.translate(new Vector3( 0, 11, 0 ));
            this.playerVelocity = new Vector3();
        }
    }
}

export {Player};
