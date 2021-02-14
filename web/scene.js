import {Scene, AmbientLight, Vector3} from './three/build/three.module.js';
import { Sky } from './three/examples/jsm/objects/Sky.js';

var scene = new Scene();
//scene.background = new Color( 0x88ccff );
//scene.add( new AmbientLight( 0x6688cc ) );

// const fillLight1 = new DirectionalLight( 0x9999ff, 5.5 );
// fillLight1.position.set( - 1, 1, 2 );
// scene.add( fillLight1 );

// const pl = new PointLight( 0x9999ff, 5.5 );
// pl.position.set( 0, 70, 0 );
// scene.add( pl );

scene.add( new AmbientLight( 0xaaaaff, 1 ) );


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
    // exposure: renderer.toneMappingExposure
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

// renderer.toneMappingExposure = effectController.exposure;

//const hemiLight = new HemisphereLight( 0xffffff, 0x444444 );
//hemiLight.position.set( 0, 20, 0 );
//scene.add( hemiLight );
            
//const fillLight2 = new DirectionalLight( 0x8888ff, 1.2 );
//fillLight2.position.set( 0, - 1, 0 );
//scene.add( fillLight2 );

export default scene;
