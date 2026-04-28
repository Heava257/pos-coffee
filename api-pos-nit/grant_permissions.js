const { db } = require("./src/util/helper");

const grant = async () => {
  try {
    // 1. Get the new permission IDs
    const [perms] = await db.query("SELECT id FROM permissions WHERE route_key IN ('menu-board', 'membership/search', 'dashboard/morning-briefing')");
    const permIds = perms.map(p => p.id);

    if (permIds.length === 0) {
      console.log("No permissions found to grant.");
      process.exit();
    }

    // 2. Find Owner and Admin roles
    const [roles] = await db.query("SELECT id FROM roles WHERE code IN ('owner', 'admin') OR name IN ('Owner', 'Admin')");
    const roleIds = roles.map(r => r.id);

    if (roleIds.length === 0) {
      console.log("No roles found to grant permissions to.");
      process.exit();
    }

    // 3. Grant them
    for (const rid of roleIds) {
      for (const pid of permIds) {
        // Check if already has it
        const [exists] = await db.query("SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?", [rid, pid]);
        if (exists.length === 0) {
          await db.query("INSERT INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete) VALUES (?, ?, 1, 1, 1, 1)", [rid, pid]);
          console.log(`Granted permission ${pid} to role ${rid}`);
        }
      }
    }

    console.log("Granting complete!");
  } catch (err) {
    console.error("Granting failed:", err);
  } finally {
    process.exit();
  }
};

grant();
