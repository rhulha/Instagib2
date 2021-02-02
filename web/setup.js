import {WebGLRenderer, Scene, Color, AmbientLight, DirectionalLight} from './three/build/three.module.js';
    
/**
 * @returns {Scene}
 */
function setupScene() {
    var scene = new Scene();
    scene.background = new Color( 0x88ccff );
    scene.add( new AmbientLight( 0x6688cc ) );
    
    const fillLight1 = new DirectionalLight( 0xff9999, 5.5 );
    fillLight1.position.set( - 1, 1, 2 );
    scene.add( fillLight1 );
    
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
    const container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );
    return renderer;
}

export { setupScene, setupRenderer, setupResizeListener };
