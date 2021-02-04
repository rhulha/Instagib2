import {PerspectiveCamera, Clock, Scene, AnimationMixer} from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { CustomOctree } from './CustomOctree.js';
import { setupScene, setupRenderer, setupResizeListener } from './setup.js';
import { Player } from './ThreePlayer.js';
import { getTriggerOctree } from './trigger.js';
import webSocket from './webSocket.js';

const clock = new Clock();
const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';
/**
 * @type {Scene}
 */
const renderer = setupRenderer();
const scene = setupScene(camera, renderer);
setupResizeListener( camera, renderer);

const jumpPadsOctree = getTriggerOctree(scene);
const worldOctree = new CustomOctree();
var player = new Player(worldOctree, jumpPadsOctree, camera, clock, scene);

var soldier;
var soldier_obj3d;
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
	idleAction.setEffectiveWeight( 0 );
	walkAction.setEffectiveWeight( 0 );
	runAction.setEffectiveWeight( 1 );
	runAction.setEffectiveTimeScale( 31 );

}

const loader = new GLTFLoader().setPath( './models/' );
loader.load( 'soldier.glb', function ( soldier_glb ) {
	soldier=soldier_glb;
	soldier.scene.rotation.order = 'YXZ'
	soldier.scene.traverse( ( obj ) => {
		if ( obj.type === 'Object3D' ) {
			soldier_obj3d=obj;
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

webSocket.pos = function(msg) {
	document.getElementById("info").innerText = "pos: "+ msg.pos;
	var [x,y,z] = msg.pos.split(",");
	var [rx,ry] = msg.rot.split(",");
	soldier.scene.position.set(x,y,z);
	soldier.scene.rotation.x = rx;
	soldier.scene.rotation.y = ry;
	//soldier.scene.onRotationChange();
	//soldier_obj3d.updateMatrix();
}

function log(str) {
	$("#log").prepend($("<span>"+str+"</span></br>"))
}

setTimeout(function() {
	//soldier.scene.position.set(5,5,5);
	//soldier.scene.updateMatrix();
}, 3000);

function animate() {
	var deltaTime = Math.min( 0.1, clock.getDelta() );
	player.controls( deltaTime );
	player.update( deltaTime );
	soldier_mixer.update( clock.getDelta() );
	renderer.render( scene, camera );
	//console.log({pos: player.getPosAsString()})
	webSocket.send({cmd: "pos", pos: player.getPosAsString(), rot: player.getRotationAsString()});
	requestAnimationFrame( animate );
}

