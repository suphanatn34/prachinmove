// ===== DOM Elements =====
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const bookingForm = document.getElementById('bookingForm');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const chatWidget = document.getElementById('chatWidget');
const chatToggle = document.getElementById('chatToggle');
const chatCloseBtn = document.getElementById('chatCloseBtn');
const chatWindow = document.getElementById('chatWindow');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatBadge = document.getElementById('chatBadge');
const chatQuickActions = document.getElementById('chatQuickActions');

// ===== Navbar Scroll Effect =====
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== Mobile Menu =====
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// ===== Scroll Reveal Animation =====
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

revealElements.forEach(el => revealObserver.observe(el));

// ===== Counter Animation =====
const statNumbers = document.querySelectorAll('.stat-number');
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = parseInt(entry.target.getAttribute('data-target'));
            animateCounter(entry.target, target);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

statNumbers.forEach(el => counterObserver.observe(el));

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 60;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 25);
}

// ===== Service Card Click → Auto-select vehicle =====
document.querySelectorAll('.service-card .btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const card = btn.closest('.service-card');
        const vehicle = card.getAttribute('data-vehicle');
        if (vehicle) {
            setTimeout(() => {
                document.getElementById('vehicle').value = vehicle;
            }, 500);
        }
    });
});

// ===== Set min date to today =====
const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// ===== Booking Form =====
bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic validation
    const fullname = document.getElementById('fullname').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    const date = document.getElementById('date').value;
    const vehicle = document.getElementById('vehicle').value;

    if (!fullname || !phone || !origin || !destination || !date || !vehicle) {
        alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
        return;
    }

    // Phone validation
    const phoneRegex = /^[0-9]{9,10}$/;
    if (!phoneRegex.test(phone.replace(/[-\s]/g, ''))) {
        alert('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง');
        return;
    }

    // Show success modal
    modalOverlay.classList.add('active');
    bookingForm.reset();
});

// ===== Modal Close =====
modalClose.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
    }
});

// ===== LIVE CHAT SYSTEM =====
let chatOpen = false;
let unreadCount = 0;
let chatHistory = [];
let firstOpen = true;

// Load chat history from localStorage
function loadChatHistory() {
    const saved = localStorage.getItem('prachin_chat_history');
    if (saved) {
        try {
            chatHistory = JSON.parse(saved);
            firstOpen = false;
        } catch (e) {
            chatHistory = [];
        }
    }
}

// Save chat history
function saveChatHistory() {
    localStorage.setItem('prachin_chat_history', JSON.stringify(chatHistory));
}

// Initialize chat
loadChatHistory();

// Toggle chat
chatToggle.addEventListener('click', () => {
    chatOpen = !chatOpen;
    chatWidget.classList.toggle('open', chatOpen);

    if (chatOpen) {
        // Reset unread
        unreadCount = 0;
        chatBadge.style.display = 'none';

        if (firstOpen || chatHistory.length === 0) {
            // Show welcome message
            chatMessages.innerHTML = '';
            addBotMessage('สวัสดีครับ! 👋 ยินดีต้อนรับสู่ปราจีนบุรีขนส่ง\n\nมีอะไรให้ช่วยไหมครับ? สามารถเลือกหัวข้อด้านล่าง หรือพิมพ์ข้อความได้เลยครับ', false);
            firstOpen = false;
        } else {
            renderChatHistory();
        }

        chatInput.focus();
    }
});

// Close chat
chatCloseBtn.addEventListener('click', () => {
    chatOpen = false;
    chatWidget.classList.remove('open');
});

// Render chat history
function renderChatHistory() {
    chatMessages.innerHTML = '';
    chatHistory.forEach(msg => {
        const bubble = document.createElement('div');
        let className = 'chat-bubble ';
        if (msg.type === 'user') className += 'user';
        else if (msg.type === 'admin') className += 'bot admin-reply';
        else className += 'bot';
        bubble.className = className;
        bubble.textContent = msg.text;
        chatMessages.appendChild(bubble);
    });
    scrollChatToBottom();
}

// Add bot message
function addBotMessage(text, save = true) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bot';
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    scrollChatToBottom();

    if (save) {
        chatHistory.push({ type: 'bot', text });
        saveChatHistory();
    }

    // If chat is not open, show badge
    if (!chatOpen) {
        unreadCount++;
        chatBadge.textContent = unreadCount;
        chatBadge.style.display = 'flex';
    }
}

// Add user message
function addUserMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble user';
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    scrollChatToBottom();

    chatHistory.push({ type: 'user', text });
    saveChatHistory();
}

// Show typing indicator
function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'chat-bubble bot typing-indicator';
    typing.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    typing.id = 'typingIndicator';
    chatMessages.appendChild(typing);
    scrollChatToBottom();
}

// Remove typing indicator
function removeTyping() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

// Scroll chat to bottom
function scrollChatToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    // Check if admin is in manual reply mode
    if (window.isAdminReplyMode && window.isAdminReplyMode()) {
        // Admin typing as admin
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble bot admin-reply';
        bubble.textContent = text;
        chatMessages.appendChild(bubble);
        scrollChatToBottom();
        chatHistory.push({ type: 'admin', text });
        saveChatHistory();
        chatInput.value = '';
        return;
    }

    addUserMessage(text);
    chatInput.value = '';

    // Show typing and reply
    showTyping();

    // Try AI first, then fallback to bot
    handleAutoReply(text);
});

// Quick action buttons
chatQuickActions.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const msg = btn.getAttribute('data-msg');
        addUserMessage(msg);
        showTyping();
        handleAutoReply(msg);
    });
});

// Handle auto reply: AI → Bot fallback
async function handleAutoReply(text) {
    // Check if AI is enabled
    const settings = window.adminSettings;
    let aiReply = null;

    if (settings && settings.aiEnabled && settings.apiKey && window.callGeminiAI) {
        try {
            aiReply = await window.callGeminiAI(text, chatHistory);
        } catch (err) {
            console.error('AI reply error:', err);
        }
    }

    removeTyping();

    if (aiReply) {
        // AI reply
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble bot ai';
        bubble.textContent = aiReply;
        chatMessages.appendChild(bubble);
        scrollChatToBottom();
        chatHistory.push({ type: 'bot', text: aiReply });
        saveChatHistory();

        if (!chatOpen) {
            unreadCount++;
            chatBadge.textContent = unreadCount;
            chatBadge.style.display = 'flex';
        }
    } else {
        // Fallback: built-in bot
        const reply = generateReply(text);
        addBotMessage(reply);
    }
}

// ===== Auto-Reply Bot =====
function generateReply(message) {
    const msg = message.toLowerCase();

    // ราคา / ค่าบริการ
    if (msg.includes('ราคา') || msg.includes('ค่า') || msg.includes('เท่าไหร่') || msg.includes('เท่าไร') || msg.includes('บาท') || msg.includes('ค่าใช้จ่าย')) {
        return '💰 ราคาเริ่มต้นของเราครับ:\n\n🛻 รถกระบะ: เริ่มต้น 800 บาท\n🚛 รถ 4 ล้อ: เริ่มต้น 2,000 บาท\n🚚 รถ 6 ล้อ: เริ่มต้น 4,500 บาท\n\nราคาอาจเปลี่ยนแปลงตามระยะทางและปริมาณของครับ สามารถกรอกแบบฟอร์มจองเพื่อให้เราเสนอราคาที่แน่นอนได้เลยครับ';
    }

    // พื้นที่ให้บริการ
    if (msg.includes('พื้นที่') || msg.includes('อำเภอ') || msg.includes('ไหนบ้าง') || msg.includes('ครอบคลุม') || msg.includes('เขต') || msg.includes('ปราจีน')) {
        return '📍 เราให้บริการครอบคลุมทุกอำเภอในจังหวัดปราจีนบุรีครับ:\n\n• อ.เมืองปราจีนบุรี\n• อ.กบินทร์บุรี\n• อ.ศรีมหาโพธิ\n• อ.ประจันตคาม\n• อ.บ้านสร้าง\n• อ.นาดี\n• อ.ศรีมโหสถ\n\nไม่ว่าจะอยู่อำเภอไหน เราไปถึงครับ!';
    }

    // ขั้นตอนการจอง
    if (msg.includes('ขั้นตอน') || msg.includes('ยังไง') || msg.includes('อย่างไร') || msg.includes('วิธี') || msg.includes('จอง')) {
        return '📋 ขั้นตอนการจองง่ายมากครับ:\n\n1️⃣ กรอกข้อมูลในแบบฟอร์มจอง (ต้นทาง, ปลายทาง, วันที่)\n2️⃣ ระบบจะคำนวณราคาเบื้องต้น\n3️⃣ ทีมงานติดต่อกลับภายใน 15 นาที\n4️⃣ ยืนยันนัดหมาย แล้วเราไปรับของเลย!\n\nหรือจะคุยกับเจ้าหน้าที่โทร 081-234-5678 ได้เลยครับ';
    }

    // ติดต่อเจ้าหน้าที่
    if (msg.includes('เจ้าหน้าที่') || msg.includes('พนักงาน') || msg.includes('คน') || msg.includes('โทร') || msg.includes('ติดต่อ') || msg.includes('สาย')) {
        return '👤 สามารถติดต่อเจ้าหน้าที่ได้ดังนี้ครับ:\n\n📞 โทร: 081-234-5678\n📧 อีเมล: info@prachinmove.com\n⏰ เวลาทำการ: 06:00 - 21:00 ทุกวัน\n\nหรือกรอกแบบฟอร์มจอง ทีมงานจะโทรกลับภายใน 15 นาทีครับ!';
    }

    // เวลา
    if (msg.includes('เวลา') || msg.includes('กี่โมง') || msg.includes('เปิด') || msg.includes('ปิด')) {
        return '⏰ เราเปิดให้บริการทุกวันครับ\nตั้งแต่ 06:00 - 21:00 น.\n\nสามารถจองล่วงหน้าได้ทุกเมื่อเลยครับ!';
    }

    // ทักทาย
    if (msg.includes('สวัสดี') || msg.includes('หวัดดี') || msg.includes('ดี') || msg === 'hi' || msg === 'hello') {
        return 'สวัสดีครับ! 😊 ยินดีให้บริการครับ\n\nมีอะไรให้ช่วยไหมครับ? สอบถามเรื่องราคา พื้นที่ให้บริการ หรืออยากจองรถเลย บอกได้เลยครับ!';
    }

    // ขอบคุณ
    if (msg.includes('ขอบคุณ') || msg.includes('ขอบใจ') || msg.includes('thanks') || msg.includes('thank')) {
        return 'ยินดีครับ! 🙏 หากมีอะไรสงสัยเพิ่มเติม สอบถามได้ตลอดเลยนะครับ\n\nพร้อมให้บริการเสมอครับ! 😊';
    }

    // ประกัน / ความปลอดภัย
    if (msg.includes('ประกัน') || msg.includes('เสียหาย') || msg.includes('แตก') || msg.includes('หัก') || msg.includes('พัง')) {
        return '🛡️ เรามีประกันความเสียหายให้ครับ!\n\n• ห่อของอย่างดีด้วยผ้าห่มและฟองกันกระแทก\n• ทีมงานมืออาชีพ ยกอย่างระมัดระวัง\n• หากเกิดความเสียหายจากการขนส่ง รับผิดชอบเต็มที่\n\nมั่นใจได้เลยครับ ของของคุณปลอดภัย! 💪';
    }

    // Default response
    return 'ขอบคุณสำหรับข้อความครับ! 😊\n\nหากต้องการข้อมูลเพิ่มเติม สามารถ:\n• สอบถามราคาค่าบริการ\n• ถามเรื่องพื้นที่ให้บริการ\n• ถามขั้นตอนการจอง\n• หรือโทร 081-234-5678\n\nทีมงานพร้อมช่วยเหลือครับ!';
}

// ===== Auto-open chat after 5 seconds (first visit only) =====
if (!localStorage.getItem('prachin_chat_welcomed')) {
    setTimeout(() => {
        if (!chatOpen) {
            unreadCount = 1;
            chatBadge.textContent = '1';
            chatBadge.style.display = 'flex';
        }
    }, 5000);
    localStorage.setItem('prachin_chat_welcomed', 'true');
}

// ===== FEATURE 1: PRICE CALCULATOR =====
const calcBtn = document.getElementById('calcBtn');
const calcResult = document.getElementById('calcResult');
const calcPrice = document.getElementById('calcPrice');

// Distance matrix (simplified km between districts)
const distanceMatrix = {
    nikhom304: { nikhom304: 0, muang: 32, kabin: 28, srimaha: 5, prachanta: 18, bansang: 58, nadee: 48, srimahosot: 28 },
    muang: { nikhom304: 32, muang: 0, kabin: 65, srimaha: 35, prachanta: 25, bansang: 30, nadee: 80, srimahosot: 20 },
    kabin: { nikhom304: 28, muang: 65, kabin: 0, srimaha: 30, prachanta: 45, bansang: 90, nadee: 25, srimahosot: 50 },
    srimaha: { nikhom304: 5, muang: 35, kabin: 30, srimaha: 0, prachanta: 20, bansang: 60, nadee: 50, srimahosot: 30 },
    prachanta: { nikhom304: 18, muang: 25, kabin: 45, srimaha: 20, prachanta: 0, bansang: 50, nadee: 60, srimahosot: 25 },
    bansang: { nikhom304: 58, muang: 30, kabin: 90, srimaha: 60, prachanta: 50, bansang: 0, nadee: 100, srimahosot: 35 },
    nadee: { nikhom304: 48, muang: 80, kabin: 25, srimaha: 50, prachanta: 60, bansang: 100, nadee: 0, srimahosot: 70 },
    srimahosot: { nikhom304: 28, muang: 20, kabin: 50, srimaha: 30, prachanta: 25, bansang: 35, nadee: 70, srimahosot: 0 }
};

const basePrice = { pickup: 800, '4wheel': 2000, '6wheel': 4500 };
const perKmRate = { pickup: 15, '4wheel': 25, '6wheel': 35 };

if (calcBtn) {
    calcBtn.addEventListener('click', () => {
        const from = document.getElementById('calcFrom').value;
        const to = document.getElementById('calcTo').value;
        const vehicle = document.getElementById('calcVehicle').value;

        if (!from || !to || !vehicle) {
            alert('กรุณาเลือกให้ครบทุกช่องครับ');
            return;
        }

        const km = distanceMatrix[from][to];
        const base = basePrice[vehicle];
        const rate = perKmRate[vehicle];
        let price = base + (km * rate);

        // Same district = base price
        if (from === to) price = base;

        calcResult.style.display = 'block';
        // Animate price counting
        let currentPrice = 0;
        const targetPrice = Math.round(price / 100) * 100; // Round to nearest 100
        const increment = targetPrice / 30;
        const priceTimer = setInterval(() => {
            currentPrice += increment;
            if (currentPrice >= targetPrice) {
                currentPrice = targetPrice;
                clearInterval(priceTimer);
            }
            calcPrice.textContent = Math.floor(currentPrice).toLocaleString();
        }, 30);

        // Smooth scroll to result
        setTimeout(() => {
            calcResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    });
}

// ===== FEATURE 2: PHOTO UPLOAD =====
const photoUploadArea = document.getElementById('photoUploadArea');
const photoInput = document.getElementById('photoInput');
const photoPlaceholder = document.getElementById('photoPlaceholder');
const photoPreviewGrid = document.getElementById('photoPreviewGrid');
let uploadedPhotos = [];

if (photoUploadArea) {
    // Click to open file picker
    photoUploadArea.addEventListener('click', (e) => {
        if (e.target.closest('.photo-remove-btn')) return;
        photoInput.click();
    });

    // Drag and drop
    photoUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        photoUploadArea.classList.add('drag-over');
    });

    photoUploadArea.addEventListener('dragleave', () => {
        photoUploadArea.classList.remove('drag-over');
    });

    photoUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        photoUploadArea.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    // File input change
    photoInput.addEventListener('change', () => {
        handleFiles(photoInput.files);
        photoInput.value = ''; // Reset
    });
}

function handleFiles(files) {
    const remaining = 5 - uploadedPhotos.length;
    if (remaining <= 0) {
        alert('เลือกได้สูงสุด 5 รูปครับ');
        return;
    }

    const filesToProcess = Array.from(files).slice(0, remaining);
    filesToProcess.forEach(file => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedPhotos.push(e.target.result);
            renderPhotoPreview();
        };
        reader.readAsDataURL(file);
    });
}

function renderPhotoPreview() {
    photoPreviewGrid.innerHTML = '';

    if (uploadedPhotos.length > 0) {
        photoPlaceholder.style.display = 'none';
    } else {
        photoPlaceholder.style.display = '';
        return;
    }

    uploadedPhotos.forEach((src, index) => {
        const item = document.createElement('div');
        item.className = 'photo-preview-item';
        item.innerHTML = `
            <img src="${src}" alt="รูปของ ${index + 1}">
            <button type="button" class="photo-remove-btn" data-index="${index}">✕</button>
        `;
        photoPreviewGrid.appendChild(item);
    });

    // Add "add more" button if under limit
    if (uploadedPhotos.length < 5) {
        const addMore = document.createElement('div');
        addMore.className = 'photo-preview-item';
        addMore.style.cssText = 'display:flex;align-items:center;justify-content:center;background:#f0f0f8;cursor:pointer;border:2px dashed #d0d0e0;';
        addMore.innerHTML = '<span class="material-icons-round" style="color:var(--accent);font-size:28px;">add</span>';
        addMore.addEventListener('click', (e) => {
            e.stopPropagation();
            photoInput.click();
        });
        photoPreviewGrid.appendChild(addMore);
    }

    // Remove buttons
    photoPreviewGrid.querySelectorAll('.photo-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.getAttribute('data-index'));
            uploadedPhotos.splice(idx, 1);
            renderPhotoPreview();
        });
    });
}

// ===== FEATURE 3: FAQ ACCORDION =====
document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isActive = item.classList.contains('active');

        // Close all others
        document.querySelectorAll('.faq-item.active').forEach(activeItem => {
            activeItem.classList.remove('active');
        });

        // Toggle current
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// ===== FEATURE 5: SCROLL-TO-TOP BUTTON =====
const scrollTopBtn = document.getElementById('scrollTopBtn');

window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
        scrollTopBtn.classList.add('visible');
    } else {
        scrollTopBtn.classList.remove('visible');
    }
});

if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
