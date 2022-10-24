import {
  AnimationAction,
  AnimationMixer,
  BufferGeometry,
  Clock,
  Color,
  DirectionalLight,
  Group,
  Material,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
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

let scene: Scene, camera: PerspectiveCamera, renderer: WebGLRenderer;

let dirLight: DirectionalLight;

let controls: OrbitControls;

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
  enableShadow();

  initControls();
})();

await loadModel();

window.addEventListener('resize', onResizeWindow);

function initScene() {
  scene = new Scene();
  scene.background = new Color(0x888888);
}

function initCamera() {
  camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(10, 10, 15);
}

function initRenderer() {
  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = sRGBEncoding;
  document.body.appendChild(renderer.domElement);
}

function initLight() {
  dirLight = new DirectionalLight();
  dirLight.position.set(10, 10, 20);

  const leftLight = new DirectionalLight();
  leftLight.position.set(-10, 10, 0);

  scene.add(dirLight, leftLight);
}

function enableShadow() {
  renderer.shadowMap.enabled = true;
  dirLight.castShadow = true;
}

function initControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableRotate = false;
}

function onResizeWindow() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

async function loadRoom(loader: GLTFLoader) {
  const gltf = await loader.loadAsync('models/gltf/room.glb');
  const room = SkeletonUtils.clone(gltf.scene);
  console.log('room', gltf);
  room.castShadow = true;
  room.rotateY(-0.5);
  scene.add(room);
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

async function loadOther(loader: GLTFLoader, skeleton: Skeleton, name: string, url: string) {
  const gltf = await loader.loadAsync(url);
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
  group.name = name;
  group.add(...skinnedMeshs);
  return group;
}

async function loadModel() {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/js/libs/draco/gltf/');
  loader.setDRACOLoader(dracoLoader);

  loadRoom(loader);

  const { skeleton, bodyMesh, animations } = await loadBody(loader);
  const hair = await loadOther(loader, skeleton, 'hair', 'models/gltf/hair/hair02.glb');
  const eyes = await loadOther(loader, skeleton, 'eyes', 'models/gltf/eyes/eyes02.glb');
  const eyebrow = await loadOther(loader, skeleton, 'eyebrow', 'models/gltf/eyebrow/eyebrow01.glb');
  const mouth = await loadOther(loader, skeleton, 'mouth', 'models/gltf/mouth/mouth01.glb');
  const top = await loadOther(loader, skeleton, 'top', 'models/gltf/top/top02.glb');
  const bottom = await loadOther(loader, skeleton, 'bottom', 'models/gltf/bottom/bottom02.glb');
  const shoes = await loadOther(loader, skeleton, 'shoes', 'models/gltf/shoes/shoes01.glb');
  const group = new Group();
  group.add(bodyMesh, hair, eyes, eyebrow, mouth, top, bottom, shoes);
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
  actions[6].play();

  animate();
}

function animate() {
  controls.update();
  const delta = clock.getDelta();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  mixers.forEach((mixer) => mixer.update(delta));
}
