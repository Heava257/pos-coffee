require('dotenv').config();
const db = require('../src/util/connection');
const router = require('../routes/index');

function cleanRegexp(regexp) {
  let str = regexp.toString();
  if (str.startsWith('/^') && str.endsWith('/i')) {
    str = str.slice(2, -2);
  } else if (str.startsWith('/') && str.endsWith('/')) {
    str = str.slice(1, -1);
  }
  str = str.replace(/\\\/\?\(\?=\\\/\|\$\)/g, '');
  str = str.replace(/\\\/\?\$/g, '');
  str = str.replace(/\(\?=\\\/\|\$\)/g, '');
  str = str.replace(/\\/g, '');
  return str;
}

function getRoutes(stack, prefix = '') {
  const routes = [];
  stack.forEach((middleware) => {
    if (middleware.route) {
      const path = middleware.route.path;
      routes.push((prefix + path).replace(/\/+/g, '/'));
    } else if (middleware.name === 'router') {
      const pathSegment = cleanRegexp(middleware.regexp);
      const newPrefix = prefix + '/' + pathSegment;
      routes.push(...getRoutes(middleware.handle.stack, newPrefix));
    }
  });
  return routes;
}

function formatRouteName(routePath) {
  let cleaned = routePath.replace(/^\/+|\/+$/g, '');
  if (!cleaned) return 'Root';
  
  return cleaned
    .split('/')
    .map(segment => {
      if (segment.startsWith(':')) {
        return `By ${segment.slice(1).charAt(0).toUpperCase() + segment.slice(2)}`;
      }
      return segment
        .replace(/-|_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    })
    .join(' ');
}

async function main() {
  try {
    console.log("🚀 Starting backend routes synchronization to DB...");
    
    // 1. Get unique express routes
    const expressRoutes = getRoutes(router.stack);
    const uniqueRoutes = [...new Set(expressRoutes)];
    console.log(`Found ${uniqueRoutes.length} unique route paths in Express backend.`);

    // 2. Fetch all existing roles in the DB
    const [roles] = await db.query("SELECT id, name FROM roles");
    console.log(`Found ${roles.length} roles in database.`);
    
    let permissionsInserted = 0;
    let permissionsUpdated = 0;
    let rolePermissionsSynced = 0;

    // 3. Sync each route to the database
    for (const routePath of uniqueRoutes) {
      // route_key should look like '/auth/register' or '/users/' (using slash standard)
      const routeKey = routePath.startsWith('/') ? routePath : '/' + routePath;
      const routeName = formatRouteName(routeKey);

      // Check if permission already exists
      const [existing] = await db.query(
        "SELECT id FROM permissions WHERE LOWER(route_key) = LOWER(?)", 
        [routeKey]
      );
      
      let permId;
      if (existing.length === 0) {
        // Insert new permission
        const [insertRes] = await db.query(
          "INSERT INTO permissions (name, route_key, min_plan_id) VALUES (?, ?, ?)",
          [routeName, routeKey, 1]
        );
        permId = insertRes.insertId;
        permissionsInserted++;
      } else {
        permId = existing[0].id;
        // Optionally update route name if empty or mismatched
        await db.query(
          "UPDATE permissions SET min_plan_id = 1 WHERE id = ?",
          [permId]
        );
        permissionsUpdated++;
      }

      // 4. Setup full CRUD role_permissions for all roles
      for (const role of roles) {
        await db.query(`
          INSERT INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete)
          VALUES (?, ?, 1, 1, 1, 1)
          ON DUPLICATE KEY UPDATE can_view = 1, can_create = 1, can_edit = 1, can_delete = 1
        `, [role.id, permId]);
        rolePermissionsSynced++;
      }
    }

    console.log(`\n🎉 Route synchronization complete!`);
    console.log(`- New permissions inserted: ${permissionsInserted}`);
    console.log(`- Existing permissions checked/updated: ${permissionsUpdated}`);
    console.log(`- Role permissions mappings synchronized: ${rolePermissionsSynced}`);

    // 5. Clear Redis cache to make changes active immediately
    try {
      const { clearCache } = require('../src/util/redisClient');
      if (clearCache) {
        await clearCache('perm:*');
        console.log('🚀 Redis permission cache cleared successfully.');
      }
    } catch (cacheErr) {
      console.log('⚠️ Redis cache clear skipped (no redisClient or not configured):', cacheErr.message);
    }

  } catch (err) {
    console.error("❌ Synchronization failed with error:", err);
  } finally {
    await db.end();
  }
}

main();
