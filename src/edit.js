import * as THREE from './three/build/three.module.js';
import Parser from './parser.js';

const clock = new THREE.Clock();
const scene = new THREE.Scene();
//scene.background = new THREE.Color(0x88ccff);
scene.background = new THREE.CubeTextureLoader().setPath( 'images/MilkyWay/dark-s_' )
.load( [
    'px.jpg',
    'nx.jpg',
    'py.jpg',
    'ny.jpg',
    'pz.jpg',
    'nz.jpg'
] );

const container = document.getElementById('container');
const w = container.clientWidth;
const h = container.clientHeight;

const camera = new THREE.PerspectiveCamera(75, w/h, 0.1, 1000);
camera.rotation.order = 'YXZ';

scene.add(new THREE.AmbientLight(0x6688cc));

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

window.addEventListener('resize', e=>{
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

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
camera.position.set(0,0,10);

keyStates['Space']=keyStates['KeyW']=keyStates['KeyA']=keyStates['KeyS']=keyStates['KeyD']=false;

function controls(deltaTime) {
    const speed = 125;
    playerVelocity.add(getPlayerRelativeVector(false).multiplyScalar(speed * deltaTime * (keyStates['KeyW'] - keyStates['KeyS'])));
    playerVelocity.add(getPlayerRelativeVector(true).multiplyScalar(speed * deltaTime * (keyStates['KeyD'] - keyStates['KeyA'])));
    playerVelocity.y = 15*keyStates['Space'];
    const damping = Math.exp( - 3 * deltaTime ) - 1;
    playerVelocity.addScaledVector( playerVelocity, damping );
    camera.position.addScaledVector(playerVelocity, deltaTime);
}

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

animate();

var mapElements = [];
var worldspawn = [];
var parser;
var parserInterval;

function parseMapElement() {
    console.log("hi");
    if( parser.peek() == '"') {
        var [key, val] = parser.readTextPair();
        worldspawn[key] = val;
        parser.swallowEOL();
    } else if( parser.peek() == '{') {
        var b = parser.parseBrush();
        worldspawn.push(b);
    } else if( parser.peek() == ' ') {
        worldspawn.push(parser.readPatchDef2());
    } else if( parser.peek() == '}') {
        done();
    } else {
        parser.next();
    }
}

function done() {
    console.log("done");
    clearInterval(parserInterval);
    console.log("parser.countNewLine", parser.countNewLine);
    mapElements.push(worldspawn);

    const brushList = document.getElementById('brushList');
    for(var i=0; i< worldspawn.length; i++) {
        var option = document.createElement("option");
        option.text = "Brush" + i;
        option.value = i++;
        brushList.options.add(option)
    }
}

fetch("models/q3dm17.map").then(response => response.text()).then(text=>{
    parser = new Parser(text);
    parser.assertNext('{');
    parser.swallowEOL();

    parserInterval = setInterval(()=>{
        parseMapElement();
    }, 0);
    
});

document.getElementById('brushList').addEventListener('change', event=>{
    console.log("onchange");
    var brushNr = document.getElementById('brushList').value;
    document.getElementById('bottom').innerText = worldspawn[brushNr];

});

function animate() {
    const deltaTime = Math.min(0.1, clock.getDelta());
    controls(deltaTime);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
