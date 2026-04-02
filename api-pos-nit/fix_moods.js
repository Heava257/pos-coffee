const { db } = require('./src/util/helper');

async function diagnoseAndFix() {
  // Step 1: Check ALL categories and their default_moods
  const [cats] = await db.query('SELECT id, name, default_moods FROM categories ORDER BY id');
  console.log('\n=== ALL CATEGORIES ===');
  for (const c of cats) {
    console.log(`ID=${c.id} name="${c.name}" default_moods=${c.default_moods}`);
  }

  // Step 2: Check product 149
  const [prods] = await db.query('SELECT id, name, category_id, moods FROM products WHERE id=149');
  console.log('\n=== PRODUCT 149 ===');
  console.log(prods[0]);

  // Step 3: Parse what the category ACTUALLY has
  const cat40 = cats.find(c => c.id === 40);
  if (cat40) {
    console.log('\n=== CATEGORY 40 default_moods RAW ===');
    console.log(cat40.default_moods);
    
    let catMoods = [];
    try {
      catMoods = JSON.parse(cat40.default_moods);
    } catch(e) {
      console.log('Parse error:', e.message);
    }
    console.log('\n=== CATEGORY 40 moods PARSED ===');
    console.log(catMoods);
    
    const validValues = catMoods.map(m => typeof m === 'object' ? (m.value || m.label) : m);
    console.log('\n=== VALID VALUES FOR CHECKING ===', validValues);

    // Step 4: Fix product 149 moods to use EXACT category values
    // Currently it has ["mild"] but category uses "Mild" so we need to map it
    const productMoodsRaw = prods[0].moods;
    let productMoods = [];
    try { productMoods = JSON.parse(productMoodsRaw); } catch(e) {}
    console.log('\n=== CURRENT PRODUCT MOODS ===', productMoods);
    
    const fixedMoods = productMoods.map(m => {
      const savedStr = typeof m === 'object' ? (m.value || m.label) : m;
      const match = validValues.find(v => v.toLowerCase() === savedStr.toLowerCase());
      return match || savedStr;
    });
    console.log('\n=== FIXED PRODUCT MOODS ===', fixedMoods);
    
    await db.query('UPDATE products SET moods=? WHERE id=149', [JSON.stringify(fixedMoods)]);
    console.log('\n✅ Updated product 149 moods to:', JSON.stringify(fixedMoods));
  }

  process.exit();
}

diagnoseAndFix().catch(e => { console.error(e); process.exit(1); });
