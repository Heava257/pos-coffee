import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, InputNumber, Space, Card, Tag, Typography, Row, Col } from "antd";
import { DeleteOutlined, PlusOutlined, WarningOutlined, HistoryOutlined } from "@ant-design/icons";
import { request } from "../../util/helper";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const WastePage = () => {
    const [list, setList] = useState([]);
    const [products, setProducts] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchList();
        fetchItems();
    }, []);

    const fetchList = async () => {
        setLoading(true);
        const res = await request("waste", "get");
        if (res && res.list) setList(res.list);
        setLoading(false);
    };

    const fetchItems = async () => {
        const pRes = await request("product", "get");
        const rmRes = await request("raw_material", "get");
        if (pRes && pRes.list) setProducts(pRes.list);
        if (rmRes && rmRes.list) setRawMaterials(rmRes.list);
    };

    const onFinish = async (values) => {
        const res = await request("waste", "post", values);
        if (res && res.success) {
            setIsModalOpen(false);
            form.resetFields();
            fetchList();
        }
    };

    const columns = [
        {
            title: "Date",
            dataIndex: "created_at",
            render: (text) => dayjs(text).format("DD MMM YYYY, HH:mm"),
        },
        {
            title: "Item Name",
            render: (row) => row.product_name || row.rm_name,
        },
        {
            title: "Type",
            render: (row) => (
                <Tag color={row.product_id ? "blue" : "orange"}>
                    {row.product_id ? "Product" : "Raw Material"}
                </Tag>
            ),
        },
        {
            title: "Qty",
            dataIndex: "qty",
            render: (qty) => <Text strong type="danger">{qty}</Text>
        },
        {
            title: "Reason",
            dataIndex: "reason",
        },
        {
            title: "Staff",
            dataIndex: "staff_name",
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={16}>
                    <Title level={2}>Waste & Damage Tracking 📉</Title>
                    <Text type="secondary">Monitor and record inventory loss to protect your profit margins.</Text>
                </Col>
                <Col span={8} style={{ textAlign: "right" }}>
                    <Button 
                        type="primary" 
                        size="large" 
                        icon={<PlusOutlined />} 
                        onClick={() => setIsModalOpen(true)}
                        style={{ borderRadius: 10, background: "#1e4a2d", height: 45 }}
                    >
                        Record Waste
                    </Button>
                </Col>
            </Row>

            <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card style={{ borderRadius: 15 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <WarningOutlined style={{ fontSize: 24, color: '#e74c3c' }} />
                            <div>
                                <div style={{ fontSize: 12, color: 'gray' }}>Total Items Wasted</div>
                                <div style={{ fontSize: 20, fontWeight: 800 }}>{list.length}</div>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card style={{ borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <Table 
                    columns={columns} 
                    dataSource={list} 
                    loading={loading} 
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={<b>Record New Waste / Damage</b>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                okText="Record Now"
                okButtonProps={{ style: { background: "#1e4a2d" } }}
                centered
            >
                <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
                    <Form.Item label="Select Item Type" name="type" initialValue="product">
                        <Select onChange={() => { form.setFieldsValue({ product_id: null, raw_material_id: null }) }}>
                            <Select.Option value="product">Finished Product</Select.Option>
                            <Select.Option value="rm">Raw Material / Ingredient</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(p, c) => p.type !== c.type}>
                        {({ getFieldValue }) => (
                            getFieldValue("type") === "product" ? (
                                <Form.Item label="Product" name="product_id" rules={[{ required: true }]}>
                                    <Select showSearch optionFilterProp="children">
                                        {products.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
                                    </Select>
                                </Form.Item>
                            ) : (
                                <Form.Item label="Raw Material" name="raw_material_id" rules={[{ required: true }]}>
                                    <Select showSearch optionFilterProp="children">
                                        {rawMaterials.map(rm => <Select.Option key={rm.id} value={rm.id}>{rm.name}</Select.Option>)}
                                    </Select>
                                </Form.Item>
                            )
                        )}
                    </Form.Item>

                    <Form.Item label="Quantity" name="qty" rules={[{ required: true }]}>
                        <InputNumber style={{ width: "100%" }} min={0.1} />
                    </Form.Item>

                    <Form.Item label="Reason" name="reason" rules={[{ required: true }]}>
                        <Select placeholder="Select a reason">
                            <Select.Option value="Expired">Expired / ហួសកំណត់</Select.Option>
                            <Select.Option value="Damaged">Damaged / បែកបាក់-ខូចខាត</Select.Option>
                            <Select.Option value="Wrong Recipe">Wrong Recipe / ឆុងខុសបច្ចេកទេស</Select.Option>
                            <Select.Option value="Other">Other / ផ្សេងៗ</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default WastePage;
