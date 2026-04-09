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
    DatePicker,
    Divider
} from "antd";
import { request } from "../../util/helper";
import { MdAdd, MdDelete, MdRemoveRedEye, MdInventory, MdQrCodeScanner } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import dayjs from "dayjs";
import { useLanguage, translations } from "../../store/language.store";
import { useProfileStore } from "../../store/profileStore";

function PurchasePage() {
    const { lang } = useLanguage();
    const t = translations[lang];
    const [form] = Form.useForm();
    const { profile } = useProfileStore();
    const isOwner = profile?.role_name?.toUpperCase() === "OWNER" || profile?.role_code === "owner";
    const isAdmin = profile?.role_name?.toUpperCase().includes("ADMIN") || profile?.role_code === "admin";
    const canApprove = isOwner || isAdmin;
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
            const pds = (resPD && !resPD.error) ? resPD.list
                .filter(p => p.product_type !== 'recipe')
                .map(p => ({
                    label: `🥤 ${p.name} [Ready Item]`,
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
        fetchSuppliers();
        fetchAllPurchaseItems();
    };

    const onCloseModal = () => {
        setState(p => ({ ...p, visibleModal: false }));
    };

    const onFinish = async (values) => {
        const rawItems = values.items || [];
        const formattedItems = rawItems.map(item => {
            const qty = Number(item.qty) || 0;
            const cost = Number(item.cost) || 0;
            return {
                product_id: item.real_id, // Backend uses product_id key for both
                item_type: item.item_type,
                qty: qty,
                cost: cost,
                batch_no: item.batch_no,
                expiry_date: item.expiry_date ? item.expiry_date.format("YYYY-MM-DD") : null,
                unit: item.unit,
                remark: item.remark
            };
        });

        const subtotal = formattedItems.reduce((sum, i) => sum + (i.qty * i.cost), 0);
        const totalAmount = subtotal + (Number(values.tax_amount) || 0) - (Number(values.discount_amount) || 0);

        const body = {
            ...values,
            items: formattedItems,
            total_amount: totalAmount,
            paid_amount: values.paid_amount || 0,
            purchase_date: values.purchase_date ? values.purchase_date.format("YYYY-MM-DD HH:mm:ss") : null
        };

        const res = await request("purchase", "post", body);
        if (res && !res.error) {
            message.success(t.product_saved);
            onCloseModal();
            getList();
        } else {
            message.error(res.error || t.create_purchase_failed);
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


    const onScanBarcodeReceive = (barcode) => {
        if (!barcode) return;
        const details = [...state.purchaseDetails];
        const index = details.findIndex(d => d.barcode === barcode);
        if (index > -1) {
            const item = details[index];
            const max = Number(item.qty) - Number(item.received_qty);
            if (item.receive_now < max) {
                details[index].receive_now += 1;
                setState(p => ({ ...p, purchaseDetails: details }));
                message.success(`Received 1 unit of ${item.name}`);
            } else {
                message.warning(`Item ${item.name} is already fully received (Max: ${item.qty})`);
            }
        } else {
            message.error(`Barcode [${barcode}] not found in this purchase order!`);
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
                receive_now: d.receive_now,
                batch_no: d.batch_no,
                expiry_date: d.expiry_date ? d.expiry_date.format("YYYY-MM-DD") : null,
                cost: d.cost
            }))
        };

        const res = await request("purchase-receive", "post", body);
        if (res && !res.error) {
            message.success(t.goods_received_success);
            setState(p => ({ ...p, visibleReceiveModal: false, isSavingReceive: false }));
            getList();
        } else {
            message.error(res.error || t.receive_goods_failed);
            setState(p => ({ ...p, isSavingReceive: false }));
        }
    };

    const onClickDelete = (item) => {
        Modal.confirm({
            title: t.confirm_delete || "Confirm Delete",
            content: "Are you sure you want to remove this purchase record?",
            onOk: async () => {
                const res = await request("purchase", "delete", { id: item.id });
                if (res && !res.error) {
                    message.success("Purchase record removed!");
                    getList();
                } else {
                    message.error(res?.message || "Delete failed");
                }
            }
        });
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
            title: t.no,
            width: 60,
            render: (value, item, index) => (filter.page - 1) * filter.pageSize + index + 1,
        },
        {
            title: t.purchase_date,
            dataIndex: "purchase_date",
            width: 150,
            render: (val) => dayjs(val).format("YYYY-MM-DD HH:mm")
        },
        {
            title: t.ref_no,
            dataIndex: "ref",
            render: (val) => <Tag color="blue">{val}</Tag>
        },
        {
            title: t.supplier,
            dataIndex: "supplier_name",
            render: (val) => <span style={{ fontWeight: 500 }}>{val || t.no_data}</span>
        },
        {
            title: t.total,
            dataIndex: "total_amount",
            align: 'right',
            render: (val) => <span style={{ color: "#2ecc71", fontWeight: "bold" }}>${Number(val).toFixed(2)}</span>
        },
        {
            title: t.paid,
            dataIndex: "paid_amount",
            align: 'right',
            render: (val) => <span style={{ color: "#3498db" }}>${Number(val).toFixed(2)}</span>
        },
        {
            title: t.balance,
            align: 'right',
            render: (_, item) => {
                const balance = (Number(item.total_amount) || 0) - (Number(item.paid_amount) || 0);
                return <Tag color={balance > 0 ? "orange" : "green"}>${balance.toFixed(2)}</Tag>
            }
        },
        {
            title: t.status,
            dataIndex: "status",
            width: 120,
            render: (val) => {
                let color = "orange"; // Pending
                if (val === "Received") color = "green";
                if (val === "Partial") color = "cyan";
                if (val === "Cancelled") color = "red";
                if (val === "Request") color = "purple";
                if (val === "Approved") color = "blue";
                return <Tag color={color} style={{ borderRadius: 6, padding: '2px 8px', textTransform: 'uppercase', fontSize: 10 }}>{val}</Tag>
            }
        },
        {
            title: t.cashier,
            dataIndex: "created_by",
            width: 100,
        },
        {
            title: t.action,
            width: 100,
            align: 'center',
            render: (item) => (
                <Space>
                    {item.status === 'Request' && canApprove && (
                        <Button
                            type="primary"
                            size="small"
                            onClick={async () => {
                                const res = await request("purchase-approve", "post", { id: item.id });
                                if (res && !res.error) {
                                    message.success("Purchase request approved!");
                                    getList();
                                }
                            }}
                        >
                            Approve
                        </Button>
                    )}
                    {(item.status === 'Pending' || item.status === 'Partial' || item.status === 'Approved') && (
                        <Button
                            type="primary"
                            size="small"
                            icon={<MdInventory />}
                            style={{ background: '#2ecc71', borderColor: '#2ecc71' }}
                            onClick={() => onClickReceive(item)}
                        >
                            {t.receiving_now || "Receive"}
                        </Button>
                    )}
                    {(item.status === 'Pending' || item.status === 'Cancelled' || item.status === 'Request') && (
                        <Button
                            type="text"
                            danger
                            size="small"
                            icon={<MdDelete />}
                            onClick={() => onClickDelete(item)}
                        />
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
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>{t.total_purchase}</div>
                            <div style={{ fontSize: "24px", fontWeight: "bold" }}>${totals.totalAmount.toFixed(2)}</div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div className="statCard" style={{ background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>{t.total_paid}</div>
                            <div style={{ fontSize: "24px", fontWeight: "bold" }}>${totals.totalPaid.toFixed(2)}</div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div className="statCard" style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>{t.outstanding_balance}</div>
                            <div style={{ fontSize: "24px", fontWeight: "bold" }}>${totals.totalBalance.toFixed(2)}</div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div className="statCard" style={{ background: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", color: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "12px", textTransform: "uppercase" }}>{t.total_orders}</div>
                            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{state.total}</div>
                        </div>
                    </Col>
                </Row>
            </div>

            <div className="pageHeader" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2>{t.purchase_history}</h2>
                <Space>
                    <Input.Search
                        placeholder={t.search}
                        style={{ width: 250 }}
                        onSearch={(txt) => setFilter({ ...filter, txt, page: 1 })}
                        allowClear
                    />
                    <Button type="primary" icon={<MdAdd />} onClick={onOpenModal}>
                        {t.new_purchase}
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
                title={<b>➕ {t.new_purchase}</b>}
                open={state.visibleModal}
                onCancel={onCloseModal}
                width={1400}
                style={{ top: 20 }}
                footer={null}
                centered
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={onFinish}>
                    <Row gutter={16}>
                        <Col span={4}>
                            <Form.Item name="supplier_id" label={t.supplier} rules={[{ required: true }]}>
                                <Select options={state.suppliers} placeholder={t.supplier} showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item name="ref" label={t.ref_no + " (Invoice #)"}>
                                <Input placeholder="e.g. INV-001" />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item name="purchase_date" label={t.receive_date} rules={[{ required: true }]}>
                                <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item name="status" label={t.status} rules={[{ required: true }]} initialValue={canApprove ? "Received" : "Request"}>
                                <Select options={[
                                    { label: "📥 " + (t.request || "Request (PO)"), value: "Request" },
                                    { label: "⌛ " + t.pending, value: "Pending" },
                                    { label: "✅ " + (t.received || "Received"), value: "Received" },
                                    { label: "❌ " + t.cancelled, value: "Cancelled" }
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item name="payment_method" label={t.payment_method} initialValue="Cash">
                                <Select options={[
                                    { label: "💵 " + t.cash, value: "Cash" },
                                    { label: "💳 " + t.bank, value: "Bank" }
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item name="note" label={t.note}>
                                <Input placeholder={t.note} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider style={{ margin: '15px 0' }} />

                    <div style={{ padding: '0 10px' }}>
                        <Row gutter={8} style={{ fontWeight: 'bold', marginBottom: 12, color: '#555', borderBottom: '2px solid #ddd', paddingBottom: 8, fontSize: 16 }}>
                            <Col span={7}>{t.product}</Col>
                            <Col span={3}>{t.quantity}</Col>
                            <Col span={3}>{t.unit}</Col>
                            <Col span={3}>{t.price}</Col>
                            <Col span={5}>{t.note || "Remark"}</Col>
                            <Col span={2} style={{ textAlign: 'right' }}>{t.total}</Col>
                            <Col span={1}></Col>
                        </Row>

                        <Form.List name="items">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Row key={key} gutter={8} align="middle" style={{ marginBottom: 15, borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
                                            <Col span={7}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'item_composite_id']}
                                                    rules={[{ required: true, message: t.search }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Select
                                                        size="large"
                                                        placeholder={t.product}
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
                                                                items[name].qty = items[name].qty || 1; // Default 1
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
                                            <Col span={3}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'qty']}
                                                    rules={[{ required: true, message: t.quantity }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <InputNumber size="large" placeholder="0.00" min={0.01} style={{ width: '100%' }} onChange={() => setState({ ...state })} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={3}>
                                                <Form.Item name={[name, 'unit']} style={{ marginBottom: 0 }}>
                                                    <Select
                                                        size="large"
                                                        placeholder={t.unit}
                                                        options={[
                                                            { label: "📦 " + (t.case || "កេស"), value: "Case" },
                                                            { label: "💰 " + (t.bag || "បាវ"), value: "Bag" },
                                                            { label: "⚖️ " + (t.kg || "គីឡូ"), value: "Kg" },
                                                            { label: "🧴 " + (t.bottle || "ដប"), value: "Bottle" },
                                                            { label: "🎁 " + (t.pack || "យួរ"), value: "Pack" },
                                                            { label: "🍱 " + (t.box || "ប្រអប់"), value: "Box" },
                                                            { label: "🔘 " + (t.pcs || "គ្រាប់/កែវ"), value: "Pcs" },
                                                            { label: "🛢️ " + (t.liter || "លីត្រ"), value: "L" },
                                                        ]}
                                                        showSearch
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={3}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'cost']}
                                                    rules={[{ required: true, message: t.price }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <InputNumber size="large" placeholder="0.00" min={0} prefix="$" style={{ width: '100%' }} onChange={() => setState({ ...state })} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={5}>
                                                <Form.Item name={[name, 'remark']} style={{ marginBottom: 0 }}>
                                                    <Input size="large" placeholder={t.note || "Remark"} style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={2}>
                                                <div style={{ textAlign: "right", fontWeight: 600, fontSize: 16 }}>
                                                    ${((Number(form.getFieldValue(['items', name, 'qty'])) || 0) * (Number(form.getFieldValue(['items', name, 'cost'])) || 0)).toFixed(2)}
                                                </div>
                                            </Col>
                                            <Col span={1}>
                                                <Button danger type="text" size="large" icon={<MdDelete style={{ fontSize: 20 }} />} onClick={() => { remove(name); setState({ ...state }); }} />
                                            </Col>
                                        </Row>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} block icon={<MdAdd />} style={{ marginTop: 8 }}>
                                        {t.add_new}
                                    </Button>
                                </>
                            )}
                        </Form.List>
                    </div>

                    <div style={{ borderTop: "2px solid #eee", marginTop: 25, paddingTop: 20, background: '#fafafa', padding: 20, borderRadius: 8 }}>
                        <Row gutter={24} align="middle">
                            <Col span={6}>
                                <div style={{ fontSize: 14, color: '#666' }}>{t.subtotal}</div>
                                <div style={{ fontSize: 22, fontWeight: 'bold' }}>
                                    ${(form.getFieldValue("items") || []).reduce((sum, item) => sum + ((Number(item?.qty) || 0) * (Number(item?.cost) || 0)), 0).toFixed(2)}
                                </div>
                            </Col>
                            <Col span={5}>
                                <Form.Item name="tax_amount" label={<b>{t.tax}</b>} style={{ marginBottom: 0 }}>
                                    <InputNumber prefix="$" style={{ width: '100%' }} placeholder="0.00" onChange={() => setState({ ...state })} />
                                </Form.Item>
                            </Col>
                            <Col span={5}>
                                <Form.Item name="discount_amount" label={<b>{t.discount_full}</b>} style={{ marginBottom: 0 }}>
                                    <InputNumber prefix="$" style={{ width: '100%' }} placeholder="0.00" onChange={() => setState({ ...state })} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 16, color: '#666' }}>{t.grand_total}</div>
                                    <div style={{ fontSize: 32, fontWeight: 'bold', color: "#2ecc71" }}>$
                                        {((form.getFieldValue("items") || []).reduce((sum, item) => sum + ((Number(item?.qty) || 0) * (Number(item?.cost) || 0)), 0)
                                            + (Number(form.getFieldValue("tax_amount")) || 0)
                                            - (Number(form.getFieldValue("discount_amount")) || 0)).toFixed(2)}
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <Divider />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Form.Item name="paid_amount" label={<b>{t.paid_amount}</b>} style={{ marginBottom: 0 }}>
                                <InputNumber style={{ width: 180 }} min={0} prefix="$" placeholder="0.00" size="large" />
                            </Form.Item>
                            <Space>
                                <Button onClick={onCloseModal} size="large" style={{ width: 120 }}>{t.cancel}</Button>
                                <Button type="primary" size="large" htmlType="submit" style={{ width: 180, fontWeight: 'bold' }}>
                                    {t.save}
                                </Button>
                            </Space>
                        </div>
                    </div>
                </Form>
            </Modal>
            {/* Receive Goods Modal */}
            <Modal
                title={<b>📥 {t.receiving_now || "Receive Goods"} - {state.selectedPurchase?.ref}</b>}
                open={state.visibleReceiveModal}
                onCancel={() => setState(p => ({ ...p, visibleReceiveModal: false }))}
                width={1250}
                onOk={onFinishReceive}
                confirmLoading={state.isSavingReceive}
                okText={t.save}
                centered
            >
                <div style={{ marginBottom: 20, padding: '15px', background: '#f6f9fc', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #e1e8ed' }}>
                    <div style={{ background: '#2ecc71', padding: '10px', borderRadius: '8px', color: '#fff' }}>
                        <MdQrCodeScanner size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Focus to Scan Crate / Item Barcode</div>
                        <Input
                            placeholder="Scan Product Barcode..."
                            autoFocus
                            style={{ height: '40px', borderRadius: '6px' }}
                            onPressEnter={(e) => {
                                onScanBarcodeReceive(e.target.value);
                                e.target.value = '';
                            }}
                        />
                    </div>
                </div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <span><b>{t.supplier || "Supplier"}:</b> {state.selectedPurchase?.supplier_name}</span>
                    <Tag color="blue">{t.ref_no || "Ref"}: {state.selectedPurchase?.ref}</Tag>
                </div>
                <Table
                    dataSource={state.purchaseDetails}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    columns={[
                        { title: t.product_name, dataIndex: "name" },
                        { title: t.category_name, dataIndex: "item_type", render: (t) => <Tag>{t.replace('_', ' ')}</Tag> },
                        { title: t.unit, dataIndex: "unit", width: 80, align: 'center', render: (v) => <Tag color="blue">{v || "-"}</Tag> },
                        { title: t.paid, dataIndex: "received_qty", width: 80, align: 'center', render: (v) => <Tag color="green">{v}</Tag> },
                        {
                            title: t.price,
                            dataIndex: "cost",
                            width: 120,
                            render: (_, record, index) => (
                                <InputNumber
                                    min={0}
                                    size="small"
                                    prefix="$"
                                    value={record.cost}
                                    style={{ width: '100%', fontWeight: 'bold', color: '#2c3e50' }}
                                    onChange={(val) => {
                                        const details = [...state.purchaseDetails];
                                        details[index].cost = val;
                                        setState(p => ({ ...p, purchaseDetails: details }));
                                    }}
                                />
                            )
                        },
                        {
                            title: t.batch_no,
                            dataIndex: "batch_no",
                            width: 110,
                            render: (_, record, index) => (
                                <Input
                                    placeholder={t.batch_no}
                                    size="small"
                                    value={record.batch_no}
                                    onChange={(e) => {
                                        const details = [...state.purchaseDetails];
                                        details[index].batch_no = e.target.value;
                                        setState(p => ({ ...p, purchaseDetails: details }));
                                    }}
                                />
                            )
                        },
                        {
                            title: t.expiry_date,
                            dataIndex: "expiry_date",
                            width: 130,
                            render: (_, record, index) => (
                                <DatePicker
                                    placeholder={t.expiry_date}
                                    size="small"
                                    style={{ width: '100%' }}
                                    value={record.expiry_date}
                                    onChange={(date) => {
                                        const details = [...state.purchaseDetails];
                                        details[index].expiry_date = date;
                                        setState(p => ({ ...p, purchaseDetails: details }));
                                    }}
                                />
                            )
                        },
                        {
                            title: t.receiving_now,
                            width: 110,
                            render: (_, record, index) => (
                                <InputNumber
                                    min={0}
                                    max={Number(record.qty) - Number(record.received_qty)}
                                    value={record.receive_now}
                                    style={{ width: '100%', borderColor: '#2ecc71' }}
                                    size="small"
                                    onChange={(val) => {
                                        const details = [...state.purchaseDetails];
                                        details[index].receive_now = val;
                                        setState(p => ({ ...p, purchaseDetails: details }));
                                    }}
                                />
                            )
                        },
                        {
                            title: t.total,
                            width: 100,
                            align: 'right',
                            render: (_, record) => (
                                <div style={{ fontWeight: 'bold', color: '#16a085' }}>
                                    ${(Number(record.receive_now || 0) * Number(record.cost || 0)).toFixed(2)}
                                </div>
                            )
                        },
                        {
                            title: t.note,
                            width: 150,
                            render: (_, record, index) => (
                                <Input
                                    placeholder={t.note}
                                    size="small"
                                    value={record.remark}
                                    onChange={(e) => {
                                        const details = [...state.purchaseDetails];
                                        details[index].remark = e.target.value;
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
