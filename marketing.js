// ===== Marketing & Sales Promotion System =====
(function () {
    'use strict';
    const MK = 'prachin_mkt_', ls = k => { try { return JSON.parse(localStorage.getItem(MK + k)); } catch { return null; } }, sv = (k, v) => localStorage.setItem(MK + k, JSON.stringify(v));

    // ===== 1. PROMO NOTIFICATION BAR =====
    const promoBar = document.getElementById('promoBar');
    if (promoBar) {
        if (!ls('promo_closed')) { setTimeout(() => { promoBar.classList.add('show'); document.body.classList.add('promo-bar-active'); }, 1500); }
        const closeBtn = promoBar.querySelector('.promo-close');
        if (closeBtn) closeBtn.addEventListener('click', () => { promoBar.classList.remove('show'); document.body.classList.remove('promo-bar-active'); sv('promo_closed', true); });
        const code = promoBar.querySelector('.promo-code');
        if (code) code.addEventListener('click', () => { navigator.clipboard.writeText(code.textContent); code.textContent = 'คัดลอกแล้ว!'; setTimeout(() => code.textContent = 'MOVE304', 2000); });
    }

    // ===== 2. WELCOME POPUP WITH DISCOUNT =====
    const welcomeOvl = document.getElementById('welcomePopupOverlay');
    if (welcomeOvl && !ls('welcome_shown')) {
        setTimeout(() => { welcomeOvl.classList.add('show'); }, 4000);
        sv('welcome_shown', true);
        welcomeOvl.querySelector('.welcome-close')?.addEventListener('click', () => welcomeOvl.classList.remove('show'));
        welcomeOvl.querySelector('.btn-promo-secondary')?.addEventListener('click', () => welcomeOvl.classList.remove('show'));
        welcomeOvl.querySelector('.btn-promo-primary')?.addEventListener('click', () => { welcomeOvl.classList.remove('show'); document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }); });
        const couponCode = welcomeOvl.querySelector('.coupon-code');
        if (couponCode) couponCode.addEventListener('click', () => { navigator.clipboard.writeText(couponCode.textContent); const h = welcomeOvl.querySelector('.copy-hint'); if (h) h.textContent = '✅ คัดลอกแล้ว!'; });
    }

    // ===== 3. EXIT INTENT POPUP =====
    const exitOvl = document.getElementById('exitPopupOverlay');
    let exitShown = false;
    if (exitOvl && !ls('exit_shown')) {
        document.addEventListener('mouseout', e => { if (!exitShown && e.clientY < 5 && !e.relatedTarget) { exitShown = true; exitOvl.classList.add('show'); sv('exit_shown', true); } });
        exitOvl.querySelector('.btn-exit-secondary')?.addEventListener('click', () => exitOvl.classList.remove('show'));
        exitOvl.querySelector('.btn-exit-primary')?.addEventListener('click', () => { exitOvl.classList.remove('show'); document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }); });
        const sc = exitOvl.querySelector('.special-code');
        if (sc) sc.addEventListener('click', () => { navigator.clipboard.writeText(sc.textContent); sc.textContent = 'คัดลอกแล้ว!'; setTimeout(() => sc.textContent = 'LASTCHANCE', 2000); });
    }

    // ===== 4. COUNTDOWN TIMER =====
    function initCountdown() {
        const els = { d: document.getElementById('countDays'), h: document.getElementById('countHours'), m: document.getElementById('countMins'), s: document.getElementById('countSecs') };
        if (!els.d) return;
        // Set end date to 7 days from now (or use a stored date)
        let end = ls('countdown_end');
        if (!end || new Date(end) < new Date()) { end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); sv('countdown_end', end); }
        function tick() {
            const diff = Math.max(0, new Date(end) - new Date());
            const d = Math.floor(diff / 86400000), h = Math.floor(diff % 86400000 / 3600000), m = Math.floor(diff % 3600000 / 60000), s = Math.floor(diff % 60000 / 1000);
            els.d.textContent = String(d).padStart(2, '0'); els.h.textContent = String(h).padStart(2, '0');
            els.m.textContent = String(m).padStart(2, '0'); els.s.textContent = String(s).padStart(2, '0');
            if (diff > 0) requestAnimationFrame(() => setTimeout(tick, 1000));
        }
        tick();
    }
    initCountdown();

    // ===== 5. SOCIAL SHARE =====
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent('บริการรถขนของย้ายบ้าน ใกล้นิคม 304 ราคาเริ่ม 800 บาท!');
            if (btn.classList.contains('fb')) window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
            if (btn.classList.contains('line')) window.open(`https://social-plugins.line.me/lineit/share?url=${url}`, '_blank', 'width=600,height=400');
            if (btn.classList.contains('tw')) window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
            if (btn.classList.contains('copy-link')) { navigator.clipboard.writeText(window.location.href); btn.textContent = '✅ คัดลอกแล้ว!'; setTimeout(() => btn.textContent = '🔗 คัดลอกลิงก์', 2000); }
        });
    });
    const refInput = document.getElementById('referralLink');
    if (refInput) refInput.value = window.location.href + '?ref=share';
    const refCopy = document.getElementById('referralCopy');
    if (refCopy) refCopy.addEventListener('click', () => { navigator.clipboard.writeText(refInput.value); refCopy.textContent = '✅ คัดลอกแล้ว!'; setTimeout(() => refCopy.textContent = 'คัดลอก', 2000); });

    // ===== 6. LEAD CAPTURE =====
    const leadForm = document.getElementById('leadForm');
    if (leadForm) {
        leadForm.addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('leadName')?.value.trim();
            const phone = document.getElementById('leadPhone')?.value.trim();
            const line = document.getElementById('leadLine')?.value.trim();
            if (!name || !phone) { alert('กรุณากรอกชื่อและเบอร์โทร'); return; }
            const leads = ls('leads') || [];
            leads.push({ name, phone, line, date: new Date().toISOString() });
            sv('leads', leads);
            leadForm.innerHTML = `<div style="text-align:center;padding:20px"><div style="font-size:48px;margin-bottom:10px">🎉</div><h3 style="color:#1a237e;margin-bottom:8px">ขอบคุณครับ!</h3><p style="color:#666;font-size:.85rem">เราจะติดต่อกลับภายใน 30 นาที</p><p style="color:#ff6d00;font-weight:700;font-size:.9rem;margin-top:10px">รหัสส่วนลด: <span style="background:#fff3e0;padding:3px 10px;border-radius:6px;letter-spacing:1px">MOVE304</span></p></div>`;
        });
    }

    // ===== 7. SOCIAL PROOF TICKER =====
    const proofItems = [
        { name: 'คุณสมชาย', action: 'จองรถ 6 ล้อ', time: '2 นาทีที่แล้ว' },
        { name: 'คุณนิดา', action: 'ใช้บริการรถกระบะ', time: '8 นาทีที่แล้ว' },
        { name: 'คุณวิทยา', action: 'จองรถ 4 ล้อ', time: '15 นาทีที่แล้ว' },
        { name: 'คุณสมศรี', action: 'ย้ายบ้านจากนิคม 304', time: '22 นาทีที่แล้ว' },
        { name: 'คุณประเสริฐ', action: 'จองรถกระบะ', time: '35 นาทีที่แล้ว' },
        { name: 'คุณมาลี', action: 'ขนของจากศรีมหาโพธิ', time: '48 นาทีที่แล้ว' },
        { name: 'คุณสุรชัย', action: 'จองรถ 6 ล้อ ย้ายโรงงาน', time: '1 ชม.ที่แล้ว' },
        { name: 'คุณพรทิพย์', action: 'ใช้บริการเรียบร้อย ⭐⭐⭐⭐⭐', time: '2 ชม.ที่แล้ว' },
    ];
    const ticker = document.getElementById('proofTicker');
    if (ticker && !ls('proof_off')) {
        let idx = 0;
        function showProof() {
            const p = proofItems[idx % proofItems.length];
            ticker.innerHTML = `<div class="proof-item"><div class="proof-avatar"><span class="material-icons-round">person</span></div><div class="proof-info"><strong>${p.name} ${p.action}</strong><small>${p.time}</small></div></div>`;
            const item = ticker.querySelector('.proof-item');
            setTimeout(() => item.classList.add('show'), 100);
            setTimeout(() => item.classList.remove('show'), 5000);
            idx++;
        }
        setTimeout(showProof, 8000);
        setInterval(showProof, 15000);
    }

    // ===== 8. PROMO BADGE =====
    const promoBadge = document.getElementById('promoBadge');
    if (promoBadge) { promoBadge.addEventListener('click', () => { document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }); }); }

    // ===== 9. VISITOR COUNTER (simulated) =====
    const visitorEl = document.getElementById('visitorCount');
    if (visitorEl) {
        let count = parseInt(ls('visitor_count')) || Math.floor(Math.random() * 200) + 1847;
        count += Math.floor(Math.random() * 3) + 1;
        sv('visitor_count', count);
        visitorEl.textContent = count.toLocaleString();
        setInterval(() => { count += Math.floor(Math.random() * 2); sv('visitor_count', count); visitorEl.textContent = count.toLocaleString(); }, 30000);
    }

    // ===== 10. FAB BUTTONS =====
    const fabLine = document.getElementById('fabLine');
    const fabPhone = document.getElementById('fabPhone');
    if (fabLine) fabLine.addEventListener('click', () => window.open('https://line.me/R/ti/p/@prachinmove', '_blank'));
    if (fabPhone) fabPhone.addEventListener('click', () => window.location.href = 'tel:0812345678');

    // ===== 11. FLASH SALE TIMER =====
    function initFlashTimer() {
        const fh = document.getElementById('flashHours'), fm = document.getElementById('flashMins'), fs = document.getElementById('flashSecs');
        if (!fh) return;
        let end = ls('flash_end');
        if (!end || new Date(end) < new Date()) { end = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); sv('flash_end', end); }
        function ftick() {
            const diff = Math.max(0, new Date(end) - new Date());
            fh.textContent = String(Math.floor(diff / 3600000)).padStart(2, '0');
            fm.textContent = String(Math.floor(diff % 3600000 / 60000)).padStart(2, '0');
            fs.textContent = String(Math.floor(diff % 60000 / 1000)).padStart(2, '0');
            if (diff > 0) setTimeout(ftick, 1000);
            else { end = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); sv('flash_end', end); ftick(); }
        }
        ftick();
    }
    initFlashTimer();

    // ===== 12. BUNDLE DEAL TRACKING =====
    document.querySelectorAll('.bundle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.bundle-card');
            const name = card?.querySelector('h4')?.textContent || 'unknown';
            const bundles = ls('bundle_clicks') || [];
            bundles.push({ name, date: new Date().toISOString() });
            sv('bundle_clicks', bundles);
        });
    });

    // ===== 13. FLASH CARD TRACKING =====
    document.querySelectorAll('.flash-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.flash-card');
            const name = card?.querySelector('.flash-name')?.textContent || 'unknown';
            const clicks = ls('flash_clicks') || [];
            clicks.push({ name, date: new Date().toISOString() });
            sv('flash_clicks', clicks);
        });
    });

    // ===== 14. SEASONAL PROMO CODE =====
    document.querySelectorAll('.seasonal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const clicks = ls('seasonal_clicks') || 0;
            sv('seasonal_clicks', clicks + 1);
        });
    });

    // ===== 15. SCROLL SPY - Show FABs after scrolling =====
    const fabContainer = document.querySelector('.marketing-fab');
    if (fabContainer) {
        fabContainer.style.opacity = '0';
        fabContainer.style.transition = 'opacity .5s';
        window.addEventListener('scroll', () => {
            fabContainer.style.opacity = window.scrollY > 300 ? '1' : '0';
        }, { passive: true });
    }

    // ===== 16. PROMO BADGE HIDE ON SCROLL TOP =====
    const badge = document.getElementById('promoBadge');
    if (badge) {
        window.addEventListener('scroll', () => {
            badge.style.opacity = window.scrollY > 500 ? '1' : '0';
            badge.style.transition = 'opacity .3s';
        }, { passive: true });
    }

})();

