// ============================================================
// KEYMAP.JS - CENTRAL INPUT & VIRTUAL GAMEPAD HANDLER
// ============================================================

var keyDownTime_Star = 0;

// Mapping tombol keyboard fisik ke MIDP Java Key Code
const MIDP_KEYS = {
    'ArrowUp': -1,
    'ArrowDown': -2,
    'ArrowLeft': -3,
    'ArrowRight': -4,
    'Enter': -5,
    'SoftLeft': -6,
    'Q': -6,
    'q': -6,
    'SoftRight': -7,
    'E': -7,
    'e': -7,
    '0': 48, '1': 49, '2': 50, '3': 51, '4': 52,
    '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,
    '*': 42, '#': 35
};

// ------------------------------------------------------------
// 1. Handling Keyboard Fisik
// ------------------------------------------------------------
function handleKeydown(e) {
    if (e.key !== "EndCall" && e.key !== "Backspace") {
        // e.preventDefault();
    } 
    const code = MIDP_KEYS[e.key];
    if (code !== undefined && typeof MIDP !== 'undefined' && MIDP.sendKeyPress) {
        if (e.key === '*' && keyDownTime_Star === 0) {
            keyDownTime_Star = Date.now();
        }
        MIDP.sendKeyPress(code);
    }
}

function handleKeyup(e) {
    if (e.key !== "EndCall" && e.key !== "Backspace") {
        e.preventDefault();
    }
    const code = MIDP_KEYS[e.key];
    if (code !== undefined && typeof MIDP !== 'undefined' && MIDP.sendKeyRelease) {
        if (e.key === '*') {
            if (Date.now() - keyDownTime_Star > 1000) {
                var fileElem = document.getElementById("File");
                if (fileElem) fileElem.click();
            }
            keyDownTime_Star = 0;
        }
        MIDP.sendKeyRelease(code);
    }
}

window.addEventListener('keydown', handleKeydown);
window.addEventListener('keyup', handleKeyup);

// ------------------------------------------------------------
// 2. Handling Touch/Click Pada Tombol Virtual Gamepad HTML
// ------------------------------------------------------------
var SupportsTouches = ('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch);
var StartEvent = SupportsTouches ? "touchstart" : "mousedown";
var EndEvent = SupportsTouches ? "touchend" : "mouseup";

function handleVirtualButton(e, isPress) {
    // Hanya cegah event default dan tangani input jika sentuhan terjadi di area #gamepad
    var gamepadContainer = document.getElementById('gamepad');
    if (!gamepadContainer || !gamepadContainer.contains(e.target)) {
        return; 
    }

    if (e && e.cancelable) e.preventDefault();
    
    // Cari elemen button terdekat meskipun touch tepat di atas span/icon
    var target = e.target.closest ? e.target.closest('button') : e.target;
    if (!target || target.tagName !== 'BUTTON') return;

    var keyAttr = target.getAttribute('data-key') || target.innerText.trim();
    var action = isPress ? MIDP.sendKeyPress : MIDP.sendKeyRelease;
    if (typeof MIDP === 'undefined' || typeof action !== 'function') return;

    switch (keyAttr.toLowerCase()) {
        case '↑': case 'up': case 'arrowup': action(-1); break;
        case '↓': case 'down': case 'arrowdown': action(-2); break;
        case '←': case 'left': case 'arrowleft': action(-3); break;
        case '→': case 'right': case 'arrowright': action(-4); break;
        case 'ok': case 'enter': action(-5); break;
        case 'l': case 'softleft': action(-6); break;
        case 'r': case 'softright': action(-7); break;
        case '0': action(48); break;
        case '1': action(49); break;
        case '2': action(50); break;
        case '3': action(51); break;
        case '4': action(52); break;
        case '5': action(53); break;
        case '6': action(54); break;
        case '7': action(55); break;
        case '8': action(56); break;
        case '9': action(57); break;
        case '*':
            if (isPress) {
                if (keyDownTime_Star === 0) keyDownTime_Star = Date.now();
                action(42);
            } else {
                if (Date.now() - keyDownTime_Star > 1000) {
                    var fileElem = document.getElementById("File");
                    if (fileElem) fileElem.click();
                }
                keyDownTime_Star = 0;
                action(42);
            }
            break;
        case '#': action(35); break;
    }
}

window.addEventListener(StartEvent, function (e) { handleVirtualButton(e, true); }, { passive: false });
window.addEventListener(EndEvent, function (e) { handleVirtualButton(e, false); }, { passive: false });

// ------------------------------------------------------------
// 3. Handling Direct Canvas Touch (Game Layar Sentuh 400x800)
// ------------------------------------------------------------
function setupCanvasDirectTouch() {
    var canvas = document.getElementById('canvas');
    if (!canvas) return;

    function passCanvasTouch(e) {
        if (typeof MIDP === 'undefined') return;
        var rect = canvas.getBoundingClientRect();
        var touch = e.touches[0] || e.changedTouches[0];
        if (!touch) return;

        // Kalkulasi posisi x,y sesuai resolusi internal canvas 400x800
        var x = Math.round((touch.clientX - rect.left) * (canvas.width / rect.width));
        var y = Math.round((touch.clientY - rect.top) * (canvas.height / rect.height));

        if (e.type === 'touchstart' && typeof MIDP.sendPointerPressed === 'function') {
            MIDP.sendPointerPressed(x, y);
        } else if (e.type === 'touchend' && typeof MIDP.sendPointerReleased === 'function') {
            MIDP.sendPointerReleased(x, y);
        } else if (e.type === 'touchmove' && typeof MIDP.sendPointerDragged === 'function') {
            MIDP.sendPointerDragged(x, y);
        }
    }

    canvas.addEventListener('touchstart', passCanvasTouch, { passive: false });
    canvas.addEventListener('touchend', passCanvasTouch, { passive: false });
    canvas.addEventListener('touchmove', passCanvasTouch, { passive: false });
}

// ------------------------------------------------------------
// 4. File Upload Listener & Initialization
// ------------------------------------------------------------
const onUploadFile = function(e){
    const _files = e.target.files;
    if (_files.length === 0) return;
    const _file = _files[0];
    if (typeof fs !== 'undefined' && fs.createUniqueFile) {
        fs.createUniqueFile("/Phone", _file.name, _file);
    }
};

window.addEventListener("load", function(){
    var fileElem = document.getElementById("File");
    if (fileElem) fileElem.addEventListener("change", onUploadFile); 
    setupCanvasDirectTouch();
});
