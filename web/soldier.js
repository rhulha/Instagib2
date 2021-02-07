import { AnimationMixer } from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';

function setupModelAnimations(soldier){ 
	soldier.mixer = new AnimationMixer( soldier.glb.scene );
	soldier.mixer.timeScale = 1;
	var idleAction = soldier.mixer.clipAction( soldier.glb.animations[ 0 ] );
	var walkAction = soldier.mixer.clipAction( soldier.glb.animations[ 3 ] );
	var runAction = soldier.mixer.clipAction( soldier.glb.animations[ 1 ] );
	soldier.actions = [ idleAction, walkAction, runAction ];
	soldier.actions.forEach( function ( action ) {
        action.setEffectiveTimeScale(1);
        action.setEffectiveWeight(0);
        action.play();
	} );
	runAction.setEffectiveWeight(1);
}

class Soldier {
    glb;
    obj3d;
    actions;
    mixer;
    constructor() {}
}

var soldier = new Soldier();

const loader = new GLTFLoader().setPath( './models/' );
loader.load( 'soldier.glb', function ( soldier_glb ) {
	soldier.glb=soldier_glb;
	soldier.glb.scene.rotation.order = 'YXZ'
	soldier.glb.scene.traverse( ( obj ) => {
		if ( obj.type === 'Object3D' ) {
			soldier.obj3d=obj;
			obj.scale.set(0.017,0.017,0.017);
		}
	});
	setupModelAnimations(soldier);
});

export default soldier;