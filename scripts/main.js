//import * as T from './three.module.js';
import {PerspectiveCamera, Mesh, MeshNormalMaterial, Clock, Vector3, Geometry, Plane, Face3} from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';
import { Octree } from './Octree.js';
import { setupScene, setupRenderer } from './setup.js';
import { Player } from './Player.js';
import { Brush } from './Brush.js';
import { addPoints } from './addPoints.js';
import { trigger_push } from './trigger.js';


const clock = new Clock();
var camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';
camera.position.z = 2.13;
var scene = setupScene();
const renderer = setupRenderer();

var brushess = [];

for( var planes_map of trigger_push) {
	var planes = [];
	for(var plane of planes_map) {
		var p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z;
		[,p1x,p1z,p1y,,,p2x,p2z,p2y,,,p3x,p3z,p3y] = plane.split(" ");
		var p = new Plane().setFromCoplanarPoints(new Vector3(p1x,p1y,p1z).multiplyScalar(0.038), new Vector3(p2x,p2y,p2z).multiplyScalar(0.038), new Vector3(p3x,p3y,p3z).multiplyScalar(0.038))
		planes.push(p);
	}
	var brush = new Brush(planes);

	const vertices = [];
	//const geometry = new Geometry();
	var polygons = brush.getPolygons();
	for(var face of polygons) {
		//console.log("new face");
		for( var point of face) {
			//geometry.vertices.push(	point);
			//console.log(point)
			vertices.push( point.x, point.y, point.z );
		}
	}
	
	addPoints(scene, vertices);
}


/*
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
*/

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

