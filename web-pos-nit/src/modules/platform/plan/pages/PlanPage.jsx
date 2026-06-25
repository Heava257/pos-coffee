import React, { useEffect, useState } from "react";
import {
    Table,
    Card,
    Typography,
    Tag,
    Row,
    Col,
    Button,
    Modal,
    Form,
    InputNumber,
    Input,
    message,
    Space,
    Badge,
    Divider,
    Select,
    DatePicker,
    Tooltip
} from "antd";
import {
    CreditCardOutlined,
    EditOutlined,
    CheckCircleOutlined,
    ShopOutlined,
    UsergroupAddOutlined,
    ShoppingOutlined,
    CrownOutlined,
    TeamOutlined,
    MonitorOutlined,
    SyncOutlined,
    SettingOutlined,
    KeyOutlined,
    BankOutlined,
    PlusOutlined,
    QrcodeOutlined,
    MailOutlined
} from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import { Tabs, Checkbox } from "antd";
import { Config } from "@/shared/utils/config";
import dayjs from "dayjs";
import { Upload } from "lucide-react";
import { useLocation } from "react-router-dom";
const { TabPane } = Tabs;

const { Title, Text } = Typography;

const PlanPage = () => {
    const location = useLocation();
    const [plans, setPlans] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [systemForm] = Form.useForm();
    const [editingPlan, setEditingPlan] = useState(null);
    const [activeTab, setActiveTab] = useState(location.pathname === "/system-subscriptions" ? "monitoring" : "plans");
    const [systemSettings, setSystemSettings] = useState({});
    const [sysLoading, setSysLoading] = useState(false);
    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        if (location.pathname === "/system-subscriptions") {
            setActiveTab("monitoring");
        } else if (location.pathname === "/plans") {
            setActiveTab("plans");
        }
    }, [location.pathname]);

    useEffect(() => {
        fetchPlans();
        fetchSubscriptions();
        fetchSystemSettings();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        const res = await request("plans", "get");
        if (res && res.success) {
            setPlans(res.plans);
        }
        setLoading(false);
    };

    const fetchSubscriptions = async () => {
        const res = await request("system-subscriptions", "get");
        if (res && res.success) {
            setSubscriptions(res.list);
        }
    };

    const fetchSystemSettings = async () => {
        setSysLoading(true);
        const res = await request("system-settings", "get");
        if (res && res.success) {
            setSystemSettings(res.settings);
            systemForm.setFieldsValue(res.settings);
            if (res.settings.payway_khqr_image) {
                setFileList([{
                    uid: '-1',
                    name: 'khqr.png',
                    status: 'done',
                    url: Config.getFullImagePath(res.settings.payway_khqr_image),
                }]);
            }
        }
        setSysLoading(false);
    };

    const handleSaveSystemSettings = async (values) => {
        setSysLoading(true);
        const formData = new FormData();
        Object.keys(values).forEach(key => {
            if (values[key] !== undefined) formData.append(key, values[key]);
        });

        if (fileList.length > 0 && fileList[0].originFileObj) {
            formData.append("khqr_image", fileList[0].originFileObj);
        } else if (fileList.length === 0 && systemSettings.payway_khqr_image) {
            formData.append("image_remove", "1");
        }

        const res = await request("system-settings", "put", formData);
        if (res && res.success) {
            message.success("Master payment settings updated!");
            fetchSystemSettings();
        }
        setSysLoading(false);
    };

    const handleEdit = (record) => {
        setEditingPlan(record);
        form.setFieldsValue({
            ...record,
            active_modules: record.active_modules ? record.active_modules.split(",") : []
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                ...values,
                id: editingPlan.id,
                active_modules: values.active_modules ? values.active_modules.join(",") : ""
            };
            const res = await request("plans", "put", payload);
            if (res && res.success) {
                message.success("Plan updated successfully!");
                setIsModalOpen(false);
                fetchPlans();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const columns = [
        {
            title: "Plan Name",
            dataIndex: "name",
            key: "name",
            render: (text) => (
                <Space>
                    {text.includes("Pro") ? <CrownOutlined style={{ color: '#c0a060' }} /> : null}
                    <Text strong>{text}</Text>
                </Space>
            )
        },
        {
            title: "Price",
            dataIndex: "price",
            key: "price",
            render: (price, record) => <Text style={{ color: '#1e4a2d', fontWeight: 700 }}>${price}{record.billing_cycle === 'lifetime' ? ' (One-time)' : '/mo'}</Text>
        },
        {
            title: "Limits",
            key: "limits",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Tag icon={<ShopOutlined />} color="blue">
                        {record.max_branches === 999 ? "Unlimited" : record.max_branches} Branches
                    </Tag>
                    <Tag icon={<UsergroupAddOutlined />} color="green" style={{ marginTop: 4 }}>
                        {record.max_staff === 999 ? "Unlimited" : record.max_staff} Staff
                    </Tag>
                    <Tag icon={<ShoppingOutlined />} color="orange" style={{ marginTop: 4 }}>
                        {record.max_products === 9999 ? "Unlimited" : record.max_products} Products
                    </Tag>
                </Space>
            )
        },
        {
            title: "Status",
            dataIndex: "is_active",
            key: "status",
            render: (active) => (
                <Badge
                    status={active ? "success" : "default"}
                    text={active ? "Active" : "Inactive"}
                />
            )
        },
        {
            title: "Action",
            key: "action",
            align: 'center',
            render: (_, record) => (
                <Button
                    type="primary"
                    ghost
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                >
                    Config
                </Button>
            )
        }
    ];

    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState(null);
    const [subForm] = Form.useForm();

    const subColumns = [
        {
            title: "Business / Owner",
            key: "business",
            render: (_, row) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ color: '#1e4a2d' }}>{row.business_name}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{row.owner_name}</Text>
                </Space>
            )
        },
        {
            title: "Current Plan",
            dataIndex: "plan_name",
            render: (name) => <Tag color="green">{name}</Tag>
        },
        {
            title: "Expires On",
            dataIndex: "end_date",
            render: (date) => date ? dayjs(date).format("DD MMM YYYY") : "Lifetime"
        },
        {
            title: "Time Remaining",
            render: (_, row) => {
                if (!row.end_date) return <Text type="success">Permanent</Text>;
                const days = row.days_remaining;
                let color = "success";
                if (days < 0) color = "danger";
                else if (days <= 7) color = "warning";

                return (
                    <Text type={color}>
                        {days < 0 ? `Expired (${Math.abs(days)}d ago)` : `${days} days left`}
                    </Text>
                );
            }
        },
        {
            title: "Status",
            dataIndex: "sub_status",
            render: (status) => (
                <Tag color={status === 'active' ? 'success' : 'error'}>
                    {(status || 'ACTIVE').toUpperCase()}
                </Tag>
            )
        },
        {
            title: "Action",
            key: "action",
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Send Expiry Reminder">
                        <Button 
                            type="default" 
                            size="small" 
                            icon={<MailOutlined />} 
                            onClick={() => handleSendReminder(record)}
                        />
                    </Tooltip>
                    <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditSubscription(record)}
                    >
                        Modify
                    </Button>
                </Space>
            )
        }
    ];

    const handleSendReminder = (record) => {
        Modal.confirm({
            title: `Send Reminder to ${record.business_name}?`,
            content: `This will manually trigger an email to the business owner to remind them about their subscription status.`,
            okText: "Send Email",
            onOk: async () => {
                try {
                    const res = await request("system-subscriptions/send-reminder", "post", { business_id: record.business_id });
                    if (res && res.success) {
                        message.success(res.message);
                    } else {
                        message.error(res?.message || "Failed to send reminder");
                    }
                } catch (error) {
                    message.error(error.message || "Failed to send reminder");
                }
            }
        });
    };

    const handleEditSubscription = (record) => {
        setEditingSubscription(record);
        subForm.setFieldsValue({
            business_id: record.business_id,
            plan_id: plans.find(p => p.name === record.plan_name)?.id,
            end_date: record.end_date ? dayjs(record.end_date) : null,
            status: record.sub_status || 'active'
        });
        setIsSubModalOpen(true);
    };

    const handleSaveSubscription = async () => {
        try {
            const values = await subForm.validateFields();
            const res = await request("system-subscriptions", "put", {
                ...values,
                business_id: editingSubscription.business_id,
                end_date: values.end_date ? values.end_date.format("YYYY-MM-DD") : null
            });
            if (res && res.success) {
                message.success("Subscription updated successfully!");
                setIsSubModalOpen(false);
                fetchSubscriptions();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ padding: "0 20px" }}>
            <Card
                style={{
                    borderRadius: "24px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
                    border: 'none',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f9fbf9 100%)'
                }}
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    tabBarExtraContent={
                        <Button type="primary" onClick={activeTab === 'plans' ? fetchPlans : fetchSubscriptions} ghost icon={<SyncOutlined />}>
                            Sync Data
                        </Button>
                    }
                >
                    <TabPane
                        tab={<span><CreditCardOutlined />Plan Definitions</span>}
                        key="plans"
                    >
                        <Table
                            columns={columns}
                            dataSource={plans}
                            rowKey="id"
                            loading={loading}
                            pagination={false}
                            className="premium-table"
                        />
                        <Divider />
                        <div style={{ background: '#f4f1eb', padding: '20px', borderRadius: '16px' }}>
                            <Title level={4}>Plan Features Logic</Title>
                            <ul>
                                <li><Text strong>Free Plan:</Text> Designed for single-shop testers. Hard limit of 1 branch.</li>
                                <li><Text strong>Pro Plan:</Text> For growing businesses. Increases staff and product capacity significantly.</li>
                                <li><Text strong>Enterprise:</Text> Custom pricing, virtually unlimited resources.</li>
                            </ul>
                        </div>
                    </TabPane>

                    <TabPane
                        tab={<span><MonitorOutlined />Client Subscriptions</span>}
                        key="monitoring"
                    >
                        <div style={{ marginBottom: 16 }}>
                            <Title level={4}>SaaS Customer Monitor</Title>
                            <Text type="secondary">Track global business health and upcoming expirations.</Text>
                        </div>
                        <Table
                            columns={subColumns}
                            dataSource={subscriptions}
                            rowKey="business_id"
                            loading={loading}
                        />
                    </TabPane>

                    <TabPane
                        tab={<span><SettingOutlined />Master Payment API</span>}
                        key="payment_api"
                    >
                        <div style={{ padding: '0 10px' }}>
                            <div style={{ marginBottom: 20 }}>
                                <Title level={4}>Platform Master Payment Setup</Title>
                                <Text type="secondary">Configure your bank credentials to receive plan upgrade payments from all clients.</Text>
                            </div>

                            <Card style={{ borderRadius: 16, border: '1px solid #f0f0f0', background: '#fdfdfd' }}>
                                <Form form={systemForm} layout="vertical" onFinish={handleSaveSystemSettings}>
                                    <Row gutter={24}>
                                        <Col span={12}>
                                            <Form.Item name="payway_merchant_id" label="Merchant ID" tooltip="Your ABA PayWay or Bank Merchant ID">
                                                <Input prefix={<BankOutlined />} placeholder="e.g. M123456" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="payway_receiver_name" label="Receiver Name" tooltip="The name displayed to customers in bank apps">
                                                <Input prefix={<TeamOutlined />} placeholder="e.g. COFFEE SaaS PLATFORM" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item name="payway_api_key" label="API Token Key (Master)" tooltip="The secret API key for dynamic transaction generation">
                                                <Input.Password prefix={<KeyOutlined />} placeholder="Your Secret API Key" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item name="telegram_support_link" label="Telegram Support Link" tooltip="Link for clients to contact for manual/payment queries (e.g. https://t.me/your_telegram_username)">
                                                <Input prefix={<MailOutlined />} placeholder="e.g. https://t.me/your_telegram_username" />
                                            </Form.Item>
                                        </Col>

                                        <Col span={24}>
                                            <Divider orientation="left" style={{ fontSize: 13, color: '#999' }}>ABA Personal Account Notification Reader (Gmail IMAP)</Divider>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="payment_imap_user" label="Gmail Address" tooltip="Gmail account that receives ABA transaction email notifications">
                                                <Input placeholder="e.g. growme.payment@gmail.com" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="payment_imap_pass" label="Gmail App Password" tooltip="Gmail App Password (16 characters) created in Google Account Settings">
                                                <Input.Password placeholder="e.g. abcd efgh ijkl mnop" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="payment_imap_host" label="IMAP Host" tooltip="IMAP server address. Default is imap.gmail.com">
                                                <Input placeholder="imap.gmail.com" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="payment_imap_port" label="IMAP Port" tooltip="IMAP port. Default is 993">
                                                <Input placeholder="993" />
                                            </Form.Item>
                                        </Col>

                                        <Col span={24}>
                                            <Divider orientation="left" style={{ fontSize: 13, color: '#999' }}>Master KHQR Image (Fallback)</Divider>
                                            <Form.Item label="Upload Platform QR">
                                                <Upload
                                                    listType="picture-card"
                                                    fileList={fileList}
                                                    onChange={({ fileList }) => setFileList(fileList)}
                                                    beforeUpload={() => false}
                                                    maxCount={1}
                                                >
                                                    {fileList.length < 1 && (
                                                        <div>
                                                            <PlusOutlined />
                                                            <div style={{ marginTop: 8 }}>Upload QR</div>
                                                        </div>
                                                    )}
                                                </Upload>
                                                <Text type="secondary" style={{ fontSize: 11 }}>This image will be shown if dynamic QR generation is disabled or fails.</Text>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={sysLoading}
                                        icon={<CheckCircleOutlined />}
                                        style={{ height: 40, borderRadius: 8, background: '#1e4a2d' }}
                                    >
                                        Save Master Configuration
                                    </Button>
                                </Form>
                            </Card>

                            <div style={{ marginTop: 24, padding: 16, background: '#e6f7ff', borderRadius: 12, border: '1px solid #91d5ff' }}>
                                <Space align="start">
                                    <QrcodeOutlined style={{ fontSize: 20, color: '#1890ff', marginTop: 4 }} />
                                    <div>
                                        <Text strong>Automatic Amount Detection</Text><br />
                                        <Text size="small" type="secondary">When configured, the system will automatically generate a dynamic KHQR with the exact plan price (e.g. $29.00) when a client clicks upgrade. This prevents manual entry errors and speeds up the checkout process.</Text>
                                    </div>
                                </Space>
                            </div>
                        </div>
                    </TabPane>
                </Tabs>
            </Card>

            <Modal
                title={`Configure ${editingPlan?.name}`}
                open={isModalOpen}
                onOk={handleSave}
                onCancel={() => setIsModalOpen(false)}
                okText="Save Configuration"
                width={500}
                bodyStyle={{ paddingTop: 20 }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="Plan Name" rules={[{ required: true }]}>
                        <Input placeholder="Plan Name" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="max_branches" label="Max Branches" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={1} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="max_staff" label="Max Staff" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={1} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="max_products" label="Max Products" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={1} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="price" label="Price ($)" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider orientation="left" style={{ fontSize: 13, color: '#999' }}>Included Modules</Divider>
                    <Form.Item name="active_modules">
                        <Checkbox.Group style={{ width: '100%' }}>
                            <Row gutter={[16, 16]}>
                                <Col span={12}><Checkbox value="POS">Core POS System</Checkbox></Col>
                                <Col span={12}><Checkbox value="ORDERING">Web QR Ordering</Checkbox></Col>
                                <Col span={12}><Checkbox value="INVENTORY">Advanced Inventory</Checkbox></Col>
                                <Col span={12}><Checkbox value="CRM">Marketing & CRM</Checkbox></Col>
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Manual Subscription Override Modal */}
            <Modal
                title={
                    <span>
                        <EditOutlined style={{ marginRight: 8, color: '#1e4a2d' }} />
                        Manual Subscription Override: <Text type="warning">{editingSubscription?.business_name}</Text>
                    </span>
                }
                open={isSubModalOpen}
                onOk={handleSaveSubscription}
                onCancel={() => setIsSubModalOpen(false)}
                okText="Update Subscription"
                width={450}
            >
                <Form form={subForm} layout="vertical">
                    <Form.Item name="plan_id" label="Assigned Plan" rules={[{ required: true }]}>
                        <Select placeholder="Select Plan">
                            {plans.map(p => (
                                <Select.Option key={p.id} value={p.id}>
                                    {p.name} (${p.price}/{p.billing_cycle})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="end_date" label="Expiry Date" tooltip="Set to empty for Lifetime access">
                        <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                    </Form.Item>

                    <Form.Item name="status" label="Account Status" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="active">Active (Full Access)</Select.Option>
                            <Select.Option value="expired">Expired (Restricted)</Select.Option>
                            <Select.Option value="suspended">Suspended (Locked)</Select.Option>
                        </Select>
                    </Form.Item>

                    <div style={{ padding: '12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, fontSize: '12px' }}>
                        <Text type="warning" strong>Note:</Text> Manual changes here will override automatic billing cycles. The customer's role permissions will be synchronized to the new plan tier automatically.
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default PlanPage;
