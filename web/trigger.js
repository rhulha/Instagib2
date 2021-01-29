import {Vector3, Plane, Geometry, Face3, Group, Mesh, BufferGeometry} from './three/build/three.module.js';
import { Brush } from './Brush.js';
import { addDebugPoints, addDebugBox } from './addPoints.js';
import { CustomOctree } from './CustomOctree.js';

var t93 = [
    "( 2488 256 268 ) ( 2360 256 188 ) ( 2360 384 188 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
    "( 2360 384 180 ) ( 2360 384 164 ) ( 2488 384 164 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
    "( 2480 384 260 ) ( 2480 384 220 ) ( 2480 256 220 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
    "( 2360 256 -4 ) ( 2360 256 4 ) ( 2488 256 4 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
    "( 2360 256 180 ) ( 2360 256 148 ) ( 2360 384 148 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
    "( 2360 256 164 ) ( 2488 256 220 ) ( 2488 384 220 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0"
];

// t91 skipped

var t89 = [
    "( -328 564 580 ) ( -440 564 580 ) ( -440 440 644 ) common/trigger 0 -31 -180 0.500000 0.500000 0 0 0",
    "( -320 450 652 ) ( -448 450 652 ) ( -448 578 588 ) common/trigger 0 -31 -180 0.500000 0.500000 0 0 0",
    "( -440 558 580 ) ( -328 558 580 ) ( -328 558 596 ) common/trigger 0 0 -180 0.500000 -0.500000 0 0 0",
    "( -440 576 584 ) ( -440 448 584 ) ( -440 448 -1288 ) common/trigger 0 0 -180 0.500000 -0.500000 0 0 0",
    "( -328 440 650 ) ( -440 440 650 ) ( -440 440 664 ) common/trigger 0 0 -180 0.500000 -0.500000 0 0 0",
    "( -328 454 616 ) ( -328 582 616 ) ( -328 582 -1256 ) common/trigger 0 0 -180 0.500000 -0.500000 0 0 0",
];

var t88 = [
    "( -440 -440 580 ) ( -328 -440 580 ) ( -328 -314 642 ) common/trigger 0 0 0 0.500000 0.500000 0 0 0",
    "( -328 -444 592 ) ( -440 -444 592 ) ( -440 -316 654 ) common/trigger 0 0 0 0.500000 0.500000 0 0 0",
    "( -328 -432 584 ) ( -440 -432 584 ) ( -440 -436 596 ) common/trigger 0 0 0 0.500000 0.500000 0 0 0",
    "( -328 -448 584 ) ( -328 -320 584 ) ( -328 -320 -1288 ) common/trigger 0 0 0 0.500000 0.500000 0 0 0",
    "( -440 -314 644 ) ( -328 -314 644 ) ( -328 -316 652 ) common/trigger 0 0 0 0.500000 0.500000 0 0 0",
    "( -440 -320 584 ) ( -440 -448 584 ) ( -440 -448 -1288 ) common/trigger 0 0 0 0.500000 0.500000 0 0 0"
];

var t87 = [
    "( -776 144 752 ) ( -776 -16 752 ) ( -624 -16 624 ) common/trigger 15 0 -180 0.500000 0.500000 0 0 0",
    "( -592 136 606 ) ( -592 -8 606 ) ( -776 -8 794 ) common/trigger 15 -4 -180 0.500000 0.500000 0 0 0",
    "( -632 144 666 ) ( -760 144 666 ) ( -760 144 658 ) common/trigger 15 3 -180 0.500000 -0.500000 0 0 0",
    "( -776 -16 752 ) ( -776 144 752 ) ( -784 144 800 ) common/trigger 0 4 -180 0.500000 -0.500000 0 0 0",
    "( -760 -16 658 ) ( -632 -16 658 ) ( -632 -16 650 ) common/trigger 15 3 -180 0.500000 -0.500000 0 0 0",
    "( -624 0 658 ) ( -624 136 658 ) ( -624 136 650 ) common/trigger 0 4 -180 0.500000 -0.500000 0 0 0",
];

var t92 = [
    "( 1216 8 48 ) ( 1216 120 48 ) ( 1080 120 0 ) common/trigger 16 0 0 0.500000 0.500000 0 0 0",
    "( 1208 128 80 ) ( 1208 0 80 ) ( 1080 0 16 ) common/trigger 16 0 0 0.500000 0.500000 0 0 0",
    "( 1080 0 8 ) ( 1208 0 8 ) ( 1208 0 0 ) common/trigger 16 -16 0 0.500000 0.500000 0 0 0",
    "( 1216 120 48 ) ( 1216 8 48 ) ( 1216 8 80 ) common/trigger 0 -16 0 0.500000 0.500000 0 0 0",
    "( 1208 128 8 ) ( 1080 128 8 ) ( 1080 128 0 ) common/trigger 16 -16 0 0.500000 0.500000 0 0 0",
    "( 1080 128 8 ) ( 1080 0 8 ) ( 1080 0 0 ) common/trigger 0 -16 0 0.500000 0.500000 0 0 0"
]

// t90 skipped

var t86 = [
    "( 256 128 100 ) ( 128 128 100 ) ( 128 0 100 ) common/trigger 7 0 -90 0.500000 0.500000 0 0 0",
    "( 124 132 104 ) ( 260 132 104 ) ( 260 -4 104 ) common/trigger 7 0 -90 0.500000 0.500000 0 0 0",
    "( 124 -4 104 ) ( 260 -4 104 ) ( 256 0 100 ) common/trigger -25 0 -90 0.500000 0.500000 0 0 0",
    "( 260 0 104 ) ( 260 128 104 ) ( 256 128 100 ) common/trigger -25 0 -90 0.500000 0.500000 0 0 0",
    "( 260 132 104 ) ( 124 132 104 ) ( 128 128 100 ) common/trigger -25 0 -90 0.500000 0.500000 0 0 0",
    "( 124 128 104 ) ( 124 0 104 ) ( 128 0 100 ) common/trigger -25 0 -90 0.500000 0.500000 0 0 0"
];

var t85 = [
    "( 108 128 -4 ) ( -20 128 -4 ) ( -20 -8 -4 ) common/trigger 8 0 0 0.500000 0.500000 0 0 0",
    "( 108 128 100 ) ( 108 0 100 ) ( -20 0 -28 ) common/trigger 8 0 0 0.500000 0.500000 0 0 0",
    "( -20 8 -4 ) ( 108 8 -4 ) ( 108 8 -12 ) common/trigger 8 -8 0 0.500000 0.500000 0 0 0",
    "( 116 0 124 ) ( 116 128 124 ) ( 116 128 -12 ) common/trigger 0 -8 0 0.500000 0.500000 0 0 0",
    "( 108 120 -4 ) ( -20 120 -4 ) ( -20 120 -12 ) common/trigger 8 -8 0 0.500000 0.500000 0 0 0",
    "( -20 128 -4 ) ( -20 -8 -4 ) ( -20 -8 -12 ) common/trigger 0 -8 0 0.500000 0.500000 0 0 0"
]

var t82 = [
    "( 256 148 -20 ) ( 256 276 -20 ) ( 120 276 -20 ) common/trigger -7 0 90 0.500000 0.500000 0 0 0",
    "( 256 148 100 ) ( 128 148 100 ) ( 128 276 -28 ) common/trigger -7 0 90 0.500000 0.500000 0 0 0",
    "( 136 276 -20 ) ( 136 148 -20 ) ( 136 148 -28 ) common/trigger -8 -8 0 0.500000 0.500000 0 0 0",
    "( 128 140 108 ) ( 256 140 108 ) ( 256 140 -28 ) common/trigger 0 -8 -180 0.500000 -0.500000 0 0 0",
    "( 248 148 -20 ) ( 248 276 -20 ) ( 248 276 -28 ) common/trigger -8 -8 0 0.500000 0.500000 0 0 0",
    "( 256 276 -20 ) ( 120 276 -20 ) ( 120 276 -28 ) common/trigger 0 -8 -180 0.500000 -0.500000 0 0 0"
];

var t84 = [
    "( 276 0 -4 ) ( 404 0 -4 ) ( 404 136 -4 ) common/trigger 7 0 -180 0.500000 0.500000 0 0 0",
    "( 276 0 100 ) ( 276 128 100 ) ( 404 128 -28 ) common/trigger 7 0 -180 0.500000 0.500000 0 0 0",
    "( 404 120 -4 ) ( 276 120 -4 ) ( 276 120 -12 ) common/trigger 8 -7 -180 0.500000 -0.500000 0 0 0",
    "( 268 128 124 ) ( 268 0 124 ) ( 268 0 -12 ) common/trigger 0 -8 -180 0.500004 -0.500000 0 0 0",
    "( 276 8 -4 ) ( 404 8 -4 ) ( 404 8 -12 ) common/trigger 8 -7 -180 0.500000 -0.500000 0 0 0",
    "( 404 0 -4 ) ( 404 136 -4 ) ( 404 136 -12 ) common/trigger 0 -8 -180 0.500000 -0.500000 0 0 0"
];

var t83 = [
    "( 128 -20 -20 ) ( 128 -148 -20 ) ( 264 -148 -20 ) common/trigger -9 0 -90 0.500000 0.500000 0 0 0",
    "( 128 -20 100 ) ( 256 -20 100 ) ( 256 -148 -28 ) common/trigger -9 0 -90 0.500000 0.500000 0 0 0",
    "( 248 -148 -20 ) ( 248 -20 -20 ) ( 248 -20 -28 ) common/trigger -7 -10 -180 0.500000 -0.500000 0 0 0",
    "( 256 -12 108 ) ( 128 -12 108 ) ( 128 -12 -28 ) common/trigger 0 -8 0 0.500000 0.500000 0 0 0",
    "( 136 -20 -20 ) ( 136 -148 -20 ) ( 136 -148 -28 ) common/trigger -7 -10 -180 0.500000 -0.500000 0 0 0",
    "( 128 -148 -20 ) ( 264 -148 -20 ) ( 264 -148 -28 ) common/trigger 0 -8 0 0.500000 0.500000 0 0 0"
];

var t94 = [
	"( 2488 -256 268 ) ( 2360 -256 188 ) ( 2360 -128 188 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
	"( 2360 -128 180 ) ( 2360 -128 164 ) ( 2488 -128 164 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
	"( 2480 -128 260 ) ( 2480 -128 220 ) ( 2480 -256 220 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
	"( 2360 -256 -4 ) ( 2360 -256 4 ) ( 2488 -256 4 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
	"( 2360 -256 180 ) ( 2360 -256 148 ) ( 2360 -128 148 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0",
	"( 2360 -256 164 ) ( 2488 -256 220 ) ( 2488 -128 220 ) common/trigger 0 0 0 0.500000 0.500000 134217728 0 0"
];

var trigger_push = [t93, t89, t88, t87, t92, t86, t85, t82, t84, t83, t94];
var trigger_targets = ['t93', 't89', 't88', 't87', 't92', 't86', 't85', 't82', 't84', 't83', 't94'];

/**
 * @param {string[]} mapDef 
 * @returns {Brush}
 */
function getBrushFromMapDef(mapDef, name) {
    var planes = [];
    for(var plane of mapDef) {
        var p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z;
        [,p1x,p1z,p1y,,,p2x,p2z,p2y,,,p3x,p3z,p3y] = plane.split(" ");
        var p = new Plane().setFromCoplanarPoints(new Vector3(p1x,p1y,p1z).multiplyScalar(0.038), new Vector3(p2x,p2y,p2z).multiplyScalar(0.038), new Vector3(p3x,p3y,p3z).multiplyScalar(0.038))
        planes.push(p);
    }
    return new Brush(planes, name);
}

/**
 * @returns {Brush[]}
 */
function getTriggerBrushes() {
    var brushes = [];
    for( var t=0; t<trigger_push.length; t++) {
        var mapDef = trigger_push[t];
        brushes.push( getBrushFromMapDef(mapDef, trigger_targets[t]));
    }
    return brushes;
}

function getTriggerOctree(scene) {
    const jumpPadsGroup = new Group();
    var brushes = getTriggerBrushes()
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
        var box = addDebugBox( scene, geometry)
        var m = new Mesh(new BufferGeometry().fromGeometry(geometry), box.material);
        m.name = brush.name;
        jumpPadsGroup.add( m );

    }

    const jumpPadsOctree = new CustomOctree();
    jumpPadsOctree.fromGraphNode(jumpPadsGroup);
    return jumpPadsOctree;
}

export {getTriggerBrushes, getTriggerOctree, getBrushFromMapDef};
