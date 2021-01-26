import {WebGLRenderer, Scene, Color, AmbientLight, DirectionalLight} from './three/build/three.module.js';
    
function setupScene() {
    var scene = new Scene();
    scene.background = new Color( 0x88ccff );
    scene.add( new AmbientLight( 0x6688cc ) );
    
    const fillLight1 = new DirectionalLight( 0xff9999, 5.5 );
    fillLight1.position.set( - 1, 1, 2 );
    scene.add( fillLight1 );
    
    //const fillLight2 = new DirectionalLight( 0x8888ff, 1.2 );
    //fillLight2.position.set( 0, - 1, 0 );
    //scene.add( fillLight2 );

    return scene;
}

function setupRenderer() {
    var renderer = new WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    const container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );
    return renderer;
}

export { setupScene, setupRenderer };
