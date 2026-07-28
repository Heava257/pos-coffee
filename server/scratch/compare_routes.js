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

async function main() {
  try {
    // 1. Get backend routes
    const expressRoutes = getRoutes(router.stack);
    
    // Deduplicate and get unique base paths or full paths
    const uniqueExpressRoutes = [...new Set(expressRoutes)];
    
    // 2. Get DB permissions
    const [dbPerms] = await db.query("SELECT id, name, route_key FROM permissions");
    const dbRouteKeys = dbPerms.map(p => p.route_key.toLowerCase().replace(/^\/+|\/+$/g, ''));
    
    console.log("Express routes count:", uniqueExpressRoutes.length);
    console.log("DB permissions count:", dbRouteKeys.length);
    
    // Let's print which express routes are not in the DB
    const missing = [];
    uniqueExpressRoutes.forEach(r => {
      // clean the route path to compare
      const cleanR = r.toLowerCase().replace(/^\/+|\/+$/g, '');
      if (!dbRouteKeys.includes(cleanR)) {
        missing.push(r);
      }
    });
    
    console.log("\nExpress routes missing from DB (first 20):");
    console.log(missing.slice(0, 20));
    console.log("Total missing:", missing.length);
    
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}

main();
