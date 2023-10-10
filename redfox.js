if (!GPU) {
    console.error("must include gpu.js in the project");
}

//#region canvas methods
const canvas = document.querySelector("canvas.hidden"),
    ctx = canvas.getContext("2d"),
    viewcanvas = document.querySelector("canvas.main"),
    viewctx = viewcanvas.getContext("2d");
    gpu = new GPU();

//disable anti-aliasing
ctx.imageSmoothingEnabled = false;

// 씬이 바뀔 때 비워지는 메모리
let src = {};

canvas.width = document.querySelector(".page").offsetWidth;
canvas.height = document.querySelector(".page").offsetHeight;

let width = canvas.width,
    height = canvas.height;

const settings = {
    volumes: {
        master: 0.7,
        effect: 1,
        bgm: 1,
    },
};

let keydown = {},
    mousedown = {},
    mousepos = { x: 0, y: 0 };

let resolution = {
    w: canvas.width / canvas.offsetWidth,
    h: canvas.height / canvas.offsetHeight,
    t: (window.innerHeight - canvas.offsetHeight) / 2,
    l: (window.innerWidth - canvas.offsetWidth) / 2,
};

function Resize(wr = 16, hr = 9) {
    let page = document.querySelector("div.page"),
        ui = document.querySelector("div.ui");

    let w = page.parentElement.offsetWidth,
        h = page.parentElement.offsetHeight;

    if (w * hr > h * wr) {
        page.style.width = (h / hr) * wr + "px";
        page.style.height = h + "px";
        ui.style.width = (h / hr) * wr + "px";
        ui.style.height = h + "px";
    } else {
        page.style.width = w + "px";
        page.style.height = (w / wr) * hr + "px";
        ui.style.width = w + "px";
        ui.style.height = (w / wr) * hr + "px";
    }

    document.body.style.fontSize = h / 40 + "px";

    ChangeResolution(width, height);
}

function ChangeResolution(w, h) {
    canvas.width = w;
    canvas.height = h;
    viewcanvas.width = w;
    viewcanvas.height = h;

    width = w;
    height = h;

    resolution = {
        w: canvas.width / canvas.offsetWidth,
        h: canvas.height / canvas.offsetHeight,
        top: window.scrollY + canvas.getBoundingClientRect().top,
        left: window.scrollY + canvas.getBoundingClientRect().left,
        bottom: window.scrollY + canvas.getBoundingClientRect().bottom,
        right: window.scrollY + canvas.getBoundingClientRect().right,
    };
}

Resize();
window.onresize = (e) => Resize();

window.onmousedown = (e) => {
    if (e.target.className !== "ui") return;

    mousedown.down = e.button;

    mousedown[e.button] = {
        x: Math.floor((e.clientX - resolution.left) * resolution.w) - width / 2,
        y: Math.floor((e.clientY - resolution.top) * resolution.h) - height / 2,
    };
};

window.onmousemove = (e) => {
    mousepos = {
        x: Math.floor((e.clientX - resolution.left) * resolution.w) - width / 2,
        y: Math.floor((e.clientY - resolution.top) * resolution.h) - height / 2,
    };
};

window.oncontextmenu = (e) => {
    e.preventDefault();
};

window.onmouseup = (e) => {
    if (e.target.className !== "ui") return;

    mousedown.up = true;

    delete mousedown[e.button];
};

window.onkeydown = (e) => {
    //e.preventDefault();
    let key = e.key.toLowerCase();

    if (keydown.alt && key === "tab") keydown = {};
    else keydown[key] = true;
};

window.onblur = (e) => {
    //e.preventDefault();
    keydown = {};
    mousedown = {};
};

window.onkeyup = (e) => {
    //e.preventDefault();
    let key = e.key.toLowerCase();

    keydown[key] = undefined;
};

function Clear() {
    ctx.clearRect(0, 0, width, height);
}

function SyncCanvas() {
    viewctx.clearRect(0, 0, width, height);
    viewctx.putImageData(ctx.getImageData(0, 0, width, height), 0, 0);
}

function RotateAndRun(x, y, flip, flop, degrees, func) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((degrees * Math.PI) / 180.0);
    if (flip) flipScale = -1;
    else flipScale = 1;
    if (flop) flopScale = -1;
    else flopScale = 1;
    ctx.scale(flipScale, flopScale);
    ctx.translate(-x, -y);
    func();
    ctx.restore();
}

function DrawImage(image, x, y, w, h, flip, flop, degrees) {
    if (!image) return;

    RotateAndRun(x, y, flip, flop, degrees, function () {
        ctx.shadowColor = "white";
        ctx.shadowBlur = 0;

        ctx.drawImage(image, x - w / 2, y - h / 2, w, h);
    });
}

function DrawText(text, x, y, align, baseline, flip, flop, degrees) {
    RotateAndRun(x, y, flip, flop, degrees, function () {
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        ctx.fillText(text, x, y);
    });
}
//#endregion

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    get length() {
        return Math.hypot(this.x, this.y);
    }

    get normalized() {
        if (this.length === 0) return Vector.zero;
        return new Vector(this.x / this.length, this.y / this.length);
    }

    static get right() {
        return new Vector(1, 0);
    }

    static get left() {
        return new Vector(-1, 0);
    }

    static get up() {
        return new Vector(0, -1);
    }

    static get down() {
        return new Vector(0, 1);
    }

    static get zero() {
        return new Vector(0, 0);
    }

    get isZero() {
        return this.x === 0 && this.y === 0;
    }

    get reversed() {
        return new Vector(this.x * -1, this.y * -1);
    }

    static Sum(v1, v2) {
        return new Vector(v1.x + v2.x, v1.y + v2.y);
    }

    static Distance(v1, v2) {
        return Vector.Sum(v1, v2.reversed).length;
    }

    Normalize(n) {
        let l = this.length;

        if (l === 0) return;

        this.x /= l;
        this.y /= l;

        if (n) {
            this.x *= n;
            this.y *= n;
        }
    }

    Reverse() {
        this.x *= -1;
        this.y *= -1;
    }

    Relative(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    Sum(v) {
        this.x += v.x * 1;
        this.y += v.y * 1;
    }
}

class Collider {
    constructor() {
        this.collid = [];
        this.strokeStyle = undefined;
    }

    OnCollision(collidedObject, self) {}

    static Collid(g1, g2) {
        if (Collider.Collided(g1, g2)) {
            g1.collider.OnCollision(g2, g1);
            g2.collider.OnCollision(g1, g2);
        }
    }

    static Collided(g1, g2) {
        if (!g1.collider || !g2.collider) return false;

        let g1_x1, g1_x2, g1_y1, g1_y2, g1_r, g2_x1, g2_x2, g2_y1, g2_y2, g2_r;

        switch (g1.collider.constructor.name) {
            case "BoxCollider":
                g1_x1 = g1.position.x - g1.collider.width / 2;
                g1_x2 = g1.position.x + g1.collider.width / 2;
                g1_y1 = g1.position.y - g1.collider.height / 2;
                g1_y2 = g1.position.y + g1.collider.height / 2;

                switch (g2.collider.constructor.name) {
                    case "BoxCollider":
                        g2_x1 = g2.position.x - g2.collider.width / 2;
                        g2_x2 = g2.position.x + g2.collider.width / 2;
                        g2_y1 = g2.position.y - g2.collider.height / 2;
                        g2_y2 = g2.position.y + g2.collider.height / 2;

                        return g1_x1 <= g2_x2 && g1_x2 >= g2_x1 && g1_y1 <= g2_y2 && g1_y2 >= g2_y1;

                    case "CircleCollider":
                        return BtCCollision(g1, g2);
                }
                break;

            case "CircleCollider":
                g1_r = g1.collider.radius;

                switch (g2.collider.constructor.name) {
                    case "BoxCollider":
                        return BtCCollision(g2, g1);

                    case "CircleCollider":
                        g2_r = g2.collider.radius;
                        return Vector.Distance(g1.position, g2.position) <= g1_r + g2_r;
                }
                break;
        }
    }
}

function BtCCollision(b, c) {
    let distX = Math.abs(b.position.x - c.position.x),
        distY = Math.abs(b.position.y - c.position.y);

    if (distX > b.collider.width / 2 + c.collider.radius) return false;
    if (distY > b.collider.height / 2 + c.collider.radius) return false;

    if (distX <= b.collider.width / 2) return true;
    if (distY <= b.collider.height / 2) return true;

    let dx = distX - b.collider.width / 2,
        dy = distY - b.collider.height / 2;

    return Math.hypot(dx, dy) <= c.collider.radius * c.collider.radius;
}

class CircleCollider extends Collider {
    constructor(r, color) {
        super();
        this.radius = r;
        this.strokeStyle = color;
    }
}

class BoxCollider extends Collider {
    constructor(w, h, color) {
        super();
        this.width = w;
        this.height = h;
        this.strokeStyle = color;
    }
}

/**@class */
class Sprite {
    constructor(srcs, width, height, speed = 1, repeat = true) {
        this.images = [];
        this.width = width;
        this.height = height;
        this.idx = 0;
        this.time = 0;
        this.speed = speed;
        this.repeat = repeat;

        srcs.forEach((e) => {
            if (typeof e === "string") {
                let img = new Image(width, height);
                img.src = e;
                this.images.push(img);
            } else {
                this.images.push(e);
            }
        });
    }

    Tick() {
        this.time++;

        if (this.time === this.speed) {
            this.time = 0;
            this.idx++;
            if (this.idx >= this.images.length) {
                if (this.repeat) this.idx = 0;
                else {
                    this.idx = this.images.length - 1;
                    this.OnEnd();
                }
            }
        }
    }

    OnEnd() {}

    get sprite() {
        return this.images[this.idx];
    }
}

class GameObject {
    /**@type {Sprite} */
    #sprite;

    /**
     * @constructor
     * @param {String} name
     * @param {Number} x
     * @param {Number} y
     * @param {Sprite} sprite
     * @param {Collider} collider
     * @param {Scene} scene
     */
    constructor(name, x, y, sprite, collider, scene) {
        this.z = 0;
        this.name = name;
        this.position = new Vector(x, y);
        this.rotation = 0;
        this.#sprite = sprite;
        this.collider = collider;
        this.flip = false;
        this.flop = false;
        this.tag = "";
        this.scene = scene;

        scene.objects[this.name] = this;
        scene.__list.push(this.name);
        if (this.collider) scene.__collid_list.push(this.name);
    }

    get sprite() {
        return this.#sprite;
    }

    set sprite(s) {
        if (this.#sprite === s) return;

        this.#sprite = s;
        this.#sprite.time = 0;
        this.#sprite.idx = 0;
    }

    get clicked() {
        return mousedown.down == 0 && mousedown[0] && this.IsObject(mousedown[0].x, mousedown[0].y);
    }

    get pressed() {
        return mousedown[0] && this.IsObject(mousedown[0].x, mousedown[0].y);
    }

    get released() {
        return mousedown.up == 0 && mousedown[0] && this.IsObject(mousedown[0].x, mousedown[0].y);
    }

    IsObject(x, y) {
        return x >= this.position.x - this.#sprite.width / 2 && x <= this.position.x + this.#sprite.width / 2 && y >= this.position.y - this.#sprite.height / 2 && y <= this.position.y + this.#sprite.height / 2;
    }
    Start() {}
    FixedUpdate(dt) {}
    Update(dt) {}
    LateUpdate(dt) {}
    Destroy() {
        delete this.scene.objects[this.name];

        this.scene.__list.splice(this.scene.__list.indexOf(this.name), 1);
        if (this.collider) this.scene.__collid_list.splice(this.scene.__collid_list.indexOf(this.name), 1);
    }
}

class Effect {
    constructor(name, x, y, sprite, duration, scene) {
        this.name = name;
        this.position = new Vector(x, y);
        this.rotation = 0;
        this.sprite = sprite;
        this.flip = false;
        this.flop = false;
        this.duration = duration;
        this.scene = scene;
    }

    Update() {
        if (this.duration <= 0) delete this.scene[this.name];
        this.duration--;
    }
    Destroy() {
        delete this.scene.objects[this.name];
    }
}

class Camera {
    constructor() {
        this.position = new Vector(0, 0);
    }

    FixedUpdate(dt) {}
    Update(dt) {}
}

class Scene {
    constructor(camera) {
        this.objects = {};
        this.effects = {};
        this.camera = camera;
        this.debug = false;
        this.__list = [];
        this.__collid_list = [];
    }

    FixedUpdate(dt) {
        Object.keys(this.objects).forEach((e) => {
            this.objects[e].FixedUpdate(dt);
        });

        this.camera.FixedUpdate(dt);

        mousedown.down = false;
        mousedown.up = false;
    }

    Render(dt) {
        Clear();

        //let list = Object.keys(this.objects);

        this.__list.sort((a, b) => this.objects[a].z - this.objects[b].z);

        this.__list.forEach((e) => {
            try {
                this.objects[e].Update(dt);
            } catch (er) {
                console.log(e + "\n" + er);
            }

            if (!this.objects[e]) return;

            /**@type {GameObject} */
            const obj = this.objects[e];
            if (!obj.sprite) return;

            obj.sprite.Tick();

            const rep = obj.position.Relative(this.camera.position),
                spw = obj.sprite.width / 2,
                sph = obj.sprite.height / 2;

            if (rep.x + spw >= -(width / 2) && rep.x - spw <= width / 2 && rep.y + spw >= -(height / 2) && rep.y - spw <= height / 2) {
                DrawImage(obj.sprite.sprite, rep.x + width / 2, rep.y + height / 2, obj.sprite.width, obj.sprite.height, obj.flip, obj.flop, obj.rotation);

                if (this.debug && obj.collider) {
                    switch (obj.collider.constructor.name) {
                        case "BoxCollider":
                            let w = obj.collider.width,
                                h = obj.collider.height;
                            ctx.strokeStyle = obj.collider.strokeStyle ? obj.collider.strokeStyle : "lightgreen";
                            ctx.strokeRect(rep.x - w / 2 + width / 2, rep.y - h / 2 + height / 2, w, h);
                            ctx.stroke();
                            break;

                        case "CircleCollider":
                            let r = obj.collider.radius;
                            ctx.strokeStyle = obj.collider.strokeStyle ? obj.collider.strokeStyle : "lightgreen";
                            ctx.arc(rep.x + width / 2, rep.y + height / 2, r, 0, 2 * Math.PI);
                            ctx.stroke();
                            break;
                    }
                }

                if (obj.LateUpdate) {
                    obj.LateUpdate(dt);
                }
            }
        });

        // collision detection code must be imporved...
        // list = Object.keys(this.objects).filter((e) => this.objects[e].collider);
        // for (let i = 0; i < this.__collid_list.length; i++) {
        //     for (let j = i + 1; j < this.__collid_list.length; j++) {
        //         Collider.Collid(this.objects[this.__collid_list[i]], this.objects[this.__collid_list[j]]);
        //     }
        // }

        this.camera.Update(dt);

        Object.keys(this.effects).forEach((e) => {
            this.effects[e].Update(dt);

            if (!this.effects[e]) return;

            const eft = this.effects[e];

            eft.sprite.Tick();

            const rep = eft.position.Relative(this.camera.position),
                spw = eft.sprite.width / 2,
                sph = eft.sprite.height / 2;

            if (rep.x + spw >= -(width / 2) && rep.x - spw <= width / 2 && rep.y + spw >= -(height / 2) && rep.y - spw <= height / 2) {
                DrawImage(eft.sprite.sprite, rep.x + width / 2, rep.y + height / 2, eft.sprite.width, eft.sprite.height, eft.flip, eft.flop, eft.rotation);
            }
        });
    }
}

class Game {
    /**@type {Scene} */
    #scene;
    constructor(scene, gamespeed, fps) {
        this.#scene = scene;
        this.gamespeed = gamespeed;
        this.fps = fps;
        this._timestamp = null;
        this._lastRendered = null;
        this._playing = false;
        this.bgm = document.querySelector("audio");

        if (!this.bgm || this.bgm === null) {
            let ae = document.createElement("audio");
            document.body.appendChild(ae);

            this.bgm = ae;
        }
    }

    Init() {
        let g = this;
        this._playing = true;

        Object.keys(this.scene.objects).forEach((e) => {
            this.scene.objects[e].Start();
        });

        function RenderWithRAF(timestamp) {
            if (this._timestamp === null) {
                this._timestamp = timestamp;
                this._lastRendered = timestamp;
            }

            const dt = timestamp - this._timestamp,
                elapsed = timestamp - this._lastRendered;

            if (elapsed > 1000 / this.fps) {
                g.scene.Render(elapsed);
            }

            g.scene.FixedUpdate(dt);

            if (!this._playing) return;
            requestAnimationFrame(RenderWithRAF);
        }
    }

    Exit() {
        this._playing = false;
    }

    get scene() {
        return this.#scene;
    }

    set scene(s) {
        this.#scene = s;

        this.Init();
    }
}

/**@param {HTMLAudioElement|String} se */
function SoundEffect(se) {
    if (typeof se === "string") se = new Audio(se);
    se.volume = settings.volumes.master * settings.volumes.effect;
    se.currentTime = 0;
    se.volume = 0.1;
    se.play();

    se.onpause = function (e) {
        delete se;
    };
}

//#region loadscript
function LoadScript(src) {
    return new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.onload = function () {
            document.getElementsByClassName(src).item(0).outerHTML = "";
            resolve();
        };
        script.onerror = function () {
            reject();
        };
        script.src = src;
        script.className = src;
        document.body.appendChild(script);
    });
}

async function LoadScripts(srcs, unload) {
    if (unload) Unload();

    for (e of srcs) {
        if (!e.endsWith(".js")) e += ".js";
        await LoadScript(e);
    }
}

function Unload() {
    Object.keys(src).forEach((e) => {
        delete src[e];
    });
}
//#endregion
