import React, { useEffect, useState } from "react";
import {
    Table, Button, Card, Row, Col, Input,
    Modal, Form, message, Tag, Space, Select,
    Typography, Divider, Badge, Switch, Tooltip, Image, Upload, Statistic, Avatar
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
    WarningOutlined,
    QrcodeOutlined,
    GlobalOutlined,
    HomeOutlined,
    ArrowRightOutlined,
    SafetyCertificateOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { Config } from "../../util/config";
import { getProfile } from "../../store/profile.store";

import { useLanguage, translations } from "../../store/language.store";
import { CAMBODIA_GEO } from "../../util/cambodia_geo";

const { Title, Text } = Typography;

const COLORS = {
  bg: "#f4f1eb",
  darkGreen: "#1e4a2d",
  midGreen: "#2d6a42",
  accentGreen: "#3a7d52",
  white: "#ffffff",
  textPrimary: "#1a2e1a",
  textSecondary: "#6b7c6b",
  softBorder: "#e8e3d8",
  gold: "#d4af37",
};

const BranchPage = () => {
    const { lang } = useLanguage();
    const t = translations[lang];
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [form] = Form.useForm();
    const [editId, setEditId] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [fileList, setFileList] = useState([]);
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
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("province", values.province || "");
            formData.append("district", values.district || "");
            formData.append("location", values.location || "");
            formData.append("phone", values.phone || "");
            formData.append("is_main", values.is_main ? "1" : "0");
            formData.append("payment_merchant_id", values.payment_merchant_id || "");
            formData.append("payment_api_key", values.payment_api_key || "");
            formData.append("payment_receiver_name", values.payment_receiver_name || "");
            formData.append("payment_provider", values.payment_provider || "KHQR");
            formData.append("payment_api_url", values.payment_api_url || "");

            if (fileList.length > 0 && fileList[0].originFileObj) {
                formData.append("khqr_image", fileList[0].originFileObj);
            } else if (fileList.length === 0 && editId) {
                formData.append("image_remove", "1");
            }

            if (editId) {
                formData.append("id", editId);
            }

            const method = editId ? "put" : "post";
            const res = await request("branch", method, formData);
            if (res) {
                message.success(res.message || (editId ? t.update_branch : t.add_new_branch) + " " + t.success);
                setVisible(false);
                form.resetFields();
                setEditId(null);
                setFileList([]);
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
            province: item.province,
            district: item.district,
            location: item.location,
            phone: item.phone,
            is_main: item.is_main === '1',
            payment_merchant_id: item.payment_merchant_id,
            payment_api_key: item.payment_api_key,
            payment_receiver_name: item.payment_receiver_name,
            payment_provider: item.payment_provider || "KHQR",
            payment_api_url: item.payment_api_url,
        });
        if (item.khqr_image) {
            setFileList([
                {
                    uid: "-1",
                    name: "khqr.png",
                    status: "done",
                    url: Config.getFullImagePath(item.khqr_image),
                },
            ]);
        } else {
            setFileList([]);
        }
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
            width: 250,
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Space>
                        <Avatar icon={<ShopOutlined />} style={{ backgroundColor: record.is_main === '1' ? COLORS.gold : COLORS.darkGreen }} />
                        <Text strong style={{ fontSize: '15px', color: COLORS.darkGreen }}>
                            {text}
                        </Text>
                        {record.is_main === '1' && <Tag color="gold" bordered={false} style={{ borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>HQ</Tag>}
                    </Space>
                    <Text type="secondary" style={{ fontSize: '11px', marginLeft: 40 }}>ID: BR-{record.id.toString().padStart(3, '0')}</Text>
                </Space>
            )
        },
        {
            title: t.province_city || "Province/City",
            dataIndex: "province",
            key: "province",
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Tag color="processing" bordered={false} style={{ borderRadius: '6px', fontWeight: 600 }}>{text || t.not_specified}</Tag>
                    <Text type="secondary" style={{ fontSize: '11px', color: COLORS.textSecondary }}>{record.district}</Text>
                </Space>
            )
        },
        {
            title: t.location_address,
            dataIndex: "location",
            key: "location",
            render: (text) => (
                <Space align="start">
                    <EnvironmentOutlined style={{ color: COLORS.gold, marginTop: 4 }} />
                    <Text style={{ fontSize: '13px', color: COLORS.textPrimary }}>{text || t.not_specified}</Text>
                </Space>
            )
        },
        {
            title: t.contact_phone,
            dataIndex: "phone",
            key: "phone",
            render: (text) => (
                <Space>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PhoneOutlined style={{ color: COLORS.darkGreen, fontSize: 12 }} />
                    </div>
                    <Text style={{ fontSize: '13px', color: COLORS.darkGreen }}>{text || t.no_phone}</Text>
                </Space>
            )
        },
        {
            title: t.status,
            key: "status",
            render: () => (
                <Badge status="processing" text={<Text strong style={{ fontSize: '12px', color: COLORS.accentGreen }}>{t.active}</Text>} color={COLORS.accentGreen} />
            )
        },
        {
            title: "KHQR",
            dataIndex: "khqr_image",
            key: "khqr_image",
            render: (text) => text ? (
                <Tooltip title="View Merchant QR">
                    <Image
                        src={Config.getFullImagePath(text)}
                        width={32}
                        height={32}
                        style={{ borderRadius: 6, objectFit: 'cover', cursor: 'pointer', border: `1px solid ${COLORS.softBorder}` }}
                    />
                </Tooltip>
            ) : <Tag bordered={false} color="default" style={{ fontSize: '10px' }}>{t.no_image}</Tag>
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
                            className="action-btn"
                            style={{ color: COLORS.darkGreen }}
                        />
                    </Tooltip>
                    {record.is_main !== '1' && (
                        <Tooltip title={t.delete}>
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => onClickDelete(record.id)}
                                className="action-btn-danger"
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

    const stats = {
        total: list.length,
        main: list.filter(i => i.is_main === '1').length,
        others: list.filter(i => i.is_main !== '1').length
    };

    return (
        <div style={{ padding: '32px', background: COLORS.bg, minHeight: '100vh' }}>
            {/* Header Section */}
            <Row gutter={[24, 24]} align="middle" style={{ marginBottom: 32 }}>
                <Col span={14}>
                    <Title level={2} style={{ margin: 0, color: COLORS.darkGreen, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <GlobalOutlined /> {t.branch_management}
                    </Title>
                    <Text style={{ color: COLORS.textSecondary }}>Coordinate operations across your business locations.</Text>
                </Col>
                <Col span={10} style={{ textAlign: 'right' }}>
                    <Space size="middle">
                        <Input
                            prefix={<SearchOutlined style={{ color: COLORS.textSecondary }} />}
                            placeholder={t.search}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 280, borderRadius: 12, padding: '8px 16px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
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
                                background: COLORS.darkGreen,
                                borderColor: COLORS.darkGreen,
                                height: 42,
                                padding: '0 24px',
                                borderRadius: 12,
                                fontWeight: 600,
                                boxShadow: '0 4px 10px rgba(30, 74, 45, 0.2)'
                            }}
                        >
                            {t.add_new_branch}
                        </Button>
                    </Space>
                </Col>
            </Row>

            {/* Statistics Section */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="executive-stat-card">
                        <Statistic 
                            title={<Text strong style={{ color: COLORS.textSecondary, fontSize: 12, textTransform: 'uppercase' }}>Total Active Branches</Text>}
                            value={stats.total} 
                            prefix={<HomeOutlined style={{ color: COLORS.darkGreen }} />} 
                            valueStyle={{ color: COLORS.darkGreen, fontWeight: 900 }}
                        />
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Badge status="processing" color={COLORS.accentGreen} />
                            <Text type="secondary" style={{ fontSize: 11 }}>Synchronized across cloud</Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="executive-stat-card">
                        <Statistic 
                            title={<Text strong style={{ color: COLORS.textSecondary, fontSize: 12, textTransform: 'uppercase' }}>Headquarters</Text>}
                            value={stats.main} 
                            prefix={<SafetyCertificateOutlined style={{ color: COLORS.gold }} />} 
                            valueStyle={{ color: COLORS.gold, fontWeight: 900 }}
                        />
                        <div style={{ marginTop: 12 }}>
                            <Tag color="gold" bordered={false} style={{ fontSize: 10 }}>PRIMARY LOGISTICS HUB</Tag>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="executive-stat-card">
                        <Statistic 
                            title={<Text strong style={{ color: COLORS.textSecondary, fontSize: 12, textTransform: 'uppercase' }}>Regional Outlets</Text>}
                            value={stats.others} 
                            prefix={<ArrowRightOutlined style={{ color: COLORS.midGreen }} />} 
                            valueStyle={{ color: COLORS.midGreen, fontWeight: 900 }}
                        />
                        <div style={{ marginTop: 12 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>{stats.others > 0 ? "Operational & Integrated" : "No regional outlets yet"}</Text>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card
                bordered={false}
                style={{ borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    columns={columns}
                    dataSource={filteredList}
                    rowKey="id"
                    loading={loading}
                    pagination={{ 
                        pageSize: 8,
                        showTotal: (total) => <Text type="secondary" style={{ fontSize: 12 }}>Total {total} branches</Text>
                    }}
                    className="executive-table"
                />
            </Card>

            <Modal
                title={
                    <div style={{ paddingBottom: 16 }}>
                        <Title level={4} style={{ margin: 0, color: COLORS.darkGreen }}>
                            {editId ? t.update_branch : t.setup_new_branch}
                        </Title>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Configure location operational settings</Text>
                    </div>
                }
                open={visible}
                onCancel={() => {
                    setVisible(false);
                    setFileList([]);
                }}
                onOk={() => form.submit()}
                okText={editId ? t.update_branch : t.create_branch}
                okButtonProps={{
                    style: { background: COLORS.darkGreen, borderColor: COLORS.darkGreen, padding: '0 40px', height: 42, borderRadius: 12, fontWeight: 600 }
                }}
                cancelButtonProps={{
                    style: { borderRadius: 12, height: 42, border: 'none', background: '#f1f5f9' }
                }}
                width={1000}
                destroyOnClose
                centered
                bodyStyle={{ padding: '24px 32px' }}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Row gutter={48}>
                        {/* Left Column: Branch Operations */}
                        <Col span={12} style={{ borderRight: `1px solid ${COLORS.softBorder}` }}>
                            <Divider orientation="left" style={{ marginTop: 0 }}>
                                <Space><EnvironmentOutlined style={{ color: COLORS.darkGreen }} /><Text strong style={{ color: COLORS.darkGreen, fontSize: 12 }}>CORE LOGISTICS</Text></Space>
                            </Divider>
                            
                            <Form.Item
                                name="name"
                                label={<Text strong style={{ fontSize: 13 }}>{t.branch_name}</Text>}
                                rules={[{ required: true, message: t.branch_name + " is required" }]}
                                style={{ marginBottom: 20 }}
                            >
                                <Input placeholder="e.g. Riverside Coffee, Terminal 2" size="large" style={{ borderRadius: 10 }} />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="province"
                                        label={<Text strong style={{ fontSize: 13 }}>{t.province_city}</Text>}
                                        rules={[{ required: true, message: "Required" }]}
                                        style={{ marginBottom: 20 }}
                                    >
                                        <Select
                                            showSearch
                                            placeholder="Province"
                                            size="large"
                                            style={{ borderRadius: 10 }}
                                            options={Object.keys(CAMBODIA_GEO).map(p => ({ label: p, value: p }))}
                                            onChange={() => form.setFieldsValue({ district: undefined })}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prev, curr) => prev.province !== curr.province}
                                    >
                                        {({ getFieldValue }) => {
                                            const province = getFieldValue("province");
                                            const districts = province ? CAMBODIA_GEO[province] : [];
                                            return (
                                                <Form.Item
                                                    name="district"
                                                    label={<Text strong style={{ fontSize: 13 }}>{t.district_khan}</Text>}
                                                    rules={[{ required: true, message: "Required" }]}
                                                    style={{ marginBottom: 20 }}
                                                >
                                                    <Select
                                                        showSearch
                                                        placeholder="District"
                                                        size="large"
                                                        style={{ borderRadius: 10 }}
                                                        disabled={!province}
                                                        options={districts.map(d => ({ label: d, value: d }))}
                                                    />
                                                </Form.Item>
                                            );
                                        }}
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="location"
                                label={<Text strong style={{ fontSize: 13 }}>{t.location_address}</Text>}
                                style={{ marginBottom: 20 }}
                            >
                                <Input.TextArea placeholder="Full physical address..." rows={3} style={{ borderRadius: 10 }} />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="phone"
                                        label={<Text strong style={{ fontSize: 13 }}>{t.contact_phone}</Text>}
                                        style={{ marginBottom: 20 }}
                                    >
                                        <Input placeholder="012 345 678" size="large" style={{ borderRadius: 10 }} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="is_main"
                                        label={<Text strong style={{ fontSize: 13 }}>{t.set_as_main_hq}</Text>}
                                        valuePropName="checked"
                                        style={{ marginBottom: 20 }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', height: 40, background: '#f8fafc', padding: '0 12px', borderRadius: 10, border: `1px solid ${COLORS.softBorder}` }}>
                                            <Switch
                                                size="small"
                                                disabled={editId && list.find(b => b.id === editId)?.is_main === '1'}
                                            />
                                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 10 }}>Primary Headquarters</Text>
                                        </div>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>

                        {/* Right Column: Payment & KHQR */}
                        <Col span={12}>
                            <Divider orientation="left" style={{ marginTop: 0 }}>
                                <Space><QrcodeOutlined style={{ color: COLORS.midGreen }} /><Text strong style={{ color: COLORS.darkGreen, fontSize: 12 }}>PAYMENT INFRASTRUCTURE</Text></Space>
                            </Divider>

                            <div style={{ marginBottom: 20, padding: 16, background: '#f0fdf4', border: `1px solid ${COLORS.accentGreen}33`, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                                <Avatar size={40} icon={<SafetyCertificateOutlined />} style={{ backgroundColor: COLORS.accentGreen }} />
                                <div>
                                    <Text strong style={{ color: COLORS.darkGreen, fontSize: 13 }}>Secure KHQR Integration</Text><br/>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Setup API gateway for automated settlements.</Text>
                                </div>
                            </div>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="payment_provider" label={<Text strong style={{ fontSize: 13 }}>Bank Provider</Text>} style={{ marginBottom: 20 }}>
                                        <Select
                                            placeholder="Select bank"
                                            size="large"
                                            style={{ borderRadius: 10 }}
                                            options={[
                                                { label: "Bakong / KHQR", value: "KHQR" },
                                                { label: "ABA PayWay", value: "ABA" },
                                                { label: "Wing Bank", value: "WING" },
                                            ]}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="payment_api_url" label={<Text strong style={{ fontSize: 13 }}>Gateway URL</Text>} style={{ marginBottom: 20 }}>
                                        <Input placeholder="https://api.bank.com" size="large" style={{ borderRadius: 10 }} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="payment_merchant_id" label={<Text strong style={{ fontSize: 13 }}>Merchant ID</Text>} style={{ marginBottom: 20 }}>
                                        <Input placeholder="M-123456" size="large" style={{ borderRadius: 10 }} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="payment_receiver_name" label={<Text strong style={{ fontSize: 13 }}>Account Name</Text>} style={{ marginBottom: 20 }}>
                                        <Input placeholder="Store / Account Name" size="large" style={{ borderRadius: 10 }} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name="payment_api_key" label={<Text strong style={{ fontSize: 13 }}>Security API Token</Text>} style={{ marginBottom: 20 }}>
                                        <Input.Password placeholder="Enter secret token" size="large" style={{ borderRadius: 10 }} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item label={<Text strong style={{ fontSize: 13 }}>{t.upload_khqr} (Manual fallback)</Text>} style={{ marginBottom: 0 }}>
                                <Upload
                                    listType="picture-card"
                                    fileList={fileList}
                                    onChange={({ fileList }) => setFileList(fileList)}
                                    beforeUpload={() => false}
                                    maxCount={1}
                                    className="executive-upload"
                                >
                                    {fileList.length < 1 && (
                                        <div style={{ color: COLORS.textSecondary }}>
                                            <PlusOutlined />
                                            <div style={{ marginTop: 4, fontSize: 12 }}>{t.upload}</div>
                                        </div>
                                    )}
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <style jsx global>{`
                .executive-stat-card {
                    border-radius: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                    transition: all 0.3s ease;
                }
                .executive-stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(30, 74, 45, 0.05);
                }
                .executive-table .ant-table-thead > tr > th {
                    background: #f8fafc;
                    color: ${COLORS.textSecondary};
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 700;
                    border-bottom: 2px solid ${COLORS.bg};
                    padding: 16px;
                }
                .executive-table .ant-table-tbody > tr > td {
                    padding: 16px;
                }
                .action-btn {
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .action-btn:hover {
                    background: #f0fdf4 !important;
                }
                .action-btn-danger {
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .action-btn-danger:hover {
                    background: #fef2f2 !important;
                }
                .executive-upload .ant-upload-select {
                    border-radius: 12px !important;
                    border: 2px dashed ${COLORS.softBorder} !important;
                    background: #f8fafc !important;
                }
                .ant-modal-content {
                    border-radius: 24px !important;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.1) !important;
                }
            `}</style>
        </div>
    );
};

export default BranchPage;
