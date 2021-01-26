import {PerspectiveCamera, Mesh, Clock, Vector3, Geometry, Plane, Face3} from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { Octree } from './three/examples/jsm/math/Octree.js';
import { setupScene, setupRenderer, setupResizeListener } from './setup.js';
import { Player } from './Player.js';
import { addDebugPoints, addDebugBox } from './addPoints.js';
import { getBrushes } from './trigger.js';

const clock = new Clock();
const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';
camera.position.z = 2.13;
const scene = setupScene(camera);
const renderer = setupRenderer();
setupResizeListener( scene, renderer);

var brushes = getBrushes()
for(var brush of brushes) {
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
	addDebugPoints(scene, vertices);

	addDebugBox( scene, )
}

const worldOctree = new Octree();
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

