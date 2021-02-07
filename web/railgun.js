import { Vector3, Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, MeshLambertMaterial, TubeGeometry, Mesh,
    LineBasicMaterial, TextureLoader, Raycaster, Line } from './three/build/three.module.js';
import { Curves } from './three/examples/jsm/curves/CurveExtras.js';
import webSocket from './webSocket.js';

const lineMaterial = new LineBasicMaterial( { color: 0x0000ff, linewidth: 10 } );
const helixMaterial = new MeshLambertMaterial( { color: 0xff0000, opacity: 0.3, transparent: true } );

const sprite = new TextureLoader().load( 'images/disc.png' );
const material = new PointsMaterial( { size: 1,  color: "darkred", map: sprite, alphaTest: 0.5, transparent: true });
const count = 200;
const speed = 10;

const gib_audio = new Audio('sounds/gibsplt1.wav');

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

function getLine(scene, start, end) {
    const points = [];
    points.push( start );
    points.push( end );
    
    var helix = new Curves.HelixCurve();
    var helixGeometry = new TubeGeometry( helix, 300, 2, 12, false );
    var helixMesh = new Mesh( helixGeometry, helixMaterial );
    helixMesh.time = scene.clock.getElapsedTime();
    helixMesh.update = delayedRemove;
    scene.add(helixMesh);

    const geometry = new BufferGeometry().setFromPoints( points );
    const line = new Line( geometry, lineMaterial );
    line.time = scene.clock.getElapsedTime();
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
    player.railgun_audio.play();
    var [start, end] = getLinePositionsFromPlayer(player);
    scene.add( getLine(scene, start, end) );

    var dir = player.playerDirection;
    // webSocket.send({cmd: "rail", origin: {x: start.x, y: start.y, z: start.z}, dir: {x: dir.x, y: dir.y, z: dir.z}});
    webSocket.send({cmd: "line", start: {x: start.x, y: start.y, z: start.z}, end: {x: end.x, y: end.y, z: end.z}});

    const raycaster = new Raycaster(start, player.playerDirection);
    var char = scene.getObjectByName( "Character");
    if(raycaster.intersectObject( char, true ).length > 0) {
        //console.log(char);
        char.getWorldPosition(player.enemyPos);
        player.enemyPos.y+=1.8;

        webSocket.send({cmd: "hit", pos: {x: player.enemyPos.x, y: player.enemyPos.y, z: player.enemyPos.z}});

        // webSocket.send({cmd: "sendTestData"});
        scene.add(explosion(scene, player.enemyPos, scene.clock.getElapsedTime()));

        gib_audio.play();
    }
}

export {shoot, explosion, getLine, gib_audio};

