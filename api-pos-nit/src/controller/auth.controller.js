const { logError, db, removeFile, sendTelegramMessagenewLogin } = require("../util/helper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const config = require("../util/config");
const { json } = require("express");

exports.getList = async (req, res) => {
  try {
    let sql;
    let queryParams = {};

    // Check if current user is super admin
    const currentUserSql = `SELECT is_super_admin FROM user WHERE id = :current_user_id`;
    const [currentUserResult] = await db.query(currentUserSql, {
      current_user_id: req.current_id
    });

    const isSuperAdmin = currentUserResult[0]?.is_super_admin === 1;

    if (isSuperAdmin) {
      // Super admin can see all users
      sql = `
        SELECT  
          u.id, 
          u.name, 
          u.barcode, 
          u.username, 
          u.branch_name, 
          u.create_by, 
          u.create_at, 
          u.address, 
          u.tel, 
          u.is_active, 
          u.profile_image, 
          u.group_id,
          u.is_super_admin,
          r.name AS role_name 
        FROM user u 
        INNER JOIN role r ON u.role_id = r.id 
        ORDER BY u.create_at DESC
      `;
    } else {
      // Regular users can only see users in their group
      sql = `
        SELECT  
          u.id, 
          u.name, 
          u.barcode, 
          u.username, 
          u.branch_name, 
          u.create_by, 
          u.create_at, 
          u.address, 
          u.tel, 
          u.is_active, 
          u.profile_image, 
          u.group_id,
          u.is_super_admin,
          r.name AS role_name 
        FROM user u 
        INNER JOIN role r ON u.role_id = r.id 
        INNER JOIN user cu ON cu.group_id = u.group_id
        WHERE cu.id = :current_user_id
        ORDER BY u.create_at DESC
      `;
      queryParams.current_user_id = req.current_id;
    }

    const [list] = await db.query(sql, queryParams);
    const [role] = await db.query(
      "SELECT id AS value, name AS label FROM role"
    );

    res.json({
      list,
      role,
      is_super_admin: isSuperAdmin
    });
  } catch (error) {
    logError("auth.getList", error, res);
  }
};



exports.updateuserProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    const { name, username, password } = req.body;
    const profileImage = req.file?.filename;

    let sql = "UPDATE user SET name = ?, username = ?";
    let params = [name, username];

    if (password && password.trim() !== '') {
      const hashedPassword = bcrypt.hashSync(password, 10);
      sql += ", password = ?";
      params.push(hashedPassword);
    }

    if (profileImage) {
      sql += ", profile_image = ?";
      params.push(profileImage);
    }

    sql += " WHERE id = ?";
    params.push(userId);

    const [result] = await db.query(sql, params);

    if (result.affectedRows > 0) {
      const [updatedUser] = await db.query(
        "SELECT id, name, username, profile_image FROM user WHERE id = ?",
        [userId]
      );

      res.json({
        success: true,
        message: "Profile updated successfully",
        profile: updatedUser[0]
      });
    } else {
      res.status(404).json({ success: false, message: "User not found or no changes made" });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

exports.getuserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const sql = `
      SELECT 
        u.id, 
        u.name, 
        u.username, 
        u.profile_image, 
        u.address, 
        u.tel, 
        u.branch_name, 
        u.is_active, 
        u.is_super_admin,
        r.name AS role_name 
      FROM user u 
      INNER JOIN role r ON u.role_id = r.id 
      WHERE u.id = ?
    `;

    const [user] = await db.query(sql, [userId]);

    if (user.length > 0) {
      res.json({ profile: user[0] });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    logError("auth.getUserProfile", error, res);
  }
};

// Fixed register function
exports.register = async (req, res) => {
  try {
    let password = bcrypt.hashSync(req.body.password, 10);

    const {
      role_id,
      group_id,
      name,
      username,
      address,
      tel,
      branch_name,
      barcode,
      is_active, // Changed from 'status' to 'is_active' for consistency
      is_super_admin = 0
    } = req.body;

    // Check if current user can create super admin
    const currentUserIsSuperAdmin = req.auth?.is_super_admin === 1;

    // Check if any super admin exists
    const checkSuperAdminSql = `SELECT COUNT(*) as count FROM user WHERE is_super_admin = 1`;
    const [superAdminCheck] = await db.query(checkSuperAdminSql);
    const noSuperAdminExists = superAdminCheck[0].count === 0;

    // Logic for creating super admin:
    // 1. If no super admin exists, allow first super admin creation
    // 2. If super admin exists, only existing super admin can create new super admin
    let finalIsSuperAdmin = 0;

    if (is_super_admin && is_super_admin == 1) {
      if (noSuperAdminExists) {
        // First super admin - allow creation
        finalIsSuperAdmin = 1;
      } else if (currentUserIsSuperAdmin) {
        // Existing super admin creating new super admin
        finalIsSuperAdmin = 1;
      } else {
        // Non-super admin trying to create super admin - deny
        return res.status(403).json({
          error: true,
          message: "Only Super Admin can create other Super Admins"
        });
      }
    }

    // Insert into the user table
    let userSql = `
      INSERT INTO user (
        role_id, group_id, name, username, password, is_active, is_super_admin,
        address, tel, branch_name, barcode, profile_image, create_by, create_at
      ) VALUES (
        :role_id, :group_id, :name, :username, :password, :is_active, :is_super_admin,
        :address, :tel, :branch_name, :barcode, :profile_image, :create_by, :create_at
      );
    `;

    let userData = await db.query(userSql, {
      role_id,
      group_id,
      name,
      username,
      password,
      is_active: is_active || 1, // Default to active if not provided
      is_super_admin: finalIsSuperAdmin,
      address,
      tel,
      branch_name,
      barcode,
      profile_image: req.file?.filename,
      create_by: req.auth?.name,
      create_at: new Date(),
    });

    // Get the newly created user's ID
    let userId = userData.insertId || userData[0]?.insertId;

    if (!userId) {
      const findUserSql = `SELECT id FROM user WHERE username = :username LIMIT 1`;
      const userResult = await db.query(findUserSql, { username });
      userId = userResult[0]?.id;

      if (!userId) {
        throw new Error("Failed to retrieve the newly created user ID");
      }
    }

    // Insert into user_roles table
    let rolesSql = `
      INSERT INTO user_roles (user_id, role_id) 
      VALUES (:user_id, :role_id);
    `;

    await db.query(rolesSql, {
      user_id: userId,
      role_id,
    });

    res.json({
      message: "Create new account success!",
      body: req.body,
      data: userData,
      file: req.file,
      created_super_admin: finalIsSuperAdmin === 1
    });
  } catch (error) {
    logError("auth.register", error, res);
  }
};

// Fixed update function
exports.update = async (req, res) => {
  try {
    let password = req.body.password;

    if (password) {
      password = bcrypt.hashSync(password, 10);
    }

    let profileImage = req.body.profile_image;

    if (req.file) {
      profileImage = req.file.filename;
    }

    if (req.body.profile_image_remove === "1") {
      removeFile(req.body.profile_image);
      profileImage = null;
    }

    // Super Admin logic for updates
    const currentUserIsSuperAdmin = req.auth?.is_super_admin === 1;
    const requestedSuperAdminStatus = req.body.is_super_admin;

    // Get current user data being updated
    const getUserSql = `SELECT is_super_admin FROM user WHERE id = :id`;
    const [currentUserData] = await db.query(getUserSql, { id: req.body.id });
    const currentlyIsSuperAdmin = currentUserData[0]?.is_super_admin === 1;

    let finalSuperAdminStatus = currentlyIsSuperAdmin ? 1 : 0; // Keep current status by default
    let superAdminClause = "";

    // Handle super admin status changes
    if (requestedSuperAdminStatus !== undefined) {
      const wantsToBecomeSuperAdmin = requestedSuperAdminStatus == 1;
      const wantsToRemoveSuperAdmin = requestedSuperAdminStatus == 0;

      if (wantsToBecomeSuperAdmin && !currentlyIsSuperAdmin) {
        // Trying to become super admin
        if (!currentUserIsSuperAdmin) {
          return res.status(403).json({
            error: true,
            message: "Only Super Admin can promote users to Super Admin"
          });
        }
        finalSuperAdminStatus = 1;
      } else if (wantsToRemoveSuperAdmin && currentlyIsSuperAdmin) {
        // Trying to remove super admin status
        if (!currentUserIsSuperAdmin) {
          return res.status(403).json({
            error: true,
            message: "Only Super Admin can demote Super Admins"
          });
        }

        // Check if this is the last super admin
        const countSuperAdminSql = `SELECT COUNT(*) as count FROM user WHERE is_super_admin = 1`;
        const [superAdminCount] = await db.query(countSuperAdminSql);

        if (superAdminCount[0].count <= 1) {
          return res.status(400).json({
            error: true,
            message: "Cannot remove the last Super Admin. At least one Super Admin must exist."
          });
        }

        finalSuperAdminStatus = 0;
      }

      superAdminClause = "is_super_admin = :is_super_admin,";
    }

    let sql = `
      UPDATE user SET
        name = :name,
        username = :username,
        role_id = :role_id,
        group_id = :group_id,
        ${password ? "password = :password," : ""}
        ${superAdminClause}
        tel = :tel,
        branch_name = :branch_name,
        is_active = :is_active,
        address = :address,
        profile_image = :profile_image,
        create_by = :create_by,
        create_at = :create_at
      WHERE id = :id
    `;

    const queryParams = {
      ...req.body,
      password: password || undefined,
      profile_image: profileImage,
      is_super_admin: finalSuperAdminStatus,
      create_by: req.auth?.name,
      create_at: new Date(),
    };

    const [data] = await db.query(sql, queryParams);

    res.json({
      data: data,
      message: "Update success!",
      super_admin_updated: requestedSuperAdminStatus !== undefined
    });
  } catch (error) {
    logError("user.update", error, res);
  }
};

exports.newBarcode = async (req, res) => {
  try {
    var sql = `
      SELECT CONCAT('U', LPAD(COALESCE(MAX(id), 0) + 1, 3, '0')) AS barcode 
      FROM user
    `;
    var [data] = await db.query(sql);

    // If no users exist, default to "U001"
    let barcode = data[0]?.barcode || "U001";

    res.json({ barcode });
  } catch (error) {
    logError("barcode.create", error, res);
  }
};


isExistBarcode = async (barcode) => {
  try {
    var sql = "SELECT COUNT(id) as Total FROM user WHERE barcode=:barcode";
    var [data] = await db.query(sql, {
      barcode: barcode,
    });
    if (data.length > 0 && data[0].Total > 0) {
      return true; // ស្ទួន
    }
    return false; // អត់ស្ទួនទេ
  } catch (error) {
    logError("barcode.create", error, res);
  }
};

// exports.remove = async (req, res) => {
//   try {
//     var [data] = await db.query("DELETE FROM user WHERE id = :id", {
//       id: req.body.id,
//     });
//     res.json({
//       data: data,
//       message: "Data delete success!",
//     });
//   } catch (error) {
//     logError("user.remove", error, res);
//   }
// }
exports.remove = async (req, res) => {
  try {
    // Get the user's profile image before deleting
    const [user] = await db.query("SELECT profile_image FROM user WHERE id = :id", {
      id: req.body.id,
    });

    // Delete the user
    const [data] = await db.query("DELETE FROM user WHERE id = :id", {
      id: req.body.id,
    });

    // Remove the profile image file if it exists
    if (user[0]?.profile_image) {
      removeFile(user[0].profile_image);
    }

    res.json({
      data: data,
      message: "Data delete success!",
    });
  } catch (error) {
    logError("user.remove", error, res);
  }
};


exports.login = async (req, res) => {
  try {
    let { password, username } = req.body;
    let sql =
      "SELECT " +
      " u.*," +
      " r.name as role_name" +
      " FROM user u " +
      " INNER JOIN role r ON u.role_id = r.id " +
      " WHERE u.username=:username ";

    let [data] = await db.query(sql, {
      username: username,
    });

    if (data.length == 0) {
      res.json({
        error: {
          username: "Username doesn't exist!",
        },
      });
    } else {
      let dbPass = data[0].password;
      let isCorrectPass = bcrypt.compareSync(password, dbPass);

      if (!isCorrectPass) {
        res.json({
          error: {
            password: "Password incorrect!",
          },
        });
      } else {
        delete data[0].password;
        let obj = {
          profile: data[0],
          permission: await getPermissionByUser(data[0].id),
        };

        const accessToken = await getAccessToken(obj);
        const refreshToken = await getRefreshToken({ user_id: data[0].id });

        await storeRefreshToken(data[0].id, refreshToken);

        const loginTime = new Date().toLocaleString();
        const userAgent = req.get('User-Agent') || 'Unknown';
        const clientIP = req.ip || req.connection.remoteAddress || 'Unknown';

        const alertMessage = `
🔐 <b>New Login Alert</b>

👤 <b>User:</b> ${data[0].username}
📧 <b>Email:</b> ${data[0].email || 'N/A'}
🎭 <b>Role:</b> ${data[0].role_name}
${data[0].is_super_admin ? '⭐ <b>Super Admin:</b> Yes' : ''}
🕐 <b>Login Time:</b> ${loginTime}
🌐 <b>IP Address:</b> ${clientIP}
📱 <b>Device:</b> ${userAgent.substring(0, 50)}...

✅ Login successful!
        `;

        sendTelegramMessagenewLogin(alertMessage).catch(err => {
          console.error("Failed to send Telegram alert:", err.message);
        });

        res.json({
          message: "Login success",
          ...obj,
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    }
  } catch (error) {
    logError("auth.login", error, res);
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({
        message: "Refresh token is required",
        error: { name: "MissingRefreshToken" }
      });
    }

    // Verify refresh token
    jwt.verify(refresh_token, config.config.token.refresh_token_key, async (error, decoded) => {
      if (error) {
        return res.status(401).json({
          message: "Invalid refresh token",
          error: { name: "InvalidRefreshToken", details: error.message }
        });
      }

      const userId = decoded.user_id;

      try {
        // Check if refresh token exists in database and is valid
        const isValidToken = await validateRefreshToken(userId, refresh_token);
        if (!isValidToken) {
          return res.status(401).json({
            message: "Invalid or expired refresh token",
            error: { name: "TokenExpiredError" }
          });
        }

        // Get user data
        let sql =
          "SELECT " +
          " u.*," +
          " r.name as role_name" +
          " FROM user u " +
          " INNER JOIN role r ON u.role_id = r.id " +
          " WHERE u.id = :userId ";

        let [userData] = await db.query(sql, { userId });

        if (userData.length === 0) {
          return res.status(404).json({
            message: "User not found",
            error: { name: "UserNotFound" }
          });
        }

        delete userData[0].password;
        let obj = {
          profile: userData[0],
          permission: await getPermissionByUser(userData[0].id),
        };

        // Generate new access token
        const newAccessToken = await getAccessToken(obj);

        // Generate new refresh token (token rotation for security)
        const newRefreshToken = await getRefreshToken({ user_id: userId });
        await updateRefreshToken(userId, refresh_token, newRefreshToken);

        res.json({
          message: "Token refreshed successfully",
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        });

      } catch (dbError) {
        console.error("Database error during token refresh:", dbError);
        return res.status(500).json({
          message: "Internal server error",
          error: { name: "DatabaseError" }
        });
      }
    });
  } catch (error) {
    logError("auth.refreshToken", error, res);
  }
};


exports.logout = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    const userId = req.auth?.id; // From token validation middleware

    if (refresh_token) {
      await revokeRefreshToken(userId, refresh_token);
    }

    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    logError("auth.logout", error, res);
  }
};




exports.profile = async (req, res) => {
  try {
    const { id: user_id, plan, company_id } = req.auth;

    // 1. Fetch local permissions if user exists, otherwise grant 'owner' permissions
    let permissions = [];
    try {
      const perms = await getPermissionByUser(user_id);
      permissions = perms.map(p => p.name);
    } catch (err) {
      console.warn("Failed to fetch local permissions for SSO user:", err.message);
    }

    // Default permissions for owner if none found
    if (permissions.length === 0) {
      // In a multi-tenant SaaS, the owner usually gets access to everything
      // Here we can also restrict based on the 'plan'
      const isPro = plan?.toLowerCase().includes("pro");
      const isEnterprise = plan?.toLowerCase().includes("enterprise");

      permissions = ["dashboard", "pos", "report", "setting"];
      if (isPro || isEnterprise) {
        permissions.push("inventory", "expense", "stock");
      }
      if (isEnterprise) {
        permissions.push("wholesale", "analytics", "multi_branch");
      }
    }

    res.json({
      profile: {
        ...req.auth,
        role: "Owner",
        plan: plan || "Starter"
      },
      permission: permissions
    });
  } catch (error) {
    logError("auth.profile", error, res);
  }
};

exports.validate_token = (permission_name) => {
  return async (req, res, next) => {
    const authorization = req.headers.authorization;
    let token_from_client = null;

    if (authorization && authorization.startsWith("Bearer ")) {
      token_from_client = authorization.slice(7);
    }

    if (!token_from_client) {
      return res.status(401).json({
        message: "Unauthorized - No token provided",
        error: { name: "NoTokenProvided" },
      });
    }

    try {
      // 1. Verify Platform JWT (Passport)
      const decoded = jwt.verify(
        token_from_client,
        config.config.token.access_token_key
      );

      // Expected payload: { user_id, company_id, system_code, role }
      const { user_id, company_id, system_code } = decoded;

      // 2. Validate it belongs to this System
      const validSystemCodes = ["COFFEE", "coffee_system"];
      console.log("SSO Validation - Decoded System Code:", system_code);
      if (!validSystemCodes.includes(system_code)) {
        console.warn(`SSO Blocked: System Code mismatch. Expected one of [${validSystemCodes}], got '${system_code}'`);
        return res.status(403).json({ message: "Invalid system authorization" });
      }

      // 3. SECURE CHECK: Verify subscription status with the Platform (The Brain)
      try {
        const platformStatusUrl = `${config.config.platform_api_url}/subscriptions/status`;
        const platformRes = await axios.get(platformStatusUrl, {
          headers: { Authorization: `Bearer ${token_from_client}` }
        });

        console.log("Platform Status Response:", platformRes.data);

        if (!platformRes.data.active) {
          return res.status(403).json({
            message: "Subscription Inactive/Expired",
            renew_url: config.config.platform_hub_url + "/dashboard",
            error: "SUBSCRIPTION_REQUIRED"
          });
        }
      } catch (err) {
        console.error("Platform Subscription Check Failed:", err.message);
        return res.status(503).json({ message: "Identity Service Unavailable" });
      }

      // 4. Multi-Tenant Context Injection
      req.current_id = user_id;
      req.company_id = company_id;
      req.auth = {
        ...decoded,
        id: user_id,
        plan: platformRes.data.plan,
        name: decoded.name || 'User ' + user_id // Ensure name exists for logging
      };

      // Mock permission to bypass old checks while keeping business logic working
      req.permission = [{ name: permission_name }];

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Session expired",
          error: { name: "TokenExpiredError" },
        });
      }
      return res.status(401).json({
        message: "Invalid identity token",
        error: { name: "InvalidToken", details: error.message },
      });
    }
  };
};

const getRefreshToken = async (userData) => {
  const refresh_token = await jwt.sign(
    userData,
    config.config.token.refresh_token_key,
    {
      expiresIn: "7d", // Refresh token expires in 7 days
    }
  );
  return refresh_token;
};


const getPermissionByUser = async (user_id) => {
  let sql =
    "   SELECT  " +
    " DISTINCT " +
    " p.id, " +
    " p.name, " +
    " p.group, " +
    " p.is_menu_web, " +
    " p.web_route_key " +
    " FROM permissions  p " +
    " INNER JOIN permission_roles pr ON p.id = pr.permission_id " +
    " INNER JOIN `role` r ON pr.role_id = r.id " +
    " INNER JOIN user_roles ur ON r.id = ur.role_id " +
    " WHERE ur.user_id = :user_id; "

  const [permission] = await db.query(sql, { user_id })
  return permission;
};

const getAccessToken = async (paramData) => {
  const access_token = await jwt.sign(
    { data: paramData },
    config.config.token.access_token_key,
    {
      expiresIn: "7d",
    }
  );
  return access_token;
};


const storeRefreshToken = async (userId, refreshToken) => {
  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now



    const sql = `
      INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
      VALUES (:user_id, :token, :expires_at, :created_at)
      ON DUPLICATE KEY UPDATE
      token = :token,
      expires_at = :expires_at,
      created_at = :created_at
    `;

    await db.query(sql, {
      user_id: userId,
      token: refreshToken,
      expires_at: expiresAt,
      created_at: new Date(),
    });
  } catch (error) {
    console.error("Error storing refresh token:", error);
    throw error;
  }
};


const validateRefreshToken = async (userId, refreshToken) => {
  try {
    const sql = `
      SELECT id FROM refresh_tokens 
      WHERE user_id = :user_id AND token = :token AND expires_at > NOW() AND is_revoked = 0
    `;

    const [result] = await db.query(sql, {
      user_id: userId,
      token: refreshToken,
    });

    return result.length > 0;
  } catch (error) {
    console.error("Error validating refresh token:", error);
    return false;
  }
};

const updateRefreshToken = async (userId, oldToken, newToken) => {
  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const sql = `
      UPDATE refresh_tokens 
      SET token = :new_token, expires_at = :expires_at, created_at = :created_at
      WHERE user_id = :user_id AND token = :old_token
    `;

    await db.query(sql, {
      user_id: userId,
      old_token: oldToken,
      new_token: newToken,
      expires_at: expiresAt,
      created_at: new Date(),
    });
  } catch (error) {
    console.error("Error updating refresh token:", error);
    throw error;
  }
};

const revokeRefreshToken = async (userId, refreshToken) => {
  try {
    const sql = `
      UPDATE refresh_tokens 
      SET is_revoked = 1 
      WHERE user_id = :user_id AND token = :token
    `;

    await db.query(sql, {
      user_id: userId,
      token: refreshToken,
    });
  } catch (error) {
    console.error("Error revoking refresh token:", error);
    throw error;
  }
};



exports.updateUserProfile = async (req, res) => {
  try {
    const { username, password, address, tel } = req.body;
    const userId = req.user.id; // Assuming user ID is available in the request

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10); // Hash the new password
    }

    // Update the user's profile in the database
    const sql = `
      UPDATE user SET
        username = :username,
        ${password ? "password = :password," : ""}
        address = :address,
        tel = :tel
      WHERE id = :userId
    `;

    await db.query(sql, {
      username,
      password: hashedPassword,
      address,
      tel,
      userId,
    });

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};




exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in the request

    // Fetch the user's profile from the database
    const sql = `
      SELECT id, username, address, tel, profile_image 
      FROM user 
      WHERE id = :userId
    `;
    const [user] = await db.query(sql, { userId });

    if (!user[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ profile: user[0] });
  } catch (error) {
    console.error("Error retrieving profile:", error);
    res.status(500).json({ message: "Failed to retrieve profile" });
  }
};