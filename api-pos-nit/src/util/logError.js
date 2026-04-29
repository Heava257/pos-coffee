const fs = require("fs/promises");
const path = require("path");
const util = require("util");

exports.logError = async (controller, error, res) => {
  // 1. Detailed console logging (visible in Railway/Production logs)
  console.error(`🚨 [${controller}] Error Detail:`, util.inspect(error, { depth: null, colors: true }));

  try {
    const logDir = "./logs";
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    } 

    const logPath = path.join(logDir, controller + ".txt");
    const logMessage = `[${new Date().toISOString()}] ${util.inspect(error, { depth: null })}\n`;
    await fs.appendFile(logPath, logMessage);
  } catch (logErr) {
    console.error("Critical: Failed to write to log file:", logErr);
  }

  // 2. Return friendly response to client
  if (res && !res.headersSent) {
    let friendlyMessage = error?.message || "Something went wrong! Please try again later.";
    
    // 🛡️ TRANSLATE TECHNICAL ERRORS
    if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
      const match = error.sqlMessage?.match(/'([^']*)'/);
      const value = match ? match[1] : "";
      friendlyMessage = `Duplicate Entry: '${value}' already exists in our system. Please use a different value.`;
    } else if (error?.code === 'ER_ROW_IS_REFERENCED_2' || error?.errno === 1451) {
      friendlyMessage = "Cannot delete this item because it is being used by other records.";
    }

    res.status(500).json({
      error: "Internal Error",
      message: friendlyMessage,
      technical: error?.message || null,
      sqlMessage: error?.sqlMessage || null,
      controller: controller
    });
  }
};
  