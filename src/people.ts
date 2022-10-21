import {
  AnimationAction,
  AnimationMixer,
  BufferGeometry,
  Clock,
  Color,
  DirectionalLight,
  Fog,
  GridHelper,
  Group,
  HemisphereLight,
  Material,
  Mesh,
  MeshPhongMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Skeleton,
  SkinnedMesh,
  sRGBEncoding,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';

let scene: Scene,
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
  plane: Mesh;
let dirLight: DirectionalLight, hemiLight: HemisphereLight;

let controls: OrbitControls;
let gridHelper: GridHelper;

const mixers: AnimationMixer[] = [];
const clock = new Clock();

type modelObject = Object3D & {
  isSkinnedMesh?: boolean;
  geometry?: BufferGeometry;
  material?: Material;
};

(function init() {
  initScene();
  initCamera();
  initRenderer();
  initLight();
  initPlane();
  enableShadow();

  initGridHelper();
  initControls();
})();

await loadModel();

window.addEventListener('resize', onResizeWindow);

function initScene() {
  scene = new Scene();
  scene.background = new Color(0x888888);
  scene.fog = new Fog(0xa0a0a0, 10, 50);
}

function initCamera() {
  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(5, 5, 10);
}

function initRenderer() {
  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = sRGBEncoding;
  document.body.appendChild(renderer.domElement);
}

function initLight() {
  hemiLight = new HemisphereLight(0xa0a0a0, 0x888888);
  dirLight = new DirectionalLight();
  dirLight.position.set(5, 5, 5);
  scene.add(hemiLight, dirLight);
}

function initPlane() {
  plane = new Mesh(new PlaneGeometry(100, 100), new MeshPhongMaterial());
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);
}

function enableShadow() {
  renderer.shadowMap.enabled = true;
  plane.receiveShadow = true;
  dirLight.castShadow = true;
}

function initGridHelper() {
  gridHelper = new GridHelper(100, 100, 0xff0000);
  scene.add(gridHelper);
}

function initControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
}

function onResizeWindow() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

async function loadBody(loader: GLTFLoader) {
  const { scene, animations } = await loader.loadAsync('models/gltf/body.glb');
  const body = SkeletonUtils.clone(scene);

  const bodyFixed = body.getObjectByName('body_fixed') as SkinnedMesh;
  const skeleton = bodyFixed.skeleton;
  const rootBone = skeleton.bones[0];
  // NOTE: 返回骨架的基础姿势 !important。
  skeleton.pose();
  const material = new MeshStandardMaterial({
    color: 'pink',
    roughness: 0.4,
  });
  const bodyMesh = new SkinnedMesh(bodyFixed.geometry, material);
  bodyMesh.castShadow = true;
  bodyMesh.name = bodyFixed.name;
  bodyMesh.bind(skeleton);
  bodyMesh.add(rootBone);
  return { skeleton, bodyMesh, animations };
}

async function loadHair(loader: GLTFLoader, skeleton: Skeleton) {
  const gltf = await loader.loadAsync('models/gltf/hair/hair02.glb');
  const skinnedMeshs: SkinnedMesh[] = [];
  gltf.scene.traverse((child: modelObject) => {
    if (child.isSkinnedMesh) {
      const skinnedMesh = new SkinnedMesh(child.geometry, child.material);
      skinnedMesh.bind(skeleton);
      skinnedMesh.name = child.name;
      skinnedMesh.castShadow = true;
      skinnedMeshs.push(skinnedMesh);
    }
  });
  const group = new Group();
  group.name = 'hair';
  group.add(...skinnedMeshs);
  return group;
}

async function loadEyes(loader: GLTFLoader, skeleton: Skeleton) {
  const gltf = await loader.loadAsync('models/gltf/eyes/eyes02.glb');
  const skinnedMeshs: SkinnedMesh[] = [];
  gltf.scene.traverse((child: modelObject) => {
    if (child.isSkinnedMesh) {
      const skinnedMesh = new SkinnedMesh(child.geometry, child.material);
      skinnedMesh.bind(skeleton);
      skinnedMesh.name = child.name;
      skinnedMeshs.push(skinnedMesh);
    }
  });
  const group = new Group();
  group.name = 'eyes';
  group.add(...skinnedMeshs);
  return group;
}

async function loadEyebrow(loader: GLTFLoader, skeleton: Skeleton) {
  const gltf = await loader.loadAsync('models/gltf/eyebrow/eyebrow01.glb');
  const skinnedMeshs: SkinnedMesh[] = [];
  gltf.scene.traverse((child: modelObject) => {
    if (child.isSkinnedMesh) {
      const skinnedMesh = new SkinnedMesh(child.geometry, child.material);
      skinnedMesh.bind(skeleton);
      skinnedMesh.name = child.name;
      skinnedMeshs.push(skinnedMesh);
    }
  });
  const group = new Group();
  group.name = 'eyebrow';
  group.add(...skinnedMeshs);
  return group;
}

async function loadMouth(loader: GLTFLoader, skeleton: Skeleton) {
  const gltf = await loader.loadAsync('models/gltf/mouth/mouth01.glb');
  const skinnedMeshs: SkinnedMesh[] = [];
  gltf.scene.traverse((child: modelObject) => {
    if (child?.isSkinnedMesh) {
      const skinnedMesh = new SkinnedMesh(child.geometry, child.material);
      skinnedMesh.bind(skeleton);
      skinnedMesh.name = child.name;
      skinnedMeshs.push(skinnedMesh);
    }
  });
  const group = new Group();
  group.name = 'mouth';
  group.add(...skinnedMeshs);
  return group;
}

async function loadTop(loader: GLTFLoader, skeleton: Skeleton) {
  const gltf = await loader.loadAsync('models/gltf/top/top02.glb');
  const skinnedMeshs: SkinnedMesh[] = [];
  gltf.scene.traverse((child: modelObject) => {
    if (child.isSkinnedMesh) {
      const skinnedMesh = new SkinnedMesh(child.geometry, child.material);
      skinnedMesh.bind(skeleton);
      skinnedMesh.name = child.name;
      skinnedMeshs.push(skinnedMesh);
    }
  });
  const group = new Group();
  group.name = 'top';
  group.add(...skinnedMeshs);
  return group;
}

async function loadBottom(loader: GLTFLoader, skeleton: Skeleton) {
  const gltf = await loader.loadAsync('models/gltf/bottom/bottom02.glb');
  const skinnedMeshs: SkinnedMesh[] = [];
  gltf.scene.traverse((child: modelObject) => {
    if (child.isSkinnedMesh) {
      const skinnedMesh = new SkinnedMesh(child.geometry, child.material);
      skinnedMesh.bind(skeleton);
      skinnedMesh.name = child.name;
      skinnedMeshs.push(skinnedMesh);
    }
  });
  const group = new Group();
  group.name = 'bottom';
  group.add(...skinnedMeshs);
  return group;
}

async function loadShoes(loader: GLTFLoader, skeleton: Skeleton) {
  const gltf = await loader.loadAsync('models/gltf/shoes/shoes01.glb');
  const skinnedMeshs: SkinnedMesh[] = [];
  gltf.scene.traverse((child: modelObject) => {
    if (child?.isSkinnedMesh) {
      const skinnedMesh = new SkinnedMesh(child.geometry, child.material);
      skinnedMesh.bind(skeleton);
      skinnedMesh.name = child.name;
      skinnedMeshs.push(skinnedMesh);
    }
  });
  const group = new Group();
  group.name = 'shoes';
  group.add(...skinnedMeshs);
  return group;
}

async function loadModel() {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/js/libs/draco/gltf/');
  loader.setDRACOLoader(dracoLoader);

  const { skeleton, bodyMesh, animations } = await loadBody(loader);
  const hairMesh = await loadHair(loader, skeleton);
  const eyesMesh = await loadEyes(loader, skeleton);
  const eyebrowMesh = await loadEyebrow(loader, skeleton);
  const mouthMesh = await loadMouth(loader, skeleton);
  const topMesh = await loadTop(loader, skeleton);
  const bottomMesh = await loadBottom(loader, skeleton);
  const shoesMesh = await loadShoes(loader, skeleton);

  const group = new Group();
  group.add(
    bodyMesh,
    hairMesh,
    eyesMesh,
    eyebrowMesh,
    mouthMesh,
    topMesh,
    bottomMesh,
    shoesMesh,
  );
  group.rotateX(Math.PI / 2);
  group.scale.set(0.01, 0.01, 0.01);
  scene.add(group);

  const actions: AnimationAction[] = [];
  const mixer = new AnimationMixer(group);
  mixers.push(mixer);
  animations.forEach((clip) => {
    const action = mixer.clipAction(clip);
    actions.push(action);
  });
  actions[1].play();

  animate();
}

function animate() {
  controls.update();
  const delta = clock.getDelta();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  mixers.forEach((mixer) => mixer.update(delta));
}
