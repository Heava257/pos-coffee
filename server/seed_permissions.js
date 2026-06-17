const { db } = require("./src/util/helper");

const seed = async () => {
  const perms = [
    { name: "Digital Menu Board", route_key: "menu-board", min_plan_id: 1 },
    { name: "Loyalty Portal", route_key: "membership/search", min_plan_id: 1 },
    { name: "Morning Briefing", route_key: "dashboard/morning-briefing", min_plan_id: 2 }
  ];

  try {
    for (const p of perms) {
      // Check if exists
      const [rows] = await db.query("SELECT id FROM permissions WHERE route_key = ?", [p.route_key]);
      if (rows.length === 0) {
        await db.query("INSERT INTO permissions (name, route_key, min_plan_id) VALUES (?, ?, ?)", [p.name, p.route_key, p.min_plan_id]);
        console.log(`Added permission: ${p.name}`);
      } else {
        console.log(`Permission already exists: ${p.name}`);
      }
    }
    console.log("Seeding complete!");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    process.exit();
  }
};

seed();
