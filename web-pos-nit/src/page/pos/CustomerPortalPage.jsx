import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { request } from "../../util/helper";
import { Spin, Card, Typography, Divider, Row, Col, Tag, Progress, List, Avatar } from "antd";
import { Wallet, Star, Trophy, Clock, ChevronRight, Award, Coffee, User } from "lucide-react";

const { Title, Text } = Typography;

const COLORS = {
  darkGreen: "#1e4a2d",
  midGreen: "#2d6a42",
  gold: "#c0a060",
  bgLight: "#f8fafc",
  white: "#ffffff"
};

const CustomerPortalPage = () => {
  const { id } = useParams(); // Can be card_number or ID
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchMemberData();
  }, [id]);

  const fetchMemberData = async () => {
    try {
      const res = await request(`customer/detail/${id}`, "get");
      if (res && res.success) {
        const customerData = res.data;
        setMember(customerData);
        
        // Fetch recent orders for this customer (using public history route)
        const orderRes = await request(`order-web/customer/${customerData.id}?limit=5`, "get");
        if (orderRes && orderRes.success) {
          setOrders(orderRes.list || []);
        }
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
        <Spin size="large" tip="Brewing your dashboard..." />
      </div>
    );
  }

  if (!member) {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: COLORS.bgLight, minHeight: '100vh' }}>
        <Title level={4}>Member Not Found</Title>
        <Text type="secondary">Please check your card number or phone and try again.</Text>
      </div>
    );
  }

  const getTierColor = (tier) => {
    if (tier?.toLowerCase().includes('gold')) return COLORS.gold;
    if (tier?.toLowerCase().includes('green')) return COLORS.midGreen;
    return '#64748b';
  };

  const nextTierPoints = 150; // Example target
  const progressPercent = Math.min((member.points / nextTierPoints) * 100, 100);

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bgLight }}>
      {/* Header Profile Section */}
      <div style={{ 
        background: `linear-gradient(135deg, ${COLORS.darkGreen} 0%, #112919 100%)`, 
        padding: '50px 20px 80px',
        color: COLORS.white,
        textAlign: 'center',
        position: 'relative'
      }}>
        <Avatar 
          size={100} 
          icon={<User />} 
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            border: `4px solid ${getTierColor(member.tier_name)}`,
            marginBottom: 15 
          }} 
        />
        <Title level={3} style={{ color: COLORS.white, margin: 0, fontWeight: 800 }}>{member.name}</Title>
        <Tag color={getTierColor(member.tier_name)} style={{ marginTop: 10, borderRadius: 20, padding: '2px 15px', fontWeight: 700 }}>
          {member.tier_name || "Welcome Member"}
        </Tag>
        
        {/* Floating Balance Card */}
        <div style={{ 
          position: 'absolute',
          bottom: -40,
          left: 20,
          right: 20,
          background: COLORS.white,
          borderRadius: 24,
          padding: '20px 25px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Wallet Balance</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.darkGreen }}>${Number(member.wallet_balance || 0).toFixed(2)}</div>
          </div>
          <div style={{ background: '#f1f5f9', width: 50, height: 50, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet color={COLORS.darkGreen} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '60px 20px 30px' }}>
        
        {/* Points & Progress */}
        <Card style={{ borderRadius: 24, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 }}>
            <div style={{ background: '#fffbeb', padding: 10, borderRadius: 12 }}>
              <Star color="#f59e0b" fill="#f59e0b" size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <Title level={4} style={{ margin: 0, fontWeight: 800 }}>{member.points} Stars</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Collected since joining</Text>
            </div>
          </div>
          
          <div style={{ marginBottom: 5, display: 'flex', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, fontWeight: 700 }}>Next Reward Progress</Text>
            <Text style={{ fontSize: 12, color: COLORS.gold }}>{member.points} / {nextTierPoints}</Text>
          </div>
          <Progress 
            percent={progressPercent} 
            strokeColor={{ '0%': COLORS.midGreen, '100%': COLORS.gold }} 
            showInfo={false} 
            strokeWidth={12}
            style={{ marginBottom: 15 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 11 }}>
            <Trophy size={14} />
            Keep brewing to reach the next level!
          </div>
        </Card>

        {/* Benefits Grid */}
        <Title level={5} style={{ marginBottom: 15, paddingLeft: 5, fontWeight: 800 }}>Member Perks</Title>
        <Row gutter={[15, 15]} style={{ marginBottom: 30 }}>
          <Col span={12}>
            <div style={{ background: COLORS.white, padding: 15, borderRadius: 20, textAlign: 'center' }}>
              <div style={{ background: '#f0fdf4', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Award color="#16a34a" size={20} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>{member.discount_rate}% OFF</div>
              <div style={{ fontSize: 9, color: '#94a3b8' }}>Every Order</div>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ background: COLORS.white, padding: 15, borderRadius: 20, textAlign: 'center' }}>
              <div style={{ background: '#fff7ed', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Coffee color="#ea580c" size={20} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>Free Birthday</div>
              <div style={{ fontSize: 9, color: '#94a3b8' }}>Drink Yearly</div>
            </div>
          </Col>
        </Row>

        {/* Recent Orders */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingLeft: 5 }}>
          <Title level={5} style={{ margin: 0, fontWeight: 800 }}>Recent Orders</Title>
          <Text style={{ color: COLORS.darkGreen, fontSize: 12, fontWeight: 700 }}>View All</Text>
        </div>

        <List
          dataSource={orders}
          renderItem={(item) => (
            <div style={{ 
              background: COLORS.white, 
              padding: 15, 
              borderRadius: 20, 
              marginBottom: 12, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 15,
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
            }}>
              <div style={{ background: '#f8fafc', width: 45, height: 45, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} color="#64748b" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Order #{item.order_no || item.id}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(item.created_at).toLocaleDateString()} • {item.payment_method}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: COLORS.darkGreen }}>${Number(item.total_amount).toFixed(2)}</div>
                <ChevronRight size={16} color="#cbd5e1" />
              </div>
            </div>
          )}
        />
      </div>
      
      {/* Bottom Nav Simulation */}
      <div style={{ height: 80 }} />
      <div style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        background: COLORS.white, padding: '15px 30px', 
        borderTop: '1px solid #f1f5f9',
        display: 'flex', justifyContent: 'space-around',
        zIndex: 100
      }}>
        <div style={{ textAlign: 'center', color: COLORS.darkGreen }}><Coffee size={24} /><div style={{ fontSize: 9, fontWeight: 700 }}>Home</div></div>
        <div style={{ textAlign: 'center', color: '#cbd5e1' }}><Star size={24} /><div style={{ fontSize: 9, fontWeight: 700 }}>Rewards</div></div>
        <div style={{ textAlign: 'center', color: '#cbd5e1' }}><Clock size={24} /><div style={{ fontSize: 9, fontWeight: 700 }}>History</div></div>
      </div>
    </div>
  );
};

export default CustomerPortalPage;
