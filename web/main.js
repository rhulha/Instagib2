import {PerspectiveCamera, Clock, Scene, AnimationMixer} from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { CustomOctree } from './CustomOctree.js';
import { setupScene, setupRenderer, setupResizeListener } from './setup.js';
import { Player } from './ThreePlayer.js';
import { getTriggerOctree } from './trigger.js';

const clock = new Clock();
const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';
/**
 * @type {Scene}
 */
const scene = setupScene(camera);
const renderer = setupRenderer();
setupResizeListener( camera, renderer);

const jumpPadsOctree = getTriggerOctree(scene);
const worldOctree = new CustomOctree();
var player = new Player(worldOctree, jumpPadsOctree, camera, clock);

var soldier;
var soldier_actions;
var soldier_mixer;

function setupModelAnimations(){ 
	soldier_mixer = new AnimationMixer( soldier.scene );
	soldier_mixer.timeScale = 11.0;
	var idleAction = soldier_mixer.clipAction( soldier.animations[ 0 ] );
	var walkAction = soldier_mixer.clipAction( soldier.animations[ 3 ] );
	var runAction = soldier_mixer.clipAction( soldier.animations[ 1 ] );
	soldier_actions = [ idleAction, walkAction, runAction ];
	soldier_actions.forEach( function ( action ) {
		action.play();
	} );
	idleAction.setEffectiveTimeScale( 31 );
	idleAction.setEffectiveWeight( 1 );
	walkAction.setEffectiveWeight( 0 );
	runAction.setEffectiveWeight( 0 );

}

const loader = new GLTFLoader().setPath( './models/' );
loader.load( 'soldier.glb', function ( soldier_glb ) {
	soldier=soldier_glb;
	soldier.scene.traverse( ( obj ) => {
		if ( obj.type === 'Object3D' ) {
			obj.scale.set(0.017,0.017,0.017);
		}
	});
	setupModelAnimations();
	scene.add( soldier_glb.scene );
	loader.load( 'q3dm17.gltf', ( gltf ) => {
		scene.add( gltf.scene );
		worldOctree.fromGraphNode( gltf.scene );
		gltf.scene.traverse( child => {
			if ( child.isMesh ) {
				child.castShadow = true;
				child.receiveShadow = true;
				if ( child.material.map ) {
					child.material.map.anisotropy = 8;
				}
			}
		} );
		animate();
	})
});

//setTimeout(, 3000);

function animate() {
	var deltaTime = Math.min( 0.1, clock.getDelta() );
	player.controls( deltaTime );
	player.update( deltaTime );
	soldier_mixer.update( clock.getDelta() );
	renderer.render( scene, camera );
	requestAnimationFrame( animate );
}

