const { db, logError } = require("../util/helper");

exports.getList = async (req, res) => {
    try {
        const { business_id } = req;
        const sql = "SELECT * FROM branches WHERE business_id = ? ORDER BY id DESC";
        const [list] = await db.query(sql, [business_id]);
        res.json({ list });
    } catch (error) {
        logError("branch.getList", error, res);
    }
};

exports.create = async (req, res) => {
    try {
        const { name, location, phone } = req.body;
        const { business_id } = req;

        // Optimized Subscription Limit Check
        const { checkPlanLimit } = require("../util/helper");
        const limitCheck = await checkPlanLimit(business_id, 'branch');
        if (!limitCheck.allowed) {
            return res.status(403).json({
                message: limitCheck.message,
                limit_reached: true
            });
        }

        const sql = "INSERT INTO branches (business_id, name, location, phone) VALUES (?, ?, ?, ?)";
        const [data] = await db.query(sql, [business_id, name, location, phone]);

        res.json({
            success: true,
            message: "Branch created successfully!",
            id: data.insertId
        });
    } catch (error) {
        logError("branch.create", error, res);
    }
};

exports.update = async (req, res) => {
    try {
        const { business_id } = req;
        const { id, name, location, phone } = req.body;

        const sql = "UPDATE branches SET name = ?, location = ?, phone = ? WHERE id = ? AND business_id = ?";
        await db.query(sql, [name, location, phone, id, business_id]);

        res.json({ message: "Branch updated successfully!" });
    } catch (error) {
        logError("branch.update", error, res);
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.body;
        const { business_id } = req;

        // Optional: Check if branch has active orders or users before deleting
        const sql = "DELETE FROM branches WHERE id = ? AND business_id = ? AND is_main = '0'";
        const [result] = await db.query(sql, [id, business_id]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: "Cannot delete main branch or branch not found!" });
        }

        res.json({ message: "Branch removed successfully!" });
    } catch (error) {
        logError("branch.remove", error, res);
    }
};
