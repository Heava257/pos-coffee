import React, { useEffect, useState } from "react";
import {
    Card,
    Table,
    Tag,
    Button,
    Modal,
    Form,
    Select,
    Input,
    InputNumber,
    Space,
    message,
    Typography,
    Row,
    Col,
    Divider,
    Descriptions
} from "antd";
import { 
    MdCompareArrows, 
    MdAdd, 
    MdDelete, 
    MdInventory, 
    MdCheckCircle, 
    MdCancel 
} from "react-icons/md";
import Swal from 'sweetalert2';
import { request, formatDateClient } from "@/shared/utils/helper";
import MainPage from "@/app/layouts/MainPage";
import { useLanguage, translations } from "@/app/store/language.store";

const { Title, Text } = Typography;
const { Option } = Select;

const StockTransferPage = () => {
    const { lang } = useLanguage();
    const t = translations[lang];
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visibleModal, setVisibleModal] = useState(false);
    const [visibleReceiveModal, setVisibleReceiveModal] = useState(false);
    const [branches, setBranches] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [transferDetails, setTransferDetails] = useState([]);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchInitialData();
        fetchList();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [bRes, pRes, rmRes] = await Promise.all([
                request("branch", "get"),
                request("product", "get", { is_list_all: 1 }),
                request("raw_material", "get")
            ]);

            setBranches(bRes.list || []);
            
            const products = (pRes.list || []).map(p => ({
                label: `🥤 ${p.name} [Product]`,
                value: `pd-${p.id}`,
                real_id: p.id,
                item_type: 'product',
                name: p.name
            }));
            const rms = (rmRes.list || []).map(rm => ({
                label: `📦 ${rm.name} [Ingredient]`,
                value: `rm-${rm.id}`,
                real_id: rm.id,
                item_type: 'raw_material',
                name: rm.name
            }));
            
            setAllItems([...products, ...rms]);
        } catch (error) {
            console.error("Fetch data error:", error);
        }
    };

    const fetchList = async () => {
        setLoading(true);
        try {
            const res = await request("stock-transfer", "get");
            if (res && res.list) setList(res.list);
        } catch (error) {
            message.error("Failed to fetch transfers");
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        const payload = {
            ...values,
            items: values.items.map(item => {
                const found = allItems.find(i => i.value === item.item_key);
                return {
                    id: found.real_id,
                    item_type: found.item_type,
                    qty: item.qty
                };
            })
        };

        const res = await request("stock-transfer", "post", payload);
        if (res && !res.error) {
            message.success(res.message);
            setVisibleModal(false);
            fetchList();
        } else {
            // SweetAlert2 (Swal) replacement for high-visibility premium alert
            const serverMsg = res?.message || res?.error || "Transfer failed";
            const isSameBranch = serverMsg.toLowerCase().includes("same branch");
            const finalMsg = isSameBranch ? t.cannot_transfer_same_branch : serverMsg;

            Swal.fire({
                title: t.validation_error,
                text: finalMsg,
                icon: 'error',
                confirmButtonText: t.ok_btn,
                confirmButtonColor: '#d32f2f',
                background: '#fff',
                heightAuto: false,
                customClass: {
                    popup: 'swal-premium-popup'
                }
            });
        }
    };

    const onClickReceive = async (item) => {
        setLoading(true);
        try {
            const res = await request(`stock-transfer/${item.id}`, "get");
            if (res && res.list) {
                setTransferDetails(res.list);
                setSelectedTransfer(item);
                setVisibleReceiveModal(true);
            }
        } catch (error) {
            message.error("Failed to fetch details");
        } finally {
            setLoading(false);
        }
    };

    const onConfirmReceive = async () => {
        const res = await request("stock-transfer/receive", "post", { id: selectedTransfer.id });
        if (res && !res.error) {
            message.success(res.message);
            setVisibleReceiveModal(false);
            fetchList();
        } else {
            message.error(res?.error || "Receipt failed");
        }
    };

    const onClickCancel = (item) => {
        const t = translations[lang];
        Swal.fire({
            title: t.cancelled + "?",
            text: t.cancel_transfer_confirm,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6e7881',
            confirmButtonText: t.ok_btn,
            cancelButtonText: t.cancel_btn,
            heightAuto: false,
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await request("stock-transfer/cancel", "post", { id: item.id });
                if (res && !res.error) {
                    Swal.fire({
                        title: 'Cancelled!',
                        text: 'Transfer has been cancelled.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        heightAuto: false,
                    });
                    fetchList();
                } else {
                    Swal.fire('Error', res?.error || "Cancel failed", 'error');
                }
            }
        });
    };

    const columns = [
        {
            title: t.date,
            dataIndex: "created_at",
            render: (d) => formatDateClient(d, "DD/MM HH:mm")
        },
        {
            title: t.ref_no,
            dataIndex: "ref",
            render: (v) => <Tag color="blue">{v}</Tag>
        },
        {
            title: t.from_branch,
            dataIndex: "from_branch_name",
        },
        {
            title: "",
            render: () => <MdCompareArrows size={20} style={{ color: '#aaa' }} />
        },
        {
            title: t.to_branch,
            dataIndex: "to_branch_name",
        },
        {
            title: t.items,
            dataIndex: "total_items",
            align: 'center'
        },
        {
            title: t.status,
            dataIndex: "status",
            render: (v) => {
                let color = "orange";
                if (v === 'completed') color = "green";
                if (v === 'cancelled') color = "red";
                return <Tag color={color}>{v.toUpperCase()}</Tag>
            }
        },
        {
            title: t.action,
            align: 'right',
            render: (item) => (
                <Space>
                    {item.status === 'pending' && (
                        <>
                            <Button size="small" type="primary" style={{ background: '#2ecc71' }} icon={<MdCheckCircle />} onClick={() => onClickReceive(item)}>
                                {t.receive}
                            </Button>
                            <Button size="small" danger ghost icon={<MdCancel />} onClick={() => onClickCancel(item)} />
                        </>
                    )}
                </Space>
            )
        }
    ];

    return (
        <MainPage loading={loading}>
            <Card bordered={false} style={{ borderRadius: 15, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <Space>
                        <div style={{ padding: 8, background: "#e6f4ea", borderRadius: 10 }}>
                            <MdCompareArrows size={24} style={{ color: "#2d6a42" }} />
                        </div>
                        <Title level={4} style={{ margin: 0 }}>{t.stock_to_stock_transfers}</Title>
                    </Space>
                        <Button 
                        type="primary" 
                        icon={<MdAdd />} 
                        onClick={() => {
                            form.resetFields();
                            form.setFieldsValue({ items: [null] });
                            setVisibleModal(true);
                        }}
                        style={{ background: "#2d6a42", borderColor: "#2d6a42", height: 40, borderRadius: 8 }}
                    >
                        {t.add_new}
                    </Button>
                </div>

                <Table
                    dataSource={list}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 12 }}
                />
            </Card>

            {/* Create Transfer Modal */}
            <Modal
                title={<b>📤 {t.new_transfer_req}</b>}
                open={visibleModal}
                onCancel={() => setVisibleModal(false)}
                onOk={() => form.submit()}
                width={700}
                centered
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="from_branch_id" label={t.source_branch} rules={[{ required: true }]}>
                                <Select placeholder={t.source_branch} options={branches.map(b => ({ label: b.name, value: b.id }))} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="to_branch_id" label={t.recipient_branch} rules={[{ required: true }]}>
                                <Select placeholder={t.recipient_branch} options={branches.map(b => ({ label: b.name, value: b.id }))} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="note" label={t.transfer_note}>
                        <Input.TextArea rows={2} placeholder="..." />
                    </Form.Item>

                    <Divider orientation="left">{t.items}</Divider>

                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={12} align="middle" style={{ marginBottom: 12 }}>
                                        <Col span={14}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'item_key']}
                                                rules={[{ required: true, message: 'Required' }]}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Select
                                                    placeholder={t.search_product}
                                                    options={allItems}
                                                    showSearch
                                                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'qty']}
                                                rules={[{ required: true, message: 'Qty' }]}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <InputNumber placeholder={t.quantity} style={{ width: '100%' }} min={0.01} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={2}>
                                            <Button type="text" danger icon={<MdDelete size={20} />} onClick={() => remove(name)} />
                                        </Col>
                                    </Row>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<MdAdd />}>{t.add_another_item}</Button>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>

            {/* Receive Modal */}
            <Modal
                title={<b>📥 {t.confirm_goods_receipt}</b>}
                open={visibleReceiveModal}
                onCancel={() => setVisibleReceiveModal(false)}
                footer={[
                    <Button key="back" onClick={() => setVisibleReceiveModal(false)}>{t.cancel}</Button>,
                    <Button key="submit" type="primary" style={{ background: '#2ecc71' }} onClick={onConfirmReceive}>
                        {t.accept_add_stock}
                    </Button>
                ]}
                width={600}
                centered
            >
                {selectedTransfer && (
                    <div style={{ marginBottom: 20 }}>
                        <Descriptions size="small" bordered column={1}>
                            <Descriptions.Item label={t.ref_no}>{selectedTransfer.ref}</Descriptions.Item>
                            <Descriptions.Item label={t.from_branch}>{selectedTransfer.from_branch_name}</Descriptions.Item>
                            <Descriptions.Item label={t.staff}>{selectedTransfer.staff_name}</Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
                <Table
                    dataSource={transferDetails}
                    pagination={false}
                    rowKey="id"
                    size="small"
                    columns={[
                        { title: t.product_name, dataIndex: "name" },
                        { title: t.categories, dataIndex: "item_type", render: (v) => <Tag>{v}</Tag> },
                        { title: t.quantity, dataIndex: "qty", align: 'right', render: (v) => <b>{v}</b> }
                    ]}
                />
            </Modal>
        </MainPage>
    );
};

export default StockTransferPage;
