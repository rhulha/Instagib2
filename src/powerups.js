// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import {Vector3, TorusKnotGeometry, MeshNormalMaterial, Mesh, Clock, MathUtils} from './three/build/three.module.js';
import q3dm17 from './models/q3dm17.js';
import scene from './scene.js';

const clock = new Clock();

//const geoKnot = new TorusKnotGeometry( 10, 3, 200, 16 );
const matKnot = new MeshNormalMaterial();

function addPowerup(quake_origin, name) {
    var [x,z,y] = quake_origin.split(" ");
    var item_pos = new Vector3(x,y,z).multiplyScalar(0.038);
    const geoKnot = new TorusKnotGeometry( 10, 3, 200, 16 );
    var meshKnot = new Mesh( geoKnot, matKnot );
    meshKnot.name = name;
    meshKnot.scale.multiplyScalar(0.05);
    meshKnot.position.copy(item_pos);
    meshKnot.position.y+=1.5;
    meshKnot.hideStart = clock.getElapsedTime();
    meshKnot.update=function(scene, deltaTime, elapsed) {
        this.rotation.y += deltaTime;
        if(this.hideStart + 30 < elapsed) {
            this.visible=true;
        }
    }
    geoKnot.computeBoundingBox();
    scene.add( meshKnot );
    meshKnot.visible = false;
    //const box = new BoxHelper( meshKnot );
    //box.update = undefined;
    //scene.add( box );
    return meshKnot;
}

const p1 = addPowerup(q3dm17.weapon_railgun[0].origin, "powerup@rail");
const p2 = addPowerup(q3dm17.item_health_mega[0].origin, "powerup@mega");
const p3 = addPowerup(q3dm17.item_quad[0].origin, "powerup@quad");

const powerups ={};
powerups[p1.name]=p1;
powerups[p2.name]=p2;
powerups[p3.name]=p3;

export default powerups;


