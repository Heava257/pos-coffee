import React from "react";
import logo from "../../assets/CAMPTN.png";
import "./fonts.css";
import { getProfile } from "../../store/profile.store";
import { formatDateClient } from "../../util/helper";

const PrintInvoice = React.forwardRef((props, ref) => {
  const profile = getProfile();
  const {
    objSummary = {
      sub_total: 0,
      total_qty: 0,
      save_discount: 0,
      tax: 10,
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
  } = props;

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

const calculateItemTotal = (item) => {
  return Number(item.totalPrice) || 0;
};

const calculateGrandTotal = () => {
  return cart_list.reduce((sum, item) => sum + calculateItemTotal(item), 0);
};




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
        {/* <img
          src={logo}
          alt="Logo"
          style={{
            width: '60px',
            height: '60px',
            objectFit: 'contain',
            marginBottom: '8px'
          }}
        /> */}
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
          COFFEE SHOP
        </div>
        <div style={{ fontSize: '11px' }}>
          {profile?.address || "123 Street, City"}
        </div>
        <div style={{ fontSize: '11px' }}>
          Tel: {profile?.tel || "+855 67 733 335"}
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
                <span style={{ flex: 1 }}>
                  {item.category_name || item.name}
                </span>
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
                    {item.cart_qty} x ${formatNumber(item.unit_price)}
                    {item.unit && ` (${item.unit})`}
                  </span>
                  {hasDiscount && (
                    <span style={{ color: '#0066cc' }}>
                      -{item.discount}%
                    </span>
                  )}
                </div>
                
                {/* Customizations */}
                {(item.mood || item.size || item.sugar || item.ice) && (
                  <div style={{ fontSize: '9px', color: '#888' }}>
                    {item.mood && `${item.mood} `}
                    {item.size && `Size:${item.size} `}
                    {item.sugar && `Sugar:${item.sugar} `}
                    {item.ice && `Ice:${item.ice}`}
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
          <span>${formatNumber(calculateGrandTotal())}</span>
        </div>
        
        {objSummary.save_discount > 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            color: '#0066cc'
          }}>
            <span>Discount:</span>
            <span>-${formatNumber(objSummary.save_discount)}</span>
          </div>
        )}
        
        {objSummary.tax > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tax:</span>
            <span>${formatNumber(objSummary.tax)}</span>
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
            <span>${formatNumber(calculateGrandTotal() + (objSummary.tax || 0) - (objSummary.save_discount || 0))}</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      {objSummary.payment_method && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment:</span>
            <span>{objSummary.payment_method}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Paid:</span>
            <span>${formatNumber(objSummary.total_paid || calculateGrandTotal())}</span>
          </div>
          {objSummary.total_paid > calculateGrandTotal() && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Change:</span>
              <span>${formatNumber(objSummary.total_paid - calculateGrandTotal())}</span>
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
          Thank you for your visit!
        </div>
        <div style={{ marginBottom: '5px' }}>
          សូមអរគុណសម្រាប់ការមកទិញ!
        </div>
        <div style={{ marginBottom: '5px' }}>
          Items: {objSummary.total_qty || cart_list.length}
        </div>
        <div>
          Support: +855 67 733 335
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