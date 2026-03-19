// ===== ADMIN CMS V4 - Universal Click-to-Edit =====
// คลิกที่ไหนก็แก้ได้! + ลากย้ายตำแหน่ง section + แก้ไขแชท
// Password: 123k4 | Ctrl+Shift+A or triple-click copyright
(function () {
    'use strict';
    const PW = '123k4', SK = 'prachin_admin_edits', SSK = 'prachin_admin_session', STK = 'prachin_admin_settings',
        SCK = 'prachin_admin_sections', CLK = 'prachin_admin_colors', CSK = 'prachin_admin_css', LOK = 'prachin_admin_layout',
        SOK = 'prachin_admin_section_order';
    const $ = s => document.getElementById(s), $$ = s => document.querySelectorAll(s);
    const toolbar = $('adminToolbar'), editBtn = $('adminToggleEdit'), saveBtn = $('adminSave'), resetBtn = $('adminReset'),
        logoutBtn = $('adminLogout'), settingsBtn = $('adminSettings'), sectionsBtn = $('adminSections'),
        helpBtn = $('adminHelp'), exportBtn = $('adminExport'), cssBtn = $('adminCss'),
        undoBtn = $('adminUndo'), redoBtn = $('adminRedo');
    const chatMode = $('chatModeIndicator'), replyToggle = $('adminReplyToggle'), clearChat = $('adminClearChat');
    let isEditing = false, hasChanges = false, adminReply = false, undoStack = [], redoStack = [], dragSec = null;

    // Default settings
    const DS = {
        aiEnabled: false, apiKey: '', aiPrompt: 'คุณเป็นพนักงานรับจองรถขนของย้ายบ้าน "ปราจีนบุรีขนส่ง" ใกล้นิคม 304 อ.ศรีมหาโพธิ จ.ปราจีนบุรี\n\nราคา:\n- รถกระบะ: 800 บาท\n- รถ 4 ล้อ: 2,000 บาท\n- รถ 6 ล้อ: 4,500 บาท\n\nเวลา: 06:00-21:00\nเบอร์: 081-234-5678\nLINE: @prachinmove\n\nตอบสุภาพ กระชับ ใช้ emoji ห้ามบอกว่าเป็น AI',
        phone: '081-234-5678', lineId: '@prachinmove', email: 'info@prachinmove.com', hours: '06:00 - 21:00 ทุกวัน', pricePickup: 800, price4w: 2000, price6w: 4500
    };

    // Helpers
    function ls(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
    function ss(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
    function toast(m) { $$('.admin-save-toast').forEach(t => t.remove()); const t = document.createElement('div'); t.className = 'admin-save-toast'; t.innerHTML = `<span class="material-icons-round">check_circle</span> ${m}`; document.body.appendChild(t); requestAnimationFrame(() => t.classList.add('show')); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2500); }
    function gid(el) { const p = []; let c = el; while (c && c !== document.body) { let s = c.tagName.toLowerCase(); if (c.id) { p.unshift('#' + c.id); break; } if (c.className && typeof c.className === 'string') { const cn = c.className.split(/\s+/).filter(x => x && !/^(visible|active|reveal|admin|show|drag|editing|promo-bar)/.test(x)).slice(0, 2).join('.'); if (cn) s += '.' + cn; } const pr = c.parentElement; if (pr) { const si = Array.from(pr.children).filter(x => x.tagName === c.tagName); if (si.length > 1) s += ':nth(' + si.indexOf(c) + ')'; } p.unshift(s); c = c.parentElement; } return p.join('>'); }
    window.adminSettings = { ...DS, ...(ls(STK) || {}) };

    // Admin-only selectors to skip
    const SKIP = '.admin-toolbar,.admin-login-overlay,.admin-settings-panel,.admin-sections-panel,.admin-help-panel,.admin-css-panel,.admin-layout-panel,.admin-chat-editor,.admin-format-bar,.admin-context-menu,.admin-style-popup,.admin-link-popup,.admin-icon-popup,.admin-section-handle,.admin-save-toast';

    // Sections for reorder
    const ALL_SECTIONS = () => Array.from(document.querySelectorAll('body > section, body > footer, body > .trust-strip, body > nav, body > .promo-bar, .flash-section, .why-section, .bundle-section, .guarantee-section, .seasonal-section, .countdown-section, .share-section, .lead-section')).filter(s => !s.closest(SKIP));

    // ===== INIT =====
    function init() {
        if (sessionStorage.getItem(SSK) === 'true') showTB();
        loadEdits(); applySV(); applyColors(); applyCss(); applySectionOrder(); applyLayout(); updateChat();
        createFmtBar(); createCtxMenu(); createStylePopup(); createLayoutPanel(); createChatEditor();
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); sessionStorage.getItem(SSK) === 'true' ? toggleEdit() : showLogin(); }
            if (isEditing && e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
            if (isEditing && e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
        });
        const fb = document.querySelector('.footer-bottom');
        if (fb) { let cc = 0, ct; fb.addEventListener('click', () => { cc++; if (cc === 3) { cc = 0; clearTimeout(ct); if (sessionStorage.getItem(SSK) !== 'true') showLogin(); } else { clearTimeout(ct); ct = setTimeout(() => cc = 0, 600); } }); }
    }

    // ===== LOGIN =====
    function showLogin() { const o = $('adminLoginOverlay'); o.classList.add('active'); $('adminPassword').value = ''; $('adminLoginError').textContent = ''; setTimeout(() => $('adminPassword').focus(), 300); }
    function hideLogin() { $('adminLoginOverlay').classList.remove('active'); }
    $('adminLoginForm').addEventListener('submit', e => { e.preventDefault(); if ($('adminPassword').value.trim() === PW) { sessionStorage.setItem(SSK, 'true'); hideLogin(); showTB(); toast('เข้าสู่ระบบแอดมิน ✅'); } else { $('adminLoginError').textContent = '❌ รหัสไม่ถูกต้อง'; $('adminPassword').value = ''; $('adminPassword').focus(); } });
    $('adminLoginClose').addEventListener('click', hideLogin);
    $('adminLoginOverlay').addEventListener('click', e => { if (e.target === $('adminLoginOverlay')) hideLogin(); });

    // ===== TOOLBAR =====
    function showTB() { toolbar.classList.add('active'); document.body.classList.add('admin-active'); }
    function hideTB() { toolbar.classList.remove('active'); document.body.classList.remove('admin-active'); if (isEditing) toggleEdit(); }

    // ===== UNIVERSAL CLICK-TO-EDIT =====
    function toggleEdit() {
        isEditing = !isEditing;
        document.body.classList.toggle('admin-editing', isEditing);
        editBtn.classList.toggle('editing', isEditing);
        editBtn.querySelector('span:last-child').textContent = isEditing ? 'แก้ไขอยู่' : 'แก้ไข';
        if (isEditing) { enableUniversalEdit(); pushUndo(); }
        else { disableUniversalEdit(); hideFmt(); hideCtx(); }
    }
    editBtn.addEventListener('click', toggleEdit);

    // Elements that are text-editable
    const TEXT_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'STRONG', 'EM', 'B', 'I', 'U', 'LI', 'LABEL', 'BUTTON', 'SMALL', 'BLOCKQUOTE', 'TD', 'TH', 'FIGCAPTION', 'LEGEND', 'DT', 'DD']);
    const SKIP_EDIT = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'SVG', 'PATH', 'INPUT', 'SELECT', 'TEXTAREA', 'IFRAME', 'VIDEO', 'AUDIO', 'IMG', 'BR', 'HR']);

    function enableUniversalEdit() {
        // Make all text clickable-to-edit
        document.body.addEventListener('click', onClickEdit, true);
        // Add section drag handles
        injectSectionHandles();
        // Add add/delete buttons
        injectCardBtns();
    }
    function disableUniversalEdit() {
        document.body.removeEventListener('click', onClickEdit, true);
        // Remove contenteditable from all
        $$('[contenteditable="true"]').forEach(el => { el.removeAttribute('contenteditable'); el.removeAttribute('data-editing'); });
        // Remove handles
        $$('.admin-section-handle').forEach(h => h.remove());
        $$('.admin-delete-item,.admin-duplicate-btn,.admin-add-btn').forEach(b => b.remove());
    }

    function onClickEdit(e) {
        if (!isEditing) return;
        const el = e.target;
        // Skip admin UI
        if (el.closest(SKIP)) return;
        if (el.closest('.admin-delete-item,.admin-duplicate-btn,.admin-add-btn,.admin-section-handle')) return;
        // Skip non-text elements
        if (SKIP_EDIT.has(el.tagName)) return;
        // If already editing, let it be
        if (el.getAttribute('contenteditable') === 'true') return;
        // Check if it's a text element or has direct text
        if (TEXT_TAGS.has(el.tagName) || (el.childNodes.length > 0 && Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim()))) {
            e.preventDefault(); e.stopPropagation();
            el.setAttribute('contenteditable', 'true');
            el.setAttribute('data-editing', 'true');
            el.setAttribute('spellcheck', 'false');
            el.focus();
            // Show label
            const label = el.tagName.toLowerCase();
            el.setAttribute('data-edit-label', '📝 ' + label);
            // Listen for changes
            el.addEventListener('input', onContentChange);
            el.addEventListener('blur', onBlurEdit);
            el.addEventListener('mouseup', onTextSelect);
            el.addEventListener('keyup', onTextSelect);
        }
    }
    function onContentChange() { hasChanges = true; saveBtn.disabled = false; }
    function onBlurEdit(e) {
        const el = e.target;
        // Small delay to allow clicking format bar
        setTimeout(() => {
            if (!el.contains(document.activeElement) && document.activeElement !== el) {
                // Keep contenteditable but remove the visual label after blur
            }
        }, 200);
    }

    // ===== UNDO / REDO =====
    function getSnapshot() {
        const d = {};
        $$('[data-editing]').forEach(el => { d[gid(el)] = el.innerHTML; });
        // Also save all text content of the page
        document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,strong,li,label,button,small,td,th').forEach(el => {
            if (!el.closest(SKIP) && el.textContent.trim()) { d[gid(el)] = el.innerHTML; }
        });
        return JSON.stringify(d);
    }
    function pushUndo() { undoStack.push(getSnapshot()); if (undoStack.length > 30) undoStack.shift(); redoStack = []; updateUndoBtn(); }
    function undo() { if (undoStack.length < 2) return; redoStack.push(undoStack.pop()); applySnap(undoStack[undoStack.length - 1]); updateUndoBtn(); toast('ย้อนกลับ ↩️'); }
    function redo() { if (!redoStack.length) return; const s = redoStack.pop(); undoStack.push(s); applySnap(s); updateUndoBtn(); toast('ทำซ้ำ ↪️'); }
    function applySnap(json) { try { const d = JSON.parse(json); Object.entries(d).forEach(([k, v]) => { document.querySelectorAll('*').forEach(el => { if (gid(el) === k) el.innerHTML = v; }); }); } catch { } }
    function updateUndoBtn() { if (undoBtn) undoBtn.disabled = undoStack.length < 2; if (redoBtn) redoBtn.disabled = !redoStack.length; }
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (redoBtn) redoBtn.addEventListener('click', redo);

    // ===== SECTION DRAG & REORDER =====
    function injectSectionHandles() {
        ALL_SECTIONS().forEach((sec, i) => {
            if (sec.querySelector('.admin-section-handle')) return;
            sec.style.position = sec.style.position || 'relative';
            const h = document.createElement('div');
            h.className = 'admin-section-handle';
            h.innerHTML = `<span class="material-icons-round">drag_indicator</span> <span class="handle-label">${sec.id || sec.className.split(' ')[0] || 'section'}</span> <span class="handle-order">#${i + 1}</span>`;
            h.setAttribute('draggable', 'true');
            h.addEventListener('dragstart', e => { dragSec = sec; sec.classList.add('section-dragging'); e.dataTransfer.effectAllowed = 'move'; });
            sec.addEventListener('dragover', e => { e.preventDefault(); if (dragSec && dragSec !== sec) sec.classList.add('section-drag-over'); });
            sec.addEventListener('dragleave', () => sec.classList.remove('section-drag-over'));
            sec.addEventListener('drop', e => {
                e.preventDefault(); sec.classList.remove('section-drag-over');
                if (dragSec && dragSec !== sec) {
                    const rect = sec.getBoundingClientRect(); const mid = rect.top + rect.height / 2;
                    if (e.clientY < mid) sec.parentElement.insertBefore(dragSec, sec);
                    else sec.parentElement.insertBefore(dragSec, sec.nextSibling);
                    saveSectionOrder(); renumberHandles(); onChange(); toast('ย้าย section แล้ว 📌');
                }
            });
            sec.addEventListener('dragend', () => { if (dragSec) dragSec.classList.remove('section-dragging'); $$('.section-drag-over').forEach(x => x.classList.remove('section-drag-over')); dragSec = null; });
            sec.appendChild(h);
        });
    }
    function renumberHandles() { ALL_SECTIONS().forEach((sec, i) => { const h = sec.querySelector('.handle-order'); if (h) h.textContent = '#' + (i + 1); }); }
    function saveSectionOrder() { const order = ALL_SECTIONS().map(s => s.id || s.className.split(' ')[0]); ss(SOK, order); }
    function applySectionOrder() { const order = ls(SOK); if (!order || !Array.isArray(order)) return; const parent = document.querySelector('body'); const secs = ALL_SECTIONS(); const ref = secs[0]; if (!ref) return; order.forEach(id => { const sec = secs.find(s => (s.id || s.className.split(' ')[0]) === id); if (sec) parent.insertBefore(sec, ref); }); }

    // ===== CARD BUTTONS (Delete + Duplicate + Add) =====
    function injectCardBtns() {
        const CARDS = '.service-card,.step-card,.area-card,.review-card,.faq-item,.flash-card,.why-card,.bundle-card,.guarantee-card,.trust-item,.quick-btn';
        $$(CARDS).forEach(el => {
            if (el.querySelector('.admin-delete-item')) return;
            const d = document.createElement('button'); d.className = 'admin-delete-item'; d.innerHTML = '✕'; d.title = 'ลบ';
            d.addEventListener('click', e => { e.stopPropagation(); if (confirm('ลบ?')) { pushUndo(); el.remove(); onChange(); } }); el.appendChild(d);
            const u = document.createElement('button'); u.className = 'admin-duplicate-btn'; u.innerHTML = '+'; u.title = 'ทำซ้ำ';
            u.addEventListener('click', e => { e.stopPropagation(); pushUndo(); const c = el.cloneNode(true); c.querySelectorAll('.admin-delete-item,.admin-duplicate-btn').forEach(b => b.remove()); el.parentElement.insertBefore(c, el.nextSibling); injectCardBtns(); onChange(); toast('ทำซ้ำ ✅'); }); el.appendChild(u);
        });
        // Add buttons for containers
        const CONTAINERS = ['.faq-list', '.reviews-grid', '.areas-grid', '.services-grid', '.steps-grid', '.flash-grid', '.why-grid', '.bundle-grid', '.guarantee-grid', '.trust-strip'];
        CONTAINERS.forEach(sel => {
            const p = document.querySelector(sel); if (p && !p.querySelector('.admin-add-btn')) {
                const b = document.createElement('button'); b.className = 'admin-add-btn'; b.innerHTML = '<span class="material-icons-round">add_circle</span> เพิ่มใหม่';
                b.addEventListener('click', () => { pushUndo(); const items = p.querySelectorAll(':scope > :not(.admin-add-btn)'); if (items.length) { const c = items[items.length - 1].cloneNode(true); c.querySelectorAll('.admin-delete-item,.admin-duplicate-btn').forEach(x => x.remove()); p.insertBefore(c, b); injectCardBtns(); onChange(); toast('เพิ่มแล้ว ✅'); } });
                p.appendChild(b);
            }
        });
    }
    function onChange() { hasChanges = true; saveBtn.disabled = false; }

    // ===== FORMAT TOOLBAR =====
    let fmtBar;
    function createFmtBar() {
        fmtBar = document.createElement('div'); fmtBar.className = 'admin-format-bar';
        fmtBar.innerHTML = `<button data-cmd="bold" title="หนา"><span class="material-icons-round">format_bold</span></button><button data-cmd="italic" title="เอียง"><span class="material-icons-round">format_italic</span></button><button data-cmd="underline" title="ขีดเส้น"><span class="material-icons-round">format_underlined</span></button><button data-cmd="strikeThrough" title="ขีดฆ่า"><span class="material-icons-round">strikethrough_s</span></button><span class="fmt-divider"></span><button data-cmd="justifyLeft"><span class="material-icons-round">format_align_left</span></button><button data-cmd="justifyCenter"><span class="material-icons-round">format_align_center</span></button><button data-cmd="justifyRight"><span class="material-icons-round">format_align_right</span></button><span class="fmt-divider"></span><input type="color" class="fmt-color-input" value="#ff6d00" title="สี"><select class="fmt-size-select"><option value="">ขนาด</option><option value="1">จิ๋ว</option><option value="2">เล็ก</option><option value="3">ปกติ</option><option value="4">กลาง</option><option value="5">ใหญ่</option><option value="6">ใหญ่มาก</option><option value="7">ยักษ์</option></select><span class="fmt-divider"></span><button data-cmd="removeFormat"><span class="material-icons-round">format_clear</span></button>`;
        document.body.appendChild(fmtBar);
        fmtBar.querySelectorAll('button[data-cmd]').forEach(b => { b.addEventListener('mousedown', e => { e.preventDefault(); document.execCommand(b.dataset.cmd, false, null); pushUndo(); onChange(); }); });
        fmtBar.querySelector('.fmt-color-input').addEventListener('input', e => { document.execCommand('foreColor', false, e.target.value); pushUndo(); onChange(); });
        fmtBar.querySelector('.fmt-size-select').addEventListener('change', e => { if (e.target.value) { document.execCommand('fontSize', false, e.target.value); pushUndo(); onChange(); } e.target.value = ''; });
    }
    function onTextSelect() { const s = window.getSelection(); if (!s || s.isCollapsed || !s.rangeCount) { hideFmt(); return; } const r = s.getRangeAt(0).getBoundingClientRect(); if (r.width < 2) { hideFmt(); return; } fmtBar.style.left = (r.left + r.width / 2 + window.scrollX) + 'px'; fmtBar.style.top = (r.top + window.scrollY - 44) + 'px'; fmtBar.classList.add('visible'); }
    function hideFmt() { if (fmtBar) fmtBar.classList.remove('visible'); }
    document.addEventListener('mousedown', e => { if (fmtBar && !fmtBar.contains(e.target) && !e.target.closest('[contenteditable]')) hideFmt(); });

    // ===== CONTEXT MENU =====
    let ctxMenu, ctxTarget;
    function createCtxMenu() {
        ctxMenu = document.createElement('div'); ctxMenu.className = 'admin-context-menu';
        ctxMenu.innerHTML = `<button data-a="dup"><span class="material-icons-round">content_copy</span>ทำซ้ำ</button><button data-a="del"><span class="material-icons-round">delete</span>ลบ</button><div class="ctx-divider"></div><button data-a="up"><span class="material-icons-round">arrow_upward</span>ย้ายขึ้น</button><button data-a="down"><span class="material-icons-round">arrow_downward</span>ย้ายลง</button><div class="ctx-divider"></div><button data-a="style"><span class="material-icons-round">palette</span>แก้สไตล์</button><button data-a="layout"><span class="material-icons-round">dashboard</span>จัดวาง</button><button data-a="copy"><span class="material-icons-round">content_paste</span>คัดลอก</button>`;
        document.body.appendChild(ctxMenu);
        ctxMenu.querySelectorAll('button[data-a]').forEach(b => {
            b.addEventListener('click', () => {
                if (!ctxTarget) return; const a = b.dataset.a;
                if (a === 'dup') { pushUndo(); const c = ctxTarget.cloneNode(true); ctxTarget.parentElement.insertBefore(c, ctxTarget.nextSibling); injectCardBtns(); onChange(); toast('ทำซ้ำ ✅'); }
                if (a === 'del') { if (confirm('ลบ?')) { pushUndo(); ctxTarget.remove(); onChange(); toast('ลบแล้ว 🗑️'); } }
                if (a === 'up') { const p = ctxTarget.previousElementSibling; if (p) { pushUndo(); ctxTarget.parentElement.insertBefore(ctxTarget, p); onChange(); toast('ย้ายขึ้น ⬆️'); } }
                if (a === 'down') { const n = ctxTarget.nextElementSibling; if (n) { pushUndo(); ctxTarget.parentElement.insertBefore(n, ctxTarget); onChange(); toast('ย้ายลง ⬇️'); } }
                if (a === 'style') showStylePopup(ctxTarget);
                if (a === 'layout') showLayoutPanel(ctxTarget);
                if (a === 'copy') { navigator.clipboard.writeText(ctxTarget.textContent.trim()); toast('คัดลอก 📋'); }
                hideCtx();
            });
        });
        document.addEventListener('contextmenu', e => { if (!isEditing) return; const t = e.target; if (t.closest(SKIP)) return; e.preventDefault(); ctxTarget = t.closest('section,div,nav,footer,article') || t; ctxMenu.style.left = e.pageX + 'px'; ctxMenu.style.top = e.pageY + 'px'; ctxMenu.classList.add('visible'); });
        document.addEventListener('click', e => { if (!ctxMenu.contains(e.target)) hideCtx(); });
    }
    function hideCtx() { if (ctxMenu) ctxMenu.classList.remove('visible'); }

    // ===== STYLE EDITOR =====
    let stylePopup, styleTarget;
    function createStylePopup() {
        stylePopup = document.createElement('div'); stylePopup.className = 'admin-style-popup';
        stylePopup.innerHTML = `<div class="admin-style-popup-header"><span>🎨 แก้สไตล์</span><button onclick="this.closest('.admin-style-popup').classList.remove('visible')">✕</button></div><div class="admin-style-popup-body"><div class="style-row"><label>Padding</label><input type="range" id="stPad" min="0" max="60" value="16"><span id="stPadV">16px</span></div><div class="style-row"><label>มุมโค้ง</label><input type="range" id="stRad" min="0" max="50" value="12"><span id="stRadV">12px</span></div><div class="style-row"><label>เงา</label><input type="range" id="stShd" min="0" max="50" value="0"><span id="stShdV">0px</span></div><div class="style-row"><label>ความโปร่ง</label><input type="range" id="stOpa" min="10" max="100" value="100"><span id="stOpaV">100%</span></div><div class="style-row"><label>สีพื้น</label><input type="color" id="stBg" value="#ffffff"></div><div class="style-row"><label>สีตัวอักษร</label><input type="color" id="stTxt" value="#333333"></div><div class="style-row"><label>ขนาดตัวอักษร</label><input type="range" id="stFs" min="8" max="60" value="16"><span id="stFsV">16px</span></div><div class="style-row"><label>เส้นขอบ</label><input type="color" id="stBrd" value="#e0e0e0"><input type="range" id="stBrdW" min="0" max="8" value="0"><span id="stBrdWV">0px</span></div><button class="style-apply-btn" id="stApply">✅ ใช้</button><button class="style-reset-btn" id="stReset">รีเซ็ต</button></div>`;
        document.body.appendChild(stylePopup);
        ['stPad', 'stRad', 'stShd', 'stOpa', 'stBrdW', 'stFs'].forEach(id => { const el = $(id); if (el) el.addEventListener('input', () => { $(id + 'V').textContent = el.value + (id === 'stOpa' ? '%' : 'px'); previewStyle(); }); });
        $('stBg')?.addEventListener('input', previewStyle); $('stBrd')?.addEventListener('input', previewStyle); $('stTxt')?.addEventListener('input', previewStyle);
        $('stApply')?.addEventListener('click', () => { pushUndo(); onChange(); stylePopup.classList.remove('visible'); toast('ใช้สไตล์ ✅'); });
        $('stReset')?.addEventListener('click', () => { if (styleTarget) { styleTarget.removeAttribute('style'); stylePopup.classList.remove('visible'); onChange(); toast('รีเซ็ต ✅'); } });
    }
    function showStylePopup(el) { styleTarget = el; const cs = getComputedStyle(el); $('stPad').value = parseInt(cs.padding) || 16; $('stPadV').textContent = (parseInt(cs.padding) || 16) + 'px'; $('stRad').value = parseInt(cs.borderRadius) || 0; $('stRadV').textContent = (parseInt(cs.borderRadius) || 0) + 'px'; $('stOpa').value = Math.round((parseFloat(cs.opacity) || 1) * 100); $('stOpaV').textContent = Math.round((parseFloat(cs.opacity) || 1) * 100) + '%'; $('stFs').value = parseInt(cs.fontSize) || 16; $('stFsV').textContent = (parseInt(cs.fontSize) || 16) + 'px'; stylePopup.style.cssText = 'left:50%;top:100px;transform:translateX(-50%);position:fixed;'; stylePopup.classList.add('visible'); }
    function previewStyle() { if (!styleTarget) return; const s = styleTarget.style; s.padding = $('stPad').value + 'px'; s.borderRadius = $('stRad').value + 'px'; const sv = $('stShd').value; s.boxShadow = sv > 0 ? `0 ${sv}px ${sv * 2}px rgba(0,0,0,${sv / 100})` : ''; s.opacity = $('stOpa').value / 100; s.background = $('stBg').value; s.color = $('stTxt').value; s.fontSize = $('stFs').value + 'px'; const bw = $('stBrdW').value; s.border = bw > 0 ? bw + 'px solid ' + $('stBrd').value : ''; }

    // ===== LAYOUT PANEL (Flex/Grid controls) =====
    let layoutPanel, layoutTarget;
    function createLayoutPanel() {
        layoutPanel = document.createElement('div'); layoutPanel.className = 'admin-layout-panel';
        layoutPanel.innerHTML = `<div class="admin-layout-header"><span>📐 จัดวางตำแหน่ง</span><button onclick="this.closest('.admin-layout-panel').classList.remove('visible')">✕</button></div><div class="admin-layout-body">
<div class="layout-row"><label>Display</label><select id="lyDisplay"><option value="">auto</option><option value="flex">flex</option><option value="grid">grid</option><option value="block">block</option><option value="inline-flex">inline-flex</option><option value="none">ซ่อน</option></select></div>
<div class="layout-row"><label>ทิศทาง</label><select id="lyDirection"><option value="">auto</option><option value="row">แถวนอน</option><option value="column">แถวตั้ง</option><option value="row-reverse">กลับแถวนอน</option><option value="column-reverse">กลับแถวตั้ง</option></select></div>
<div class="layout-row"><label>จัดแนวหลัก</label><select id="lyJustify"><option value="">auto</option><option value="flex-start">เริ่มต้น</option><option value="center">กลาง</option><option value="flex-end">ท้าย</option><option value="space-between">กระจาย</option><option value="space-around">เว้นรอบ</option><option value="space-evenly">เท่ากัน</option></select></div>
<div class="layout-row"><label>จัดแนวรอง</label><select id="lyAlign"><option value="">auto</option><option value="flex-start">เริ่มต้น</option><option value="center">กลาง</option><option value="flex-end">ท้าย</option><option value="stretch">ยืด</option></select></div>
<div class="layout-row"><label>ระยะห่าง</label><input type="range" id="lyGap" min="0" max="60" value="16"><span id="lyGapV">16px</span></div>
<div class="layout-row"><label>Wrap</label><select id="lyWrap"><option value="">auto</option><option value="wrap">wrap</option><option value="nowrap">nowrap</option></select></div>
<div class="layout-row"><label>Grid Columns</label><select id="lyGridCols"><option value="">auto</option><option value="1fr">1 คอลัมน์</option><option value="1fr 1fr">2 คอลัมน์</option><option value="1fr 1fr 1fr">3 คอลัมน์</option><option value="1fr 1fr 1fr 1fr">4 คอลัมน์</option></select></div>
<div class="layout-row"><label>Text Align</label><select id="lyTextAlign"><option value="">auto</option><option value="left">ซ้าย</option><option value="center">กลาง</option><option value="right">ขวา</option></select></div>
<div class="layout-row"><label>Width</label><select id="lyWidth"><option value="">auto</option><option value="100%">เต็ม</option><option value="80%">80%</option><option value="60%">60%</option><option value="50%">50%</option></select></div>
<div class="layout-row"><label>Margin Auto</label><select id="lyMargin"><option value="">ปกติ</option><option value="0 auto">กลาง</option><option value="10px auto">กลาง+เว้น</option></select></div>
<button class="layout-apply-btn" id="lyApply">✅ ใช้</button><button class="layout-reset-btn" id="lyReset">รีเซ็ต</button></div>`;
        document.body.appendChild(layoutPanel);
        ['lyDisplay', 'lyDirection', 'lyJustify', 'lyAlign', 'lyWrap', 'lyGridCols', 'lyTextAlign', 'lyWidth', 'lyMargin'].forEach(id => { $(id)?.addEventListener('change', previewLayout); });
        $('lyGap')?.addEventListener('input', e => { $('lyGapV').textContent = e.target.value + 'px'; previewLayout(); });
        $('lyApply')?.addEventListener('click', () => { pushUndo(); saveLayoutToEl(); onChange(); layoutPanel.classList.remove('visible'); toast('จัดวาง ✅'); });
        $('lyReset')?.addEventListener('click', () => { if (layoutTarget) { layoutTarget.removeAttribute('style'); layoutPanel.classList.remove('visible'); onChange(); toast('รีเซ็ตวาง ✅'); } });
    }
    function showLayoutPanel(el) { layoutTarget = el; const cs = getComputedStyle(el); $('lyDisplay').value = cs.display === 'flex' ? 'flex' : cs.display === 'grid' ? 'grid' : ''; $('lyDirection').value = cs.flexDirection || ''; $('lyJustify').value = cs.justifyContent || ''; $('lyAlign').value = cs.alignItems || ''; $('lyGap').value = parseInt(cs.gap) || 16; $('lyGapV').textContent = (parseInt(cs.gap) || 16) + 'px'; layoutPanel.style.cssText = 'left:50%;top:80px;transform:translateX(-50%);position:fixed;'; layoutPanel.classList.add('visible'); }
    function previewLayout() { if (!layoutTarget) return; const s = layoutTarget.style; const v = id => $(id)?.value; if (v('lyDisplay')) s.display = v('lyDisplay'); if (v('lyDirection')) s.flexDirection = v('lyDirection'); if (v('lyJustify')) s.justifyContent = v('lyJustify'); if (v('lyAlign')) s.alignItems = v('lyAlign'); s.gap = $('lyGap').value + 'px'; if (v('lyWrap')) s.flexWrap = v('lyWrap'); if (v('lyGridCols')) s.gridTemplateColumns = v('lyGridCols'); if (v('lyTextAlign')) s.textAlign = v('lyTextAlign'); if (v('lyWidth')) s.width = v('lyWidth'); if (v('lyMargin')) s.margin = v('lyMargin'); }
    function saveLayoutToEl() { if (!layoutTarget) return; const layouts = ls(LOK) || {}; layouts[gid(layoutTarget)] = layoutTarget.style.cssText; ss(LOK, layouts); }
    function applyLayout() { const layouts = ls(LOK); if (!layouts) return; Object.entries(layouts).forEach(([k, v]) => { document.querySelectorAll('*').forEach(el => { if (gid(el) === k) el.style.cssText += v; }); }); }

    // ===== CHAT EDITOR =====
    let chatEditor;
    function createChatEditor() {
        chatEditor = document.createElement('div'); chatEditor.className = 'admin-chat-editor';
        chatEditor.innerHTML = `<div class="admin-chat-editor-header"><h3><span class="material-icons-round">chat</span> แก้ไขระบบแชท</h3><button onclick="this.closest('.admin-chat-editor').classList.remove('visible')"><span class="material-icons-round">close</span></button></div><div class="admin-chat-editor-body">
<div class="ce-field"><label>ชื่อแชท</label><input type="text" id="ceName" value="ปราจีนบุรีขนส่ง"></div>
<div class="ce-field"><label>สถานะ</label><input type="text" id="ceStatus" value="ออนไลน์ พร้อมให้บริการ"></div>
<div class="ce-field"><label>ข้อความต้อนรับ</label><textarea id="ceWelcome">สวัสดีครับ! 🚚 ยินดีให้บริการรถขนของย้ายบ้าน ใกล้นิคม 304 ศรีมหาโพธิ\n\nสอบถามราคาหรือจองรถได้เลยครับ!</textarea></div>
<div class="ce-field"><label>ปุ่มด่วน (บรรทัดละปุ่ม)</label><textarea id="ceQuickBtns">สอบถามราคา 💰\nจองรถ 🚚\nพื้นที่ให้บริการ 📍\nโทรเลย 📞</textarea></div>
<div class="ce-field"><label>คำตอบอัตโนมัติ (keyword=reply ต่อบรรทัด)</label><textarea id="ceBotReplies">ราคา=รถกระบะ 800 บาท / รถ 4 ล้อ 2,000 บาท / รถ 6 ล้อ 4,500 บาท\nจอง=กรอกฟอร์มจองเลยครับ หรือโทร 081-234-5678\nพื้นที่=ให้บริการทั่วปราจีนบุรี เน้นนิคม 304 ศรีมหาโพธิ\nเบอร์=โทร 081-234-5678 หรือ LINE: @prachinmove</textarea></div>
<div class="ce-field"><label>สีพื้นหลังแชท</label><input type="color" id="ceBgColor" value="#ffffff"></div>
<div class="ce-field"><label>สีหัวแชท</label><input type="color" id="ceHeaderColor" value="#1a237e"></div>
<button class="ce-save-btn" id="ceSave">💾 บันทึกการตั้งค่าแชท</button></div>`;
        document.body.appendChild(chatEditor);
        $('ceSave')?.addEventListener('click', () => {
            const d = { name: $('ceName').value, status: $('ceStatus').value, welcome: $('ceWelcome').value, quickBtns: $('ceQuickBtns').value, botReplies: $('ceBotReplies').value, bgColor: $('ceBgColor').value, headerColor: $('ceHeaderColor').value };
            ss('prachin_chat_config', d); applyChatConfig(d); chatEditor.classList.remove('visible'); toast('บันทึกแชท ✅');
        });
        // Load saved config
        const saved = ls('prachin_chat_config'); if (saved) applyChatConfig(saved);
    }
    function applyChatConfig(d) {
        const name = document.querySelector('.chat-header-info strong'); if (name) name.textContent = d.name;
        const status = document.querySelector('.chat-status-text'); if (status) status.textContent = d.status;
        // Quick buttons
        if (d.quickBtns) { const container = document.querySelector('.chat-quick-btns,.quick-btns'); if (container) { container.innerHTML = ''; d.quickBtns.split('\n').filter(Boolean).forEach(txt => { const b = document.createElement('button'); b.className = 'quick-btn'; b.textContent = txt; container.appendChild(b); }); } }
        // Header color
        const header = document.querySelector('.chat-header'); if (header && d.headerColor) header.style.background = d.headerColor;
        // BG color
        const body = document.querySelector('.chat-body,.chat-messages'); if (body && d.bgColor) body.style.background = d.bgColor;
        // Store bot replies for chat script
        window.adminBotReplies = {}; if (d.botReplies) { d.botReplies.split('\n').filter(Boolean).forEach(line => { const [k, v] = line.split('='); if (k && v) window.adminBotReplies[k.trim().toLowerCase()] = v.trim(); }); }
    }
    // Open chat editor button
    const chatEditBtn = document.createElement('button'); chatEditBtn.className = 'admin-btn admin-btn-chat'; chatEditBtn.innerHTML = '<span class="material-icons-round">chat</span><span>แชท</span>';

    // ===== SECTION VISIBILITY =====
    function openSections() { const p = $('adminSectionsPanel'), o = $('adminSectionsOverlay'); buildSL(); p.classList.add('active'); o.classList.add('active'); }
    function closeSec() { $('adminSectionsPanel').classList.remove('active'); $('adminSectionsOverlay').classList.remove('active'); }
    const SECS = [{ id: 'hero', name: 'หน้าแรก', sel: '.hero' }, { id: 'services', name: 'บริการ', sel: '#services' }, { id: 'price-calc', name: 'คำนวณ', sel: '#price-calc' }, { id: 'how-it-works', name: 'ขั้นตอน', sel: '#how-it-works' }, { id: 'areas', name: 'พื้นที่', sel: '#areas' }, { id: 'faq', name: 'FAQ', sel: '#faq' }, { id: 'booking', name: 'จอง', sel: '#booking' }, { id: 'reviews', name: 'รีวิว', sel: '#reviews' }, { id: 'flashSale', name: 'Flash Sale', sel: '#flashSale' }, { id: 'promoCountdown', name: 'Countdown', sel: '#promoCountdown' }];
    function buildSL() { const b = document.querySelector('.admin-sections-body'); if (!b) return; const v = ls(SCK) || {}; b.innerHTML = ''; SECS.forEach(s => { const h = v[s.id] === false; const d = document.createElement('div'); d.className = 'section-item'; d.innerHTML = `<div class="section-item-info"><strong>${s.name}</strong><small>${h ? '🔴 ซ่อน' : '🟢 แสดง'}</small></div><div class="section-item-toggle"><label class="toggle-switch"><input type="checkbox" ${h ? '' : 'checked'}><span class="toggle-slider"></span></label></div>`; d.querySelector('input').addEventListener('change', e => { const vv = ls(SCK) || {}; vv[s.id] = e.target.checked; ss(SCK, vv); applySV(); d.querySelector('small').textContent = e.target.checked ? '🟢 แสดง' : '🔴 ซ่อน'; }); b.appendChild(d); }); }
    function applySV() { const v = ls(SCK) || {}; SECS.forEach(s => { const el = document.querySelector(s.sel); if (el) el.style.display = v[s.id] === false ? 'none' : ''; }); }
    sectionsBtn?.addEventListener('click', openSections);
    $('adminSectionsClose')?.addEventListener('click', closeSec); $('adminSectionsOverlay')?.addEventListener('click', closeSec);

    // ===== BG COLORS =====
    function applyColors() { const c = ls(CLK); if (!c) return; SECS.forEach(s => { const el = document.querySelector(s.sel); if (el && c[s.id]) el.style.background = c[s.id]; }); }

    // ===== CUSTOM CSS =====
    cssBtn?.addEventListener('click', () => { const ta = $('adminCssTextarea'); if (ta) ta.value = localStorage.getItem(CSK) || ''; $('adminCssPanel').classList.add('active'); $('adminCssOverlay').classList.add('active'); });
    $('adminCssClose')?.addEventListener('click', closeCSS); $('adminCssOverlay')?.addEventListener('click', closeCSS);
    function closeCSS() { $('adminCssPanel').classList.remove('active'); $('adminCssOverlay').classList.remove('active'); }
    $('adminCssApply')?.addEventListener('click', () => { localStorage.setItem(CSK, $('adminCssTextarea').value); applyCss(); closeCSS(); toast('CSS ✅'); });
    $('adminCssClear')?.addEventListener('click', () => { $('adminCssTextarea').value = ''; localStorage.removeItem(CSK); applyCss(); toast('ล้าง CSS'); });
    function applyCss() { let el = $('adminCustomStyle'); if (!el) { el = document.createElement('style'); el.id = 'adminCustomStyle'; document.head.appendChild(el); } el.textContent = localStorage.getItem(CSK) || ''; }

    // ===== SAVE / LOAD =====
    saveBtn.addEventListener('click', () => {
        pushUndo(); const e = {}; document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,strong,em,li,label,button,small,td,th,figcaption').forEach(el => { if (!el.closest(SKIP) && el.textContent.trim() && !el.querySelector('h1,h2,h3,h4,h5,h6,p')) e[gid(el)] = el.innerHTML; });
        ['.faq-list', '.reviews-grid', '.areas-grid', '.services-grid', '.steps-grid', '.flash-grid', '.why-grid', '.bundle-grid', '.guarantee-grid', '.trust-strip'].forEach(s => { const el = document.querySelector(s); if (el) e['__html_' + s] = el.innerHTML; });
        const chatW = document.querySelector('.chat-widget'); if (chatW) e['__chat_html'] = chatW.innerHTML;
        localStorage.setItem(SK, JSON.stringify(e)); hasChanges = false; saveBtn.disabled = true; toast('บันทึกสำเร็จ 💾');
    });

    function loadEdits() {
        const s = localStorage.getItem(SK); if (!s) return; try {
            const e = JSON.parse(s);
            ['.faq-list', '.reviews-grid', '.areas-grid', '.services-grid', '.steps-grid', '.flash-grid', '.why-grid', '.bundle-grid', '.guarantee-grid', '.trust-strip'].forEach(sel => { const k = '__html_' + sel; if (e[k]) { const el = document.querySelector(sel); if (el) { el.innerHTML = e[k]; el.querySelectorAll('.faq-question').forEach(q => q.addEventListener('click', function () { this.setAttribute('aria-expanded', this.getAttribute('aria-expanded') !== 'true'); this.parentElement.classList.toggle('active'); })); } } });
            if (e['__chat_html']) { const chatW = document.querySelector('.chat-widget'); if (chatW) chatW.innerHTML = e['__chat_html']; }
            Object.entries(e).forEach(([k, v]) => { if (k.startsWith('__')) return; document.querySelectorAll('*').forEach(el => { if (!el.closest(SKIP) && gid(el) === k && !el.querySelector('h1,h2,h3,h4,h5,h6,p')) el.innerHTML = v; }); });
        } catch (err) { console.error(err); }
    }

    // ===== RESET / LOGOUT =====
    resetBtn.addEventListener('click', () => { if (confirm('รีเซ็ตทั้งหมด?')) { [SK, SCK, CLK, CSK, LOK, SOK, 'prachin_chat_config'].forEach(k => localStorage.removeItem(k)); toast('รีเซ็ต 🔄'); setTimeout(() => location.reload(), 800); } });
    logoutBtn.addEventListener('click', () => { if (hasChanges && !confirm('ยังไม่บันทึก ออก?')) return; sessionStorage.removeItem(SSK); hideTB(); adminReply = false; toast('ออกแล้ว 👋'); });

    // ===== EXPORT / IMPORT =====
    exportBtn?.addEventListener('click', () => { const d = { edits: localStorage.getItem(SK), settings: localStorage.getItem(STK), sections: localStorage.getItem(SCK), colors: localStorage.getItem(CLK), css: localStorage.getItem(CSK), layout: localStorage.getItem(LOK), order: localStorage.getItem(SOK), chat: localStorage.getItem('prachin_chat_config') }; const b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `admin-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); toast('ส่งออก 📦'); });
    window.adminImportData = function () { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { try { const d = JSON.parse(ev.target.result); Object.entries(d).forEach(([k, v]) => { if (v) localStorage.setItem(k === 'edits' ? SK : k === 'settings' ? STK : k === 'sections' ? SCK : k === 'colors' ? CLK : k === 'css' ? CSK : k === 'layout' ? LOK : k === 'order' ? SOK : k === 'chat' ? 'prachin_chat_config' : k, v); }); toast('นำเข้า 📥'); setTimeout(() => location.reload(), 800); } catch { alert('ไฟล์ไม่ถูกต้อง'); } }; r.readAsText(f); }); i.click(); };

    // ===== SETTINGS =====
    settingsBtn.addEventListener('click', () => { const s = window.adminSettings; $('settingAiEnabled').checked = s.aiEnabled; $('settingApiKey').value = s.apiKey; $('settingAiPrompt').value = s.aiPrompt; $('settingPhone').value = s.phone; $('settingLineId').value = s.lineId; $('settingEmail').value = s.email; $('settingHours').value = s.hours; $('settingPricePickup').value = s.pricePickup; $('settingPrice4w').value = s.price4w; $('settingPrice6w').value = s.price6w; if ($('settingSheetUrl')) $('settingSheetUrl').value = s.sheetUrl || ''; const ss2 = $('sheetStatus'); if (ss2) { ss2.textContent = s.sheetUrl ? '✅ เชื่อมต่อแล้ว' : '⛔ ยังไม่ได้เชื่อมต่อ'; ss2.className = 'api-status ' + (s.sheetUrl ? 'connected' : 'disconnected'); } $('adminSettingsPanel').classList.add('active'); $('adminSettingsOverlay').classList.add('active'); });
    $('adminSettingsClose')?.addEventListener('click', closeSt); $('adminSettingsOverlay')?.addEventListener('click', closeSt);
    function closeSt() { $('adminSettingsPanel').classList.remove('active'); $('adminSettingsOverlay').classList.remove('active'); }
    $('settingsSaveBtn')?.addEventListener('click', () => { const s = { aiEnabled: $('settingAiEnabled').checked, apiKey: $('settingApiKey').value.trim(), aiPrompt: $('settingAiPrompt').value.trim() || DS.aiPrompt, phone: $('settingPhone').value.trim() || DS.phone, lineId: $('settingLineId').value.trim() || DS.lineId, email: $('settingEmail').value.trim() || DS.email, hours: $('settingHours').value.trim() || DS.hours, pricePickup: parseInt($('settingPricePickup').value) || DS.pricePickup, price4w: parseInt($('settingPrice4w').value) || DS.price4w, price6w: parseInt($('settingPrice6w').value) || DS.price6w, sheetUrl: $('settingSheetUrl')?.value.trim() || '' }; ss(STK, s); window.adminSettings = s; updateChat(); closeSt(); toast('ตั้งค่า ⚙️'); });

    // ===== HELP =====
    helpBtn?.addEventListener('click', () => { $('adminHelpPanel').classList.add('active'); $('adminHelpOverlay').classList.add('active'); $$('.help-section-header').forEach(h => { h.onclick = () => h.parentElement.classList.toggle('active'); }); });
    $('adminHelpClose')?.addEventListener('click', closeH); $('adminHelpOverlay')?.addEventListener('click', closeH);
    function closeH() { $('adminHelpPanel').classList.remove('active'); $('adminHelpOverlay').classList.remove('active'); }

    // ===== CHAT MODE =====
    function updateChat() { const s = window.adminSettings; if (chatMode) { chatMode.textContent = s.aiEnabled && s.apiKey ? '🤖 AI' : 'ระบบอัตโนมัติ'; chatMode.className = 'chat-mode-indicator ' + (s.aiEnabled && s.apiKey ? 'ai-mode' : 'bot-mode'); } }
    replyToggle?.addEventListener('click', () => { adminReply = !adminReply; replyToggle.classList.toggle('active', adminReply); replyToggle.innerHTML = adminReply ? '<span class="material-icons-round">person</span> ตอบเอง' : '<span class="material-icons-round">person</span> ตอบเอง'; const ci = $('chatInput'); if (ci) ci.placeholder = adminReply ? '💬 พิมพ์ตอบเอง...' : 'พิมพ์ข้อความ...'; });
    clearChat?.addEventListener('click', () => { if (confirm('ล้างแชท?')) { localStorage.removeItem('prachin_chat_history'); const cm = $('chatMessages'); if (cm) cm.innerHTML = ''; toast('ล้างแชท 🗑️'); } });
    window.isAdminReplyMode = () => adminReply;
    window.callGeminiAI = async function (msg, hist) { const s = window.adminSettings; if (!s.aiEnabled || !s.apiKey) return null; try { const c = []; (hist || []).slice(-10).forEach(m => c.push({ role: m.type === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })); c.push({ role: 'user', parts: [{ text: msg }] }); const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${s.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_instruction: { parts: [{ text: s.aiPrompt || DS.aiPrompt }] }, contents: c, generationConfig: { temperature: .7, maxOutputTokens: 500 } }) }); if (!r.ok) return null; return (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || null; } catch { return null; } };

    // ===== Add Chat Edit button to toolbar dynamically =====
    function addChatEditToToolbar() {
        const tb = document.querySelector('.admin-toolbar-actions');
        if (tb && !$('adminChatEdit')) {
            const btn = document.createElement('button'); btn.className = 'admin-btn admin-btn-chat'; btn.id = 'adminChatEdit';
            btn.innerHTML = '<span class="material-icons-round">chat</span><span>แชท</span>';
            btn.addEventListener('click', () => { const saved = ls('prachin_chat_config'); if (saved) { $('ceName').value = saved.name || ''; $('ceStatus').value = saved.status || ''; $('ceWelcome').value = saved.welcome || ''; $('ceQuickBtns').value = saved.quickBtns || ''; $('ceBotReplies').value = saved.botReplies || ''; $('ceBgColor').value = saved.bgColor || '#ffffff'; $('ceHeaderColor').value = saved.headerColor || '#1a237e'; } chatEditor.classList.add('visible'); });
            const ref = tb.querySelector('#adminHelp') || tb.querySelector('#adminReset');
            if (ref) tb.insertBefore(btn, ref); else tb.appendChild(btn);
        }
    }

    init();
    addChatEditToToolbar();
})();
