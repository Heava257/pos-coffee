import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
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
    Switch,
    DatePicker
} from "antd";
import CategoryManageTab from "@/modules/administration/user/components/CategoryManageTab";
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
    NotificationOutlined,
    ShoppingOutlined,
    GiftOutlined,
    CalendarOutlined,
    BgColorsOutlined,
    UploadOutlined,
    FileImageOutlined,
    CloseOutlined
} from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import { Config } from "@/shared/utils/config";
import { getProfile } from "@/app/store/profile.store";
import { useProfileStore } from "@/app/store/profileStore";
import { useExchangeRate } from "@/app/providers/ExchangeRateProvider";
import { getPrinterSettings, setPrinterSettings } from "@/app/store/printer.store";
import defaultLogo from "@/assets/business_default_logo.png";
import { useLanguage, translations } from "@/app/store/language.store";

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
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const { setProfile } = useProfileStore();
    const { refreshRate } = useExchangeRate();
    const { lang } = useLanguage();
    const t = translations[lang];

    const profile = getProfile();
    const isAdmin = profile?.business_id === 1;

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setFetching(true);
        try {
            const res = await request("settings", "get");
            if (res && res.settings) {
                setSettings(res.settings);

                const parsedSettings = {
                    ...res.settings,
                    promo_applied_categories: res.settings.promo_applied_categories ? JSON.parse(res.settings.promo_applied_categories) : [],
                    promo_applied_products: res.settings.promo_applied_products ? JSON.parse(res.settings.promo_applied_products) : [],
                    discount_applied_categories: res.settings.discount_applied_categories ? JSON.parse(res.settings.discount_applied_categories) : [],
                    discount_applied_products: res.settings.discount_applied_products ? JSON.parse(res.settings.discount_applied_products) : [],
                    promo_start_date: res.settings.promo_start_date ? dayjs(res.settings.promo_start_date) : null,
                    promo_end_date: res.settings.promo_end_date ? dayjs(res.settings.promo_end_date) : null,
                };
                form.setFieldsValue(parsedSettings);

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
                    setPreviewUrl(defaultLogo);
                }
            }

            // Only fetch categories and products for regular shop admins, not platform super admins
            if (!isAdmin) {
                const [catRes, prodRes] = await Promise.all([
                    request("category", "get"),
                    request("product", "get", { is_list_all: 1 })
                ]);
                if (catRes && catRes.list) setCategories(catRes.list);
                if (prodRes && prodRes.list) setProducts(prodRes.list);
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
                    let val = values[key];
                    // Handle dayjs objects
                    if (val && typeof val === 'object' && val.format) {
                        val = val.format("YYYY-MM-DD");
                    }
                    // Handle arrays (JSON stringify)
                    else if (Array.isArray(val)) {
                        // Special check for specific keys to ensure they are stringified even if empty
                        val = JSON.stringify(val);
                    }
                    // Handle booleans (Convert true/false to 1/0 for MySQL)
                    else if (typeof val === 'boolean') {
                        val = val ? 1 : 0;
                    }
                    formData.append(key, val);
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

    return (
        <div style={{ padding: "32px", background: "#f4f1eb", minHeight: "100vh" }}>
            <div style={{ maxWidth: "100%", margin: "0 auto" }}>
                <div style={{ marginBottom: "24px" }}>
                    <Title level={2} style={{ color: "#1e4a2d", display: "flex", alignItems: "center", gap: "12px" }}>
                        <SettingOutlined /> {t.menu_setting}
                    </Title>
                    <Text type="secondary">{t.general_settings_desc}</Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                >
                    <Tabs
                        defaultActiveKey="general"
                        size="large"
                        items={[
                            {
                                key: "general",
                                label: <span><SettingOutlined /> {t.general_settings}</span>,
                                children: (
                                    <div style={{ paddingTop: 24, paddingBottom: 24 }}>
                                        <Row gutter={24}>
                                            {/* Left Column: Business Info */}
                                            <Col xs={24} lg={16}>
                                                <Card
                                                    title={<Space><ShopOutlined /> {t.business_info_header}</Space>}
                                                    style={{ borderRadius: "16px", marginBottom: "24px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                                                >
                                                    <Row gutter={16}>
                                                        <Col xs={24} md={6}>
                                                            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                                                                <Text strong style={{ display: "block", marginBottom: "12px" }}>{t.logo || 'Business Logo'}</Text>
                                                                <div style={{ position: "relative", display: "inline-block" }}>
                                                                    <Avatar
                                                                        size={120}
                                                                        shape="square"
                                                                        src={previewUrl || defaultLogo}
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
                                                                    <Form.Item label={t.business_name_label} name="name" rules={[{ required: true }]}>
                                                                        <Input placeholder="e.g. Green Grounds Coffee" size="large" />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col xs={24} md={12}>
                                                                    <Form.Item label={t.owner_name_label} name="owner_name">
                                                                        <Input placeholder="System Owner Name" size="large" />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col xs={24} md={12}>
                                                                    <Form.Item label={t.phone_number_label} name="phone" rules={[{ required: true }]}>
                                                                        <Input prefix={<PhoneOutlined />} placeholder="012 345 678" size="large" />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col xs={24} md={12}>
                                                                    <Form.Item label={t.email_address_label} name="email">
                                                                        <Input prefix={<MailOutlined />} placeholder="business@example.com" size="large" />
                                                                    </Form.Item>
                                                                </Col>
                                                            </Row>
                                                        </Col>
                                                        <Col xs={24}>
                                                            <Form.Item label={t.address_label} name="address">
                                                                <Input.TextArea rows={2} placeholder="No. 123, St 456, Phnom Penh" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col xs={24} md={12}>
                                                            <Form.Item label={t.website_url_label} name="website">
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
                                                    title={<Space><DollarOutlined /> {t.pos_financial_config_header}</Space>}
                                                    style={{ borderRadius: "16px", marginBottom: "24px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                                                >
                                                    <Form.Item label={t.currency_symbol_label} name="currency_symbol">
                                                        <Select size="large">
                                                            <Option value="$">$ (USD)</Option>
                                                            <Option value="៛">៛ (KHR)</Option>
                                                            <Option value="฿">฿ (THB)</Option>
                                                        </Select>
                                                    </Form.Item>

                                                    <Form.Item
                                                        label={t.exchange_rate_label}
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

                                                    <Form.Item label={t.vat_tax_label} name="tax_percent">
                                                        <InputNumber
                                                            style={{ width: "100%" }}
                                                            size="large"
                                                            min={0}
                                                            max={100}
                                                            prefix={<PercentageOutlined />}
                                                        />
                                                    </Form.Item>

                                                    <Form.Item label={t.service_charge_label} name="service_charge">
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
                                                    {t.save_all_changes_btn}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </div>
                                )
                            },
                            {
                                key: "theme_customization",
                                label: <span><BgColorsOutlined /> {lang === "kh" ? "រចនាបថពណ៌" : "Theme Style"}</span>,
                                children: (
                                    <ThemeCustomizerTab lang={lang} t={t} />
                                )
                            },
                            !isAdmin && {
                                key: "printer",
                                label: <span className="tour-settings-printer-tab"><PrinterOutlined /> {t.printer_settings || 'Printer'}</span>,
                                children: (
                                    <PrinterSettingsTab />
                                )
                            },
                            (!isAdmin && profile?.plan_id >= 2) && {
                                key: "promo",
                                label: <span className="tour-settings-promo-tab"><MobileOutlined /> {t.mobile_app_promo_tab}</span>,
                                forceRender: true, // Ensure fields are registered
                                children: (
                                    <div style={{ paddingTop: 24, paddingBottom: 24 }}>
                                        <Row gutter={24}>
                                            <Col xs={24} md={16}>
                                                <Card
                                                    title={<Space><NotificationOutlined /> {t.promo_banner_header}</Space>}
                                                    style={{ borderRadius: "16px", marginBottom: "24px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                                                    extra={
                                                        <Form.Item name="promo_is_active" valuePropName="checked" noStyle>
                                                            <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
                                                        </Form.Item>
                                                    }
                                                >
                                                    <Row gutter={16}>
                                                        <Col xs={24} md={16}>
                                                            <Form.Item label={t.promo_tag_label} name="promo_tag" tooltip="This text appears in a small pill above the title">
                                                                <Input placeholder="Limited Offer, Hot Deal, etc." size="large" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col xs={24} md={8}>
                                                            <Form.Item label={t.tag_color || 'Tag Color'} name="promo_tag_color">
                                                                <Select size="large">
                                                                    <Option value="#C8952A">Gold / មាស</Option>
                                                                    <Option value="#E8534A">Red / ក្រហម</Option>
                                                                    <Option value="#4A6741">Green / បៃតង</Option>
                                                                    <Option value="#1D4ED8">Blue / ខៀវ</Option>
                                                                </Select>
                                                            </Form.Item>
                                                        </Col>
                                                        <Col xs={24}>
                                                            <Form.Item label={t.promo_title_label} name="promo_title" tooltip="Main big text on the banner">
                                                                <Input placeholder="e.g. BUY 1 GET 1 FREE" size="large" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col xs={24}>
                                                            <Form.Item label={t.promo_desc_label} name="promo_desc" tooltip="Short explanation of the offer">
                                                                <Input.TextArea placeholder="e.g. Celebrate our new branch with a free drink!" rows={2} />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col xs={24}>
                                                            <Form.Item label={t.promo_image_label} name="promo_image" tooltip="Provide a high-quality image URL for the background">
                                                                <Input prefix={<GlobalOutlined />} placeholder="https://images.unsplash.com..." size="large" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col xs={24}>
                                                            <Card
                                                                title={<Space><PercentageOutlined style={{ color: '#fa8c16' }} /> <span style={{ color: '#fa8c16' }}>{t.global_discount_header}</span></Space>}
                                                                style={{ marginBottom: 24, borderRadius: 16, border: '1px solid #ffd591', boxShadow: '0 4px 12px rgba(250,140,22,0.05)' }}
                                                                headStyle={{ borderBottom: '1px solid #ffd591', background: '#fffbe6' }}
                                                            >
                                                                <Row gutter={[24, 16]}>
                                                                    <Col xs={24} md={8}>
                                                                        <Form.Item label={<b>{t.discount_label?.toUpperCase() || 'DISCOUNT (%)'}</b>} name="global_discount">
                                                                            <InputNumber
                                                                                style={{ width: '100%', borderRadius: 8 }}
                                                                                size="large"
                                                                                min={0} max={100}
                                                                                formatter={value => `${value}%`}
                                                                                parser={value => value.replace('%', '')}
                                                                            />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col xs={24} md={16}>
                                                                        <Form.Item label={<b>{t.discount_scope_label}</b>} name="discount_scope">
                                                                            <Select size="large" style={{ borderRadius: 8 }}>
                                                                                <Option value="all">Apply to ALL Products</Option>
                                                                                <Option value="category">Specific Categories Only</Option>
                                                                                <Option value="product">Selected Products Only</Option>
                                                                            </Select>
                                                                        </Form.Item>
                                                                    </Col>

                                                                    {/* Conditional Selectors for Discount */}
                                                                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.discount_scope !== curr.discount_scope}>
                                                                        {({ getFieldValue }) => {
                                                                            const scope = getFieldValue('discount_scope');
                                                                            if (scope === 'category') {
                                                                                return (
                                                                                    <Col xs={24}>
                                                                                        <Form.Item label={<b>SELECT CATEGORIES</b>} name="discount_applied_categories">
                                                                                            <Select mode="multiple" placeholder="Choose categories" size="large" options={categories.map(c => ({ label: c.name, value: c.id }))} />
                                                                                        </Form.Item>
                                                                                    </Col>
                                                                                );
                                                                            }
                                                                            if (scope === 'product') {
                                                                                return (
                                                                                    <Col xs={24}>
                                                                                        <Form.Item label={<b>SELECT PRODUCTS</b>} name="discount_applied_products">
                                                                                            <Select mode="multiple" placeholder="Choose products" size="large" options={products.map(p => ({ label: p.name, value: p.id }))} />
                                                                                        </Form.Item>
                                                                                    </Col>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        }}
                                                                    </Form.Item>
                                                                </Row>
                                                            </Card>
                                                        </Col>
                                                    </Row>
                                                </Card>

                                                <div style={{
                                                    marginTop: 20,
                                                    padding: '24px',
                                                    background: '#f0f7ff',
                                                    border: '1px solid #bae7ff',
                                                    borderRadius: 16,
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                                }}>
                                                    <Row gutter={[16, 24]}>
                                                        <Col xs={24} md={16}>
                                                            <Space direction="vertical" size={0}>
                                                                <Title level={5} style={{ color: '#0050b3', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <NotificationOutlined /> {t.buy_x_get_y_header}
                                                                </Title>
                                                                <Text type="secondary" style={{ fontSize: 13 }}>
                                                                    Automate discounts and BOGO badges across your menu.
                                                                </Text>
                                                            </Space>
                                                        </Col>
                                                        <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                                                            <Space style={{ background: '#fff', padding: '6px 12px', borderRadius: 10, border: '1px solid #d9d9d9' }}>
                                                                <Text strong style={{ fontSize: 11, color: '#595959' }}>{t.promo_active_status?.toUpperCase()}:</Text>
                                                                <Form.Item name="global_bogo_active" valuePropName="checked" noStyle>
                                                                    <Switch checkedChildren="ON" unCheckedChildren="OFF" size="small" />
                                                                </Form.Item>
                                                            </Space>
                                                        </Col>

                                                        <Col xs={24}>
                                                            <div style={{ background: '#fff', padding: '20px', borderRadius: 12, border: '1px solid #e6f7ff' }}>
                                                                <Row gutter={[24, 16]}>
                                                                    <Col xs={12} md={6}>
                                                                        <Form.Item
                                                                            label={<Space><ShoppingOutlined style={{ color: '#1890ff' }} /> <b>BUY (ទិញ)</b></Space>}
                                                                            name="promo_buy_qty"
                                                                        >
                                                                            <InputNumber min={1} size="large" style={{ width: '100%', borderRadius: 8 }} />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col xs={12} md={6}>
                                                                        <Form.Item
                                                                            label={<Space><GiftOutlined style={{ color: '#52c41a' }} /> <b>FREE (ថែម)</b></Space>}
                                                                            name="promo_get_qty"
                                                                        >
                                                                            <InputNumber min={1} size="large" style={{ width: '100%', borderRadius: 8 }} />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col xs={24} md={12}>
                                                                        <Form.Item label={<b>PROMOTION SCOPE</b>} name="promo_scope">
                                                                            <Select size="large" style={{ width: '100%' }}>
                                                                                <Option value="all">Apply to ALL Products</Option>
                                                                                <Option value="category">Specific Categories Only</Option>
                                                                                <Option value="product">Selected Products Only</Option>
                                                                            </Select>
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col xs={24} md={12}>
                                                                        <Form.Item label={<b>BADGE TEXT</b>} name="global_bogo_text" tooltip="e.g. Buy 1 Get 1 Free">
                                                                            <Input placeholder="ទិញ១ ថែម១" size="large" style={{ borderRadius: 8 }} />
                                                                        </Form.Item>
                                                                    </Col>

                                                                    <Col xs={24} md={12}>
                                                                        <Form.Item label={<Space><CalendarOutlined /> <b>{t.start_date_label?.toUpperCase()}</b></Space>} name="promo_start_date">
                                                                            <DatePicker style={{ width: '100%', borderRadius: 8 }} size="large" placeholder={t.start_date_label} />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col xs={24} md={12}>
                                                                        <Form.Item label={<Space><CalendarOutlined /> <b>{t.end_date_label?.toUpperCase()}</b></Space>} name="promo_end_date">
                                                                            <DatePicker style={{ width: '100%', borderRadius: 8 }} size="large" placeholder={t.end_date_label} />
                                                                        </Form.Item>
                                                                    </Col>

                                                                    {/* Conditional Multi-Select for Categories */}
                                                                    <Form.Item
                                                                        noStyle
                                                                        shouldUpdate={(prev, curr) => prev.promo_scope !== curr.promo_scope}
                                                                    >
                                                                        {({ getFieldValue }) => getFieldValue('promo_scope') === 'category' ? (
                                                                            <Col xs={24}>
                                                                                <Form.Item label={<b>SELECT TARGET CATEGORIES</b>} name="promo_applied_categories">
                                                                                    <Select
                                                                                        mode="multiple"
                                                                                        placeholder="Choose categories"
                                                                                        size="large"
                                                                                        style={{ width: '100%' }}
                                                                                        options={categories.map(c => ({ label: c.name, value: c.id }))}
                                                                                    />
                                                                                </Form.Item>
                                                                            </Col>
                                                                        ) : null}
                                                                    </Form.Item>

                                                                    {/* Conditional Multi-Select for Products */}
                                                                    <Form.Item
                                                                        noStyle
                                                                        shouldUpdate={(prev, curr) => prev.promo_scope !== curr.promo_scope}
                                                                    >
                                                                        {({ getFieldValue }) => getFieldValue('promo_scope') === 'product' ? (
                                                                            <Col xs={24}>
                                                                                <Form.Item label={<b>SELECT TARGET PRODUCTS</b>} name="promo_applied_products">
                                                                                    <Select
                                                                                        mode="multiple"
                                                                                        placeholder="Choose products"
                                                                                        size="large"
                                                                                        style={{ width: '100%' }}
                                                                                        options={products.map(p => ({ label: p.name, value: p.id }))}
                                                                                    />
                                                                                </Form.Item>
                                                                            </Col>
                                                                        ) : null}
                                                                    </Form.Item>
                                                                </Row>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </div>
                                                <div style={{ marginTop: 16, padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 12 }}>
                                                    <Title level={5} style={{ color: '#52c41a' }}><RocketOutlined /> Preview Guide</Title>
                                                    <Text size="small" type="secondary">
                                                        These promotions will appear on the guest app home screen and product list.
                                                    </Text>
                                                </div>
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
                                                        {t.update || 'Save Promotion'}
                                                    </Button>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </div>
                                )
                            },
                            isAdmin && {
                                key: "categories",
                                label: <span>🏷️ {t.category_tab}</span>,
                                children: (
                                    <div style={{ paddingTop: 24, paddingBottom: 24 }}>
                                        <CategoryManageTab targetBusinessId={profile?.business_id} />
                                    </div>
                                )
                            }
                        ].filter(Boolean)}
                    />
                </Form>
            </div>
        </div>
    );
};

// --- NEW COMPONENT: PrinterSettingsTab ---
const PrinterSettingsTab = () => {
    const { lang } = useLanguage();
    const t = translations[lang];
    const [pSettings, setPSettings] = useState(getPrinterSettings());

    const updateSetting = (key, value) => {
        const newSettings = { ...pSettings, [key]: value };
        setPSettings(newSettings);
        setPrinterSettings(newSettings);
        message.success(lang === 'kh' ? "បានធ្វើបច្ចុប្បន្នភាពការកំណត់ម៉ាស៊ីនព្រីន!" : "Printer settings updated locally!");
    };

    return (
        <div style={{ paddingTop: 24, paddingBottom: 24, maxWidth: "100%" }}>
            <Title level={4}><PrinterOutlined /> {t.printing_workflow_header}</Title>
            <Divider />

            <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                    <Card
                        hoverable
                        style={{ borderRadius: 16, border: '1px solid #e8e3d8' }}
                        title={<Space><RocketOutlined style={{ color: '#1e4a2d' }} /> {t.automation || 'Automation'}</Space>}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <Text strong>{t.auto_print_label}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>{t.auto_print_desc}</Text>
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
                        title={<Space><OrderedListOutlined style={{ color: '#c0a060' }} /> {t.execution_order_header}</Space>}
                    >
                        <Form layout="vertical">
                            <Form.Item label={t.print_priority_label}>
                                <Select
                                    size="large"
                                    value={pSettings.label_first ? 'label' : 'invoice'}
                                    onChange={(val) => updateSetting('label_first', val === 'label')}
                                >
                                    <Option value="label">{t.label_first_option}</Option>
                                    <Option value="invoice">{t.invoice_first_option}</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24}>
                    <Card
                        title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> {t.doc_availability_header}</Space>}
                        style={{ borderRadius: 16, border: '1px solid #e8e3d8' }}
                    >
                        <Row gutter={24}>
                            <Col xs={24} sm={12}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                                    <Text>{t.enable_invoice_label}</Text>
                                    <Switch
                                        checked={pSettings.invoice_enabled}
                                        onChange={(val) => updateSetting('invoice_enabled', val)}
                                    />
                                </div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                                    <Text>{t.enable_label_stickers}</Text>
                                    <Switch
                                        checked={pSettings.label_enabled}
                                        onChange={(val) => updateSetting('label_enabled', val)}
                                    />
                                </div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                                    <Text>{t.enable_kitchen_ticket}</Text>
                                    <Switch
                                        checked={pSettings.kitchen_enabled}
                                        onChange={(val) => updateSetting('kitchen_enabled', val)}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            <div style={{ marginTop: 40, padding: 20, background: '#fffbe6', borderRadius: 12, border: '1px solid #ffe58f' }}>
                <Text type="warning" strong>💡 {t.pro_tip_label}:</Text>
                <br />
                <Text size="small" type="secondary">
                    For maximum speed during busy hours, enable <b>Auto Print</b> and set <b>Label First</b>.
                    Combine this with browser "Kiosk Printing" for a truly silent experience.
                </Text>
            </div>
        </div>
    );
};

// --- NEW COMPONENT: ThemeCustomizerTab ---
const ThemeCustomizerTab = ({ lang, t }) => {
    const [sidebarBg, setSidebarBg] = useState(localStorage.getItem('theme_sidebar_bg') || '#1e4a2d');
    const [pageBg, setPageBg] = useState(localStorage.getItem('theme_page_bg') || '#f4f1eb');
    const [activeText, setActiveText] = useState(localStorage.getItem('theme_active_text_color') || '#1e4a2d');
    const [inactiveText, setInactiveText] = useState(localStorage.getItem('theme_inactive_text_color') || 'rgba(255, 255, 255, 0.75)');
    const [activeIconBg, setActiveIconBg] = useState(localStorage.getItem('theme_active_icon_bg') || '#1e4a2d');
    const [activeIconColor, setActiveIconColor] = useState(localStorage.getItem('theme_active_icon_color') || '#ffffff');
    const [bgImage, setBgImage] = useState(localStorage.getItem('theme_bg_image') || '');

    const menuPresets = ['#1e4a2d', '#00932a', '#3d2314', '#1d3557', '#1f2937'];
    const pagePresets = ['#f4f1eb', '#f0f4f8', '#ffffff', '#fdfbf7', '#f0f7f4'];

    const updateBgImage = (url) => {
        setBgImage(url);
        if (url) {
            localStorage.setItem('theme_bg_image', url);
            document.documentElement.style.setProperty('--theme-bg-image', `url(${url})`);
        } else {
            localStorage.removeItem('theme_bg_image');
            document.documentElement.style.setProperty('--theme-bg-image', 'none');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2.5 * 1024 * 1024) {
            message.error(lang === 'kh' ? "ទំហំរូបភាពត្រូវតែតូចជាង 2.5MB!" : "Image size must be less than 2.5MB!");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            updateBgImage(reader.result);
            message.success(lang === 'kh' ? "បានផ្លាស់ប្តូររូបភាព Wallpaper ជោគជ័យ!" : "Wallpaper image set successfully!");
        };
        reader.readAsDataURL(file);
    };

    const updateSidebarBg = (color) => {
        setSidebarBg(color);
        localStorage.setItem('theme_sidebar_bg', color);
        document.documentElement.style.setProperty('--sidebar-bg-color', color);
        document.documentElement.style.setProperty('--active-icon-bg', color);
        // Also sync active icon background if it hasn't been manually set
        if (!localStorage.getItem('theme_active_icon_bg')) {
            document.documentElement.style.setProperty('--sidebar-active-icon-bg', color);
        }
    };

    const updatePageBg = (color) => {
        setPageBg(color);
        localStorage.setItem('theme_page_bg', color);
        document.documentElement.style.setProperty('--theme-milk-bg', color);
    };

    const updateActiveText = (color) => {
        setActiveText(color);
        localStorage.setItem('theme_active_text_color', color);
        document.documentElement.style.setProperty('--sidebar-active-text', color);
    };

    const updateInactiveText = (color) => {
        setInactiveText(color);
        localStorage.setItem('theme_inactive_text_color', color);
        document.documentElement.style.setProperty('--sidebar-inactive-text', color);
    };

    const updateActiveIconBg = (color) => {
        setActiveIconBg(color);
        localStorage.setItem('theme_active_icon_bg', color);
        document.documentElement.style.setProperty('--sidebar-active-icon-bg', color);
    };

    const updateActiveIconColor = (color) => {
        setActiveIconColor(color);
        localStorage.setItem('theme_active_icon_color', color);
        document.documentElement.style.setProperty('--sidebar-active-icon-color', color);
    };

    const handleReset = () => {
        localStorage.removeItem('theme_sidebar_bg');
        localStorage.removeItem('theme_page_bg');
        localStorage.removeItem('theme_active_text_color');
        localStorage.removeItem('theme_inactive_text_color');
        localStorage.removeItem('theme_active_icon_bg');
        localStorage.removeItem('theme_active_icon_color');
        localStorage.removeItem('theme_active_pill_bg');
        localStorage.removeItem('theme_bg_image');

        // Restore defaults
        setSidebarBg('#1e4a2d');
        setPageBg('#f4f1eb');
        setActiveText('#1e4a2d');
        setInactiveText('rgba(255, 255, 255, 0.75)');
        setActiveIconBg('#1e4a2d');
        setActiveIconColor('#ffffff');
        setBgImage('');

        document.documentElement.style.setProperty('--sidebar-bg-color', '#1e4a2d');
        document.documentElement.style.setProperty('--active-icon-bg', '#1e4a2d');
        document.documentElement.style.setProperty('--theme-milk-bg', '#f4f1eb');
        document.documentElement.style.setProperty('--sidebar-active-text', '#1e4a2d');
        document.documentElement.style.setProperty('--sidebar-inactive-text', 'rgba(255, 255, 255, 0.75)');
        document.documentElement.style.setProperty('--sidebar-active-icon-bg', '#1e4a2d');
        document.documentElement.style.setProperty('--sidebar-active-icon-color', '#ffffff');
        document.documentElement.style.setProperty('--theme-bg-image', 'none');

        message.success(lang === 'kh' ? "បានស្តាររចនាបថដើមជោគជ័យ!" : "Restored default theme styles successfully!");
    };

    return (
        <div style={{ paddingTop: 24, paddingBottom: 24, maxWidth: "100%" }}>
            <style jsx="true">{`
                .preset-hover {
                    transition: transform 0.2s ease, border-color 0.2s ease;
                }
                .preset-hover:hover {
                    transform: scale(1.1);
                }
                .preset-card-hover {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .preset-card-hover:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 14px rgba(0,0,0,0.12) !important;
                }
            `}</style>
            <Row gutter={[24, 24]}>
                {/* 1. Sidebar Menu Background */}
                <Col xs={24} md={12}>
                    <Card
                        title={<Space><SettingOutlined style={{ color: '#1e4a2d' }} /> <span>{lang === 'kh' ? 'ពណ៌ Background របស់ Menu' : 'Menu Background Color'}</span></Space>}
                        style={{ borderRadius: "16px", height: '100%', boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                    >
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
                            {lang === 'kh' ? 'ជ្រើសរើសពណ៌ស្រាប់ ឬពណ៌ផ្ទាល់ខ្លួនសម្រាប់ Menu ចំហៀង' : 'Select a preset or custom color for the sidebar menu.'}
                        </Text>
                        <Space direction="vertical" size={16} style={{ width: '100%' }}>
                            <Space size={10} wrap>
                                {menuPresets.map((color, idx) => (
                                    <div
                                        key={color}
                                        onClick={() => updateSidebarBg(color)}
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            backgroundColor: color,
                                            border: sidebarBg.toLowerCase() === color.toLowerCase() ? '3px solid #c0a060' : '2px solid rgba(0,0,0,0.1)',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontWeight: 'bold'
                                        }}
                                        className="preset-hover"
                                    >
                                        {sidebarBg.toLowerCase() === color.toLowerCase() && "✓"}
                                    </div>
                                ))}
                            </Space>
                            <Divider style={{ margin: '12px 0' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Text strong style={{ fontSize: 13 }}>{lang === 'kh' ? 'ពណ៌ផ្ទាល់ខ្លួន៖' : 'Custom:'}</Text>
                                <input
                                    type="color"
                                    value={sidebarBg.startsWith('rgba') ? '#1e4a2d' : sidebarBg}
                                    onChange={(e) => updateSidebarBg(e.target.value)}
                                    style={{ width: 40, height: 32, border: '1px solid #d9d9d9', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                                />
                                <Input
                                    value={sidebarBg}
                                    onChange={(e) => updateSidebarBg(e.target.value)}
                                    style={{ width: 120, borderRadius: 8 }}
                                />
                            </div>
                        </Space>
                    </Card>
                </Col>

                {/* 2. Page Background Color */}
                <Col xs={24} md={12}>
                    <Card
                        title={<Space><BgColorsOutlined style={{ color: '#c0a060' }} /> <span>{lang === 'kh' ? 'ពណ៌ផ្ទៃក្រោយទំព័រ' : 'Page Background Color'}</span></Space>}
                        style={{ borderRadius: "16px", height: '100%', boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                    >
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
                            {lang === 'kh' ? 'ជ្រើសរើសពណ៌ស្រាប់ ឬពណ៌ផ្ទាល់ខ្លួនសម្រាប់ផ្ទៃក្រោយទំព័រ' : 'Select a preset or custom color for the page background.'}
                        </Text>
                        <Space direction="vertical" size={16} style={{ width: '100%' }}>
                            <Space size={10} wrap>
                                {pagePresets.map((color, idx) => (
                                    <div
                                        key={color}
                                        onClick={() => updatePageBg(color)}
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            backgroundColor: color,
                                            border: pageBg.toLowerCase() === color.toLowerCase() ? '3px solid #c0a060' : '2px solid rgba(0,0,0,0.1)',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#333',
                                            fontWeight: 'bold'
                                        }}
                                        className="preset-hover"
                                    >
                                        {pageBg.toLowerCase() === color.toLowerCase() && "✓"}
                                    </div>
                                ))}
                            </Space>
                            <Divider style={{ margin: '12px 0' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Text strong style={{ fontSize: 13 }}>{lang === 'kh' ? 'ពណ៌ផ្ទាល់ខ្លួន៖' : 'Custom:'}</Text>
                                <input
                                    type="color"
                                    value={pageBg.startsWith('rgba') ? '#f4f1eb' : pageBg}
                                    onChange={(e) => updatePageBg(e.target.value)}
                                    style={{ width: 40, height: 32, border: '1px solid #d9d9d9', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                                />
                                <Input
                                    value={pageBg}
                                    onChange={(e) => updatePageBg(e.target.value)}
                                    style={{ width: 120, borderRadius: 8 }}
                                />
                            </div>
                        </Space>
                    </Card>
                </Col>

                {/* 3. Page Background Wallpaper */}
                <Col xs={24}>
                    <Card
                        title={<Space><FileImageOutlined style={{ color: '#52c41a' }} /> <span>{lang === 'kh' ? 'រូបភាពផ្ទៃក្រោយទំព័រ (Wallpaper)' : 'Page Background Wallpaper'}</span></Space>}
                        style={{ borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                    >
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
                            {lang === 'kh' ? 'ផ្ទុកឡើងរូបភាពផ្ទាល់ខ្លួន ឬជ្រើសរើសរូបភាពគំរូ Coffee ដ៏ស្រស់ស្អាតខាងក្រោម' : 'Upload a custom wallpaper or choose from the coffee presets below.'}
                        </Text>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                            <Button
                                type="primary"
                                icon={<UploadOutlined />}
                                onClick={() => document.getElementById('wallpaper-upload-input').click()}
                                style={{ borderRadius: 8, background: '#1e4a2d', borderColor: '#1e4a2d' }}
                            >
                                {lang === 'kh' ? 'ផ្ទុកឡើងរូបភាព (Upload)' : 'Upload Wallpaper'}
                            </Button>
                            <input
                                id="wallpaper-upload-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />

                            {bgImage && (
                                <Button
                                    danger
                                    type="primary"
                                    ghost
                                    icon={<CloseOutlined />}
                                    onClick={() => updateBgImage('')}
                                    style={{ borderRadius: 8 }}
                                >
                                    {lang === 'kh' ? 'លុបរូបភាពចេញ' : 'Remove Wallpaper'}
                                </Button>
                            )}
                        </div>

                        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12, fontWeight: 'bold' }}>
                            {lang === 'kh' ? 'រូបភាពគំរូ Coffee Presets៖' : 'Coffee Presets:'}
                        </Text>
                        <Row gutter={[16, 16]}>
                            {[
                                { name: "Flatlay Coffee", url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400" },
                                { name: "Cozy Shop", url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=400" },
                                { name: "Coffee Beans", url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=400" },
                                { name: "Abstract Gradient", url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=400" }
                            ].map((preset, idx) => (
                                <Col xs={12} sm={6} key={idx}>
                                    <div
                                        onClick={() => updateBgImage(preset.url)}
                                        style={{
                                            position: 'relative',
                                            height: 90,
                                            borderRadius: 12,
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            border: bgImage === preset.url ? '3px solid #c0a060' : '1px solid rgba(0,0,0,0.1)',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
                                        }}
                                        className="preset-card-hover"
                                    >
                                        <img src={preset.url} alt={preset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            width: '100%',
                                            padding: '4px 8px',
                                            background: 'rgba(0,0,0,0.6)',
                                            color: '#fff',
                                            fontSize: 10,
                                            textAlign: 'center'
                                        }}>
                                            {preset.name}
                                        </div>
                                        {bgImage === preset.url && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                background: 'rgba(30,74,45,0.4)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#ffffff',
                                                fontWeight: 'bold',
                                                fontSize: 16
                                            }}>
                                                ✓
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Card>
                </Col>

                {/* 4. Customize Menu Colors */}
                <Col xs={24}>
                    <Card
                        title={<Space><SettingOutlined style={{ color: '#722ed1' }} /> <span>{lang === 'kh' ? 'កែតម្រូវពណ៌លម្អិតរបស់ Menu' : 'Customize Menu Colors'}</span></Space>}
                        style={{ borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                    >
                        <Row gutter={[20, 20]}>
                            {[
                                { title: lang === 'kh' ? 'ពណ៌អក្សរពេល Active (ជ្រើសរើស)' : 'Active Item Text Color', val: activeText, set: updateActiveText },
                                { title: lang === 'kh' ? 'ពណ៌អក្សរធម្មតា (មិនទាន់ជ្រើស)' : 'Inactive Item Text Color', val: inactiveText, set: updateInactiveText, isRgba: true },
                                { title: lang === 'kh' ? 'ពណ៌រង្វង់ Icon ពេល Active' : 'Active Icon Background Color', val: activeIconBg, set: updateActiveIconBg },
                                { title: lang === 'kh' ? 'ពណ៌សញ្ញា Icon ពេល Active' : 'Active Icon Graphic Color', val: activeIconColor, set: updateActiveIconColor }
                            ].map((item, idx) => (
                                <Col xs={24} sm={12} key={idx}>
                                    <div style={{
                                        padding: '16px',
                                        borderRadius: 12,
                                        border: '1px solid rgba(0,0,0,0.06)',
                                        background: 'rgba(255,255,255,0.4)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 10
                                    }}>
                                        <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="color"
                                                value={(item.isRgba && item.val.startsWith('rgba')) ? '#ffffff' : item.val}
                                                onChange={(e) => item.set(e.target.value)}
                                                style={{ width: 36, height: 32, border: '1px solid #d9d9d9', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                                            />
                                            <Input
                                                value={item.val}
                                                onChange={(e) => item.set(e.target.value)}
                                                style={{ borderRadius: 8 }}
                                            />
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Card>
                </Col>

                {/* 5. Reset Action */}
                <Col xs={24}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                        <Button
                            danger
                            type="dashed"
                            size="large"
                            onClick={handleReset}
                            style={{ borderRadius: 10 }}
                        >
                            {lang === 'kh' ? 'ស្តាររចនាបថដើមឡើងវិញ' : 'Reset to Default Theme'}
                        </Button>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default SettingsPage;
