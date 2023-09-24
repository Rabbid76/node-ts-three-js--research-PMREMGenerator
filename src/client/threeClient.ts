import {
    ACESFilmicToneMapping,
    AmbientLight,
    AxesHelper,
    BoxGeometry,
    Color,
    DirectionalLight,
    GridHelper,
    LinearEncoding,
    Mesh,
    MeshPhysicalMaterial,
    PerspectiveCamera,
    PCFSoftShadowMap,
    PlaneGeometry,
    PMREMGenerator,
    Scene,
    ShadowMaterial,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
// @ts-ignore
import Stats from 'three/examples/jsm/libs/stats.module' 
import { GUI } from 'dat.gui'

const createScene = (): Scene => {
    const scene = new Scene();
    scene.background = new Color(0xc0c0c0);

    const gridHelper = new GridHelper(10, 10);
    scene.add(gridHelper);
    const axesHelper = new AxesHelper(2);
    scene.add(axesHelper);
    
    const groundGeometry = new PlaneGeometry(10, 10);
    groundGeometry.rotateX(-Math.PI / 2);
    const groundMaterial = new ShadowMaterial();
    const groundMesh = new Mesh(groundGeometry, groundMaterial);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshPhysicalMaterial({color: 0xe02020});
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.y = 0.5;
    scene.add(mesh);

    const roomEnvironment = new RoomEnvironment();
    const roomEnvironmentAmbientLight = new AmbientLight(0xffffff, 0.5);
    roomEnvironment.add(roomEnvironmentAmbientLight);
    scene.userData.roomEnvironment = roomEnvironment; 

    scene.userData.onBeforeRender = (renderer: WebGLRenderer, scene: Scene) => {
        if (!scene.userData.roomEnvironment) {
            return;
        }
        // @ts-ignore
        if (!renderer.userData) {
            // @ts-ignore
            renderer.userData = {};
        }
        // @ts-ignore
        const rendererUserData: any = renderer.userData;
        if (!rendererUserData.environmentTexture) {
            const pmremGenerator = new PMREMGenerator(renderer);
            const pmremRenderTarget = pmremGenerator.fromScene(roomEnvironment, 0.04);
            rendererUserData.environmentTexture = pmremRenderTarget.texture;
        }
        scene.environment = rendererUserData.environmentTexture;
        scene.background = rendererUserData.environmentTexture;
    }

    return scene;
}


export const createRenderer = (canvas: any, contextLossId: string, contextRestoreId: string, scene: Scene) => {
    const renderer = new WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
    const width = window.innerWidth / 2;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    const contextLossButton = document.getElementById(contextLossId);
    if (contextLossButton) {
        contextLossButton.onclick = () => { 
            console.log('context loss clicked');
            renderer.forceContextLoss();
        };
    };
    const contextRestoreButton = document.getElementById(contextRestoreId);
    if (contextRestoreButton) {
        contextRestoreButton.onclick = () => { 
            console.log('context restore clicked');
            renderer.forceContextRestore();
        };
    };
    renderer.domElement.addEventListener("webglcontextlost", function(event) {
        console.log('webglcontextlost');
    });
    renderer.domElement.addEventListener("webglcontextrestored", function(event) {
        console.log('webglcontextrestored');
        // @ts-ignore
        const userData = renderer.userData;
        if (userData?.environmentTexture) {
            const environmentTexture = userData.environmentTexture;
            userData.environmentTexture = undefined;
            environmentTexture.dispose();
        }
    });
    
    const camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.y = 4;
    camera.position.z = 8;
    const controls = new OrbitControls(camera, renderer.domElement);

    window.addEventListener('resize', () => {
        const width = window.innerWidth / 2;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }, false);

    let previousTimeStamp: number | undefined;
    const animate = (timestamp: number) => {
        const deltaTimeMs = timestamp - (previousTimeStamp ?? timestamp);
        previousTimeStamp = timestamp;
        requestAnimationFrame(animate);
        controls.update();
        render();
    }

    const render = () => {
        if (scene.userData.onBeforeRender) {
            scene.userData.onBeforeRender(renderer, scene);
        }
        renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
}

const scene = createScene();
// @ts-ignore
createRenderer(three_canvas_left, 'menu-button-loss-left', 'menu-button-restore-left', scene);
// @ts-ignore
createRenderer(three_canvas_right, 'menu-button-loss-right', 'menu-button-restore-right', scene);
