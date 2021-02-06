import {sRGBEncoding, ACESFilmicToneMapping, WebGLRenderer, Scene, AnimationMixer, DirectionalLight, Vector3, Clock} from './three/build/three.module.js';
import { Sky } from './three/examples/jsm/objects/Sky.js';

/**
 * @returns {Scene}
 */
function setupScene(renderer) {
    var scene = new Scene();
    scene.clock = new Clock();
    //scene.background = new Color( 0x88ccff );
    //scene.add( new AmbientLight( 0x6688cc ) );
    
    const fillLight1 = new DirectionalLight( 0xff9999, 5.5 );
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

function setupRenderer() {
    var renderer = new WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = sRGBEncoding;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    const container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );
    return renderer;
}

function setupModelAnimations(soldier){ 
	var soldier_mixer = new AnimationMixer( soldier.scene );
	soldier_mixer.timeScale = 11.0;
	var idleAction = soldier_mixer.clipAction( soldier.animations[ 0 ] );
	var walkAction = soldier_mixer.clipAction( soldier.animations[ 3 ] );
	var runAction = soldier_mixer.clipAction( soldier.animations[ 1 ] );
	var soldier_actions = [ idleAction, walkAction, runAction ];
	soldier_actions.forEach( function ( action ) {
		action.play();
	} );
	idleAction.setEffectiveTimeScale( 31 );
	idleAction.setEffectiveWeight( 0 );
	walkAction.setEffectiveWeight( 0 );
	runAction.setEffectiveWeight( 1 );
	runAction.setEffectiveTimeScale( 31 );
    return [soldier_mixer, soldier_actions];
}


export { setupScene, setupRenderer, setupResizeListener, setupModelAnimations };
