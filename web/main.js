import {PerspectiveCamera, Clock, Geometry, Face3, Group, Mesh, BufferGeometry} from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { Octree } from './three/examples/jsm/math/Octree.js';
import { setupScene, setupRenderer, setupResizeListener } from './setup.js';
import { Player } from './Player.js';
import { getTriggerOctree } from './trigger.js';

const clock = new Clock();
const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';
camera.position.z = 2.13;
const scene = setupScene(camera);
const renderer = setupRenderer();
setupResizeListener( camera, renderer);


const jumpPadsOctree = getTriggerOctree(scene);
const worldOctree = new Octree();
var player = new Player(worldOctree, jumpPadsOctree, camera, clock);

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

