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
    Col
} from "antd";
import { MdHistory, MdAdd } from "react-icons/md";
import { request, formatDateClient } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";

const { Title } = Typography;
const { Option } = Select;

function StockPage() {
    const [form] = Form.useForm();
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
    });

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
        // Fetch products and raw materials together but handle them separately
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

    const onCloseModal = () => {
        setState((p) => ({ ...p, visibleModal: false }));
        form.resetFields();
    };

    const onFinish = async (values) => {
        const res = await request("stock/adjust", "post", values);
        if (res && !res.error) {
            message.success(res.message);
            onCloseModal();
            getLogs();
        } else {
            message.error(res?.message || "Adjustment failed");
        }
    };

    return (
        <MainPage loading={state.loading}>
            <div style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                    <Col span={6}>
                        <div style={{ background: "linear-gradient(135deg, #1e4a2d 0%, #2d6a42 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>Total Products Menu</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{state.products.length}</div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div style={{ background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>Raw Materials</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{state.rawMaterials.length}</div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>Low Stock Products</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                                {state.products.filter(p => Number(p.qty || 0) <= 10).length}
                            </div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div style={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>Low Stock Materials</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                                {state.rawMaterials.filter(rm => Number(rm.qty || 0) <= 5).length}
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>

            <Card bordered={false} style={{ borderRadius: 15, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <Space>
                        <div style={{ padding: 8, background: "#e6f4ea", borderRadius: 10, display: 'flex' }}>
                            <MdHistory size={24} style={{ color: "#2d6a42" }} />
                        </div>
                        <Title level={4} style={{ margin: 0 }}>Stock Logs & Adjustments</Title>
                    </Space>
                    <Button
                        type="primary"
                        icon={<MdAdd />}
                        onClick={() => {
                            setState(s => ({ ...s, visibleModal: true }));
                            getItems(); // Fetch data when modal opens
                        }}
                        style={{ background: "#2d6a42", borderColor: "#2d6a42", borderRadius: 8 }}
                        size="large"
                    >
                        Manual Adjustment
                    </Button>
                </div>

                <Row gutter={16} style={{ marginBottom: 20 }}>
                    <Col span={6}>
                        <Select
                            placeholder="Filter by Item Type"
                            allowClear
                            style={{ width: '100%' }}
                            onChange={(v) => setFilters(f => ({ ...f, item_type: v }))}
                        >
                            <Option value="product">Product</Option>
                            <Option value="raw_material">Raw Material</Option>
                        </Select>
                    </Col>
                    <Col span={6}>
                        <Select
                            placeholder="Filter by Type"
                            allowClear
                            style={{ width: '100%' }}
                            onChange={(v) => setFilters(f => ({ ...f, type: v }))}
                        >
                            <Option value="purchase">Purchase</Option>
                            <Option value="sale">Sale / Order</Option>
                            <Option value="adjustment">Manual Correction</Option>
                            <Option value="waste">Waste / Expired</Option>
                        </Select>
                    </Col>
                </Row>

                <Table
                    dataSource={state.logs}
                    rowKey="id"
                    pagination={{ pageSize: 15 }}
                    columns={[
                        {
                            title: "DateTime",
                            dataIndex: "created_at",
                            render: (d) => formatDateClient(d, "DD/MM HH:mm")
                        },
                        {
                            title: "Category",
                            dataIndex: "item_type",
                            render: (v) => <Tag color={v === 'product' ? 'blue' : 'cyan'}>{v.toUpperCase()}</Tag>
                        },
                        {
                            title: "Item Name",
                            dataIndex: "item_name",
                            render: (name) => <span style={{ fontWeight: 600 }}>{name}</span>
                        },
                        {
                            title: "Transaction",
                            dataIndex: "type",
                            render: (v) => {
                                let color = "grey";
                                if (v === 'purchase') color = "green";
                                if (v === 'receive') color = "purple";
                                if (v === 'sale') color = "blue";
                                if (v === 'adjustment') color = "orange";
                                if (v === 'waste') color = "red";
                                return <Tag color={color}>{v.toUpperCase()}</Tag>
                            }
                        },
                        {
                            title: "Change",
                            dataIndex: "qty_changed",
                            align: 'right',
                            render: (v) => <span style={{ color: v > 0 ? '#3f8600' : '#cf1322', fontWeight: 700 }}>{v > 0 ? `+${v}` : v}</span>
                        },
                        {
                            title: "Balance",
                            dataIndex: "new_qty",
                            align: 'right',
                            render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>
                        },
                        {
                            title: "Staff",
                            dataIndex: "staff_name",
                            render: (v) => <span style={{ fontSize: '0.85rem' }}>{v}</span>
                        },
                        {
                            title: "Reason",
                            dataIndex: "reason",
                            ellipsis: true
                        }
                    ]}
                />
            </Card>

            <Modal
                title={<Title level={4}>Stock Correction</Title>}
                open={state.visibleModal}
                onCancel={onCloseModal}
                footer={null}
                centered
                width={450}
            >
                <Form layout="vertical" form={form} onFinish={onFinish} style={{ marginTop: 15 }}>
                    <Form.Item name="item_type" label="Inventory Item Type" rules={[{ required: true }]}>
                        <Select placeholder="Select type..." onChange={() => form.setFieldValue("item_id", undefined)}>
                            <Option value="product">Global Product (Branch Stock)</Option>
                            <Option value="raw_material">Raw Material (Global Stock)</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) => prev.item_type !== curr.item_type}
                    >
                        {({ getFieldValue }) => {
                            const itemType = getFieldValue("item_type");
                            const items = itemType === 'product' ? state.products : state.rawMaterials;
                            const options = items.map(item => ({
                                label: `${item.name} ${item.code ? `(${item.code})` : ''} - Current: ${item.qty || 0} ${item.unit || ''}`,
                                value: item.id
                            }));

                            return (
                                <Form.Item name="item_id" label="Select Item" rules={[{ required: true }]}>
                                    <Select
                                        placeholder="Search item..."
                                        showSearch
                                        optionFilterProp="label"
                                        options={options}
                                        loading={state.loading}
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="type" label="Action Type" rules={[{ required: true }]}>
                                <Select placeholder="Correction/Waste">
                                    <Option value="adjustment">Correction (+/-)</Option>
                                    <Option value="waste">Waste/Loss (-)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="qty_changed" label="Qty Change" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} placeholder="e.g. 10 or -5" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="reason" label="Remark / Reason" rules={[{ required: true }]}>
                        <Input.TextArea rows={2} placeholder="Why this adjustment is needed?" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block style={{ background: "#2d6a42", height: 45, borderRadius: 8 }}>
                        Save Inventory Change
                    </Button>
                </Form>
            </Modal>
        </MainPage>
    );
}

export default StockPage;
