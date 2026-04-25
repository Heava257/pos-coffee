import React from 'react';
import dayjs from 'dayjs';

const PrintInvoice = ({
  cart_list = [],
  objSummary = {},
  branchInfo = {},
  layoutType = "coffee",
  exchangeRate = 4000
}) => {
  // Local helper to avoid import errors
  const formatNum = (num, decimals = 2) => {
    return Number(num || 0).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const subTotalUSD = Number(objSummary?.sub_total || 0);
  const totalUSD = Number(objSummary?.total || 0);
  const totalKHR = totalUSD * exchangeRate;
  const receivedUSD = Number(objSummary?.received_usd || 0);
  const receivedKHR = Number(objSummary?.received_khr || 0);
  const totalReceivedInUSD = receivedUSD + (receivedKHR / exchangeRate);
  const changeInUSD = totalReceivedInUSD - totalUSD;

  return (
    <div className="print-invoice-wrapper" style={{ width: '80mm', color: '#000', backgroundColor: '#fff', fontFamily: "'Inter', 'Battambang', sans-serif" }}>
      <div style={{
        width: '74mm',
        margin: '0 auto',
        padding: '4mm 0',
      }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '4mm' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1.2' }}>
            {branchInfo?.name || 'COFFEE SHOP'}
          </div>
          <div style={{ fontSize: '11px', marginTop: '1px' }}>{branchInfo?.address || 'Phnom Penh, Cambodia'}</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '1px' }}>{branchInfo?.phone || '012 345 678'}</div>
        </div>

        {/* Order Info */}
        <div style={{ fontSize: '11px', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '2px 0', marginBottom: '3mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>INV: #{objSummary?.order_no || '000'}</span>
            <span>{dayjs(objSummary?.order_date).format('DD/MM/YYYY HH:mm')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>CASHIER: {objSummary?.cashier_name || 'Staff'}</span>
            <span style={{ fontWeight: 'bold' }}>{objSummary?.order_type === 'dine_in' ? 'DINE-IN' : 'TAKE-AWAY'}</span>
          </div>
        </div>

        {/* Items Table Header */}
        <div style={{ display: 'flex', fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '1px' }}>
          <div style={{ flex: 1 }}>ITEM</div>
          <div style={{ width: '10mm', textAlign: 'center' }}>QTY</div>
          <div style={{ width: '18mm', textAlign: 'right' }}>TOTAL</div>
        </div>

        {/* Items List */}
        <div style={{ margin: '1mm 0' }}>
          {cart_list.map((item, index) => (
            <div key={index} style={{ marginBottom: '2mm' }}>
              <div style={{ display: 'flex', fontSize: '12px', fontWeight: 'bold' }}>
                <div style={{ flex: 1 }}>{item.product_name || item.name}</div>
                <div style={{ width: '10mm', textAlign: 'center' }}>{item.cart_qty}</div>
                <div style={{ width: '18mm', textAlign: 'right' }}>${formatNum(item.cart_qty * (item.unit_price || item.price))}</div>
              </div>
              <div style={{ fontSize: '10px', paddingLeft: '2mm', opacity: 0.8 }}>
                {item.size} {item.sugar && `• ${item.sugar} Sug`} {item.mood}
                {item.addons_selected?.map(a => ` +${a.name}`)}
              </div>
            </div>
          ))}
        </div>

        {/* Totals Section */}
        <div style={{ borderTop: '1px solid #000', paddingTop: '1mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>SUBTOTAL:</span>
            <span>${formatNum(subTotalUSD)}</span>
          </div>

          {objSummary?.save_discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#000' }}>
              <span>PROMOTION / DISCOUNT:</span>
              <span>-${formatNum(objSummary.save_discount)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '900', marginTop: '1px' }}>
            <span>TOTAL ($):</span>
            <span>${formatNum(totalUSD)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
            <span>TOTAL (៛):</span>
            <span>{formatNum(totalKHR, 0)} ៛</span>
          </div>
        </div>

        {/* Payment Details */}
        <div style={{ marginTop: '3mm', borderTop: '1px dashed #000', paddingTop: '1mm' }}>
          <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
            <span>METHOD: {objSummary?.payment_method || 'Cash'}</span>
          </div>
          {objSummary?.payment_method === 'Cash' && (
            <>
              <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                <span>RECEIVED ($):</span>
                <span>${formatNum(receivedUSD)}</span>
              </div>
              {receivedKHR > 0 && (
                <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>RECEIVED (៛):</span>
                  <span>{formatNum(receivedKHR, 0)} ៛</span>
                </div>
              )}
              <div style={{ fontSize: '14px', display: 'flex', justifyContent: 'space-between', fontWeight: '900', marginTop: '2px', borderTop: '1px dotted #000', paddingTop: '1px' }}>
                <span>CHANGE ($):</span>
                <span>${formatNum(changeInUSD)}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #000', margin: '4mm 0 2mm 0' }}></div>
        <div style={{ textAlign: 'center', fontSize: '12px' }}>
          <div style={{ fontWeight: 'bold' }}>THANK YOU! SEE YOU AGAIN!</div>
          <div style={{ fontSize: '11px', marginTop: '1px', opacity: 0.8 }}>សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត!</div>
        </div>
      </div>
    </div>
  );
};

export default PrintInvoice;