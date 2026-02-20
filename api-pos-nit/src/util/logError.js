const fs = require("fs/promises");
const path = require("path");

exports.logError = async (controller, message_error, res) => {
  console.error("🚨 Controller Error [" + controller + "]:", message_error);
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
      message: "Something went wrong! Please try again later."
    });
  }
};  