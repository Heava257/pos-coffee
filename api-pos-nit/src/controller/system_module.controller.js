const { db, logError } = require("../util/helper");

exports.getList = async (req, res) => {
    try {
        const sql = "SELECT * FROM system_modules ORDER BY id ASC";
        const [list] = await db.query(sql);
        res.json({ list });
    } catch (error) {
        logError("system_module.getList", error, res);
    }
};

exports.create = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        const { name, code, description, status } = req.body;
        
        const [result] = await db.query(
            "INSERT INTO system_modules (name, code, description, status) VALUES (?, ?, ?, ?)",
            [name, code, description, status || 'active']
        );
        res.json({ success: true, message: "Module created successfully", id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Module code already exists!" });
        }
        logError("system_module.create", error, res);
    }
};

exports.update = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        const { id, name, code, description, status } = req.body;
        
        await db.query(
            "UPDATE system_modules SET name = ?, code = ?, description = ?, status = ? WHERE id = ?",
            [name, code, description, status, id]
        );
        res.json({ success: true, message: "Module updated successfully" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Module code already exists!" });
        }
        logError("system_module.update", error, res);
    }
};

exports.remove = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });
        const { id } = req.body;
        
        await db.query("DELETE FROM system_modules WHERE id = ?", [id]);
        res.json({ success: true, message: "Module deleted successfully" });
    } catch (error) {
        logError("system_module.remove", error, res);
    }
};
