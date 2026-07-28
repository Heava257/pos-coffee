import React, { useState, useEffect } from "react";
import { Card, Typography, Space, Button, Select, Alert, message } from "antd";
import { UserSwitchOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import { useProfileStore } from "@/app/store/profileStore";
import { setAcccessToken, setPermission, setProfile } from "@/app/store/profile.store";

const { Title, Text } = Typography;

const LoginAsTenantPage = () => {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setProfile: setProfileStore, setPermissions: setPermissionsStore } = useProfileStore();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await request("support/tenants", "get");
      if (res && res.success) {
        setTenants(res.list || []);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load tenant list");
    }
  };

  const handleMasquerade = async () => {
    if (!selectedTenant) {
      message.warning("Please select a tenant business first!");
      return;
    }
    setLoading(true);
    try {
      const res = await request("support/masquerade", "post", { target_business_id: selectedTenant });
      if (res && res.success) {
        message.success(res.message);
        
        setAcccessToken(res.access_token);
        setProfile(res.profile);
        setPermission(res.permission);

        setProfileStore(res.profile);
        setPermissionsStore(res.permission);

        setTimeout(() => {
          window.location.pathname = "/dashboard";
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      message.error(err.message || "Masquerade session failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <UserSwitchOutlined /> Secure Tenant Masquerade
        </Title>
        <Text type="secondary">
          Admin masquerade mode. Impersonate a tenant account for advanced troubleshooting.
        </Text>
      </div>

      <Card title="Admin Tenant Masquerade" bordered={false}>
        <div style={{ maxWidth: '100%', padding: '40px 20px' }}>
          <Alert
            message="Security Warning"
            description="You are entering Tenant Masquerade mode. All actions performed during this session will be logged under audit trails."
            type="warning"
            showIcon
            style={{ marginBottom: 32 }}
          />
          <Title level={4} style={{ marginBottom: 16 }}>Select Tenant Account to Masquerade</Title>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Select
              placeholder="Select Merchant Business / Branch"
              size="large"
              style={{ width: '100%' }}
              options={tenants.map(t => ({ label: t.name, value: t.id }))}
              onChange={val => setSelectedTenant(val)}
            />
            <Button type="primary" danger size="large" block onClick={handleMasquerade} loading={loading}>
              Launch Impersonation Session
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default LoginAsTenantPage;
