import React, { useEffect, useState } from "react";
import { 
    Table, 
    Card, 
    Row, 
    Col, 
    Input, 
    Button, 
    Typography, 
    Space, 
    Modal, 
    Form, 
    InputNumber, 
    Select, 
    message,
    Empty,
    Divider,
    Tag,
    Popconfirm
} from "antd";
import { 
    PlusOutlined, 
    DeleteOutlined, 
    SaveOutlined, 
    SearchOutlined,
    EditOutlined,
    SolutionOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { useLanguage, translations } from "../../store/language.store";
import { Config } from "../../util/config";

const { Title, Text } = Typography;

const RecipePage = () => {
    const { lang } = useLanguage();
    const t = translations[lang];

    const [state, setState] = useState({
        products: [],
        filteredProducts: [],
        rawMaterials: [],
        selectedProduct: null,
        ingredients: [], // current recipe ingredients
        loading: false,
        saving: false,
        searchText: "",
        isAddModalVisible: false
    });

    const [form] = Form.useForm();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setState(p => ({ ...p, loading: true }));
        try {
            // Get products
            const pRes = await request("product", "get");
            // Get raw materials for selection
            const rmRes = await request("raw_material", "get");
            
            setState(p => ({ 
                ...p, 
                products: pRes.list || [], 
                filteredProducts: pRes.list || [],
                rawMaterials: rmRes.list || [],
                loading: false 
            }));
        } catch (error) {
            message.error("Failed to fetch data");
            setState(p => ({ ...p, loading: false }));
        }
    };

    const fetchRecipe = async (product) => {
        if (!product) return;
        setState(p => ({ ...p, loading: true, selectedProduct: product }));
        try {
            const res = await request(`recipe?product_id=${product.id}`, "get");
            setState(p => ({ 
                ...p, 
                ingredients: res.list || [], 
                loading: false 
            }));
        } catch (error) {
            message.error("Failed to fetch recipe");
            setState(p => ({ ...p, loading: false }));
        }
    };

    const handleSearch = (e) => {
        const value = e.target.value.toLowerCase();
        const filtered = state.products.filter(p => 
            p.name.toLowerCase().includes(value) || 
            (p.barcode && p.barcode.toLowerCase().includes(value))
        );
        setState(p => ({ ...p, searchText: value, filteredProducts: filtered }));
    };

    const handleAddIngredient = (values) => {
        const rm = state.rawMaterials.find(m => m.id === values.raw_material_id);
        const newIngredient = {
            raw_material_id: rm.id,
            name: rm.name,
            code: rm.code,
            base_unit: rm.unit,
            qty: values.qty,
            unit: values.unit || rm.unit,
            cost_price: rm.price
        };

        // Check if exists
        const exists = state.ingredients.find(i => i.raw_material_id === rm.id);
        if (exists) {
            const updated = state.ingredients.map(i => 
                i.raw_material_id === rm.id ? { ...i, qty: i.qty + values.qty } : i
            );
            setState(p => ({ ...p, ingredients: updated, isAddModalVisible: false }));
        } else {
            setState(p => ({ ...p, ingredients: [...p.ingredients, newIngredient], isAddModalVisible: false }));
        }
        form.resetFields();
    };

    const removeIngredient = (id) => {
        const updated = state.ingredients.filter(i => i.raw_material_id !== id);
        setState(p => ({ ...p, ingredients: updated }));
    };

    const saveRecipe = async () => {
        if (!state.selectedProduct) return;
        setState(p => ({ ...p, saving: true }));
        try {
            await request("recipe", "post", {
                product_id: state.selectedProduct.id,
                ingredients: state.ingredients.map(i => ({
                    raw_material_id: i.raw_material_id,
                    qty: i.qty,
                    unit: i.unit
                }))
            });
            message.success(t.recipe + " " + t.save_success || "Recipe saved successfully!");
            setState(p => ({ ...p, saving: false }));
        } catch (error) {
            message.error("Failed to save recipe");
            setState(p => ({ ...p, saving: false }));
        }
    };

    const productColumns = [
        {
            title: t.product,
            key: "product",
            render: (_, record) => (
                <Space>
                    <img 
                        src={record.image ? Config.getFullImagePath(record.image) : "https://via.placeholder.com/40"} 
                        style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }}
                        alt={record.name}
                    />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{record.name}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{record.barcode}</div>
                    </div>
                </Space>
            )
        }
    ];

    const ingredientColumns = [
        {
            title: t.name,
            dataIndex: "name",
            key: "name",
        },
        {
            title: t.quantity,
            dataIndex: "qty",
            key: "qty",
            render: (qty, record) => (
                <InputNumber 
                    min={0.001} 
                    value={qty} 
                    onChange={(val) => {
                        const updated = state.ingredients.map(i => 
                            i.raw_material_id === record.raw_material_id ? { ...i, qty: val } : i
                        );
                        setState(p => ({ ...p, ingredients: updated }));
                    }}
                />
            )
        },
        {
            title: t.unit,
            dataIndex: "base_unit",
            key: "unit",
            render: (unit) => <Tag color="blue">{unit}</Tag>
        },
        {
            title: t.action,
            key: "action",
            render: (_, record) => (
                <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => removeIngredient(record.raw_material_id)}
                />
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Row gutter={24}>
                {/* Left Side: Product List */}
                <Col span={8}>
                    <Card 
                        title={<Space><SolutionOutlined /> {t.product}</Space>}
                        bodyStyle={{ padding: '12px' }}
                    >
                        <Input 
                            placeholder={t.search + "..."} 
                            prefix={<SearchOutlined />} 
                            value={state.searchText}
                            onChange={handleSearch}
                            style={{ marginBottom: '16px' }}
                        />
                        <Table 
                            size="small"
                            columns={productColumns}
                            dataSource={state.filteredProducts}
                            rowKey="id"
                            loading={state.loading && state.products.length === 0}
                            pagination={{ pageSize: 10 }}
                            onRow={(record) => ({
                                onClick: () => fetchRecipe(record),
                                style: { 
                                    cursor: 'pointer',
                                    backgroundColor: state.selectedProduct?.id === record.id ? '#e6f7ff' : 'inherit'
                                }
                            })}
                        />
                    </Card>
                </Col>

                {/* Right Side: Recipe Editor */}
                <Col span={16}>
                    <Card 
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Space>
                                    <SolutionOutlined /> 
                                    {t.ingredients} 
                                    {state.selectedProduct && (
                                        <Tag color="green" style={{ marginLeft: '8px' }}>
                                            {state.selectedProduct.name}
                                        </Tag>
                                    )}
                                </Space>
                                <Space>
                                    <Button 
                                        type="primary" 
                                        icon={<PlusOutlined />} 
                                        disabled={!state.selectedProduct}
                                        onClick={() => setState(p => ({ ...p, isAddModalVisible: true }))}
                                    >
                                        {t.add_ingredient}
                                    </Button>
                                    <Button 
                                        type="primary" 
                                        icon={<SaveOutlined />} 
                                        loading={state.saving}
                                        disabled={!state.selectedProduct}
                                        onClick={saveRecipe}
                                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                    >
                                        {t.save}
                                    </Button>
                                </Space>
                            </div>
                        }
                    />
                    
                    <div style={{ marginTop: '16px' }}>
                        {state.selectedProduct ? (
                            <Table 
                                columns={ingredientColumns}
                                dataSource={state.ingredients}
                                rowKey="raw_material_id"
                                loading={state.loading}
                                pagination={false}
                                locale={{ emptyText: <Empty description="No ingredients defined yet" icon={<SolutionOutlined style={{ fontSize: 48 }} />} /> }}
                            />
                        ) : (
                            <Card bordered={false} style={{ textAlign: 'center', padding: '100px 0' }}>
                                <Empty description="Select a product to view or manage its recipe" />
                            </Card>
                        )}
                    </div>
                </Col>
            </Row>

            {/* Modal to Add Ingredient */}
            <Modal
                title={t.add_ingredient}
                open={state.isAddModalVisible}
                onCancel={() => setState(p => ({ ...p, isAddModalVisible: false }))}
                onOk={() => form.submit()}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleAddIngredient}>
                    <Form.Item 
                        name="raw_material_id" 
                        label={t.raw_material} 
                        rules={[{ required: true, message: 'Please select an ingredient' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Search ingredients..."
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={state.rawMaterials.map(rm => ({
                                value: rm.id,
                                label: `${rm.name} (${rm.unit})`
                            }))}
                        />
                    </Form.Item>
                    <Form.Item 
                        name="qty" 
                        label={t.quantity} 
                        initialValue={1}
                        rules={[{ required: true, message: 'Please enter quantity' }]}
                    >
                        <InputNumber min={0.001} style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default RecipePage;
