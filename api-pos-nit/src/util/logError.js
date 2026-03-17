const fs = require("fs/promises");
const path = require("path");

exports.logError = async (controller, message_error, res) => {
  const errorObj = message_error instanceof Error ? {
    message: message_error.message,
    stack: message_error.stack,
    sql: message_error.sql,
    sqlMessage: message_error.sqlMessage
  } : message_error;

  console.error(`🚨 Controller Error [${controller}]:`, JSON.stringify(errorObj, null, 2));
  try {
    const logDir = "./logs";
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }

    const logPath = path.join(logDir, controller + ".txt");
    const logMessage = message_error + "\n";
    await fs.appendFile(logPath, logMessage);
  } catch (error) {
    console.error("Error writing to log file:", error);
  }
  // Use json response for API consistency
  if (!res.headersSent) {
    res.status(500).json({
      error: "Internal Server Error",
      message: message_error?.message || "Something went wrong! Please try again later.",
      sqlMessage: message_error?.sqlMessage || null
    });
  }
};  