import React, { useEffect, useState, useMemo } from "react";
import {
    Table, Button, Card, Row, Col, Input,
    Modal, Form, message, Tag, Space,
    Typography, DatePicker, Select, InputNumber,
    Badge, Tooltip, Empty, Statistic, Divider,
    Avatar, ConfigProvider, Progress,
    Alert
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    DollarOutlined,
    SearchOutlined,
    CalendarOutlined,
    FilterOutlined,
    FileTextOutlined,
    TagOutlined,
    PieChartOutlined,
    AccountBookOutlined,
    ShoppingOutlined,
    AuditOutlined,
    ArrowRightOutlined,
    InfoCircleOutlined,
    HistoryOutlined,
    PrinterOutlined
} from "@ant-design/icons";
import { 
  Wallet, Receipt, Calculator, Briefcase, 
  Package, ShoppingCart, Activity, Filter,
  ArrowUpRight, ArrowDownLeft, Database, HelpCircle
} from "lucide-react";
import { request } from "@/shared/utils/helper";
import moment from "moment";
import { useLanguage, translations } from "@/app/store/language.store";
import { useProfileStore } from "@/app/store/profileStore";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Executive Color Palette
const COLORS = {
    primary: "#0f172a",    // Slate 900
    secondary: "#c2a45b",  // Professional Gold
    accent: "#3b82f6",     // Blue 500
    cogs: "#ef4444",       // Rose 500
    opex: "#10b981",       // Emerald 500
    admin: "#8b5cf6",      // Violet 500
    background: "#f8fafc",
    cardBg: "rgba(255, 255, 255, 0.9)",
};

const ExpensePage = () => {
    const profile = useProfileStore(s => s.profile);
    const { lang } = useLanguage();
    const t = translations[lang];
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [types, setTypes] = useState([]);
    const [form] = Form.useForm();
    const [editId, setEditId] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [showGuide, setShowGuide] = useState(false);
    const [dateRange, setDateRange] = useState([moment().startOf('month'), moment().endOf('month')]);

    useEffect(() => {
        getTypes();
        getList();
    }, []);

    const getTypes = async () => {
        try {
            const res = await request("expense/type", "get");
            if (res && res.list) setTypes(res.list);
        } catch (error) {
            console.error("Failed to fetch expense types");
        }
    };

    const getList = async () => {
        setLoading(true);
        try {
            let url = "expense";
            if (dateRange[0] && dateRange[1]) {
                url += `?from_date=${dateRange[0].format("YYYY-MM-DD")}&to_date=${dateRange[1].format("YYYY-MM-DD")}`;
            }
            const res = await request(url, "get");
            if (res && res.list) setList(res.list);
        } catch (error) {
            message.error("Failed to fetch expenses");
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        try {
            const method = editId ? "put" : "post";
            const payload = {
                ...values,
                id: editId,
                expense_date: values.expense_date.format("YYYY-MM-DD")
            };

            const res = await request("expense", method, payload);
            if (res && res.success && res.data) {
                message.success(res.message);
                setVisible(false);
                form.resetFields();
                if (editId) {
                    setList(prev => prev.map(item => item.id === editId ? res.data : item));
                } else {
                    setList(prev => [res.data, ...prev]);
                }
                setEditId(null);
            }
        } catch (error) {
            message.error("Operation failed");
        }
    };

    const onClickEdit = (item) => {
        if (item.description?.includes("(Ref: PO") || item.description?.includes("(PO Ref:")) {
            message.info("This is a system-generated expense from a Purchase. Please manage it via the Purchase module.");
            return;
        }
        setEditId(item.id);
        form.setFieldsValue({
            ...item,
            expense_date: moment(item.expense_date)
        });
        setVisible(true);
    };

    const onClickDelete = (id, description) => {
        if (description?.includes("(Ref: PO") || description?.includes("(PO Ref:")) {
            message.warning("System-generated records cannot be deleted manually here.");
            return;
        }
        Modal.confirm({
            title: <span style={{ fontWeight: 800, fontSize: 18 }}>Void Expense Entry?</span>,
            icon: <InfoCircleOutlined style={{ color: '#ff4d4f' }} />,
            content: "This action will permanently remove this record from all financial reports.",
            okText: "Yes, Void Record",
            okType: "danger",
            centered: true,
            styles: { content: { borderRadius: 20 } },
            onOk: async () => {
                const res = await request("expense", "delete", { id });
                if (res) {
                    message.success("Record voided successfully");
                    setList(prev => prev.filter(item => item.id !== id));
                }
            }
        });
    };

    const totals = useMemo(() => {
        const cogs = list.filter(i => i.category_class === 'COGS').reduce((s, i) => s + parseFloat(i.amount), 0);
        const opex = list.filter(i => i.category_class === 'Operational').reduce((s, i) => s + parseFloat(i.amount), 0);
        const admin = list.filter(i => i.category_class === 'Administrative').reduce((s, i) => s + parseFloat(i.amount), 0);
        const total = cogs + opex + admin;
        return { cogs, opex, admin, total };
    }, [list]);

    const columns = [
        {
            title: "LEDGER DATE",
            dataIndex: "expense_date",
            width: 140,
            render: (date) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 13 }}>{moment(date).format("DD MMM, YYYY")}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>{moment(date).fromNow()}</Text>
                </Space>
            )
        },
        {
            title: "CLASSIFICATION",
            dataIndex: "category_class",
            width: 150,
            render: (v) => {
                let color = "#3b82f6";
                let icon = <Activity size={12} />;
                if (v === 'COGS') { color = COLORS.cogs; icon = <Package size={12} />; }
                if (v === 'Administrative') { color = COLORS.admin; icon = <AuditOutlined style={{fontSize: 10}} />; }
                return (
                  <Tag color={v === 'COGS' ? 'error' : v === 'Administrative' ? 'purple' : 'processing'} 
                       style={{ borderRadius: 6, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
                    {icon} {v?.toUpperCase()}
                  </Tag>
                );
            }
        },
        {
            title: "NATURE OF EXPENSE",
            key: "details",
            render: (record) => (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text strong style={{ fontSize: 14 }}>{record.type_name}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>{record.description || "No specific details provided"}</Text>
                {(record.description?.includes("(Ref: PO") || record.description?.includes("(PO Ref:")) && (
                  <Tag style={{ width: 'fit-content', marginTop: 4, borderRadius: 4, background: '#f0fdf4', color: '#166534', border: 'none', fontSize: 10 }}>
                    <Database size={10} style={{marginRight: 4}} /> SYSTEM GENERATED (PROCUREMENT)
                  </Tag>
                )}
              </div>
            )
        },
        {
          title: "METHOD",
          dataIndex: "payment_method",
          width: 120,
          render: (method) => (
            <Tag style={{ borderRadius: 6, fontWeight: 700 }}>{method || "Cash"}</Tag>
          )
        },
        {
            title: "AMOUNT",
            dataIndex: "amount",
            align: 'right',
            width: 150,
            render: (amount) => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Text strong style={{ color: COLORS.primary, fontSize: 17 }}>
                    ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>{ (amount * 4100).toLocaleString() } ៛</Text>
              </div>
            )
        },
        {
            title: "MGMT",
            align: 'right',
            width: 100,
            render: (record) => (
                <Space>
                    <AntTooltip title="Edit Entry">
                      <Button type="text" shape="circle" icon={<EditOutlined />} onClick={() => onClickEdit(record)} />
                    </AntTooltip>
                    <AntTooltip title="Void Transaction">
                      <Button type="text" shape="circle" danger icon={<DeleteOutlined />} onClick={() => onClickDelete(record.id, record.description)} />
                    </AntTooltip>
                </Space>
            )
        }
    ];

    const filteredList = list.filter(item =>
        (item.type_name && item.type_name.toLowerCase().includes(searchText.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchText.toLowerCase()))
    );

    return (
        <div className="print-layout-container" style={{ 
          padding: '24px', 
          background: COLORS.background, 
          minHeight: '100vh',
          animation: 'fadeIn 0.6s ease-out'
        }}>
            {/* --- HEADER SECTION --- */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                <div>
                  <Space align="center" style={{ marginBottom: 8 }}>
                    <div style={{ 
                      width: 44, height: 44, borderRadius: 14, 
                      background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 8px 16px rgba(15, 23, 42, 0.2)'
                    }}>
                      <Calculator size={22} color="#fff" />
                    </div>
                    <Title level={2} style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.8px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span>Professional Expense Ledger</span>
                      <Button
                        type="text"
                        icon={<HelpCircle size={15} style={{ color: "#0f172a", marginRight: 4 }} />}
                        onClick={() => setShowGuide(!showGuide)}
                        style={{
                          background: showGuide ? "rgba(15, 23, 42, 0.15)" : "rgba(15, 23, 42, 0.08)",
                          color: "#0f172a",
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          height: 32,
                        }}
                      >
                        {showGuide ? "លាក់ការណែនាំ" : "របៀបប្រើប្រាស់"}
                      </Button>
                    </Title>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 16 }}>Enterprise-grade operational cost & COGS management</Text>
                </div>

                <Space size="middle">
                    <RangePicker
                        value={dateRange}
                        onChange={(dates) => setDateRange(dates || [null, null])}
                        style={{ borderRadius: 12, height: 44, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
                        format="DD MMM, YYYY"
                    />
                    <Button 
                        icon={<HistoryOutlined />} 
                        onClick={getList}
                        style={{ height: 44, borderRadius: 12, fontWeight: 600 }}
                    >
                      Sync Data
                    </Button>
                    <Button 
                        icon={<PrinterOutlined />} 
                        onClick={() => window.print()}
                        style={{ height: 44, borderRadius: 12, fontWeight: 600 }}
                    >
                      Print Report
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditId(null);
                            form.resetFields();
                            form.setFieldsValue({ expense_date: moment(), category_class: 'Operational' });
                            setVisible(true);
                        }}
                        style={{ 
                          background: COLORS.primary, border: 'none', 
                          height: 44, borderRadius: 12, fontWeight: 700,
                          padding: '0 24px', boxShadow: '0 8px 16px rgba(15, 23, 42, 0.2)'
                        }}
                    >
                        NEW ENTRY
                    </Button>
                </Space>
            </div>

            {showGuide && (
                <Alert
                    className="no-print"
                    message={<strong>💡 របៀបគ្រប់គ្រងការចំណាយ (Expense & COGS Guide)</strong>}
                    description={
                        <div style={{ fontSize: 13, marginTop: 4, color: '#333' }}>
                            <p style={{ margin: '3px 0' }}>1. <strong>ប្រភេទការចំណាយ៖</strong> ប្រព័ន្ធបែងចែកការចំណាយជាពីរប្រភេទ៖ <em>COGS (ថ្លៃដើមទំនិញលក់)</em> និង <em>OPEX (ចំណាយប្រតិបត្តិការទូទៅ ដូចជាទឹក ភ្លើង ជួលទីតាំង)</em>។</p>
                            <p style={{ margin: '3px 0' }}>2. <strong>ការបញ្ចូលចំណាយ៖</strong> ចុចប៊ូតុង <strong>[NEW ENTRY]</strong> ដើម្បីកត់ត្រាការចំណាយថ្មី ដោយជ្រើសរើសថ្ងៃខែ ប្រភេទ និងចំនួនទឹកប្រាក់។</p>
                            <p style={{ margin: '3px 0' }}>3. <strong>ចំណាយបង្កើតដោយប្រព័ន្ធ៖</strong> រាល់ពេលដែលបងធ្វើការបញ្ជាទិញស្តុកទំនិញចូល (Procurement) ប្រព័ន្ធនឹងបង្កើតប្រតិបត្តិការចំណាយជាប្រភេទ <strong>COGS</strong> ឱ្យដោយស្វ័យប្រវត្តិ។</p>
                        </div>
                    }
                    type="info"
                    closable
                    onClose={() => setShowGuide(false)}
                    style={{ borderRadius: 16, marginBottom: 24, border: '1px solid #bae7ff', background: '#e6f7ff' }}
                />
            )}

            {/* --- SUMMARY METRICS --- */}
            <Row className="no-print" gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={12} lg={6}>
                    <div className="op-mini-card" style={{ padding: '20px' }}>
                        <Statistic 
                          title={<Text strong style={{ color: COLORS.textSecondary, fontSize: 12 }}>COGS (PURCHASES)</Text>} 
                          value={totals.cogs} 
                          prefix="$" 
                          valueStyle={{ color: COLORS.cogs, fontWeight: 900, fontSize: 28 }} 
                        />
                        <Progress percent={(totals.cogs / (totals.total || 1)) * 100} showInfo={false} strokeColor={COLORS.cogs} size="small" />
                    </div>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <div className="op-mini-card" style={{ padding: '20px' }}>
                        <Statistic 
                          title={<Text strong style={{ color: COLORS.textSecondary, fontSize: 12 }}>OPERATIONAL (OPEX)</Text>} 
                          value={totals.opex} 
                          prefix="$" 
                          valueStyle={{ color: COLORS.opex, fontWeight: 900, fontSize: 28 }} 
                        />
                        <Progress percent={(totals.opex / (totals.total || 1)) * 100} showInfo={false} strokeColor={COLORS.opex} size="small" />
                    </div>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <div className="op-mini-card" style={{ padding: '20px' }}>
                        <Statistic 
                          title={<Text strong style={{ color: COLORS.textSecondary, fontSize: 12 }}>ADMINISTRATIVE</Text>} 
                          value={totals.admin} 
                          prefix="$" 
                          valueStyle={{ color: COLORS.admin, fontWeight: 900, fontSize: 28 }} 
                        />
                        <Progress percent={(totals.admin / (totals.total || 1)) * 100} showInfo={false} strokeColor={COLORS.admin} size="small" />
                    </div>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <div className="op-mini-card" style={{ padding: '20px', background: 'linear-gradient(135deg, var(--theme-dark-green) 0%, var(--theme-accent-green) 100%)' }}>
                        <Statistic 
                          title={<span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 12 }}>TOTAL EXPENDITURE</span>} 
                          value={totals.total} 
                          prefix="$" 
                          valueStyle={{ color: '#fff', fontWeight: 900, fontSize: 28 }} 
                        />
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>Across all classifications</div>
                    </div>
                </Col>
            </Row>

            {/* --- LEDGER TABLE SECTION --- */}
            <Card className="no-print" style={{ 
              borderRadius: 28, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', overflow: 'hidden'
            }} styles={{ body: { padding: 0 } }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Ledger Transaction Logs</Title>
                  <Input
                      prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                      placeholder="Search ledger entries..."
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ width: 300, borderRadius: 10, background: '#f8fafc', border: 'none' }}
                  />
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredList}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 12, showSizeChanger: false }}
                    style={{ background: '#fff' }}
                />
            </Card>

            {/* --- DATA ENTRY MODAL --- */}
            <Modal
                title={
                  <Space style={{ padding: '10px 0' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileTextOutlined style={{ color: COLORS.primary }} />
                    </div>
                    <Title level={4} style={{ margin: 0, fontWeight: 800 }}>{editId ? "Update Ledger Entry" : "New Financial Record"}</Title>
                  </Space>
                }
                open={visible}
                onCancel={() => setVisible(false)}
                onOk={() => form.submit()}
                width={580}
                centered
                footer={[
                  <Button key="back" onClick={() => setVisible(false)} style={{ borderRadius: 8 }}>Cancel</Button>,
                  <Button key="submit" type="primary" onClick={() => form.submit()} style={{ background: COLORS.primary, border: 'none', borderRadius: 8, fontWeight: 700, padding: '0 24px' }}>
                    Commit Transaction
                  </Button>
                ]}
                styles={{ content: { borderRadius: 28, padding: 24 } }}
            >
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 24 }}>
                  <Space align="start">
                    <InfoCircleOutlined style={{ color: COLORS.accent, marginTop: 4 }} />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Ensure accurate classification for better tax and profit reports. System-generated procurement expenses are managed automatically.
                    </Text>
                  </Space>
                </div>

                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Row gutter={20}>
                        <Col span={12}>
                            <Form.Item name="category_class" label={<Text strong style={{fontSize: 12}}>ACCOUNTING CLASS</Text>} rules={[{ required: true }]}>
                                <Select size="large" style={{ borderRadius: 10 }}>
                                    <Option value="COGS">📦 COGS (Raw Materials)</Option>
                                    <Option value="Operational">🏢 Operational (OpEx)</Option>
                                    <Option value="Administrative">⚖️ Administrative</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="expense_date" label={<Text strong style={{fontSize: 12}}>ENTRY DATE</Text>} rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%', borderRadius: 10 }} size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={20}>
                        <Col span={14}>
                            <Form.Item name="expense_type_id" label={<Text strong style={{fontSize: 12}}>GENERAL LEDGER CATEGORY</Text>} rules={[{ required: true }]}>
                                <Select placeholder="Pick financial category" size="large" style={{ borderRadius: 10 }}>
                                    {types.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item name="amount" label={<Text strong style={{fontSize: 12}}>AMOUNT (USD)</Text>} rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%', borderRadius: 10 }} precision={2} prefix="$" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="payment_method" label={<Text strong style={{fontSize: 12}}>PAYMENT METHOD</Text>}>
                        <Select size="large" defaultValue="Cash">
                          <Option value="Cash">💵 Cash</Option>
                          <Option value="KHQR">🇰🇭 KHQR / Mobile</Option>
                          <Option value="Transfer">🏦 Bank Transfer</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="description" label={<Text strong style={{fontSize: 12}}>DESCRIPTION / NOTES</Text>}>
                        <Input.TextArea placeholder="Enter transaction memo or reference..." rows={3} style={{ borderRadius: 12 }} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 🖨️ Printable Wrapper (Visible ONLY during print) */}
            <div className="print-only-layout" style={{ display: 'none', fontFamily: 'Inter, sans-serif' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000' }}>
                  {profile?.business_name || 'IT SRUK SRAE'}
                </h2>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 'bold', color: '#333' }}>
                  របាយការណ៍កត់ត្រាការចំណាយ (EXPENSE LEDGER REPORT)
                </h3>
              </div>

              {/* Metadata Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '20%' }}>BUSINESS NAME</td>
                    <td style={{ border: '1px solid #000', padding: '8px', width: '30%' }}>{profile?.business_name || 'IT SRUK SRAE'}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '20%' }}>REPORT TYPE</td>
                    <td style={{ border: '1px solid #000', padding: '8px', width: '30%', fontWeight: 'bold' }}>EXPENSE LEDGER REPORT</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>BRANCH / ADDRESS</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{profile?.branch_name || 'MAIN BRANCH'} {profile?.branch_address && `(${profile.branch_address})`}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>DATE RANGE</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                      {dateRange[0] ? dateRange[0].format("DD/MM/YYYY") : ""} - {dateRange[1] ? dateRange[1].format("DD/MM/YYYY") : ""}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>TOTAL EXPENDITURE</td>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', color: '#1e4a2d', fontSize: '13px' }}>
                      ${totals.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({(totals.total * 4100).toLocaleString()}៛)
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>COGS / OPEX / ADMIN</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                      ${totals.cogs?.toLocaleString()} / ${totals.opex?.toLocaleString()} / ${totals.admin?.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Data Table */}
              <h3 style={{ margin: '20px 0 10px 0', fontSize: '15px', fontWeight: 'bold', color: '#000' }}>Detailed Transaction Logs</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>LEDGER DATE</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>CLASSIFICATION</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>NATURE OF EXPENSE</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>METHOD</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item, idx) => {
                    return (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #000', padding: '8px' }}>{moment(item.expense_date).format("DD MMM, YYYY")}</td>
                        <td style={{ border: '1px solid #000', padding: '8px' }}>{item.category_class?.toUpperCase()}</td>
                        <td style={{ border: '1px solid #000', padding: '8px' }}>
                          <div style={{ fontWeight: 'bold' }}>{item.type_name}</div>
                          <div style={{ fontSize: '9px', color: '#555' }}>{item.description || "No specific details provided"}</div>
                        </td>
                        <td style={{ border: '1px solid #000', padding: '8px' }}>{item.payment_method || "Cash"}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold' }}>${parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          <div style={{ fontSize: '10px', color: '#555' }}>{(item.amount * 4100).toLocaleString()} ៛</div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                    <td style={{ border: '1px solid #000', padding: '8px' }} colSpan={4}>TOTAL EXPENDITURE</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold' }}>${totals.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: '10px', color: '#555' }}>{(totals.total * 4100).toLocaleString()} ៛</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* 🖨️ Printable Footer */}
              <div style={{ marginTop: '20px', pageBreakInside: 'avoid' }}>
                {/* Signature Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 50px 0 50px', marginTop: '10px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '13px', display: 'block', fontWeight: 700, color: '#000' }}>រៀបចំដោយ (Prepared By)</span>
                    <div style={{ height: '35px' }}></div>
                    <span style={{ fontSize: '12px', display: 'block', color: '#000' }}>..........................................</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '13px', display: 'block', fontWeight: 700, color: '#000' }}>ពិនិត្យ និងអនុម័តដោយ (Approved By)</span>
                    <div style={{ height: '35px' }}></div>
                    <span style={{ fontSize: '12px', display: 'block', color: '#000' }}>..........................................</span>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #000', padding: '8px 0', display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '15px' }}>
                  <div>📍 {profile?.branch_address || 'Phnom Penh, Cambodia'}</div>
                  <div>បោះពុម្ពដោយប្រព័ន្ធ POS៖ {moment().format("DD/MM/YYYY HH:mm")}</div>
                </div>
              </div>
            </div>

            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }

              .ant-modal-mask {
                backdrop-filter: blur(4px);
              }

              @media print {
                .no-print {
                  display: none !important;
                }
                .print-only-layout {
                  display: block !important;
                }
                .print-layout-container {
                  min-height: auto !important;
                  height: auto !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: #ffffff !important;
                }
                /* Reset page margins and body */
                body, html, .ant-layout, .admin-body, .ant-layout-content, .admin-layout-content {
                  background: #ffffff !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  box-shadow: none !important;
                }
                .ant-layout-sider,
                .ant-layout-header,
                .admin-header,
                .admin-sider,
                header,
                aside {
                  display: none !important;
                }
                .ant-layout-footer,
                footer {
                  display: none !important;
                }
              }
            `}</style>
        </div>
    );
};

export default ExpensePage;
