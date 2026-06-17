import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { request } from "@/shared/utils/helper";
import { Spin, Card, Typography, Divider, Row, Col, Tag } from "antd";
import { ShoppingBag, Calendar, CreditCard, User, MapPin, CheckCircle2 } from "lucide-react";

const { Title, Text } = Typography;

const COLORS = {
  darkGreen: "#1e4a2d",
  gold: "#c0a060",
  bgLight: "#f8fafc",
};

const DigitalReceiptPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const res = await request(`order-web/${id}`, "get");
      if (res && res.success) {
        setOrder(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bgLight }}>
        <Spin size="large" tip="Loading Receipt..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Title level={4}>Receipt Not Found</Title>
        <Text type="secondary">Sorry, we couldn't find the receipt you're looking for.</Text>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bgLight, padding: '20px 15px' }}>
      <div style={{ maxWidth: 450, margin: '0 auto' }}>
        
        {/* Success Header */}
        <div style={{ textAlign: 'center', marginBottom: 25 }}>
          <div style={{ 
            background: '#fff', 
            width: 70, height: 70, 
            borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 15px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
          }}>
            <CheckCircle2 size={40} color={COLORS.darkGreen} />
          </div>
          <Title level={3} style={{ margin: 0, fontWeight: 800, color: COLORS.darkGreen }}>Payment Successful!</Title>
          <Text type="secondary">Thank you for your visit</Text>
        </div>

        {/* Receipt Card */}
        <Card style={{ borderRadius: 24, boxShadow: '0 15px 35px rgba(0,0,0,0.05)', border: 'none', overflow: 'hidden' }}>
          {/* Shop Info */}
          <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
            <Title level={4} style={{ margin: 0, color: COLORS.darkGreen }}>{order.branch_name}</Title>
            <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 5 }}>
              <MapPin size={12} /> {order.address || "Main Street, Phnom Penh"}
            </div>
          </div>

          <Divider style={{ margin: '0 0 20px 0' }} />

          {/* Order Meta */}
          <Row gutter={[0, 15]}>
            <Col span={12}>
              <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Order ID</div>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>#{order.order_no || order.id}</div>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Date</div>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>{new Date(order.created_at).toLocaleString()}</div>
            </Col>
          </Row>

          <div style={{ background: '#f1f5f9', padding: 15, borderRadius: 16, margin: '20px 0' }}>
             {order.items?.map((item, idx) => (
               <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: idx === order.items.length - 1 ? 0 : 12 }}>
                 <div style={{ flex: 1 }}>
                   <div style={{ fontWeight: 700, fontSize: 14 }}>{item.product_name} x {item.qty}</div>
                   <div style={{ fontSize: 11, color: '#64748b' }}>{item.size} {item.mood ? `(${item.mood})` : ''}</div>
                 </div>
                 <div style={{ fontWeight: 700 }}>${(item.qty * item.price).toFixed(2)}</div>
               </div>
             ))}
          </div>

          {/* Summary */}
          <div style={{ padding: '0 5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">Subtotal</Text>
              <Text strong>${Number(order.sub_total || 0).toFixed(2)}</Text>
            </div>
            {order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">Discount</Text>
                <Text strong style={{ color: '#ef4444' }}>-${Number(order.discount || 0).toFixed(2)}</Text>
              </div>
            )}
            <Divider style={{ margin: '15px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>Total</Title>
              <Title level={3} style={{ margin: 0, color: COLORS.darkGreen, fontWeight: 900 }}>
                ${Number(order.total_amount || 0).toFixed(2)}
              </Title>
            </div>
            <div style={{ textAlign: 'right', marginTop: 2, fontSize: 12, color: COLORS.gold, fontWeight: 700 }}>
              ៛ {(Number(order.total_amount || 0) * 4100).toLocaleString()} KHR
            </div>
          </div>

          {/* Payment Info */}
          <div style={{ marginTop: 25, padding: 15, background: COLORS.darkGreen, borderRadius: 16, color: '#fff' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
               <CreditCard size={18} />
               <div style={{ flex: 1 }}>
                 <div style={{ fontSize: 10, opacity: 0.7 }}>PAYMENT METHOD</div>
                 <div style={{ fontWeight: 700 }}>{order.payment_method}</div>
               </div>
               <Tag color="success" style={{ borderRadius: 8, border: 'none' }}>PAID</Tag>
             </div>
          </div>
        </Card>

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: 30, paddingBottom: 20 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            This is a digital receipt from {order.branch_name}.<br/>
            Save this page for your records.
          </Text>
          <div style={{ marginTop: 15, opacity: 0.5 }}>
             <ShoppingBag size={20} style={{ margin: '0 auto' }} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default DigitalReceiptPage;
