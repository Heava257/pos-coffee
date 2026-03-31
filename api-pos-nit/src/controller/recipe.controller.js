const {
    db,
    isArray,
    isEmpty,
    logError,
} = require("../util/helper");


exports.getRecipe = async (req, res) => {
    try {
        const { product_id } = req.query;
        const { business_id } = req;

        if (!product_id) {
            return res.status(400).json({ error: "Product ID is required" });
        }

        const sql = `
      SELECT 
        rd.id, 
        rd.qty, 
        rd.unit, 
        rm.id as raw_material_id, 
        rm.name, 
        rm.code, 
        rm.unit as base_unit, 
        rm.price as cost_price
      FROM recipe_detail rd
      INNER JOIN raw_material rm ON rd.raw_material_id = rm.id
      WHERE rd.product_id = :product_id AND rd.business_id = :business_id
    `;

        const [list] = await db.query(sql, { product_id, business_id });

        res.json({
            list: list,
            total: list.length
        });
    } catch (error) {
        logError("recipe.getRecipe", error, res);
    }
};

exports.saveRecipe = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { product_id, ingredients } = req.body;
        const { business_id } = req;

        if (!product_id || !ingredients || !isArray(ingredients)) {
            return res.status(400).json({ error: "Invalid input" });
        }

        // 1. Clear existing recipe
        await connection.query("DELETE FROM recipe_detail WHERE product_id = ? AND business_id = ?", [product_id, business_id]);

        // 2. Insert new ingredients
        if (ingredients.length > 0) {
            const sql = "INSERT INTO recipe_detail (business_id, product_id, raw_material_id, qty, unit) VALUES ?";
            const values = ingredients.map(ing => [business_id, product_id, ing.raw_material_id, ing.qty, ing.unit]);
            await connection.query(sql, [values]);
        }

        // 3. Update products type
        await connection.query("UPDATE products SET product_type = 'recipe' WHERE id = ? AND business_id = ?", [product_id, business_id]);

        await connection.commit();

        res.json({
            message: "Recipe saved successfully!",
            ingredients_count: ingredients.length
        });

    } catch (error) {
        await connection.rollback();
        logError("recipe.saveRecipe", error, res);
    } finally {
        connection.release();
    }
};

exports.removeRecipe = async (req, res) => {
    try {
        const { product_id } = req.body;
        const { business_id } = req;

        if (!product_id) {
            return res.status(400).json({ error: "Product ID is required" });
        }

        await db.query("DELETE FROM recipe_detail WHERE product_id = ? AND business_id = ?", [product_id, business_id]);

        // Reset product type to 'ready'? 
        await db.query("UPDATE products SET product_type = 'ready' WHERE id = ? AND business_id = ?", [product_id, business_id]);

        res.json({
            message: "Recipe deleted successfully!"
        });
    } catch (error) {
        logError("recipe.removeRecipe", error, res);
    }
};
