// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html

import { Vector3, Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, MeshLambertMaterial, MeshBasicMaterial, TubeGeometry, Curve, Mesh,
    LineBasicMaterial, TextureLoader, Raycaster, Line } from './three/build/three.module.js';
import webSocket from './lib/webSocket.js';
import {enemies, Enemy} from './networking.js';

const lineMaterial = new LineBasicMaterial( { color: 0x0000ff, linewidth: 10 } );
const helixMaterial = new MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );

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

function delayedRemove(scene, delta, elapsed) {
    if(this.time + 1.5 < elapsed) {
        if(!scene.remove_me)
            scene.remove_me=[];
        scene.remove_me.push(this);
    }
}

class HelixCurve extends Curve {
    constructor() {super();}

    getPoint(t, optionalTarget ) {
        var point = optionalTarget || new Vector3();
        var a = 0.2; // radius
        var b = 125; // length
        var t2 = 2 * Math.PI * t * b / 3;
        var x = Math.cos( t2 ) * a;
        var y = Math.sin( t2 ) * a;
        var z = b * t;
        return point.set( x, y, z );
    }
}

function getLine(scene, start, end) {
    const points = [];
    points.push( start );
    points.push( end );
    
    var helix = new HelixCurve();
    var helixGeometry = new TubeGeometry( helix, 300, 0.1, 12, false );
    var helixMesh = new Mesh( helixGeometry, helixMaterial );
    helixMesh.position.copy(start);
    helixMesh.lookAt(end);
    helixMesh.time = scene.elapsed;
    helixMesh.update = delayedRemove;
    scene.add(helixMesh);

    const geometry = new BufferGeometry().setFromPoints( points );
    const line = new Line( geometry, lineMaterial );
    line.time = scene.elapsed;
    line.update = delayedRemove;
    return line;
}

function getLinePositionsFromPlayer(player) {
    var start = new Vector3();
    var end = new Vector3();
    player.camera.getWorldDirection( player.playerDirection );
    start.copy( player.playerCollider.end );
    end.copy( player.playerCollider.end );
    end.addScaledVector( player.playerDirection, 100 );
    return [start, end];
}

function shoot(scene, player) {
    player.game.audio.railgun.play();
    var [start, end] = getLinePositionsFromPlayer(player);
    scene.add( getLine(scene, start, end) );

    var dir = player.playerDirection;
    // webSocket.send({cmd: "rail", origin: {x: start.x, y: start.y, z: start.z}, dir: {x: dir.x, y: dir.y, z: dir.z}});
    webSocket.send({cmd: "rail", start: {x: start.x, y: start.y, z: start.z}, end: {x: end.x, y: end.y, z: end.z}});

    const raycaster = new Raycaster(start, player.playerDirection);
    for( var enemy_id in enemies) {
        //var char = scene.getObjectByName( "Character" );
        // TODO: check if we hit level first...
        /**
         * @Type {Enemy} enemy
         */
        var enemy = enemies[enemy_id];
        var char = enemy.soldier.glb.scene.children[0];
        if(raycaster.intersectObject(char, true ).length > 0) {
            //console.log(char);
            char.getWorldPosition(player.enemyPos);
            player.enemyPos.y+=1.8;

            webSocket.send({cmd: "hit", pos: {x: player.enemyPos.x, y: player.enemyPos.y, z: player.enemyPos.z}});
            scene.add(explosion(scene, player.enemyPos, scene.elapsed));

            player.game.audio.gib.play();
        }

    }
}

export {shoot, explosion, getLine};

