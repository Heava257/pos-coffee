const PDFDocument = require("pdfkit");
const { db, logError } = require("../util/helper");
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

        // Pipe to response
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Invoice-${data.tran_id}.pdf`);
        doc.pipe(res);

        // ─── Header Section ───────────────────────────────────────────
        doc.font("Helvetica-Bold").fillColor("#1e4a2d").fontSize(24).text("BORCELLE COFFEE", 50, 50, { align: "left" });
        doc.font("Helvetica").fillColor("#666").fontSize(10).text("Premium POS Ecosystem", 50, 80);

        doc.font("Helvetica-Bold").fillColor("#333").fontSize(20).text("INVOICE", 400, 50, { align: "right" });
        doc.font("Helvetica").fontSize(10).text(`Tran ID: ${data.tran_id}`, 400, 80, { align: "right" });
        doc.text(`Date: ${dayjs(data.created_at).format("DD MMM YYYY")}`, 400, 95, { align: "right" });

        doc.moveDown(2);
        doc.strokeColor("#eee").lineWidth(1).moveTo(50, 120).lineTo(550, 120).stroke();

        // ─── Billing Details ──────────────────────────────────────────
        doc.moveDown(1);
        doc.font("Helvetica-Bold").fillColor("#1e4a2d").fontSize(11).text("BILL TO:", 50, 140);
        
        // Use KhmerBold if business name contains Khmer, otherwise Helvetica-Bold
        const bizFont = hasKhmer(data.business_name) ? "KhmerBold" : "Helvetica-Bold";
        doc.font(bizFont).fillColor("#333").fontSize(14).text(data.business_name, 50, 155);
        
        // Use KhmerRegular for owner name if it contains Khmer, using continued text for "Attn: "
        if (hasKhmer(data.owner_name)) {
            doc.font("Helvetica").fontSize(10).text("Attn: ", 50, 175, { continued: true })
               .font("KhmerRegular").text(data.owner_name);
        } else {
            doc.font("Helvetica").fontSize(10).text(`Attn: ${data.owner_name || ""}`, 50, 175);
        }
        
        doc.font("Helvetica").text(data.business_email, 50, 190);

        // Sub Info section (right)
        doc.font("Helvetica-Bold").fillColor("#1e4a2d").fontSize(11).text("STATUS:", 400, 140, { align: "right" });
        doc.font("Helvetica-Bold").fillColor("#2d6a3e").fontSize(16).text(data.status.toUpperCase(), 400, 155, { align: "right" });
        doc.font("Helvetica").fillColor("#333").fontSize(10).text(`Method: PayWay ABA`, 400, 180, { align: "right" });

        // ─── Table Section ────────────────────────────────────────────
        doc.moveDown(3);
        const tableTop = 250;

        // Table Header
        doc.fillColor("#f4f1eb").rect(50, tableTop, 500, 30).fill();
        doc.font("Helvetica-Bold").fillColor("#1e4a2d").fontSize(10).text("DESCRIPTION", 70, tableTop + 10);
        doc.text("DURATION", 300, tableTop + 10);
        doc.text("AMOUNT", 480, tableTop + 10, { align: "right" });

        // Table Rows
        // Use KhmerRegular for plan name if it contains Khmer
        const planFont = hasKhmer(data.plan_name) ? "KhmerRegular" : "Helvetica";
        doc.font(planFont).fillColor("#333").fontSize(11).text(data.plan_name, 70, tableTop + 45, { continued: true })
           .font("Helvetica").text(" Subscription Plan");
           
        const durationText = data.duration_days ? `${data.duration_days} Days` : "Lifetime / No Expiry";
        doc.font("Helvetica").fontSize(10).text(durationText, 300, tableTop + 45);
        doc.fontSize(11).text(`$${parseFloat(data.amount || 0).toFixed(2)}`, 480, tableTop + 45, { align: "right" });

        doc.strokeColor("#eee").lineWidth(1).moveTo(50, tableTop + 70).lineTo(550, tableTop + 70).stroke();

        // ─── Total Section ────────────────────────────────────────────
        const totalPos = tableTop + 100;
        doc.font("Helvetica-Bold").fillColor("#1e4a2d").fontSize(12).text("Total (USD):", 380, totalPos);
        doc.fontSize(22).text(`$${parseFloat(data.amount || 0).toFixed(2)}`, 450, totalPos - 5, { align: "right" });

        // ─── Footer ───────────────────────────────────────────────────
        const footerPos = 750;
        doc.strokeColor("#eee").lineWidth(1).moveTo(50, footerPos - 20).lineTo(550, footerPos - 20).stroke();
        doc.font("Helvetica").fillColor("#999").fontSize(10).text("Thank you for your business! This is a system-generated invoice.", 50, footerPos, { align: "center", width: 500 });

        doc.end();

    } catch (error) {
        logError("invoice.generateInvoice", error, res);
    }
};
