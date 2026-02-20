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
import { MdAdd, MdDelete, MdRemoveRedEye } from "react-icons/md";
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
        total: 0,
    });
    const [filter, setFilter] = useState({
        page: 1,
        pageSize: 10,
    });

    useEffect(() => {
        getList();
        fetchSuppliers();
        fetchRawMaterials();
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

    const fetchRawMaterials = async () => {
        const res = await request("raw_material", "get", { status: 1 });
        if (res && !res.error) {
            setState(pre => ({
                ...pre,
                rawMaterials: res.list.map(rm => ({
                    label: `${rm.name} (${rm.unit})`,
                    value: rm.id,
                    price: rm.price,
                    unit: rm.unit
                }))
            }));
        }
    };

    const onOpenModal = () => {
        form.resetFields();
        setState(p => ({ ...p, visibleModal: true }));
    };

    const onCloseModal = () => {
        setState(p => ({ ...p, visibleModal: false }));
    };

    const onFinish = async (values) => {
        // Calculate total amount from items
        let totalAmount = 0;
        const items = values.items || [];
        items.forEach(item => {
            totalAmount += (Number(item.qty) || 0) * (Number(item.cost) || 0);
        });

        const body = {
            ...values,
            total_amount: totalAmount,
            paid_amount: values.paid_amount || 0
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
            render: (value, item, index) => (filter.page - 1) * filter.pageSize + index + 1,
        },
        {
            title: "Ref #",
            dataIndex: "ref",
        },
        {
            title: "Supplier",
            dataIndex: "supplier_name",
            render: (val) => val || "N/A"
        },
        {
            title: "Total Amount",
            dataIndex: "total_amount",
            render: (val) => `$${Number(val).toFixed(2)}`
        },
        {
            title: "Date",
            dataIndex: "created_at",
            render: (val) => dayjs(val).format("YYYY-MM-DD HH:mm")
        },
        {
            title: "Created By",
            dataIndex: "created_by"
        }
    ];

    return (
        <MainPage loading={state.loading}>
            <div className="pageHeader">
                <Space>
                    <h2>Purchase History</h2>
                </Space>
                <Button type="primary" icon={<MdAdd />} onClick={onOpenModal}>
                    New Purchase
                </Button>
            </div>

            <Table
                rowKey="id"
                dataSource={state.list}
                columns={columns}
                pagination={{
                    current: filter.page,
                    pageSize: filter.pageSize,
                    total: state.total,
                    onChange: (page, pageSize) => setFilter({ ...filter, page, pageSize })
                }}
            />

            <Modal
                title="New Purchase"
                open={state.visibleModal}
                onCancel={onCloseModal}
                width={800}
                footer={null}
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={onFinish}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="supplier_id" label="Supplier" rules={[{ required: true }]}>
                                <Select options={state.suppliers} placeholder="Select Supplier" showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="note" label="Note">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ background: "#f9f9f9", padding: 10, borderRadius: 5, marginBottom: 10 }}>
                        <h4>Items</h4>
                        <Form.List name="items">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                                            <Col span={8}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'raw_material_id']}
                                                    rules={[{ required: true, message: 'Required' }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Select
                                                        placeholder="Item"
                                                        options={state.rawMaterials}
                                                        showSearch
                                                        onChange={(val) => {
                                                            const item = state.rawMaterials.find(rm => rm.value === val);
                                                            if (item) {
                                                                const fields = form.getFieldsValue();
                                                                const items = fields.items;
                                                                items[name].cost = item.price;
                                                                form.setFieldsValue({ items });
                                                            }
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={5}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'qty']}
                                                    rules={[{ required: true, message: 'Required' }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <InputNumber placeholder="Qty" min={0} style={{ width: '100%' }} onChange={() => setState({ ...state })} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={5}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'cost']}
                                                    rules={[{ required: true, message: 'Required' }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <InputNumber placeholder="Cost" min={0} prefix="$" style={{ width: '100%' }} onChange={() => setState({ ...state })} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={4}>
                                                {/* Subtotal Display */}
                                                <div style={{ textAlign: "right", color: "#666" }}>
                                                    ${((form.getFieldValue(['items', name, 'qty']) || 0) * (form.getFieldValue(['items', name, 'cost']) || 0)).toFixed(2)}
                                                </div>
                                            </Col>
                                            <Col span={2}>
                                                <Button danger type="text" icon={<MdDelete />} onClick={() => { remove(name); setState({ ...state }); }} />
                                            </Col>
                                        </Row>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} block icon={<MdAdd />}>
                                        Add Item
                                    </Button>
                                </>
                            )}
                        </Form.List>
                    </div>

                    <Row gutter={16}>
                        <Col span={12}>
                            <div style={{ fontSize: 16, fontWeight: "bold", marginTop: 10 }}>Total: ${calculateTotal().toFixed(2)}</div>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="paid_amount" label="Paid Amount">
                                <InputNumber style={{ width: "100%" }} min={0} prefix="$" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ textAlign: "right" }}>
                        <Space>
                            <Button onClick={onCloseModal}>Cancel</Button>
                            <Button type="primary" htmlType="submit">Save Purchase</Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </MainPage>
    );
}

export default PurchasePage;
