import Peer from 'https://esm.sh/peerjs@1.5.2?target=es2020';

const TARGET_ID = 'three-output-001'; // must match output page

const sx = document.getElementById("position-x");
const sy = document.getElementById("position-y");
const sz = document.getElementById("position-z");
const srx = document.getElementById("rotation-x");
const sry = document.getElementById("rotation-y");
const srz = document.getElementById("rotation-z");

function getValues() {
    return {
        x: Number(sx?.value ?? 0),
        y: Number(sy?.value ?? 0),
        z: Number(sz?.value ?? 0),
        rx: Number(srx?.value ?? 0),
        ry: Number(sry?.value ?? 0),
        rz: Number(srz?.value ?? 0),
    };
}

let conn = null;

// Connect PeerJS
const peer = new Peer(undefined, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
});

peer.on('open', id => {
    console.log('[INPUT] Peer open:', id);
    conn = peer.connect(TARGET_ID, { reliable: true });

    conn.on('open', () => {
        console.log('[INPUT] Connected to', TARGET_ID);
        conn.send(getValues()); // send initial
    });
});

peer.on('error', err => console.error('[INPUT] Peer error:', err));

let rafPending = false;
function queueSend() {
    if (!conn || !conn.open) return;
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
        rafPending = false;
        conn.send(getValues());
    });
}

[sx, sy, sz].forEach(el => {
    el?.addEventListener('input', queueSend);
    el?.addEventListener('change', queueSend);
});


[srx, sry, srz].forEach(el => {
    el?.addEventListener('input', queueSend);
    el?.addEventListener('change', queueSend);
});