//import * as T from './three.module.js';
import {PerspectiveCamera, Mesh, MeshNormalMaterial, Clock, Vector3, Geometry} from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';
import { Octree } from './Octree.js';
import { setupScene, setupRenderer } from './setup.js';
import { Player } from './Player.js';
import { Plane, Brush } from './Brush.js';

const clock = new Clock();
var camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';
camera.position.z = 2.13;
var scene = setupScene();
const renderer = setupRenderer();

var planes_map = [
	"( 2488 -256 268 ) ( 2360 -256 188 ) ( 2360 -128 188 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
	"( 2360 -128 180 ) ( 2360 -128 164 ) ( 2488 -128 164 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
	"( 2480 -128 260 ) ( 2480 -128 220 ) ( 2480 -256 220 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
	"( 2360 -256 -4 ) ( 2360 -256 4 ) ( 2488 -256 4 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
	"( 2360 -256 180 ) ( 2360 -256 148 ) ( 2360 -128 148 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
	"( 2360 -256 164 ) ( 2488 -256 220 ) ( 2488 -128 220 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0"
];

// TODO: Use Three.js Plane, it is pretty good!

var planes = [];
for(var plane of planes_map) {
	var p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z;
	[,p1x,p1z,p1y,,,p2x,p2z,p2y,,,p3x,p3z,p3y] = plane.split(" ");
	planes.push(new Plane(new Vector3(p1x,p1y,p1z), new Vector3(p2x,p2y,p2z), new Vector3(p3x,p3y,p3z)));
}
var brush = new Brush(planes);
brush.getPolygons();

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

//var material = new MeshNormalMaterial();
//var mesh = new Mesh( geometry, material );
//scene.add( mesh );

const worldOctree = new Octree();
document.body.addEventListener( 'mousemove', ( event ) => {
	if ( document.pointerLockElement === document.body ) {
		camera.rotation.y -= event.movementX / 500;
		camera.rotation.x -= event.movementY / 500;
	}
}, false );

window.addEventListener( 'resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}, false );

var player = new Player(worldOctree, camera);

const loader = new GLTFLoader().setPath( './models/' );
loader.load( 'q3dm17.gltf', ( gltf ) => {
	scene.add( gltf.scene );
	worldOctree.fromGraphNode( gltf.scene );
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
	player.controls( deltaTime );
	player.update( deltaTime );
	renderer.render( scene, camera );
	requestAnimationFrame( animate );
}

