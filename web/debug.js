import { PerspectiveCamera, Mesh, MeshNormalMaterial, Clock, Geometry, Plane, Vector3} from './three/build/three.module.js';
import { FirstPersonControls } from './three/examples/jsm/controls/FirstPersonControls.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { setupScene, setupRenderer, setupResizeListener } from './setup.js';
import { addDebugPoints, addDebugBox } from './addPoints.js';
import { getBrushes, getBrushFromMapDef } from './trigger.js';

const clock = new Clock();
const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';
camera.position.z = 2.13;
const scene = setupScene();
const renderer = setupRenderer();
setupResizeListener( scene, renderer);

var controls = new FirstPersonControls( camera, renderer.domElement );
controls.movementSpeed = 100;
controls.lookSpeed = 0.1;

var mapDef = [
    "( -64 -64 -16 ) ( -64 -63 -16 ) ( -64 -64 -15 ) __TB_empty 0 0 0 0.5 0.5 0 0 0",
    "( -64 -64 -16 ) ( -64 -64 -15 ) ( -63 -64 -16 ) __TB_empty 0 0 0 0.5 0.5 0 0 0",
    "( -64 -64 -16 ) ( -63 -64 -16 ) ( -64 -63 -16 ) __TB_empty 0 0 0 0.5 0.5 0 0 0",
    "( 64 64 16 ) ( 64 65 16 ) ( 65 64 16 ) __TB_empty 0 0 0 0.5 0.5 0 0 0",
    "( 64 64 16 ) ( 65 64 16 ) ( 64 64 17 ) __TB_empty 0 0 0 0.5 0.5 0 0 0",
    "( 64 64 16 ) ( 64 64 17 ) ( 64 65 16 ) __TB_empty 0 0 0 0.5 0.5 0 0 0"
];

var brush = getBrushFromMapDef(mapDef)

const vertices = [];
var polygons = brush.getPolygons();
for(var face of polygons) {
    //console.log("new face");
    for( var point of face) {
        //geometry.vertices.push(	point);
        //console.log(point)
        vertices.push( point.x, point.y, point.z );
    }
}
addDebugPoints(scene, vertices);

//const geometry = new Geometry();

addDebugBox( scene, )




const loader = new GLTFLoader().setPath( './models/' );
loader.load( 'q3dm17.gltf', ( gltf ) => {
	scene.add( gltf.scene );
	gltf.scene.traverse( child => {
		if ( child.isMesh ) {
			child.castShadow = true;
			child.receiveShadow = true;
			if ( child.material.map ) {
				child.material.map.anisotropy = 8;
			}
		}
	} );
	animate();
} );

function animate() {
    const deltaTime = Math.min( 0.1, clock.getDelta() );
    controls.update( deltaTime );
	renderer.render( scene, camera );
	requestAnimationFrame( animate );
}

