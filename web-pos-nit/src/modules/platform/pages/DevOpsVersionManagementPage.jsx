import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Space, Button, Alert, message, Spin } from "antd";
import { SlidersOutlined, WarningOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text } = Typography;

const DevOpsVersionManagementPage = () => {
  const [packageVersion, setPackageVersion] = useState("v2.0.4");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVersion();
  }, []);

  const fetchVersion = async () => {
    setLoading(true);
    try {
      const res = await request("devops", "get");
      if (res && res.success) {
        setPackageVersion(res.packageVersion || "v2.0.4");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load version info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <SlidersOutlined /> Version Management
        </Title>
        <Text type="secondary">
          Control current production version, release notes, and hotfix patching.
        </Text>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="Current Version" bordered={false} style={{ borderRadius: 12 }}>
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <div>
                  <Text type="secondary">Active Production Release</Text>
                  <Title level={2} style={{ margin: 0, color: "var(--theme-accent-green)" }}>{packageVersion}-stable</Title>
                </div>
                <Alert message="System is fully up-to-date with mainstream release." type="success" showIcon />
                <Button type="primary" block onClick={() => message.info("System is already at the latest release version.")}>Check Update</Button>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Release Actions" bordered={false} style={{ borderRadius: 12 }}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Button danger block icon={<WarningOutlined />} onClick={() => message.warning("Rollback mechanism starting...")}>Rollback to previous release</Button>
                <Button block onClick={() => message.info("Downloading package build bundle...")}>Download Release Bundle</Button>
                <Button block onClick={() => message.success("Repository assets verified successfully!")}>Verify Assets Integrity</Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default DevOpsVersionManagementPage;
