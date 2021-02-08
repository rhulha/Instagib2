import {soldier, Soldier, setupModelAnimations} from './soldier.js';
import {SkeletonUtils} from './three/examples/jsm/utils/SkeletonUtils.js';
import webSocket from './lib/webSocket.js';
import {getLine, explosion} from './railgun.js';
import {game} from './setup.js';

var enemies = {};

class Enemy {
	constructor(id, name, room) {
		this.id = id;
		this.name = name;
		this.room = room;
		this.soldier = new Soldier();
		this.soldier.glb = soldier.glb;
		this.soldier.glb.scene = SkeletonUtils.clone(soldier.glb.scene);
		this.p = this.soldier.glb.scene.position;
		this.r = this.soldier.glb.scene.rotation;
		 
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
				e.p.set(player.x,player.y,player.z);
				e.r.x=player.rx;
				e.r.y=player.ry;
				document.getElementById("info").innerText = "pos: "+ e.p.x;
			}
		}
	}
}

webSocket.rail = function(msg) {
	var start = new Vector3().copy(msg.start);
	var end = new Vector3().copy(msg.end);
	game.scene.add(getLine(game.scene, start, end));
}

webSocket.newCon = function(msg) {
	console.log(msg);
}

webSocket.hit = function(msg) {
	game.scene.add(explosion(game.scene, msg.pos, game.scene.clock.getElapsedTime()));
    game.audio.gib.play();
}

document.addEventListener("keydown", (event)=>{
    if (event.key === "Enter") {
		webSocket.send({cmd: "sendTestData"});
    }
})

export {enemies};
