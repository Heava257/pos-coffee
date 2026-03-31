const { db } = require("../api-pos-nit/src/util/helper");

async function fix() {
  try {
    const moods = JSON.stringify(["hot", "iced", "frappe"]);
    const sizes = JSON.stringify([
      { label: "Small (S)", value: "S" },
      { label: "Medium (M)", value: "M" },
      { label: "Large (L)", value: "L" }
    ]);
    const addons = JSON.stringify([{ label: "Cream", value: "Cream" }]);

    console.log("Fixing Category ID 2 (Coffee)...");
    await db.query(
      "UPDATE categories SET default_moods = ?, default_sizes = ?, default_addons = ? WHERE id = 2",
      [moods, sizes, addons]
    );

    console.log("Fixing Category ID 3 (Duplicate Coffee)...");
    // Ensure ID 3 has the same JSON structure
    await db.query(
      "UPDATE categories SET default_moods = ?, default_sizes = ?, default_addons = ? WHERE id = 3",
      [moods, sizes, addons]
    );

    console.log("Successfully fixed category formatting!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing categories:", error);
    process.exit(1);
  }
}

fix();
