import {Points, PointsMaterial, Float32BufferAttribute, Face3, Geometry, BufferGeometry, Mesh, MeshNormalMaterial, TextureLoader, Vector3} from './three/build/three.module.js';
    
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

function addDebugBox(scene, vertices) {
    const geometry = new Geometry();
    geometry.vertices.push(
      new Vector3(-1, -1,  1),  // 0
      new Vector3( 1, -1,  1),  // 1
      new Vector3(-1,  1,  1),  // 2
      new Vector3( 1,  1,  1),  // 3
      new Vector3(-1, -1, -1),  // 4
      new Vector3( 1, -1, -1),  // 5
      new Vector3(-1,  1, -1),  // 6
      new Vector3( 1,  1, -1),  // 7
    );

    geometry.faces.push(
        // front
        new Face3(0, 3, 2),
        new Face3(0, 1, 3),
        // right
        new Face3(1, 7, 3),
        new Face3(1, 5, 7),
        // back
        new Face3(5, 6, 7),
        new Face3(5, 4, 6),
        // left
        new Face3(4, 2, 6),
        new Face3(4, 0, 2),
        // top
        new Face3(2, 7, 6),
        new Face3(2, 3, 7),
        // bottom
        new Face3(4, 1, 0),
        new Face3(4, 5, 1),
    );

    var material = new MeshNormalMaterial();
    geometry.computeFaceNormals();
    const mesh = new Mesh(geometry, material);
    scene.add( mesh );
    
}

export { addDebugPoints, addDebugBox };
