const Geometry = {
        // Euclidian distance between two or more verticies p of form [x_0, x_1, ..., x_len]
        eucDist: function(len, ...p) {
                if (p.length < 2)
                        return 0;

                let s = 0;

                for (let i = 1; i < p.length; i++) {
                        for (let j = 0; j < len; j++)
                                s += Math.pow(p[i - 1][j] - p[i][j], 2);
                }

                return Math.sqrt(s);
        },
        // Absolute/L1 distance between two or more verticies p of form [x_0, x_1, ..., x_len]
        absDist: function(len, ...p) {
                if (p.length < 2)
                        return 0;

                let s = 0;

                for (let i = 1; i < p.length; i++) {
                        for (let j = 0; j < len; j++)
                                s += Math.abs(p[i - 1][j] - p[i][j]);
                }

                return s;
        },
        // Returns 2D distances of each plane-pair of two points in 3D space (cartesian)
        planeDists: function(p1, p2) {
                "use strict";

                const out = Object.create(Geometry);

                out.xy = out.yx = this.eucDist(p1.subArray(0, 1), p2.subArray(0, 1));
                out.xz = out.zx = this.eucDist([p1[0], p1[2]], [p2[0], p2[1]]);
                out.yz = out.zy = this.eucDist([p1[1], p1[2]], [p2[1], p2[1]]);

                Object.freeze(out);

                return out;
        },
        // Returns angles between each plane-pair of two points in 3D space (cartesian)
        planeAngles: function(x1, y1, z1, x2, y2, z2) {
                "use strict";

                const out = Object.create(null);
                const hyp = this.planeDists(...arguments);
                const halfPI = Math.PI / 2;

                out.xy = Math.asin((y2 - y1) / hyp.xy);
                out.yx = halfPI - out.xy;

                out.xz = Math.asin((z2 - z1) / hyp.xz);
                out.zx = halfPI - out.xz;

                out.yz = Math.asin((z2 - z1) / hyp.xz);
                out.zy = halfPI - out.yz;

                Object.freeze(out);

                return out;
        },
        // Calculates the angle between three points (x, y, z).
        // If point 3 is omitted the order is p3 p1 p2, otherwise p1 p2 p3.
        // If point 3 is omitted it defaults to (p2_x, p2_y, 0).
        // Returns 0 if points are identical.
        angle: function(p1, p2, p3) {
                "use strict";

                if (!Array.isArray(p3))
                        p3 = [p2[0], p2[1], 0];

                const hyp = this.eucDist(...arguments);

                return hyp === 0 ? 0 : Math.asin((p2[1] - p1[1]) / hyp);
        },
        // Cos(θ) between two verticies p1 [x_1, y_1] and p2 [x_2, y_2]
        vertAngle: function(p1, p2) {
                "use strict";

                if (!Array.isArray(p1) || !Array.isArray(p2))
                        throw new TypeError("One or more arguments of vertAngle are not arrays.");
                
                if (p1[1] === 0)
                        return Math.atan(p2[1] / p2[0]);
                else if (p2[1] === 0)
                        return Math.atan(p1[1] / p2[0]);

                return (p1[0] * p2[0] + p1[1] * p2[1]) / Math.sqrt(p1[0]**2 + p1[1]**2) * Math.sqrt(p2[0]**2 + p2[1]**2);
        },
        degPerRad() {
                return 57.29577951308232;
        },
        radToDeg(rad) {
                "use strict";

                return rad * this.degPerRad();
        },
        mergePoints: function(...p) {
                const out = [];

                for (let i = 0; i < p.length; i++) {
                        for (let j = 0; j < p[i].length; j += 3) {
                                let unique = true;
                                
                                for (let k = 0; k < out.length; k++) {
                                        if (p[i][j] === out[k][0] && p[i][j + 1] === out[k][1] && p[i][j + 2] === out[k][2]) {
                                                unique = false;
                                                break;
                                        }                                        
                                }
                                
                                if (unique)
                                        out.push(p[i][j], p[i][j + 1], p[i][j + 2]);
                        }

                        
                }
                
                return out;
        }
};

class Viewport {
        constructor() {
                this.x = 0;
                this.y = 0;
                this.z = 0;

                this.width  = 1024;
                this.height = 1024;

                // Horizontal field-of-view (FOV)
                this.hfov;
                // Vertical FOV
                this.vfov;
                this.setFOV(90);

                this.focalLength = 1;
        }

        setFOV(deg) {
                this.hfov = Math.PI * deg / 180;
                this.vfov = 2 * Math.atan(Math.tan(this.hfov / 2) * 1 / this.aspectRatio);
        }

        get FOVdeg() {
                return {
                        v: Geometry.radToDeg(this.vfov),
                        h: Geometry.radToDeg(this.hfov)
                };
        }

        get aspectRatio() {
                return this.width / this.height;
        }

        // For sensor size
        get normal() {
                return Math.sqrt(this.width**2 + this.height**2);
        }

        pointAngle(x, y, z) {
                const hyp = Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2 + (this.z - z) ** 2);
                const out = Object.create(null);
                
                if (this.x - x !== 0)
                        out.xy = Math.atan((y - this.y) / (x - this.x));
                else if (this.y - y !== 0)
                        out.xy = Math.PI / 2 - Math.atan((x - this.x) / (y - this.y));
                else
                        out.xy = 0;
                
                if (this.x !== x)
                        out.xz = Math.atan((z - this.z) / (x - this.x));
                else if (this.z !== z)
                        out.xz = Math.PI / 2 - Math.atan((x - this.x) / (z - this.z));
                else
                        out.xz = 0;
                
                return out;
        }

        _trsp(a, b, c) {
                const hyp = Math.sqrt(a ** 2 + b ** 2 + c ** 2);
                const A  = Math.atan(a / b);
                const f1 = a === 0 ? b : (1 / (Math.cos(A) / this.focalLength));
                const f2 = b === 0 ? a : (1 / (Math.sin(A) / b));

                return (f1 / (this.focalLength * f1 / f2)) / f2;
        }

        transformPoint(x, y, z) {
                const dx = x - this.x;
                const dy = y - this.y; 
                const dz = z - this.z;

                const a = Math.sqrt(dx ** 2 + dy ** 2 + (dz - this.focalLength) ** 2);
                const b = Math.asin(dy / a);
                
                const hx = a + a * this.focalLength / (dz - this.focalLength);

                return [Math.asin(dx / hx) / this.hfov * this.width, Math.acos(dy / hx) / this.vfov * this.height];
        }

        t2p(x, y, z) {
                const dx = x - this.x - this.focalLength;
                const dy = y - this.y;
                const dz = z - this.z;
                const hp = Math.PI / 2;

                const xcoef = 1 - (Math.asin(dx / Math.sqrt(dz ** 2 + dx ** 2)) / hp);
                const ycoef = 1 - (Math.acos(dy / Math.sqrt(dy ** 2 + dz ** 2)) / hp);

                return [x * xcoef, y * ycoef];
        }

        pointVisible(x, y, z) {
                const ang = this.pointAngle(x, y, z);

                if (z > this.z || (x > this.width || x < 0))
                        return 0;

                return 1;
        }
}