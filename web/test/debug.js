import { PerspectiveCamera, Mesh, MeshNormalMaterial, Clock, Geometry, Vector3, Face3, BackSide} from '../three/build/three.module.js';
import { FirstPersonControls } from '../three/examples/jsm/controls/FirstPersonControls.js';
import { GLTFLoader } from '../three/examples/jsm/loaders/GLTFLoader.js';
import { setupScene, setupRenderer, setupResizeListener } from '../setup.js';
import { addDebugPoints, addDebugBox } from '../debug.js';
import { getBrushes, getBrushFromMapDef } from '../trigger.js';

const clock = new Clock();
const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';
camera.position.z = 2.13;
const scene = setupScene();
const renderer = setupRenderer();
setupResizeListener( camera, renderer);

var controls = new FirstPersonControls( camera, renderer.domElement );
controls.movementSpeed = 100;
controls.lookSpeed = 0.1;

var mapDef1 = [
    "( -64 -64 -16 ) ( -64 -63 -16 ) ( -64 -64 -15 ) __TB_empty 0 0 0 0.5 0.5 0 0 0",
    "( -64 -64 -16 ) ( -64 -64 -15 ) ( -63 -64 -16 ) __TB_empty 0 0 0 0.5 0.5 0 0 0",
    "( -64 -64 -16 ) ( -63 -64 -16 ) ( -64 -63 -16 ) __TB_empty 0 0 0 0.5 0.5 0 0 0",
    "( 64 64 16 ) ( 64 65 16 ) ( 65 64 16 ) __TB_empty 0 0 0 0.5 0.5 0 0 0",
    "( 64 64 16 ) ( 65 64 16 ) ( 64 64 17 ) __TB_empty 0 0 0 0.5 0.5 0 0 0",
    "( 64 64 16 ) ( 64 64 17 ) ( 64 65 16 ) __TB_empty 0 0 0 0.5 0.5 0 0 0"
];

var mapDef = [
    "( 108 128 -4 ) ( -20 128 -4 ) ( -20 -8 -4 ) common/trigger 8 0 0 0.500000 0.500000 0 0 0",
    "( 108 128 100 ) ( 108 0 100 ) ( -20 0 -28 ) common/trigger 8 0 0 0.500000 0.500000 0 0 0",
    "( -20 8 -4 ) ( 108 8 -4 ) ( 108 8 -12 ) common/trigger 8 -8 0 0.500000 0.500000 0 0 0",
    "( 116 0 124 ) ( 116 128 124 ) ( 116 128 -12 ) common/trigger 0 -8 0 0.500000 0.500000 0 0 0",
    "( 108 120 -4 ) ( -20 120 -4 ) ( -20 120 -12 ) common/trigger 8 -8 0 0.500000 0.500000 0 0 0",
    "( -20 128 -4 ) ( -20 -8 -4 ) ( -20 -8 -12 ) common/trigger 0 -8 0 0.500000 0.500000 0 0 0"
]

const geometry = new Geometry();

var brush = getBrushFromMapDef(mapDef)
var counter=0;
const vertices = [];
var polygons = brush.getPolygons();
for(var p=0; p<polygons.length;p++) {
    //console.log("new face");
    var face = polygons[p];
    var current_counter_pos=counter;
    for( var i=0; i<face.length;i++) {
        var point = face[i];
        //console.log(point)
        vertices.push( point.x, point.y, point.z );
        console.log('[node name="Position3D'+counter+'" type="Position3D" parent="."]');
        console.log('transform = Transform( 1, 0, 0, 0, 1, 0, 0, 0, 1, '+point.x+', '+point.y+', '+point.z+' )');
        counter++;
        geometry.vertices.push(	point );
        if( i >=2 ) {
            geometry.faces.push( new Face3(current_counter_pos, current_counter_pos+i-1, current_counter_pos+i) );
        }
    }
}
//addDebugPoints(scene, vertices);
//addDebugBox( scene, vertices )


geometry.computeFaceNormals();
var material = new MeshNormalMaterial();
//material.side = BackSide; // DoubleSide;
const mesh = new Mesh(geometry, material);
scene.add( mesh );

/*
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
*/
animate();

function animate() {
    const deltaTime = Math.min( 0.1, clock.getDelta() );
    controls.update( deltaTime );
	renderer.render( scene, camera );
	requestAnimationFrame( animate );
}

