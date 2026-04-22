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
import { MdAdd, MdDelete, MdRemoveRedEye, MdInventory, MdQrCodeScanner, MdOutlineCameraAlt } from "react-icons/md";
import { Html5QrcodeScanner } from "html5-qrcode";
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
        batch_receive: "",
        expiry_receive: null,
        txt_barcode: "", // 🚀 New state for controlled input
        scanFilterId: null, // 🚀 Changed: Use Item ID for more reliable filtering
        showCamera: false, // 🚀 To toggle camera scanner
    });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        let scanner = null;
        if (state.showCamera && state.visibleReceiveModal) {
            scanner = new Html5QrcodeScanner("reader", { 
                fps: 10, 
                qrbox: { width: 300, height: 200 },
                aspectRatio: 1.0
            });
            scanner.render((result) => {
                onScanBarcodeReceive(result);
            }, (error) => {
                // Ignore errors during scanning
            });
        }
        return () => {
            if (scanner) {
                scanner.clear().catch(e => console.log("Scanner cleanup"));
            }
        };
    }, [state.showCamera, state.visibleReceiveModal]);

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
                    receive_now: Number(i.qty) - Number(i.received_qty), // Default to remaining
                    expiry_date: i.expiry_date ? dayjs(i.expiry_date) : null
                })),
                visibleReceiveModal: true,
                loading: false,
                batch_receive: "", // 🚀 Clear on open
                expiry_receive: null, // 🚀 Clear on open
                txt_barcode: "", // 🚀 Clear barcode input on open
                scanFilterId: null, // 🚀 Clear filter on open
                showCamera: false // 🚀 Ensure camera is closed
            }));
        } else {
            setState(p => ({ ...p, loading: false }));
        }
    };


    const onScanBarcodeReceive = (barcode) => {
        if (!barcode) return;
        const clean = (s) => String(s || "").replace(/\D/g, ""); // 🚀 Keep only numbers
        const scanned = clean(barcode);
        const details = [...state.purchaseDetails];
        
        // 🚀 Debug: Show cleaned barcodes
        console.log("Scanned (Clean):", scanned);
        console.log("Available (Clean):", details.map(d => clean(d.barcode)));

        let finalIndex = details.findIndex(d => {
            const itemBarcode = clean(d.barcode);
            if (!itemBarcode) return false;
            return itemBarcode === scanned; // 🚀 Exact numeric match
        });

        if (finalIndex === -1) {
            // Try partial numeric match if exact fails
            finalIndex = details.findIndex(d => {
                const itemBarcode = clean(d.barcode);
                if (!itemBarcode) return false;
                return itemBarcode.includes(scanned) || scanned.includes(itemBarcode);
            });
        }

        if (finalIndex > -1) {
            const item = details[finalIndex];
            const max = Number(item.qty) - Number(item.received_qty);
            
            details[finalIndex].receive_now += 1;
            if (details[finalIndex].receive_now > max) {
                message.info(`Note: ${item.name} is exceeding order quantity.`);
            }
            
            if (state.batch_receive) details[finalIndex].batch_no = state.batch_receive;
            if (state.expiry_receive) details[finalIndex].expiry_date = state.expiry_receive;

                setState(p => ({ 
                    ...p, 
                    purchaseDetails: details, 
                    txt_barcode: "",
                    scanFilterId: item.id, // 🚀 Filter by Item ID
                    showCamera: false // 🚀 Auto-close camera on success
                }));
            message.success(`Received 1 unit of ${item.name}`);
        } else {
            message.error(`Barcode [${scanned}] not found in this purchase order!`);
            setState(p => ({ ...p, txt_barcode: "" }));
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
            {/* 🚀 Dashboard Stats */}
            <div style={{ marginBottom: 20 }}>
                <Row gutter={[16, 16]}>
                    <Col xs={12} sm={12} md={6}>
                        <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", padding: isMobile ? "15px" : "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "10px", textTransform: "uppercase" }}>{t.total_purchase}</div>
                            <div style={{ fontSize: isMobile ? "18px" : "24px", fontWeight: "bold" }}>${totals.totalAmount.toFixed(2)}</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                        <div style={{ background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", color: "#fff", padding: isMobile ? "15px" : "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "10px", textTransform: "uppercase" }}>{t.total_paid}</div>
                            <div style={{ fontSize: isMobile ? "18px" : "24px", fontWeight: "bold" }}>${totals.totalPaid.toFixed(2)}</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                        <div style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "#fff", padding: isMobile ? "15px" : "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "10px", textTransform: "uppercase" }}>{t.outstanding}</div>
                            <div style={{ fontSize: isMobile ? "18px" : "24px", fontWeight: "bold" }}>${totals.totalBalance.toFixed(2)}</div>
                        </div>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                        <div style={{ background: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", color: "#fff", padding: isMobile ? "15px" : "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                            <div style={{ opacity: 0.8, fontSize: "10px", textTransform: "uppercase" }}>{t.total_orders}</div>
                            <div style={{ fontSize: isMobile ? "18px" : "24px", fontWeight: "bold" }}>{state.total}</div>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* 🚀 Header & Search */}
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 15, alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <Space>
                    <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: "bold", color: '#1e293b' }}>{t.purchase}</div>
                    <Input.Search
                        placeholder={t.search}
                        onSearch={(txt) => setFilter(pre => ({ ...pre, txt, page: 1 }))}
                        allowClear
                        style={{ width: isMobile ? '160px' : '300px' }}
                    />
                </Space>
                <Button type="primary" icon={<MdAdd />} onClick={onOpenModal} size={isMobile ? "middle" : "large"} style={{ borderRadius: '8px', fontWeight: 'bold' }}>
                    {isMobile ? t.add : t.new_purchase}
                </Button>
            </div>

            {/* 🚀 Main Purchase List (Mobile Cards / Desktop Table) */}
            {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {state.list.map((item) => (
                        <div key={item.id} style={{ background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <Tag color="blue" style={{ fontSize: '13px', padding: '2px 10px', borderRadius: '6px' }}>{item.ref}</Tag>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{dayjs(item.purchase_date).format("DD/MM/YYYY")}</span>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Supplier</div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{item.supplier_name}</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px', background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>TOTAL</div>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>${Number(item.total_amount).toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>STATUS</div>
                                    <Tag color={item.status === 'RECEIVED' ? 'green' : item.status === 'PARTIAL' ? 'orange' : 'blue'}>{item.status}</Tag>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button icon={<MdRemoveRedEye />} style={{ flex: 1, height: '42px', borderRadius: '10px' }} onClick={() => { setState(p => ({ ...p, selectedPurchase: item, visibleModal: true })); }} />
                                <Button type="primary" icon={<MdInventory />} style={{ flex: 3, height: '42px', borderRadius: '10px', background: '#3b82f6', fontWeight: 600 }} onClick={() => onClickReceive(item)}>RECEIVE NOW</Button>
                                {canApprove && item.status === 'PENDING' && (
                                    <Button danger icon={<MdDelete />} style={{ width: '42px', height: '42px', borderRadius: '10px' }} onClick={() => onClickDelete(item)} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Table
                    dataSource={state.list}
                    loading={state.loading}
                    rowKey="id"
                    columns={columns}
                    pagination={{
                        total: state.total,
                        current: filter.page,
                        pageSize: filter.pageSize,
                        onChange: (page, pageSize) => setFilter(pre => ({ ...pre, page, pageSize }))
                    }}
                />
            )}

            {/* 🚀 CREATE PURCHASE MODAL */}
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
                        <Col span={4}><Form.Item name="supplier_id" label={t.supplier} rules={[{ required: true }]}><Select options={state.suppliers} placeholder={t.supplier} showSearch /></Form.Item></Col>
                        <Col span={4}><Form.Item name="ref" label={t.ref_no}><Input placeholder="Invoice #" /></Form.Item></Col>
                        <Col span={4}><Form.Item name="purchase_date" label={t.receive_date} rules={[{ required: true }]}><DatePicker showTime style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={4}><Form.Item name="status" label={t.status} rules={[{ required: true }]} initialValue="Received"><Select options={[{ label: "📥 Request", value: "Request" }, { label: "⌛ Pending", value: "Pending" }, { label: "✅ Received", value: "Received" }]} /></Form.Item></Col>
                        <Col span={4}><Form.Item name="payment_method" label={t.payment_method} initialValue="Cash"><Select options={[{ label: "💵 Cash", value: "Cash" }, { label: "💳 Bank", value: "Bank" }]} /></Form.Item></Col>
                        <Col span={4}><Form.Item name="note" label={t.note}><Input placeholder={t.note} /></Form.Item></Col>
                    </Row>
                    <Divider style={{ margin: '15px 0' }} />
                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={8} align="middle" style={{ marginBottom: 15 }}>
                                        <Col span={7}>
                                            <Form.Item {...restField} name={[name, 'item_composite_id']} rules={[{ required: true }]}>
                                                <Select placeholder={t.product} options={state.allItems} showSearch onChange={(val) => {
                                                    const item = state.allItems.find(i => i.value === val);
                                                    if (item) {
                                                        const items = [...form.getFieldValue('items')];
                                                        items[name].cost = item.price;
                                                        items[name].qty = items[name].qty || 1;
                                                        items[name].item_type = item.item_type;
                                                        items[name].real_id = item.item_id;
                                                        form.setFieldsValue({ items });
                                                        setState(p => ({ ...p }));
                                                    }
                                                }} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={3}><Form.Item {...restField} name={[name, 'qty']} rules={[{ required: true }]}><InputNumber placeholder="Qty" style={{ width: '100%' }} onChange={() => setState({ ...state })} /></Form.Item></Col>
                                        <Col span={3}><Form.Item name={[name, 'unit']}><Select placeholder={t.unit} options={[{ label: "Pcs", value: "Pcs" }, { label: "Box", value: "Box" }, { label: "Case", value: "Case" }]} /></Form.Item></Col>
                                        <Col span={3}><Form.Item {...restField} name={[name, 'cost']} rules={[{ required: true }]}><InputNumber prefix="$" style={{ width: '100%' }} onChange={() => setState({ ...state })} /></Form.Item></Col>
                                        <Col span={5}><Form.Item name={[name, 'remark']}><Input placeholder={t.note} /></Form.Item></Col>
                                        <Col span={2} style={{ textAlign: "right", fontWeight: 'bold' }}>${((form.getFieldValue(['items', name, 'qty']) || 0) * (form.getFieldValue(['items', name, 'cost']) || 0)).toFixed(2)}</Col>
                                        <Col span={1}><Button danger type="text" icon={<MdDelete />} onClick={() => remove(name)} /></Col>
                                    </Row>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<MdAdd />}>{t.add_new}</Button>
                            </>
                        )}
                    </Form.List>
                    <Divider />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <Form.Item name="paid_amount" label={<b>{t.paid_amount}</b>}><InputNumber prefix="$" style={{ width: 180 }} /></Form.Item>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 16, color: '#666' }}>{t.grand_total}</div>
                            <div style={{ fontSize: 32, fontWeight: 'bold', color: "#2ecc71" }}>
                                ${(form.getFieldValue("items") || []).reduce((sum, item) => sum + ((Number(item?.qty) || 0) * (Number(item?.cost) || 0)), 0).toFixed(2)}
                            </div>
                            <Space style={{ marginTop: 20 }}>
                                <Button onClick={onCloseModal}>{t.cancel}</Button>
                                <Button type="primary" htmlType="submit" style={{ fontWeight: 'bold' }}>{t.save}</Button>
                            </Space>
                        </div>
                    </div>
                </Form>
            </Modal>

            {/* 🚀 RECEIVE GOODS MODAL */}
            <Modal
                title={<b>📥 {t.receiving_now || "Receive Goods"} - {state.selectedPurchase?.ref}</b>}
                open={state.visibleReceiveModal}
                onCancel={() => setState(p => ({ ...p, visibleReceiveModal: false, showCamera: false, scanFilterId: null }))}
                width={isMobile ? "100%" : 1250}
                style={isMobile ? { top: 0, margin: 0, maxWidth: '100vw' } : {}}
                styles={{ body: { padding: isMobile ? '10px' : '20px', height: isMobile ? 'calc(100vh - 110px)' : 'auto', overflowY: 'auto' } }}
                footer={null}
                centered={!isMobile}
            >
                <div style={{ position: isMobile ? 'sticky' : 'relative', top: isMobile ? '-10px' : 0, zIndex: 100, background: '#fff', paddingBottom: '10px', marginBottom: '15px' }}>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                            <div style={{ background: '#2ecc71', padding: '10px', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center' }}><MdQrCodeScanner size={20} /></div>
                            <Input placeholder="Scan Barcode..." autoFocus value={state.txt_barcode} style={{ height: '45px', borderRadius: '8px', border: '2px solid #2ecc71', fontSize: '16px' }} onChange={(e) => setState(p => ({ ...p, txt_barcode: e.target.value }))} onPressEnter={(e) => onScanBarcodeReceive(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button icon={<MdOutlineCameraAlt size={22} />} style={{ height: '45px', flex: 1, background: state.showCamera ? '#ff4d4f' : '#3498db', color: '#fff', borderRadius: '8px' }} onClick={() => setState(p => ({ ...p, showCamera: !p.showCamera }))}>{state.showCamera ? "Close" : "Camera"}</Button>
                            {state.scanFilterId && <Button danger onClick={() => setState(p => ({ ...p, scanFilterId: null }))} style={{ height: '45px' }}>ALL</Button>}
                        </div>
                    </div>
                </div>

                {state.showCamera && <div style={{ marginBottom: '15px', background: '#000', borderRadius: '12px', overflow: 'hidden' }}><div id="reader" style={{ width: '100%' }}></div></div>}

                {isMobile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '80px' }}>
                        {(state.scanFilterId ? state.purchaseDetails.filter(d => d.id === state.scanFilterId) : state.purchaseDetails).map((item, index) => {
                            const isOver = item.receive_now > (Number(item.qty) - Number(item.received_qty));
                            return (
                                <div key={item.id} style={{ background: '#fff', borderRadius: '12px', padding: '12px', border: isOver ? '2px solid #ff4d4f' : '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><b style={{ fontSize: '15px' }}>{item.name}</b><Tag color="cyan">{item.unit}</Tag></div>
                                    <div style={{ display: 'flex', gap: '15px', marginBottom: '12px', fontSize: '12px', color: '#64748b' }}><span>Order: <b>{item.qty}</b></span><span>Rec: <b>{item.received_qty}</b></span></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <Input size="small" placeholder="Batch" value={item.batch_no} onChange={(e) => { const details = [...state.purchaseDetails]; details[index].batch_no = e.target.value; setState(p => ({ ...p, purchaseDetails: details })); }} />
                                        <DatePicker size="small" placeholder="Expiry" style={{ width: '100%' }} value={item.expiry_date} onChange={(date) => { const details = [...state.purchaseDetails]; details[index].expiry_date = date; setState(p => ({ ...p, purchaseDetails: details })); }} />
                                    </div>
                                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px', borderRadius: '8px' }}>
                                        <span style={{ fontWeight: 600 }}>RECEIVE:</span>
                                        <InputNumber style={{ width: '100px' }} status={isOver ? 'error' : ''} value={item.receive_now} onChange={(val) => { const details = [...state.purchaseDetails]; details[index].receive_now = val; setState(p => ({ ...p, purchaseDetails: details })); }} />
                                    </div>
                                </div>
                            )
                        })}
                        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '15px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', zIndex: 1000 }}>
                            <Button onClick={() => setState(p => ({ ...p, visibleReceiveModal: false }))} style={{ flex: 1, height: '45px' }}>Cancel</Button>
                            <Button type="primary" onClick={onFinishReceive} loading={state.isSavingReceive} style={{ flex: 2, height: '45px', fontWeight: 'bold' }}>SAVE</Button>
                        </div>
                    </div>
                ) : (
                    <Table
                        dataSource={state.scanFilterId ? state.purchaseDetails.filter(d => d.id === state.scanFilterId) : state.purchaseDetails}
                        rowKey="id" pagination={false} size="small"
                        columns={[
                            { title: "Product", dataIndex: "name" },
                            { title: "Order", dataIndex: "qty", width: 80 },
                            { title: "Rec", dataIndex: "received_qty", width: 80 },
                            { title: "Batch", dataIndex: "batch_no", width: 120, render: (_, record, index) => <Input size="small" value={record.batch_no} onChange={(e) => { const d = [...state.purchaseDetails]; d[index].batch_no = e.target.value; setState(p => ({ ...p, purchaseDetails: d })); }} /> },
                            { title: "Expiry", dataIndex: "expiry_date", width: 140, render: (_, record, index) => <DatePicker size="small" value={record.expiry_date} onChange={(date) => { const d = [...state.purchaseDetails]; d[index].expiry_date = date; setState(p => ({ ...p, purchaseDetails: d })); }} /> },
                            { title: "Receive Now", width: 120, render: (_, record, index) => <InputNumber size="small" value={record.receive_now} onChange={(val) => { const d = [...state.purchaseDetails]; d[index].receive_now = val; setState(p => ({ ...p, purchaseDetails: d })); }} /> },
                            { title: "Total", render: (_, record) => <b>${(Number(record.receive_now || 0) * Number(record.cost || 0)).toFixed(2)}</b> }
                        ]}
                    />
                )}
            </Modal>
        </MainPage>
    );
}

export default PurchasePage;
