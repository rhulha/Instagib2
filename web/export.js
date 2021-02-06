import { GLTFExporter } from './three/examples/jsm/exporters/GLTFExporter.js';

function exportGLTF(scene)
{
    new GLTFExporter().parse( scene, function ( gltf ) {
        //console.log( gltf );
        var link = document.createElement( 'a' );
        var blob = new Blob( [gltf], { type: 'application/octet-stream' } );
        link.href = URL.createObjectURL( blob );
        link.download = 'exported_scene.gltf';
        link.click();
    }, {binary:true});
}

export {exportGLTF};