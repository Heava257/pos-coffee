import React, { forwardRef } from "react";
import dayjs from "dayjs";

const PrintZReport = forwardRef((props, ref) => {
    const { 
        data = {}, 
        profile = {}, 
        staff_name = "Manager",
        exchange_rate = 4000
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

    return (
        <div ref={ref} className="print-z-report-wrapper" style={{ width: '80mm', color: '#000', margin: '0 auto', backgroundColor: '#fff', fontFamily: "'Inter', 'Battambang', sans-serif" }}>
            <div style={{
                width: '74mm',
                margin: '0 auto',
                padding: '8mm 1mm',
                lineHeight: '1.4',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                    <div style={{ fontSize: '22px', fontWeight: '900', marginBottom: '2px', letterSpacing: '1.5px' }}>
                        Z-REPORT (DAILY)
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#666', marginBottom: '8px' }}>
                        END OF DAY SUMMARY
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '800' }}>
                        {profile?.business_name || "COFFEE SHOP"}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.7 }}>
                        {profile?.branch_name || "Main Branch"}
                    </div>
                </div>

                <div style={{ borderTop: '1.5pt solid #000', margin: '10px 0' }}></div>

                {/* Date/Time Info */}
                <div style={{ fontSize: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>REPORT DATE:</span>
                        <span style={{ fontWeight: '800' }}>{dayjs().format("DD/MM/YYYY")}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>PRINTED BY:</span>
                        <span>{staff_name.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>PRINT TIME:</span>
                        <span>{dayjs().format("HH:mm:ss")}</span>
                    </div>
                </div>

                <div style={{ borderTop: '0.5pt dashed #000', margin: '10px 0' }}></div>

                {/* Sales Totals */}
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontWeight: '900', fontSize: '13px', marginBottom: '6px', backgroundColor: '#eee', padding: '2px 5px' }}>DAILY SALES SUMMARY</div>
                    <div style={{ fontSize: '12px', padding: '0 5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Total Gross Sales:</span>
                            <span>${formatUSD(data.total_sale || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                            <span>Total Discounts:</span>
                            <span>-${formatUSD(data.total_discount || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '14px', marginTop: '6px', borderTop: '1pt solid #000', paddingTop: '4px' }}>
                            <span>NET DAILY SALES:</span>
                            <span>${formatUSD(Number(data.total_sale || 0) - Number(data.total_discount || 0))}</span>
                        </div>
                    </div>
                </div>

                {/* Financial Health */}
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontWeight: '900', fontSize: '13px', marginBottom: '6px', backgroundColor: '#eee', padding: '2px 5px' }}>FINANCIAL PERFORMANCE</div>
                    <div style={{ fontSize: '12px', padding: '0 5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Total Income:</span>
                            <span>${formatUSD(data.total_sale || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                            <span>Total Expenses:</span>
                            <span>-${formatUSD(data.total_expense || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '16px', marginTop: '6px', borderTop: '1pt double #000', paddingTop: '4px', color: '#1e4a2d' }}>
                            <span>DAILY PROFIT:</span>
                            <span>${formatUSD(Number(data.total_sale || 0) - Number(data.total_expense || 0))}</span>
                        </div>
                    </div>
                </div>

                {/* Operational Stats */}
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontWeight: '900', fontSize: '13px', marginBottom: '6px', backgroundColor: '#eee', padding: '2px 5px' }}>OPERATIONAL STATS</div>
                    <div style={{ fontSize: '12px', padding: '0 5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Total Orders:</span>
                            <span>{data.order_count || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Avg. Order Value:</span>
                            <span>${formatUSD((data.total_sale || 0) / (data.order_count || 1))}</span>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '0.5pt solid #000', margin: '15px 0' }}></div>

                {/* Audit Message */}
                <div style={{ textAlign: 'center', fontSize: '10px', padding: '0 10px', lineHeight: '1.2' }}>
                    This Z-Report signifies the closure of daily business operations. All data has been synchronized to the cloud and locked for auditing.
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', textAlign: 'center' }}>
                    <div style={{ width: '45%' }}>
                        <div style={{ borderBottom: '1pt solid #000', marginBottom: '5px' }}></div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>OWNER SIGNATURE</div>
                    </div>
                </div>

                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', opacity: 0.5 }}>
                        Powered by Antigravity POS System
                    </div>
                </div>
            </div>
        </div>
    );
});

export default PrintZReport;
