import * as THREE from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import Parser from './parser.js';

const clock = new THREE.Clock();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x88ccff);

const container = document.getElementById('container');
const w = container.clientWidth;
const h = container.clientHeight;

const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.rotation.order = 'YXZ';

const ambientlight = new THREE.AmbientLight(0x6688cc);
scene.add(ambientlight);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(w, h);

container.appendChild(renderer.domElement);

const keyStates = {};
document.addEventListener('keydown', event => keyStates[event.code] = true);
document.addEventListener('keyup', event => keyStates[event.code] = false);

const mouseDown= {};
container.addEventListener('mousedown', event => {
    mouseDown[event.button] = true;
    container.requestPointerLock();
});
container.addEventListener('mouseup', event => {
    mouseDown[event.button] = false;
    document.exitPointerLock();
});

container.addEventListener('mousemove', (event) => {
    if (mouseDown[2]) {
        camera.rotation.y -= event.movementX / 500;
        camera.rotation.x -= event.movementY / 500;
    }
});

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

document.addEventListener('click', () => {
    //camera.getWorldDirection(playerDirection);
});

function getPlayerRelativeVector(side) {
    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();
    if( side)
        playerDirection.cross( camera.up );
    return playerDirection;
}

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();
const playerPosition = new THREE.Vector3(0,-19,0);
const deltaPosition = new THREE.Vector3();

keyStates['KeyW']=keyStates['KeyA']=keyStates['KeyS']=keyStates['KeyD']=false;

function controls(deltaTime) {
    const speed = 125;
    playerVelocity.add(getPlayerRelativeVector(false).multiplyScalar(speed * deltaTime * (keyStates['KeyW'] - keyStates['KeyS'])));
    playerVelocity.add(getPlayerRelativeVector(true).multiplyScalar(speed * deltaTime * (keyStates['KeyD'] - keyStates['KeyA'])));

    if (keyStates['Space']) {
        playerVelocity.y = 15;
    }

    const damping = Math.exp( - 3 * deltaTime ) - 1;
    playerVelocity.addScaledVector( playerVelocity, damping );
    deltaPosition.copy(playerVelocity).multiplyScalar( deltaTime );
    playerPosition.add(deltaPosition);
	camera.position.copy( playerPosition );
}

const loader = new GLTFLoader();
loader.load('./models/q3dm17.glb', (gltf) => {
    gltf.scene.traverse( child => {
        if ( child.isMesh ) {
            //child.geometry.computeVertexNormals();
            child.material.metalness = 0;
            // child.material.color.setHex( 0x009DFF );
            // console.log(child.material.vertexColors) // is true
            //child.material = new MeshBasicMaterial({vertexColors: true});
        }
    } );
    gltf.scene.remove(gltf.scene.children[2]);
    scene.add(gltf.scene);
    animate();
});

fetch("models/q3dm17.map").then(response => response.text()).then(text=>{
    const brushList = document.getElementById('brushList');
    var map = {};
    var parser = new Parser(text);
    parser.assertNext('{');
    parser.swallowEOL();
    while(true) {
        if( parser.peek() == '"') {
            var [key, val] = parser.getTextPair();
            map[key] = val;
            parser.swallowEOL();
        } else if( parser.peek() == '"') {
            var b = parser.parseBrush();
        }
    
    }

    //console.log(lines.length)
    
});


function animate() {
    const deltaTime = Math.min(0.1, clock.getDelta());
    controls(deltaTime);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
