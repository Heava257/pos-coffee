const mysql = require("mysql2/promise");
require("dotenv").config();

const categoriesToUpdate = [
  {
    id: 24,
    name: "General Medicine / ថ្នាំទូទៅ",
    default_moods: "Morning, Afternoon, Evening, Night, Before Meal, After Meal",
    default_sizes: "Box, Strip, Pill",
    default_addons: "Keep in cool place, Avoid alcohol, Shake well"
  },
  {
    id: 31,
    name: "ថ្នាំផ្សះ (Antibiotics)",
    default_moods: "លេបឱ្យអស់តាមវេជ្ជបញ្ជា (Finish course), រៀងរាល់ ៨ ម៉ោង (Every 8 hours), លេបមុនបាយ (Before Meal)",
    default_sizes: "ប្រអប់ (Box), បន្ទះ (Strip), ដប (Bottle)",
    default_addons: "អាចមានប្រតិកម្មថ្នាំ (May cause allergy), កុំប្រើជាមួយគ្រឿងស្រវឹង (No alcohol)"
  },
  {
    id: 32,
    name: "Vitamins & Supplements / វីតាមីន និងអាហារបំប៉ន",
    default_moods: "Morning, After Meal, Take with water",
    default_sizes: "Bottle, Jar, Pouch",
    default_addons: "Not for treatment, Store at room temp"
  },
  {
    id: 33,
    name: "Skincare & Personal Care / ថែរក្សាស្បែក និងរាងកាយ",
    default_moods: "After Wash, Morning/Evening, External use",
    default_sizes: "Tube, Bottle, Sachet",
    default_addons: "Avoid eyes, Stop if irritation"
  },
  {
    id: 34,
    name: "Medical Equipment / ឧបករណ៍វេជ្ជសាស្ត្រ",
    default_moods: "Single use, Emergency, Sterile",
    default_sizes: "Piece, Set, Pack",
    default_addons: "Professional only, Discard after use"
  },
  {
    id: 35,
    name: "Baby & Mom Care / ផលិតផលសម្រាប់ម្តាយ និងទារក",
    default_moods: "Daily use, Gentle, Morning/Night",
    default_sizes: "Bottle, Pack, Piece",
    default_addons: "For sensitive skin, Keep away from heat"
  },
  {
    id: 36,
    name: "Seafood / គ្រឿងសមុទ្រ"
  },
  {
    id: 37,
    name: "Soup / សម្ល"
  },
  {
    id: 38,
    name: "Stir-Fry / ម្ហូបឆា"
  },
  {
    id: 39,
    name: "Roasted & Deep-fried / ម្ហូបបំពង & អាំង"
  },
  {
    id: 40,
    name: "Salads & Spicy Mixed / ញាំ & បុក"
  },
  {
    id: 41,
    name: "Dessert / បង្អែម"
  },
  {
    id: 42,
    name: "Drinks / ភេសជ្ជៈ"
  }
];

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    charset: 'utf8mb4',
  });

  console.log("Updating category names with correct Khmer characters...");

  for (const cat of categoriesToUpdate) {
    if (cat.default_moods) {
      await connection.execute(
        "UPDATE categories SET name = ?, default_moods = ?, default_sizes = ?, default_addons = ? WHERE id = ?",
        [cat.name, cat.default_moods, cat.default_sizes, cat.default_addons, cat.id]
      );
    } else {
      await connection.execute(
        "UPDATE categories SET name = ? WHERE id = ?",
        [cat.name, cat.id]
      );
    }
    console.log(`Updated ID ${cat.id} -> ${cat.name}`);
  }

  await connection.end();
  console.log("Done!");
}

run().catch(console.error);
