import React from "react";
import "./fonts.css";
import { getProfile } from "../../store/profile.store";
import { Config } from "../../util/config";

const PrintInvoice = React.forwardRef((props, ref) => {
  const profile = getProfile();
  const {
    objSummary = {
      sub_total: 0,
      total_qty: 0,
      save_discount: 0,
      tax: 0,
      total: 0,
      total_paid: 0,
      customer_id: null,
      user_id: null,
      payment_method: null,
      remark: null,
      order_no: null,
      order_date: null,
    },
    cart_list = [],
    layoutType = "retail", // industry type
    cashReceivedUSD = 0,
    cashReceivedKHR = 0,
    exchangeRate = 4000,
    branchInfo = null,
  } = props;

  const branchName = branchInfo?.branch_name || branchInfo?.name;
  const businessName = profile?.business_name || profile?.name;
  const displayBusinessName = branchName && businessName && branchName !== businessName 
    ? `${businessName} (${branchName})` 
    : (businessName || branchName || "COFFEE SHOP");

  const displayAddress = branchInfo?.address || profile?.address || profile?.business_address || "Phnom Penh, Cambodia";
  const displayPhone = branchInfo?.tel || branchInfo?.phone || profile?.tel || profile?.phone || profile?.phone_number || "0977296971";

  const calculateItemTotal = (item) => {
    const qty = Number(item.cart_qty) || 0;
    const price = Number(item.unit_price || item.price || 0);
    return qty * price;
  };

  const calculateGrandTotal = () => {
    return cart_list.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const grandTotal = calculateGrandTotal();
  const taxAmount = Number(objSummary.tax) || 0;
  const discountAmount = Number(objSummary.save_discount) || 0;
  const finalTotal = grandTotal + taxAmount - discountAmount;

  const formatNumber = (value) => {
    const number = parseFloat(value) || 0;
    return number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const businessLogo = (profile?.business_logo && profile.business_logo !== "null" && profile.business_logo !== "undefined")
    ? Config.getFullImagePath(profile.business_logo)
    : null;

  return (
    <div ref={ref} style={{
      width: '80mm', // Thermal printer width
      maxWidth: '300px',
      margin: '0 auto',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '12px',
      lineHeight: '1.4',
      color: '#000',
      backgroundColor: '#fff'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        {businessLogo && (
          <img
            src={businessLogo}
            alt="Business Logo"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'contain',
              marginBottom: '10px',
              borderRadius: '8px',
              filter: 'grayscale(100%) contrast(1.2)', // Thermal printer style
              display: 'block',
              margin: '0 auto 10px auto'
            }}
          />
        )}
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px', textTransform: 'uppercase' }}>
          {displayBusinessName}
        </div>
        <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
          {displayAddress}
        </div>
        <div style={{ fontSize: '11px', marginTop: '3px' }}>
          Tel: {displayPhone}
        </div>
      </div>

      {/* Divider */}
      <div style={{
        borderTop: '1px dashed #000',
        margin: '10px 0',
        height: '1px'
      }}></div>

      {/* Receipt Info */}
      <div style={{ marginBottom: '10px', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Receipt #:</span>
          <span>{objSummary.order_no || 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Date:</span>
          <span>{formatDate(objSummary.order_date)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Cashier:</span>
          <span>{objSummary.user_name || 'Staff'}</span>
        </div>
        {objSummary.customer_name && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Customer:</span>
            <span>{objSummary.customer_name}</span>
          </div>
        )}
        
        {/* Industry specific Header Info */}
        {layoutType === "pharmacy" && (
           <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
             <span>Industry:</span>
             <span>MEDICAL / វេជ្ជសាស្ត្រ</span>
           </div>
        )}
        {(layoutType === "restaurant" || layoutType === "coffee") && props.tableNo && (
           <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
             <span>Table / តុ:</span>
             <span>#{props.tableNo}</span>
           </div>
        )}
      </div>

      {/* Divider */}
      <div style={{
        borderTop: '1px dashed #000',
        margin: '10px 0',
        height: '1px'
      }}></div>

      {/* Items */}
      <div style={{ marginBottom: '10px' }}>
        {cart_list.map((item, index) => {
          const itemTotal = calculateItemTotal(item);
          const hasDiscount = Number(item.discount) > 0;

          return (
            <div key={index} style={{ marginBottom: '8px' }}>
              {/* Item name and quantity */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold'
              }}>
                <div style={{ flex: 1 }}>
                  <div>{item.name}</div>
                  {layoutType === "pharmacy" && (item.generic_name || item.strength) && (
                    <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#333', marginTop: '2px' }}>
                      {item.generic_name} {item.strength}
                    </div>
                  )}
                </div>
                <span>${formatNumber(itemTotal)}</span>
              </div>

              {/* Item details */}
              <div style={{
                fontSize: '10px',
                color: '#666',
                paddingLeft: '2px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {item.cart_qty} x ${formatNumber(item.unit_price || item.price)}
                    {item.unit && ` (${item.unit})`}
                  </span>
                  {hasDiscount && (
                    <span style={{ fontWeight: 'bold' }}>
                      -{item.discount}%
                    </span>
                  )}
                </div>

                {/* Pharmacy / Medical Details (Expiry) */}
                {layoutType === "pharmacy" && item.expiry_date && (
                  <div style={{ fontSize: '9px', fontStyle: 'italic', color: '#555' }}>
                    Exp: {formatDate(item.expiry_date).split(',')[0]}
                  </div>
                )}

                {/* Customizations */}
                {(item.mood || item.size || item.sugar || item.ice || item.note) && (
                  <div style={{ fontSize: '9px', color: '#888' }}>
                    {item.note && `[${item.note}] `}
                    {!item.note && item.mood && `${item.mood} `}
                    {!item.note && item.size && `${layoutType === 'pharmacy' ? 'Unit' : 'Size'}:${item.size} `}
                    {!item.note && item.sugar && `Sugar:${item.sugar} `}
                    {!item.note && item.ice && `Ice:${item.ice}`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{
        borderTop: '1px dashed #000',
        margin: '10px 0',
        height: '1px'
      }}></div>

      {/* Totals */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span>
          <span>${formatNumber(grandTotal)}</span>
        </div>

        {objSummary.save_discount > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 'bold'
          }}>
            <span>Discount:</span>
            <span>-${formatNumber(objSummary.save_discount)}</span>
          </div>
        )}

        {objSummary.tax > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tax:</span>
            <span>${formatNumber(taxAmount)}</span>
          </div>
        )}

        <div style={{
          borderTop: '1px solid #000',
          marginTop: '5px',
          paddingTop: '5px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            <span>TOTAL:</span>
            <span>${formatNumber(finalTotal)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      {objSummary.payment_method && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment / ចំនួ​នត្រូវបង់:</span>
            <span>${formatNumber(finalTotal)}</span>
          </div>
          
          {objSummary.payment_method === "Cash" && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Received / លុយទទួល:</span>
                <span>
                   {cashReceivedUSD > 0 && `$${formatNumber(cashReceivedUSD)}`}
                   {cashReceivedKHR > 0 && ` ${cashReceivedUSD > 0 ? '+' : ''}${cashReceivedKHR.toLocaleString()}៛`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', marginTop: '4px', paddingTop: '4px' }}>
                <span>Change / លុយអាប់:</span>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontWeight: 'bold' }}>${formatNumber(Math.max(0, (Number(cashReceivedUSD) + (Number(cashReceivedKHR) / exchangeRate)) - finalTotal))}</div>
                   <div style={{ fontSize: '10px' }}>{Math.max(0, Math.round(((Number(cashReceivedUSD) + (Number(cashReceivedKHR) / exchangeRate)) - finalTotal) * exchangeRate)).toLocaleString()} ៛</div>
                </div>
              </div>
            </>
          )}
          
          {objSummary.payment_method !== "Cash" && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Method:</span>
              <span>{objSummary.payment_method}</span>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div style={{
        borderTop: '1px dashed #000',
        margin: '10px 0',
        height: '1px'
      }}></div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        fontSize: '10px',
        marginBottom: '10px'
      }}>
        <div style={{ marginBottom: '5px' }}>
          {layoutType === 'pharmacy' ? 'Please follow the dosage strictly!' : 'Thank you for your visit!'}
        </div>
        <div style={{ marginBottom: '5px' }}>
          {layoutType === 'pharmacy' ? 'សូមប្រើប្រាស់ឱសថតាមវេជ្ជបញ្ជាឱ្យបានត្រឹមត្រូវ!' : 'សូមអរគុណសម្រាប់ការមកទិញ!'}
        </div>
        <div style={{ marginBottom: '5px' }}>
          Items: {objSummary.total_qty || cart_list.length}
        </div>
        <div>
          Support: {displayPhone}
        </div>
      </div>

      {/* QR Code placeholder or additional info */}
      <div style={{
        textAlign: 'center',
        fontSize: '9px',
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px dashed #000'
      }}>
        <div>Follow us on social media</div>
        <div>for deals and updates!</div>
      </div>

      {/* Bottom margin for clean cut */}
      <div style={{ height: '20px' }}></div>
    </div>
  );
});

export default PrintInvoice;