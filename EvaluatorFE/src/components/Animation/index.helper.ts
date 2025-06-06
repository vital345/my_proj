import * as THREE from "three";
import { vertexShader } from "./index.constants";

export class World {
  renderer;
  scene;
  camera;
  molecule;

  constructor() {
    this.build();
    window.addEventListener("resize", this.resize.bind(this));
    this.animate = this.animate.bind(this);
    this.animate();
  }

  build() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 3;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    const rederingDiv = document.getElementById("render-3d-object");
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    rederingDiv!.appendChild(this.renderer.domElement);
    this.molecule = new Molecule();
    this.scene.add(this.molecule);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  animate() {
    requestAnimationFrame(this.animate);
    const time = performance.now() * 0.001;
    this.molecule.animate(time);
    this.renderer.render(this.scene, this.camera);
  }
}

class Molecule extends THREE.Object3D {
  material;
  geometry;
  mesh;
  radius = 1.5;
  detail = 80;
  particleSizeMin = 0.01;
  particleSizeMax = 0.08;

  constructor() {
    super();
    this.build();
  }

  build() {
    this.dot();

    this.geometry = new THREE.IcosahedronGeometry(1, this.detail);

    this.material = new THREE.PointsMaterial({
      map: this.dot(),
      blending: THREE.AdditiveBlending,
      color: 0x101a88,
      depthTest: false,
    });

    this.setupShader(this.material);

    this.mesh = new THREE.Points(this.geometry, this.material);
    super.add(this.mesh);
  }

  dot(size = 30, color = "#FFFFFF") {
    const sizeH = size * 0.5;

    const canvas: HTMLCanvasElement = document.createElement(
      "canvas"
    ) as HTMLCanvasElement;
    canvas!.width = canvas!.height = size;

    const ctx = canvas!.getContext("2d");

    const circle = new Path2D();
    circle.arc(sizeH, sizeH, sizeH, 0, 2 * Math.PI);

    ctx!.fillStyle = color;
    ctx!.fill(circle);

    // debug canvas
    // canvas.style.position = "fixed"
    // canvas.style.top = 0
    // canvas.style.left = 0
    // document.body.appendChild(canvas)

    return new THREE.CanvasTexture(canvas);
  }

  setupShader(material) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.time = { value: 0 };
      shader.uniforms.radius = { value: this.radius };
      shader.uniforms.particleSizeMin = { value: this.particleSizeMin };
      shader.uniforms.particleSizeMax = { value: this.particleSizeMax };
      shader.vertexShader =
        "uniform float particleSizeMax;\n" + shader.vertexShader;
      shader.vertexShader =
        "uniform float particleSizeMin;\n" + shader.vertexShader;
      shader.vertexShader = "uniform float radius;\n" + shader.vertexShader;
      shader.vertexShader = "uniform float time;\n" + shader.vertexShader;
      shader.vertexShader = vertexShader + "\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
          vec3 p = position;
          float n = snoise( vec3( p.x*.6 + time*0.2, p.y*0.4 + time*0.3, p.z*.2 + time*0.2) );
          p += n *0.4;

          // constrain to sphere radius
          float l = radius / length(p);
          p *= l;
          float s = mix(particleSizeMin, particleSizeMax, n);
          vec3 transformed = vec3( p.x, p.y, p.z );
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "gl_PointSize = size;",
        "gl_PointSize = s;"
      );

      material.userData.shader = shader;
    };
  }

  animate(time) {
    this.mesh.rotation.set(0, time * 0.2, 0);
    if (this.material.userData.shader)
      this.material.userData.shader.uniforms.time.value = time;
  }
}
