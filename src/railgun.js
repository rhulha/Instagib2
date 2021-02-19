// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import { Vector3, Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, TextureLoader, Raycaster } from './three/build/three.module.js';
import webSocket from './lib/webSocket.js';
import {enemies, Enemy} from './networking.js';
import game from './setup.js';
import { addRailToScene } from './rail.js';
import camera from './camera.js';
import {updateFragsCounter} from './hud.js';
import * as hud from './hud.js';
import {audioHolder} from './audio.js';

const sprite = new TextureLoader().load( 'images/disc.png' );
const material = new PointsMaterial( { size: 1,  color: "darkred", map: sprite, alphaTest: 0.5, transparent: true });
const count = 200;
const speed = 10;

/**
* @param {Vector3} pos
*/
function explosion(scene, pos, elapsedTime)
{
    const dirs = [];
    const vertices = [];
    for ( let i = 0; i < count; i ++ ) {
        vertices.push( pos.x, pos.y, pos.z );
        dirs.push(new Vector3((Math.random() * speed)-(speed/2),(Math.random() * speed*2)-(speed/2),(Math.random() * speed)-(speed/2)));
    }

    var geometry = new BufferGeometry();
    geometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
    var particles = new Points( geometry, material );
    
    particles.time = elapsedTime;

    particles.update = function(scene, delta, elapsed) {
        if(this.time + 1.5 < elapsed) {
            if(!scene.remove_me)
                scene.remove_me=[];
            scene.remove_me.push(this);
        }
        //var pos = geometry.getAttribute('position');
        var pos = particles.geometry.attributes.position.array
        for ( let i = 0; i < count*3; i+=3 ) {
            pos[i]+=dirs[i/3].x*delta;
            pos[i+1]+=dirs[i/3].y*delta;
            pos[i+2]+=dirs[i/3].z*delta;
            dirs[i/3].y-=30*delta; // gravity.
        }
        //geometry.verticesNeedUpdate = true;
        geometry.attributes.position.needsUpdate = true;
    };
    
    return particles;
}

function getLinePositionsFromPlayer(player) {
    var start = new Vector3();
    var end = new Vector3();
    camera.getWorldDirection( player.playerDirection );
    start.copy( player.playerCollider.end );
    end.copy( player.playerCollider.end );
    end.addScaledVector( player.playerDirection, 100 );
    return [start, end];
}

var railgunLastShotTime=0;

function shoot(scene, player) {
    if(railgunLastShotTime + 1.492 >= elapsed)
        return;
    audioHolder.railgun.stop();
    audioHolder.railgun.play();
    var [start, end] = getLinePositionsFromPlayer(player);
    //console.log("player.color", player.color);
    addRailToScene(scene, start, end, player.color);

    // var dir = player.playerDirection;
    // webSocket.send({cmd: "rail", origin: {x: start.x, y: start.y, z: start.z}, dir: {x: dir.x, y: dir.y, z: dir.z}});
    webSocket.send({cmd: "rail", start: {x: start.x, y: start.y, z: start.z}, end: {x: end.x, y: end.y, z: end.z}});

    const raycaster = new Raycaster(start, player.playerDirection); // player.playerDirection is set by getLinePositionsFromPlayer above.
    //console.log( scene.getObjectByName("level") )
    var result = raycaster.intersectObject(scene.getObjectByName("level"));
    
    if( result && result.length > 0 && result[0].distance < 3) {
        game.player.playerVelocity.y = 27.2; // railjump :-)
    }

    for( var enemy_id in enemies) {
        // TODO: check if we hit level first...
        /** @type {Enemy} */
        var enemy = enemies[enemy_id];
        if( !enemy.obj3d.visible )
            continue;

        if(raycaster.intersectObject(enemy.obj3d, true ).length > 0) {
            enemy.obj3d.getWorldPosition(player.enemyPosTemp);
            player.enemyPosTemp.y+=1.8; // make the explosion a bit higher than the enemy player feet position.

            enemy.obj3d.visible=false;
            webSocket.send({cmd: "hit", pos: {x: player.enemyPosTemp.x, y: player.enemyPosTemp.y, z: player.enemyPosTemp.z}, id: enemy_id});
            scene.add(explosion(scene, player.enemyPosTemp, scene.elapsed));

            hud.updateInfoText("You fragged " + enemy.name)

            game.player.frags++;
            updateFragsCounter();
            audioHolder.gib.play();
        }

    }
}

export {shoot, explosion, addRailToScene};

