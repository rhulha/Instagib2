// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import {sRGBEncoding, ACESFilmicToneMapping, WebGLRenderer, MeshBasicMaterial} from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import Stats from './three/examples/jsm/libs/stats.module.js';
import { Player } from './Player.js';
import { CustomOctree } from './lib/CustomOctree.js';
import { getTriggerOctree } from './trigger.js';
import camera from './camera.js';
import scene from './scene.js';

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

        this.renderer = setupRenderer(this.container);

        setupResizeListener( camera, this.renderer);

        var startTime = Date.now()/1000;
        this.triggerOctree = getTriggerOctree(scene);
        var endTime = Date.now()/1000;
        console.log("triggerOctree was loaded in: " + (endTime-startTime).toFixed(2) + " seconds.")

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
                //child.geometry.computeVertexNormals();
                child.material.metalness = 0;
                // child.material.color.setHex( 0xffffff );
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
                // child.geometry.computeVertexNormals();
                child.material = new MeshBasicMaterial({vertexColors: false});
                child.material.color.setHex( 0x0000ff );
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
            this.modifyModel1(q3dm17.scene.children[0]);
            this.modifyModel2(q3dm17.scene.children[1]);
            scene.add( q3dm17.scene.children[0] ); // scene.add removes the mesh from q3dm17.scene
            scene.add( q3dm17.scene.children[0] );
            //q3dm17.scene.children.shift(); // Octree only likes complete scenes to travers.
            //q3dm17.scene.children.shift(); // so we remove the display meshes. The third mesh is the collision mesh.
            //update: shift not needed since this.scene.add removes the mesh from q3dm17.scene
            console.log("level was added in: " + (endTime-startTime).toFixed(2) + " seconds.")
            startTime = Date.now()/1000;
            this.worldOctree.fromGraphNode( q3dm17.scene, false ); // q3dm17.scene is now the third child. Because scene.add above removed the others.
            endTime = Date.now()/1000;
            console.log("level was octreed in: " + (endTime-startTime).toFixed(2) + " seconds.")
            callback();
        });
    }

    render() {
        this.renderer.render( scene, camera );
        this.stats.update();
    }
}

const game = new Game();

export default game;
