const { db } = require("./src/util/helper");

const update = async () => {
  try {
    // 1. Add permission
    const [exists] = await db.query("SELECT id FROM permissions WHERE route_key = 'marketing/dashboard'");
    let pid;
    if (exists.length === 0) {
      const [res] = await db.query("INSERT INTO permissions (name, route_key, min_plan_id) VALUES ('Smart Marketing', 'marketing/dashboard', 1)");
      pid = res.insertId;
      console.log("Added marketing permission");
    } else {
      pid = exists[0].id;
    }

    // 2. Grant to Owner/Admin roles
    const [roles] = await db.query("SELECT id FROM roles WHERE code IN ('owner', 'admin') OR name IN ('Owner', 'Admin')");
    for (const rid of roles.map(r => r.id)) {
      const [has] = await db.query("SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?", [rid, pid]);
      if (has.length === 0) {
        await db.query("INSERT INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete) VALUES (?, ?, 1, 1, 1, 1)", [rid, pid]);
        console.log(`Granted marketing to role ${rid}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
};

update();
