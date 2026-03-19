// ===== Google Sheets Integration =====
// ส่งข้อมูลแชท, ฟอร์มจอง, Lead ไปเก็บใน Google Sheets อัตโนมัติ
(function () {
    'use strict';

    // ดึง URL ของ Google Apps Script Web App จาก Settings
    function getSheetUrl() {
        try { const s = JSON.parse(localStorage.getItem('prachin_admin_settings')); return s?.sheetUrl || ''; } catch { return ''; }
    }

    // ===== ส่งข้อมูลไป Google Sheets =====
    async function sendToSheet(data) {
        const url = getSheetUrl();
        if (!url) return false;
        try {
            await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
                    page: window.location.href,
                    userAgent: navigator.userAgent.substring(0, 100)
                })
            });
            return true;
        } catch (err) {
            console.error('Sheet Error:', err);
            return false;
        }
    }

    // ===== 1. เก็บข้อมูลแชท =====
    // สังเกตปุ่มส่งแชทและดักข้อมูล
    function hookChatSend() {
        const chatForm = document.getElementById('chatForm');
        const chatInput = document.getElementById('chatInput');
        if (!chatForm || !chatInput) return;

        chatForm.addEventListener('submit', () => {
            const msg = chatInput.value.trim();
            if (!msg) return;
            // ส่งข้อความลูกค้าไป Sheet
            sendToSheet({
                type: 'chat',
                message: msg,
                sender: 'customer',
                sessionId: getSessionId()
            });
        });

        // สังเกตข้อความใหม่ใน chat (รวมคำตอบ AI/Bot)
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(m => {
                    m.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList?.contains('message')) {
                            const isBot = node.classList.contains('bot-message') || node.classList.contains('ai-message');
                            if (isBot) {
                                const text = node.querySelector('.message-text')?.textContent || node.textContent;
                                sendToSheet({ type: 'chat', message: text.substring(0, 500), sender: 'bot/ai', sessionId: getSessionId() });
                            }
                        }
                    });
                });
            });
            observer.observe(chatMessages, { childList: true, subtree: true });
        }
    }

    // ===== 2. เก็บข้อมูล Lead Form =====
    function hookLeadForm() {
        const leadForm = document.getElementById('leadForm');
        if (!leadForm) return;

        const origSubmit = leadForm.onsubmit;
        leadForm.addEventListener('submit', e => {
            const name = document.getElementById('leadName')?.value.trim() || '';
            const phone = document.getElementById('leadPhone')?.value.trim() || '';
            const line = document.getElementById('leadLine')?.value.trim() || '';
            if (name || phone) {
                sendToSheet({
                    type: 'lead',
                    name: name,
                    phone: phone,
                    line: line,
                    source: 'lead_form'
                });
            }
        });
    }

    // ===== 3. เก็บข้อมูลฟอร์มจอง =====
    function hookBookingForm() {
        const bookingForm = document.querySelector('.booking-form');
        if (!bookingForm) return;

        bookingForm.addEventListener('submit', e => {
            const data = { type: 'booking' };
            bookingForm.querySelectorAll('input,select,textarea').forEach(el => {
                const label = el.closest('.form-group')?.querySelector('label')?.textContent || el.name || el.id || 'field';
                data[label.trim()] = el.value;
            });
            sendToSheet(data);
        });
    }

    // ===== 4. เก็บข้อมูลการคลิก Flash Sale / Bundle =====
    function hookMarketingClicks() {
        document.querySelectorAll('.flash-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.flash-card');
                const name = card?.querySelector('.flash-name')?.textContent || 'unknown';
                sendToSheet({ type: 'click', action: 'flash_sale', item: name });
            });
        });

        document.querySelectorAll('.bundle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.bundle-card');
                const name = card?.querySelector('h4')?.textContent || 'unknown';
                sendToSheet({ type: 'click', action: 'bundle_deal', item: name });
            });
        });
    }

    // ===== 5. เก็บข้อมูลผู้เข้าชม =====
    function trackVisitor() {
        const visited = sessionStorage.getItem('prachin_visited');
        if (!visited) {
            sessionStorage.setItem('prachin_visited', 'true');
            sendToSheet({
                type: 'visitor',
                referrer: document.referrer || 'direct',
                screen: window.innerWidth + 'x' + window.innerHeight
            });
        }
    }

    // ===== Session ID (ไม่ซ้ำต่อ session) =====
    function getSessionId() {
        let sid = sessionStorage.getItem('prachin_sid');
        if (!sid) { sid = 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8); sessionStorage.setItem('prachin_sid', sid); }
        return sid;
    }

    // ===== Admin: ดูข้อมูลที่เก็บ (Local backup) =====
    window.adminViewSheetData = function () {
        const url = getSheetUrl();
        if (url) {
            // Open the Google Sheet directly
            const sheetId = url.match(/\/d\/([^/]+)/)?.[1] || '';
            if (sheetId) window.open('https://docs.google.com/spreadsheets/d/' + sheetId, '_blank');
            else alert('กรุณาตั้งค่า Google Sheets URL ในหน้าตั้งค่า');
        } else {
            alert('ยังไม่ได้ตั้งค่า Google Sheets URL\n\nไปที่ ตั้งค่า → Google Sheets URL');
        }
    };

    // ===== Init =====
    function initSheets() {
        hookChatSend();
        hookLeadForm();
        hookBookingForm();
        hookMarketingClicks();
        trackVisitor();
    }

    // รอ DOM โหลดเสร็จ
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSheets);
    else initSheets();

})();
