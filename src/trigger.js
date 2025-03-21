// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

import {Vector3, Plane, Geometry, Face3, Group, Mesh, BufferGeometry} from './three/build/three.module.js';
import { Brush } from './lib/Brush.js';
import { CustomOctree } from './lib/CustomOctree.js';
// important: the map json data must include brushes
// important: the map json data brushes must be in order: x,z,y
// important: the map json data brushes must be in quake scale (everything 26 times bigger )
import q3dm17 from './models/q3dm17.js';


/**
 * @param {string[]} mapDef 
 * @returns {Brush}
 */
function getBrushFromMapDef(mapDef, userData) {
    var planes = [];
    mapDef.plane_count |= 0; // turn to int
    for(var i=0; i<mapDef.plane_count; i++) {
        var plane = mapDef["plane"+i];
        var [,p1x,p1z,p1y,,,p2x,p2z,p2y,,,p3x,p3z,p3y] = plane.split(" ");
        var p = new Plane().setFromCoplanarPoints(new Vector3(p1x,p1y,p1z).multiplyScalar(0.038), new Vector3(p2x,p2y,p2z).multiplyScalar(0.038), new Vector3(p3x,p3y,p3z).multiplyScalar(0.038))
        planes.push(p);
    }
    return new Brush(planes, userData);
}

function getTriggerBrushes(brushes, classname) {
    for( var t=0; t<q3dm17[classname].length; t++) {
        var mapDef = q3dm17[classname][t];
        brushes.push( getBrushFromMapDef(mapDef, mapDef)); // store mapDef also as userData, so we can get targetnames etc. later.
    }
}
/**
 * @returns {Brush[]}
 */
function getAllTriggerBrushes() {
    var brushes = [];
    getTriggerBrushes(brushes, 'trigger_push');
    getTriggerBrushes(brushes, 'trigger_hurt');
    getTriggerBrushes(brushes, 'trigger_teleport');
    return brushes;
}

function getTriggerOctree(scene) {
    const triggerBrushes = new Group();
    var brushes = getAllTriggerBrushes()
    for(var brush of brushes) {
        var geometry = new Geometry();
        var counter=0;
        const vertices = [];
        var polygons = brush.getPolygons();
        for(var p=0; p<polygons.length;p++) {
            //console.log("new face");
            var face = polygons[p];
            var current_counter_pos=counter;
            for( var i=0; i<face.length;i++) {
                var point = face[i];
                //console.log(point)
                //vertices.push( point.x, point.y, point.z );
                // Godot Debug Points
                // console.log('[node name="Position3D'+counter+'" type="Position3D" parent="."]');
                // console.log('transform = Transform( 1, 0, 0, 0, 1, 0, 0, 0, 1, '+point.x+', '+point.y+', '+point.z+' )');
                counter++;
                geometry.vertices.push(	point );
                if( i >=2 ) {
                    geometry.faces.push( new Face3(current_counter_pos, current_counter_pos+i-1, current_counter_pos+i) );
                }
            }
        }
        //var box = addDebugBox( scene, geometry)
        var m = new Mesh(new BufferGeometry().fromGeometry(geometry));
        m.userData = brush.userData;
        triggerBrushes.add( m );
    }

    const triggerOctree = new CustomOctree();
    triggerOctree.fromGraphNode(triggerBrushes);
    return triggerOctree;
}

var targets = {};
var targetsInit=false;
function getTargets() {
    if( !targetsInit ) {
        for( var tp of q3dm17.target_position) {
            //console.log(tp.targetname);
            targets[tp.targetname] = tp.origin;
        }
        targetsInit=true;
    }
    return targets;
}

/**
 * @param {Vector3} origin
 * @param {Vector3} target
 * @param {number} gravity
 */
function propel(origin, target, gravity) {
    var height = target.y - origin.y;
    var time = Math.sqrt(height / (0.5 * gravity));
    var origin2 = target.clone();
    origin2.sub(origin);
    origin2.y = 0.0;
    var dist = origin2.length();
    origin2.normalize();

    var forward = dist / time;
    origin2.multiplyScalar(forward);
    origin2.y = time * gravity;
    return origin2;
}

export {getTriggerBrushes, getTriggerOctree, getBrushFromMapDef, getTargets, propel};
