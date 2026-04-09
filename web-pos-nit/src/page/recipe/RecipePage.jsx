import React, { useEffect, useState } from "react";
import { 
    Table, Card, Row, Col, Input, Button, Typography, Space,
    Modal, Form, InputNumber, Select, message, notification,
    Empty, Tag, Popconfirm, Tabs, Tooltip, Badge
} from "antd";
import { 
    PlusOutlined, DeleteOutlined, SaveOutlined, SearchOutlined,
    ExperimentOutlined, WarningOutlined, InfoCircleOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { useLanguage, translations } from "../../store/language.store";
import { Config } from "../../util/config";

const { Title, Text } = Typography;

const safeParse = (val) => {
    if (!val) return [];
    try { return typeof val === 'string' ? JSON.parse(val) : val; } 
    catch { return []; }
};

const RecipePage = () => {
    const { lang } = useLanguage();
    const t = translations[lang];

    const [state, setState] = useState({
        products: [],
        filteredProducts: [],
        rawMaterials: [],
        selectedProduct: null,
        ingredients: [],
        loading: false,
        saving: false,
        searchText: "",
        isAddModalVisible: false,
        selectedSize: null,        // current size tab
        recipeUnit: null,
        baseUnit: null,
        tempCost: 0,
        finalQty: null,
    });

    const [form] = Form.useForm();

    useEffect(() => { fetchInitialData(); }, []);

    const fetchInitialData = async () => {
        setState(p => ({ ...p, loading: true }));
        try {
            const [pRes, rmRes] = await Promise.all([
                request("product", "get"),
                request("raw_material", "get")
            ]);
            const products = pRes.list || [];
            setState(p => ({ ...p, products, filteredProducts: products, rawMaterials: rmRes.list || [], loading: false }));
            if (products.length > 0) fetchRecipe(products[0], null);
        } catch {
            message.error("Failed to fetch data");
            setState(p => ({ ...p, loading: false }));
        }
    };

    const fetchRecipe = async (product, sizeLabel) => {
        if (!product) return;
        const params = { product_id: product.id };
        if (sizeLabel) params.size_label = sizeLabel;
        setState(p => ({ ...p, loading: true, selectedProduct: product, selectedSize: sizeLabel }));
        try {
            const res = await request("recipe", "get", params);
            setState(p => ({ ...p, ingredients: res.list || [], loading: false }));
        } catch {
            message.error("Failed to fetch recipe");
            setState(p => ({ ...p, loading: false }));
        }
    };

    const handleSearch = (e) => {
        const value = e.target.value.toLowerCase();
        const filtered = state.products.filter(p => p.name.toLowerCase().includes(value));
        setState(p => ({ ...p, searchText: value, filteredProducts: filtered }));
    };

    const handleAddIngredient = (values) => {
        const rm = state.rawMaterials.find(m => m.id === values.raw_material_id);
        const selectedUnit = state.recipeUnit || rm.unit;
        let qtyToSave = values.qty;
        if (selectedUnit === 'g'  && rm.unit === 'kg') qtyToSave = values.qty / 1000;
        if (selectedUnit === 'ml' && rm.unit === 'l')  qtyToSave = values.qty / 1000;

        const wasteFactor = values.waste_factor || 0;
        const effectiveQty = qtyToSave * (1 + wasteFactor / 100);

        const newIngredient = {
            raw_material_id: rm.id,
            name: rm.name,
            code: rm.code,
            base_unit: rm.unit,
            qty: qtyToSave,
            effective_qty: effectiveQty,
            waste_factor: wasteFactor,
            unit: rm.unit,
            cost_price: rm.price,
            stock_qty: rm.qty,
            size_label: state.selectedSize
        };

        const exists = state.ingredients.find(i => i.raw_material_id === rm.id);
        if (exists) {
            const updated = state.ingredients.map(i =>
                i.raw_material_id === rm.id ? { ...newIngredient, qty: i.qty + qtyToSave } : i
            );
            setState(p => ({ ...p, ingredients: updated, isAddModalVisible: false, tempCost: 0, recipeUnit: null }));
        } else {
            setState(p => ({ ...p, ingredients: [...p.ingredients, newIngredient], isAddModalVisible: false, tempCost: 0, recipeUnit: null }));
        }
        form.resetFields();
    };

    const calculateTotal = () =>
        state.ingredients.reduce((acc, i) => acc + (i.cost_price * i.effective_qty || i.cost_price * i.qty), 0);

    const getServings = () => {
        if (!state.ingredients.length) return 0;
        const counts = state.ingredients.map(i => {
            const effQty = i.effective_qty || i.qty;
            return effQty > 0 ? Math.floor((i.stock_qty || 0) / effQty) : 0;
        });
        return Math.min(...counts);
    };

    const saveRecipe = async () => {
        if (!state.selectedProduct) return;
        setState(p => ({ ...p, saving: true }));
        try {
            await request("recipe", "post", {
                product_id: state.selectedProduct.id,
                size_label: state.selectedSize,
                ingredients: state.ingredients.map(i => ({
                    raw_material_id: i.raw_material_id,
                    qty: i.qty,
                    unit: i.unit,
                    waste_factor: i.waste_factor || 0,
                    size_label: state.selectedSize
                }))
            });
            notification.success({
                message: "រក្សាទុកបានជោគជ័យ",
                description: `Recipe for ${state.selectedProduct.name}${state.selectedSize ? ` (${state.selectedSize})` : ''} saved!`,
                placement: "topRight", duration: 4
            });
            setState(p => ({ ...p, saving: false }));
            fetchRecipe(state.selectedProduct, state.selectedSize);
        } catch {
            message.error("Failed to save recipe");
            setState(p => ({ ...p, saving: false }));
        }
    };

    // Get sizes for selected product
    const productSizes = state.selectedProduct ? safeParse(state.selectedProduct.sizes) : [];
    const hasSizes = productSizes.length > 0;

    const sizeTabs = hasSizes
        ? [{ key: null, label: 'All Sizes' }, ...productSizes.map(s => ({ key: s.label || s, label: s.label || s }))]
        : [];

    const ingredientColumns = [
        {
            title: t.name,
            dataIndex: "name",
            key: "name",
            render: (name, record) => (
                <Space>
                    <Text strong>{name}</Text>
                    {record.size_label && <Tag color="purple">{record.size_label}</Tag>}
                </Space>
            )
        },
        {
            title: "បរិមាណ (qty)",
            dataIndex: "qty",
            key: "qty",
            render: (qty, record, index) => (
                <InputNumber
                    min={0.0001}
                    value={qty}
                    step={0.001}
                    style={{ width: 110, fontWeight: 'bold' }}
                    formatter={v => `${v}`}
                    onChange={(val) => {
                        const updated = state.ingredients.map((i, idx) => {
                            if (idx !== index) return i;
                            const ef = val * (1 + (i.waste_factor || 0) / 100);
                            return { ...i, qty: val, effective_qty: ef };
                        });
                        setState(p => ({ ...p, ingredients: updated }));
                    }}
                />
            )
        },
        {
            title: (
                <Tooltip title="Waste % — Extra qty used due to spill/loss. E.g: 5 means 5% more will be deducted.">
                    <Space>Waste % <InfoCircleOutlined /></Space>
                </Tooltip>
            ),
            dataIndex: "waste_factor",
            key: "waste_factor",
            render: (waste, record, index) => (
                <InputNumber
                    min={0} max={100}
                    value={waste || 0}
                    step={1}
                    style={{ width: 80 }}
                    formatter={v => `${v}%`}
                    parser={v => v.replace('%', '')}
                    onChange={(val) => {
                        const updated = state.ingredients.map((i, idx) => {
                            if (idx !== index) return i;
                            const ef = i.qty * (1 + (val || 0) / 100);
                            return { ...i, waste_factor: val || 0, effective_qty: ef };
                        });
                        setState(p => ({ ...p, ingredients: updated }));
                    }}
                />
            )
        },
        {
            title: "ប្រើប្រាស់ពិត (Effective)",
            key: "effective_qty",
            render: (_, record) => {
                const eff = record.effective_qty || record.qty;
                return (
                    <Tooltip title={`After ${record.waste_factor || 0}% waste`}>
                        <Text type={record.waste_factor > 0 ? "warning" : "secondary"}>
                            {Number(eff || 0).toFixed(4)} {record.base_unit}
                        </Text>
                    </Tooltip>
                );
            }
        },
        {
            title: t.unit,
            dataIndex: "base_unit",
            key: "unit",
            render: (unit) => <Tag color="blue">{unit}</Tag>
        },
        {
            title: "ថ្លៃ/Unit (Real-time)",
            dataIndex: "cost_price",
            key: "cost_price",
            render: (num) => <Text style={{ color: '#888' }}>${Number(num).toFixed(2)}</Text>
        },
        {
            title: "ថ្លៃដើម/កែវ",
            key: "line_cost",
            render: (_, record) => {
                const eff = record.effective_qty || record.qty;
                const cost = eff * record.cost_price;
                return <Text strong style={{ color: '#1890ff' }}>${Number(cost || 0).toFixed(4)}</Text>;
            }
        },
        {
            title: "ស្តុកនៅសល់",
            key: "stock",
            render: (_, record) => {
                const eff = record.effective_qty || record.qty;
                const stockQty = record.stock_qty || 0;
                const servings = eff > 0 ? Math.floor(stockQty / eff) : 0;
                const isLow = servings < 50;
                return (
                    <Space>
                        <Text>{stockQty} {record.base_unit}</Text>
                        <Tag color={isLow ? 'red' : 'green'}>
                            {isLow && <WarningOutlined />} {servings} កែវ
                        </Tag>
                    </Space>
                );
            }
        },
        {
            title: t.action,
            key: "action",
            render: (_, record, index) => (
                <Popconfirm
                    title="លុបចេញ?"
                    onConfirm={() => {
                        const updated = [...state.ingredients];
                        updated.splice(index, 1);
                        setState(p => ({ ...p, ingredients: updated }));
                        message.success('Removed');
                    }}
                    okText="Yes" cancelText="No"
                >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Row gutter={24}>
                {/* Left: Product list */}
                <Col span={7}>
                    <Card title={<Space><ExperimentOutlined />{t.product}</Space>} bodyStyle={{ padding: '12px' }}>
                        <Input
                            placeholder={`${t.search}...`}
                            prefix={<SearchOutlined />}
                            value={state.searchText}
                            onChange={handleSearch}
                            style={{ marginBottom: 12 }}
                        />
                        <Table
                            size="small"
                            columns={[{
                                title: t.product,
                                key: "product",
                                render: (_, record) => (
                                    <Space>
                                        <img
                                            src={record.image ? Config.getFullImagePath(record.image) : "https://via.placeholder.com/36"}
                                            style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }}
                                            alt={record.name}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: 13 }}>{record.name}</div>
                                            <div style={{ fontSize: 11, color: '#888' }}>
                                                {record.product_type === 'recipe' 
                                                    ? <Tag color="green" style={{ fontSize: 10 }}>Recipe</Tag>
                                                    : <Tag color="orange" style={{ fontSize: 10 }}>No Recipe</Tag>
                                                }
                                                {record.estimated_servings > 0 && (
                                                    <Tag color="blue" style={{ fontSize: 10 }}>{record.estimated_servings} cups</Tag>
                                                )}
                                            </div>
                                        </div>
                                    </Space>
                                )
                            }]}
                            dataSource={state.filteredProducts}
                            rowKey="id"
                            loading={state.loading && state.products.length === 0}
                            pagination={{ pageSize: 12, size: 'small' }}
                            onRow={(record) => ({
                                onClick: () => fetchRecipe(record, null),
                                style: {
                                    cursor: 'pointer',
                                    backgroundColor: state.selectedProduct?.id === record.id ? '#e6f7ff' : 'inherit'
                                }
                            })}
                        />
                    </Card>
                </Col>

                {/* Right: Recipe editor */}
                <Col span={17}>
                    <Card bodyStyle={{ padding: '16px' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Space>
                                <ExperimentOutlined style={{ fontSize: 18 }} />
                                <Title level={5} style={{ margin: 0 }}>{t.ingredients}</Title>
                                {state.selectedProduct && (
                                    <Tag color="green">{state.selectedProduct.name}</Tag>
                                )}
                                {state.selectedSize && (
                                    <Tag color="purple">Size: {state.selectedSize}</Tag>
                                )}
                            </Space>
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    size="large"
                                    disabled={!state.selectedProduct}
                                    onClick={() => setState(p => ({ ...p, isAddModalVisible: true }))}
                                    style={{ fontWeight: 'bold' }}
                                >
                                    {t.add_ingredient}
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    size="large"
                                    loading={state.saving}
                                    disabled={!state.selectedProduct}
                                    onClick={saveRecipe}
                                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', fontWeight: 'bold' }}
                                >
                                    រក្សាទុក / Save
                                </Button>
                            </Space>
                        </div>

                        {/* Size Tabs (only if product has sizes) */}
                        {hasSizes && (
                            <Tabs
                                activeKey={String(state.selectedSize)}
                                onChange={(key) => {
                                    const size = key === 'null' ? null : key;
                                    fetchRecipe(state.selectedProduct, size);
                                }}
                                style={{ marginBottom: 8 }}
                                items={sizeTabs.map(s => ({
                                    key: String(s.key),
                                    label: (
                                        <span>
                                            {s.label}
                                            {s.key && state.selectedProduct?.product_type === 'recipe' && (
                                                <Badge status="success" style={{ marginLeft: 4 }} />
                                            )}
                                        </span>
                                    )
                                }))}
                            />
                        )}

                        {state.selectedProduct ? (
                            <>
                                <Table
                                    columns={ingredientColumns}
                                    dataSource={state.ingredients}
                                    rowKey={(_, idx) => idx}
                                    loading={state.loading}
                                    pagination={false}
                                    locale={{ emptyText: <Empty description="មិនមានគ្រឿងផ្សំ — ចុច '+ Add Ingredient' ដើម្បីបន្ថែម" /> }}
                                />

                                {/* Summary Card */}
                                <Card
                                    style={{ marginTop: 16, background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)', border: '1px solid #b7eb8f' }}
                                    bodyStyle={{ padding: '16px 24px' }}
                                >
                                    <Row justify="space-between" align="middle">
                                        <Col>
                                            <div style={{ background: '#fff', border: '1px solid #91d5ff', padding: '10px 20px', borderRadius: 8, textAlign: 'center' }}>
                                                <div style={{ fontSize: 11, color: '#1890ff', fontWeight: 800 }}>
                                                    ESTIMATED SERVINGS / ចំនួនកែវ
                                                </div>
                                                <div style={{ fontSize: 28, fontWeight: 900, color: '#096dd9' }}>
                                                    {getServings().toLocaleString()} {t.cups || 'កែវ'}
                                                </div>
                                                {getServings() < 50 && getServings() > 0 && (
                                                    <Tag color="red" icon={<WarningOutlined />}>ស្តុកជិតអស់!</Tag>
                                                )}
                                            </div>
                                        </Col>
                                        <Col style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 11, color: '#888', fontWeight: 800 }}>
                                                TOTAL RECIPE COST / ថ្លៃដើម ១ កែវ
                                            </div>
                                            <Title level={2} style={{ margin: 0, color: '#d32f2f' }}>
                                                ${Number(calculateTotal() || 0).toFixed(4)}
                                            </Title>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                (Real-time price, including waste)
                                            </Text>
                                        </Col>
                                    </Row>
                                </Card>

                                {/* Low Stock Alert */}
                                {state.ingredients.some(i => {
                                    const eff = i.effective_qty || i.qty;
                                    return eff > 0 && (i.stock_qty || 0) / eff < 50;
                                }) && (
                                    <Card
                                        style={{ marginTop: 8, background: '#fff2e8', border: '1px solid #ffbb96' }}
                                        bodyStyle={{ padding: '8px 16px' }}
                                    >
                                        <Space>
                                            <WarningOutlined style={{ color: '#fa541c' }} />
                                            <Text style={{ color: '#fa541c', fontWeight: 'bold' }}>
                                                WARNING: គ្រឿងផ្សំខ្លះនឹងអស់ក្នុងពេលឆាប់ៗ! ត្រូវទិញបន្ថែម!
                                            </Text>
                                        </Space>
                                    </Card>
                                )}
                            </>
                        ) : (
                            <Card bordered={false} style={{ textAlign: 'center', padding: '80px 0' }}>
                                <Empty description={t.select_product_to_view_recipe || "ជ្រើសរើសផលិតផលដើម្បីមើលរូបមន្ត"} />
                            </Card>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Add Ingredient Modal */}
            <Modal
                title={<Space><PlusOutlined />{t.add_ingredient}</Space>}
                open={state.isAddModalVisible}
                onCancel={() => { setState(p => ({ ...p, isAddModalVisible: false, tempCost: 0, recipeUnit: null })); form.resetFields(); }}
                onOk={() => form.submit()}
                okText={t.ok_btn || "OK"}
                cancelText={t.cancel_btn || "Cancel"}
                destroyOnClose
                width={520}
            >
                <Form form={form} layout="vertical" onFinish={handleAddIngredient}>
                    <Form.Item
                        name="raw_material_id"
                        label={t.raw_material || "វត្ថុធាតុដើម"}
                        rules={[{ required: true, message: "Please select" }]}
                    >
                        <Select
                            showSearch
                            placeholder="ជ្រើសរើសសម្ភារ..."
                            optionFilterProp="label"
                            onChange={(id) => {
                                const rm = state.rawMaterials.find(m => m.id === id);
                                if (rm) {
                                    const canConvert = ["kg", "l"].includes(rm.unit?.toLowerCase());
                                    const defaultUnit = canConvert
                                        ? (rm.unit.toLowerCase() === 'kg' ? 'g' : 'ml')
                                        : rm.unit;
                                    setState(p => ({ ...p, recipeUnit: defaultUnit, baseUnit: rm.unit, tempCost: 0 }));
                                }
                            }}
                            options={state.rawMaterials.map(rm => ({
                                value: rm.id,
                                label: `${rm.name} (${rm.unit}) — ស្តុក: ${rm.qty} | $${rm.price}/${rm.unit}`
                            }))}
                        />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={10}>
                            <Form.Item name="qty" label="បរិមាណ" initialValue={20} rules={[{ required: true }]}>
                                <InputNumber
                                    size="large"
                                    min={0.0001}
                                    step={1}
                                    style={{ width: '100%' }}
                                    onChange={(val) => {
                                        const rmId = form.getFieldValue("raw_material_id");
                                        const rm = state.rawMaterials.find(m => m.id === rmId);
                                        if (rm && val) {
                                            let fq = val;
                                            if (state.recipeUnit === 'g'  && rm.unit === 'kg')  fq = val / 1000;
                                            if (state.recipeUnit === 'ml' && rm.unit === 'l')   fq = val / 1000;
                                            const waste = form.getFieldValue("waste_factor") || 0;
                                            const eff = fq * (1 + waste / 100);
                                            setState(p => ({ ...p, tempCost: eff * rm.price, finalQty: fq }));
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={7}>
                            <Form.Item label="ឯកតា">
                                <Select
                                    size="large"
                                    value={state.recipeUnit}
                                    onChange={(val) => {
                                        setState(p => ({ ...p, recipeUnit: val }));
                                        const qty = form.getFieldValue("qty");
                                        const rmId = form.getFieldValue("raw_material_id");
                                        const rm = state.rawMaterials.find(m => m.id === rmId);
                                        if (rm && qty) {
                                            let fq = qty;
                                            if (val === 'g'  && rm.unit === 'kg')  fq = qty / 1000;
                                            if (val === 'ml' && rm.unit === 'l')   fq = qty / 1000;
                                            const waste = form.getFieldValue("waste_factor") || 0;
                                            const eff = fq * (1 + waste / 100);
                                            setState(p => ({ ...p, tempCost: eff * rm.price, finalQty: fq }));
                                        }
                                    }}
                                    options={[
                                        { label: state.baseUnit, value: state.baseUnit },
                                        ...(state.baseUnit === 'kg' ? [{ label: 'g (ក្រាម)', value: 'g' }] : []),
                                        ...(state.baseUnit === 'l'  ? [{ label: 'ml (ML)', value: 'ml' }] : [])
                                    ].filter(o => o.value)}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={7}>
                            <Form.Item name="waste_factor" label="Waste %" initialValue={0}>
                                <InputNumber
                                    size="large"
                                    min={0} max={100}
                                    step={1}
                                    style={{ width: '100%' }}
                                    formatter={v => `${v}%`}
                                    parser={v => v.replace('%', '')}
                                    onChange={(waste) => {
                                        if (state.finalQty && waste !== undefined) {
                                            const rmId = form.getFieldValue("raw_material_id");
                                            const rm = state.rawMaterials.find(m => m.id === rmId);
                                            if (rm) {
                                                const eff = state.finalQty * (1 + waste / 100);
                                                setState(p => ({ ...p, tempCost: eff * rm.price }));
                                            }
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {state.tempCost > 0 && (
                        <div style={{
                            background: '#f6ffed', border: '1px solid #b7eb8f',
                            padding: '12px', borderRadius: 8, textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 11, color: '#52c41a', fontWeight: 800 }}>
                                ថ្លៃដើមក្នុង ១ កែវ (Real-time)
                            </div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: '#389e0d' }}>
                                ${Number(state.tempCost || 0).toFixed(4)}
                            </div>
                            {state.finalQty && (
                                <div style={{ fontSize: 11, color: '#73d13d' }}>
                                    ✓ នឹងដក {Number(state.finalQty * (1 + (form.getFieldValue('waste_factor') || 0) / 100) || 0).toFixed(4)} {state.baseUnit} ពីស្តុក
                                </div>
                            )}
                        </div>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default RecipePage;
