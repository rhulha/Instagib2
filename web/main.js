import {PerspectiveCamera, Vector3, Clock, Scene} from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { CustomOctree } from './CustomOctree.js';
import { setupScene, setupRenderer, setupResizeListener, setupModelAnimations } from './setup.js';
import { Player } from './ThreePlayer.js';
import { getTriggerOctree } from './trigger.js';
import webSocket from './webSocket.js';
import Stats from './three/examples/jsm/libs/stats.module.js';
import { getLine, explosion, gib_audio } from './railgun.js';

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
container.appendChild( stats.domElement );

const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';
const renderer = setupRenderer();
/**
 * @type {Scene}
 */
const scene = setupScene(renderer);
setupResizeListener( camera, renderer);

const jumpPadsOctree = getTriggerOctree(scene);
const worldOctree = new CustomOctree();
var player = new Player(worldOctree, jumpPadsOctree, camera, scene);

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

webSocket.line = function(msg) {
	var start = new Vector3().copy(msg.start);
	var end = new Vector3().copy(msg.end);
	scene.add(getLine(scene, start, end));
}

webSocket.hit = function(msg) {
	var pos = new Vector3().copy(msg.pos);
	scene.add(explosion(scene, pos, scene.clock.getElapsedTime()));
    gib_audio.play();
}

document.addEventListener("keydown", (event)=>{
    if (event.key === "Enter") {
		webSocket.send({cmd: "sendTestData"});
    }
})

function animate() {
	var deltaTime = Math.min( 0.1, scene.clock.getDelta() );
	player.controls( deltaTime );
	player.update( deltaTime );
	soldier_mixer.update( scene.clock.getDelta() );
	renderer.render( scene, camera );
	stats.update();
	webSocket.send({cmd: "pos", pos: player.getPosAsString(), rot: player.getRotationAsString()});
	requestAnimationFrame( animate );
	scene.traverse((obj)=>{
		if( obj.update ) {
			obj.update.call(obj, scene, deltaTime, scene.clock.getElapsedTime());
		}
	});
	if(scene.remove_me && scene.remove_me.length>0) {
		for(var i=0; i<scene.remove_me.length; i++) {
			scene.remove(scene.remove_me[i]);
			if(scene.remove_me[i].geometry)
				scene.remove_me[i].geometry.dispose();
		}
		scene.remove_me.length=0;
	}
}

