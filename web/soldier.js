// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';


class Soldier {
    glb;
    obj3d;
    ready=false;
    constructor() {}
}

var soldierSingleton = new Soldier();

// soldierSingleton.glb is a GLTF object with animations, scenes and cameras.
// soldierSingleton.glb.isObject3D is undefined 
// soldierSingleton.glb.parent is undefined 
// console.log("soldierSingleton.glb", soldierSingleton.glb);

const loader = new GLTFLoader().setPath( './models/' );
loader.load( 'soldier.glb', function ( soldier_glb ) {
	soldierSingleton.glb=soldier_glb;
	soldierSingleton.glb.scene.rotation.order = 'YXZ'
	soldierSingleton.glb.scene.traverse( ( obj ) => {
		if ( obj.type === 'Object3D' ) {
			soldierSingleton.obj3d=obj;
			obj.scale.set(0.017,0.017,0.017);
			// obj.castShadow = true;
		}
	});
    //setupModelAnimations(soldierSingleton);
    soldierSingleton.ready=true;
});

export {soldierSingleton};
