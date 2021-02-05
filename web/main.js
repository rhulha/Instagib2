import {PerspectiveCamera, Clock, Scene} from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { CustomOctree } from './CustomOctree.js';
import { setupScene, setupRenderer, setupResizeListener, setupModelAnimations } from './setup.js';
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
	[soldier_mixer, soldier_actions] = setupModelAnimations(soldier);
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
	});
});

webSocket.pos = function(msg) {
	//document.getElementById("info").innerText = "pos: "+ msg.pos;
	var [x,y,z] = msg.pos.split(",");
	var [rx,ry] = msg.rot.split(",");
	soldier.scene.position.set(x,y,z);
	soldier.scene.rotation.x = rx;
	soldier.scene.rotation.y = ry;
}

// remove rail trails
setInterval(function() {
	for ( var i = 0; i < scene.children.length; i++ ) {
		var obj = scene.children[i]
		if ( obj && (obj.type === 'Line' || obj.type === 'Points') ) {
			if(obj.time + 1.5 < clock.getElapsedTime()) {
				scene.remove(obj);
				i--;
				obj.geometry.dispose();
				//console.log("removed line.")
			}
		}
	}
}, 1000);

function animate() {
	var deltaTime = Math.min( 0.1, clock.getDelta() );
	player.controls( deltaTime );
	player.update( deltaTime );
	soldier_mixer.update( clock.getDelta() );
	renderer.render( scene, camera );
	webSocket.send({cmd: "pos", pos: player.getPosAsString(), rot: player.getRotationAsString()});
	requestAnimationFrame( animate );
	scene.traverse((obj)=>{
		if( obj.update ) {
			obj.update(deltaTime);
		}
	})
}

