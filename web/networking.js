// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import {Vector3, MathUtils} from './three/build/three.module.js';
import { AnimationMixer } from './three/build/three.module.js';
import {soldierSingleton} from './soldier.js';
import {SkeletonUtils} from './three/examples/jsm/utils/SkeletonUtils.js';
import webSocket from './lib/webSocket.js';
import {getLine, explosion} from './railgun.js';
import game from './setup.js';
import scene from './scene.js';

var enemies = {};
var this_player_id;

class Enemy {
	constructor(id, name, room) {
		this.id = id;
		this.name = name;
		this.room = room;
		this.obj3d = SkeletonUtils.clone(soldierSingleton.glb.scene.children[0]);
		this.obj3d.traverse( ( obj ) => {
			if ( obj.isMesh ) {
			  obj.material.color.r=1;
              obj.material.color.b=0.4;
              obj.material.color.g=0.4;
			}
		});
		this.p = this.obj3d.position;
		this.r = this.obj3d.rotation;
		this.r.x=-Math.PI/2;
		this.r.y=0;
		//this.r.z=Math.PI;
		this.r.order = 'YXZ'
		/*this.soldier.traverse((obj) => {
			if (obj.type === 'Object3D') {
				obj.scale.set(0.017, 0.017, 0.017);
				obj.updateMatrix();
				console.log("scale");
			}
		});*/
		//this.soldier.scale.set(0.017, 0.017, 0.017);
		//this.soldier.updateMatrix();
		this.mixer = new AnimationMixer( this.obj3d );
		//this.mixer.timeScale = 1;
		var idleAction = this.mixer.clipAction( soldierSingleton.glb.animations[ 0 ] );
		var walkAction = this.mixer.clipAction( soldierSingleton.glb.animations[ 3 ] );
		var runAction = this.mixer.clipAction( soldierSingleton.glb.animations[ 1 ] );
		this.actions = [ idleAction, walkAction, runAction ];
		this.actions.forEach( function ( action ) {
			action.setEffectiveTimeScale(1);
			action.setEffectiveWeight(0);
			action.play();
		} );
		runAction.setEffectiveWeight(1);
	}
}

var packetCounter=0;
webSocket.packet = function(msg) {
	if(!soldierSingleton.ready)
		return;
	var playerWithMostKills;
	if( msg.this_player_id && msg.players && msg.players.length && msg.players.length < 128 ) {
		this_player_id = msg.this_player_id;
		//console.log("this_player_id: ", this_player_id);
		for( var player of msg.players) {
			if( !playerWithMostKills || playerWithMostKills.kills <= player.kills)
				playerWithMostKills = player;
			if( player.id !== this_player_id) {
				//console.log("enemies id: ", player.id);
				if (!enemies[player.id]) {
					console.log("creating new enemy: ", player.id, player.name);
					var e = new Enemy(player.id, player.name, player.room);
					enemies[player.id] = e;
					// e.soldier.glb is a GLTF object with animations, scenes and cameras.
					// e.soldier.glb.isObject3D is undefined 
					// e.soldier.glb.parent is undefined 
					// console.log("e.soldier.glb", e.soldier.glb);
					scene.add(e.obj3d)
				}
				var e = enemies[player.id];
				var normalizedSpeed = 0;
				player.y -= 0.35; // move model down a bit. Otherwise it looked like it was floating. Todo: Do this in a parent node instead...
				if( e.p.y < player.y ) {
					// player is flying upwards
				} else {
					e.p.y=player.y; // ignore movement in the up/down direction for the speed measurement.
					var speed = e.p.distanceTo(player);
					normalizedSpeed = MathUtils.clamp(speed/0.3, 0, 1);
				}
				//console.log(normalizedSpeed);
				e.actions[0].setEffectiveWeight(1-normalizedSpeed); // idle animation
				e.actions[2].setEffectiveWeight(normalizedSpeed); // run animation
				e.p.copy(player);
				//e.r.x=player.rx;
				e.r.z=player.ry;
			}
		}
		packetCounter++;
		if(packetCounter%60) {
			document.getElementById("topkills").innerText = "top score: "+ playerWithMostKills.name + " " + playerWithMostKills.kills;
			packetCounter=MathUtils.randInt(2,7); // don't set topkills every frame and randomize it a bit.
		}
	}
}

webSocket.rail = function(msg) {
	var start = new Vector3().copy(msg.start);
	var end = new Vector3().copy(msg.end);
	scene.add(getLine(scene, start, end)); // TODO: it looks like getLine does not alter start and end.
	game.audio.railgun_enemy.play();
}

webSocket.newCon = function(msg) {
	console.log(msg);
}

webSocket.disconnect = function(msg) {
	console.log(msg);
	var e = enemies[msg.id];
	if( e === undefined )
		console.log("enemy could not be found.")
	e.mixer.stopAllAction();
	if( scene.children.indexOf( e.obj3d ) == -1 )
		console.log("disconnected player model could not be found in scene.")
	scene.remove(e.obj3d); // TODO: clean up animations and geometry ?
	delete enemies[msg.id];
}

webSocket.hit = function(msg) {
	if( msg.id == this_player_id) {
		game.player.respawn();
		game.audio.gib.play();
	} else {
		var old = game.audio.gib.volume;
		game.audio.gib.volume = 0.1;
		game.audio.gib.play();
		game.audio.gib.volume = old;
	}
	scene.add(explosion(scene, msg.pos, scene.elapsed));
}

function sendCommand(command) {
	webSocket.send({cmd: command});
}

function sendPlayerPositionToServer() {
	if( webSocket.connection.readyState == 1) {
		webSocket.send({cmd: "pos", pos: game.player.getPos(), rot: game.player.getRotation()});
	}
}

export {enemies, Enemy, sendCommand, sendPlayerPositionToServer};
