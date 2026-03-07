import React, { useEffect, useState } from "react";
import {
    Button,
    Col,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Row,
    Select,
    Space,
    Table,
    Tag,
    DatePicker
} from "antd";
import { request } from "../../util/helper";
import { MdAdd, MdDelete, MdRemoveRedEye, MdInventory } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import dayjs from "dayjs";

function PurchasePage() {
    const [form] = Form.useForm();
    const [state, setState] = useState({
        list: [],
        loading: false,
        visibleModal: false,
        suppliers: [],
        rawMaterials: [],
        allItems: [], // Combined products + raw materials
        total: 0,
        isFetchingItems: false,
        visibleReceiveModal: false,
        selectedPurchase: null,
        purchaseDetails: [],
        isSavingReceive: false,
    });
    const [totals, setTotals] = useState({
        totalAmount: 0,
        totalPaid: 0,
        totalBalance: 0
    });
    const [filter, setFilter] = useState({
        page: 1,
        pageSize: 10,
        txt: "",
    });

    useEffect(() => {
        getList();
        // The provided server-side code snippet was incorrect for this client-side React component.
        // The instructions imply changing API endpoints within the component.
        // The existing `request` calls for "purchase-details" and "purchase-receive" already use hyphens.
        // No change is needed here based on the provided instructions and code.
    }, [filter]);

    const getList = async () => {
        setState((pre) => ({ ...pre, loading: true }));
        const res = await request("purchase", "get", filter);
        if (res && !res.error) {
            setState((pre) => ({
                ...pre,
                list: res.list,
                total: res.total,
                loading: false,
            }));

            // Calculate local summary for the current view (or fetch from server)
            let amt = 0, paid = 0;
            res.list.forEach(i => {
                amt += Number(i.total_amount) || 0;
                paid += Number(i.paid_amount) || 0;
            });
            setTotals({
                totalAmount: amt,
                totalPaid: paid,
                totalBalance: amt - paid
            });
        } else {
            setState((pre) => ({ ...pre, loading: false }));
        }
    };

    const fetchSuppliers = async () => {
        const res = await request("supplier", "get");
        if (res && !res.error) {
            setState(pre => ({
                ...pre,
                suppliers: res.list.map(s => ({ label: s.name, value: s.id }))
            }));
        }
    };

    const fetchAllPurchaseItems = async () => {
        setState(pre => ({ ...pre, isFetchingItems: true }));
        try {
            // 1. Fetch Raw Materials
            const resRM = await request("raw_material", "get", { status: 1 });
            const rms = (resRM && !resRM.error) ? resRM.list.map(rm => ({
                label: `📦 ${rm.name} [Ingredient]`,
                value: `rm-${rm.id}`,
                item_id: rm.id,
                item_type: 'raw_material',
                price: rm.price || 0,
                name: rm.name
            })) : [];

            // 2. Fetch Finished Products
            const resPD = await request("product", "get", { is_list_all: 1 });
            const pds = (resPD && !resPD.error) ? resPD.list.map(p => ({
                label: `🥤 ${p.name} [Product]`,
                value: `pd-${p.id}`,
                item_id: p.id,
                item_type: 'product',
                price: p.cost_price || 0,
                name: p.name
            })) : [];

            setState(pre => ({
                ...pre,
                allItems: [...rms, ...pds],
                isFetchingItems: false
            }));
        } catch (error) {
            setState(pre => ({ ...pre, isFetchingItems: false }));
        }
    };

    const onOpenModal = () => {
        form.resetFields();
        form.setFieldsValue({
            purchase_date: dayjs(),
            items: [null]
        });
        setState(p => ({ ...p, visibleModal: true }));
    };

    const onCloseModal = () => {
        setState(p => ({ ...p, visibleModal: false }));
    };

    const onFinish = async (values) => {
        // Calculate total amount from items and map correctly for backend
        let totalAmount = 0;
        const rawItems = values.items || [];
        const formattedItems = rawItems.map(item => {
            const qty = Number(item.qty) || 0;
            const cost = Number(item.cost) || 0;
            totalAmount += qty * cost;

            // Extract real ID and Type from the composite value if needed
            // or just use the extra properties we'll inject via Select onChange
            return {
                product_id: item.real_id, // Backend uses product_id key for both
                item_type: item.item_type,
                qty: qty,
                cost: cost
            };
        });

        const body = {
            ...values,
            items: formattedItems,
            total_amount: totalAmount,
            paid_amount: values.paid_amount || 0,
            purchase_date: values.purchase_date ? values.purchase_date.format("YYYY-MM-DD HH:mm:ss") : null
        };

        const res = await request("purchase", "post", body);
        if (res && !res.error) {
            message.success("Purchase created successfully");
            onCloseModal();
            getList();
        } else {
            message.error(res.error || "Failed to create purchase");
        }
    };

    const onClickReceive = async (item) => {
        setState(p => ({ ...p, loading: true }));
        const res = await request("purchase-details", "get", { id: item.id });
        if (res && !res.error) {
            setState(p => ({
                ...p,
                selectedPurchase: item,
                purchaseDetails: res.list.map(i => ({
                    ...i,
                    receive_now: Number(i.qty) - Number(i.received_qty) // Default to remaining
                })),
                visibleReceiveModal: true,
                loading: false
            }));
        } else {
            setState(p => ({ ...p, loading: false }));
        }
    };

    const onFinishReceive = async () => {
        setState(p => ({ ...p, isSavingReceive: true }));
        const body = {
            purchase_id: state.selectedPurchase.id,
            items: state.purchaseDetails.map(d => ({
                id: d.id,
                real_id: d.product_id || d.raw_material_id,
                item_type: d.item_type,
                receive_now: d.receive_now
            }))
        };

        const res = await request("purchase-receive", "post", body);
        if (res && !res.error) {
            message.success("Goods received and stock updated!");
            setState(p => ({ ...p, visibleReceiveModal: false, isSavingReceive: false }));
            getList();
        } else {
            message.error(res.error || "Failed to receive goods");
            setState(p => ({ ...p, isSavingReceive: false }));
        }
    };

    const calculateTotal = () => {
        const items = form.getFieldValue("items") || [];
        let total = 0;
        items.forEach(item => {
            if (item) total += (Number(item.qty) || 0) * (Number(item.cost) || 0);
        });
        return total;
    };

    const columns = [
        {
            title: "No",
            width: 60,
            render: (value, item, index) => (filter.page - 1) * filter.pageSize + index + 1,
        },
        {
            title: "Purchase Date",
            dataIndex: "purchase_date",
            width: 150,
            render: (val) => dayjs(val).format("YYYY-MM-DD HH:mm")
        },
        {
            title: "Ref #",
            dataIndex: "ref",
            render: (val) => <Tag color="blue">{val}</Tag>
        },
        {
            title: "Supplier",
            dataIndex: "supplier_name",
            render: (val) => <span style={{ fontWeight: 500 }}>{val || "N/A"}</span>
        },
        {
            title: "Total",
            dataIndex: "total_amount",
            align: 'right',
            render: (val) => <span style={{ color: "#2ecc71", fontWeight: "bold" }}>${Number(val).toFixed(2)}</span>
        },
        {
            title: "Paid",
            dataIndex: "paid_amount",
            align: 'right',
            render: (val) => <span style={{ color: "#3498db" }}>${Number(val).toFixed(2)}</span>
        },
        {
            title: "Balance",
            align: 'right',
            render: (_, item) => {
                const balance = (Number(item.total_amount) || 0) - (Number(item.paid_amount) || 0);
                return <Tag color={balance > 0 ? "orange" : "green"}>${balance.toFixed(2)}</Tag>
            }
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 120,
            render: (val) => {
                let color = "orange"; // Pending
                if (val === "Received") color = "green";
                if (val === "Partial") color = "cyan";
                if (val === "Cancelled") color = "red";
                return <Tag color={color} style={{ borderRadius: 6, padding: '2px 8px', textTransform: 'uppercase', fontSize: 10 }}>{val}</Tag>
            }
        },
        {
            title: "Created By",
            dataIndex: "created_by",
            width: 100,
        },
        {
            title: "Action",
            width: 100,
            align: 'center',
            render: (item) => (
                <Space>
                    {(item.status === 'Pending' || item.status === 'Partial') && (
                        <Button
                            type="primary"
                            size="small"
                            icon={<MdInventory />}
                            style={{ background: '#2ecc71', borderColor: '#2ecc71' }}
                            onClick={() => onClickReceive(item)}
                        >
                            Receive
                        </Button>
                    )}
                </Space>
            )
        }
    ];

    return (
        <MainPage loading={state.loading}>
            <div style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                    <Col span={6}>
                        <div className="statCard" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>Total Purchase</div>
                            <div style={{ fontSize: "24px", fontWeight: "bold" }}>${totals.totalAmount.toFixed(2)}</div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div className="statCard" style={{ background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>Total Paid</div>
                            <div style={{ fontSize: "24px", fontWeight: "bold" }}>${totals.totalPaid.toFixed(2)}</div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div className="statCard" style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>Outstanding Balance</div>
                            <div style={{ fontSize: "24px", fontWeight: "bold" }}>${totals.totalBalance.toFixed(2)}</div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div className="statCard" style={{ background: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>Total Orders</div>
                            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{state.total}</div>
                        </div>
                    </Col>
                </Row>
            </div>

            <div className="pageHeader" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2>Purchase History</h2>
                <Space>
                    <Input.Search
                        placeholder="Search Ref#"
                        style={{ width: 250 }}
                        onSearch={(txt) => setFilter({ ...filter, txt, page: 1 })}
                        allowClear
                    />
                    <Button type="primary" icon={<MdAdd />} onClick={onOpenModal}>
                        New Purchase
                    </Button>
                </Space>
            </div>

            <Table
                rowKey="id"
                dataSource={state.list}
                columns={columns}
                size="middle"
                pagination={{
                    current: filter.page,
                    pageSize: filter.pageSize,
                    total: state.total,
                    showSizeChanger: true,
                    onChange: (page, pageSize) => setFilter({ ...filter, page, pageSize })
                }}
            />

            <Modal
                title={<b>➕ New Purchase Entry</b>}
                open={state.visibleModal}
                onCancel={onCloseModal}
                width={850}
                footer={null}
                centered
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={onFinish}>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item name="supplier_id" label="Supplier" rules={[{ required: true }]}>
                                <Select options={state.suppliers} placeholder="Select Supplier" showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="purchase_date" label="Receive Date" rules={[{ required: true }]}>
                                <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="status" label="Status" rules={[{ required: true }]} initialValue="Received">
                                <Select options={[
                                    { label: "⏳ Pending", value: "Pending" },
                                    { label: "✅ Received", value: "Received" },
                                    { label: "❌ Cancelled", value: "Cancelled" }
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="note" label="Internal Note">
                                <Input placeholder="Ref invoice, batch info etc." />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ background: "#fcfcfc", border: "1px solid #eee", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
                        <div style={{ marginBottom: "12px", fontWeight: 600, color: "#555" }}>Purchase Items</div>
                        <Form.List name="items">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Row key={key} gutter={12} align="middle" style={{ marginBottom: 12 }}>
                                            <Col span={9}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'item_composite_id']}
                                                    rules={[{ required: true, message: 'Select item' }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Select
                                                        placeholder="Search Product or Ingredient"
                                                        options={state.allItems}
                                                        loading={state.isFetchingItems}
                                                        showSearch
                                                        filterOption={(input, option) =>
                                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                        }
                                                        onChange={(val) => {
                                                            const item = state.allItems.find(i => i.value === val);
                                                            if (item) {
                                                                const fValues = form.getFieldsValue();
                                                                const items = [...fValues.items];
                                                                items[name].cost = item.price;
                                                                items[name].item_type = item.item_type;
                                                                items[name].real_id = item.item_id;
                                                                form.setFieldsValue({ items });
                                                                setState(p => ({ ...p })); // Refresh total display
                                                            }
                                                        }}
                                                    />
                                                </Form.Item>
                                                <Form.Item name={[name, 'item_type']} noStyle><Input type="hidden" /></Form.Item>
                                                <Form.Item name={[name, 'real_id']} noStyle><Input type="hidden" /></Form.Item>
                                            </Col>
                                            <Col span={5}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'qty']}
                                                    rules={[{ required: true, message: 'Qty' }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <InputNumber placeholder="Qty" min={0.01} style={{ width: '100%' }} onChange={() => setState({ ...state })} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={5}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'cost']}
                                                    rules={[{ required: true, message: 'Cost' }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <InputNumber placeholder="Unit Cost" min={0} prefix="$" style={{ width: '100%' }} onChange={() => setState({ ...state })} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={3}>
                                                <div style={{ textAlign: "right", fontWeight: 600 }}>
                                                    ${((Number(form.getFieldValue(['items', name, 'qty'])) || 0) * (Number(form.getFieldValue(['items', name, 'cost'])) || 0)).toFixed(2)}
                                                </div>
                                            </Col>
                                            <Col span={2}>
                                                <Button danger type="text" icon={<MdDelete />} onClick={() => { remove(name); setState({ ...state }); }} />
                                            </Col>
                                        </Row>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} block icon={<MdAdd />} style={{ marginTop: 8 }}>
                                        Add New Ingredient
                                    </Button>
                                </>
                            )}
                        </Form.List>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee", paddingTop: 20 }}>
                        <div style={{ fontSize: 18 }}>
                            Total Amount: <b style={{ color: "#2ecc71" }}>$
                                {(form.getFieldValue("items") || []).reduce((sum, item) => sum + ((Number(item?.qty) || 0) * (Number(item?.cost) || 0)), 0).toFixed(2)}
                            </b>
                        </div>
                        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                            <Form.Item name="paid_amount" label="Amount Paid" style={{ marginBottom: 0 }}>
                                <InputNumber style={{ width: 150 }} min={0} prefix="$" placeholder="0.00" />
                            </Form.Item>
                            <Space style={{ marginTop: 24 }}>
                                <Button onClick={onCloseModal}>Cancel</Button>
                                <Button type="primary" size="large" htmlType="submit" style={{ paddingLeft: 30, paddingRight: 30 }}>
                                    Save Purchase
                                </Button>
                            </Space>
                        </div>
                    </div>
                </Form>
            </Modal>
            {/* Receive Goods Modal */}
            <Modal
                title={<b>📥 Receive Goods - {state.selectedPurchase?.ref}</b>}
                open={state.visibleReceiveModal}
                onCancel={() => setState(p => ({ ...p, visibleReceiveModal: false }))}
                width={800}
                onOk={onFinishReceive}
                confirmLoading={state.isSavingReceive}
                okText="Receive Items"
                centered
            >
                <div style={{ marginBottom: 16 }}>
                    <b>Supplier:</b> {state.selectedPurchase?.supplier_name} <br />
                    <small>Ordered Qty vs Received Qty. Enter amount coming in now.</small>
                </div>
                <Table
                    dataSource={state.purchaseDetails}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    columns={[
                        { title: "Item Name", dataIndex: "name" },
                        { title: "Type", dataIndex: "item_type", render: (t) => <Tag>{t.replace('_', ' ')}</Tag> },
                        { title: "Ordered", dataIndex: "qty", align: 'center' },
                        { title: "Received", dataIndex: "received_qty", align: 'center', render: (v) => <Tag color="green">{v}</Tag> },
                        {
                            title: "Receiving Now",
                            width: 150,
                            render: (_, record, index) => (
                                <InputNumber
                                    min={0}
                                    max={Number(record.qty) - Number(record.received_qty)}
                                    value={record.receive_now}
                                    style={{ width: '100%' }}
                                    onChange={(val) => {
                                        const details = [...state.purchaseDetails];
                                        details[index].receive_now = val;
                                        setState(p => ({ ...p, purchaseDetails: details }));
                                    }}
                                />
                            )
                        }
                    ]}
                />
            </Modal>
        </MainPage>
    );
}

export default PurchasePage;
