const PDFDocument = require("pdfkit");
const { db, logError } = require("../../src/util/helper");
const dayjs = require("dayjs");
const path = require("path");

// Helper to detect Khmer characters (Unicode range: U+1780 to U+17FF)
const hasKhmer = (str) => {
    if (!str) return false;
    return /[\u1780-\u17FF]/.test(str);
};

/**
 * GET /api/payment/invoice/:tran_id
 * Generate a PDF invoice for a successful payment
 */
exports.generateInvoice = async (req, res) => {
    try {
        const { tran_id } = req.params;
        const { business_id } = req;

        // 1. Fetch payment and plan details
        const sql = `
            SELECT p.*, sp.name as plan_name, sp.price as plan_price,
                   b.name as business_name, b.owner_name, b.email as business_email
            FROM payments p
            JOIN subscription_plans sp ON p.plan_id = sp.id
            JOIN businesses b ON p.business_id = b.id
            WHERE p.tran_id = ? AND p.business_id = ?
        `;
        const [rows] = await db.query(sql, [tran_id, business_id]);

        let data;
        if (rows.length > 0) {
            data = rows[0];
        } else {
            // Fallback: Check if there is a subscription with this tran_id or ID
            let subQuery = `
                SELECT s.id as subscription_id, s.tran_id, s.start_date as created_at, s.status,
                       sp.name as plan_name, sp.price as plan_price, sp.price as amount,
                       b.name as business_name, b.owner_name, b.email as business_email,
                       DATEDIFF(s.end_date, s.start_date) as duration_days
                FROM subscriptions s
                JOIN subscription_plans sp ON s.plan_id = sp.id
                JOIN businesses b ON s.business_id = b.id
                WHERE s.business_id = ?
            `;
            let queryParams = [business_id];
            
            if (tran_id && tran_id.startsWith("SUB-")) {
                const subId = tran_id.replace("SUB-", "");
                subQuery += " AND s.id = ?";
                queryParams.push(subId);
            } else if (tran_id) {
                subQuery += " AND (s.tran_id = ? OR s.id = ?)";
                queryParams.push(tran_id, tran_id);
            } else {
                return res.status(404).json({ success: false, message: "Transaction not found." });
            }
            
            const [subRows] = await db.query(subQuery, queryParams);
            if (!subRows.length) {
                return res.status(404).json({ success: false, message: "Transaction not found." });
            }
            data = subRows[0];
            // Ensure data has the expected fields
            data.amount = data.amount || "0.00";
            data.duration_days = data.duration_days || null;
            if (!data.tran_id) {
                data.tran_id = `SUB-${data.subscription_id}`;
            }
        }

        // 2. Setup PDF document
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        
        // Register Khmer Fonts (Google Noto Sans Khmer) to support Khmer unicode characters beautifully
        const regFontPath = path.join(__dirname, "../../fonts/NotoSansKhmer-Regular.ttf");
        const boldFontPath = path.join(__dirname, "../../fonts/NotoSansKhmer-Bold.ttf");
        doc.registerFont("KhmerRegular", regFontPath);
        doc.registerFont("KhmerBold", boldFontPath);
        doc.font("Helvetica"); // Set Helvetica as default font for standard English text

        const getFont = (text, isBold = false) => {
            return hasKhmer(text) 
                ? (isBold ? "KhmerBold" : "KhmerRegular") 
                : (isBold ? "Helvetica-Bold" : "Helvetica");
        };

        // Pipe to response
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Invoice-${data.tran_id}.pdf`);
        doc.pipe(res);

        // ─── Header Section ───────────────────────────────────────────
        // Redesigned to use platform branding "COFFEE POS PLATFORM"
        doc.font("Helvetica-Bold").fillColor("#1e4a2d").fontSize(22).text("COFFEE POS PLATFORM", 50, 50);
        doc.font("Helvetica").fillColor("#666").fontSize(9).text("Premium POS & Ecosystem", 50, 75);
        doc.fillColor("#999").text("Email: pongchiva257@gmail.com | Support: t.me/growme_support", 50, 90);

        doc.font("Helvetica-Bold").fillColor("#1e4a2d").fontSize(26).text("INVOICE", 400, 50, { align: "right" });
        doc.font("Helvetica").fillColor("#555").fontSize(10).text(`Tran ID: ${data.tran_id}`, 400, 80, { align: "right" });
        doc.text(`Date: ${dayjs(data.created_at).format("DD MMM YYYY")}`, 400, 95, { align: "right" });

        doc.strokeColor("#a4c9a8").lineWidth(1.5).moveTo(50, 115).lineTo(550, 115).stroke();

        // ─── Billing Details & Invoice Details Cards ──────────────────
        // Draw elegant light green rounded boxes for details
        const cardY = 135;
        const cardHeight = 90;
        
        // Left Card (Bill To)
        doc.fillColor("#f9fbf9").rect(50, cardY, 240, cardHeight).fill();
        doc.strokeColor("#e1eae2").lineWidth(1).rect(50, cardY, 240, cardHeight).stroke();
        
        doc.font("Helvetica-Bold").fillColor("#1e4a2d").fontSize(9).text("BILL TO:", 65, cardY + 12);
        const bizFont = getFont(data.business_name, true);
        doc.font(bizFont).fillColor("#1e4a2d").fontSize(12).text(data.business_name, 65, cardY + 27);
        
        const ownerFont = getFont(data.owner_name, false);
        doc.font("Helvetica").fillColor("#555").fontSize(9.5).text("Attn: ", 65, cardY + 47, { continued: true })
           .font(ownerFont).text(data.owner_name || "");
        doc.font("Helvetica").fillColor("#555").fontSize(9.5).text(data.business_email || "", 65, cardY + 62);

        // Right Card (Invoice Info)
        doc.fillColor("#f9fbf9").rect(310, cardY, 240, cardHeight).fill();
        doc.strokeColor("#e1eae2").lineWidth(1).rect(310, cardY, 240, cardHeight).stroke();
        
        doc.font("Helvetica-Bold").fillColor("#1e4a2d").fontSize(9).text("PAYMENT DETAILS:", 325, cardY + 12);
        
        // Status indicator
        const isPaid = data.status.toLowerCase() === 'active' || data.status.toLowerCase() === 'paid';
        const statusColor = isPaid ? "#2d6a3e" : "#d32f2f";
        doc.font("Helvetica").fillColor("#555").fontSize(9.5).text("Status: ", 325, cardY + 27, { continued: true })
           .font("Helvetica-Bold").fillColor(statusColor).text(data.status.toUpperCase());
        
        // Payment method based on Free / Paid
        const isFreePlan = parseFloat(data.amount || 0) === 0;
        const methodText = isFreePlan ? "Free Activation" : "PayWay ABA";
        doc.font("Helvetica").fillColor("#555").fontSize(9.5).text("Method: ", 325, cardY + 47, { continued: true })
           .font("Helvetica-Bold").text(methodText);
           
        // Plan Info
        const planNameFont = getFont(data.plan_name, false);
        doc.font("Helvetica").fillColor("#555").fontSize(9.5).text("Plan: ", 325, cardY + 62, { continued: true })
           .font(planNameFont).text(data.plan_name);

        // ─── Table Section ────────────────────────────────────────────
        const tableTop = 250;

        // Table Header
        doc.fillColor("#1e4a2d").rect(50, tableTop, 500, 26).fill();
        doc.font("Helvetica-Bold").fillColor("#ffffff").fontSize(9.5).text("DESCRIPTION", 65, tableTop + 8);
        doc.text("DURATION", 300, tableTop + 8);
        doc.text("AMOUNT", 450, tableTop + 8, { align: "right", width: 85 });

        // Table Row (Zebra styling or white background with border)
        doc.fillColor("#ffffff").rect(50, tableTop + 26, 500, 45).fill();
        doc.strokeColor("#e1eae2").lineWidth(1).rect(50, tableTop + 26, 500, 45).stroke();
        
        const rowY = tableTop + 42;
        // Description
        const descFont = getFont(data.plan_name, false);
        doc.font(descFont).fillColor("#333").fontSize(10.5).text(data.plan_name, 65, rowY, { continued: true })
           .font("Helvetica").text(" Subscription Plan");
           
        // Duration
        const durationText = data.duration_days ? `${data.duration_days} Days` : "30 Days";
        doc.font("Helvetica").fillColor("#333").fontSize(10).text(durationText, 300, rowY);
        
        // Amount
        doc.font("Helvetica-Bold").fillColor("#333").fontSize(11).text(`$${parseFloat(data.amount || 0).toFixed(2)}`, 450, rowY, { align: "right", width: 85 });

        // ─── Total Section ────────────────────────────────────────────
        const totalPos = tableTop + 95;
        doc.font("Helvetica-Bold").fillColor("#1e4a2d").fontSize(11.5).text("Total (USD):", 380, totalPos + 5);
        doc.font("Helvetica-Bold").fillColor("#1e4a2d").fontSize(22).text(`$${parseFloat(data.amount || 0).toFixed(2)}`, 450, totalPos - 5, { align: "right", width: 85 });

        // ─── Footer ───────────────────────────────────────────────────
        const footerPos = 750;
        doc.strokeColor("#e1eae2").lineWidth(1).moveTo(50, footerPos - 15).lineTo(550, footerPos - 15).stroke();
        doc.font("Helvetica").fillColor("#999").fontSize(9.5).text("Thank you for choosing Coffee POS Platform! This is a system-generated invoice.", 50, footerPos, { align: "center", width: 500 });

        doc.end();

    } catch (error) {
        logError("invoice.generateInvoice", error, res);
    }
};
