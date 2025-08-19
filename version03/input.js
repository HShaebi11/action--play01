function makeRotatable(knobId, outputId, { min, max, value, step }) {
    const knob = document.getElementById(knobId);
    const output = document.getElementById(outputId);

    let isDragging = false;
    let centerX, centerY;
    let currentValue = value;

    // Keep pages from scrolling while dragging on touch
    knob.style.touchAction = 'none';

    function updateDisplay() {
        const rounded = Math.round(currentValue); // no decimals
        knob.style.transform = `rotate(${rounded}deg)`;
        // write to both text and .value so listeners work regardless of element type
        output.textContent = String(rounded);
        if ('value' in output) output.value = String(rounded);
        // fire an input event so your queueSend() listener runs
        output.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function getAngle(x, y) {
        const dx = x - centerX;
        const dy = y - centerY;
        return Math.atan2(dy, dx) * (180 / Math.PI); // -180..180
    }

    function startDrag(e) {
        e.preventDefault();
        isDragging = true;
        const rect = knob.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
    }

    function duringDrag(e) {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // normalize to 0..360
        let angle = getAngle(clientX, clientY);
        if (angle < 0) angle += 360;

        // invert mapping: 0deg -> max, 360deg -> min
        const range = max - min;
        let mapped = max - (angle / 360) * range;

        // snap to step relative to min
        mapped = Math.round((mapped - min) / step) * step + min;

        // clamp
        mapped = Math.max(min, Math.min(max, mapped));

        currentValue = mapped;
        updateDisplay();
    }

    function endDrag() { isDragging = false; }

    knob.addEventListener('mousedown', startDrag);
    knob.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('mousemove', duringDrag);
    window.addEventListener('touchmove', duringDrag, { passive: false });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);

    updateDisplay();
}

makeRotatable("dial00", "dial00-value", { min: 0, max: 360, value: 90, step: 0.1 });
makeRotatable("dial01", "dial01-value", { min: 0, max: 360, value: 90, step: 0.1 });
makeRotatable("dial02", "dial02-value", { min: 0, max: 360, value: 90, step: 0.1 });

const rx3 = document.getElementById("dial00-value");
const ry3 = document.getElementById("dial01-value");
const rz3 = document.getElementById("dial02-value");

const px = document.getElementById("position-x");
const py = document.getElementById("position-y");
const pz = document.getElementById("position-z");

function getValues() {
    return {
        x: Number(px?.value ?? 0),
        y: Number(py?.value ?? 0),
        z: Number(pz?.value ?? 0),
        rx: Number(rx3?.value ?? 0),
        ry: Number(ry3?.value ?? 0),
        rz: Number(rz3?.value ?? 0),

    };
}

function readNumber(el) {
    if (!el) return 0;
    const raw = ('value' in el && el.value !== undefined) ? el.value : el.textContent;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
}

function getValues() {
    return {
        x: readNumber(document.getElementById("position-x")),
        y: readNumber(document.getElementById("position-y")),
        z: readNumber(document.getElementById("position-z")),
        rx: readNumber(document.getElementById("dial00-value")),
        ry: readNumber(document.getElementById("dial01-value")),
        rz: readNumber(document.getElementById("dial02-value")),
    };
}

let conn = null;

import Peer from 'https://esm.sh/peerjs@1.5.2?target=es2020';
const TARGET_ID = 'three-output-003'; // must match output page

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

[px, py, pz, rx3, ry3, rz3].forEach(el => {
    el?.addEventListener('input', queueSend);
    el?.addEventListener('change', queueSend);
});