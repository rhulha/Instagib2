import {PerspectiveCamera, Vector3, Clock, Scene} from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { CustomOctree } from './CustomOctree.js';
import { setupScene, setupRenderer, setupResizeListener } from './setup.js';
import { Player } from './Player.js';
import { getTriggerOctree } from './trigger.js';
import webSocket from './webSocket.js';
import Stats from './three/examples/jsm/libs/stats.module.js';
import { getLine, explosion } from './railgun.js';
import audio from './audio.js';
import {soldier, Soldier, setupModelAnimations} from './soldier.js';
import {SkeletonUtils} from './three/examples/jsm/utils/SkeletonUtils.js';

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

//	scene.add( soldier_glb.scene );

const loader = new GLTFLoader().setPath( './models/' );
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

class Enemy {
	constructor(id, name, room) {
		this.id = id;
		this.name = name;
		this.room = room;
		this.x = 0;
		this.y = 0;
		this.z = 0;
		this.rx = 0;
		this.ry = 0;
		this.soldier = new Soldier();
		this.soldier.glb = soldier.glb;
		this.soldier.glb.scene = SkeletonUtils.clone(soldier.glb.scene);
		 
		/*this.soldier.traverse((obj) => {
			if (obj.type === 'Object3D') {
				obj.scale.set(0.017, 0.017, 0.017);
				obj.updateMatrix();
				console.log("scale");
			}
		});*/
		//this.soldier.scale.set(0.017, 0.017, 0.017);
		//this.soldier.updateMatrix();
		setupModelAnimations(this.soldier);
	}
}

var enemies = {};

webSocket.packet = function(msg) {
	if(!soldier.ready)
		return;
	if( msg.this_player_id && msg.players && msg.players.length && msg.players.length < 128 ) {
		var this_player_id = msg.this_player_id;
		//console.log("this_player_id: ", this_player_id);
		for( var player of msg.players) {
			if( player.id !== this_player_id) {
				//console.log("enemies id: ", player.id);
				if (!enemies[player.id]) {
					console.log("creating new enemy: ", player.id);
					var e = new Enemy(player.id, player.name, player.room);
					enemies[player.id] = e;
					scene.add(e.soldier.glb.scene)
				}
				var e = enemies[player.id];
				e.x=player.x;
				e.y=player.y;
				e.z=player.z;
				e.rx=player.rx;
				e.ry=player.ry;
			}
		}
	}
	//document.getElementById("info").innerText = "pos: "+ msg.pos;
	//soldier.scene.position.set(x,y,z);
	//soldier.scene.rotation.x = rx;
	//soldier.scene.rotation.y = ry;
}

webSocket.line = function(msg) {
	var start = new Vector3().copy(msg.start);
	var end = new Vector3().copy(msg.end);
	scene.add(getLine(scene, start, end));
}

webSocket.newCon = function(msg) {
	console.log(msg);
}

webSocket.hit = function(msg) {
	var pos = new Vector3().copy(msg.pos);
	scene.add(explosion(scene, pos, scene.clock.getElapsedTime()));
    audio.gib.play();
}

document.addEventListener("keydown", (event)=>{
    if (event.key === "Enter") {
		webSocket.send({cmd: "sendTestData"});
    }
})

const clock = new Clock();
function animate() {
	var deltaTime = Math.min( 0.1, clock.getDelta() );
	var elapsed = clock.getElapsedTime(); // warning, this call resets getDelta()
	scene.elapsed = elapsed;
	player.controls( deltaTime );
	player.update( deltaTime );

	for( var eid in enemies) {
		var e = enemies[eid];
		e.soldier.mixer.update( deltaTime );
		e.soldier.glb.scene.position.add(new Vector3(Math.random()*0.1, 0,0));
	}
	
	renderer.render( scene, camera );
	stats.update();
	webSocket.send({cmd: "pos", pos: player.getPos(), rot: player.getRotation()});
	requestAnimationFrame( animate );
	scene.traverse((obj)=>{
		if( obj.update ) {
			obj.update.call(obj, scene, deltaTime, elapsed); 
		}
	});
	let rm = scene.remove_me;
	if(rm && rm.length>0) {
		for(var i=0; i<rm.length; i++) {
			scene.remove(rm[i]);
			if(rm[i].geometry)
				rm[i].geometry.dispose();
		}
		rm.length=0;
	}
}

