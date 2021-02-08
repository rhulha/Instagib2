import {Vector3} from './three/build/three.module.js';
import {Game} from './setup.js';
import webSocket from './webSocket.js';
import {getLine, explosion} from './railgun.js';
import {soldier, Soldier, setupModelAnimations} from './soldier.js';
import {SkeletonUtils} from './three/examples/jsm/utils/SkeletonUtils.js';

const game = new Game();
game.loadMap(animate);

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
					game.scene.add(e.soldier.glb.scene)
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
	game.scene.add(getLine(scene, start, end));
}

webSocket.newCon = function(msg) {
	console.log(msg);
}

webSocket.hit = function(msg) {
	var pos = new Vector3().copy(msg.pos);
	game.scene.add(explosion(scene, pos, scene.clock.getElapsedTime()));
    game.audio.gib.play();
}

document.addEventListener("keydown", (event)=>{
    if (event.key === "Enter") {
		webSocket.send({cmd: "sendTestData"});
    }
})

function animate() {
	var deltaTime = Math.min( 0.1, game.clock.getDelta() );
	var elapsed = game.clock.getElapsedTime(); // warning, this call resets getDelta()
	game.scene.elapsed = elapsed;
	game.player.controls( deltaTime );
	game.player.update( deltaTime );

	for( var eid in enemies) {
		var e = enemies[eid];
		e.soldier.mixer.update( deltaTime );
		e.soldier.glb.scene.position.add(new Vector3(Math.random()*0.1, 0,0));
	}
	game.render();
	webSocket.send({cmd: "pos", pos: game.player.getPos(), rot: game.player.getRotation()});
	requestAnimationFrame( animate );
	game.scene.traverse((obj)=>{
		if( obj.update ) {
			obj.update.call(obj, game.scene, deltaTime, elapsed); 
		}
	});
	let rm = game.scene.remove_me;
	if(rm && rm.length>0) {
		for(var i=0; i<rm.length; i++) {
			game.scene.remove(rm[i]);
			if(rm[i].geometry)
				rm[i].geometry.dispose();
		}
		rm.length=0;
	}
}

