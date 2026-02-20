const {
    db,
    isArray,
    isEmpty,
    logError,
    removeFile,
} = require("../util/helper");

exports.getList = async (req, res) => {
    try {
        const { txt_search, status } = req.query;
        const { company_id } = req.auth; // Multi-tenancy

        let sql = "SELECT * FROM raw_material WHERE company_id = :company_id";
        let params = { company_id };

        if (txt_search) {
            sql += " AND (name LIKE :txt_search OR code LIKE :txt_search)";
            params.txt_search = `%${txt_search}%`;
        }

        if (status) {
            sql += " AND status = :status";
            params.status = status;
        }

        sql += " ORDER BY id DESC";

        const [list] = await db.query(sql, params);

        res.json({
            list: list,
            total: list.length,
        });
    } catch (error) {
        logError("raw_material.getList", error, res);
    }
};

exports.create = async (req, res) => {
    try {
        const { company_id, name } = req.auth; // Use company_id from auth

        // Validations (simple)
        if (isEmpty(req.body.name)) {
            return res.status(400).json({
                message: "Name is required!",
                error: "invalid_input",
            });
        }

        const sql = `
      INSERT INTO raw_material 
      (company_id, name, code, unit, price, qty, min_stock, image, status, create_by) 
      VALUES 
      (:company_id, :name, :code, :unit, :price, :qty, :min_stock, :image, :status, :create_by)
    `;

        const [data] = await db.query(sql, {
            ...req.body,
            company_id: company_id, // Ensure company_id is from auth
            image: req.file?.filename || null,
            create_by: name,
            qty: req.body.qty || 0, // Default to 0 if not provided
            price: req.body.price || 0,
            min_stock: req.body.min_stock || 0
        });

        res.json({
            data: data,
            message: "Raw Material created successfully!",
        });
    } catch (error) {
        logError("raw_material.create", error, res);
    }
};

exports.update = async (req, res) => {
    try {
        const { company_id } = req.auth;

        // Check if exists and belongs to company
        const [exists] = await db.query("SELECT * FROM raw_material WHERE id = :id AND company_id = :company_id", {
            id: req.body.id,
            company_id
        });

        if (exists.length === 0) {
            return res.status(404).json({ error: "Raw Material not found or access denied" });
        }

        let filename = req.body.image;
        if (req.file) {
            filename = req.file.filename;
            // Remove old file if exists
            if (exists[0].image) {
                removeFile(exists[0].image);
            }
        }

        if (req.body.image_remove === "1") {
            if (exists[0].image) removeFile(exists[0].image);
            filename = null;
        }

        const sql = `
      UPDATE raw_material SET 
        name = :name,
        code = :code,
        unit = :unit,
        price = :price,
        qty = :qty,
        min_stock = :min_stock,
        image = :image,
        status = :status
      WHERE id = :id AND company_id = :company_id
    `;

        const [data] = await db.query(sql, {
            ...req.body,
            image: filename,
            company_id: company_id // Security check
        });

        res.json({
            data: data,
            message: "Raw Material updated successfully!",
        });
    } catch (error) {
        logError("raw_material.update", error, res);
    }
};

exports.remove = async (req, res) => {
    try {
        const { company_id } = req.auth;
        const [exists] = await db.query("SELECT image FROM raw_material WHERE id = :id AND company_id = :company_id", {
            id: req.body.id,
            company_id
        });

        if (exists.length === 0) {
            return res.status(404).json({ error: "Raw Material not found or access denied" });
        }

        // Check usage in recipes or other tables if needed (optional for now)

        const [data] = await db.query("DELETE FROM raw_material WHERE id = :id AND company_id = :company_id", {
            id: req.body.id,
            company_id
        });

        if (exists[0].image) {
            removeFile(exists[0].image);
        }

        res.json({
            data: data,
            message: "Raw Material deleted successfully!",
        });
    } catch (error) {
        logError("raw_material.remove", error, res);
    }
};
