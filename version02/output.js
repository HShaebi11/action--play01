import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';
import Peer from 'https://esm.sh/peerjs@1.5.2?target=es2020';

document.addEventListener('DOMContentLoaded', () => {
    const log = (...a) => { console.log('[OUTPUT]', ...a); };
    const statusEl = document.getElementById('status') || (() => {
        const s = document.createElement('div'); s.id = 'status'; s.style.cssText = 'position:fixed;left:12px;bottom:12px;padding:8px 10px;background:#111;color:#0f0;font:12px/1.4 monospace;z-index:9999;border-radius:6px;opacity:.9';
        s.textContent = 'OUTPUT: booting…'; document.body.appendChild(s); return s;
    })();

    const OUTPUT_PEER_ID = 'three-output-002';
    const mount = document.getElementById('three-render02');
    if (!mount) { log('❌ #three-render not found'); statusEl.textContent = 'OUTPUT: #three-render missing'; return; }

    // --- Three.js ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const cube = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    scene.add(cube);
    cube.position.set(0, 0, 0);
    cube.rotation.set(0, 0, 0);

    window.addEventListener('resize', () => {
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
    });

    (function animate() { requestAnimationFrame(animate); renderer.render(scene, camera); })();

    // --- PeerJS (explicit server) ---
    const peer = new Peer(OUTPUT_PEER_ID, {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        // You can add TURN here if needed (paid/own TURN).
    });

    peer.on('open', id => { log('open id:', id); statusEl.textContent = `OUTPUT: ready (${id})`; });
    peer.on('error', err => { log('error:', err); statusEl.textContent = `OUTPUT error: ${err?.type || err}`; });
    peer.on('disconnected', () => { statusEl.textContent = 'OUTPUT: disconnected'; });

    peer.on('connection', conn => {
        log('incoming from', conn.peer);
        statusEl.textContent = `OUTPUT: connected ⇄ ${conn.peer}`;
        conn.on('data', msg => {
            if (msg && typeof msg === 'object') {
                if ('x' in msg) cube.rotation.x = THREE.MathUtils.degToRad(Number(msg.x) || 0);
                if ('y' in msg) cube.rotation.y = THREE.MathUtils.degToRad(Number(msg.y) || 0);
                if ('z' in msg) cube.rotation.z = THREE.MathUtils.degToRad(Number(msg.z) || 0);
            }
        });
        conn.on('close', () => { statusEl.textContent = 'OUTPUT: connection closed'; });
        conn.on('error', e => { statusEl.textContent = `OUTPUT conn error: ${e?.type || e}`; });
    });
});