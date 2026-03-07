import React, { useEffect, useState } from "react";
import {
    Table,
    Checkbox,
    Button,
    Card,
    Row,
    Col,
    Select,
    Typography,
    message,
    Divider,
    Space,
    Empty,
    Badge,
    Tooltip
} from "antd";
import {
    SafetyCertificateOutlined,
    SaveOutlined,
    ReloadOutlined,
    UnlockOutlined,
    ShopOutlined,
    UsergroupAddOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { getProfile, setPermission } from "../../store/profile.store";

const { Title, Text } = Typography;
const { Option } = Select;

const PermissionPage = () => {
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [selectedPermIds, setSelectedPermIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const roleRes = await request("role", "get");
            const permRes = await request("permission", "get");

            if (roleRes && roleRes.list) setRoles(roleRes.list);
            if (permRes && permRes.list) setAllPermissions(permRes.list);

            if (roleRes?.list?.length > 0) {
                setSelectedRoleId(roleRes.list[0].id);
                fetchRolePermissions(roleRes.list[0].id);
            }
        } catch (error) {
            message.error("Failed to load permission data");
        } finally {
            setLoading(false);
        }
    };

    const fetchRolePermissions = async (roleId) => {
        try {
            const res = await request(`permission/${roleId}`, "get");
            if (res && res.list) {
                setSelectedPermIds(res.list);
            }
        } catch (error) {
            message.error("Error fetching role permissions");
        }
    };

    const handleRoleChange = (roleId) => {
        setSelectedRoleId(roleId);
        fetchRolePermissions(roleId);
    };

    const handleCheckboxChange = (permId, checked) => {
        setSelectedPermIds(prev => {
            if (checked) {
                return [...new Set([...prev, permId])];
            } else {
                return prev.filter(id => id !== permId);
            }
        });
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedPermIds(allPermissions.map(p => p.id));
        } else {
            setSelectedPermIds([]);
        }
    };

    const handleSave = async () => {
        if (!selectedRoleId) return;
        setSaving(true);
        try {
            const res = await request("permission/assign", "post", {
                role_id: selectedRoleId,
                permission_ids: selectedPermIds
            });
            if (res && !res.error) {
                message.success("Permissions updated successfully!");

                // Reactive Session Update:
                // If the user just edited THEIR OWN role, we need to refresh their local session
                // so the changes (like sidebar visibility) take effect immediately.
                const profile = getProfile();
                console.log("Saving permissions. Profile Role:", profile?.role_id, "Selected Role:", selectedRoleId);

                if (profile && Number(profile.role_id) === Number(selectedRoleId)) {
                    console.log("Updating current user session permissions...");
                    // Filter the allPermissions list to get the objects for the selected IDs
                    const newPermList = allPermissions
                        .filter(p => selectedPermIds.includes(p.id))
                        .map(p => ({ web_route_key: p.route_key, name: p.name }));

                    console.log("New Permission List to save:", newPermList);
                    setPermission(newPermList);
                    // This will trigger re-renders in MainLayout if the user navigates 
                    // or if we force a state sync.
                    window.location.reload(); // Force refresh to apply new security context
                }
            }
        } catch (error) {
            message.error("Update failed");
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        {
            title: "Permission Name",
            dataIndex: "name",
            key: "name",
            render: (text) => <Text strong style={{ color: '#1e4a2d' }}>{text}</Text>
        },
        {
            title: "Navigation Path",
            dataIndex: "route_key",
            key: "route_key",
            render: (text) => <Badge status="processing" text={text} style={{ opacity: 0.7 }} />
        },
        {
            title: "Access",
            key: "access",
            align: 'center',
            render: (_, record) => (
                <Checkbox
                    checked={selectedPermIds.includes(record.id)}
                    onChange={(e) => handleCheckboxChange(record.id, e.target.checked)}
                />
            )
        }
    ];

    return (
        <div style={{ padding: '24px', background: '#f4f1eb', minHeight: '100vh' }}>
            <div style={{
                marginBottom: '24px',
                background: '#fff',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col>
                        <Title level={2} style={{ margin: 0, color: '#1e4a2d', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <SafetyCertificateOutlined /> Security & Permissions
                        </Title>
                        <Text type="secondary">Control what each user role can access across branches</Text>
                    </Col>
                    <Col>
                        <Space size="middle">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchInitialData}
                                disabled={loading || saving}
                            >
                                Refresh
                            </Button>
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={handleSave}
                                loading={saving}
                                style={{
                                    background: '#1e4a2d',
                                    borderColor: '#1e4a2d',
                                    height: '40px',
                                    borderRadius: '8px',
                                    padding: '0 24px'
                                }}
                            >
                                Save Changes
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </div>

            <Row gutter={24}>
                <Col xs={24} md={8}>
                    <Card
                        title={
                            <Space>
                                <UsergroupAddOutlined style={{ color: '#c0a060' }} />
                                <span>Select User Role</span>
                            </Space>
                        }
                        style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                    >
                        <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                            Permissions will apply to all users assigned to this role.
                        </Text>
                        <Select
                            style={{ width: '100%', marginBottom: '16px' }}
                            size="large"
                            placeholder="Pick a role to configure"
                            value={selectedRoleId}
                            onChange={handleRoleChange}
                            loading={loading}
                        >
                            {roles.map(role => (
                                <Option key={role.id} value={role.id}>
                                    {role.name} {role.code ? `(${role.code})` : ''}
                                </Option>
                            ))}
                        </Select>

                        <Divider />

                        <div style={{ background: 'rgba(192, 160, 96, 0.05)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #c0a060' }}>
                            <Title level={5} style={{ margin: 0, color: '#c0a060' }}><UnlockOutlined /> Multi-Branch Access</Title>
                            <Text size="small" type="secondary">
                                Permissions defined here are universal across all branches. Staff will only see data for their assigned branch.
                            </Text>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Card
                        title={
                            <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                                <Col>
                                    <Space>
                                        <ShopOutlined style={{ color: '#1e4a2d' }} />
                                        <span>Module Permissions</span>
                                    </Space>
                                </Col>
                                <Col>
                                    <Checkbox
                                        indeterminate={selectedPermIds.length > 0 && selectedPermIds.length < allPermissions.length}
                                        checked={selectedPermIds.length === allPermissions.length && allPermissions.length > 0}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    >
                                        Select All
                                    </Checkbox>
                                </Col>
                            </Row>
                        }
                        style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                        bodyStyle={{ padding: 0 }}
                    >
                        {allPermissions.length > 0 ? (
                            <Table
                                columns={columns}
                                dataSource={allPermissions}
                                rowKey="id"
                                pagination={false}
                                loading={loading}
                                scroll={{ y: 500 }}
                            />
                        ) : (
                            <div style={{ padding: '60px', textAlign: 'center' }}>
                                <Empty description="No permissions found in database" />
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default PermissionPage;
