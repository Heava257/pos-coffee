const {
    db,
    isArray,
    isEmpty,
    logError,
} = require("../util/helper");

exports.create = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            supplier_id,
            payment_type,
            total_amount,
            paid_amount,
            note,
            items, // [{ raw_material_id, qty, cost, unit }]
        } = req.body;

        const { company_id, name: created_by } = req.auth;

        // 1. Create Purchase Record
        const purchaseSql = `
      INSERT INTO purchase 
      (supplier_id, ref, company_id, total_amount, paid_amount, note, created_at, created_by) 
      VALUES 
      (:supplier_id, :ref, :company_id, :total_amount, :paid_amount, :note, NOW(), :created_by)
    `;

        // Generate simple PO Ref
        const ref = `PO-${Date.now()}`;

        // Note: 'purchase' table columns might need adjustment based on existing schema. 
        // Assuming schema is compatible or using dynamic insertion for missing columns.
        // If 'company_id' doesn't exist in purchase, we skip it or update schema.
        // Let's assume standard purchase table.

        const [purchaseResult] = await connection.query(purchaseSql, {
            supplier_id: supplier_id || null,
            ref,
            company_id,
            total_amount: total_amount || 0,
            paid_amount: paid_amount || 0,
            note: note || '',
            created_by
        });

        const purchaseId = purchaseResult.insertId;

        // 2. Process Items (Raw Materials)
        if (items && isArray(items)) {
            for (const item of items) {
                if (!item.raw_material_id) continue;

                // A. Add to purchase_product
                await connection.query(`
          INSERT INTO purchase_product 
          (purchase_id, raw_material_id, qty, cost, created_at, created_by) 
          VALUES 
          (:purchase_id, :raw_material_id, :qty, :cost, NOW(), :created_by)
        `, {
                    purchase_id: purchaseId,
                    raw_material_id: item.raw_material_id,
                    qty: item.qty,
                    cost: item.cost,
                    created_by
                });

                // B. Update Raw Material Stock (INCREMENT)
                await connection.query(`
          UPDATE raw_material 
          SET qty = qty + :qty, price = :cost 
          WHERE id = :id
        `, {
                    qty: item.qty,
                    cost: item.cost, // Update last cost price
                    id: item.raw_material_id
                });

                // C. Log Stock Movement (IN)
                await connection.query(`
          INSERT INTO stock_movement 
          (stock_type, raw_material_id, qty, description, ref_id, ref_type, created_at, created_by) 
          VALUES 
          ('IN', :raw_material_id, :qty, :description, :ref_id, 'purchase', NOW(), :created_by)
        `, {
                    raw_material_id: item.raw_material_id,
                    qty: item.qty,
                    description: `Purchase ${ref}`,
                    ref_id: purchaseId,
                    created_by
                });

            }
        }

        await connection.commit();

        res.json({
            message: "Purchase created successfully!",
            purchase_id: purchaseId,
            ref
        });

    } catch (error) {
        await connection.rollback();
        logError("purchase.create", error, res);
    } finally {
        connection.release();
    }
};

exports.getList = async (req, res) => {
    try {
        const { company_id } = req.auth;
        const { page, pageSize } = req.query;

        const limit = Number(pageSize) || 10;
        const offset = (Number(page || 1) - 1) * limit;

        const sql = `
      SELECT p.*, s.name as supplier_name 
      FROM purchase p
      LEFT JOIN supplier s ON p.supplier_id = s.id
      WHERE p.company_id = :company_id
      ORDER BY p.id DESC
      LIMIT :limit OFFSET :offset
    `;

        const [list] = await db.query(sql, { company_id, limit, offset });

        // Count total
        const [count] = await db.query("SELECT COUNT(*) as total FROM purchase WHERE company_id = :company_id", { company_id });

        res.json({
            list,
            total: count[0].total
        });
    } catch (error) {
        logError("purchase.getList", error, res);
    }
};
