const radians = (degrees) => degrees * Math.PI / 180;
const degrees = (radians) => radians * 180 / Math.PI;
const median = (items) => {
	let n = items.length;
	if (n == 0) {
		return 0;
	} else if (n%2 == 1) {
		return items[n/2];
	} else {
		const a = items[n/2-1];
		const b = items[n/2];
		return (a + b) / 2;
	}
}
const INF = 1e9;
const EPS = 1e-9;
//
// https://github.com/fogleman/ln/blob/master/ln/axis.go
//
const axisNone = -1;
const axisX = 0;
const axisY = 1;
const axisZ = 2;
//  
// https://github.com/fogleman/ln/blob/master/ln/vector.go 
//
class Vector {
    constructor(x, y, z) {
    	this.x = x; this.y = y; this.z = z;
    }
    randomUnitVector() {
        let x, y, z;
    	do {
    		x = Math.ranomd()*2 - 1;
    		y = Math.ranomd()*2 - 1;
    		z = Math.ranomd()*2 - 1;
    	} while (x*x+y*y+z*z > 1);
    	return new Vector(x, y, z).normalize();
    }
    length() { return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z); }
    distance(b) { return this.sub(b).length(); }
    lengthSquared() { return this.x*this.x + this.y*this.y + this.z*this.z; }
    distanceSquared(b){ return this.sub(b).lengthSquared(); }
    dot(b) { return this.x*b.x + this.y*b.y + this.z*b.z; }
    cross(b) { 
        return new Vector(  this.y*b.z - this.z*b.y, 
                            this.z*b.x - this.x*b.z, 
                            this.x*b.y - this.y*b.x); }
    normalize() { return this.mulScalar(1/this.length()); }
    add(b) { return new Vector(this.x + b.x, this.y + b.y, this.z + b.z); }
    sub(b) { return new Vector(this.x - b.x, this.y - b.y, this.z - b.z); }
    mul(b) { return new Vector(this.x * b.x, this.y * b.y, this.z * b.z); }
    div(b) { return new Vector(this.x / b.x, this.y / b.y, this.z / b.z); }
    addScalar(b) { return new Vector(this.x + b, this.y + b, this.z + b); }
    subScalar(b) { return new Vector(this.x - b, this.y - b, this.z - b); }
    mulScalar(b) { return new Vector(this.x * b, this.y * b, this.z * b); }
    divScalar(b) { return new Vector(this.x / b, this.y / b, this.z / b); }
    min(b) { return new Vector(Math.min(this.x, b.x), Math.min(this.y, b.y), Math.min(this.z, b.z)); }
    max(b) { return new Vector(Math.max(this.x, b.x), Math.max(this.y, b.y), Math.max(this.z, b.z)); }
    minAxis() {
    	const x = Math.abs(this.x), y = Math.abs(this.y), z = Math.abs(this.z);
    	if (x <= y && x <= z) {
    		return new Vector(1, 0, 0);
    	} else if (y <= x && y <= z) {
    		return new Vector(0, 1, 0);
    	}
    	return new Vector(0, 0, 1);
    }
    minComponent() { return Math.min(Math.min(this.x, this.y), this.z); }
    segmentDistance(v, w) {
    	const l2 = v.distanceSquared(w)
    	if (l2 == 0) {
    		return this.distance(v);
    	}
    	const t = this.sub(v).dot(w.sub(v)) / l2;
    	if (t < 0) {
    		return this.distance(v);
    	}
    	if (t > 1){
    		return this.distance(w);
    	}
    	return v.add(w.sub(v).mulScalar(t)).distance(this);
    }
}

//
// https://github.com/fogleman/ln/blob/master/ln/matrix.go
//
class Matrix {
    constructor(x00, x01, x02, x03,
            	x10, x11, x12, x13,
	            x20, x21, x22, x23,
	            x30, x31, x32, x33) {
	               	this.x00=x00, this.x01=x01, this.x02=x02, this.x03=x03;
	               	this.x10=x10, this.x11=x11, this.x12=x12, this.x13=x13;
	               	this.x20=x20, this.x21=x21, this.x22=x22, this.x23=x23;
	               	this.x30=x30, this.x31=x31, this.x32=x32, this.x33=x33;
	            }
    translate(v) {
    	return Matrix.translate(v).mul(this);
    }
    scale(v) {
    	return Matrix.scale(v).mul(this);
    }
    rotate(v, a) {
    	return Matrix.rotate(v, a).mul(this);
    }
    frustum(l, r, b, t, n, f) {
    	return Matrix.frustum(l, r, b, t, n, f).mul(this);
    }
    orthographic(l, r, b, t, n, f) {
    	return Matrix.orthographic(l, r, b, t, n, f).mul(this);
    }
    perspective(fovy, aspect, near, far) {
    	return Matrix.perspective(fovy, aspect, near, far).mul(this);
    }
    mul(b) {
    	const m = new Matrix();
    	m.x00 = this.x00*b.x00 + this.x01*b.x10 + this.x02*b.x20 + this.x03*b.x30;
    	m.x10 = this.x10*b.x00 + this.x11*b.x10 + this.x12*b.x20 + this.x13*b.x30;
    	m.x20 = this.x20*b.x00 + this.x21*b.x10 + this.x22*b.x20 + this.x23*b.x30;
    	m.x30 = this.x30*b.x00 + this.x31*b.x10 + this.x32*b.x20 + this.x33*b.x30;
    	m.x01 = this.x00*b.x01 + this.x01*b.x11 + this.x02*b.x21 + this.x03*b.x31;
    	m.x11 = this.x10*b.x01 + this.x11*b.x11 + this.x12*b.x21 + this.x13*b.x31;
    	m.x21 = this.x20*b.x01 + this.x21*b.x11 + this.x22*b.x21 + this.x23*b.x31;
    	m.x31 = this.x30*b.x01 + this.x31*b.x11 + this.x32*b.x21 + this.x33*b.x31;
    	m.x02 = this.x00*b.x02 + this.x01*b.x12 + this.x02*b.x22 + this.x03*b.x32;
    	m.x12 = this.x10*b.x02 + this.x11*b.x12 + this.x12*b.x22 + this.x13*b.x32;
    	m.x22 = this.x20*b.x02 + this.x21*b.x12 + this.x22*b.x22 + this.x23*b.x32;
    	m.x32 = this.x30*b.x02 + this.x31*b.x12 + this.x32*b.x22 + this.x33*b.x32;
    	m.x03 = this.x00*b.x03 + this.x01*b.x13 + this.x02*b.x23 + this.x03*b.x33;
    	m.x13 = this.x10*b.x03 + this.x11*b.x13 + this.x12*b.x23 + this.x13*b.x33;
    	m.x23 = this.x20*b.x03 + this.x21*b.x13 + this.x22*b.x23 + this.x23*b.x33;
    	m.x33 = this.x30*b.x03 + this.x31*b.x13 + this.x32*b.x23 + this.x33*b.x33;
    	return m;
    }
    mulPosition(b) {
    	const x = this.x00*b.x + this.x01*b.y + this.x02*b.z + this.x03;
    	const y = this.x10*b.x + this.x11*b.y + this.x12*b.z + this.x13;
    	const z = this.x20*b.x + this.x21*b.y + this.x22*b.z + this.x23;
    	return new Vector(x, y, z);
    }
    mulPositionW(b) {
    	const x = this.x00*b.x + this.x01*b.y + this.x02*b.z + this.x03;
    	const y = this.x10*b.x + this.x11*b.y + this.x12*b.z + this.x13;
    	const z = this.x20*b.x + this.x21*b.y + this.x22*b.z + this.x23;
    	const w = this.x30*b.x + this.x31*b.y + this.x32*b.z + this.x33;
    	return new Vector(x / w, y / w, z / w);
    }
    mulDirection(b) {
    	const x = this.x00*b.x + this.x01*b.y + this.x02*b.z;
    	const y = this.x10*b.x + this.x11*b.y + this.x12*b.z;
    	const z = this.x20*b.x + this.x21*b.y + this.x22*b.z;
    	return new Vector(x, y, z).normalize();
    }
    mulRay(b) {
    	return new Ray(this.mulPosition(b.origin), this.mulDirection(b.direction));
    }
    mulBox(box) {
    	// http://dev.theomader.com/transform-bounding-boxes/
    	const r = new Vector(this.x00, this.x10, this.x20);
    	const u = new Vector(this.x01, this.x11, this.x21);
    	const b = new Vector(this.x02, this.x12, this.x22);
    	const t = new Vector(this.x03, this.x13, this.x23);
    	let xa = r.mulScalar(box.min.x);
    	let xb = r.mulScalar(box.max.x);
    	let ya = u.mulScalar(box.min.y);
    	let yb = u.mulScalar(box.max.y);
    	let za = b.mulScalar(box.min.z);
    	let zb = b.mulScalar(box.max.z);
    	const min = xa.min(xb).add(ya.min(yb)).add(za.min(zb)).add(t);
    	const max = xa.max(xb).add(ya.max(yb)).add(za.max(zb)).add(t);
    	return new Box(min, max);
    }
    transpose() {
    	return new Matrix(
    		this.x00, this.x10, this.x20, this.x30,
    		this.x01, this.x11, this.x21, this.x31,
    		this.x02, this.x12, this.x22, this.x32,
    		this.x03, this.x13, this.x23, this.x33);
    }
    determinant() {
    	return (this.x00*this.x11*this.x22*this.x33 - this.x00*this.x11*this.x23*this.x32 +
    		this.x00*this.x12*this.x23*this.x31 - this.x00*this.x12*this.x21*this.x33 +
    		this.x00*this.x13*this.x21*this.x32 - this.x00*this.x13*this.x22*this.x31 -
    		this.x01*this.x12*this.x23*this.x30 + this.x01*this.x12*this.x20*this.x33 -
    		this.x01*this.x13*this.x20*this.x32 + this.x01*this.x13*this.x22*this.x30 -
    		this.x01*this.x10*this.x22*this.x33 + this.x01*this.x10*this.x23*this.x32 +
    		this.x02*this.x13*this.x20*this.x31 - this.x02*this.x13*this.x21*this.x30 +
    		this.x02*this.x10*this.x21*this.x33 - this.x02*this.x10*this.x23*this.x31 +
    		this.x02*this.x11*this.x23*this.x30 - this.x02*this.x11*this.x20*this.x33 -
    		this.x03*this.x10*this.x21*this.x32 + this.x03*this.x10*this.x22*this.x31 -
    		this.x03*this.x11*this.x22*this.x30 + this.x03*this.x11*this.x20*this.x32 -
    		this.x03*this.x12*this.x20*this.x31 + this.x03*this.x12*this.x21*this.x30);
    }
    inverse() {
    	const m = new Matrix();
    	const d = this.determinant();
    	m.x00 = (this.x12*this.x23*this.x31 - this.x13*this.x22*this.x31 + this.x13*this.x21*this.x32 - this.x11*this.x23*this.x32 - this.x12*this.x21*this.x33 + this.x11*this.x22*this.x33) / d;
    	m.x01 = (this.x03*this.x22*this.x31 - this.x02*this.x23*this.x31 - this.x03*this.x21*this.x32 + this.x01*this.x23*this.x32 + this.x02*this.x21*this.x33 - this.x01*this.x22*this.x33) / d;
    	m.x02 = (this.x02*this.x13*this.x31 - this.x03*this.x12*this.x31 + this.x03*this.x11*this.x32 - this.x01*this.x13*this.x32 - this.x02*this.x11*this.x33 + this.x01*this.x12*this.x33) / d;
    	m.x03 = (this.x03*this.x12*this.x21 - this.x02*this.x13*this.x21 - this.x03*this.x11*this.x22 + this.x01*this.x13*this.x22 + this.x02*this.x11*this.x23 - this.x01*this.x12*this.x23) / d;
    	m.x10 = (this.x13*this.x22*this.x30 - this.x12*this.x23*this.x30 - this.x13*this.x20*this.x32 + this.x10*this.x23*this.x32 + this.x12*this.x20*this.x33 - this.x10*this.x22*this.x33) / d;
    	m.x11 = (this.x02*this.x23*this.x30 - this.x03*this.x22*this.x30 + this.x03*this.x20*this.x32 - this.x00*this.x23*this.x32 - this.x02*this.x20*this.x33 + this.x00*this.x22*this.x33) / d;
    	m.x12 = (this.x03*this.x12*this.x30 - this.x02*this.x13*this.x30 - this.x03*this.x10*this.x32 + this.x00*this.x13*this.x32 + this.x02*this.x10*this.x33 - this.x00*this.x12*this.x33) / d;
    	m.x13 = (this.x02*this.x13*this.x20 - this.x03*this.x12*this.x20 + this.x03*this.x10*this.x22 - this.x00*this.x13*this.x22 - this.x02*this.x10*this.x23 + this.x00*this.x12*this.x23) / d;
    	m.x20 = (this.x11*this.x23*this.x30 - this.x13*this.x21*this.x30 + this.x13*this.x20*this.x31 - this.x10*this.x23*this.x31 - this.x11*this.x20*this.x33 + this.x10*this.x21*this.x33) / d;
    	m.x21 = (this.x03*this.x21*this.x30 - this.x01*this.x23*this.x30 - this.x03*this.x20*this.x31 + this.x00*this.x23*this.x31 + this.x01*this.x20*this.x33 - this.x00*this.x21*this.x33) / d;
    	m.x22 = (this.x01*this.x13*this.x30 - this.x03*this.x11*this.x30 + this.x03*this.x10*this.x31 - this.x00*this.x13*this.x31 - this.x01*this.x10*this.x33 + this.x00*this.x11*this.x33) / d;
    	m.x23 = (this.x03*this.x11*this.x20 - this.x01*this.x13*this.x20 - this.x03*this.x10*this.x21 + this.x00*this.x13*this.x21 + this.x01*this.x10*this.x23 - this.x00*this.x11*this.x23) / d;
    	m.x30 = (this.x12*this.x21*this.x30 - this.x11*this.x22*this.x30 - this.x12*this.x20*this.x31 + this.x10*this.x22*this.x31 + this.x11*this.x20*this.x32 - this.x10*this.x21*this.x32) / d;
    	m.x31 = (this.x01*this.x22*this.x30 - this.x02*this.x21*this.x30 + this.x02*this.x20*this.x31 - this.x00*this.x22*this.x31 - this.x01*this.x20*this.x32 + this.x00*this.x21*this.x32) / d;
    	m.x32 = (this.x02*this.x11*this.x30 - this.x01*this.x12*this.x30 - this.x02*this.x10*this.x31 + this.x00*this.x12*this.x31 + this.x01*this.x10*this.x32 - this.x00*this.x11*this.x32) / d;
    	m.x33 = (this.x01*this.x12*this.x20 - this.x02*this.x11*this.x20 + this.x02*this.x10*this.x21 - this.x00*this.x12*this.x21 - this.x01*this.x10*this.x22 + this.x00*this.x11*this.x22) / d;
    	return m;
    }
    static identity() {
    	return new Matrix(
    		1, 0, 0, 0,
    		0, 1, 0, 0,
    		0, 0, 1, 0,
    		0, 0, 0, 1);
    }
    static translate(v) {
    	return new Matrix(
    		1, 0, 0, v.x,
    		0, 1, 0, v.y,
    		0, 0, 1, v.z,
    		0, 0, 0, 1);
    }
    static scale(v) {
    	return new Matrix(
    		v.x, 0, 0, 0,
    		0, v.y, 0, 0,
    		0, 0, v.z, 0,
    		0, 0, 0, 1);
    }
    static rotate(v, a) {
    	v = v.normalize();
    	const s = Math.sin(a);
    	const c = Math.cos(a);
    	const m = 1 - c;
    	return new Matrix(
    		m*v.x*v.x + c, m*v.x*v.y + v.z*s, m*v.z*v.x - v.y*s, 0,
    		m*v.x*v.y - v.z*s, m*v.y*v.y + c, m*v.y*v.z + v.x*s, 0,
    		m*v.z*v.x + v.y*s, m*v.y*v.z - v.x*s, m*v.z*v.z + c, 0,
    		0, 0, 0, 1);
    }
    static frustum(l, r, b, t, n, f) {
    	const t1 = 2 * n;
    	const t2 = r - l;
    	const t3 = t - b;
    	const t4 = f - n;
    	return new Matrix(
    		t1 / t2, 0, (r + l) / t2, 0,
    		0, t1 / t3, (t + b) / t3, 0,
    		0, 0, (-f - n) / t4, (-t1 * f) / t4,
    		0, 0, -1, 0);
    }
    static orthographic(l, r, b, t, n, f) {
    	return new Matrix(
    		2 / (r - l), 0, 0, -(r + l) / (r - l),
    		0, 2 / (t - b), 0, -(t + b) / (t - b),
    		0, 0, -2 / (f - n), -(f + n) / (f - n),
    		0, 0, 0, 1);
    }
    static perspective(fovy, aspect, near, far) {
    	const ymax = near * Math.tan(fovy*Math.PI/360);
    	const xmax = ymax * aspect;
    	return Matrix.frustum(-xmax, xmax, -ymax, ymax, near, far);
    }
    static lookAt(eye, center, up) {
    	up = up.normalize();
    	const f = center.sub(eye).normalize();
    	const s = f.cross(up).normalize();
    	const u = s.cross(f).normalize();
    	const m = new Matrix(
    		s.x, u.x, -f.x, eye.x,
    		s.y, u.y, -f.y, eye.y,
    		s.z, u.z, -f.z, eye.z,
    		0, 0, 0, 1,
    	);
    	return m.inverse();
    }
}
//  
// https://github.com/fogleman/ln/blob/master/ln/tree.go
//
class Tree {
    constructor(shapes) {
    	this.box = boxForShapes(shapes);
    	this.root = new Node(shapes);
    	this.root.split(0);
    }
    intersect(r) {
    	const i = this.box.intersect(r);
    	if (i.t2 < i.t1 || i.t2 <= 0) {
    		return noHit;
    	}
    	return this.root.intersect(r, i.t1, i.t2);
    }
}

class Node {
    constructor(shapes) {
    	this.axis =  axisNone
    	this.point = 0;
    	this.shapes = shapes;
    	this.left  = false;
    	this.right = false;
    }
    intersect(r, tmin, tmax) {
    	let tsplit = 0;
    	let leftFirst  = false;
    	switch (this.axis) {
        	case axisNone:
        		return this.intersectShapes(r);
        	case axisX:
        		tsplit = (this.point - r.origin.x) / r.direction.x;
        		leftFirst = (r.origin.x < this.point) || (r.origin.x == this.point && r.direction.x <= 0);
        	case axisY:
        		tsplit = (this.point - r.origin.y) / r.direction.y;
        		leftFirst = (r.origin.y < this.point) || (r.origin.y == this.point && r.direction.y <= 0);
        	case axisZ:
        		tsplit = (this.point - r.origin.z) / r.direction.z;
        		leftFirst = (r.origin.z < this.point) || (r.origin.z == this.point && r.direction.z <= 0);
    	}
    	let first, second;
    	if (leftFirst) {
    		first = this.left;
    		second = this.right;
    	} else {
    		first = this.right;
    		second = this.left;
    	}
    	if (tsplit > tmax || tsplit <= 0) {
    		return first.intersect(r, tmin, tmax);
    	} else if (tsplit < tmin) {
    		return second.intersect(r, tmin, tmax);
    	} else {
    		const h1 = first.intersect(r, tmin, tsplit);
    		if (h1.t <= tsplit) {
    			return h1;
    		}
    		const h2 = second.intersect(r, tsplit, Math.min(tmax, h1.t));
    		if (h1.t <= h2.t) {
    			return h1;
    		} else {
    			return h2;
    		}
    	}
    }
    intersectShapes(r) {
    	let hit = noHit;
    	for (const _ in this.shapes) {
    	    const shape = this.shapes[_];
    		const h = shape.intersect(r);
    		if (h.t < hit.t ){
    			hit = h;
    		}
    	}
    	return hit;
    }
    partitionScore(axis, point) {
    	let left = 0, right = 0;
    	for (const _ in this.shapes) {
    	    const shape = this.shapes[_];
    		const box = shape.boundingBox();
    		const p = box.partition(axis, point);
    		if (p.left) {
    			left++;
    		}
    		if (p.right) {
    			right++;
    		}
    	}
    	if (left >= right) {
    		return left;
    	} else {
    		return right;
    	}
    }
    partition(size, axis, point) {
        const left = [], right = [];
        for (const _ in this.shapes) {
            const shape = this.shapes[_];
            const box = shape.boundingBox();
            const p = box.partition(axis, point);
            if (p.left) {
                left.push(shape);
            }
            if (p.right) {
                right.push(shape);
            }
        }
        return { left, right };
    }
    split(depth) {
        if (this.shapes.length < 8) {
            return;
        }
        const xs = [], ys = [], zs = [];
        for (const _ in this.shapes) {
            const shape = this.shapes[_];
            const box = shape.boundingBox();
            xs.push(box.min.x);
            xs.push(box.max.x);
            ys.push(box.min.y);
            ys.push(box.max.y);
            zs.push(box.min.z);
            zs.push(box.max.z);
        }
        xs.sort();
        ys.sort();
        zs.sort();
        const mx = median(xs), my = median(ys), mz = median(zs);
        let best = Math.floor(this.shapes.length * 0.85);
        let bestAxis = axisNone;
        let bestPoint = 0.0;
        const sx = this.partitionScore(axisX, mx);
        if (sx < best) {
            best = sx;
            bestAxis = axisX;
            bestPoint = mx;
        }
        const sy = this.partitionScore(axisY, my);
        if (sy < best) {
            best = sy;
            bestAxis = axisY;
            bestPoint = my;
        }
        const sz = this.partitionScore(axisZ, mz);
        if (sz < best) {
            best = sz;
            bestAxis = axisZ;
            bestPoint = mz;
        }
        if (bestAxis == axisNone) {
            return;
        }
        const p = this.partition(best, bestAxis, bestPoint)
        this.axis = bestAxis;
        this.point = bestPoint;
        this.left = new Node(p.left);
        this.right = new Node(p.right);
        this.left.split(depth + 1);
        this.right.split(depth + 1);
        this.shapes = false; // only needed at leaf nodes
    }
}
//  
// https://github.com/fogleman/ln/blob/master/ln/shape.go
//
class TransformedShape {
    constructor(shape, matrix) {
        this.shape = shape;
        this.matrix = matrix;
        this.inverse = matrix.inverse();
    }
    compile() {
        this.shape.compile();
    }
    boundingBox() {
        return this.matrix.mulBox(this.shape.boundingBox());
    }
    contains(v, f) {
        return this.shape.contains(this.inverse.mulPosition(v), f);
    }
    intersect(r) {
        return this.shape.intersect(this.inverse.mulRay(r));
    }
    paths() {
        return this.shape.paths().transform(this.matrix);
    }
}
//  
// https://github.com/fogleman/ln/blob/master/ln/scene.go
//
class Scene {
    constructor() {
        this.shapes = [];
        this.tree = false;
    }
    compile() {
        for (const _ in this.shapes) {
            const shape = this.shapes[_];
            shape.compile()
        }
        if (!this.tree) {
            this.tree = new Tree(this.shapes);
        }
    }
    add(shapes) {
        if(Array.isArray(shapes)) {
            this.shapes = [...this.shapes, ...shapes];
        } else {
            this.shapes.push(shapes);
        }
    }
    intersect(r) {
        return this.tree.intersect(r);
    }
    visible(eye, point) {
        const v = eye.sub(point);
        const r = new Ray(point, v.normalize());
        const hit = this.intersect(r);
        return (hit.t >= v.length());
    }
    paths(p = -1) {
        if (p >= 0) {
            if (p < this.shapes.length) {
                return this.shapes[p].paths();
            } else {
                return false;
            }
        } else {
            let result = new Paths();
            for (const _ in this.shapes) {
                const shape = this.shapes[_];
                result.append(shape.paths().v);
            }
            return result;
        }
    }
    render(eye, center, up, width, height, fovy, near, far, step, p = -1) {
        const aspect = width / height;
        let matrix = Matrix.lookAt(eye, center, up);
        matrix = matrix.perspective(fovy, aspect, near, far);
        return this.renderWithMatrix(matrix, eye, width, height, step, p);
    }
    renderWithMatrix(matrix, eye, width, height, step, p = -1) {
        if (p <= 0) {
            this.compile();
        }
        let paths = this.paths(p);
        if (!paths) {
            return false;
        }
        if (step > 0) {
            paths = paths.chop(step);
        }
        paths = paths.filter(new ClipFilter(matrix, eye, this));
        if (step > 0) {
            paths = paths.simplify(1e-6);
        }
        matrix = Matrix.scale(new Vector(-width / 2, -height / 2, 0));
        paths = paths.transform(matrix);
        return paths;
    }
}
//
// https://github.com/fogleman/ln/blob/master/ln/ray.go
//
class Ray {
    constructor(origin, direction) {
        this.origin = origin;
        this.direction = direction;
    }
    position(t) {
        return this.origin.add(this.direction.mulScalar(t));
    }
}
//
// https://github.com/fogleman/ln/blob/master/ln/path.go
//
class Path {
    constructor(v = []) {
        this.v = v;
    }
    append(v) {
        if (Array.isArray(v)) {
            this.v = this.v.concat(v);
        } else {
            this.v.push(v);
        }
    }
    boundingBox() {
        let box = new Box(this.v[0], this.v[0]);
        for (const _ in this.v) {
            const v = this.v[_];
            box = box.extend(new Box(v, v));
        }
        return box
    }
    transform(matrix) {
        const result = new Path();
        for (const _ in this.v) {
            const v = this.v[_];
            result.append(matrix.mulPosition(v));
        }
        return result;
    }
    chop(step) {
        const result = new Path();
        for (let i = 0; i < this.v.length-1; i++) {
            const a = this.v[i];
            const b = this.v[i+1];
            const v = b.sub(a);
            const l = v.length();
            if (i == 0) {
                result.append(a);
            }
            for (let d = step;d < l; d += step) {
                result.append(a.add(v.mulScalar(d/l)));
            }
            result.append(b);
        }
        return result;
    }
    filter(f) {
        const result = new Paths();
        let path = new Path();
        for (const _ in this.v) {
            const v = this.v[_];
            const fr = f.filter(v);
            if (fr.ok || (DRAW_HIDDEN_LINES && _%8 < 4)) { // show hidden lines
                path.append(fr.w);
            } else {
                if (path && path.v.length > 1) {
                    result.append(path);
                }
                path = new Path();
            }
        }
        if (path && path.v.length > 1) {
            result.append(path);
        }
        return result;
    }
    simplify(threshold) {
        if (this.v.length < 3) {
            return this;
        }
        const a = this.v[0];
        const b = this.v[this.v.length-1];
        let index = -1;
        let distance = 0.0;
        for (let i = 1; i < this.v.length-1; i++) {
            const d = this.v[i].segmentDistance(a, b);
            if (d > distance) {
                index = i;
                distance = d;
            }
        }
        if (distance > threshold) {
            const r1 = new Path(this.v.slice(0, index+1)).simplify(threshold);
            const r2 = new Path(this.v.slice(index)).simplify(threshold);
            return new Path([...r1.v.slice(0, r1.v.length-1), ...r2.v]);
        } else {
            return new Path([a, b]);
        }
    }
}

class Paths {
    constructor(v = []) {
        this.v = v;
    }
    append(v) {
        if (Array.isArray(v)) {
            this.v = this.v.concat(v);   
        } else {
            this.v.push(v);
        }
    }
    boundingBox() {
        let box = this.v[0].boundingBox();
        for (const _ in this.v) {
            const path = this.v[_];
            box = box.extend(path.boundingBox());
        }
        return box;
    }
    transform(matrix) {
        const result = new Paths();
        for (const _ in this.v) {
            const path = this.v[_];
            result.append(path.transform(matrix));
        }
        return result;
    }
    chop(step) {
        const result = new Paths();
        for (const _ in this.v) {
            const path = this.v[_];
            result.append(path.chop(step));
        }
        return result;
    }
    filter(f) {
        const result = new Paths();
        for (const _ in this.v) {
            const path = this.v[_];
            result.append(path.filter(f).v);
        }
        return result;
    }
    simplify(threshold) {
        const result = new Paths();
        for (const _ in this.v) {
            const path = this.v[_];
            result.append(path.simplify(threshold));
        }
        return result;
    }
}
//
// https://github.com/fogleman/ln/blob/master/ln/box.go
//
class Box {
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
    anchor(anchor) { return this.min.add(this.size().mul(anchor)); }
    center() { return this.anchor(new Vector(0.5, 0.5, 0.5)); }
    size() { return this.max.sub(a.min); }
    contains(b) {
        return this.min.x <= b.x && this.max.x >= b.x &&
            this.min.y <= b.y && this.max.y >= b.y &&
            this.min.z <= b.z && this.max.z >= b.z;
    }
    extend(b) { return new Box(this.min.min(b.min), this.max.max(b.max)); }
    intersect(r) {      
        let x1 = (this.min.x - r.origin.x) / r.direction.x;
        let y1 = (this.min.y - r.origin.y) / r.direction.y;
        let z1 = (this.min.z - r.origin.z) / r.direction.z;
        let x2 = (this.max.x - r.origin.x) / r.direction.x;
        let y2 = (this.max.y - r.origin.y) / r.direction.y;
        let z2 = (this.max.z - r.origin.z) / r.direction.z;
        if (x1 > x2) {
            const tmp = x1; x1 = x2, x2 = tmp;
        }
        if (y1 > y2) {
            const tmp = y1; y1 = y2, y2 = tmp;
        }
        if (z1 > z2) {
            const tmp = z1; z1 = z2, z2 = tmp;
        }
        const t1 = Math.max(Math.max(x1, y1), z1);
        const t2 = Math.min(Math.min(x2, y2), z2);
        return {t1, t2};
    }
    partition(axis, point) {
        let left, right;
        switch (axis) {
            case axisX:
                left = this.min.x <= point;
                right = this.max.x >= point;
            case axisY:
                left = this.min.y <= point;
                right = this.max.y >= point;
            case axisZ:
                left = this.min.z <= point;
                right = this.max.z >= point;
        }
        return {left, right};
    }
}
function boxForShapes(shapes) {
    if (shapes.length == 0) {
        return new Box();
    }
    let box = shapes[0].boundingBox();
    for (const _ in shapes) {
        const shape = shapes[_];
        box = box.extend(shape.boundingBox());
    }
    return box;
}
function boxForTriangles(shapes) {
    if (shapes.length == 0) {
        return new Box();
    }
    let box = shapes[0].boundingBox();
    for (const _ in shapes) {
        const shape = shapes[_];
        box = box.extend(shape.boundingBox());
    }
    return box;
}
function boxForVectors(vectors) {
    if (vectors.length == 0) {
        return new Box();
    }
    let min = vectors[0]
    let max = vectors[0]
    for (const _ in vectors) {
        const v = vectors[_];
        min = min.min(v);
        max = max.max(v);
    }
    return new Box(min, max);
}
//
// https://github.com/fogleman/ln/blob/master/ln/box.go
//
class Hit {
    constructor(shape, t) {
        this.shape = shape;
        this.t = t;
    }
    ok() {
        return this.t < INF;
    }
    min(b) {
        if (this.t <= b.t) {
            return this;
        }
        return b;
    }
    max(b) {
        if (this.t > b.t) {
            return a;
        }
        return b;
    }
}
const noHit = new Hit(false, INF);
//
// https://github.com/fogleman/ln/blob/master/ln/filter.go
//
const clipBox = new Box(new Vector(-1, -1, -1), new Vector(1, 1, 1));
class ClipFilter {
    constructor(m, eye, scene) {
        this.matrix = m;
        this.eye = eye;
        this.scene = scene;
    }
    filter(v) {
        const w = this.matrix.mulPositionW(v);
        if (!this.scene.visible(this.eye, v)) {
            return {w, ok: false};
        }
        if (!clipBox.contains(w)) {
            return {w, ok: false};
        }
        return {w, ok: true};
    }
}
//  
// https://github.com/fogleman/ln/blob/master/ln/triangle.go
//
class Triangle {
    constructor(v1, v2, v3) {
        this.v1 = v1; this.v2 = v2; this.v3 = v3;
        this.updateBoundingBox();
    }
    updateBoundingBox() {
        const min = this.v1.min(this.v2).min(this.v3);
        const max = this.v1.max(this.v2).max(this.v3);
        this.box = new Box(min, max);
    }
    compile() {}
    boundingBox() { return this.box; }
    contains(v, f) { return false; }
    intersect(r) {
        const e1 = this.v2.sub(this.v1);
        const e2 = this.v3.sub(this.v1);
        const p = r.direction.cross(e2);
        const det = e1.dot(p);
        if (det > -EPS && det < EPS) {
            return noHit;
        }
        const inv = 1 / det;
        const t = r.origin.sub(this.v1);
        const u = t.dot(p) * inv;
        if (u < 0 || u > 1) {
            return noHit;
        }
        const q = t.cross(e1);
        const v = r.direction.dot(q) * inv;
        if (v < 0 || u+v > 1) {
            return noHit;
        }
        const d = e2.dot(q) * inv;
        if (d < EPS) {
            return noHit;
        }
        return new Hit(t, d);
    }
    paths() { return new Paths([
        new Path([this.v1, this.v2]), 
        new Path([this.v2, this.v3]), 
        new Path([this.v3, this.v1])]);
    }
}
//  
// https://github.com/fogleman/ln/blob/master/ln/cube.go
//
class Cube {
    constructor(min, max) {
        this.min = min;
        this.max = max;
        this.box = new Box(min, max);
    }
    compile() {}
    boundingBox() {
        return this.box;
    }
    contains(v, f) {
        if (v.x < this.min.x-f || v.x > this.max.x+f) {
            return false;
        }
        if (v.y < this.min.y-f || v.y > this.max.y+f) {
            return false;
        }
        if (v.z < this.min.z-f || v.z > this.max.z+f) {
            return false;
        }
        return true;
    }
    intersect(r) {
        let n = this.min.sub(r.origin).div(r.direction);
        let f = this.max.sub(r.origin).div(r.direction);
        const v = n.min(f); f = n.max(f);
        const t0 = Math.max(Math.max(v.x, v.y), v.z);
        const t1 = Math.min(Math.min(f.x, f.y), f.z);
        if (t0 < 1e-3 && t1 > 1e-3) {
            return new Hit(this, t1);
        }
        if (t0 >= 1e-3 && t0 < t1) {
            return new Hit(this, t0);
        }
        return noHit;
    }
    paths() {
        const x1 = this.min.x, y1 = this.min.y, z1 = this.min.z;
        const x2 = this.max.x, y2 = this.max.y, z2 = this.max.z;
        const paths = new Paths([
            new Path([new Vector(x1, y1, z1), new Vector(x1, y1, z2)]),
            new Path([new Vector(x1, y1, z1), new Vector(x1, y2, z1)]),
            new Path([new Vector(x1, y1, z1), new Vector(x2, y1, z1)]),
            new Path([new Vector(x1, y1, z2), new Vector(x1, y2, z2)]),
            new Path([new Vector(x1, y1, z2), new Vector(x2, y1, z2)]),
            new Path([new Vector(x1, y2, z1), new Vector(x1, y2, z2)]),
            new Path([new Vector(x1, y2, z1), new Vector(x2, y2, z1)]),
            new Path([new Vector(x1, y2, z2), new Vector(x2, y2, z2)]),
            new Path([new Vector(x2, y1, z1), new Vector(x2, y1, z2)]),
            new Path([new Vector(x2, y1, z1), new Vector(x2, y2, z1)]),
            new Path([new Vector(x2, y1, z2), new Vector(x2, y2, z2)]),
            new Path([new Vector(x2, y2, z1), new Vector(x2, y2, z2)]),
        ]);
        return paths;
    }
}
//
// https://github.com/fogleman/ln/blob/master/examples/csg.go
//
const intersection = 0;
const difference = 1;

class BooleanShape {
    constructor(op, A, B) {
        this.op = op;
        this.a = arguments[1];
        this.b = arguments[2];
        for (let i=3; i<arguments.length; i++) {
            this.a = new BooleanShape(op, this.a, arguments[i]);
        }
    }
    compile() {}
    boundingBox() {
        // TODO: fix this
        const a = this.a.boundingBox();
        const b = this.b.boundingBox();
        return a.extend(b);
    }
    contains(v, f) {
        f = 1e-3;
        switch (this.op) {
            case intersection:
                return this.a.contains(v, f) && this.b.contains(v, f);
            case difference:
                return this.a.contains(v, f) && !this.b.contains(v, -f);
        }
        return false;
    }
    intersect(r) {
        const h1 = this.a.intersect(r);
        const h2 = this.b.intersect(r);
        const h = h1.min(h2);
        const v = r.position(h.t);
        if (!h.ok() || this.contains(v, 0)) {
            return h;
        }
        return this.intersect(new Ray(r.position(h.t+0.01), r.direction));
    }
    paths() {
        let p = this.a.paths();
        p.append(this.b.paths().v);
        return p.chop(0.01).filter(this);
    }
    filter(w) {
        return {w, ok: this.contains(w, 0)};
    }
}
//
// https://github.com/fogleman/ln/blob/master/ln/cylinder.go
//
class Cylinder {
    constructor(radius, z0, z1) {
	    this.radius = radius;
	    this.z0 = z0;
	    this.z1 = z1;
    }
    compile() {}
    boundingBox() {
    	const r = this.radius;
    	return new Box(new Vector(-r, -r, this.z0), new Vector(r, r, this.z1));
    }
    contains(v, f) {
    	const xy = new Vector(v.x, v.y, 0);
    	if (xy.length() > this.radius+f) {
    		return false;
    	}
    	return v.z >= this.z0-f && v.z <= this.z1+f;
    }
    intersect(ray)  {
    	const r = this.radius;
    	const o = ray.origin;
    	const d = ray.direction;
    	const a = d.x*d.x + d.y*d.y;
    	const b = 2*o.x*d.x + 2*o.y*d.y;
    	const c = o.x*o.x + o.y*o.y - r*r;
    	const q = b*b - 4*a*c;
    	if (q < 0) {
    		return noHit;
    	}
    	const s = Math.sqrt(q);
    	let t0 = (-b + s) / (2 * a);
    	let t1 = (-b - s) / (2 * a);
    	if (t0 > t1) {
    	    const tmp = t0;
    	    t0 = t1; t1 = tmp;
    	}
    	const z0 = o.z + t0*d.z;
    	const z1 = o.z + t1*d.z;
    	if (t0 > 1e-6 && this.z0 < z0 && z0 < this.z1) {
    		return new Hit(this, t0);
    	}
    	if (t1 > 1e-6 && this.z0 < z1 && z1 < this.z1) {
    		return new Hit(this, t1);
    	}
    	return noHit;
    
    }
    paths()  {
    	const result = new Paths();
    	for (let a = 0; a < 360; a += 10) {
    		const x = this.radius * Math.cos(radians(a));
    		const y = this.radius * Math.sin(radians(a));
    		result.append(new Path([new Vector(x, y, this.z0), new Vector(x, y, this.z1)]));
    	}
    	return result;
    }
}

class OutlineCylinder extends Cylinder {
    constructor(eye, up, radius, z0, z1) {
        super(radius, z0, z1);
        this.eye = eye;
        this.up = up;
    }
    paths() {
    	let center = new Vector(0, 0, this.z0);
    	let hyp = center.sub(this.eye).length();
    	let opp = this.radius;
    	let theta = Math.asin(opp / hyp);
    	let adj = opp / Math.tan(theta);
    	let d = Math.cos(theta) * adj;
    	// r := math.Sin(theta) * adj
    	let w = center.sub(this.eye).normalize();
    	let u = w.cross(this.up).normalize();
    	const c0 = this.eye.add(w.mulScalar(d));
    	const a0 = c0.add(u.mulScalar(this.radius * 1.01));
    	const b0 = c0.add(u.mulScalar(-this.radius * 1.01));
    
    	center = new Vector(0, 0, this.z1);
    	hyp = center.sub(this.eye).length();
    	opp = this.radius;
    	theta = Math.asin(opp / hyp);
    	adj = opp / Math.tan(theta);
    	d = Math.cos(theta) * adj;
    	// r = math.Sin(theta) * adj
    	w = center.sub(this.eye).normalize();
    	u = w.cross(this.up).normalize();
    	const c1 = this.eye.add(w.mulScalar(d));
    	const a1 = c1.add(u.mulScalar(this.radius * 1.01));
    	const b1 = c1.add(u.mulScalar(-this.radius * 1.01));
    
    	const p0 = new Path(), p1 = new Path();
    	for (let a = 0; a < 360; a++) {
    		const x = this.radius * Math.cos(radians(a));
    		const y = this.radius * Math.sin(radians(a));
    		p0.append(new Vector(x, y, this.z0));
    		p1.append(new Vector(x, y, this.z1));
    	}
    	return new Paths([
    		p0,
    		p1,
    		new Path([new Vector(a0.x, a0.y, this.z0), new Vector(a1.x, a1.y, this.z1)]),
    		new Path([new Vector(b0.x, b0.y, this.z0), new Vector(b1.x, b1.y, this.z1)]),
    		]);
    }
}

function newTransformedOutlineCylinder(eye, up, v0, v1, radius) {
	const d = v1.sub(v0);
	const z = d.length();
	const a = Math.acos(d.normalize().dot(up));
	let m = Matrix.translate(v0);
	if (a != 0) {
		const u = d.cross(up).normalize();
		m = Matrix.translate(v0).mul(Matrix.rotate(u, a));
	}
	const c = new OutlineCylinder(m.inverse().mulPosition(eye), up, radius, 0, z);
	return new TransformedShape(c, m);
}
//
// https://github.com/fogleman/ln/blob/master/ln/sphere.go
//
class Sphere {
    constructor(center, radius) {
        this.center = center;
        this.radius = radius;
        
        const min = new Vector(center.x - radius, center.y - radius, center.z - radius);
    	const max = new Vector(center.x + radius, center.y + radius, center.z + radius);
    	this.box = new Box(min, max);
    }
    compile() {}
    boundingBox() {
        return this.box;
    }
    contains(v, f) {
    	return v.sub(this.center).length() <= this.radius+f;
    }
    intersect(r) {
    	const radius = this.radius;
    	const to = r.origin.sub(this.center);
    	const b = to.dot(r.direction);
    	const c = to.dot(to) - radius*radius;
    	let d = b*b - c;
    	if (d > 0) {
    		d = Math.sqrt(d);
    		const t1 = -b - d;
    		if (t1 > 1e-2) {
    			return new Hit(this, t1);
    		}
    		const t2 = -b + d;
    		if (t2 > 1e-2) {
    			return new Hit(this, t2);
    		}
    	}
    	return noHit
    }
    paths3() {
    	const paths = new Paths();
    	for (let i = 0; i < 20000; i++) {
    		let v = randomUnitVector();
    		v = v.mulScalar(this.radius).add(this.center);
    		paths.append(new Path([v, v]));
    	}
    	return paths;
    }
    paths2() {
    	var equator = new Path();
    	for (let lng = 0; lng <= 360; lng++) {
    		const v = latLngToXYZ(0, lng, this.radius);
    		equator.append(v);
    	}
    	var paths = new Paths();
    	for (let i = 0; i < 100; i++) {
    		const m = Matrix.identity();
    		for (let j = 0; j < 3; j++) {
    			const v = randomUnitVector();
    			m = m.mul(Matrix.rotate(v, Math.random()*2*Math.PI));
    		}
    		m = m.mul(Matrix.translate(this.center));
    		paths.append(equator.transform(m));
    	}
    	return paths;
    }
    paths() {
    	const paths = new Paths();
    	const n = 10;
    	const o = 10;
    	for (let lat = -90 + o; lat <= 90-o; lat += n) {
    		const path = new Path();
    		for (let lng = 0; lng <= 360; lng++) {
    			const v = latLngToXYZ(lat, lng, this.radius).add(this.center);
    			path.append(v);
    		}
    		paths.append(path);
    	}
    	for (let lng = 0; lng < 360; lng += n) {
    		const path = new Path();
    		for (let lat = -90 + o; lat <= 90-o; lat++) {
    			const v = latLngToXYZ(lat, lng, this.radius).add(this.center);
    			path.append(v);
    		}
    		paths.append(path);
    	}
    	return paths;
    }

}

function latLngToXYZ(lat, lng, radius) {
	const latr = radians(lat);
	const lngr = radians(lng);
	return new Vector(  radius * Math.cos(latr) * Math.cos(lngr),
	                    radius * Math.cos(latr) * Math.sin(lngr),
	                    radius * Math.sin(latr) );
}

class OutlineSphere extends Sphere {
    constructor(eye, up, center, radius) {
        super(center, radius);
        this.eye = eye;
	    this.up = up;
    }
    paths() {
    	const path = new Path();
    	const center = this.center;
    	const radius = this.radius;
    
    	const hyp = center.sub(this.eye).length();
    	const opp = radius;
    	const theta = Math.asin(opp / hyp);
    	const adj = opp / Math.tan(theta);
    	const d = Math.cos(theta) * adj;
    	const r = Math.sin(theta) * adj;
    
    	const w = center.sub(this.eye).normalize()
    	const u = w.cross(this.up).normalize()
    	const v = w.cross(u).normalize()
    	const c = this.eye.add(w.mulScalar(d))
    	for (let i = 0; i <= 360; i++) {
    		const a = radians(i);
    		let p = c;
    		p = p.add(u.mulScalar(Math.cos(a) * r));
    		p = p.add(v.mulScalar(Math.sin(a) * r));
    		path.append(p);
    	}
    	return new Paths([path]);
    }
}
//
// https://github.com/fogleman/ln/blob/master/ln/function.go
//
const above = 0;
const below = 1;

class FunctionShape {
    constructor(func, box, direction) {
	    this.func = func;
	    this.box = box;
	    this.direction = direction;
    }
    compile() {}
    boundingBox() { return this.box; }
    contains(v, eps) {
    	if (this.direction == below) {
    		return v.z < this.func(v.x, v.y);
    	} else {
    		return v.z > this.func(v.x, v.y);
    	}
    }
    intersect(ray) {
    	const step = 1.0 / 64;
    	const sign = this.contains(ray.position(step), 0);
    	for (let t = step; t < 10; t += step) {
    		const v = ray.position(t);
    		if (this.contains(v, 0) != sign && this.box.contains(v)) {
    			return new Hit(this, t);
    		}
    	}
    	return noHit
    }
    paths3() {
    	const path = new Path();
    	const n = 10000
    	for (let i = 0; i < n; i++) {
    		const t = i / n;
    		const r = 8 - Math.pow(t, 0.1)*8;
    		const x = Math.cos(radians(t*2*Math.PI*3000)) * r;
    		const y = Math.sin(radians(t*2*Math.PI*3000)) * r;
    		let z = this.func(x, y);
    		z = Math.min(z, this.box.max.z);
    		z = Math.max(z, this.box.min.z);
    		path.append(new Vector(x, y, z));
    	}
    	// return append(f.paths2(), path)
    	return new Paths([path]);
    }
    paths() {
    	const paths = new Paths();
    	const fine = 1.0 / 256;
    	for (let a = 0; a < 360; a += 5) {
    		const path = new Path();
    		for (let r = 0.0; r <= 8.0; r += fine) {
    			let x = Math.cos(radians(a)) * r;
    			let y = Math.sin(radians(a)) * r;
    			let z = this.func(x, y);
    			const o = -Math.pow(-z, 1.4);
    			x = Math.cos(radians(a)-o) * r;
    			y = Math.sin(radians(a)-o) * r;
    			z = Math.min(z, this.box.max.z);
    			z = Math.max(z, this.box.min.z);
    			path.append(new Vector(x, y, z));
    		}
    		paths.append(path);
    	}
    	return paths;
    }
    paths1() {
    	const paths = new Paths();
    	const step = 1.0 / 8;
    	const fine = 1.0 / 64;
    	for (let x = this.box.min.x; x <= this.box.max.x; x += step) {
    		const path = new Path();
    		for (let y = this.box.min.y; y <= this.box.max.y; y += fine) {
    			let z = this.func(x, y);
    			z = Math.min(z, this.box.max.z);
    			z = Math.max(z, this.box.min.z);
    			path.append(new Vector(x, y, z));
    		}
    		paths.append(path);
    	}
    	for (let y = this.box.min.y; y <= this.box.max.y; y += step) {
    		const path = new Path();
    		for (let x = this.box.min.x; x <= this.box.max.x; x += fine) {
    			let z = this.func(x, y);
    			z = Math.min(z, this.box.max.z);
    			z = Math.max(z, this.box.min.z);
    			path.append(new Vector(x, y, z));
    		}
    		paths.append([path]);
    	}
    	return paths
    }
}
