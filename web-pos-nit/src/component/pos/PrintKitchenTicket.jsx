import React from "react";
import "./fonts.css";

const PrintKitchenTicket = React.forwardRef((props, ref) => {
  const {
    objSummary = {
      order_no: null,
      order_date: null,
      table_no: null,
      order_type: "take_away",
      remark: null,
    },
    cart_list = [],
  } = props;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div ref={ref} style={{
      width: '80mm', // Thermal printer width
      maxWidth: '300px',
      margin: '0 auto',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.4',
      color: '#000',
      backgroundColor: '#fff'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          ** KITCHEN TICKET **
        </div>
      </div>

      {/* Ticket Info */}
      <div style={{ marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Order #: {objSummary.order_no || 'N/A'}</span>
          <span>{formatDate(objSummary.order_date || new Date())}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '18px' }}>
          <span>Type: <span style={{ textTransform: 'uppercase', border: '1px solid #000', padding: '2px 4px' }}>{objSummary.order_type === 'dine_in' ? 'DINE IN' : 'TAKE AWAY'}</span></span>
          {objSummary.table_no && <span>Table: {objSummary.table_no}</span>}
        </div>
        {objSummary.remark && (
          <div style={{ marginTop: '8px', padding: '4px', border: '1px dashed #000' }}>
            Note: {objSummary.remark}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '2px dashed #000', margin: '10px 0' }}></div>

      {/* Items */}
      <div style={{ marginBottom: '15px' }}>
        {cart_list.map((item, index) => {
          return (
            <div key={index} style={{ marginBottom: '12px', borderBottom: '1px dotted #ccc', paddingBottom: '6px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-start', 
                fontSize: '18px', 
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>
                <span style={{ marginRight: '10px' }}>{item.cart_qty}x</span>
                <span>{item.name}</span>
              </div>

              {/* Customizations / Modifiers */}
              <div style={{ fontSize: '14px', paddingLeft: '25px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {item.mood && (
                  <div>• {item.mood === 'hot' ? 'HOT' : 'ICE'}</div>
                )}
                {item.size && (
                  <div>• Size: {item.size}</div>
                )}
                {item.sugar && (
                  <div>• Sugar: {item.sugar}</div>
                )}
                {item.addons_selected && item.addons_selected.length > 0 && (
                  <div>• Addon: {item.addons_selected.join(', ')}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* End */}
      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>
        --- END OF TICKET ---
      </div>
    </div>
  );
});

export default PrintKitchenTicket;
