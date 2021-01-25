//import * as T from './three.module.js';
import {WebGLRenderer, PerspectiveCamera, Scene, BoxGeometry, Mesh, MeshNormalMaterial,
	Color, AmbientLight, Clock, Vector3, DirectionalLight} from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';
import { Octree } from './Octree.js';
import { setupScene, setupRenderer } from './setup.js';
import { Player } from './Player.js';

const clock = new Clock();
var camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';
camera.position.z = 1;
var scene = setupScene();
const renderer = setupRenderer();

// var geometry = new BoxGeometry( 0.2, 0.2, 0.2 );
// var material = new MeshNormalMaterial();
// var mesh = new Mesh( geometry, material );
// scene.add( mesh );

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

