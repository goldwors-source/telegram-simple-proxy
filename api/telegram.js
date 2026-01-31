export default async function handler(req, res) {
  // 1. Включаем CORS для всех (пока для теста)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 2. Обрабатываем OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 3. Только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }
  
  try {
    // 4. Получаем данные
    const { name, contact, comment, source } = req.body;
    
    // 5. Получаем токены из env
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    console.log('DEBUG: Token exists?', !!BOT_TOKEN);
    console.log('DEBUG: Chat ID exists?', !!CHAT_ID);
    console.log('DEBUG: Data:', { name, contact, comment, source });
    
    // 6. Проверяем токены
    if (!BOT_TOKEN || !CHAT_ID) {
      console.error('DEBUG: Missing env vars');
      return res.status(500).json({ 
        error: 'Missing Telegram credentials',
        hasToken: !!BOT_TOKEN,
        hasChatId: !!CHAT_ID
      });
    }
    
    // 7. Формируем простое сообщение
    const message = `📥 Новая заявка\n👤 Имя: ${name}\n📞 Контакты: ${contact}\n💬 Комментарий: ${comment || 'нет'}`;
    
    console.log('DEBUG: Sending to Telegram...');
    
    // 8. Отправляем в Telegram
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    
    const data = await response.json();
    console.log('DEBUG: Telegram response:', data);
    
    // 9. Возвращаем ответ
    if (data.ok) {
      return res.status(200).json({ 
        success: true, 
        message: 'Заявка отправлена!',
        telegram_id: data.result.message_id
      });
    } else {
      return res.status(500).json({ 
        success: false,
        error: 'Telegram API error',
        details: data.description
      });
    }
    
  } catch (error) {
    console.error('DEBUG: Caught error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
}
