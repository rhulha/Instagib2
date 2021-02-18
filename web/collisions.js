import { Vector3 } from './three/build/three.module.js';
import { getTargets, AimAtTarget } from './trigger.js';
import q3dm17 from './models/q3dm17.js';
import webSocket from './lib/webSocket.js';
import scene from './scene.js';
import powerups from './powerups.js';
import game from './setup.js';
import {updateFragsCounter} from './hud.js';
import { enemies, Enemy } from "./networking.js";

const GRAVITY = 30;
const QuakeScale = 0.038;
const playerHeight = 3.53; // a bit crazy? Shouldn't it be 2.13 from Quake3?
const playerRadius = 0.7;
const cameraHeight = playerHeight-playerRadius;

function checkPlayerPlayerCollisions(player) {
    for (var enemy_id in enemies) {
        /** @type {Enemy} */
        const enemy = enemies[enemy_id];
        const bottom = player.playerCollider.start.y - playerRadius;
        const top = player.playerCollider.end.y + playerRadius;
        // player.playerCollider.start - playerRadius is the location of our feet
        // enemy.p - playerRadius is the location of the enemy feet (lowest point)
        // enemy.p + playerHeight is the location of the enemy head (highest point)
        if (bottom < enemy.p.y + playerHeight // the player feet are below the enemy tip of the head
            && top > enemy.p.y - playerRadius) // and the player tip of the head is above the enemy feet
        {
            // at this point we have a potential collision since the player and the enemy are at the same height.
            // cameraHeight-playerRadius is the distance between the two points that make up the playerCollider capsule.
            if (player.playerCollider.start.y > enemy.p.y + cameraHeight - playerRadius) {
                // at this point the player feet sphere center is above the enemy head sphere center
                // remember that enemy.p is not a real Vector3
                enemy.p.y += cameraHeight - playerRadius;
                var dt = player.playerCollider.start.distanceTo(enemy.p);
                if (dt < playerRadius * 2) {
                    //console.log("collision detected");
                    player.playerVelocity.addScaledVector(player.tempVector, -player.tempVector.dot(player.playerVelocity));
                    player.playerCollider.translate(player.tempVector.multiplyScalar(playerRadius * 2 - dt));
                }
                enemy.p.y -= cameraHeight - playerRadius;
            } else if (player.playerCollider.end.y < enemy.p.y) {
                // at this point the player head sphere center is below the enemy feet sphere center
                var dt = player.playerCollider.end.distanceTo(enemy.p); // consider using dtSquared.
                if (dt < playerRadius * 2) {
                    //console.log("collision detected");
                    player.playerVelocity.addScaledVector(player.tempVector, -player.tempVector.dot(player.playerVelocity));
                    player.playerCollider.translate(player.tempVector.multiplyScalar(playerRadius * 2 - dt));
                }
            } else {
                // at this point we can do a simple cylinder collision check.
                // In other words we can check the distance between two spheres at the same height.
                var temp = enemy.p.y;
                enemy.p.y = player.playerCollider.start.y;
                var dt = player.playerCollider.start.distanceTo(enemy.p);
                if (dt < playerRadius * 2) {
                    //console.log("collision detected");
                    player.tempVector.copy(player.playerCollider.start).sub(enemy.p).normalize(); // build a normal from enemy sphere to player sphere 
                    player.playerVelocity.addScaledVector(player.tempVector, -player.tempVector.dot(player.playerVelocity));
                    player.playerCollider.translate(player.tempVector.multiplyScalar(playerRadius * 2 - dt));
                }
                enemy.p.y = temp;
            }
        }
    }
}

function checkTriggers(player) {
    const triggerResult = player.triggerOctree.capsuleIntersect(player.playerCollider);
    if (triggerResult) {
        if (triggerResult.userData.classname == "trigger_push") {
            var [x, z, y] = getTargets()[triggerResult.userData.target].split(" ");
            // TODO: I think this should be player.playerCollider.start. start is where the feet are...
            var vel = AimAtTarget(player.playerCollider.end, new Vector3(x, y, z).multiplyScalar(QuakeScale), GRAVITY);
            player.playerVelocity.copy(vel);
            player.game.audio.jumppad.play();
            player.playerOnFloor = false;
        } else if (triggerResult.userData.classname == "trigger_hurt") {
            fragSelf();
        } else if (triggerResult.userData.classname == "trigger_teleport") {
            // there is only one misc_teleporter_dest for all teleporters in q3dm17.
            player.game.audio.teleport.play();
            var dest = q3dm17.misc_teleporter_dest[0]; // TODO: fix this for other maps
            player.spawn(mtd.origin, dest.angle);
        }
    }
}

function checkWorld(player) {
    const result = player.worldOctree.capsuleIntersect(player.playerCollider);
    player.playerOnFloor = false;
    if (result) {
        player.playerOnFloor = result.normal.y > 0;
        if (!player.playerOnFloor) {
            player.playerVelocity.addScaledVector(result.normal, -result.normal.dot(player.playerVelocity));
        }
        player.playerCollider.translate(result.normal.multiplyScalar(result.depth));
    }
}

function checkPowerups(player) {
    for (var pu_name in powerups) {
        var pu = powerups[pu_name];
        //pu.updateMatrixWorld( true );
        player.tempBox.copy(pu.geometry.boundingBox).applyMatrix4(pu.matrixWorld);
        if (pu.visible && player.playerCollider.intersectsBox(player.tempBox)) {
            game.audio.powerup.play();
            pu.hideStart = scene.elapsed;
            pu.visible = false;
            player.frags += 3;
            webSocket.send({ cmd: "powerup", "name": pu.name });
            updateFragsCounter();
        }
    }
}

export {checkPlayerPlayerCollisions, checkTriggers, checkWorld, checkPowerups};
