import React, { forwardRef } from "react";
import dayjs from "dayjs";

const PrintShiftReport = forwardRef((props, ref) => {
    const { 
        summary = {}, 
        profile = {}, 
        filter = {}, 
        staff_name = "N/A",
        actual_cash = 0,
        actual_cash_khr = 0,
        opening_cash = 0,
        opening_cash_khr = 0,
        exchange_rate = 4000,
    } = props;

    const formatUSD = (value) => {
        const number = parseFloat(value) || 0;
        return number.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatKHR = (value) => {
        const number = parseFloat(value) || 0;
        return number.toLocaleString('en-US', {
            maximumFractionDigits: 0
        });
    };

    const safeSummary = summary || {};
    const opening_total_usd = Number(opening_cash) + (Number(opening_cash_khr) / exchange_rate);
    const actual_total_usd = Number(actual_cash) + (Number(actual_cash_khr) / exchange_rate);
    const expected_total_usd = Number(safeSummary.expected_cash_usd || 0);
    const variance = actual_total_usd - expected_total_usd;
    
    const isSafe = Math.abs(variance) < 0.01;
    const isOver = variance >= 0.01;
    const statusLabel = isSafe ? "BALANCED" : (isOver ? "CASH OVER" : "CASH SHORTAGE");

    return (
        <div ref={ref} className="print-shift-report-wrapper" style={{ width: '80mm', color: '#000', margin: '0 auto', backgroundColor: '#fff', fontFamily: "'Inter', 'Battambang', sans-serif" }}>
            <div style={{
                width: '74mm',
                margin: '0 auto',
                padding: '6mm 1mm',
                lineHeight: '1.4',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', marginBottom: '2px', letterSpacing: '1px' }}>
                        X-REPORT (SHIFT)
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#333' }}>
                        {profile?.business_name || "COFFEE SHOP"}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.7 }}>
                        {profile?.branch_name || "Main Branch"}
                    </div>
                </div>

                <div style={{ borderTop: '1pt solid #000', margin: '10px 0' }}></div>

                {/* Info Section */}
                <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>STAFF:</span>
                        <span style={{ fontWeight: '800' }}>{staff_name.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>SHIFT START:</span>
                        <span>{dayjs(filter.from_date).format("DD/MM/YYYY HH:mm")}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>REPORT TIME:</span>
                        <span>{dayjs().format("DD/MM/YYYY HH:mm")}</span>
                    </div>
                </div>

                <div style={{ borderTop: '0.5pt dashed #000', margin: '10px 0' }}></div>

                {/* Sales Summary */}
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontWeight: '900', fontSize: '13px', marginBottom: '6px', borderBottom: '0.5pt solid #000', display: 'inline-block' }}>FINANCIAL SUMMARY</div>
                    <div style={{ fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Gross Sales:</span>
                            <span>${formatUSD(safeSummary.total_sales_usd)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                            <span>Total Discount:</span>
                            <span>-${formatUSD(safeSummary.total_discount_usd || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', marginTop: '4px', paddingTop: '4px', borderTop: '0.5pt solid #eee' }}>
                            <span>NET SALES:</span>
                            <span>${formatUSD(Number(safeSummary.total_sales_usd || 0) - Number(safeSummary.total_discount_usd || 0))}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontStyle: 'italic' }}>
                            <span>Total Expenses:</span>
                            <span>-${formatUSD(safeSummary.total_expense_usd)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Breakdown */}
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontWeight: '900', fontSize: '13px', marginBottom: '6px', borderBottom: '0.5pt solid #000', display: 'inline-block' }}>PAYMENT BREAKDOWN</div>
                    <div style={{ fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>CASH (USD/KHR):</span>
                            <span>${formatUSD(safeSummary.total_cash_usd)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>KHQR (ABA/WING):</span>
                            <span>${formatUSD(Number(safeSummary.total_aba_usd || 0) + Number(safeSummary.total_wing_usd || 0))}</span>
                        </div>
                    </div>
                </div>

                {/* Reconciliation Section */}
                <div style={{ 
                    marginBottom: '20px', 
                    padding: '10px', 
                    background: '#f9f9f9', 
                    border: '1pt solid #000',
                    borderRadius: '4px'
                }}>
                    <div style={{ fontWeight: '900', fontSize: '14px', marginBottom: '8px', textAlign: 'center', textDecoration: 'underline' }}>CASH RECONCILIATION</div>
                    <div style={{ fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Opening Cash:</span>
                            <span style={{ fontWeight: 600 }}>${formatUSD(opening_total_usd)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>(+) Cash Sales:</span>
                            <span>${formatUSD(safeSummary.total_cash_usd)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                            <span>(-) Expenses:</span>
                            <span>-${formatUSD(safeSummary.total_expense_usd)}</span>
                        </div>
                        <div style={{ borderTop: '0.5pt dashed #999', margin: '6px 0' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                            <span>EXPECTED CASH:</span>
                            <span>${formatUSD(expected_total_usd)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', marginTop: '4px' }}>
                            <span>ACTUAL COUNTED:</span>
                            <span>${formatUSD(actual_total_usd)}</span>
                        </div>
                        
                        <div style={{ 
                            marginTop: '10px', 
                            padding: '8px', 
                            background: isSafe ? '#f0fdf4' : (isOver ? '#f0f9ff' : '#fef2f2'),
                            textAlign: 'center',
                            border: '0.5pt solid #000'
                        }}>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#555' }}>VARIANCE STATUS</div>
                            <div style={{ fontSize: '16px', fontWeight: '900' }}>
                                {variance > 0 ? '+' : ''}{formatUSD(variance)} $
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: '800' }}>{statusLabel}</div>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', textAlign: 'center' }}>
                    <div style={{ width: '45%' }}>
                        <div style={{ borderBottom: '0.5pt solid #000', marginBottom: '5px' }}></div>
                        <div style={{ fontSize: '10px', fontWeight: 'bold' }}>CASHIER</div>
                    </div>
                    <div style={{ width: '45%' }}>
                        <div style={{ borderBottom: '0.5pt solid #000', marginBottom: '5px' }}></div>
                        <div style={{ fontSize: '10px', fontWeight: 'bold' }}>MANAGER</div>
                    </div>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '9px', fontStyle: 'italic', opacity: 0.6 }}>
                    * This is a temporary Shift Report (X-Report) for audit purposes.
                </div>
            </div>
        </div>
    );
});

export default PrintShiftReport;
