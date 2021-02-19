// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import {MathUtils, Color} from './three/build/three.module.js';
import {AnimationMixer} from './three/build/three.module.js';
import {soldierSingleton} from './soldier.js';
import {SkeletonUtils} from './three/examples/jsm/utils/SkeletonUtils.js';
import webSocket from './lib/webSocket.js';
import {explosion} from './railgun.js';
import { addRailToScene } from './rail.js';
import game from './setup.js';
import scene from './scene.js';
import powerups from './powerups.js';
import * as hud from './hud.js';
import {audioHolder} from './audio.js';

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
 * @property {number} frags
 * @property {string} color
 * @property {Object3D} objt3d
 * @property {Vector3} p
 * @property {Euler} r
 * @property {AnimationMixer} mixer
 */
class Enemy {
	constructor(id, name, color) {
		this.id = id;
		this.name = name.substring(0, 40).replace(/[^A-Za-z0-9]/g, '');
		if( color === undefined )
			color = 'yellow';
		this.color = color.substring(0, 30).replace(/[^A-Za-z0-9]/g, '');
		this.obj3d = SkeletonUtils.clone(soldierSingleton.glb.scene.children[0]);
		this.obj3d.traverse( ( obj ) => {
			if ( obj.isMesh ) {
			  obj.material = obj.material.clone();
			  if( Color.NAMES[this.color])
			  	obj.material.color.set(this.color);
			  else
			    obj.material.color.set(parseInt(this.color,16));
			  obj.material.color.offsetHSL(0,0,0.1); // make the skins a bit brighter
			}
		});
		this.p = this.obj3d.position;
		this.r = this.obj3d.rotation;
		this.r.x=-Math.PI/2;
		this.r.y=0;
		this.r.order = 'YXZ'
		this.mixer = new AnimationMixer( this.obj3d );
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
					var e = new Enemy(player.id, player.name, player.color);
					enemies[player.id] = e;
					scene.add(e.obj3d)
				}
				var e = enemies[player.id];
				player.y -= 0.35; // move model down a bit. Otherwise it looked like it was floating. Todo: Do this in a parent node instead...
				e.actions[0].setEffectiveWeight(player.run?0:1); // idle animation
				e.actions[2].setEffectiveWeight(player.run?1:0); // run animation
				e.p.copy(player);
				//e.r.x=player.rx; // this can be used to lean the model. I don't like it.
				e.r.z=player.ry; // we have to rotate the model around z because we rotated him upwards, because the model is lying on its back per default.
				e.frags = player.frags;
			}
		}
		packetCounter++;
		if(packetCounter%60==0) {
			if( msg.room == "RoomIsFull") {
				hud.updateInfoText("THE ROOM YOU HAVE CHOSEN IS ALREADY FULL, YOU ARE NOW IN A ROOM CALLED RoomIsFull INSTEAD!");
			}
			hud.updateTopFragsCounter(playerWithMostFrags);
			packetCounter=MathUtils.randInt(2,7); // don't set topfrags every frame and randomize it a bit.
		}
	}
}

webSocket.rail = function(msg) {
	//console.log("rail", msg);
	addRailToScene(scene, msg.start, msg.end, msg.color);
	audioHolder.railgun_enemy.play();
}

webSocket.disconnect = function(msg) {
	console.log("disconnected: ", msg.id);
	var e = enemies[msg.id];
	if( e === undefined ) {
		console.log("enemy could not be found.")
	} else {
		e.mixer.stopAllAction();
		if( scene.children.indexOf( e.obj3d ) == -1 )
			console.log("disconnected player model could not be found in scene.")
		scene.remove(e.obj3d); // TODO: clean up animations and geometry ?
		delete enemies[msg.id];
	}
}

webSocket.respawn = function(msg) {
	if( msg.id != this_player_id) {
		if( !enemies[msg.id] )
			return;
		enemies[msg.id].obj3d.visible=true;
	}
}

webSocket.hit = function(msg) {
	if( msg.id == this_player_id) {
		hud.updateInfoText("Fragged by " + enemies[msg.source_id].name);
		game.player.dead=true;
		game.player.timeOfDeath=scene.elapsed;
		document.getElementById("gun").style.visibility='hidden';
		audioHolder.gib.play();
	} else {
		enemies[msg.id].obj3d.visible=false;
		audioHolder.play("gib", 0.1);
	}
	scene.add(explosion(scene, msg.pos, scene.elapsed));
}

webSocket.powerup = function(msg) {
	if( msg.id != this_player_id) {
		audioHolder.play("powerup", 0.3);
		msg.name = msg.name.substring(0, 40).replace(/[^A-Za-z0-9@]/g, '');
		powerups[msg.name].hideStart=scene.elapsed;
		powerups[msg.name].visible=false;
	}
}

function sendCommand(command) {
	if (typeof command === 'string' || command instanceof String)
		webSocket.send({cmd: command});
	else
		webSocket.send(command);
}

function sendPlayerPositionToServer() {
	if( webSocket.connection.readyState == 1) {
		webSocket.send({cmd: "pos", pos: game.player.getPos(), rot: game.player.getRotation(), run: game.player.playerOnFloor && (game.player.wishdir.lengthSq>0)});
	}
}

export {enemies, Enemy, sendCommand, sendPlayerPositionToServer};
