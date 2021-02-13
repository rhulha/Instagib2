// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import {Clock} from './three/build/three.module.js';
import webSocket from './lib/webSocket.js';
import {enemies} from './networking.js';
import game from './setup.js';
import scene from './scene.js';

game.loadMap(animate);

// make sure no one else has access to this clock, so we don't get accidential getElapsedTime() calls.
// Because they reset the getDelta and lead to crazy bugs.
const clock = new Clock();

function animate() {
	var deltaTime = Math.min( 0.1, clock.getDelta() );
	var elapsed = clock.getElapsedTime(); // warning, this call resets getDelta()
	scene.elapsed = elapsed;
	game.player.controls( deltaTime );
	game.player.update( deltaTime );

	for( var eid in enemies) {
		var e = enemies[eid];
		e.soldier.mixer.update( deltaTime );
	}
	game.render();
	if( webSocket.connection.readyState == 1) {
		webSocket.send({cmd: "pos", pos: game.player.getPos(), rot: game.player.getRotation()});
	}
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

