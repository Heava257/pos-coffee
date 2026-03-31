import {
    Table, Button, Card, Row, Col, Input, 
    Modal, Form, message, Tag, Space, 
    Typography, Divider, Avatar, Tooltip,
    Empty, List, Upload
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    AppstoreOutlined,
    CoffeeOutlined,
    ExperimentOutlined,
    ControlOutlined,
    CheckCircleOutlined,
    InfoCircleOutlined,
    CameraOutlined,
    UploadOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { useEffect, useState } from "react";

const { Title, Text } = Typography;

const GlobalCategoryPage = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [form] = Form.useForm();
    const [editId, setEditId] = useState(null);
    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        getList();
    }, []);

    const getList = async () => {
        setLoading(true);
        try {
            const res = await request("category", "get");
            if (res && res.list) {
                setList(res.list);
            }
        } catch (error) {
            message.error("Failed to fetch platform categories");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (record) => {
        setEditId(record.id);
        form.setFieldsValue({
            ...record,
        });
        
        if (record.image) {
            setFileList([
                {
                    uid: '-1',
                    name: 'image.png',
                    status: 'done',
                    url: record.image,
                },
            ]);
        } else {
            setFileList([]);
        }
        setVisible(true);
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: "Are you sure you want to delete this global category?",
            content: "This will remove the category from all businesses. This action cannot be undone.",
            okText: "Yes, Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    const res = await request("category", "delete", { id });
                    if (res) {
                        message.success("Category removed from platform!");
                        getList();
                    }
                } catch (error) {
                    message.error(error.message || "Deletion failed");
                }
            }
        });
    };

    const onFinish = async (values) => {
        try {
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("default_moods", values.default_moods || "");
            formData.append("default_sizes", values.default_sizes || "");
            formData.append("default_addons", values.default_addons || "");
            
            if (editId) formData.append("id", editId);
            
            if (fileList.length > 0 && fileList[0].originFileObj) {
                formData.append("image", fileList[0].originFileObj);
            } else if (fileList.length > 0 && fileList[0].url) {
                formData.append("image", fileList[0].url); // Keep existing
            }

            const method = editId ? "put" : "post";
            const res = await request("category", method, formData);
            if (res) {
                message.success(`Platform category ${editId ? "updated" : "created"} successfully!`);
                setVisible(false);
                form.resetFields();
                setFileList([]);
                getList();
            }
        } catch (error) {
            message.error(error.message || "Action failed");
        }
    };

    const ConfigPreview = ({ label, items, color }) => {
        if (!items) return <Text type="secondary" italic style={{ fontSize: '11px' }}>No {label}</Text>;
        const list = items.split(',').map(i => i.trim());
        return (
            <div style={{ marginBottom: 4 }}>
                <Text strong style={{ fontSize: '12px', display: 'block', color: '#666' }}>{label}:</Text>
                <Space size={4} wrap>
                  {list.map((item, idx) => <Tag color={color} key={idx} style={{ fontSize: '10px', borderRadius: 4 }}>{item}</Tag>)}
                </Space>
            </div>
        );
    };

    const columns = [
        {
            title: "Category Preview",
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <Space size="middle">
                    <Avatar 
                        src={record.image} 
                        size={50} 
                        shape="square" 
                        icon={<CoffeeOutlined />} 
                        style={{ background: '#f5f5f5', border: '1px solid #eee' }}
                    />
                    <div>
                        <Text strong style={{ fontSize: '16px', color: '#1e4a2d' }}>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>ID: CAT-{record.id.toString().padStart(3, '0')}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: "Product Config Template (JSON)",
            key: "config",
            width: 400,
            render: (record) => (
                <div style={{ padding: '8px', background: '#fcfcfc', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                    <ConfigPreview label="Moods" items={record.default_moods} color="blue" />
                    <ConfigPreview label="Sizes" items={record.default_sizes} color="purple" />
                    <ConfigPreview label="Add-ons" items={record.default_addons} color="orange" />
                </div>
            )
        },
        {
            title: "Actions",
            key: "actions",
            align: 'right',
            render: (record) => (
                <Space>
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={() => handleEdit(record)}
                        type="text"
                    />
                    <Button 
                        icon={<DeleteOutlined />} 
                        danger 
                        onClick={() => handleDelete(record.id)}
                        type="text"
                    />
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '32px', background: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Row gutter={[24, 24]} align="middle" style={{ marginBottom: 32 }}>
                    <Col xs={24} md={16}>
                        <Title level={2} style={{ color: '#1e4a2d', margin: 0, fontWeight: 700 }}>
                            <ExperimentOutlined /> Category Lifecycle Factory
                        </Title>
                        <Text type="secondary">Define global product categories and their customization blueprints for the entire platform.</Text>
                    </Col>
                    <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                        <Button 
                            type="primary" 
                            size="large"
                            icon={<PlusOutlined />} 
                            onClick={() => {
                                setEditId(null);
                                form.resetFields();
                                setFileList([]);
                                setVisible(true);
                            }}
                            style={{ background: '#1e4a2d', borderColor: '#1e4a2d', borderRadius: 12, height: 48 }}
                        >
                            Create Platform Category
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
                        loading={loading}
                        rowKey="id"
                        pagination={false}
                    />
                </Card>

                <Modal
                    title={
                        <Space>
                            <ControlOutlined style={{ color: '#1e4a2d' }} />
                            <Title level={4} style={{ margin: 0 }}>
                                {editId ? "Blueprint: Refine Category" : "Blueprint: New Platform Category"}
                            </Title>
                        </Space>
                    }
                    open={visible}
                    onCancel={() => setVisible(false)}
                    footer={null}
                    width={800}
                    centered
                    bodyStyle={{ padding: '24px 32px' }}
                >
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Row gutter={24}>
                            <Col span={14}>
                                <Form.Item name="name" label="Category Identity / ឈ្មោះ" rules={[{ required: true }]}>
                                    <Input placeholder="e.g., Signature Coffee" size="large" />
                                </Form.Item>
                                
                                <Form.Item label="Identity Icon / Photo (Upload)">
                                    <Upload
                                        listType="picture"
                                        fileList={fileList}
                                        onChange={({ fileList }) => setFileList(fileList)}
                                        beforeUpload={() => false}
                                        maxCount={1}
                                    >
                                        <Button icon={<UploadOutlined />} style={{ width: '100%' }} size="large">
                                            Select Category Image
                                        </Button>
                                    </Upload>
                                </Form.Item>
                            </Col>
                            <Col span={10}>
                                <div style={{ 
                                  height: '100%', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  background: '#fcfaf7',
                                  borderRadius: 16,
                                  border: '1px dashed #e8e3d8'
                                }}>
                                    <Avatar 
                                        src={form.getFieldValue('image')} 
                                        size={120} 
                                        shape="square" 
                                        icon={<AppstoreOutlined style={{ fontSize: 40 }} />}
                                        style={{ background: 'white' }}
                                    />
                                </div>
                            </Col>
                        </Row>

                        <Divider orientation="left">Config Blueprint / ការកំណត់ជម្រើសសម្រាប់ Product</Divider>
                        
                        <div style={{ background: '#f4f7f6', padding: 24, borderRadius: 20 }}>
                            <Row gutter={24}>
                                <Col span={24}>
                                    <Tooltip title="Example: Hot, Iced, Frappe">
                                        <Form.Item name="default_moods" label={<Space>Moods / Option (e.g. Hot/Iced) <InfoCircleOutlined /></Space>}>
                                            <Input placeholder="Separate with commas: Hot, Iced, Frappe" size="large" />
                                        </Form.Item>
                                    </Tooltip>
                                </Col>
                                <Col span={24}>
                                    <Tooltip title="Example: Small, Regular, Large">
                                        <Form.Item name="default_sizes" label={<Space>Sizes / ទំហំ <InfoCircleOutlined /></Space>}>
                                            <Input placeholder="Separate with commas: S, M, L, XL" size="large" />
                                        </Form.Item>
                                    </Tooltip>
                                </Col>
                                <Col span={24}>
                                    <Tooltip title="Example: Extra Shot, Caramel, Pearl">
                                        <Form.Item name="default_addons" label={<Space>Add-ons / បន្ថែម <InfoCircleOutlined /></Space>}>
                                            <Input.TextArea rows={3} placeholder="Separate with commas: Extra Shot, Cream, Honey" />
                                        </Form.Item>
                                    </Tooltip>
                                </Col>
                            </Row>
                        </div>

                        <div style={{ textAlign: 'right', marginTop: 32 }}>
                            <Space size="large">
                                <Button size="large" onClick={() => setVisible(false)} style={{ borderRadius: 12 }}>Cancel</Button>
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    size="large"
                                    style={{ background: '#1e4a2d', borderColor: '#1e4a2d', borderRadius: 12, minWidth: 200 }}
                                >
                                    Commit Blueprint
                                </Button>
                            </Space>
                        </div>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default GlobalCategoryPage;
