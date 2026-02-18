const { db, isArray, isEmpty, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const [category] = await db.query(
      "SELECT id AS value, name AS label, description FROM category"
    );


    const [getSizes] = await db.query(
      "SELECT id AS value, label AS name, price, product_id FROM product_size"
    );

    const [getAddons] = await db.query(
      "SELECT id AS value, label AS name, price, product_id FROM product_addon"
    );






    const [expense] = await db.query(
      "select id as value, name as label from expense"
    );
    const [user] = await db.query(
      `SELECT 
          id AS value, 
          CONCAT(name, ' - ', branch_name, ' - ', address, ' - ', tel) AS label 
       FROM user`
    );





    const [role] = await db.query("select id,name,code from role");
    const [supplier] = await db.query("select id,name,code from supplier");
    const purchase_status = [
      {
        lebel: "Pending",
        value: "Pending",
      },
      {
        lebel: "Approved",
        value: "Approved",
      },
      {
        lebel: "Shiped",
        value: "Shiped",
      },
      {
        lebel: "Received",
        value: "Received",
      },
      {
        lebel: "Issues",
        value: "Issues",
      },
    ];
    const company_name = [
      { label: "Petronas Cambodia", value: "petronas-cambodia", country: "Cambodia" },
      { label: "KAMPUCHEA TELA LIMITED", value: "kampuchea-tela-ltd", country: "Cambodia" },
      { label: "SOK KONG IMP-EXP CO., LTD", value: "sok-kong-imp-exp", country: "Cambodia" },
      { label: "LHR ASEAN INVESTMENT CO., LTD", value: "lhr-asean-investment", country: "Cambodia" },
      { label: "SAVIMEX IMP-EXP CO., LTD", value: "savimex-imp-exp", country: "Cambodia" },
      { label: "LIM LONG CO., LTD", value: "lim-long", country: "Cambodia" },
      { label: "PAPA PETROLEUM CO., LTD", value: "papa-petroleum", country: "Cambodia" },
      { label: "THARY TRADE IMP-EXP CO., LTD", value: "thary-trade-imp-exp", country: "Cambodia" },
      { label: "BRIGHT VICTORY MEKONG PETROLEUM IMP-EXP CO., LTD", value: "bright-victory-mekong", country: "Cambodia" },
      { label: "MITTAPHEAP PERTA PETROLEUM LIMITED", value: "mittapheap-perta-petroleum", country: "Cambodia" },
      { label: "CHEVRON (CAMBODIA) LIMITED", value: "chevron-cambodia", country: "Cambodia" },
      { label: "PTT (CAMBODIA) LTD", value: "ptt-cambodia", country: "Cambodia" },
      { label: "TOTAL CAMBODGE", value: "total-cambodge", country: "Cambodia" },
      { label: "AMERICAN LUBES CO., LTD", value: "american-lubes", country: "Cambodia" },
      { label: "PETRONAS CAMBODIA CO., LTD", value: "petronas-cambodia-ltd", country: "Cambodia" }
    ];

    // const [expense_type] = await db.query("SELECT * FROM expense_type");

    const [expense_type] = await db.query(
      "select id as value, name as label from expense_type"
    );

    const brand = [
      { label: "Brown Coffee", value: "brown-coffee", country: "Cambodia" },
      { label: "Amazon Café", value: "amazon-cafe", country: "Cambodia" },
      { label: "Coffee Today", value: "coffee-today", country: "Cambodia" },
      { label: "Black Canyon Coffee", value: "black-canyon-coffee", country: "Cambodia" },
      { label: "Starbucks Cambodia", value: "starbucks-cambodia", country: "Cambodia" },
      { label: "The Coffee Bean & Tea Leaf", value: "coffee-bean-tea-leaf", country: "Cambodia" },
      { label: "Gloria Jean's Coffees", value: "gloria-jeans", country: "Cambodia" },
      { label: "Local Brew", value: "local-brew", country: "Cambodia" }
    ]; 

    const products_name = [
      { name: "Espresso", value: "espresso" },
      { name: "Americano", value: "americano" },
      { name: "Latte", value: "latte" },
      { name: "Cappuccino", value: "cappuccino" },
      { name: "Flat White", value: "flat-white" },
      { name: "Mocha", value: "mocha" },
      { name: "Caramel Macchiato", value: "caramel-macchiato" },
      { name: "Iced Americano", value: "iced-americano" },
      { name: "Iced Latte", value: "iced-latte" },
      { name: "Iced Mocha", value: "iced-mocha" },
      { name: "Cold Brew", value: "cold-brew" }, 
      { name: "Coffee Frappe", value: "coffee-frappe" },
      { name: "Mocha Frappe", value: "mocha-frappe" },
      { name: "Caramel Frappe", value: "caramel-frappe" }
    ];


    const branch_name = [
      { label: "ទីស្នាក់ការកណ្តាល", value: "ទីស្នាក់ការកណ្តាល" },
      { label: "Phnom Penh - ភ្នំពេញ", value: "Phnom Penh" },
      { label: "Siem Reap - សៀមរាប", value: "Siem Reap" },
      { label: "Battambang - បាត់ដំបង", value: "Battambang" },
      { label: "Sihanoukville - សីហនុ", value: "Sihanoukville" },
      { label: "Kampot - កំពត", value: "Kampot" },
      { label: "Koh Kong - កោះកុង", value: "Koh Kong" },
      { label: "Takeo - តាកែវ", value: "Takeo" },
      { label: "Preah Vihear - ព្រះវិហារ", value: "Preah Vihear" },
      { label: "Kandal - កណ្ដាល", value: "Kandal" },
      { label: "Kampong Cham - កំពង់ចាម", value: "Kampong Cham" },
      { label: "Kampong Thom - កំពង់ធំ", value: "Kampong Thom" },
      { label: "Kratie - ក្រចេះ", value: "Kratie" },
      { label: "Mondulkiri - មណ្ឌលគីរី", value: "Mondulkiri" },
      { label: "Ratanakiri - រតនគិរី", value: "Ratanakiri" },
      { label: "Pursat - ពោធិ៍សាត់", value: "Pursat" },
      { label: "Svay Rieng - ស្វាយរៀង", value: "Svay Rieng" },
      { label: "Prey Veng - ព្រៃវែង", value: "Prey Veng" },
      { label: "Stung Treng - ស្ទឹងត្រង់", value: "Stung Treng" },
      { label: "Tboung Khmum - ត្បូងខ្មុំ", value: "Tboung Khmum" },
      { label: "Pailin - ប៉ៃលិន", value: "Pailin" },
      { label: "Banteay Meanchey - បន្ទាយមានជ័យ", value: "Banteay Meanchey" },
    ];



    const unit = [
      { label: "Liter", value: "liter" },
      { label: "Ton", value: "ton" },
    ];

const groupOptions = [
  { label: "Admin Group", value: 1 },
  { label: "Supper Admin", value: 4 },
  { label: "Manager Group", value: 3 },
  { label: "សាខា ទួលទំពូង", value: 2 },

  

];


    const product = [
      { label: "ប្រេងឥន្ធនះ", value: "oil" },
    ];



    res.json({
      category,
      role,
      supplier,
      purchase_status,
      brand,
      expense_type,
      expense,
      unit,
      company_name,
      user,
      branch_name,
      product,
      products_name,
      getSizes,
      getAddons,
      groupOptions
    });
  } catch (error) {
    logError("config.getList", error, res);
  }
}; 




exports.getProductConfig = async (req, res) => {
  try {
    const { product_id } = req.params;
    
    const [getSizes] = await db.query(
      "SELECT id AS value, label AS name, price, product_id FROM product_size WHERE product_id = ?",
      [product_id]
    );
    
    const [getAddons] = await db.query(
      "SELECT id AS value, label AS name, price, product_id FROM product_addon WHERE product_id = ?",
      [product_id]
    );
    
    res.json({
      getSizes,
      getAddons
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};