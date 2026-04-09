const {
    db,
    isArray,
    isEmpty,
    logError,
} = require("../util/helper");


// GET recipe - now supports size_label filter + returns real-time cost + waste_factor
exports.getRecipe = async (req, res) => {
    try {
        const { product_id, size_label } = req.query;
        const { business_id } = req;

        if (!product_id) {
            return res.status(400).json({ error: "Product ID is required" });
        }

        let sql = `
            SELECT 
                rd.id, 
                rd.qty,
                rd.waste_factor,
                rd.unit,
                rd.size_label,
                ROUND(rd.qty * (1 + COALESCE(rd.waste_factor, 0) / 100), 6) as effective_qty,
                rm.id as raw_material_id, 
                rm.name, 
                rm.code, 
                rm.unit as base_unit,
                rm.qty as stock_qty,
                rm.price as cost_price,
                ROUND(rd.qty * (1 + COALESCE(rd.waste_factor, 0) / 100) * rm.price, 6) as line_cost,
                FLOOR(rm.qty / (rd.qty * (1 + COALESCE(rd.waste_factor, 0) / 100))) as servings_possible
            FROM recipe_detail rd
            LEFT JOIN raw_material rm ON rd.raw_material_id = rm.id
            WHERE rd.product_id = ? AND rd.business_id = ?
        `;

        const params = [product_id, business_id];

        if (size_label && size_label !== 'all') {
            sql += ` AND (rd.size_label = ? OR rd.size_label IS NULL OR rd.size_label = '')`;
            params.push(size_label);
        }

        const [list] = await db.query(sql, params);

        // Estimated total servings = min across all ingredients (bottleneck)
        const servings = list.length > 0 ? Math.min(...list.map(r => r.servings_possible || 0)) : 0;
        const total_cost = list.reduce((acc, r) => acc + parseFloat(r.line_cost || 0), 0);

        res.json({
            list,
            total: list.length,
            estimated_servings: servings,
            total_recipe_cost: parseFloat(total_cost.toFixed(6))
        });
    } catch (error) {
        logError("recipe.getRecipe", error, res);
    }
};

// SAVE recipe - supports waste_factor + size_label per ingredient
exports.saveRecipe = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { product_id, ingredients, size_label } = req.body;
        const { business_id } = req;

        if (!product_id || !ingredients || !isArray(ingredients)) {
            return res.status(400).json({ error: "Invalid input" });
        }

        // 1. Clear existing recipe for this product (and size if specified)
        if (size_label && size_label !== 'all') {
            await connection.query(
                "DELETE FROM recipe_detail WHERE product_id = ? AND business_id = ? AND (size_label = ? OR size_label IS NULL OR size_label = '')",
                [product_id, business_id, size_label]
            );
        } else {
            await connection.query(
                "DELETE FROM recipe_detail WHERE product_id = ? AND business_id = ?",
                [product_id, business_id]
            );
        }

        // 2. Insert new ingredients with waste_factor + size_label
        if (ingredients && ingredients.length > 0) {
            // Check if waste_factor column exists; add it if not
            try {
                await connection.query("SELECT waste_factor FROM recipe_detail LIMIT 1");
            } catch (e) {
                await connection.query("ALTER TABLE recipe_detail ADD COLUMN waste_factor DECIMAL(5,2) DEFAULT 0 COMMENT 'Waste percentage e.g. 5 means 5%'");
                await connection.query("ALTER TABLE recipe_detail ADD COLUMN size_label VARCHAR(50) DEFAULT NULL COMMENT 'e.g. S, M, L'");
                console.log('Added waste_factor and size_label columns to recipe_detail');
            }

            const sql = "INSERT INTO recipe_detail (business_id, product_id, raw_material_id, qty, unit, waste_factor, size_label) VALUES ?";
            const values = ingredients.map(ing => [
                business_id,
                product_id,
                ing.raw_material_id,
                ing.qty,
                ing.unit || 'kg',
                parseFloat(ing.waste_factor || 0),
                ing.size_label || size_label || null
            ]);
            await connection.query(sql, [values]);
        }

        // 3. Mark product as recipe-based
        await connection.query(
            "UPDATE products SET product_type = 'recipe' WHERE id = ? AND business_id = ?",
            [product_id, business_id]
        );

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
        await db.query("UPDATE products SET product_type = 'ready' WHERE id = ? AND business_id = ?", [product_id, business_id]);

        res.json({ message: "Recipe deleted successfully!" });
    } catch (error) {
        logError("recipe.removeRecipe", error, res);
    }
};
