import { Vector3, Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, TextureLoader } from './three/build/three.module.js';

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

export {explosion};

