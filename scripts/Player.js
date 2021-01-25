import { Capsule } from './Capsule.js';
import {WebGLRenderer, PerspectiveCamera, Scene, BoxGeometry, Mesh, MeshNormalMaterial,
	Color, AmbientLight, Clock, Vector3, DirectionalLight} from './three.module.js';

const GRAVITY = 30;

class Player {

    playerCollider = new Capsule( new Vector3( 0, 0.35, 0 ), new Vector3( 0, 1, 0 ), 0.35 );
    playerVelocity = new Vector3();
    playerDirection = new Vector3();
    playerOnFloor = false;
    keyStates = {};

    constructor(worldOctree, camera) {
        this.worldOctree = worldOctree;
        this.camera = camera;
        this.playerCollider.translate(new Vector3( 0, 11, 0 ))
        document.addEventListener( 'keydown', ( event ) => this.keyStates[ event.code ] = true, false );
        document.addEventListener( 'keyup', ( event ) => this.keyStates[ event.code ] = false, false );
        document.addEventListener( 'mousedown', () => document.body.requestPointerLock(), false );
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
                this.playerVelocity.y = 15;
            }
        }
    }
    }

export {Player};
