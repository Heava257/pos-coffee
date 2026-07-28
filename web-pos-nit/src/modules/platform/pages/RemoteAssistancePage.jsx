import React from "react";
import { Card, Typography, Space, Input, Button, Divider } from "antd";
import { DesktopOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const RemoteAssistancePage = () => {
  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <DesktopOutlined /> Remote Assistance Control
        </Title>
        <Text type="secondary">
          Access and debug live merchant screens securely using temporary diagnostic keys.
        </Text>
      </div>

      <Card title="Secure Remote Session Tool" bordered={false}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
          <DesktopOutlined style={{ fontSize: 64, color: '#1e4a2d', marginBottom: 24 }} />
          <Title level={3}>Initiate Secure Remote Connection</Title>
          <Paragraph style={{ color: '#64748b', marginBottom: 32 }}>
            Establish a secure remote assistance tunnel to guide or diagnose the merchant directly on their POS terminal screen. 
            The merchant must provide a one-time connection pin.
          </Paragraph>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Input.Search
              placeholder="Enter Merchant Terminal ID"
              enterButton="Search Terminal"
              size="large"
              onSearch={val => {
                if (val) message.success(`Connected to Terminal ${val} successfully!`);
              }}
            />
            <Divider>OR</Divider>
            <Button type="primary" size="large" block onClick={() => message.info("Requesting remote connection token...")}>
              Generate Session Invitation Link
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default RemoteAssistancePage;
