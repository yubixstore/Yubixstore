// server.js
const express = require('express');
const fetch = require('node-fetch'); // npm i node-fetch@2
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ====== ضع المتغيرات في بيئة الاستضافة ======
const BOT_TOKEN = process.env.BOT_TOKEN;  // مثال: 8279...:AA...
const CHAT_ID   = process.env.CHAT_ID;    // مثال: 123456789

if (!BOT_TOKEN || !CHAT_ID) {
  console.warn('⚠️  BOT_TOKEN أو CHAT_ID غير موجودين في المتغيرات البيئية.');
}

// خدمة الملفات الثابتة (index.html)
app.use(express.static(path.join(__dirname, '.')));

// endpoint لاستقبال الطلب من الواجهة
app.post('/api/send-order', async (req, res) => {
  try {
    const { shop, customer, items } = req.body || {};
    const subtotal = items.reduce((s,i)=> s + i.price*i.qty, 0);
    const delivery = subtotal>0 ? 200 : 0;
    const total = subtotal + delivery;

    const lines = [
      `🛒 طلب جديد — ${shop}`,
      '———————————————',
      ...items.map(i => `• ${i.name}${i.color?` (${i.color})`:''} × ${i.qty} = ${i.price*i.qty} دج`),
      '———————————————',
      `المجموع: ${subtotal} دج`,
      `التوصيل: ${delivery} دج`,
      `الإجمالي: ${total} دج`,
      '',
      `👤 الزبون: ${customer.name}`,
      `📞 الهاتف: ${customer.phone}`,
      `🏠 العنوان: ${customer.address}`,
      '',
      `⏰ ${new Date().toLocaleString('ar-DZ')}`
    ];

    const text = lines.join('\n');

    const tg = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ chat_id: CHAT_ID, text })
    });

    if(!tg.ok){
      const t = await tg.text();
      console.error('Telegram error:', t);
      return res.status(500).json({ ok:false, error:'TELEGRAM_FAILED', details:t });
    }

    res.json({ ok:true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'SERVER_ERROR' });
  }
});

// تشغيل محلي
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('✅ Server running on http://localhost:'+PORT));
