import React, { useState, useEffect } from "react";
import { Input, Card, Typography, Button, Space, message, Row, Col, Empty } from "antd";
import { 
  SearchOutlined, 
  UserOutlined, 
  CreditCardOutlined, 
  SolutionOutlined,
  UsergroupAddOutlined,
  StarFilled 
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useLanguage, translations } from "@/app/store/language.store";
import { request } from "@/shared/utils/helper";

const { Title, Text } = Typography;

const LoyaltySearchPage = () => {
  const [searchValue, setSearchValue] = useState("");
  const [stats, setStats] = useState({ total_members: 0 });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await request("customer/marketing-stats", "get");
      if (res) {
        setStats(res);
      }
    } catch (error) {
      console.error("Failed to fetch loyalty stats", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchValue) {
      message.warning(t.please_enter_card_phone);
      return;
    }
    navigate(`/membership/${searchValue}`);
  };

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <Title level={2} style={{ color: "#1e4a2d", fontWeight: 800 }}>
          {t.loyalty_portal}
        </Title>
        <Text type="secondary">{t.loyalty_subtitle}</Text>
      </div>

      <Card 
        style={{ 
          borderRadius: 20, 
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)", 
          border: "none",
          padding: "20px"
        }}
      >
        <div style={{ marginBottom: 30 }}>
          <Title level={4}>{t.find_member}</Title>
          <Text type="secondary">{t.enter_card_phone}</Text>
        </div>

        <Space.Compact style={{ width: '100%', marginBottom: 40 }}>
          <Input 
            size="large" 
            placeholder={t.search_placeholder} 
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onPressEnter={handleSearch}
            style={{ borderRadius: "12px 0 0 12px", height: 55 }}
          />
          <Button 
            type="primary" 
            size="large" 
            onClick={handleSearch}
            style={{ 
              height: 55, 
              borderRadius: "0 12px 12px 0", 
              background: "#1e4a2d",
              padding: "0 30px",
              fontWeight: 700
            }}
          >
            {t.search}
          </Button>
        </Space.Compact>

        <Row gutter={[20, 20]}>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: 20, background: '#f8fafc', borderRadius: 15 }}>
              <UsergroupAddOutlined style={{ fontSize: 32, color: '#1e4a2d', marginBottom: 10 }} />
              <div style={{ fontWeight: 700 }}>{t.total_loyalty}</div>
              <div style={{ fontSize: 20, color: '#1e4a2d', fontWeight: 800 }}>
                {loading ? "..." : stats.total_members}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: 20, background: '#fff7e6', borderRadius: 15 }}>
              <StarFilled style={{ fontSize: 32, color: '#faad14', marginBottom: 10 }} />
              <div style={{ fontWeight: 700 }}>{t.active_tiers}</div>
              <div style={{ fontSize: 20, color: '#faad14', fontWeight: 800 }}>3 {t.levels}</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', padding: 20, background: '#f0f5ff', borderRadius: 15 }}>
              <CreditCardOutlined style={{ fontSize: 32, color: '#2f54eb', marginBottom: 10 }} />
              <div style={{ fontWeight: 700 }}>{t.prepaid_wallet}</div>
              <div style={{ fontSize: 20, color: '#2f54eb', fontWeight: 800 }}>{t.active}</div>
            </div>
          </Col>
        </Row>
      </Card>

      <div style={{ marginTop: 40, textAlign: 'center' }}>
         <Empty description={t.no_recent_searches} />
      </div>
    </div>
  );
};

export default LoyaltySearchPage;
