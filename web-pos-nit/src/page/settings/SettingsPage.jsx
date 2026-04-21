import React, { useEffect, useState } from "react";
import {
    Form,
    Input,
    Button,
    Upload,
    message,
    Card,
    Row,
    Col,
    Typography,
    Divider,
    Space,
    InputNumber,
    Select,
    Avatar,
    Tabs,
    Switch
} from "antd";
import CategoryManageTab from "./CategoryManageTab";
import {
    SettingOutlined,
    ShopOutlined,
    GlobalOutlined,
    SaveOutlined,
    CameraOutlined,
    PercentageOutlined,
    DollarOutlined,
    PhoneOutlined,
    MailOutlined,
    FacebookOutlined,
    SendOutlined,
    PrinterOutlined,
    RocketOutlined,
    OrderedListOutlined,
    CheckCircleOutlined,
    InfoCircleOutlined,
    MobileOutlined,
    NotificationOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { Config } from "../../util/config";
import { getProfile } from "../../store/profile.store";
import { useProfileStore } from "../../store/profileStore";
import { useExchangeRate } from "../../component/pos/ExchangeRateContext";
import { getPrinterSettings, setPrinterSettings } from "../../store/printer.store";

const { Title, Text } = Typography;
const { Option } = Select;

const SettingsPage = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [settings, setSettings] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [testLoading, setTestLoading] = useState(false);
    const { setProfile } = useProfileStore();
    const { refreshRate } = useExchangeRate();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setFetching(true);
        try {
            const res = await request("settings", "get");
            if (res && res.settings) {
                setSettings(res.settings);
                form.setFieldsValue(res.settings);

                // NEW: Sync local profile store whenever settings are fetched
                const currentProfile = getProfile() || {};
                const updatedProfile = {
                    ...currentProfile,
                    business_name: res.settings.name,
                    address: res.settings.address,
                    tel: res.settings.phone,
                    phone: res.settings.phone,
                    email: res.settings.email,
                    business_logo: res.settings.logo || currentProfile.business_logo
                };
                setProfile(updatedProfile);

                if (res.settings.logo && res.settings.logo !== "null" && res.settings.logo !== "undefined") {
                    setPreviewUrl(Config.getFullImagePath(res.settings.logo));
                } else {
                    setPreviewUrl(null);
                }
            }
        } catch (error) {
            console.error("Fetch settings error:", error);
            message.error("Failed to load business settings");
        } finally {
            setFetching(false);
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();
            Object.keys(values).forEach(key => {
                if (values[key] !== undefined && values[key] !== null) {
                    formData.append(key, values[key]);
                }
            });

            if (imageFile) {
                formData.append("upload_logo", imageFile);
            }

            const res = await request("settings", "put", formData);
            if (res && res.success) {
                message.success("Settings updated successfully!");

                // Update Local Profile for real-time changes
                const currentProfile = getProfile() || {};
                const updatedProfile = {
                    ...currentProfile,
                    business_name: values.name,
                    address: values.address,
                    tel: values.phone,
                    phone: values.phone,
                    email: values.email,
                    business_logo: res.logo || currentProfile.business_logo
                };
                setProfile(updatedProfile);

                fetchSettings();
                refreshRate();
            }
        } catch (error) {
            console.error("Update settings error:", error);
            message.error("Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    const handleTestTelegram = async () => {
        const token = form.getFieldValue("telegram_token");
        const chatId = form.getFieldValue("telegram_chat_id");
        const mode = form.getFieldValue("telegram_mode");
        const webhookUrl = form.getFieldValue("telegram_webhook_url");

        if (!token || !chatId) {
            message.warning("Please fill in Telegram Token and Chat ID first!");
            return;
        }

        setTestLoading(true);
        try {
            const res = await request("settings/test-telegram", "post", {
                telegram_token: token,
                telegram_chat_id: chatId,
                telegram_mode: mode,
                telegram_webhook_url: webhookUrl
            });
            if (res && res.success) {
                message.success(res.message);
            } else {
                message.error(res.message || "Test failed");
            }
        } catch (error) {
            console.error("Test telegram error:", error);
            message.error(error.message || "Failed to connect to Telegram bot");
        } finally {
            setTestLoading(false);
        }
    };

    const handleLogoChange = (info) => {
        const file = info.file.originFileObj || info.file;
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setPreviewUrl(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    if (fetching) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
                <Card loading={true} style={{ width: 400 }} />
            </div>
        );
    }

    const profile = getProfile();
    const isAdmin = profile?.business_id === 1;

    return (
        <div style={{ padding: "32px", background: "#f4f1eb", minHeight: "100vh" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ marginBottom: "24px" }}>
                    <Title level={2} style={{ color: "#1e4a2d", display: "flex", alignItems: "center", gap: "12px" }}>
                        <SettingOutlined /> General Settings / ការកំណត់ទូទៅ
                    </Title>
                    <Text type="secondary">Manage your business information and Point of Sale configurations</Text>
                </div>

                <Tabs
                    defaultActiveKey="general"
                    size="large"
                    style={{ background: "#fff", borderRadius: 20, padding: "0 24px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                    items={[
                        {
                            key: "general",
                            label: <span><SettingOutlined /> ការកំណត់ / General</span>,
                            children: (
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={onFinish}
                                    requiredMark={false}
                                    style={{ paddingTop: 24, paddingBottom: 24 }}
                                >
                                    <Row gutter={24}>
                                        {/* Left Column: Business Info */}
                                        <Col xs={24} lg={16}>
                                            <Card
                                                title={<Space><ShopOutlined /> Business Information</Space>}
                                                style={{ borderRadius: "16px", marginBottom: "24px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                                            >
                                                <Row gutter={16}>
                                                    <Col xs={24} md={6}>
                                                        <div style={{ textAlign: "center", marginBottom: "20px" }}>
                                                            <Text strong style={{ display: "block", marginBottom: "12px" }}>Business Logo</Text>
                                                            <div style={{ position: "relative", display: "inline-block" }}>
                                                                <Avatar
                                                                    size={120}
                                                                    shape="square"
                                                                    src={previewUrl}
                                                                    icon={<ShopOutlined />}
                                                                    style={{
                                                                        borderRadius: "12px",
                                                                        border: "1px solid #e8e3d8",
                                                                        background: "#fff",
                                                                        color: "#1e4a2d"
                                                                    }}
                                                                />
                                                                <Upload
                                                                    showUploadList={false}
                                                                    beforeUpload={() => false}
                                                                    onChange={handleLogoChange}
                                                                >
                                                                    <Button
                                                                        size="small"
                                                                        shape="circle"
                                                                        icon={<CameraOutlined />}
                                                                        style={{ position: "absolute", bottom: -10, right: -10, background: "#c0a060", color: "#fff", border: "none" }}
                                                                    />
                                                                </Upload>
                                                            </div>
                                                        </div>
                                                    </Col>

                                                    <Col xs={24} md={18}>
                                                        <Row gutter={16}>
                                                            <Col xs={24} md={12}>
                                                                <Form.Item label="Business Name" name="name" rules={[{ required: true }]}>
                                                                    <Input placeholder="e.g. Green Grounds Coffee" size="large" />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col xs={24} md={12}>
                                                                <Form.Item label="Owner Name" name="owner_name">
                                                                    <Input placeholder="System Owner Name" size="large" />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col xs={24} md={12}>
                                                                <Form.Item label="Phone Number" name="phone">
                                                                    <Input prefix={<PhoneOutlined />} placeholder="012 345 678" size="large" />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col xs={24} md={12}>
                                                                <Form.Item label="Email Address" name="email">
                                                                    <Input prefix={<MailOutlined />} placeholder="business@example.com" size="large" />
                                                                </Form.Item>
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                    <Col xs={24}>
                                                        <Form.Item label="Address" name="address">
                                                            <Input.TextArea rows={2} placeholder="No. 123, St 456, Phnom Penh" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col xs={24} md={12}>
                                                        <Form.Item label="Website / URL" name="website">
                                                            <Input prefix={<GlobalOutlined />} placeholder="https://www.example.com" size="large" />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </Card>

                                            <Card
                                                title={<Space><GlobalOutlined /> Social & Online Connectivity</Space>}
                                                style={{ borderRadius: "16px", marginBottom: "24px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                                            >
                                                <Row gutter={16}>
                                                    <Col xs={24} md={12}>
                                                        <Form.Item label="Telegram Channel/Bot Link" name="telegram_link">
                                                            <Input prefix={<SendOutlined style={{ color: '#0088cc' }} />} placeholder="https://t.me/yourcoffee" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col xs={24} md={12}>
                                                        <Form.Item label="Facebook Page" name="facebook_link">
                                                            <Input prefix={<FacebookOutlined style={{ color: '#1877f2' }} />} placeholder="https://fb.com/yourpage" />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </Card>

                                            <Card
                                                title={
                                                    <Space>
                                                        <SendOutlined style={{ color: '#0088cc' }} />
                                                        <span>Telegram Bot Notifications (Order Alerts)</span>
                                                    </Space>
                                                }
                                                extra={
                                                    <Button 
                                                        type="primary" 
                                                        ghost 
                                                        size="small"
                                                        loading={testLoading}
                                                        onClick={handleTestTelegram}
                                                    >
                                                        Test Connection
                                                    </Button>
                                                }
                                                style={{ borderRadius: "16px", marginBottom: "24px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                                            >
                                                <div style={{ marginBottom: 16, padding: '10px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 8, fontSize: 13 }}>
                                                    <Space align="start">
                                                        <InfoCircleOutlined style={{ color: '#1890ff', marginTop: 3 }} />
                                                        <div>
                                                            Get your <b>Bot Token</b> from <a href="https://t.me/botfather" target="_blank" rel="noreferrer">@BotFather</a> and your <b>Chat ID</b> from <a href="https://t.me/GetIDsBot" target="_blank" rel="noreferrer">@GetIDsBot</a>.
                                                        </div>
                                                    </Space>
                                                </div>
                                                <Row gutter={16}>
                                                    <Col xs={24} md={12}>
                                                        <Form.Item
                                                            label="Telegram Bot Token"
                                                            name="telegram_token"
                                                            tooltip="Example: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                                                        >
                                                            <Input.Password placeholder="Enter your bot token here" size="large" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col xs={24} md={12}>
                                                        <Form.Item
                                                            label="Telegram Chat ID"
                                                            name="telegram_chat_id"
                                                            tooltip="Can be a private chat ID or a Group/Channel ID (must start with -100 for groups)"
                                                        >
                                                            <Input placeholder="e.g. -100123456789" size="large" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col xs={24} md={12}>
                                                        <Form.Item label="Listening Mode" name="telegram_mode">
                                                            <Select size="large">
                                                                <Option value="polling">Stable Mode (Polling) - Works Everywhere</Option>
                                                                <Option value="webhook">Real-time Mode (Webhook) - Fast but needs URL</Option>
                                                            </Select>
                                                        </Form.Item>
                                                    </Col>
                                                    <Col xs={24} md={12}>
                                                        <Form.Item 
                                                            label="Server Webhook URL" 
                                                            name="telegram_webhook_url"
                                                            tooltip="Only used for Webhook mode. Must be a public HTTPS URL."
                                                        >
                                                            <Input prefix={<RocketOutlined />} placeholder="https://your-api.com" size="large" />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        </Col>

                                        {/* Right Column: POS Configuration */}
                                        <Col xs={24} lg={8}>
                                            <Card
                                                title={<Space><DollarOutlined /> POS & Financial Config</Space>}
                                                style={{ borderRadius: "16px", marginBottom: "24px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                                            >
                                                <Form.Item label="Currency Symbol" name="currency_symbol">
                                                    <Select size="large">
                                                        <Option value="$">$ (USD)</Option>
                                                        <Option value="៛">៛ (KHR)</Option>
                                                        <Option value="฿">฿ (THB)</Option>
                                                    </Select>
                                                </Form.Item>

                                                <Form.Item
                                                    label="Exchange Rate (1 USD = ? KHR)"
                                                    name="kh_exchange_rate"
                                                >
                                                    <InputNumber
                                                        style={{ width: "100%" }}
                                                        size="large"
                                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                                    />
                                                </Form.Item>

                                                <Divider />

                                                <Form.Item label="VAT / Tax (%)" name="tax_percent">
                                                    <InputNumber
                                                        style={{ width: "100%" }}
                                                        size="large"
                                                        min={0}
                                                        max={100}
                                                        prefix={<PercentageOutlined />}
                                                    />
                                                </Form.Item>

                                                <Form.Item label="Service Charge (%)" name="service_charge">
                                                    <InputNumber
                                                        style={{ width: "100%" }}
                                                        size="large"
                                                        min={0}
                                                        max={100}
                                                        prefix={<PercentageOutlined />}
                                                    />
                                                </Form.Item>
                                            </Card>

                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                loading={loading}
                                                icon={<SaveOutlined />}
                                                size="large"
                                                style={{
                                                    width: "100%",
                                                    height: "56px",
                                                    borderRadius: "12px",
                                                    background: "#1e4a2d",
                                                    borderColor: "#1e4a2d",
                                                    boxShadow: "0 8px 20px rgba(30,74,45,0.2)"
                                                }}
                                            >
                                                Save All Changes
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                            )
                        },
                        {
                            key: "printer",
                            label: <span><PrinterOutlined /> ម៉ាស៊ីនព្រីន / Printer</span>,
                            children: (
                                <PrinterSettingsTab />
                            )
                        },
                        {
                            key: "promo",
                            label: <span><MobileOutlined /> Mobile App & Promo</span>,
                            children: (
                                <div style={{ paddingTop: 24, paddingBottom: 24 }}>
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        onFinish={onFinish}
                                        requiredMark={false}
                                    >
                                        <Row gutter={24}>
                                            <Col xs={24} md={16}>
                                                <Card 
                                                    title={<Space><NotificationOutlined /> Home Banner Promotion</Space>}
                                                    style={{ borderRadius: "16px", marginBottom: "24px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                                                    extra={
                                                        <Form.Item name="promo_is_active" valuePropName="checked" noStyle>
                                                            <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
                                                        </Form.Item>
                                                    }
                                                >
                                                    <Row gutter={16}>
                                                        <Col xs={24} md={12}>
                                                            <Form.Item label="Promotion Title (Khmer/English)" name="promo_title" tooltip="e.g. ឆុងថ្មីៗក្តៅៗ or Fresh Brewed">
                                                                <Input placeholder="Enter primary title" size="large" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col xs={24} md={12}>
                                                            <Form.Item label="Subtitle/Discount Text" name="promo_subtitle" tooltip="e.g. ក្តីសុខ or Happiness">
                                                                <Input placeholder="Enter subtitle" size="large" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col xs={24} md={12}>
                                                            <Form.Item label="Discount Amount" name="promo_discount" tooltip="e.g. 50% or Buy 1 Get 1">
                                                                <Input prefix={<PercentageOutlined />} placeholder="50%" size="large" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col xs={24} md={24}>
                                                            <Form.Item label="Banner Image URL" name="promo_image" tooltip="Provide a high-quality image URL for the banner">
                                                                <Input prefix={<GlobalOutlined />} placeholder="https://images.unsplash.com..." size="large" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col xs={24}>
                                                            <Divider orientation="left" style={{ borderTopColor: '#f0ede6', color: '#c0a060' }}>
                                                                <PercentageOutlined /> Store-wide Global Discount
                                                            </Divider>
                                                            <div style={{ background: '#fffbe6', padding: '16px', borderRadius: 12, border: '1px solid #ffe58f' }}>
                                                                <Row gutter={16} align="middle">
                                                                    <Col xs={24} md={16}>
                                                                        <Text strong>Apply Discount to ALL Products</Text>
                                                                        <br />
                                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                                            This will automatically discount every item in your shop by the specified percentage. 
                                                                            Individual product discounts will be overridden.
                                                                        </Text>
                                                                    </Col>
                                                                    <Col xs={24} md={8}>
                                                                        <Form.Item name="global_discount" noStyle>
                                                                            <InputNumber 
                                                                                min={0} max={100} 
                                                                                formatter={value => `${value}%`}
                                                                                parser={value => value.replace('%', '')}
                                                                                style={{ width: '100%' }} size="large" 
                                                                            />
                                                                        </Form.Item>
                                                                    </Col>
                                                                </Row>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                    
                                                    <div style={{ marginTop: 16, padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 12 }}>
                                                        <Title level={5} style={{ color: '#52c41a' }}><RocketOutlined /> Preview Guide</Title>
                                                        <Text size="small" type="secondary">
                                                            This promotion will appear on the guest app home screen. Ensure the image is horizontal for best results.
                                                        </Text>
                                                    </div>
                                                </Card>
                                            </Col>
                                            <Col xs={24} md={8}>
                                                <Card 
                                                    title="Quick Actions" 
                                                    style={{ borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                                                >
                                                    <Button
                                                        type="primary"
                                                        htmlType="submit"
                                                        loading={loading}
                                                        icon={<SaveOutlined />}
                                                        size="large"
                                                        style={{
                                                            width: "100%",
                                                            height: "56px",
                                                            borderRadius: "12px",
                                                            background: "#1e4a2d",
                                                            borderColor: "#1e4a2d"
                                                        }}
                                                    >
                                                        Save Promotion
                                                    </Button>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Form>
                                </div>
                            )
                        },
                        isAdmin && {
                            key: "categories",
                            label: <span>🏷️ Category / ប្រភេទទំនិញ</span>,
                            children: (
                                <div style={{ paddingTop: 24, paddingBottom: 24 }}>
                                    <CategoryManageTab targetBusinessId={profile?.business_id} />
                                </div>
                            )
                        }
                    ].filter(Boolean)}
                />
            </div>
        </div>
    );
};

// --- NEW COMPONENT: PrinterSettingsTab ---
const PrinterSettingsTab = () => {
    const [pSettings, setPSettings] = useState(getPrinterSettings());

    const updateSetting = (key, value) => {
        const newSettings = { ...pSettings, [key]: value };
        setPSettings(newSettings);
        setPrinterSettings(newSettings);
        message.success("Printer settings updated locally!");
    };

    return (
        <div style={{ paddingTop: 24, paddingBottom: 24, maxWidth: 800 }}>
            <Title level={4}><PrinterOutlined /> Printing Workflow Configuration</Title>
            <Divider />

            <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                    <Card
                        hoverable
                        style={{ borderRadius: 16, border: '1px solid #e8e3d8' }}
                        title={<Space><RocketOutlined style={{ color: '#1e4a2d' }} /> Automation</Space>}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <Text strong>Auto Print on Checkout</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>Automatically trigger print dialog after each sale</Text>
                            </div>
                            <Switch
                                checked={pSettings.auto_print}
                                onChange={(val) => updateSetting('auto_print', val)}
                                checkedChildren="ON"
                                unCheckedChildren="OFF"
                            />
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card
                        hoverable
                        style={{ borderRadius: 16, border: '1px solid #e8e3d8' }}
                        title={<Space><OrderedListOutlined style={{ color: '#c0a060' }} /> Execution Order</Space>}
                    >
                        <Form layout="vertical">
                            <Form.Item label="Which should print first?">
                                <Select
                                    size="large"
                                    value={pSettings.label_first ? 'label' : 'invoice'}
                                    onChange={(val) => updateSetting('label_first', val === 'label')}
                                >
                                    <Option value="label">Label (Sticker) First</Option>
                                    <Option value="invoice">Invoice (Receipt) First</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24}>
                    <Card
                        title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> Document Availability</Space>}
                        style={{ borderRadius: 16, border: '1px solid #e8e3d8' }}
                    >
                        <Row gutter={24}>
                            <Col xs={24} sm={12}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                                    <Text>Enable Customer Invoice</Text>
                                    <Switch
                                        checked={pSettings.invoice_enabled}
                                        onChange={(val) => updateSetting('invoice_enabled', val)}
                                    />
                                </div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                                    <Text>Enable Cup Labels (Stickers)</Text>
                                    <Switch
                                        checked={pSettings.label_enabled}
                                        onChange={(val) => updateSetting('label_enabled', val)}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            <div style={{ marginTop: 40, padding: 20, background: '#fffbe6', borderRadius: 12, border: '1px solid #ffe58f' }}>
                <Text type="warning" strong>💡 Pro Tip:</Text>
                <br />
                <Text size="small">
                    For maximum speed during busy hours, enable <b>Auto Print</b> and set <b>Label First</b>.
                    Combine this with browser "Kiosk Printing" for a truly silent experience.
                </Text>
            </div>
        </div>
    );
};

export default SettingsPage;
