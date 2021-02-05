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

function raycastScene(scene) {
    scene.traverse((obj)=>{
        if ( obj.type === 'SkinnedMesh' ) {
            if(obj.material.name != "SkyShader" && obj.constructor.name != "Line") {
                if(raycaster.intersectObject( obj )) {
                    if(obj.material.name != "SkyShader" && obj.constructor.name != "Line") {
                        console.log(obj.constructor.name);
                        console.log(obj);
                    }
                }
            }
        }
    })
}

function printSceneGraph( obj ) {
    console.group( ' <%o> ' + obj.name, obj );
    obj.children.forEach( printSceneGraph );
    console.groupEnd();
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

/**
 * @param {Scene} scene 
 * @param {Geometry} geometry 
 * @returns {Mesh}
 */
function addDebugBox(scene, geometry) {
    var material = new MeshNormalMaterial();
    geometry.computeFaceNormals();
    const mesh = new Mesh(geometry, material);
    scene.add( mesh );
    return mesh;
}
// https://threejsfundamentals.org/threejs/lessons/threejs-custom-geometry.html

export { addDebugPoints, addDebugBox, printSceneGraph };
