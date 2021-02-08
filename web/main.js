import {Vector3} from './three/build/three.module.js';
import webSocket from './lib/webSocket.js';
import {enemies} from './networking.js';
import {game} from './setup.js';

game.loadMap(animate);

function animate() {
	var deltaTime = Math.min( 0.1, game.clock.getDelta() );
	var elapsed = game.clock.getElapsedTime(); // warning, this call resets getDelta()
	game.scene.elapsed = elapsed;
	game.player.controls( deltaTime );
	game.player.update( deltaTime );

	for( var eid in enemies) {
		var e = enemies[eid];
		e.soldier.mixer.update( deltaTime );
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

