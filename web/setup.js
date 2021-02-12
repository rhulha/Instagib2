// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import {PerspectiveCamera, sRGBEncoding, ACESFilmicToneMapping, WebGLRenderer, Scene, DirectionalLight, Vector3, MeshBasicMaterial} from './three/build/three.module.js';
import { Sky } from './three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import Stats from './three/examples/jsm/libs/stats.module.js';
import { Player } from './Player.js';
import { CustomOctree } from './lib/CustomOctree.js';
import { getTriggerOctree } from './trigger.js';
/**
 * @returns {Scene}
 */
function setupScene(renderer) {
    var scene = new Scene();
    //scene.background = new Color( 0x88ccff );
    //scene.add( new AmbientLight( 0x6688cc ) );
    
    const fillLight1 = new DirectionalLight( 0x9999ff, 5.5 );
    fillLight1.position.set( - 1, 1, 2 );
    scene.add( fillLight1 );

    // https://threejs.org/examples/#webgl_shaders_sky
    // https://github.com/mrdoob/three.js/blob/master/examples/webgl_shaders_sky.html
    var sky = new Sky();
    sky.scale.setScalar( 450000 );
    scene.add( sky );

    const effectController = {
        turbidity: 0,
        rayleigh: 0.035,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.7,
        inclination: 0.3555, // elevation / inclination
        azimuth: 0.25, // Facing front,
        exposure: renderer.toneMappingExposure
    };

    var sun = new Vector3();

    const uniforms = sky.material.uniforms;
    uniforms[ "turbidity" ].value = effectController.turbidity;
    uniforms[ "rayleigh" ].value = effectController.rayleigh;
    uniforms[ "mieCoefficient" ].value = effectController.mieCoefficient;
    uniforms[ "mieDirectionalG" ].value = effectController.mieDirectionalG;

    const theta = Math.PI * ( effectController.inclination - 0.5 );
    const phi = 2 * Math.PI * ( effectController.azimuth - 0.5 );

    sun.x = Math.cos( phi );
    sun.y = Math.sin( phi ) * Math.sin( theta );
    sun.z = Math.sin( phi ) * Math.cos( theta );

    uniforms[ "sunPosition" ].value.copy( sun );

    renderer.toneMappingExposure = effectController.exposure;
    
    //const hemiLight = new HemisphereLight( 0xffffff, 0x444444 );
    //hemiLight.position.set( 0, 20, 0 );
    //scene.add( hemiLight );
                
    //const fillLight2 = new DirectionalLight( 0x8888ff, 1.2 );
    //fillLight2.position.set( 0, - 1, 0 );
    //scene.add( fillLight2 );

    return scene;
}

function setupResizeListener(camera, renderer) {
    window.addEventListener( 'resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }, false );
}

function setupRenderer(container) {
    var renderer = new WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = sRGBEncoding;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    container.appendChild( renderer.domElement );
    return renderer;
}

class Game {
    constructor() {
        console.log("Game initialized.")
        this.container = document.getElementById( 'container' );
        this.stats = new Stats();
        this.stats.domElement.style.cssText  = 'position:fixed;top:0;right:0;cursor:pointer;opacity:0.8;z-index:10000'
        this.container.appendChild( this.stats.domElement );

        this.camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera.rotation.order = 'YXZ';
        this.renderer = setupRenderer(this.container);

        this.scene = setupScene(this.renderer);
        setupResizeListener( this.camera, this.renderer);

        this.jumpPadsOctree = getTriggerOctree(this.scene);
        this.worldOctree = new CustomOctree();
        this.player = new Player(this);
        this.audio = {
            railgun: new Audio('sounds/railgf1a.wav'),
            railgun_enemy: new Audio('sounds/railgf1a.wav'),
            jump: new Audio('sounds/sarge/jump1.wav'),
            jumppad: new Audio('sounds/jumppad.wav'),
            gib: new Audio('sounds/gibsplt1.wav'),
            teleport: new Audio('sounds/telein.wav')
        }
        this.audio.railgun.volume=0.1;
        this.audio.railgun_enemy.volume=0.08;
        this.audio.jump.volume=0.2;
        this.audio.jumppad.volume=0.5;
        this.audio.gib.volume=0.3;
        this.audio.teleport.volume=0.4;
    }

    modifyModel1(model) {
        model.traverse( child => {
            if ( child.isMesh ) {
                child.geometry.computeVertexNormals();
                child.material.color.setHex( 0x000000 );
                //child.material = new MeshBasicMaterial({vertexColors: true});
                //child.castShadow = true;
                //child.receiveShadow = true;
                if ( child.material.map ) {
                    child.material.map.anisotropy = 8;
                }
            }
        } );
    }
    modifyModel2(model) {
        model.traverse( child => {
            if ( child.isMesh ) {
                child.geometry.computeVertexNormals();
                //child.material.color.setHex( 0x000000 );
                child.material = new MeshBasicMaterial({vertexColors: true});
                //child.castShadow = true;
                //child.receiveShadow = true;
                if ( child.material.map ) {
                    child.material.map.anisotropy = 8;
                }
            }
        } );
    }
    
    loadMap(callback) {
        var startTime = Date.now()/1000;
        var loader = new GLTFLoader();
        loader.load( './models/q3dm17.gltf', ( q3dm17 ) => {
            var endTime = Date.now()/1000;
            console.log("level was loaded in: " + (endTime-startTime).toFixed(2) + " seconds.")
            startTime = Date.now()/1000;
            //this.modifyModel1(q3dm17.scene.children[0]);
            //this.modifyModel2(q3dm17.scene.children[1]);
            this.scene.add( q3dm17.scene.children[0] ); // this.scene.add removes the mesh from q3dm17.scene
            this.scene.add( q3dm17.scene.children[0] );
            //q3dm17.scene.children.shift(); // Octree only likes complete scenes to travers.
            //q3dm17.scene.children.shift(); // so we remove the display meshes. The third mesh is the collision mesh.
            //update: shift not needed since this.scene.add removes the mesh from q3dm17.scene
            console.log("level was added in: " + (endTime-startTime).toFixed(2) + " seconds.")
            startTime = Date.now()/1000;
            this.worldOctree.fromGraphNode( q3dm17.scene, false );
            endTime = Date.now()/1000;
            console.log("level was octreed in: " + (endTime-startTime).toFixed(2) + " seconds.")
            callback();
        });
    }

    render() {
        this.renderer.render( this.scene, this.camera );
        this.stats.update();
    }
}

const game = new Game();

export { game };
