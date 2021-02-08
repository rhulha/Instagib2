import {soldier, Soldier, setupModelAnimations} from './soldier.js';
import {SkeletonUtils} from './three/examples/jsm/utils/SkeletonUtils.js';

class Enemy {
	constructor(id, name, room) {
		this.id = id;
		this.name = name;
		this.room = room;
		this.x = 0;
		this.y = 0;
		this.z = 0;
		this.rx = 0;
		this.ry = 0;
		this.soldier = new Soldier();
		this.soldier.glb = soldier.glb;
		this.soldier.glb.scene = SkeletonUtils.clone(soldier.glb.scene);
		 
		/*this.soldier.traverse((obj) => {
			if (obj.type === 'Object3D') {
				obj.scale.set(0.017, 0.017, 0.017);
				obj.updateMatrix();
				console.log("scale");
			}
		});*/
		//this.soldier.scale.set(0.017, 0.017, 0.017);
		//this.soldier.updateMatrix();
		setupModelAnimations(this.soldier);
	}
}

export {Enemy};
