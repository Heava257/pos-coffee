import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Typography, Space, Button, Tag } from "antd";
import {
  CustomerServiceOutlined,
  DesktopOutlined,
  WarningOutlined,
  MessageOutlined,
  UserSwitchOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;

const SupportCenterPage = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <CustomerServiceOutlined /> Support & Operations Desk
        </Title>
        <Text type="secondary">
          Central command center for remote customer assistance, ticket management, and diagnostics.
        </Text>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} md={8}>
          <Card title="Operational Status" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Support Queue</Text>
                <Tag color="green">NORMAL</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Avg. First Response</Text>
                <Text strong>4.5 Mins</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Active Agents</Text>
                <Text strong>12 Online</Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Quick Assistance Controls" bordered={false}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Button type="primary" block icon={<MessageOutlined />} size="large" onClick={() => navigate("/live-chat")}>
                  Open Live Support Chat
                </Button>
              </Col>
              <Col span={12}>
                <Button block icon={<DesktopOutlined />} size="large" onClick={() => navigate("/remote-assistance")}>
                  Establish Remote Session
                </Button>
              </Col>
              <Col span={12}>
                <Button block icon={<UserSwitchOutlined />} size="large" onClick={() => navigate("/login-as-tenant")}>
                  Masquerade Tenant
                </Button>
              </Col>
              <Col span={12}>
                <Button block icon={<WarningOutlined />} size="large" onClick={() => navigate("/bug-reports")}>
                  Report Platform Defect
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SupportCenterPage;
