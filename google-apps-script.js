// ===== Google Apps Script สำหรับรับข้อมูลจากเว็บ =====
// วิธีใช้:
// 1. ไปที่ https://script.google.com
// 2. สร้างโปรเจกต์ใหม่
// 3. ลบโค้ดเดิม แล้ววางโค้ดนี้ทั้งหมด
// 4. กดเมนู Deploy → New deployment
// 5. เลือก Type: Web app
// 6. Execute as: Me
// 7. Who has access: Anyone
// 8. กด Deploy → คัดลอก URL ที่ได้
// 9. นำ URL ไปใส่ในหน้าตั้งค่าแอดมินของเว็บ (ช่อง Google Sheets URL)

// ===== ตั้งค่า =====
const SHEET_NAME_CHAT = 'แชท';
const SHEET_NAME_LEADS = 'ลูกค้า';
const SHEET_NAME_BOOKINGS = 'การจอง';
const SHEET_NAME_CLICKS = 'คลิก';
const SHEET_NAME_VISITORS = 'ผู้เข้าชม';

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const ss = SpreadsheetApp.getActiveSpreadsheet();

        switch (data.type) {
            case 'chat':
                appendToSheet(ss, SHEET_NAME_CHAT, [
                    data.timestamp,
                    data.sessionId,
                    data.sender,
                    data.message,
                    data.page
                ], ['เวลา', 'Session ID', 'ผู้ส่ง', 'ข้อความ', 'หน้า']);
                break;

            case 'lead':
                appendToSheet(ss, SHEET_NAME_LEADS, [
                    data.timestamp,
                    data.name,
                    data.phone,
                    data.line,
                    data.source,
                    data.page
                ], ['เวลา', 'ชื่อ', 'เบอร์โทร', 'LINE', 'แหล่งที่มา', 'หน้า']);

                // ส่ง Email แจ้งเตือน (ถ้าต้องการ)
                // sendNotificationEmail(data);
                break;

            case 'booking':
                const bookingValues = [data.timestamp];
                const bookingHeaders = ['เวลา'];
                Object.keys(data).forEach(key => {
                    if (!['type', 'timestamp', 'page', 'userAgent'].includes(key)) {
                        bookingHeaders.push(key);
                        bookingValues.push(data[key]);
                    }
                });
                bookingValues.push(data.page);
                bookingHeaders.push('หน้า');
                appendToSheet(ss, SHEET_NAME_BOOKINGS, bookingValues, bookingHeaders);
                break;

            case 'click':
                appendToSheet(ss, SHEET_NAME_CLICKS, [
                    data.timestamp,
                    data.action,
                    data.item,
                    data.page
                ], ['เวลา', 'ประเภท', 'รายการ', 'หน้า']);
                break;

            case 'visitor':
                appendToSheet(ss, SHEET_NAME_VISITORS, [
                    data.timestamp,
                    data.referrer,
                    data.screen,
                    data.userAgent,
                    data.page
                ], ['เวลา', 'มาจาก', 'ขนาดจอ', 'User Agent', 'หน้า']);
                break;
        }

        return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function doGet(e) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'API is running' }))
        .setMimeType(ContentService.MimeType.JSON);
}

function appendToSheet(ss, sheetName, values, headers) {
    let sheet = ss.getSheetByName(sheetName);

    // สร้าง sheet ใหม่ถ้ายังไม่มี
    if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(headers);
        // จัดรูปแบบหัวตาราง
        const headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#1a237e');
        headerRange.setFontColor('#ffffff');
        sheet.setFrozenRows(1);
    }

    sheet.appendRow(values);
}

// ฟังก์ชันส่ง Email แจ้งเตือน (ถ้าต้องการ)
function sendNotificationEmail(data) {
    const email = 'your-email@gmail.com'; // เปลี่ยนเป็นอีเมลของคุณ
    const subject = '🚚 ลูกค้าใหม่จากเว็บ! - ' + data.name;
    const body = `
มีลูกค้าใหม่กรอกข้อมูลจากเว็บ!

ชื่อ: ${data.name}
เบอร์โทร: ${data.phone}
LINE: ${data.line || '-'}
เวลา: ${data.timestamp}
หน้า: ${data.page}

---
ระบบแจ้งเตือนอัตโนมัติ - ปราจีนบุรีขนส่ง
  `;
    MailApp.sendEmail(email, subject, body);
}
