// Get all expense types
exports.getExpenseTypes = async (req, res) => {
  try {
    const sql = "SELECT id, name, code FROM expense_type";
    const [data] = await db.query(sql);

    res.json({
      success: true,
      data: data,
      message: "Expense types fetched successfully!",
    });
  } catch (error) {
    logError("expense_type.getExpenseTypes", error, res);
  }
};

// Create a new expense type
exports.createExpenseType = async (req, res) => {
  try {
    const { name, code } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, code",
      });
    }

    const sql = `
      INSERT INTO expense_type 
      (name, code) 
      VALUES (:name, :code)
    `;

    const [data] = await db.query(sql, { name, code });

    res.json({
      success: true,
      data: data,
      message: "Expense type created successfully!",
    });
  } catch (error) {
    logError("expense_type.createExpenseType", error, res);
  }
};

// Update an expense type
exports.updateExpenseType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, code",
      });
    }

    const sql = `
      UPDATE expense_type 
      SET 
        name = :name, 
        code = :code 
      WHERE id = :id
    `;

    const [data] = await db.query(sql, { name, code, id });

    res.json({
      success: true,
      data: data,
      message: "Expense type updated successfully!",
    });
  } catch (error) {
    logError("expense_type.updateExpenseType", error, res);
  }
};

// Delete an expense type
exports.deleteExpenseType = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the expense type is being used in the expense table
    const checkSql = "SELECT id FROM expense WHERE expense_type_id = :id";
    const [checkResult] = await db.query(checkSql, { id });

    if (checkResult.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete expense type. It is being used in the expense table.",
      });
    }

    const sql = "DELETE FROM expense_type WHERE id = :id";
    const [data] = await db.query(sql, { id });

    res.json({
      success: true,
      data: data,
      message: "Expense type deleted successfully!",
    });
  } catch (error) {
    logError("expense_type.deleteExpenseType", error, res);
  }
};