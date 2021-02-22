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
import {initializeAudio} from './audio.js';

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
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
        this.stats.domElement.id = "stats";
        this.container.appendChild( this.stats.domElement );

        this.renderer = setupRenderer(this.container);

        setupResizeListener( camera, this.renderer);

        var startTime = Date.now()/1000;
        this.triggerOctree = getTriggerOctree(scene);
        var endTime = Date.now()/1000;
        console.log("triggerOctree was loaded in: " + (endTime-startTime).toFixed(2) + " seconds.")

        this.worldOctree = new CustomOctree();
        var color = getParameterByName("color") || "yellow";
        if(color && color.startsWith("#"))
            color=color.split("#")[1];
        var name = getParameterByName("name") || "Player";
        this.player = new Player(this, name, color);
        initializeAudio();
    }

    modifyModel1(model) {
        model.traverse( child => {
            if ( child.isMesh ) {
                //child.geometry.computeVertexNormals();
                child.material.metalness = 0;
                child.material.color.setHex( 0x009DFF );
                // console.log(child.material.vertexColors) // is true
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
                child.material.color.setHex( 0xffffff );
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
        loader.load( './models/q3dm17.glb', ( q3dm17 ) => {
            var endTime = Date.now()/1000;
            console.log("level was loaded in: " + (endTime-startTime).toFixed(2) + " seconds.")
            startTime = Date.now()/1000;
            q3dm17.scene.children[0].name = "level";
            q3dm17.scene.children[1].name = "levelBorders";
            q3dm17.scene.children[2].name = "levelCollisionShape";
            this.modifyModel1(q3dm17.scene.children[0]);
            this.modifyModel2(q3dm17.scene.children[1]);
            scene.add( q3dm17.scene.children[0] ); // scene.add removes the mesh from q3dm17.scene
            scene.add( q3dm17.scene.children[0] );
            //q3dm17.scene.children.shift(); // Octree only likes complete scenes to travers.
            //q3dm17.scene.children.shift(); // so we remove the display meshes. The third mesh is the collision mesh.
            //update: shift not needed since this.scene.add removes the mesh from q3dm17.scene
            console.log("level was added in: " + (endTime-startTime).toFixed(2) + " seconds.")
            startTime = Date.now()/1000;
            this.worldOctree.fromGraphNode( q3dm17.scene, false ); // q3dm17.scene is now only having the third child. Because scene.add above removed the others.
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
