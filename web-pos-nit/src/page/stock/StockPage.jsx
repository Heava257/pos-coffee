import React, { useEffect, useState } from "react";
import {
    Button,
    Form,
    Input,
    message,
    Modal,
    Space,
    Table,
    Tag,
    Card,
    Typography,
    Select,
    InputNumber,
    Row,
    Col,
    Statistic,
    Tooltip,
    Divider,
    Empty,
} from "antd";
import { 
    MdInventory, 
    MdTrendingDown, 
    MdHistory, 
    MdAdd, 
    MdSearch, 
    MdFilterList,
    MdMoreHoriz,
    MdWarning,
    MdCheckCircle,
    MdOutlineRotateLeft,
} from "react-icons/md";
import { useLanguage, translations } from "../../store/language.store";
import MainPage from "../../component/layout/MainPage";
import { formatDateClient, request } from "../../util/helper";

const { Title, Text } = Typography;
const { Option } = Select;

// ─── Starbucks-Inspired Aesthetics ──────────────────────────────────────────
const COLORS = {
    primary: "#006241",    // Classic Starbucks Green
    secondary: "#1e3932",  // Deep Forest Green
    accent: "#d4e9e2",     // Light Sage
    gold: "#cba258",       // Premium Gold
    lightBg: "#f9fbf9",
    white: "#ffffff",
    danger: "#d62300",     // Refined Red
    warning: "#e4b000",
    textPrimary: "#2d2926",
    textSecondary: "#6b7177",
};

const SHADOWS = {
    soft: "0 4px 20px rgba(0, 98, 65, 0.05)",
    premium: "0 8px 30px rgba(0, 0, 0, 0.08)",
};

const StockPage = () => {
    const { lang } = useLanguage();
    const t = translations[lang];
    const [form] = Form.useForm();
    const [searchTerm, setSearchTerm] = useState("");
    const [state, setState] = useState({
        logs: [],
        products: [],
        rawMaterials: [],
        visibleModal: false,
        loading: false,
    });
    const [filters, setFilters] = useState({
        item_type: null,
        type: null,
        txtSearch: "",
    });

    // 🚀 DEBOUNCE SEARCH: Avoid hammering the API on every keystroke
    useEffect(() => {
        const handler = setTimeout(() => {
            setFilters(f => ({ ...f, txtSearch: searchTerm }));
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        getLogs();
        getItems();
    }, [filters]);

    const getLogs = async () => {
        setState((pre) => ({ ...pre, loading: true }));
        try {
            const res = await request("stock/logs", "get", filters);
            if (res && res.logs) {
                setState((pre) => ({
                    ...pre,
                    logs: res.logs || [],
                    loading: false,
                }));
            } else {
                setState((pre) => ({ ...pre, loading: false }));
            }
        } catch (e) {
            setState((pre) => ({ ...pre, loading: false }));
        }
    };

    const getItems = async () => {
        try {
            const [resProd, resRM] = await Promise.all([
                request("product", "get", { is_list_all: 1 }),
                request("raw_material", "get")
            ]);

            setState(p => ({
                ...p,
                products: (resProd && resProd.list) ? resProd.list : p.products,
                rawMaterials: (resRM && resRM.list) ? resRM.list : p.rawMaterials
            }));
        } catch (e) {
            console.error(e);
        }
    };

    const onFinish = async (values) => {
        setState(p => ({ ...p, loading: true }));
        const res = await request("stock/adjust", "post", values);
        setState(p => ({ ...p, loading: false }));
        if (res && !res.error) {
            message.success(res.message);
            setState((p) => ({ ...p, visibleModal: false }));
            form.resetFields();
            getLogs();
        } else {
            message.error(res?.message || "Adjustment failed");
        }
    };

    // ── Metrics ─────────────────────────────────────────────────────────────
    const lowStockProducts = state.products.filter(p => Number(p.qty || 0) <= 10).length;
    const lowStockMaterials = state.rawMaterials.filter(rm => Number(rm.qty || 0) <= 5).length;

    const columns = [
        {
            title: "DATE & TIME",
            dataIndex: "created_at",
            width: 130,
            render: (d) => (
                <div style={{ fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, color: COLORS.textPrimary }}>{formatDateClient(d, "DD MMM YYYY")}</div>
                    <div style={{ color: COLORS.textSecondary }}>{formatDateClient(d, "HH:mm A")}</div>
                </div>
            )
        },
        {
            title: "ITEM CATEGORY",
            dataIndex: "item_type",
            width: 140,
            render: (v) => (
                <Tag style={{ 
                    borderRadius: 20, 
                    padding: '2px 12px',
                    fontWeight: 600,
                    border: 'none',
                    background: v === 'product' ? '#e6f4ff' : '#f6ffed',
                    color: v === 'product' ? '#0958d9' : '#389e0d'
                }}>
                    {(v === 'product' ? t.product : t.raw_material).toUpperCase()}
                </Tag>
            )
        },
        {
            title: "ITEM NAME",
            dataIndex: "item_name",
            render: (name) => <span style={{ fontWeight: 800, color: COLORS.secondary }}>{name}</span>
        },
        {
            title: "TRANSACTION",
            dataIndex: "type",
            render: (v) => {
                const types = {
                    sale: { color: "#006241", bg: "#d4e9e2", icon: "☕" },
                    purchase: { color: "#0958d9", bg: "#e6f4ff", icon: "📦" },
                    receive: { color: "#722ed1", bg: "#f9f0ff", icon: "📥" },
                    adjustment: { color: "#fa8c16", bg: "#fff7e6", icon: "⚙️" },
                    waste: { color: "#f5222d", bg: "#fff1f0", icon: "🗑️" },
                };
                const config = types[v] || { color: "#595959", bg: "#f5f5f5", icon: "📝" };
                return (
                    <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 6,
                        background: config.bg,
                        color: config.color,
                        padding: '2px 10px',
                        borderRadius: 6,
                        fontSize: '11px',
                        fontWeight: 700
                    }}>
                        <span>{config.icon}</span>
                        {v.toUpperCase()}
                    </div>
                );
            }
        },
        {
            title: "CHANGE",
            dataIndex: "qty_changed",
            align: 'right',
            render: (v) => (
                <span style={{ 
                    color: v > 0 ? '#1e7b1e' : COLORS.danger, 
                    fontWeight: 900,
                    fontSize: '15px'
                }}>
                    {v > 0 ? `+${v.toLocaleString()}` : v.toLocaleString()}
                </span>
            )
        },
        {
            title: "BALANCE",
            dataIndex: "new_qty",
            align: 'right',
            render: (v) => (
                <div style={{ 
                    fontWeight: 800, 
                    color: COLORS.textPrimary,
                    background: '#f1f1f1',
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 8,
                    minWidth: 50
                }}>
                    {v.toLocaleString()}
                </div>
            )
        },
        {
            title: "AUTHORIZED BY",
            dataIndex: "staff_name",
            render: (v) => <Text style={{ fontSize: '12px', fontWeight: 600 }}>👤 {v}</Text>
        },
        {
            title: "REASON / REMARK",
            dataIndex: "reason",
            ellipsis: true,
            render: (v) => <Text italic style={{ color: COLORS.textSecondary, fontSize: '13px' }}>{v || "---"}</Text>
        }
    ];

    const REASONS = [
        { value: 'BAR_ERR', label: 'Barista Error (Wrong Make/Taste)' },
        { value: 'SPILL', label: 'Spillage / Product Dropped' },
        { value: 'EXP', label: 'Item Expired' },
        { value: 'SMPL', label: 'Customer Sampling' },
        { value: 'ST_USE', label: 'Internal Store Use' },
        { value: 'CORRECT', label: 'General Stock Correction' }
    ];

    return (
        <MainPage loading={state.loading}>
            {/* Header Performance Section */}
            <div style={{ marginBottom: 30 }}>
                <Row gutter={[20, 20]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ 
                            background: COLORS.primary, 
                            borderRadius: 20, 
                            boxShadow: SHADOWS.premium,
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <MdInventory size={80} style={{ position: 'absolute', right: -10, top: -10, color: 'rgba(255,255,255,0.1)' }} />
                            <Statistic 
                                title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700 }}>AVAILABLE PRODUCTS</span>}
                                value={state.products.length}
                                valueStyle={{ color: '#fff', fontWeight: 900, fontSize: 32 }}
                                prefix={<MdInventory size={20} style={{ marginRight: 8 }} />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ 
                            background: COLORS.secondary, 
                            borderRadius: 20, 
                            boxShadow: SHADOWS.premium,
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <MdHistory size={80} style={{ position: 'absolute', right: -10, top: -10, color: 'rgba(255,255,255,0.1)' }} />
                            <Statistic 
                                title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700 }}>RAW MATERIALS</span>}
                                value={state.rawMaterials.length}
                                valueStyle={{ color: '#fff', fontWeight: 900, fontSize: 32 }}
                                prefix={<MdOutlineRotateLeft size={20} style={{ marginRight: 8 }} />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ 
                            background: lowStockProducts > 0 ? COLORS.danger : COLORS.accent, 
                            borderRadius: 20, 
                            boxShadow: SHADOWS.premium,
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                             <MdWarning size={80} style={{ position: 'absolute', right: -10, top: -10, color: 'rgba(0,0,0,0.05)' }} />
                            <Statistic 
                                title={<span style={{ color: lowStockProducts > 0 ? '#fff' : COLORS.secondary, fontSize: 13, fontWeight: 700 }}>PRODUCT ALERTS</span>}
                                value={lowStockProducts}
                                valueStyle={{ color: lowStockProducts > 0 ? '#fff' : COLORS.secondary, fontWeight: 900, fontSize: 32 }}
                                prefix={<MdWarning size={20} style={{ marginRight: 8 }} />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ 
                            background: lowStockMaterials > 0 ? COLORS.warning : COLORS.accent, 
                            borderRadius: 20, 
                            boxShadow: SHADOWS.premium,
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <MdTrendingDown size={80} style={{ position: 'absolute', right: -10, top: -10, color: 'rgba(0,0,0,0.05)' }} />
                            <Statistic 
                                title={<span style={{ color: lowStockMaterials > 0 ? '#fff' : COLORS.secondary, fontSize: 13, fontWeight: 700 }}>INGREDIENT ALERTS</span>}
                                value={lowStockMaterials}
                                valueStyle={{ color: lowStockMaterials > 0 ? '#fff' : COLORS.secondary, fontWeight: 900, fontSize: 32 }}
                                suffix={<span style={{ fontSize: 14, marginLeft: 8 }}>Items Low</span>}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* Main Content Area */}
            <Card bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft, padding: '10px' }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: 'wrap', marginBottom: 25, gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 10, background: `${COLORS.primary}10`, borderRadius: 14 }}>
                                <MdHistory size={26} style={{ color: COLORS.primary }} />
                            </div>
                            <div>
                                <Title level={3} style={{ margin: 0, color: COLORS.secondary, letterSpacing: '-0.5px' }}>{t.stock_ledger_audit}</Title>
                                <Text type="secondary" style={{ fontSize: 13 }}>Transparency for every inventory movement across the network</Text>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12 }}>
                        <Button
                            type="primary"
                            icon={<MdAdd size={20} />}
                            onClick={() => setState(s => ({ ...s, visibleModal: true }))}
                            style={{ 
                                background: COLORS.primary, 
                                borderColor: COLORS.primary, 
                                borderRadius: 12,
                                height: 45,
                                fontWeight: 700,
                                boxShadow: "0 4px 12px rgba(0, 98, 65, 0.2)"
                            }}
                            size="large"
                        >
                            {t.manual_adjustment}
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ 
                    background: COLORS.lightBg, 
                    padding: '20px', 
                    borderRadius: 18, 
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 15,
                    border: '1px solid #edf2ed'
                }}>
                    <MdFilterList size={22} style={{ color: COLORS.textSecondary }} />
                    <Space size="large" style={{ flex: 1 }}>
                        <Select
                            placeholder={t.all}
                            allowClear
                            style={{ width: 180 }}
                            onChange={(v) => setFilters(f => ({ ...f, item_type: v }))}
                        >
                            <Option value="product">☕ {t.product}</Option>
                            <Option value="raw_material">🌿 {t.raw_material}</Option>
                        </Select>
                        <Select
                            placeholder={t.transaction}
                            allowClear
                            style={{ width: 180 }}
                            onChange={(v) => setFilters(f => ({ ...f, type: v }))}
                        >
                            <Option value="purchase">📦 {t.purchase}</Option>
                            <Option value="sale">💳 {t.sale}</Option>
                            <Option value="adjustment">⚙️ {t.adjustment}</Option>
                            <Option value="waste">🗑️ {t.waste}</Option>
                            <Option value="transfer_in">📥 {t.receive} In</Option>
                            <Option value="transfer_out">📤 {t.stock_transfer} Out</Option>
                        </Select>
                        <Input 
                            prefix={<MdSearch size={18} style={{ color: '#aaa' }} />}
                            placeholder={t.search}
                            style={{ width: 250, borderRadius: 10 }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Space>
                    <Tooltip title="Reset Filters">
                        <Button shape="circle" icon={<MdAdd style={{ transform: 'rotate(45deg)' }} />} onClick={() => {
                            setSearchTerm("");
                            setFilters({ item_type: null, type: null, txtSearch: "" });
                        }} />
                    </Tooltip>
                </div>

                <style>{`
                    .ant-table-thead > tr > th { background: #f9fbf9 !important; font-weight: 800 !important; font-size: 11px !important; letter-spacing: 0.5px !important; color: #6b7177 !important; text-transform: uppercase; }
                    .ant-table-row:hover { background-color: #f1f8f4 !important; }
                `}</style>
                <Table
                    dataSource={state.logs}
                    rowKey="id"
                    pagination={{ pageSize: 15, showTotal: (total) => `Total ${total} movements found` }}
                    columns={columns}
                    loading={state.loading}
                    size="middle"
                />
            </Card>

            {/* Premium Adjustment Modal */}
            <Modal
                title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: `${COLORS.primary}15`, padding: 8, borderRadius: 8 }}><MdOutlineRotateLeft style={{ color: COLORS.primary }} /></div>
                    <span style={{ fontWeight: 800, color: COLORS.secondary }}>{t.stock_audit_correction}</span>
                </div>}
                open={state.visibleModal}
                onCancel={() => setState(s => ({ ...s, visibleModal: false }))}
                footer={null}
                centered
                width={500}
                styles={{ content: { borderRadius: 24, padding: 30 } }}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>Adjust inventory manually due to error, breakage, or physical auditing.</Text>
                
                <Form layout="vertical" form={form} onFinish={onFinish}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="item_type" label={<span style={{ fontWeight: 700, fontSize: 13 }}>LEVEL</span>} rules={[{ required: true }]}>
                                <Select placeholder="Pick level" size="large" style={{ borderRadius: 10 }} onChange={() => form.setFieldValue("item_id", undefined)}>
                                    <Option value="product">☕ Finished Product</Option>
                                    <Option value="raw_material">🌿 Raw Ingredient</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                             <Form.Item name="type" label={<span style={{ fontWeight: 700, fontSize: 13 }}>ACTION</span>} rules={[{ required: true }]}>
                                <Select placeholder="Select action" size="large" style={{ borderRadius: 10 }}>
                                    <Option value="adjustment">⚙️ Correction (+/-)</Option>
                                    <Option value="waste">🗑️ Wastage (-)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) => prev.item_type !== curr.item_type}
                    >
                        {({ getFieldValue }) => {
                            const itemType = getFieldValue("item_type");
                            const items = itemType === 'product' ? state.products : state.rawMaterials;
                            const options = items.map(item => ({
                                label: `${item.name} ${item.code ? `(${item.code})` : ''}`,
                                value: item.id,
                                qty: item.qty || 0
                            }));

                            return (
                                <Form.Item name="item_id" label={<span style={{ fontWeight: 700, fontSize: 13 }}>SEARCH ITEM</span>} rules={[{ required: true }]}>
                                    <Select
                                        size="large"
                                        placeholder="Type item name..."
                                        showSearch
                                        optionFilterProp="label"
                                        options={options}
                                        style={{ borderRadius: 10 }}
                                        optionRender={(opt) => (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{opt.label}</span>
                                                <Tag color={opt.data.qty <= 0 ? "red" : "green"}>{opt.data.qty} in stock</Tag>
                                            </div>
                                        )}
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>

                    <Form.Item name="qty_changed" label={<span style={{ fontWeight: 700, fontSize: 13 }}>QUANTITY CHANGE</span>} rules={[{ required: true }]}>
                        <InputNumber 
                            size="large" 
                            style={{ width: '100%', borderRadius: 10 }} 
                            placeholder="e.g. 10 to add, -5 to remove" 
                        />
                    </Form.Item>

                    <Form.Item name="reason" label={<span style={{ fontWeight: 700, fontSize: 13 }}>REASON FOR CHANGE</span>} rules={[{ required: true }]}>
                        <Select 
                            placeholder="Select common reason..." 
                            size="large" 
                            style={{ borderRadius: 10 }}
                            options={REASONS}
                            showSearch
                        />
                    </Form.Item>

                    <Form.Item name="custom_note" label={<span style={{ fontWeight: 700, fontSize: 13 }}>CUSTOM REMARK (OPTIONAL)</span>}>
                        <Input.TextArea rows={2} style={{ borderRadius: 12 }} placeholder="Additional details about this adjustment..." />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                        <Button onClick={() => setState(s => ({ ...s, visibleModal: false }))} block size="large" style={{ borderRadius: 12, height: 50, fontWeight: 600 }}>{t.discard}</Button>
                         <Button type="primary" htmlType="submit" block size="large" style={{ background: COLORS.primary, height: 50, borderRadius: 12, fontWeight: 800 }}>{t.submit_audit}</Button>
                    </div>
                </Form>
            </Modal>
        </MainPage>
    );
};

export default StockPage;
