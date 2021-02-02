/**
 * @param {Vector3} origin
 * @param {Vector3} target
 * @param {number} gravity
 */
function AimAtTarget(origin, target, gravity) {
    var height = target.y - origin.y;
    var time = Math.sqrt(height / (0.5 * gravity));
    // set origin2 to the push velocity
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

export {AimAtTarget};
