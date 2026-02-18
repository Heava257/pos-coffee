const axios = require("axios");
const { db, logError } = require("../util/helper");

// 👇 Replace with your actual API key
const API_KEY = "7fc741da26c74f7abcf2508b573e6c96";
const API_URL = `https://api.currencyfreaks.com/latest?apikey=${API_KEY}`;

exports.getList = async (req, res) => {
  try {
    // Step 1: Fetch live exchange rate from CurrencyFreaks
    const response = await axios.get(API_URL);
    const khrRate = parseFloat(response.data.rates.KHR);

    // Step 2: Optionally log it to DB (only if you want to store it)
    await db.query(
      "INSERT INTO exchange_rate (currency, rate) VALUES (?, ?)",
      ["KHR", khrRate]
    );

    // Step 3: Query list as usual (latest rates)
    const [list] = await db.query("SELECT * FROM exchange_rate ORDER BY id DESC");

    res.json({
      i_know_you_are_id: req.current_id,
      live_rate: khrRate,
      list, 
    });
  } catch (error) {
    logError("exchange_rate.getList", error, res);
  }
};


exports.getBalanceData = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        currency,
        total_balance,
        available_balance 
      FROM wallet_balance
      ORDER BY currency
    `);

    const result = rows.map((item) => ({
      currency: item.currency,
      flag: item.currency === 'USD' ? '🇺🇸' : item.currency === 'KHR' ? '🇰🇭' : '',
      totalBalance: parseFloat(item.total_balance),
      availableBalance: parseFloat(item.available_balance),
    }));

    res.json({ data: result });
  } catch (error) {
    logError("balance.getBalanceData", error, res);
  }
};


exports.getTransactions = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        date,
        type,
        amount,
        reference,
        status 
      FROM transactions
      ORDER BY date DESC
      LIMIT 20
    `);

    const result = rows.map((tx) => ({
      key: tx.id,
      date: tx.date,
      type: tx.type,
      amount: parseFloat(tx.amount),
      reference: tx.reference,
      status: tx.status
    }));

    res.json({ list: result });
  } catch (error) {
    logError("transactions.getTransactions", error, res);
  }
};