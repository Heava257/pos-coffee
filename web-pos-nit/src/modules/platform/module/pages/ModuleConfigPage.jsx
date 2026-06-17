import React, { useEffect, useState } from "react";
import {
    Table, Button, Card, Row, Col, Input,
    Modal, Form, message, Tag, Space,
    Typography, Checkbox, Divider, Avatar, Select
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    AppstoreAddOutlined,
    SafetyCertificateOutlined,
    SettingOutlined,
    CodeOutlined,
    InfoCircleOutlined
} from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text } = Typography;

const ModuleConfigPage = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [form] = Form.useForm();
    const [editId, setEditId] = useState(null);
    const [allPermissions, setAllPermissions] = useState([]);

    useEffect(() => {
        getList();
        getAllPermissions();
    }, []);

    const getList = async () => {
        setLoading(true);
        try {
            const res = await request("modular_package", "get");
            if (res && res.list) {
                setList(res.list);
            }
        } catch (error) {
            message.error("Failed to fetch modular packages");
        } finally {
            setLoading(false);
        }
    };

    const getAllPermissions = async () => {
        try {
            const res = await request("permission", "get");
            if (res && res.list) {
                setAllPermissions(res.list);
            }
        } catch (error) {}
    };

    const handleEdit = async (record) => {
        setEditId(record.id);
        setLoading(true);
        try {
            const res = await request(`modular_package/permissions?id=${record.id}`, "get");
            const pIds = res.list?.map(p => p.id) || [];
            
            form.setFieldsValue({
                ...record,
                permission_ids: pIds
            });
            setVisible(true);
        } catch (e) {
            message.error("Failed to load package permissions");
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        try {
            const method = editId ? "put" : "post";
            const data = editId ? { ...values, id: editId } : values;
            const res = await request("modular_package", method, data);
            if (res) {
                message.success(`Package ${editId ? "updated" : "created"} successfully!`);
                setVisible(false);
                form.resetFields();
                getList();
            }
        } catch (error) {
            message.error(error.message || "Action failed");
        }
    };

    const columns = [
        {
            title: "Package Blueprint",
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <Space size="middle">
                    <div style={{
                        width: 45, height: 45, borderRadius: '12px',
                        background: 'linear-gradient(135deg, #1e4a2d 0%, #3a5a40 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        <AppstoreAddOutlined style={{ fontSize: '22px' }} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Text strong style={{ fontSize: '15px', color: '#1e4a2d' }}>{text}</Text>
                            <Tag color={
                                record.industry_code === 'pharmacy' ? 'blue' : 
                                record.industry_code === 'restaurant' ? 'orange' :
                                record.industry_code === 'retail' ? 'green' : 'gold'
                            } style={{ borderRadius: 20, fontSize: '10px' }}>
                                {record.industry_code?.toUpperCase() || 'COFFEE'}
                            </Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>Code: {record.code}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (text) => <Text type="secondary" style={{ fontSize: '13px' }}>{text || "N/A"}</Text>
        },
        {
            title: "Permission Count",
            dataIndex: "total_permissions",
            key: "total_permissions",
            render: (count) => <Tag color="blue" style={{ borderRadius: 6 }}>{count} Features Linked</Tag>
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => <Tag color={status === 'active' ? 'success' : 'error'}>{status?.toUpperCase()}</Tag>
        },
        {
            title: "Management",
            key: "actions",
            align: 'right',
            render: (record) => (
                <Button 
                    icon={<EditOutlined />} 
                    onClick={() => handleEdit(record)}
                    shape="circle"
                />
            )
        }
    ];

    return (
        <div style={{ padding: '24px', background: 'transparent', minHeight: '100vh' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Row gutter={[24, 24]} align="middle" style={{ marginBottom: 32 }}>
                    <Col span={16}>
                        <Title level={2} style={{ color: '#1e4a2d', margin: 0, fontWeight: 700 }}>
                            <CodeOutlined /> Service Package Factory
                        </Title>
                        <Text type="secondary">Define Industry Blueprints (Coffee, Mart, Restaurant) by grouping permissions into selectable packages.</Text>
                    </Col>
                    <Col span={8} style={{ textAlign: 'right' }}>
                        <Button 
                            type="primary" 
                            size="large"
                            icon={<PlusOutlined />} 
                            onClick={() => {
                                setEditId(null);
                                form.resetFields();
                                setVisible(true);
                            }}
                            style={{ background: '#1e4a2d', borderColor: '#1e4a2d', borderRadius: 12, height: 48 }}
                        >
                            Create New Blueprint
                        </Button>
                    </Col>
                </Row>

                <Card 
                    style={{ borderRadius: 24, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}
                    bodyStyle={{ padding: 0 }}
                >
                    <Table 
                        columns={columns} 
                        dataSource={list} 
                        rowKey="id" 
                        loading={loading}
                        pagination={false}
                    />
                </Card>

                <Modal
                    title={<Title level={3} style={{ margin: 0, color: '#1e4a2d' }}>
                        {editId ? "Blueprint Configuration" : "New Service Blueprint"}
                    </Title>}
                    open={visible}
                    onCancel={() => setVisible(false)}
                    footer={null}
                    width={900}
                    centered
                    bodyStyle={{ padding: '24px 32px' }}
                >
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Row gutter={24}>
                            <Col span={8}>
                                <Form.Item name="name" label="Blueprint Name (e.g. Mart Basic)" rules={[{ required: true }]}>
                                    <Input size="large" placeholder="Enter package name" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="code" label="Internal Code (unique_code)" rules={[{ required: true }]}>
                                    <Input size="large" placeholder="unique_code" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="industry_code" label="Industry Package" rules={[{ required: true }]}>
                                    <Select size="large" placeholder="Select Industry">
                                        <Select.Option value="coffee_cafe">☕ Coffee & Cafe</Select.Option>
                                        <Select.Option value="restaurant">🍽️ Restaurant & Dining</Select.Option>
                                        <Select.Option value="pharmacy">💊 Pharmacy & Medical</Select.Option>
                                        <Select.Option value="retail">🛒 Retail & Mart</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="description" label="Marketing Description">
                                    <Input.TextArea rows={2} placeholder="What is included in this package?" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left">Feature Composition (Assign Permissions)</Divider>
                        
                        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '16px', background: '#fcfcfc', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
                            <Form.Item name="permission_ids">
                                <Checkbox.Group style={{ width: '100%' }}>
                                    <Row gutter={[16, 16]}>
                                        {allPermissions.map(p => (
                                            <Col span={8} key={p.id}>
                                                <Card size="small" style={{ borderRadius: 8 }}>
                                                    <Checkbox value={p.id}>
                                                        <Text strong style={{ fontSize: '13px' }}>{p.name}</Text>
                                                        <br />
                                                        <Text type="secondary" style={{ fontSize: '10px' }}>{p.route_key}</Text>
                                                    </Checkbox>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </Checkbox.Group>
                            </Form.Item>
                        </div>

                        <div style={{ textAlign: 'right', marginTop: 32 }}>
                            <Space size="large">
                                <Button size="large" onClick={() => setVisible(false)}>Cancel</Button>
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    size="large"
                                    style={{ background: '#1e4a2d', borderColor: '#1e4a2d', minWidth: 200, borderRadius: 12 }}
                                >
                                    Save Blueprint
                                </Button>
                            </Space>
                        </div>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default ModuleConfigPage;
