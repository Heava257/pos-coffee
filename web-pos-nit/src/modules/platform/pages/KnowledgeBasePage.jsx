import React from "react";
import { Card, Row, Col, Typography, Input } from "antd";
import { BookOutlined, SearchOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const KnowledgeBasePage = () => {
  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOutlined /> Knowledge Base
        </Title>
        <Text type="secondary">
          Access documentation, user manuals, and standard operating procedures.
        </Text>
      </div>

      <Card title="Knowledge Base Search" bordered={false}>
        <div style={{ maxWidth: '100%', padding: '20px 0' }}>
          <Input.Search
            placeholder="Search guide, documentation, and troubleshooting..."
            enterButton={<SearchOutlined />}
            size="large"
            style={{ marginBottom: 40 }}
          />
          
          <Title level={4}>Featured Articles</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card type="inner" title="📠 Printer configuration guide" extra={<a href="#">Read</a>}>
                Step-by-step instructions on setting up Sunmi, Epson, or generic receipt printers.
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card type="inner" title="💳 Integrating ABA PayWay Gateway" extra={<a href="#">Read</a>}>
                How to setup API credentials to receive payment through ABA KHQR scan.
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card type="inner" title="👥 Managing Staff Roles & Rights" extra={<a href="#">Read</a>}>
                Detailed explanations of standard roles (Owner, Manager, Cashier, Kitchen).
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card type="inner" title="🔄 Backup and restore local databases" extra={<a href="#">Read</a>}>
                How to execute disaster recovery and restore historical logs.
              </Card>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
};

export default KnowledgeBasePage;
