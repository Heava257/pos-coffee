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
        total_expense_usd = 0,
        remark = ""
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
    const expected_total_usd = opening_total_usd + Number(safeSummary.total_cash_usd || 0) - (Number(total_expense_usd) || 0);
    const diff = actual_total_usd - expected_total_usd;

    return (
        <div ref={ref} className="print-shift-report-wrapper" style={{ width: '80mm', color: '#000', margin: '0 auto', backgroundColor: '#fff', fontFamily: "'Inter', 'Battambang', sans-serif" }}>
            <div style={{
                width: '74mm',
                margin: '0 auto',
                padding: '4mm 1mm',
                lineHeight: '1.3',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '4px', textTransform: 'uppercase' }}>
                        SHIFT REPORT
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {profile?.business_name || "COFFEE SHOP"}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>
                        {profile?.branch_name || "Main Branch"}
                    </div>
                </div>

                <div style={{ borderTop: '0.5pt solid #000', margin: '8px 0' }}></div>

                {/* Info Section */}
                <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>STAFF:</span>
                        <span style={{ fontWeight: 'bold' }}>{staff_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>DATE:</span>
                        <span>{dayjs(filter.from_date).format("DD MMM YYYY")}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>PRINT TIME:</span>
                        <span>{dayjs().format("HH:mm:ss")}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>RATE:</span>
                        <span>1$ = {exchange_rate}៛</span>
                    </div>
                </div>

                <div style={{ borderTop: '0.5pt solid #000', margin: '8px 0' }}></div>

                {/* Sales Summary */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: '900', fontSize: '13px', marginBottom: '4px' }}>SALES SUMMARY:</div>
                    <div style={{ fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', marginTop: '2px' }}>
                            <span>GROSS SALES:</span>
                            <span>${formatUSD(safeSummary.total_sales_usd)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#000', fontStyle: 'italic' }}>
                            <span>Total Expense:</span>
                            <span>-${formatUSD(safeSummary.total_expense_usd)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', marginTop: '4px', fontSize: '15px', borderTop: '0.5pt solid #000', paddingTop: '4px' }}>
                            <span>NET PROFIT:</span>
                            <span>${formatUSD(Number(safeSummary.total_sales_usd || 0) - Number(safeSummary.total_expense_usd || 0))}</span>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '0.5pt dashed #000', margin: '8px 0' }}></div>

                {/* Payment Methods */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: '900', fontSize: '13px', marginBottom: '4px' }}>PAYMENT METHODS:</div>
                    <div style={{ fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>CASH ($):</span>
                            <span>${formatUSD(safeSummary.total_cash_usd)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>ABA (QR):</span>
                            <span>${formatUSD(safeSummary.total_aba_usd)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>WING/OTHER:</span>
                            <span>${formatUSD(safeSummary.total_wing_usd)}</span>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '0.5pt solid #000', margin: '8px 0' }}></div>

                {/* Reconciliation */}
                <div style={{ marginBottom: '12px', border: '0.5pt solid #000', padding: '6px' }}>
                    <div style={{ fontWeight: '900', fontSize: '13px', marginBottom: '6px', textAlign: 'center' }}>RECONCILIATION</div>
                    <div style={{ fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Opening Cash:</span>
                            <span>${formatUSD(opening_cash)} | {formatKHR(opening_cash_khr)}៛</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Expected Cash ($):</span>
                            <span>${formatUSD(safeSummary.expected_cash_usd)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Expected Cash (៛):</span>
                            <span>{formatKHR(safeSummary.expected_cash_khr)}៛</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                            <span>Total Expenses:</span>
                            <span>-${formatUSD(safeSummary.total_expense_usd)}</span>
                        </div>
                        <div style={{ borderTop: '0.5pt dashed #000', margin: '4px 0' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '2px' }}>
                            <span>Actual Cash:</span>
                            <span>${formatUSD(actual_cash)} | {formatKHR(actual_cash_khr)}៛</span>
                        </div>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontWeight: '900',
                            fontSize: '14px',
                            marginTop: '4px',
                            borderTop: '0.5pt solid #000',
                            paddingTop: '2px'
                        }}>
                            <span>DIFFERENCE:</span>
                            <span>${formatUSD(diff)}</span>
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                {safeSummary.top_products && safeSummary.top_products.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontWeight: '900', fontSize: '11px', borderBottom: '0.5pt solid #ccc', marginBottom: '2px' }}>TOP SELLING ITEMS:</div>
                        {safeSummary.top_products.map((item, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                <span>{item.name}</span>
                                <span>{item.total_qty} qty</span>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <div style={{ borderTop: '0.5pt solid #000', width: '60%', margin: '0 auto' }}></div>
                    <div style={{ fontSize: '10px', marginTop: '5px' }}>Staff Signature</div>
                </div>

                <div style={{ marginTop: '40px', textAlign: 'center', paddingBottom: '20px' }}>
                    <div style={{ borderTop: '0.5pt solid #000', width: '60%', margin: '0 auto' }}></div>
                    <div style={{ fontSize: '10px', marginTop: '5px' }}>Manager Signature</div>
                </div>
            </div>
        </div>
    );
});

export default PrintShiftReport;
