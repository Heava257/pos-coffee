import React from "react";

const PrintKitchenTicket = ({
  objSummary = {
    order_no: null,
    order_date: null,
    table_no: null,
    order_type: "take_away",
    remark: null,
  },
  cart_list = [],
}) => {
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
    <div style={{
      width: '80mm', // Thermal printer width
      maxWidth: '300px',
      margin: '0 auto',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.2',
      color: '#000',
      backgroundColor: '#fff'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '3px solid #000', paddingBottom: '6px' }}>
        <div style={{ fontSize: '26px', fontWeight: '900', textTransform: 'uppercase' }}>
          ** KITCHEN **
        </div>
      </div>

      {/* Ticket Info */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {objSummary.order_no ? `Order: #${objSummary.order_no}` : '*** NEW TICKET ***'}
          </span>
          <span style={{ fontSize: '12px' }}>{formatDate(objSummary.order_date || new Date())}</span>
        </div>

        {/* Large Table/Type Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#000',
          color: '#fff',
          padding: '8px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <div style={{ fontSize: '22px', fontWeight: '900', textTransform: 'uppercase' }}>
            {objSummary.order_type === 'dine_in' ? 'DINE IN' : 'TAKE AWAY'}
          </div>
          {objSummary.table_no && (
            <div style={{ fontSize: '28px', fontWeight: '900' }}>
              TBL: {objSummary.table_no}
            </div>
          )}
        </div>

        {objSummary.customer_name && (
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>
            Guest: <strong>{objSummary.customer_name}</strong>
          </div>
        )}

        {objSummary.remark && (
          <div style={{ marginTop: '6px', padding: '6px', border: '2px solid #000', fontSize: '16px', fontWeight: 'bold' }}>
            !!! NOTE: {objSummary.remark}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '2px dashed #000', margin: '8px 0' }}></div>

      {/* Items List */}
      <div style={{ marginBottom: '15px' }}>
        {cart_list.map((item, index) => {
          return (
            <div key={index} style={{ 
              marginBottom: '10px', 
              borderBottom: '1px solid #eee', 
              paddingBottom: '8px' 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                fontSize: '20px', 
                fontWeight: 'bold',
                lineHeight: '1.1'
              }}>
                <span style={{ 
                  marginRight: '12px', 
                  fontSize: '24px', 
                  backgroundColor: '#eee', 
                  padding: '0 6px',
                  borderRadius: '4px'
                }}>{item.cart_qty}</span>
                <span style={{ flex: 1 }}>{item.name}</span>
              </div>

              {/* Modifiers (Very Important for Kitchen) */}
              <div style={{ 
                fontSize: '15px', 
                paddingLeft: '38px', 
                marginTop: '4px',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '2px',
                fontWeight: 'bold'
              }}>
                {item.mood && (
                  <div style={{ textTransform: 'uppercase' }}>→ {item.mood}</div>
                )}
                {item.size && (
                  <div>→ Size: {item.size}</div>
                )}
                {item.sugar && (
                  <div>→ Sugar: {item.sugar}</div>
                )}
                {item.note && (
                  <div style={{ color: '#666', borderLeft: '3px solid #ccc', paddingLeft: '5px', marginTop: '2px', fontSize: '13px' }}>
                    * {item.note}
                  </div>
                )}
                {item.kitchen_note && (
                  <div style={{ 
                    color: '#000', 
                    border: '2px solid #000', 
                    padding: '4px 6px', 
                    marginTop: '6px', 
                    fontSize: '18px', 
                    fontWeight: '900',
                    textAlign: 'center',
                    backgroundColor: '#f1f1f1'
                  }}>
                    !!! REMARK: {item.kitchen_note.toUpperCase()}
                  </div>
                )}
                {item.addons_selected && item.addons_selected.length > 0 && (
                  <div>+ {item.addons_selected.join(', ')}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '2px solid #000', paddingTop: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Total Items: {cart_list.reduce((sum, i) => sum + (Number(i.cart_qty) || 0), 0)}
        </div>
        <div style={{ fontSize: '10px', marginTop: '10px' }}>
          Printed at: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default PrintKitchenTicket;
