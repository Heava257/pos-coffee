const n = require("../../src/controller/notification.controller");
const t = require("../../src/controller/telegram.controller");

module.exports = {
    ...n,
    ...t,
    getList: n.getNotifications,
    create: n.createNotification,
    readAll: n.markReadAll,
    markRead: n.markRead,
    remove: n.deleteNotification,
    handleWebhook: t.handleWebhook
};