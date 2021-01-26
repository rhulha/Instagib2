import {Points, PointsMaterial, Float32BufferAttribute, Face3, BufferGeometry, TextureLoader} from './three/build/three.module.js';
    
function addDebugPoints(scene, vertices) {
    const bg = new BufferGeometry();
    const sprite = new TextureLoader().load( 'disc.png' );
    bg.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
    var pm = new PointsMaterial( { size: 3, sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: true } );
    pm.color.setHSL( 1.0, 0.3, 0.7 );
    const particles = new Points( bg, pm );
    scene.add( particles );
}

function addRandomPoints(scene) {
    const bg = new BufferGeometry();
    const vertices = [];
    const sprite = new TextureLoader().load( 'disc.png' );
    for ( let i = 0; i < 10000; i ++ ) {
        const x = 2000 * Math.random() - 1000;
        const y = 2000 * Math.random() - 1000;
        const z = 2000 * Math.random() - 1000;
        vertices.push( x, y, z );
    }
    bg.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
    
    var pm = new PointsMaterial( { size: 35, sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: true } );
    pm.color.setHSL( 1.0, 0.3, 0.7 );
    
    const particles = new Points( bg, pm );
    scene.add( particles );
}

export { addDebugPoints };
