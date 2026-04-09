import React, { useEffect, useState } from "react";
import {
    Table, Button, Card, Row, Col, Input,
    Modal, Form, message, Tag, Space,
    Typography, DatePicker, Select, InputNumber,
    Badge, Tooltip, Empty, Statistic, Divider
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
    AccountBookOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import moment from "moment";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const COLORS = {
    primary: "#006241",    // Starbucks Green
    secondary: "#1e3932",  // Deep Green
    cogs: "#cf1322",       // Red for COGS
    opex: "#0958d9",       // Blue for OpEx
    admin: "#722ed1",      // Purple for Admin
    lightBg: "#f4f1eb",
};

const ExpensePage = () => {
    const { lang } = useLanguage();
    const t = translations[lang];
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [types, setTypes] = useState([]);
    const [form] = Form.useForm();
    const [editId, setEditId] = useState(null);
    const [searchText, setSearchText] = useState("");
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
            if (res) {
                message.success(res.message);
                setVisible(false);
                form.resetFields();
                setEditId(null);
                getList();
            }
        } catch (error) {
            message.error("Operation failed");
        }
    };

    const onClickEdit = (item) => {
        setEditId(item.id);
        form.setFieldsValue({
            ...item,
            expense_date: moment(item.expense_date)
        });
        setVisible(true);
    };

    const onClickDelete = (id) => {
        Modal.confirm({
            title: "Delete Expense?",
            content: "This will remove the record from financial reports.",
            okText: "Delete",
            okType: "danger",
            onOk: async () => {
                const res = await request("expense", "delete", { id });
                if (res) {
                    message.success("Record deleted");
                    getList();
                }
            }
        });
    };

    const columns = [
        {
            title: "Date",
            dataIndex: "expense_date",
            width: 150,
            render: (date) => (
                <Space>
                    <CalendarOutlined style={{ color: COLORS.primary }} />
                    <Text strong>{moment(date).format("DD MMM YYYY")}</Text>
                </Space>
            )
        },
        {
            title: "Classification",
            dataIndex: "category_class",
            width: 150,
            render: (v) => {
                let color = "blue";
                if (v === 'COGS') color = "red";
                if (v === 'Administrative') color = "purple";
                return <Tag color={color} style={{ borderRadius: 10, fontWeight: 700 }}>{v?.toUpperCase()}</Tag>
            }
        },
        {
            title: t.categories,
            dataIndex: "type_name",
            render: (text) => <Text style={{ fontWeight: 600 }}>{text}</Text>
        },
        {
            title: t.description,
            dataIndex: "description",
            ellipsis: true,
        },
        {
            title: t.amount,
            dataIndex: "amount",
            align: 'right',
            render: (amount) => (
                <Text strong style={{ color: COLORS.secondary, fontSize: '16px' }}>
                    ${parseFloat(amount).toFixed(2)}
                </Text>
            )
        },
        {
            title: t.action,
            align: 'right',
            render: (record) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => onClickEdit(record)} />
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onClickDelete(record.id)} />
                </Space>
            )
        }
    ];

    const filteredList = list.filter(item =>
        (item.type_name && item.type_name.toLowerCase().includes(searchText.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchText.toLowerCase()))
    );

    const totalCOGS = filteredList.filter(i => i.category_class === 'COGS').reduce((s, i) => s + parseFloat(i.amount), 0);
    const totalOpEx = filteredList.filter(i => i.category_class === 'Operational').reduce((s, i) => s + parseFloat(i.amount), 0);
    const totalAll = filteredList.reduce((s, i) => s + parseFloat(i.amount), 0);

    return (
        <div style={{ padding: '24px', background: COLORS.lightBg, minHeight: '100vh' }}>
            <Card bordered={false} style={{ borderRadius: 20, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2} style={{ margin: 0, color: COLORS.secondary, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <AccountBookOutlined /> Professional Expense Ledger
                        </Title>
                        <Text type="secondary">Categorize operational costs vs. cost of goods sold (COGS)</Text>
                    </Col>
                    <Col>
                        <Space size="middle">
                            <RangePicker
                                value={dateRange}
                                onChange={(dates) => setDateRange(dates || [null, null])}
                                style={{ borderRadius: 8 }}
                            />
                            <Button icon={<FilterOutlined />} onClick={getList}>Apply Filter</Button>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setEditId(null);
                                    form.resetFields();
                                    form.setFieldsValue({ expense_date: moment(), category_class: 'Operational' });
                                    setVisible(true);
                                }}
                                style={{ background: COLORS.primary, borderColor: COLORS.primary, height: 40, borderRadius: 10, fontWeight: 700 }}
                            >
                                {t.add_expense_btn}
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card style={{ borderRadius: 15, borderLeft: `6px solid ${COLORS.cogs}` }}>
                        <Statistic title={t.cogs} value={totalCOGS} prefix="$" valueStyle={{ color: COLORS.cogs, fontWeight: 800 }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card style={{ borderRadius: 15, borderLeft: `6px solid ${COLORS.opex}` }}>
                        <Statistic title={t.operational} value={totalOpEx} prefix="$" valueStyle={{ color: COLORS.opex, fontWeight: 800 }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card style={{ borderRadius: 15, borderLeft: `6px solid ${COLORS.secondary}`, background: COLORS.secondary }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>{t.total_expenses}</span>} value={totalAll} prefix="$" valueStyle={{ color: '#fff', fontWeight: 900 }} />
                    </Card>
                </Col>
            </Row>

            <div style={{ marginBottom: 20 }}>
                <Input
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder={t.search}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ height: 50, borderRadius: 15, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                />
            </div>

            <Card style={{ borderRadius: 20, overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={filteredList}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 12 }}
                />
            </Card>

            <Modal
                title={<Title level={4} style={{ margin: 0 }}><PlusOutlined /> {editId ? "Update Expense Record" : "New Financial Entry"}</Title>}
                open={visible}
                onCancel={() => setVisible(false)}
                onOk={() => form.submit()}
                width={550}
                centered
                styles={{ content: { borderRadius: 24, padding: 30 } }}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="category_class" label="Accounting Class" rules={[{ required: true }]}>
                                <Select size="large">
                                    <Option value="COGS">📦 COGS (Raw Materials)</Option>
                                    <Option value="Operational">🏢 Operational (OpEx)</Option>
                                    <Option value="Administrative">⚖️ Administrative</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="expense_date" label="Date" rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={14}>
                            <Form.Item name="expense_type_id" label="Expense Category" rules={[{ required: true }]}>
                                <Select placeholder="Pick category" size="large">
                                    {types.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item name="amount" label="Amount (USD)" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} precision={2} prefix="$" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label="Nature of Expense / Description">
                        <Input.TextArea placeholder="Describe the transaction..." rows={3} style={{ borderRadius: 12 }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ExpensePage;
