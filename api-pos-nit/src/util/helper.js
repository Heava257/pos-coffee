const config = require("./config");
const connection = require("./connection");
const { logError } = require("./logError");
const fs = require("fs/promises");
const multer = require("multer");
const axios = require('axios');

exports.db = connection;
exports.logError = logError;

exports.toInt = () => {
  return true;
};

exports.isArray = (data) => {
  return true;
};

// exports.notEmpty = (value) => {
//   if (
//     value == "" ||
//     value == null ||
//     value == undefined ||
//     value == "null" ||
//     value == "undefined"
//   ) {
//     return false;
//   }
//   return true;
// };

exports.isEmpty = (value) => {
  if (
    value == "" ||
    value == null ||
    value == undefined ||
    value == "null" ||
    value == "undefined"
  ) {
    return true;
  }
  return false;
};

exports.isEmail = (data) => {
  return true;
};

exports.formartDateServer = (data) => {
  return true;
};

exports.formartDateClient = (data) => {
  return true;
};

exports.uploadFile = multer({
  storage: multer.diskStorage({
    destination: function (req, file, callback) {
      // image path
      callback(null, config.image_path);
    },
    filename: function (req, file, callback) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      callback(null, file.fieldname + "-" + uniqueSuffix);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 3, // max 3MB
  },
  fileFilter: function (req, file, callback) {
    if (
      file.mimetype != "image/png" &&
      file.mimetype !== "image/jpg" &&
      file.mimetype !== "image/jpeg"
    ) {
      // not allow
      callback(null, false);
    } else {
      callback(null, true);
    }
  },
});

exports.removeFile = async (fileName) => {
  var filePath = config.image_path + fileName;
  try {
    await fs.unlink(filePath);
    return "File deleted successfully";
  } catch (err) {
    // console.error("Error deleting file:", err);
    return true;
    // throw err;
  }
};





exports.generatePaymentLink = async ({ orderNo, total, customerEmail, customerName }) => {
  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: orderNo,
        amount: total,
        currency: "USD",
        redirect_url: "http://localhost:3000/payment-success",
        payment_options: "qr",
        customer: {
          email: customerEmail || "test@example.com",
          name: customerName || "Customer"
        },
        customizations: {
          title: "Srok Srae Coffee",
          description: `Order ${orderNo}`
        }
      },
      {
        headers: {
          Authorization: `Bearer ${config.flutter_secret_key}` // 🔐 From your config.js
        }
      }
    );

    return response.data.data.link;
  } catch (err) {
    console.error("Error generating payment link:", err.response?.data || err.message);
    return null;
  }
};


exports.sendTelegramMessagenewcustomerOrder = async (messageText, imageUrls = []) => {
  const TELEGRAM_TOKEN = "7883883844:AAG_DsodDa-Y-zlgMmowlCxNwiQIVJO2kQI";
  const CHAT_ID = "-1002785760693";

  const apiBase = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

  try {
    // 1. Send the text message
    await axios.post(`${apiBase}/sendMessage`, {
      chat_id: CHAT_ID,
      text: messageText,
      parse_mode: "HTML",
    });

    // 2. Send each image (if any)
    for (const imageUrl of imageUrls) {
      await axios.post(`${apiBase}/sendPhoto`, {
        chat_id: CHAT_ID,
        photo: imageUrl,
      });
    }

  } catch (err) {
    console.error("Telegram Error:", err.response?.data || err.message);
  }
};



exports.sendTelegramMessagenewLogin = async (messageText) => {
  const TELEGRAM_TOKEN = "8046971725:AAFt4UJ-2D9pRdwb-BOUj3we96pwL4vo3vU";
  const CHAT_ID = "-1002862378477"; // Your chat ID

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: messageText,
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("Telegram Error:", err.message);
  }
};
