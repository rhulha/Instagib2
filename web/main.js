import {PerspectiveCamera, Clock, Geometry, Face3, Group, Mesh, BufferGeometry} from './three/build/three.module.js';
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
setupResizeListener( camera, renderer);

const jumpPadsGroup = new Group();

var brushes = getBrushes()
for(var brush of brushes) {
	var geometry = new Geometry();
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
			//vertices.push( point.x, point.y, point.z );
			// Godot Debug Points
			// console.log('[node name="Position3D'+counter+'" type="Position3D" parent="."]');
			// console.log('transform = Transform( 1, 0, 0, 0, 1, 0, 0, 0, 1, '+point.x+', '+point.y+', '+point.z+' )');
			counter++;
			geometry.vertices.push(	point );
			if( i >=2 ) {
				geometry.faces.push( new Face3(current_counter_pos, current_counter_pos+i-1, current_counter_pos+i) );
			}
		}
	}
	var box = addDebugBox( scene, geometry)
	var m = new Mesh(new BufferGeometry().fromGeometry(geometry), box.material);
	jumpPadsGroup.add( m );

}

const jumpPadsOctree = new Octree();
jumpPadsOctree.fromGraphNode(jumpPadsGroup);

const worldOctree = new Octree();
var player = new Player(worldOctree, jumpPadsOctree, camera);

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

