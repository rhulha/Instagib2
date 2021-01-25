import {Vector3} from './three.module.js';

class Plane {
	normal;
    distance;
    
    constructor(p1,p2,p3) {
        // WARNING Three.js applies all math function to the "this" vector!
        this.normal = p3.sub(p2).cross( p1.sub(p2)).normalize();
		//normal = p3.minus(p1).cross( p2.minus(p1)).normalize();
		this.distance = -this.normal.dot( p1);
    }

    distance2point(p) {
		return this.normal.dot(p) + this.distance;
	}
}

class Brush {
    planes = [];
    polys = [];
    polysInitialized=false;
	epsilon = 1e-5;

    constructor(planes) {
		this.planes = planes;
		for (var i = 0; i < planes.length; i++) {
			this.polys.push([]);
		}
    }

    // public List<List<Vector3>> 
	getPolygons() {
        var planes = this.planes;
		if( this.polysInitialized ) {
			return this.polys;
		}
		var count = planes.length;
		for (var i = 0; i <= count - 3; i++) {
			for (var j = i; j <= count - 2; j++) {
				for (var k = j; k <= count - 1; k++) {
					if (i == j || j == k || i == k)
						continue;
					var intersection = this.getIntersection(planes[i], planes[j], planes[k]);
					if (intersection == null)
						continue;

					// System.out.println("i: " + intersection);
					var legal = true;
					for (var m = 0; m < count; m++) {
						// Test if the point is outside the brush
						var d = planes[m].distance2point(intersection);
						if (d > this.epsilon) {
							legal = false;
							//System.out.println("ILLEGAL: " + planes.get(m).toString2() + ", d: " + d + ", i: " + intersection);
							break;
						}
					}
					if (legal) {
						//System.out.println("LEG");
						this.polys[i].push(intersection); // Add vertex to
						this.polys[j].push(intersection); // 3 polygons
						this.polys[k].push(intersection); // at a time
					}
				}
			}
		}

		this.sortVerticesClockWise();
		this.polysInitialized=true;
		return this.polys;
	}

	getIntersection(a, b, c) {
		var denom = a.normal.dot(new Vector3().crossVectors(b.normal, c.normal));
		if (Math.abs(denom) < this.epsilon)
			return null;
		//System.out.println("a: " + a.toString2());
		//System.out.println("b: " + b.toString2());
		//System.out.println("c: " + c.toString2());
		// p = -d1 * ( n2.Cross ( n3 ) ) - d2 * ( n3.Cross ( n1 ) ) - d3 * ( n1.Cross ( n2 ) ) / denom;
		var temp1 = new Vector3().crossVectors(b.normal, c.normal).multiplyScalar(-a.distance);
		var temp2 = new Vector3().crossVectors(c.normal, a.normal).multiplyScalar(b.distance);
		var temp3 = new Vector3().crossVectors(a.normal, b.normal).multiplyScalar(c.distance);
		return temp1.sub(temp2).sub(temp3).divideScalar(denom);
	}

	sortVerticesClockWise() {
		for (var n = 0; n < this.polys.length; n++) {
			var polygon = this.polys[n];
			var plane = this.planes[n];

			var center = new Vector3(0, 0, 0);
			for (var point of polygon) {
				center.add(point);
			}
			center = center.divideScalar(polygon.length);

			//
			// Sort vertices
			//
			for (var i = 0; i < polygon.length - 2; i++) {
				var smallestAngle = -1;
				var smallest = -1;
				var a = new Vector3().subVectors(polygon[i], center).normalize();
				var p = new Plane(polygon[i], center, new Vector3().addVectors(center, plane.normal), "");

				for (var j = i + 1; j < polygon.length; j++) {
					var d = p.distance2point(polygon[j]);
					if (d > -this.epsilon) {
						var b = new Vector3().subVectors(polygon[j], center).normalize();
						var angle = a.dot(b);
						if (angle > smallestAngle) {
							smallestAngle = angle;
							smallest = j;
						}
					}
				}

				if (smallest == -1) {
					console.log("Error: Degenerate polygon!");
					return;
				}

				var t = polygon[smallest];
				polygon[smallest] = polygon[i + 1];
				polygon[i + 1] = t;
			}

		}
	}
}

export {Plane, Brush};
