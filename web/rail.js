// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import { Vector3, MeshBasicMaterial, TubeGeometry, Curve, Mesh, Object3D } from './three/build/three.module.js';

class HelixCurve extends Curve {
    constructor() {super();}
    getPoint(t, optionalTarget ) {
        var point = optionalTarget || new Vector3();
        var a = 0.2; // radius
        var b = 125; // length
        var t2 = 2 * Math.PI * t * b / 3;
        var x = Math.cos( t2 ) * a;
        var y = Math.sin( t2 ) * a;
        var z = b * t;
        return point.set( x, y, z );
    }
}

var helix = new HelixCurve();
var helixGeometry = new TubeGeometry( helix, 300, 0.1, 12, false );

class Rail extends Object3D {
    constructor(){
        super();
        var helixMaterial = new MeshBasicMaterial( { color: 0x0000dd, opacity: 0.5, transparent: true } );
        var helixMesh = new Mesh( helixGeometry, helixMaterial );
        helixMesh.rotation.z += Math.PI + 0.7;
        this.add(helixMesh);
        this.helixMesh = helixMesh;
        this.update = delayedRemove;
    }
}

var cache = [];

function getRail() {
    if( cache.length>0) {
        //console.log("rail from cache");
        return cache.pop();
    } else {
        //console.log("new rail");
        return new Rail();
    }
}

function returnRail(rail) {
    //console.log("rail returned");
    cache.push(rail);
}

function delayedRemove(scene, delta, elapsed) {
    if(this.time + 1.5 < elapsed) {
        if(!scene.remove_me)
            scene.remove_me=[];
        scene.remove_me.push(this);
        returnRail(this);
    }
}

export {getRail, returnRail}

