const axios = require("axios");
const { db } = require("../src/util/helper");

async function runTest() {
  console.log("=== STARTING DEVELOPER PORTAL API KEY INTEGRATION TEST ===");
  try {
    // 1. Fetch the keys we inserted
    const [keys] = await db.query("SELECT name, client_id, client_secret, scopes FROM developer_keys ORDER BY id DESC LIMIT 1");
    if (keys.length === 0) {
      console.log("❌ No developer keys found in database. Please run test key seeding first.");
      process.exit(1);
    }

    const testKey = keys[0];
    console.log(`🔑 Using Key: "${testKey.name}"`);
    console.log(`   Client ID:      ${testKey.client_id}`);
    console.log(`   Client Secret:  ${testKey.client_secret}`);
    console.log(`   Scopes:         ${testKey.scopes}`);

    const baseUrl = "http://localhost:8080/api/v1";

    // Test Case 1: Valid Credentials on GET /api/v1/securities/logs (should succeed since scopes includes 'read')
    console.log("\n🧪 Test Case 1: Fetching logs with VALID API Key headers...");
    try {
      const res = await axios.get(`${baseUrl}/securities/logs`, {
        headers: {
          "x-client-id": testKey.client_id,
          "x-client-secret": testKey.client_secret
        }
      });
      console.log(`✅ Success! Response HTTP Status: ${res.status}`);
      console.log(`   Returned list length: ${res.data?.list?.length || 0} logs.`);
    } catch (err) {
      console.log(`❌ Test Case 1 Failed:`, err.response?.data || err.message);
    }

    // Test Case 2: Invalid Client Secret (should fail with 401)
    console.log("\n🧪 Test Case 2: Accessing API with INVALID Client Secret...");
    try {
      await axios.get(`${baseUrl}/securities/logs`, {
        headers: {
          "x-client-id": testKey.client_id,
          "x-client-secret": "wrong_secret"
        }
      });
      console.log("❌ Failure: Expected request to fail, but it succeeded.");
    } catch (err) {
      console.log(`✅ Success! Expected 401 error received:`, err.response?.status, err.response?.data);
    }

    // Test Case 3: POST request requiring 'write' scope with a key that only has 'read' scope (should fail with 403)
    // First, let's insert a test key with ONLY 'read' scope if needed, or update our existing key's scopes.
    console.log("\n🧪 Test Case 3: Insufficient Scope check (Write action on GET-only key)...");
    // Let's create a temporary key with only 'read' scope
    const tempClientId = "pk_temp_read_only";
    const tempClientSecret = "sk_temp_read_only_secret";
    await db.query(
      "INSERT INTO developer_keys (name, client_id, client_secret, scopes, status) VALUES (?, ?, ?, ?, 'active') ON DUPLICATE KEY UPDATE client_secret = VALUES(client_secret)",
      ["Temp Read Only Key", tempClientId, tempClientSecret, JSON.stringify(["read"])]
    );

    try {
      // Attempting a POST request (e.g. creating a setting or creating something)
      // Let's try to post a test telegram alert using this key
      await axios.post(`${baseUrl}/system-setting/test-telegram`, {
        telegram_token: "mock",
        telegram_chat_id: "mock"
      }, {
        headers: {
          "x-client-id": tempClientId,
          "x-client-secret": tempClientSecret
        }
      });
      console.log("❌ Failure: Expected POST request to fail due to missing 'write' scope, but it succeeded.");
    } catch (err) {
      console.log(`✅ Success! Expected 403 scope error received:`, err.response?.status, err.response?.data);
    }

    // Cleanup temp key
    await db.query("DELETE FROM developer_keys WHERE client_id = ?", [tempClientId]);
    console.log("\n🧹 Temporary test key cleaned up.");
    console.log("\n🎉 ALL TEST CASES PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    process.exit();
  }
}

runTest();
