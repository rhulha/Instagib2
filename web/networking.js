// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import {Vector3, MathUtils} from './three/build/three.module.js';
import {AnimationMixer} from './three/build/three.module.js';
import {soldierSingleton} from './soldier.js';
import {SkeletonUtils} from './three/examples/jsm/utils/SkeletonUtils.js';
import webSocket from './lib/webSocket.js';
import {getLine, explosion} from './railgun.js';
import game from './setup.js';
import scene from './scene.js';
import powerups from './powerups.js';
import {updateTopFragsCounter} from './hud.js';

/** @Type {Object.<string:Enemy>} */
var enemies = {};
var this_player_id;

function damp(source, target, smoothing, dt) {
	return MathUtils.lerp(source, target, 1 - Math.pow(smoothing, dt));
}

/**
 * @class Enemy
 * @property {string} id
 * @property {string} name
 * @property {string} color
 * @property {Object3D} objt3d
 * @property {Vector3} p
 * @property {Euler} r
 * @property {AnimationMixer} mixer
 */
class Enemy {
	constructor(id, name, room, color) {
		this.id = id;
		this.name = name.substring(0, 40).replace(/[^A-Za-z0-9]/g, '');
		//this.room = room.substring(0, 80).replace(/[^A-Za-z0-9]/g, '');
		if( color === undefined )
			color = 'yellow';
		this.color = color.substring(0, 30).replace(/[^A-Za-z0-9]/g, '');
		this.obj3d = SkeletonUtils.clone(soldierSingleton.glb.scene.children[0]);
		this.obj3d.traverse( ( obj ) => {
			if ( obj.isMesh ) {
			  obj.material = obj.material.clone();
			  obj.material.color.set(this.color);
			  obj.material.color.offsetHSL(0,0,0.1); // make the skins a bit brighter
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
	var playerWithMostFrags;
	if( msg.this_player_id && msg.players && msg.players.length && msg.players.length < 128 ) {
		this_player_id = msg.this_player_id;
		//console.log("this_player_id: ", this_player_id);
		for( var player of msg.players) {
			if( !playerWithMostFrags || playerWithMostFrags.frags <= player.frags)
				playerWithMostFrags = player;
			if( player.id !== this_player_id) {
				//console.log("enemies id: ", player.id);
				if (!enemies[player.id]) {
					console.log("creating new enemy: ", player.id, player.name, player.color);
					var e = new Enemy(player.id, player.name, player.room, player.color);
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
				var w = e.actions[0].getEffectiveWeight();
				w = damp(w, 1-w, 0.3, 16);
				e.actions[0].setEffectiveWeight(1-w); // idle animation
				e.actions[2].setEffectiveWeight(w); // run animation
				e.p.copy(player);
				//e.r.x=player.rx;
				e.r.z=player.ry;
			}
		}
		packetCounter++;
		if(packetCounter%60==0) {
			updateTopFragsCounter(playerWithMostFrags);
			packetCounter=MathUtils.randInt(2,7); // don't set topfrags every frame and randomize it a bit.
		}
	}
}

webSocket.rail = function(msg) {
	var start = new Vector3().copy(msg.start);
	var end = new Vector3().copy(msg.end);
	//console.log("msg.color", msg.color);
	scene.add(getLine(scene, start, end, msg.color)); // TODO: it looks like getLine does not alter start and end.
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

webSocket.powerup = function(msg) {
	if( msg.id != this_player_id) {
		var old = game.audio.powerup.volume;
		game.audio.powerup.volume = 0.3;
		game.audio.powerup.play();
		game.audio.powerup.volume = old;
		msg.name = msg.name.substring(0, 40).replace(/[^A-Za-z0-9@]/g, '');
		powerups[msg.name].hideStart=scene.elapsed;
		powerups[msg.name].visible=false;
	}
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
