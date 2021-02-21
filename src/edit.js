import * as THREE from './three/build/three.module.js';
import Parser from './parser.js';
import { Brush } from './lib/Brush.js';

const clock = new THREE.Clock();
const scene = new THREE.Scene();
scene.background = new THREE.CubeTextureLoader().setPath( 'images/MilkyWay/dark-s_' ).load( ['px.jpg','nx.jpg','py.jpg','ny.jpg','pz.jpg','nz.jpg'] );
scene.add(new THREE.AmbientLight(0x6688cc));

const container = document.getElementById('container');
const w = container.clientWidth;
const h = container.clientHeight;

const camera = new THREE.PerspectiveCamera(75, w/h, 0.1, 1000);
camera.rotation.order = 'YXZ';

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
    //console.log("pos", camera.position);    console.log("rot", camera.rotation);
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
camera.position.set(57,30,-18);
camera.rotation.x=-0.58;
camera.rotation.y=1.85;


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

const brushList = document.getElementById('brushList');

function addBrush(brushFromMap) {
    var currentNr = brushList.options.length;
    var option = document.createElement("option");
    option.text = "Brush" + currentNr;
    option.value = ""+currentNr;
    brushList.options.add(option)

    var planes = [];
    for(var pi=0; pi<brushFromMap.length; pi++) {
        var planeFromMap = brushFromMap[pi];
        var p1=new THREE.Vector3(planeFromMap.p1x,planeFromMap.p1y,planeFromMap.p1z).multiplyScalar(0.038);
        var p2=new THREE.Vector3(planeFromMap.p2x,planeFromMap.p2y,planeFromMap.p2z).multiplyScalar(0.038);
        var p3=new THREE.Vector3(planeFromMap.p3x,planeFromMap.p3y,planeFromMap.p3z).multiplyScalar(0.038);
        var plane = new THREE.Plane().setFromCoplanarPoints(p1, p2, p3);
        planes.push(plane);
    }
    var brush3D = new Brush(planes, {nr:currentNr});
    
    var geometry = new THREE.Geometry();
    var counter=0;
    const vertices = [];
    var polygons = brush3D.getPolygons();
    for(var p=0; p<polygons.length;p++) {
        //console.log("new face");
        var face = polygons[p];
        var current_counter_pos=counter;
        for( var i=0; i<face.length;i++) {
            var point = face[i];
            counter++;
            geometry.vertices.push(	point );
            if( i >=2 ) {
                geometry.faces.push( new THREE.Face3(current_counter_pos, current_counter_pos+i-1, current_counter_pos+i) );
            }
        }
    }
    geometry.computeFaceNormals();
    var m = new THREE.Mesh(new THREE.BufferGeometry().fromGeometry(geometry), new THREE.MeshNormalMaterial());
    scene.add(m);        
}

function parseMapElement() {
    //console.log("hi");
    if( parser.peek() == '"') {
        var [key, val] = parser.readTextPair();
        worldspawn[key] = val;
        parser.swallowEOL();
    } else if( parser.peek() == '{') {
        var b = parser.parseBrush(); // this returns an array with objects that have p1x and p3z as elements.
        worldspawn.push(b);
        addBrush(b);
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

    /*
    for(var wsi=0; wsi< worldspawn.length; wsi++) {
        addBrush(worldspawn[wsi])
    }
    */
}

fetch("models/q3dm17.map").then(response => response.text()).then(text=>{
    parser = new Parser(text);
    parser.assertNext('{');
    parser.swallowEOL();
    parserInterval = setInterval(()=>parseMapElement(), 10);
});

document.getElementById('brushList').addEventListener('change', event=>{
    console.log("onchange");
    var brushNr = document.getElementById('brushList').value;
    var brush = worldspawn[brushNr];
    var string = "";
    for(var i=0;i<brush.length;i++) {
        var plane=brush[i];
        string+=[,plane.p1x,plane.p1z,plane.p1y,,,plane.p2x,plane.p2z,plane.p2y,,,plane.p3x,plane.p3z,plane.p3y];
        string+="<br/>;"
    }
    document.getElementById('bottom').innerHTML = string;
});

function animate() {
    const deltaTime = Math.min(0.1, clock.getDelta());
    controls(deltaTime);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
