const fs = require('fs/promises');
const path = require('path');
const util = require('util');
const { randomUUID } = require('crypto'); // built-in, no npm package needed

/**
 * C-5 FIX: Structured error logger.
 * - Full error details go ONLY to server-side logs (file + console).
 * - Client receives only a safe error_id (correlation ID) — no SQL, no stack, no file paths.
 */
exports.logError = async (controller, error, res) => {
  const errorId = randomUUID();
  const timestamp = new Date().toISOString();

  // 1. Detailed server-side logging (safe to read in PM2 / Container logs)
  const logEntry = `[${timestamp}] [${errorId}] [${controller}]\n${util.inspect(error, { depth: null })}\n\n`;
  console.error(`🚨 [${errorId}] [${controller}]`, error.message);

  try {
    const logDir = './logs';
    try { await fs.access(logDir); } catch { await fs.mkdir(logDir, { recursive: true }); }
    const logPath = path.join(logDir, 'app.log'); // single rotating log file
    await fs.appendFile(logPath, logEntry);
  } catch (logErr) {
    console.error('[CRITICAL] Failed to write log file:', logErr.message);
  }

  // 2. Friendly user-facing error codes for common DB errors
  let userMessage = 'Something went wrong. Please try again.';
  if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
    userMessage = 'This record already exists. Please use a different value.';
  } else if (error?.code === 'ER_ROW_IS_REFERENCED_2' || error?.errno === 1451) {
    userMessage = 'Cannot delete — this item is referenced by other records.';
  }

  // 3. Safe API response — NEVER expose SQL, stack traces, or internal paths
  if (res && !res.headersSent) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: userMessage,
      error_id: errorId, // client can send this ID to support for tracing
    });
  }
};