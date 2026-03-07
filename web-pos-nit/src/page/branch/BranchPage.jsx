import React, { useEffect, useState } from "react";
import {
    Table, Button, Card, Row, Col, Input,
    Modal, Form, message, Tag, Space,
    Typography, Divider, Badge, Switch, Tooltip
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ShopOutlined,
    SearchOutlined,
    EnvironmentOutlined,
    PhoneOutlined,
    CheckCircleOutlined,
    WarningOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { getProfile } from "../../store/profile.store";

import { useLanguage, translations } from "../../store/language.store";

const { Title, Text } = Typography;

const BranchPage = () => {
    const { lang } = useLanguage();
    const t = translations[lang];
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [form] = Form.useForm();
    const [editId, setEditId] = useState(null);
    const [searchText, setSearchText] = useState("");
    const profile = getProfile();

    useEffect(() => {
        getList();
    }, []);

    const getList = async () => {
        setLoading(true);
        try {
            const res = await request("branch", "get");
            if (res && res.list) {
                setList(res.list);
            }
        } catch (error) {
            message.error(t.fetch_branch_failed);
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        try {
            const method = editId ? "put" : "post";
            const payload = editId ? { ...values, id: editId } : values;

            const res = await request("branch", method, payload);
            if (res) {
                message.success(res.message || (editId ? t.update_branch : t.add_new_branch) + " " + t.success);
                setVisible(false);
                form.resetFields();
                setEditId(null);
                getList();
            }
        } catch (error) {
            message.error(error.message || t.operation_failed);
        }
    };

    const onClickEdit = (item) => {
        setEditId(item.id);
        form.setFieldsValue({
            name: item.name,
            location: item.location,
            phone: item.phone,
            is_main: item.is_main === '1'
        });
        setVisible(true);
    };

    const onClickDelete = (id) => {
        Modal.confirm({
            title: t.delete_branch_confirm.split('?')[0] + '?',
            content: t.delete_branch_confirm,
            okText: t.delete,
            okType: "danger",
            onOk: async () => {
                const res = await request("branch", "delete", { id });
                if (res) {
                    message.success(t.success);
                    getList();
                }
            }
        });
    };

    const columns = [
        {
            title: t.branch_name,
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: '16px', color: '#1e4a2d' }}>
                        {text} {record.is_main === '1' && <Tag color="gold" style={{ marginLeft: 8 }}>{t.main_headquarter}</Tag>}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>ID: BR-{record.id.toString().padStart(3, '0')}</Text>
                </Space>
            )
        },
        {
            title: t.location_address,
            dataIndex: "location",
            key: "location",
            render: (text) => (
                <Space>
                    <EnvironmentOutlined style={{ color: '#f7c06a' }} />
                    <Text>{text || t.not_specified}</Text>
                </Space>
            )
        },
        {
            title: t.contact_phone,
            dataIndex: "phone",
            key: "phone",
            render: (text) => (
                <Space>
                    <PhoneOutlined style={{ color: '#1e4a2d' }} />
                    <Text>{text || t.no_phone}</Text>
                </Space>
            )
        },
        {
            title: t.status,
            key: "status",
            render: () => (
                <Badge status="processing" text={t.active} color="#52c41a" />
            )
        },
        {
            title: t.action,
            key: "actions",
            align: 'right',
            render: (record) => (
                <Space>
                    <Tooltip title={t.edit}>
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => onClickEdit(record)}
                            style={{ color: '#1e4a2d' }}
                        />
                    </Tooltip>
                    {record.is_main !== '1' && (
                        <Tooltip title={t.delete}>
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => onClickDelete(record.id)}
                            />
                        </Tooltip>
                    )}
                </Space>
            )
        }
    ];

    const filteredList = list.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.location && item.location.toLowerCase().includes(searchText.toLowerCase()))
    );

    return (
        <div style={{ padding: '24px', background: '#f4f1eb', minHeight: '100vh' }}>
            <div style={{
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fff',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <div>
                    <Title level={2} style={{ margin: 0, color: '#1e4a2d', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ShopOutlined /> {t.branch_management}
                    </Title>
                    <Text type="secondary">{t.manage_locations}</Text>
                </div>

                <Space size="middle">
                    <Input
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder={t.search}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 250, borderRadius: '8px' }}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditId(null);
                            form.resetFields();
                            setVisible(true);
                        }}
                        style={{
                            background: '#1e4a2d',
                            borderColor: '#1e4a2d',
                            height: '40px',
                            borderRadius: '8px',
                            fontWeight: 600
                        }}
                    >
                        {t.add_new_branch}
                    </Button>
                </Space>
            </div>

            <Card
                style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    columns={columns}
                    dataSource={filteredList}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8 }}
                    style={{ padding: '8px' }}
                />
            </Card>

            <Modal
                title={<Title level={4} style={{ margin: 0 }}>{editId ? t.update_branch : t.setup_new_branch}</Title>}
                open={visible}
                onCancel={() => {
                    setVisible(false);
                    setEditId(null);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                okText={editId ? t.update_branch : t.create_branch}
                okButtonProps={{
                    style: { background: '#1e4a2d', borderColor: '#1e4a2d' }
                }}
                width={500}
                destroyOnClose
            >
                <div style={{ marginBottom: '20px', padding: '12px', background: '#fff9ef', borderRadius: '8px', border: '1px solid #f7c06a' }}>
                    <Space>
                        <WarningOutlined style={{ color: '#f7c06a' }} />
                        <Text style={{ fontSize: '13px' }}>
                            {profile?.plan_type === 'free'
                                ? t.free_plan_limit
                                : t.pro_plan_info}
                        </Text>
                    </Space>
                </div>

                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        name="name"
                        label={t.branch_name}
                        rules={[{ required: true, message: t.branch_name + " is required" }]}
                    >
                        <Input placeholder="e.g. Riverside Coffee, Terminal 2" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="location"
                        label={t.location_address}
                    >
                        <Input.TextArea placeholder={t.location_address} rows={3} />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="phone"
                                label={t.contact_phone}
                            >
                                <Input placeholder="012 345 678" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="is_main"
                                label={t.set_as_main_hq}
                                valuePropName="checked"
                            >
                                <Switch
                                    disabled={editId && list.find(b => b.id === editId)?.is_main === '1'}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export default BranchPage;
