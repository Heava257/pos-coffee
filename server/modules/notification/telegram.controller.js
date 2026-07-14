const { db, logError } = require("../../src/util/helper");
const axios = require("axios");

exports.handleWebhook = async (req, res) => {
  try {
    const { business_id } = req.params;
    const body = req.body;

    // We only care about callback_queries (button clicks)
    if (!body.callback_query) {
       return res.sendStatus(200);
    }

    const callbackQuery = body.callback_query;
    const data = callbackQuery.data; // e.g., 'report_today_sale'
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    // Get business telegram token
    const [biz] = await db.query(
      "SELECT telegram_token FROM businesses WHERE id = ?",
      [business_id]
    );

    if (!biz || biz.length === 0 || !biz[0].telegram_token) {
       return res.sendStatus(200);
    }

    const token = biz[0].telegram_token;
    const apiBase = `https://api.telegram.org/bot${token}`;

    const today = new Date().toISOString().split('T')[0];
    let responseText = "";

    if (data === "report_today_sale") {
      const [rows] = await db.query(
        "SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(id) as count FROM orders WHERE business_id = ? AND DATE(created_at) = ?",
        [business_id, today]
      );
      responseText = `<b>📊 Today's Sales Report</b>\n\nTotal Sales: <b>$${Number(rows[0].total).toLocaleString()}</b>\nTotal Orders: <b>${rows[0].count}</b>\nDate: ${today}`;
    } 
    else if (data === "report_today_expense") {
      const [rows] = await db.query(
        "SELECT COALESCE(SUM(amount), 0) as total FROM expense WHERE business_id = ? AND DATE(expense_date) = ?",
        [business_id, today]
      );
      responseText = `<b>💸 Today's Expense Report</b>\n\nTotal Expense: <b>$${Number(rows[0].total).toLocaleString()}</b>\nDate: ${today}`;
    } 
    else if (data === "report_stock_alert") {
      const [rows] = await db.query(
        "SELECT name, qty FROM products WHERE business_id = ? AND qty <= 5 ORDER BY qty ASC LIMIT 10",
        [business_id]
      );
      if (rows.length === 0) {
        responseText = "✅ <b>Stock Status:</b> All items are well stocked!";
      } else {
        responseText = "⚠️ <b>Low Stock Alert:</b>\n\n" + rows.map(i => `- ${i.name}: <b>${i.qty}</b> left`).join("\n");
      }
    }

    if (responseText) {
      // Send response back to Telegram
      await axios.post(`${apiBase}/sendMessage`, {
        chat_id: chatId,
        text: responseText,
        parse_mode: "HTML",
        reply_markup: {
           inline_keyboard: [
             [{ text: "🔄 Refresh Report", callback_data: data }],
             [{ text: "🏠 Main Menu", callback_data: "main_menu" }]
           ]
        }
      });
    }

    // Acknowledge the callback query to remove the loading state from the button
    await axios.post(`${apiBase}/answerCallbackQuery`, {
      callback_query_id: callbackQuery.id
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("Telegram Webhook Error:", error.message);
    res.sendStatus(200); // Always send 200 to Telegram so it doesn't retry
  }
};
