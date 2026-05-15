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
                message: t.save_success || "រក្សាទុកបានជោគជ័យ",
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
                    {record.size_label && <Tag color="purple">{t.size || "ទំហំ"}: {record.size_label}</Tag>}
                </Space>
            )
        },
        {
            title: t.quantity || "បរិមាណ",
            dataIndex: "qty",
            key: "qty",
            width: 110,
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
                <Tooltip title={t.waste_factor_desc || "ភាគរយខ្ជះខ្ជាយ — បរិមាណបន្ថែមដែលត្រូវដកចេញពីស្តុកដោយសារការហៀរ ឬបាត់បង់។"}>
                    <Space>{t.waste || "ភាគរយខ្ជះខ្ជាយ"} <InfoCircleOutlined /></Space>
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
            title: t.effective_qty || "ប្រើប្រាស់ពិត",
            key: "effective_qty",
            width: 120,
            render: (_, record) => {
                const eff = record.effective_qty || record.qty;
                return (
                    <Tooltip title={`${t.after_waste || "ក្រោយការខ្ជះខ្ជាយ"} ${record.waste_factor || 0}%`}>
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
            width: 80,
            render: (unit) => <Tag color="blue">{unit}</Tag>
        },
        {
            title: t.cost_per_unit || "ថ្លៃដើមមធ្យម",
            dataIndex: "cost_price",
            key: "cost_price",
            width: 110,
            render: (num) => <Text style={{ color: '#888' }}>${Number(num).toFixed(2)}</Text>
        },
        {
            title: t.cost_per_cup || "ថ្លៃដើមក្នុង ១ កែវ",
            key: "line_cost",
            width: 120,
            render: (_, record) => {
                const eff = record.effective_qty || record.qty;
                const cost = eff * record.cost_price;
                return <Text strong style={{ color: '#1890ff' }}>${Number(cost || 0).toFixed(4)}</Text>;
            }
        },
        {
            title: t.current_stock || "ស្តុកនៅសល់",
            key: "stock",
            width: 180,
            render: (_, record) => {
                const eff = record.effective_qty || record.qty;
                const stockQty = record.stock_qty || 0;
                const servings = eff > 0 ? Math.floor(stockQty / eff) : 0;
                const isLow = servings < 50;
                return (
                    <div style={{ minWidth: 150, whiteSpace: 'nowrap' }}>
                        <Text strong>{Number(stockQty).toFixed(4)} {record.base_unit}</Text>
                        <div style={{ marginTop: 4 }}>
                            <Tag color={isLow ? 'red' : 'green'} style={{ borderRadius: 6 }}>
                                {isLow && <WarningOutlined />} {servings} {t.cups || 'កែវ'}
                            </Tag>
                        </div>
                    </div>
                );
            }
        },
        {
            title: t.action || "សកម្មភាព",
            key: "action",
            width: 90,
            align: 'center',
            render: (_, record, index) => (
                <Popconfirm
                    title={t.confirm_delete || "លុបចេញ?"}
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
        <div style={{ padding: '16px' }}>
            <Row gutter={16}>
                {/* Left: Product list */}
                <Col span={7}>
                    <Card 
                        title={<Space><ExperimentOutlined />{t.product}</Space>} 
                        bodyStyle={{ padding: '8px' }}
                        headStyle={{ minHeight: '40px', padding: '0 12px' }}
                        className="recipe-product-card"
                    >
                        <Input
                            placeholder={`${t.search}...`}
                            prefix={<SearchOutlined />}
                            value={state.searchText}
                            onChange={handleSearch}
                            style={{ marginBottom: 8 }}
                            size="middle"
                        />
                        <Table
                            size="small"
                            columns={[{
                                title: t.product,
                                key: "product",
                                render: (_, record) => (
                                    <Space size={8}>
                                        <img
                                            src={record.image ? Config.getFullImagePath(record.image) : "https://via.placeholder.com/36"}
                                            style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', border: '1px solid #f0f0f0' }}
                                            alt={record.name}
                                        />
                                        <div style={{ lineHeight: '1.2' }}>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: '#1e4a2d' }}>{record.name}</div>
                                            <div style={{ marginTop: 2 }}>
                                                {record.product_type === 'recipe' 
                                                    ? <Tag color="success" style={{ fontSize: 9, margin: 0, padding: '0 4px', borderRadius: 4 }}>Recipe</Tag>
                                                    : <Tag color="default" style={{ fontSize: 9, margin: 0, padding: '0 4px', borderRadius: 4 }}>No Recipe</Tag>
                                                }
                                                {record.estimated_servings > 0 && (
                                                    <Tag color="processing" style={{ fontSize: 9, margin: '0 0 0 4px', padding: '0 4px', borderRadius: 4, border: 'none' }}>
                                                        {record.estimated_servings} cups
                                                    </Tag>
                                                )}
                                            </div>
                                        </div>
                                    </Space>
                                )
                            }]}
                            dataSource={state.filteredProducts}
                            rowKey="id"
                            loading={state.loading && state.products.length === 0}
                            pagination={{ pageSize: 12, size: 'small', simple: true }}
                            onRow={(record) => ({
                                onClick: () => fetchRecipe(record, null),
                                style: {
                                    cursor: 'pointer',
                                    backgroundColor: state.selectedProduct?.id === record.id ? '#f6ffed' : 'transparent',
                                    borderLeft: state.selectedProduct?.id === record.id ? '3px solid #1e4a2d' : 'none',
                                    transition: 'all 0.2s'
                                }
                            })}
                            showHeader={false}
                        />
                    </Card>
                </Col>

                {/* Right: Recipe editor */}
                <Col span={17}>
                    <Card 
                        bodyStyle={{ padding: '12px' }}
                        className="recipe-editor-card"
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 16 }}>
                            <Space size={12} style={{ flexShrink: 0 }}>
                                <div style={{ 
                                    width: 36, height: 36, borderRadius: 8, background: '#1e4a2d', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                                }}>
                                    <ExperimentOutlined style={{ color: '#fff', fontSize: 18 }} />
                                </div>
                                <div>
                                    <Title level={5} style={{ margin: 0, color: '#1e4a2d' }}>{t.ingredients}</Title>
                                    <Space size={4}>
                                        {state.selectedProduct && (
                                            <Text type="secondary" style={{ fontSize: 12 }}>{state.selectedProduct.name}</Text>
                                        )}
                                        {state.selectedSize && (
                                            <Tag color="purple" style={{ margin: 0, fontSize: 10 }}>{t.size || "ទំហំ"}: {state.selectedSize}</Tag>
                                        )}
                                    </Space>
                                </div>
                            </Space>

                            <div style={{ flex: 1, maxWidth: 500 }}>
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>
                                    ⚡ {t.quick_batch_add || "Quick Add Multiple Ingredients"}
                                </div>
                                <Select
                                    mode="multiple"
                                    placeholder="Search and add more ingredients..."
                                    style={{ width: '100%' }}
                                    disabled={!state.selectedProduct}
                                    options={state.rawMaterials
                                        .filter(rm => !state.ingredients.some(i => i.raw_material_id === rm.id))
                                        .map(rm => ({ label: `${rm.name} (${rm.unit})`, value: rm.id }))
                                    }
                                    value={[]}
                                    maxTagCount="responsive"
                                    onChange={(ids) => {
                                        const newIngredients = [...state.ingredients];
                                        ids.forEach(id => {
                                            if (!newIngredients.some(i => i.raw_material_id === id)) {
                                                const rm = state.rawMaterials.find(m => m.id === id);
                                                const canConvert = ["kg", "l"].includes(rm.unit?.toLowerCase());
                                                const defaultQty = canConvert ? 0.01 : 1; // 10g or 1 unit
                                                const wasteFactor = 0;
                                                const effectiveQty = defaultQty * (1 + wasteFactor / 100);

                                                newIngredients.push({
                                                    raw_material_id: rm.id,
                                                    name: rm.name,
                                                    code: rm.code,
                                                    base_unit: rm.unit,
                                                    qty: defaultQty,
                                                    effective_qty: effectiveQty,
                                                    waste_factor: wasteFactor,
                                                    unit: rm.unit,
                                                    cost_price: rm.price,
                                                    stock_qty: rm.qty,
                                                    size_label: state.selectedSize
                                                });
                                            }
                                        });
                                        setState(p => ({ ...p, ingredients: newIngredients }));
                                    }}
                                />
                            </div>

                            <Space size={8} style={{ flexShrink: 0 }}>
                                <Tooltip title="Detailed Add">
                                    <Button
                                        type="default"
                                        icon={<PlusOutlined />}
                                        disabled={!state.selectedProduct}
                                        onClick={() => setState(p => ({ ...p, isAddModalVisible: true }))}
                                        style={{ borderRadius: 6 }}
                                    />
                                </Tooltip>
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    loading={state.saving}
                                    disabled={!state.selectedProduct}
                                    onClick={saveRecipe}
                                    style={{ backgroundColor: '#1e4a2d', borderColor: '#1e4a2d', borderRadius: 6, fontWeight: 600 }}
                                >
                                    {t.save || "រក្សាទុក"}
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
                                size="small"
                                tabBarGutter={16}
                                items={sizeTabs.map(s => ({
                                    key: String(s.key),
                                    label: (
                                        <span style={{ fontSize: 12, fontWeight: 500 }}>
                                            {s.label}
                                            {s.key && state.selectedProduct?.product_type === 'recipe' && (
                                                <Badge status="success" style={{ marginLeft: 6 }} />
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
                                    size="small"
                                    scroll={{ x: 1100, y: 400 }}
                                    className="recipe-table"
                                    rowClassName={() => 'compact-row'}
                                    locale={{ emptyText: <Empty description={t.no_ingredients_defined || "មិនមានគ្រឿងផ្សំ — ចុច '+ Add' ដើម្បីបន្ថែម"} /> }}
                                    components={{
                                        header: {
                                            cell: (props) => (
                                                <th {...props} style={{ 
                                                    ...props.style, 
                                                    backgroundColor: '#1e4a2d', 
                                                    color: '#fff', 
                                                    padding: '8px 12px',
                                                    fontSize: '12px'
                                                }} />
                                            )
                                        }
                                    }}
                                />

                                {/* Summary Card - Premium Design */}
                                <div style={{ 
                                    marginTop: 16, 
                                    padding: '16px 20px', 
                                    background: '#fff', 
                                    borderRadius: '12px',
                                    border: '1px solid #e8e3d8',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                }}>
                                    <Row justify="space-between" align="middle">
                                        <Col>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ 
                                                    background: '#f6ffed', 
                                                    border: '1px solid #b7eb8f', 
                                                    padding: '8px 20px', 
                                                    borderRadius: 10, 
                                                    textAlign: 'center' 
                                                }}>
                                                    <div style={{ fontSize: 10, color: '#389e0d', fontWeight: 700, letterSpacing: '0.5px' }}>
                                                    {t.estimated_servings_label || "ចំនួនកែវសរុប"}
                                                    </div>
                                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1e4a2d', lineHeight: '1.2' }}>
                                                        {getServings().toLocaleString()} <span style={{ fontSize: 14 }}>{t.cups || 'កែវ'}</span>
                                                    </div>
                                                </div>
                                                {getServings() < 50 && getServings() > 0 && (
                                                    <div style={{ 
                                                        background: '#fff1f0', 
                                                        border: '1px solid #ffa39e', 
                                                        padding: '4px 12px', 
                                                        borderRadius: 6,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <WarningOutlined style={{ color: '#cf1322', fontSize: 12 }} />
                                                        <Text style={{ color: '#cf1322', fontSize: 11, fontWeight: 600 }}>{t.low_stock || "ស្តុកជិតអស់!"}</Text>
                                                    </div>
                                                )}
                                            </div>
                                        </Col>
                                        <Col style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 10, color: '#8c8c8c', fontWeight: 700, letterSpacing: '0.5px' }}>
                                                {t.cost_per_cup || "ថ្លៃដើមក្នុង ១ កែវ (បច្ចុប្បន្ន)"}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '4px' }}>
                                                <span style={{ fontSize: 16, fontWeight: 700, color: '#cf1322' }}>$</span>
                                                <span style={{ fontSize: 28, fontWeight: 800, color: '#cf1322', lineHeight: '1' }}>
                                                    {Number(calculateTotal() || 0).toFixed(4)}
                                                </span>
                                            </div>
                                            <Text type="secondary" style={{ fontSize: 10 }}>
                                                ( {t.real_time_price || "តម្លៃបច្ចុប្បន្ន រួមទាំងការខ្ជះខ្ជាយ"} )
                                            </Text>
                                        </Col>
                                    </Row>
                                </div>

                                {/* Low Stock Alert - Minimalist */}
                                {state.ingredients.some(i => {
                                    const eff = i.effective_qty || i.qty;
                                    return eff > 0 && (i.stock_qty || 0) / eff < 50;
                                }) && (
                                    <div style={{ 
                                        marginTop: 8, 
                                        padding: '8px 16px', 
                                        background: 'rgba(255, 77, 79, 0.05)', 
                                        border: '1px dashed #ffa39e',
                                        borderRadius: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <WarningOutlined style={{ color: '#ff4d4f' }} />
                                        <Text style={{ color: '#ff4d4f', fontSize: 11, fontWeight: 500 }}>
                                            {t.low_stock_warning || "គ្រឿងផ្សំខ្លះជិតអស់ពីស្តុក! សូមត្រួតពិនិត្យ និងទិញបន្ថែម។"}
                                        </Text>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '100px 0', background: '#fafafa', borderRadius: 12 }}>
                                <Empty 
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={<Text type="secondary">{t.select_product_to_view_recipe || "ជ្រើសរើសផលិតផលដើម្បីមើលរូបមន្ត"}</Text>} 
                                />
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Add Ingredient Modal */}
            <Modal
                title={<Space><ExperimentOutlined style={{ color: '#1e4a2d' }} /> <span style={{ color: '#1e4a2d' }}>{t.add_ingredient}</span></Space>}
                open={state.isAddModalVisible}
                onCancel={() => { setState(p => ({ ...p, isAddModalVisible: false, tempCost: 0, recipeUnit: null })); form.resetFields(); }}
                onOk={() => form.submit()}
                okText={t.ok_btn || "បន្ថែម"}
                cancelText={t.cancel_btn || "បោះបង់"}
                destroyOnClose
                width={500}
                okButtonProps={{ style: { backgroundColor: '#1e4a2d', borderColor: '#1e4a2d' } }}
            >
                <div style={{ paddingTop: 8 }}>
                    <Form form={form} layout="vertical" onFinish={handleAddIngredient} requiredMark={false}>
                        <Form.Item
                            name="raw_material_id"
                            label={<Text strong style={{ fontSize: 13 }}>{t.raw_material}</Text>}
                            rules={[{ required: true, message: t.required }]}
                        >
                            <Select
                                showSearch
                                size="large"
                                placeholder={t.select_material || "ជ្រើសរើសសម្ភារ..."}
                                optionFilterProp="label"
                                style={{ borderRadius: 8 }}
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
                                    label: `${rm.name} (${rm.unit}) — ${t.stock || "ស្តុក"}: ${rm.qty} | $${rm.price}/${rm.unit}`
                                }))}
                            />
                        </Form.Item>

                        <Row gutter={12}>
                            <Col span={10}>
                                <Form.Item 
                                    name="qty" 
                                    label={<Text strong style={{ fontSize: 13 }}>{t.quantity || "បរិមាណ"}</Text>} 
                                    initialValue={20} 
                                    rules={[{ required: true }]}
                                >
                                    <InputNumber
                                        size="large"
                                        min={0.0001}
                                        step={1}
                                        style={{ width: '100%', borderRadius: 8 }}
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
                                <Form.Item label={<Text strong style={{ fontSize: 13 }}>{t.unit || "ឯកតា"}</Text>}>
                                    <Select
                                        size="large"
                                        value={state.recipeUnit}
                                        style={{ borderRadius: 8 }}
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
                                            ...(state.baseUnit === 'kg' ? [{ label: `g (${t.gram || "ក្រាម"})`, value: 'g' }] : []),
                                            ...(state.baseUnit === 'l'  ? [{ label: 'ml (ML)', value: 'ml' }] : [])
                                        ].filter(o => o.value)}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={7}>
                                <Form.Item name="waste_factor" label={<Text strong style={{ fontSize: 13 }}>Waste %</Text>} initialValue={0}>
                                    <InputNumber
                                        size="large"
                                        min={0} max={100}
                                        step={1}
                                        style={{ width: '100%', borderRadius: 8 }}
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
                                background: 'rgba(30, 74, 45, 0.04)', 
                                border: '1px solid rgba(30, 74, 45, 0.1)',
                                padding: '16px', 
                                borderRadius: 12, 
                                textAlign: 'center',
                                marginTop: 8
                            }}>
                                <div style={{ fontSize: 10, color: '#1e4a2d', fontWeight: 800, letterSpacing: '0.5px' }}>
                                    {t.estimated_cost_per_cup || "ថ្លៃដើមក្នុង ១ កែវ (ប៉ាន់ស្មាន)"}
                                </div>
                                <div style={{ fontSize: 28, fontWeight: 900, color: '#cf1322', margin: '4px 0' }}>
                                    ${Number(state.tempCost || 0).toFixed(4)}
                                </div>
                                {state.finalQty && (
                                    <div style={{ fontSize: 11, color: '#1e4a2d', opacity: 0.7 }}>
                                        ✓ {t.will_deduct || "នឹងដក"} {Number(state.finalQty * (1 + (form.getFieldValue('waste_factor') || 0) / 100) || 0).toFixed(4)} {state.base_unit} {t.from_stock || "ពីស្តុក"}
                                    </div>
                                )}
                            </div>
                        )}
                    </Form>
                </div>
            </Modal>
        </div>
    );
};

export default RecipePage;
