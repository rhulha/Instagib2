import { Vector3, Points, PointsMaterial, BufferGeometry, Float32BufferAttribute,
    LineBasicMaterial, TextureLoader, Raycaster, Line } from './three/build/three.module.js';

const lineMaterial = new LineBasicMaterial( { color: 0x0000ff, linewidth: 10 } );

const sprite = new TextureLoader().load( 'images/disc.png' );
const material = new PointsMaterial( { size: 1,  color: "red", map: sprite, alphaTest: 0.5, transparent: true });
const count = 300;
const speed = 30;

/**
* @param {Vector3} pos
*/
function explosion(pos, elapsedTime)
{
    const dirs = [];
    const vertices = [];
    for ( let i = 0; i < count; i ++ ) {
        vertices.push( pos.x, pos.y, pos.z );
        dirs.push(new Vector3((Math.random() * speed)-(speed/2),(Math.random() * speed)-(speed/2),(Math.random() * speed)-(speed/2)));
    }

    var geometry = new BufferGeometry();
    geometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
    var particles = new Points( geometry, material );
    
    particles.time = elapsedTime;

    particles.update = function(elapsed) {
        if(this.time + 1.5 < scene.clock.getElapsedTime()) {
            if(!scene.remove_me)
                scene.remove_me=[];
            scene.remove_me.push(this);
        }
        //var pos = geometry.getAttribute('position');
        var pos = particles.geometry.attributes.position.array
        for ( let i = 0; i < count*3; i+=3 ) {
            pos[i]+=dirs[i/3].x*elapsed;
            pos[i+1]+=dirs[i/3].y*elapsed;
            pos[i+2]+=dirs[i/3].z*elapsed;
            dirs[i/3].y-=30*elapsed; // gravity.
        }
        //geometry.verticesNeedUpdate = true;
        geometry.attributes.position.needsUpdate = true;
    };
    
    return particles;
}

function shoot(scene, player) {
    //player.railgun_audio.play();
    const points = [];
    var start = new Vector3();
    var end = new Vector3();
    points.push( start );
    points.push( end );
    player.camera.getWorldDirection( player.playerDirection );
    start.copy( player.playerCollider.end );
    end.copy( player.playerCollider.end );
    end.addScaledVector( player.playerDirection, 100 );
    const geometry = new BufferGeometry().setFromPoints( points );
    const line = new Line( geometry, lineMaterial );
    line.time = scene.clock.getElapsedTime();
    line.update = function(elapsed) {
        if(this.time + 1.5 < scene.clock.getElapsedTime()) {
            if(!scene.remove_me)
                scene.remove_me=[];
            scene.remove_me.push(this);
        }
    }
    scene.add( line );
    const raycaster = new Raycaster(start, player.playerDirection);
    var char = scene.getObjectByName( "Character");
    if(raycaster.intersectObject( char, true ).length > 0) {
        console.log(char);
        char.getWorldPosition(player.enemyPos);
        player.enemyPos.y+=1.8;
        scene.add(explosion(player.enemyPos, scene.clock.getElapsedTime()));
    }
}

export {shoot, explosion};

