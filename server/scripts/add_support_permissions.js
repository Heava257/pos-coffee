require("dotenv").config();
const { db } = require("../src/util/helper");

const run = async () => {
  const perms = [
    { name: "Support Center", route_key: "support-center" },
    { name: "Support Tickets", route_key: "support-tickets" },
    { name: "Live Chat", route_key: "live-chat" },
    { name: "Remote Assistance", route_key: "remote-assistance" },
    { name: "Login As Tenant", route_key: "login-as-tenant" },
    { name: "Knowledge Base", route_key: "knowledge-base" },
    { name: "Feedback", route_key: "feedback" },
    { name: "Bug Reports", route_key: "bug-reports" }
  ];

  try {
    for (const p of perms) {
      const [rows] = await db.query("SELECT id FROM permissions WHERE route_key = ?", [p.route_key]);
      if (rows.length === 0) {
        await db.query("INSERT INTO permissions (name, route_key) VALUES (?, ?)", [p.name, p.route_key]);
        console.log(`Added permission: ${p.name}`);
      } else {
        console.log(`Permission already exists: ${p.name}`);
      }
    }
    console.log("Support permissions inserted successfully!");
  } catch (err) {
    console.error("Failed to insert support permissions:", err);
  } finally {
    process.exit();
  }
};

run();
