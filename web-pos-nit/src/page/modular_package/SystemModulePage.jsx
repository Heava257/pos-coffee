import React, { useEffect, useState } from "react";
import {
    Table, Button, Card, Row, Col, Input,
    Modal, Form, message, Tag, Space,
    Typography, Switch
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    AppstoreOutlined,
    DeleteOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";

const { Title, Text } = Typography;

const SystemModulePage = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [form] = Form.useForm();
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        getList();
    }, []);

    const getList = async () => {
        setLoading(true);
        try {
            const res = await request("system_module", "get");
            if (res && res.list) {
                setList(res.list);
            }
        } catch (error) {
            message.error("Failed to fetch system modules");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (record) => {
        setEditId(record.id);
        form.setFieldsValue({
            ...record,
            status: record.status === "active"
        });
        setVisible(true);
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: "Are you sure you want to delete this module?",
            content: "This action cannot be undone.",
            okText: "Yes, Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    const res = await request("system_module", "delete", { id });
                    if (res) {
                        message.success("Module deleted successfully");
                        getList();
                    }
                } catch (error) {
                    message.error("Delete failed");
                }
            }
        });
    };

    const onFinish = async (values) => {
        try {
            const payload = {
                ...values,
                status: values.status ? "active" : "inactive"
            };
            const method = editId ? "put" : "post";
            if (editId) payload.id = editId;

            const res = await request("system_module", method, payload);
            if (res) {
                message.success(`Module ${editId ? "updated" : "created"} successfully!`);
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
            title: "Module Details",
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <Space size="middle">
                    <div style={{
                        width: 45, height: 45, borderRadius: '12px',
                        background: 'linear-gradient(135deg, #1e4a2d 0%, #3a5a40 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        <AppstoreOutlined style={{ fontSize: '22px' }} />
                    </div>
                    <div>
                        <Text strong style={{ fontSize: '15px', color: '#1e4a2d' }}>{text}</Text>
                        <br />
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
                <Space>
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={() => handleEdit(record)}
                        shape="circle"
                    />
                    <Button 
                        icon={<DeleteOutlined />} 
                        danger
                        onClick={() => handleDelete(record.id)}
                        shape="circle"
                    />
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', background: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Row gutter={[24, 24]} align="middle" style={{ marginBottom: 32 }}>
                    <Col span={16}>
                        <Title level={2} style={{ color: '#1e4a2d', margin: 0, fontWeight: 700 }}>
                            <AppstoreOutlined /> Additional Modules Config
                        </Title>
                        <Text type="secondary">Define extra modules (Add-ons) that can be individually toggled for each enterprise.</Text>
                    </Col>
                    <Col span={8} style={{ textAlign: 'right' }}>
                        <Button 
                            type="primary" 
                            size="large"
                            icon={<PlusOutlined />} 
                            onClick={() => {
                                setEditId(null);
                                form.resetFields();
                                form.setFieldsValue({ status: true });
                                setVisible(true);
                            }}
                            style={{ background: '#1e4a2d', borderColor: '#1e4a2d', borderRadius: 12, height: 48 }}
                        >
                            Create New Module
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
                        {editId ? "Edit Module" : "New Additional Module"}
                    </Title>}
                    open={visible}
                    onCancel={() => setVisible(false)}
                    footer={null}
                    width={600}
                    centered
                    bodyStyle={{ padding: '24px 32px' }}
                >
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Row gutter={24}>
                            <Col span={24}>
                                <Form.Item name="name" label="Module Name (e.g., Core POS System)" rules={[{ required: true }]}>
                                    <Input size="large" placeholder="Enter module name" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="code" label="Internal Code (e.g., POS, ORDERING)" rules={[{ required: true }]}>
                                    <Input size="large" placeholder="UNIQUE_CODE" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="description" label="Marketing Description">
                                    <Input.TextArea rows={2} placeholder="What does this module do?" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="status" label="Active Status" valuePropName="checked">
                                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <div style={{ textAlign: 'right', marginTop: 32 }}>
                            <Space size="large">
                                <Button size="large" onClick={() => setVisible(false)}>Cancel</Button>
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    size="large"
                                    style={{ background: '#1e4a2d', borderColor: '#1e4a2d', minWidth: 200, borderRadius: 12 }}
                                >
                                    Save Module
                                </Button>
                            </Space>
                        </div>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default SystemModulePage;
