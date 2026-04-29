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
import { MdAdd, MdDelete, MdEdit, MdInventory, MdOutlineCameraAlt, MdQrCodeScanner, MdRemoveRedEye, MdSearch } from "react-icons/md";
import { Html5Qrcode } from "html5-qrcode";
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
        getList();
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

    const onClickEdit = async (item) => {
        setState(p => ({ ...p, loading: true }));
        try {
            const res = await request("purchase-details", "get", { id: item.id });
            if (res && !res.error) {
                const items = res.list.map(i => ({
                    ...i,
                    item_composite_id: i.item_type === 'raw_material' ? `rm-${i.item_id}` : `pd-${i.item_id}`,
                    qty: Number(i.qty),
                    cost: Number(i.cost)
                }));

                form.setFieldsValue({
                    ...item,
                    purchase_date: dayjs(item.purchase_date),
                    items: items
                });

                setState(p => ({
                    ...p,
                    visibleModal: true,
                    isEdit: true,
                    loading: false,
                    selectedPurchase: item
                }));
                fetchSuppliers();
                fetchAllPurchaseItems();
            } else {
                message.error("Failed to fetch details");
                setState(p => ({ ...p, loading: false }));
            }
        } catch (error) {
            console.error(error);
            setState(p => ({ ...p, loading: false }));
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


    useEffect(() => {
        let html5QrCode;
        const startScanner = async () => {
            try {
                html5QrCode = new Html5Qrcode("reader");
                const config = { fps: 10, qrbox: { width: 250, height: 250 } };
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        onScanBarcodeReceive(decodedText);
                    },
                    (errorMessage) => {
                        // ignore errors
                    }
                );
            } catch (err) {
                console.error("Camera Error:", err);
            }
        };

        if (state.showCamera && state.visibleReceiveModal) {
            // Delay slightly to ensure "reader" div is in DOM
            const timer = setTimeout(startScanner, 500);
            return () => {
                clearTimeout(timer);
                if (html5QrCode && html5QrCode.isScanning) {
                    html5QrCode.stop().catch(err => console.error("Stop Error:", err));
                }
            };
        }
    }, [state.showCamera, state.visibleReceiveModal]);

    const onScanBarcodeReceive = (barcode) => {
        if (!barcode) return;
        
        // 🚀 Prevent double scanning within 1.5 seconds
        const now = Date.now();
        if (state.lastScannedBarcode === barcode && (now - (state.lastScanTime || 0) < 1500)) {
            return;
        }

        const clean = (s) => String(s || "").replace(/\D/g, "");
        const scanned = clean(barcode);
        const details = [...state.purchaseDetails];

        // 🚀 Search for the item
        let finalIndex = details.findIndex(d => {
            const itemBarcode = clean(d.barcode);
            return itemBarcode && (itemBarcode === scanned);
        });

        if (finalIndex === -1) {
            // Partial match fallback
            finalIndex = details.findIndex(d => {
                const itemBarcode = clean(d.barcode);
                return itemBarcode && (itemBarcode.includes(scanned) || scanned.includes(itemBarcode));
            });
        }

        if (finalIndex > -1) {
            const item = details[finalIndex];
            const remaining = Number(item.qty) - Number(item.received_qty);

            // 🚀 Auto-fill remaining balance
            if (remaining > 0) {
                details[finalIndex].receive_now = remaining;
            }

            // Apply global batch/expiry
            if (state.batch_receive) details[finalIndex].batch_no = state.batch_receive;
            if (state.expiry_receive) details[finalIndex].expiry_date = state.expiry_receive;

            setState(p => ({ 
                ...p, 
                purchaseDetails: details, 
                txt_barcode: "",
                scanFilterId: item.id, // 🚀 Filter by Item ID
                showCamera: true, // 🚀 Keep camera OPEN for continuous scanning
                lastScanTime: now,
                lastScannedBarcode: barcode
            }));
            if (navigator.vibrate) navigator.vibrate(100);
            message.success(`Found: ${item.name}`);
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
                                <Button icon={<MdRemoveRedEye />} style={{ flex: 1, height: '42px', borderRadius: '10px' }} onClick={() => onClickEdit(item)} />
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

            {/* 🚀 CREATE PURCHASE MODAL (MOBILE-OPTIMIZED) */}
            <Modal
                title={<div style={{ fontSize: isMobile ? '16px' : '20px' }}><b>➕ {t.new_purchase}</b></div>}
                open={state.visibleModal}
                onCancel={onCloseModal}
                width={isMobile ? "100%" : 1400}
                style={isMobile ? { top: 0, margin: 0, maxWidth: '100vw', paddingBottom: 0 } : { top: 20 }}
                styles={{ 
                    body: { 
                        padding: isMobile ? '16px' : '20px', 
                        height: isMobile ? 'calc(100vh - 110px)' : 'auto', 
                        overflowY: 'auto',
                        background: isMobile ? '#f8fafc' : '#fff'
                    }
                }}
                footer={null}
                centered={!isMobile}
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={onFinish}>
                    <div style={{ 
                        background: isMobile ? '#fff' : '#f8fafc', 
                        padding: isMobile ? '20px' : '24px', 
                        borderRadius: '16px', 
                        marginBottom: '24px', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}>
                        <Row gutter={[20, 20]}>
                            <Col xs={24} sm={12} md={5}>
                                <Form.Item name="supplier_id" label={<b style={{ color: '#64748b' }}>{t.supplier}</b>} rules={[{ required: true }]}>
                                    <Select size="large" options={state.suppliers} placeholder={t.supplier} showSearch style={{ borderRadius: '10px' }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={5}>
                                <Form.Item name="ref" label={<b style={{ color: '#64748b' }}>{t.ref_no}</b>}>
                                    <Input size="large" placeholder={t.invoice_placeholder} style={{ borderRadius: '10px' }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={5}>
                                <Form.Item name="purchase_date" label={<b style={{ color: '#64748b' }}>{t.receive_date}</b>} rules={[{ required: true }]}>
                                    <DatePicker size="large" showTime style={{ width: '100%', borderRadius: '10px' }} />
                                </Form.Item>
                            </Col>
                            {!isMobile && (
                                <>
                                    <Col span={3}><Form.Item name="status" label={<b style={{ color: '#64748b' }}>{t.status}</b>} rules={[{ required: true }]} initialValue="Pending"><Select size="large" options={[{ label: `📥 ${t.request_status}`, value: "Request" }, { label: `⌛ ${t.pending_status_simple}`, value: "Pending" }, { label: `✅ ${t.received_status}`, value: "Received" }]} style={{ borderRadius: '10px' }} /></Form.Item></Col>
                                    <Col span={3}><Form.Item name="payment_method" label={<b style={{ color: '#64748b' }}>{t.payment_method}</b>} initialValue="Cash"><Select size="large" options={[{ label: `💵 ${t.cash_method}`, value: "Cash" }, { label: `💳 ${t.bank_method}`, value: "Bank" }]} style={{ borderRadius: '10px' }} /></Form.Item></Col>
                                    <Col span={3}><Form.Item name="note" label={<b style={{ color: '#64748b' }}>{t.note}</b>}><Input size="large" placeholder={t.note} style={{ borderRadius: '10px' }} /></Form.Item></Col>
                                </>
                            )}
                        </Row>
                        {isMobile && (
                             <Row gutter={[12, 12]}>
                                <Col span={12}><Form.Item name="status" label={<b style={{ color: '#64748b' }}>{t.status}</b>} initialValue="Pending"><Select size="large" options={[{ label: t.request_status, value: "Request" }, { label: t.pending_status_simple, value: "Pending" }, { label: t.received_status, value: "Received" }]} style={{ borderRadius: '10px' }} /></Form.Item></Col>
                                <Col span={12}><Form.Item name="payment_method" label={<b style={{ color: '#64748b' }}>{t.payment_method}</b>} initialValue="Cash"><Select size="large" options={[{ label: t.cash_method, value: "Cash" }, { label: t.bank_method, value: "Bank" }]} style={{ borderRadius: '10px' }} /></Form.Item></Col>
                             </Row>
                        )}
                    </div>

                    <Divider orientation="left" style={{ margin: '10px 0 20px 0' }}><span style={{ color: '#64748b', fontSize: '14px' }}>{t.product_list_header}</span></Divider>

                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: isMobile ? '120px' : '40px' }}>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{ 
                                        background: '#fff', 
                                        borderRadius: '20px', 
                                        padding: isMobile ? '20px' : '24px', 
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                        position: 'relative',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        <Button 
                                            danger 
                                            type="text" 
                                            icon={<MdDelete size={22} />} 
                                            style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1, background: '#fee2e2', borderRadius: '10px' }}
                                            onClick={() => { remove(name); setState(p => ({ ...p })); }}
                                        />

                                        <Row gutter={[24, 16]}>
                                            <Col xs={24} md={10}>
                                                <Form.Item {...restField} name={[name, 'item_composite_id']} label={<b style={{ fontSize: '14px' }}>{t.product_label}</b>} rules={[{ required: true }]}>
                                                    <Select 
                                                        size="large" 
                                                        placeholder="Select Product" 
                                                        options={state.allItems} 
                                                        showSearch 
                                                        style={{ borderRadius: '12px' }}
                                                        onChange={(val) => {
                                                            const item = state.allItems.find(i => i.value === val);
                                                            if (item) {
                                                                const items = [...form.getFieldValue('items')];
                                                                items[name].cost = item.price;
                                                                items[name].qty = items[name].qty || 1;
                                                                items[name].item_type = item.item_type;
                                                                items[name].real_id = item.item_id;
                                                                items[name].unit = items[name].unit || "Pcs";
                                                                form.setFieldsValue({ items });
                                                                setState(p => ({ ...p }));
                                                            }
                                                        }} 
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} md={14}>
                                                <Row gutter={16}>
                                                    <Col span={8}>
                                                        <Form.Item {...restField} name={[name, 'qty']} label={<b style={{ fontSize: '14px' }}>{t.quantity_label}</b>} rules={[{ required: true }]}>
                                                            <InputNumber 
                                                                size="large" 
                                                                placeholder="0" 
                                                                style={{ width: '100%', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold' }} 
                                                                onChange={() => setState({ ...state })} 
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={16}>
                                                        <Form.Item {...restField} name={[name, 'unit']} label={<b style={{ fontSize: '14px' }}>{t.unit_label}</b>} initialValue="Pcs">
                                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                                {["Pcs", "Box", "Case"].map(u => {
                                                                    const currentUnit = form.getFieldValue(['items', name, 'unit']);
                                                                    const isActive = currentUnit === u;
                                                                    return (
                                                                        <div 
                                                                            key={u}
                                                                            onClick={() => {
                                                                                const items = [...form.getFieldValue('items')];
                                                                                items[name].unit = u;
                                                                                form.setFieldsValue({ items });
                                                                                setState(p => ({ ...p }));
                                                                            }}
                                                                            style={{
                                                                                flex: 1,
                                                                                padding: '10px',
                                                                                textAlign: 'center',
                                                                                borderRadius: '10px',
                                                                                cursor: 'pointer',
                                                                                background: isActive ? '#3b82f6' : '#f1f5f9',
                                                                                color: isActive ? '#fff' : '#64748b',
                                                                                fontWeight: 600,
                                                                                border: isActive ? '2px solid #2563eb' : '2px solid transparent',
                                                                                transition: 'all 0.2s ease'
                                                                            }}
                                                                        >
                                                                            {t[`unit_${u.toLowerCase()}`] || u}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                                
                                                <Row gutter={16} align="middle">
                                                    <Col span={12}>
                                                        <Form.Item {...restField} name={[name, 'cost']} label={<b style={{ fontSize: '14px' }}>{t.cost_price_label}</b>} rules={[{ required: true }]}>
                                                            <InputNumber 
                                                                size="large" 
                                                                prefix={<span style={{ color: '#10b981' }}>$</span>} 
                                                                style={{ width: '100%', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold' }} 
                                                                onChange={() => setState({ ...state })} 
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={12}>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subtotal</div>
                                                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>
                                                                ${((form.getFieldValue(['items', name, 'qty']) || 0) * (form.getFieldValue(['items', name, 'cost']) || 0)).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                                <Button 
                                    type="dashed" 
                                    onClick={() => add()} 
                                    block 
                                    icon={<MdAdd size={20} />} 
                                    size="large"
                                    style={{ 
                                        height: '60px', 
                                        borderRadius: '16px', 
                                        background: '#f8fafc', 
                                        border: '2px dashed #cbd5e1',
                                        color: '#64748b',
                                        fontSize: '16px',
                                        fontWeight: 600
                                    }}
                                >
                                    {t.add_new}
                                </Button>
                            </div>
                        )}
                    </Form.List>

                    {/* 💾 STICKY BOTTOM SUMMARY BAR */}
                    <div style={{ 
                        position: isMobile ? 'fixed' : 'sticky', 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        padding: isMobile ? '20px 24px 32px 24px' : '24px', 
                        background: '#ffffff', 
                        borderTop: '1px solid #e2e8f0', 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'stretch' : 'center',
                        gap: '24px', 
                        zIndex: 1000,
                        boxShadow: '0 -10px 20px rgba(0,0,0,0.04)',
                        margin: isMobile ? 0 : '0 -24px -24px -24px',
                        borderRadius: isMobile ? 0 : '0 0 20px 20px'
                    }}>
                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{t.grand_total}</div>
                                <div style={{ fontSize: '32px', fontWeight: 900, color: "#10b981", lineHeight: 1 }}>
                                    ${(form.getFieldValue("items") || []).reduce((sum, item) => sum + ((Number(item?.qty) || 0) * (Number(item?.cost) || 0)), 0).toFixed(2)}
                                </div>
                            </div>
                            
                            <Form.Item name="paid_amount" label={<b style={{ color: '#64748b' }}>Paid Amount</b>} style={{ marginBottom: 0 }}>
                                <InputNumber 
                                    prefix={<span style={{ color: '#3b82f6' }}>$</span>} 
                                    size="large" 
                                    style={{ width: 160, borderRadius: '12px', fontSize: '20px', fontWeight: 800 }} 
                                />
                            </Form.Item>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button 
                                size="large" 
                                onClick={onCloseModal} 
                                style={{ 
                                    minWidth: '120px', 
                                    height: '56px', 
                                    borderRadius: '16px', 
                                    fontWeight: 600,
                                    border: 'none',
                                    background: '#f1f5f9',
                                    color: '#64748b'
                                }}
                            >
                                {t.cancel}
                            </Button>
                            <Button 
                                type="primary" 
                                size="large" 
                                htmlType="submit" 
                                style={{ 
                                    minWidth: '200px', 
                                    height: '56px', 
                                    borderRadius: '16px', 
                                    fontWeight: 700, 
                                    background: '#3b82f6',
                                    fontSize: '18px',
                                    boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
                                }}
                            >
                                {t.save}
                            </Button>
                        </div>
                    </div>
                </Form>
            </Modal>

            {/* 🚀 RECEIVE GOODS MODAL (POLISHED MOBILE-FIRST) */}
            <Modal
                title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: isMobile ? '16px' : '18px' }}>
                    <span style={{ fontSize: '20px' }}>📥</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <b>{t.receiving_now || "Receive Goods"}</b>
                        <span style={{ fontSize: '12px', fontWeight: 400, color: '#64748b' }}>Order: {state.selectedPurchase?.ref}</span>
                    </div>
                </div>}
                open={state.visibleReceiveModal}
                onCancel={() => setState(p => ({ ...p, visibleReceiveModal: false, showCamera: false, scanFilterId: null }))}
                width={isMobile ? "100%" : 1250}
                style={isMobile ? { top: 0, margin: 0, maxWidth: '100vw', paddingBottom: 0 } : {}}
                styles={{ 
                    body: { 
                        padding: isMobile ? '0' : '20px', 
                        height: isMobile ? 'calc(100vh - 110px)' : 'auto', 
                        overflowY: 'auto',
                        background: isMobile ? '#f8fafc' : '#fff'
                    },
                    header: {
                        padding: isMobile ? '12px 16px' : '16px 24px',
                        borderBottom: '1px solid #e2e8f0'
                    }
                }}
                footer={null}
                centered={!isMobile}
                closeIcon={<div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '50%', display: 'flex' }}><MdAdd style={{ transform: 'rotate(45deg)' }} /></div>}
            >
                {/* 🛰️ STICKY SCANNER SECTION */}
                <div style={{ 
                    position: isMobile ? 'sticky' : 'relative', 
                    top: 0, 
                    zIndex: 100, 
                    background: '#fff', 
                    padding: isMobile ? '12px 16px' : '0 0 20px 0',
                    borderBottom: isMobile ? '1px solid #e2e8f0' : 'none',
                    boxShadow: isMobile ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
                }}>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <div style={{ 
                                position: 'absolute', 
                                left: '12px', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                zIndex: 1,
                                color: '#2ecc71'
                            }}>
                                <MdQrCodeScanner size={22} />
                            </div>
                            <Input 
                                placeholder={t.scan_barcode_placeholder} 
                                autoFocus 
                                value={state.txt_barcode} 
                                style={{ 
                                    height: '48px', 
                                    borderRadius: '12px', 
                                    paddingLeft: '45px',
                                    border: '2px solid #e2e8f0',
                                    fontSize: '16px',
                                    boxShadow: 'none'
                                }} 
                                onChange={(e) => setState(p => ({ ...p, txt_barcode: e.target.value }))} 
                                onPressEnter={(e) => onScanBarcodeReceive(e.target.value)} 
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button 
                                icon={<MdOutlineCameraAlt size={20} />} 
                                style={{ 
                                    height: '48px', 
                                    flex: 1, 
                                    background: state.showCamera ? '#ef4444' : '#3b82f6', 
                                    color: '#fff', 
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }} 
                                onClick={() => setState(p => ({ ...p, showCamera: !p.showCamera }))}
                            >
                                {state.showCamera ? t.close_camera_btn : t.camera_btn}
                            </Button>
                            {state.scanFilterId && (
                                <Button 
                                    danger 
                                    style={{ height: '48px', borderRadius: '12px', fontWeight: 600 }}
                                    onClick={() => setState(p => ({ ...p, scanFilterId: null }))}
                                >
                                    {t.show_all_btn}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* 📷 CAMERA VIEWPORT */}
                    {state.showCamera && (
                        <div style={{ 
                            marginTop: '12px', 
                            background: '#000', 
                            borderRadius: '16px', 
                            overflow: 'hidden', 
                            border: '3px solid #3b82f6',
                            position: 'relative',
                            aspectRatio: '4/3'
                        }}>
                            <div id="reader" style={{ width: '100%' }}></div>
                            <div style={{ 
                                position: 'absolute', 
                                top: '50%', 
                                left: '50%', 
                                transform: 'translateY(-50%) translateX(-50%)',
                                width: '70%',
                                height: '50%',
                                border: '2px dashed rgba(255,255,255,0.5)',
                                borderRadius: '12px',
                                pointerEvents: 'none'
                            }}></div>
                        </div>
                    )}
                </div>

                {/* 📦 ITEMS LIST */}
                <div style={{ padding: isMobile ? '16px' : '0' }}>
                    {isMobile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' }}>
                            {(state.scanFilterId ? state.purchaseDetails.filter(d => d.id === state.scanFilterId) : state.purchaseDetails).map((item, index) => {
                                const remaining = Number(item.qty) - Number(item.received_qty);
                                const isOver = item.receive_now > remaining;
                                return (
                                    <div key={item.id} style={{ 
                                        background: '#fff', 
                                        borderRadius: '16px', 
                                        padding: '16px', 
                                        border: isOver ? '2px solid #ef4444' : '1px solid #e2e8f0',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        {isOver && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#ef4444' }}></div>}
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{item.category_name}</div>
                                                <b style={{ fontSize: '16px', color: '#1e293b', display: 'block', marginTop: '2px' }}>{item.name}</b>
                                            </div>
                                            <Tag color="blue" style={{ borderRadius: '6px', margin: 0, padding: '2px 8px' }}>{item.unit}</Tag>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', background: '#f1f5f9', padding: '10px', borderRadius: '12px' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '10px', color: '#64748b' }}>{t.order_qty_label?.toUpperCase()}</div>
                                                <div style={{ fontSize: '14px', fontWeight: 700 }}>{item.qty}</div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '10px', color: '#64748b' }}>{t.rec_qty_label?.toUpperCase()}</div>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>{item.received_qty}</div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '10px', color: '#64748b' }}>{t.outstanding?.toUpperCase() || 'REMAINING'}</div>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>{remaining}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{t.batch_label?.toUpperCase()} #</div>
                                                <Input size="large" placeholder="Lot Num" style={{ borderRadius: '10px' }} value={item.batch_no} onChange={(e) => { const d = [...state.purchaseDetails]; d[index].batch_no = e.target.value; setState(p => ({ ...p, purchaseDetails: d })); }} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{t.expiry_label?.toUpperCase()}</div>
                                                <DatePicker size="large" placeholder={t.expiry_label} style={{ width: '100%', borderRadius: '10px' }} value={item.expiry_date} onChange={(date) => { const d = [...state.purchaseDetails]; d[index].expiry_date = date; setState(p => ({ ...p, purchaseDetails: d })); }} />
                                            </div>
                                        </div>

                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between', 
                                            background: isOver ? '#fee2e2' : '#ecfdf5', 
                                            padding: '12px', 
                                            borderRadius: '12px',
                                            border: isOver ? '1px solid #fecaca' : '1px solid #d1fae5'
                                        }}>
                                            <span style={{ fontWeight: 700, color: isOver ? '#991b1b' : '#065f46', fontSize: '14px' }}>{t.receive_now_label?.toUpperCase()}:</span>
                                            <InputNumber 
                                                style={{ width: '120px', fontWeight: 'bold' }} 
                                                size="large"
                                                status={isOver ? 'error' : ''} 
                                                value={item.receive_now} 
                                                onChange={(val) => { const d = [...state.purchaseDetails]; d[index].receive_now = val; setState(p => ({ ...p, purchaseDetails: d })); }} 
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <Table
                            dataSource={state.scanFilterId ? state.purchaseDetails.filter(d => d.id === state.scanFilterId) : state.purchaseDetails}
                            rowKey="id" pagination={false} size="small"
                            columns={[
                                { title: t.product_label, dataIndex: "name", render: (t, r) => <div><b>{t}</b><br/><small>{r.category_name}</small></div> },
                                { title: t.unit_label, dataIndex: "unit", render: v => <Tag>{v}</Tag> },
                                { title: t.order_qty_label, dataIndex: "qty", width: 80, align: 'center' },
                                { title: t.rec_qty_label, dataIndex: "received_qty", width: 80, align: 'center' },
                                { title: t.batch_label, dataIndex: "batch_no", width: 140, render: (_, r, index) => <Input value={r.batch_no} onChange={(e) => { const d = [...state.purchaseDetails]; d[index].batch_no = e.target.value; setState(p => ({ ...p, purchaseDetails: d })); }} /> },
                                { title: t.expiry_label, dataIndex: "expiry_date", width: 160, render: (_, r, index) => <DatePicker placeholder={t.select_date_placeholder} style={{ width: '100%' }} value={r.expiry_date} onChange={(date) => { const d = [...state.purchaseDetails]; d[index].expiry_date = date; setState(p => ({ ...p, purchaseDetails: d })); }} /> },
                                { title: t.receive_now_label, width: 130, render: (_, r, index) => <InputNumber min={0} value={r.receive_now} style={{ width: '100%' }} onChange={(val) => { const d = [...state.purchaseDetails]; d[index].receive_now = val; setState(p => ({ ...p, purchaseDetails: d })); }} /> },
                                { title: t.total, width: 100, align: 'right', render: (_, r) => <b>${(Number(r.receive_now || 0) * Number(r.cost || 0)).toFixed(2)}</b> }
                            ]}
                        />
                    )}
                </div>

                {/* 💾 FLOATING MOBILE FOOTER */}
                {isMobile && (
                    <div style={{ 
                        position: 'fixed', 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        padding: '16px 20px 24px 20px', 
                        background: '#fff', 
                        borderTop: '1px solid #e2e8f0', 
                        display: 'flex', 
                        gap: '12px', 
                        zIndex: 1000,
                        boxShadow: '0 -4px 10px rgba(0,0,0,0.05)'
                    }}>
                        <Button 
                            onClick={() => setState(p => ({ ...p, visibleReceiveModal: false }))} 
                            style={{ flex: 1, height: '50px', borderRadius: '14px', fontWeight: 600, fontSize: '15px' }}
                        >
                            {t.cancel}
                        </Button>
                        <Button 
                            type="primary" 
                            onClick={onFinishReceive} 
                            loading={state.isSavingReceive} 
                            style={{ 
                                flex: 2, 
                                height: '50px', 
                                borderRadius: '14px', 
                                fontWeight: 700, 
                                fontSize: '16px',
                                background: '#3b82f6',
                                boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)'
                            }}
                        >
                            {t.save_receiving_btn?.toUpperCase()}
                        </Button>
                    </div>
                )}

                {/* 💾 DESKTOP FOOTER */}
                {!isMobile && (
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <Button onClick={() => setState(p => ({ ...p, visibleReceiveModal: false }))}>{t.cancel}</Button>
                        <Button type="primary" onClick={onFinishReceive} loading={state.isSavingReceive}>{t.confirm_receiving_btn}</Button>
                    </div>
                )}
            </Modal>
        </MainPage>
    );
}

export default PurchasePage;
