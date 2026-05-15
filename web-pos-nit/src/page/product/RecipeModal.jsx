import React, { useEffect, useState } from "react";
import { Button, Form, InputNumber, message, Modal, Select, Space, Table, Tag, Tooltip, Typography, Row, Col, Card } from "antd";
import { request } from "../../util/helper";
import { MdDelete, MdAdd, MdReceiptLong, MdAttachMoney, MdShowChart } from "react-icons/md";
import { useLanguage, translations } from "../../store/language.store";

const { Text, Title } = Typography;

const COLORS = {
    darkGreen: "#1e4a2d",
    midGreen: "#2d6a42",
    lightGreen: "#e6f0e9",
    gold: "#d4af37",
    textSecondary: "#64748b",
    border: "#f1f5f9"
};

function RecipeModal({ open, onCancel, product }) {
    const { lang } = useLanguage();
    const t = translations[lang];
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [ingredients, setIngredients] = useState([]);

    useEffect(() => {
        if (open && product) {
            fetchRawMaterials();
            fetchRecipe(product.id);
        }
    }, [open, product]);

    const fetchRawMaterials = async () => {
        const res = await request("raw_material", "get", { status: 1 });
        if (res && !res.error) {
            setRawMaterials(res.list.map(item => ({
                label: `${item.name} (${item.unit})`,
                value: item.id,
                unit: item.unit,
                price: item.price
            })));
        }
    };

    const fetchRecipe = async (productId) => {
        setLoading(true);
        const res = await request("recipe", "get", { product_id: productId });
        if (res && !res.error) {
            setIngredients(res.list || []);
            form.setFieldsValue({
                ingredients: res.list.map(item => ({
                    raw_material_id: item.raw_material_id,
                    qty: item.qty,
                    unit: item.unit
                }))
            });
        }
        setLoading(false);
    };

    const onFinish = async (values) => {
        if (!product) return;
        setLoading(true);
        const cleanIngredients = values.ingredients.map(ing => {
            const material = rawMaterials.find(rm => rm.value === ing.raw_material_id);
            return {
                raw_material_id: ing.raw_material_id,
                qty: ing.qty,
                unit: material ? material.unit : ing.unit
            };
        });

        const res = await request("recipe", "post", {
            product_id: product.id,
            ingredients: cleanIngredients
        });

        if (res && !res.error) {
            message.success(t.recipe_saved_success || "Recipe saved successfully!");
            onCancel();
        } else {
            message.error(res.error || "Failed to save recipe");
        }
        setLoading(false);
    };

    const calculateSummary = () => {
        const currentIngredients = Form.useWatch('ingredients', form) || [];
        let totalCost = 0;
        currentIngredients.forEach(ing => {
            if (!ing) return;
            const material = rawMaterials.find(rm => rm.value === ing.raw_material_id);
            if (material) {
                totalCost += (Number(ing.qty) || 0) * (Number(material.price) || 0);
            }
        });

        const sellingPrice = Number(product?.price) || 0;
        const profit = sellingPrice - totalCost;
        const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

        return {
            totalCost: totalCost.toFixed(2),
            profit: profit.toFixed(2),
            margin: margin.toFixed(1)
        };
    };

    const summary = calculateSummary();

    return (
        <Modal
            title={
                <div style={{ padding: '8px 0' }}>
                    <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', color: COLORS.darkGreen }}>
                        <MdReceiptLong size={24} />
                        {t.recipe_config_title} - <span style={{ color: COLORS.gold }}>{product?.name}</span>
                    </Title>
                </div>
            }
            open={open}
            onCancel={onCancel}
            width={850}
            footer={null}
            centered
            destroyOnClose
            style={{ borderRadius: '24px', overflow: 'hidden' }}
        >
            <div style={{ marginBottom: '32px' }}>
                <Row gutter={[16, 16]}>
                    <Col span={8}>
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', height: '100%' }}>
                            <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.est_cost_per_cup}</Text>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: COLORS.darkGreen, marginTop: '4px' }}>${summary.totalCost}</div>
                        </div>
                    </Col>
                    <Col span={8}>
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', height: '100%' }}>
                            <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.selling_price_label}</Text>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#64748b', marginTop: '4px' }}>${Number(product?.price || 0).toFixed(2)}</div>
                        </div>
                    </Col>
                    <Col span={8}>
                        <div style={{ 
                            background: Number(summary.profit) > 0 ? '#f0fdf4' : '#fef2f2', 
                            padding: '20px', 
                            borderRadius: '20px', 
                            border: `1px solid ${Number(summary.profit) > 0 ? '#dcfce7' : '#fee2e2'}`,
                            height: '100%' 
                        }}>
                            <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.gross_profit_label}</Text>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: Number(summary.profit) > 0 ? '#166534' : '#991b1b', marginTop: '4px' }}>
                                ${summary.profit} <span style={{ fontSize: '14px', fontWeight: 600 }}>({summary.margin}%)</span>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>

            <Form form={form} layout="vertical" onFinish={onFinish}>
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '16px', border: '1px dashed #bae6fd' }}>
                    <Text strong style={{ display: 'block', marginBottom: '8px', color: '#0369a1', fontSize: '13px' }}>
                        ⚡ {t.quick_add_ingredients || "Quick Add Multiple Ingredients"}
                    </Text>
                    <Select
                        mode="multiple"
                        placeholder="Type to search and select multiple ingredients..."
                        style={{ width: '100%' }}
                        size="large"
                        options={rawMaterials}
                        value={[]} // Always empty so it acts as an adder
                        onChange={(selectedIds) => {
                            const currentIngredients = form.getFieldValue('ingredients') || [];
                            const newIngredients = [...currentIngredients];
                            
                            selectedIds.forEach(id => {
                                if (!currentIngredients.some(ing => ing?.raw_material_id === id)) {
                                    const material = rawMaterials.find(rm => rm.value === id);
                                    newIngredients.push({
                                        raw_material_id: id,
                                        qty: 1,
                                        unit: material?.unit
                                    });
                                }
                            });
                            
                            form.setFieldsValue({ ingredients: newIngredients });
                        }}
                        maxTagCount="responsive"
                    />
                </div>

                <div style={{ maxHeight: "450px", overflowY: "auto", overflowX: "hidden", padding: '4px 12px 4px 4px' }}>
                    <Form.List name="ingredients">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{ 
                                        background: "#fff", 
                                        border: "1px solid #f1f5f9", 
                                        borderRadius: "16px", 
                                        padding: "16px", 
                                        marginBottom: "16px",
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                    }}>
                                        <Row gutter={16} align="bottom">
                                            <Col flex="auto">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "raw_material_id"]}
                                                    label={<Text strong style={{ fontSize: '12px', color: COLORS.textSecondary }}>{t.select_ingredient_label}</Text>}
                                                    rules={[{ required: true, message: t.required }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Select
                                                        placeholder="Search Ingredient..."
                                                        options={rawMaterials}
                                                        showSearch
                                                        size="large"
                                                        className="executive-select"
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "qty"]}
                                                    label={<Text strong style={{ fontSize: '12px', color: COLORS.textSecondary }}>{t.usage_qty_label}</Text>}
                                                    rules={[{ required: true, message: t.required }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <InputNumber
                                                        min={0.001}
                                                        size="large"
                                                        style={{ width: "100%", borderRadius: '12px' }}
                                                        placeholder="0.00"
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={2}>
                                                <Form.Item
                                                    shouldUpdate={(prev, curr) => prev.ingredients?.[name]?.raw_material_id !== curr.ingredients?.[name]?.raw_material_id}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    {() => {
                                                        const id = form.getFieldValue(["ingredients", name, "raw_material_id"]);
                                                        const material = rawMaterials.find(rm => rm.value === id);
                                                        return <Tag bordered={false} style={{ height: '40px', lineHeight: '40px', padding: '0 12px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', fontWeight: 700 }}>
                                                            {material?.unit || '-'}
                                                        </Tag>
                                                    }}
                                                </Form.Item>
                                            </Col>
                                            <Col span={2}>
                                                <Button
                                                    danger
                                                    type="text"
                                                    icon={<MdDelete size={22} />}
                                                    onClick={() => remove(name)}
                                                    style={{ height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<MdAdd size={20} />}
                                    style={{ 
                                        height: '56px', 
                                        borderRadius: '16px', 
                                        borderWidth: '2px', 
                                        color: COLORS.midGreen,
                                        borderColor: '#e2e8f0',
                                        fontSize: '15px',
                                        fontWeight: 700
                                    }}
                                >
                                    {t.add_ingredient_link}
                                </Button>
                            </>
                        )}
                    </Form.List>
                </div>

                <div style={{ textAlign: "right", marginTop: '32px', borderTop: "1px solid #f1f5f9", paddingTop: '24px' }}>
                    <Space size="large">
                        <Button size="large" onClick={onCancel} style={{ borderRadius: '12px', padding: '0 32px', fontWeight: 600 }}>{t.close}</Button>
                        <Button 
                            size="large" 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading} 
                            style={{ 
                                borderRadius: '12px', 
                                padding: '0 48px', 
                                fontWeight: 800, 
                                background: COLORS.darkGreen, 
                                borderColor: COLORS.darkGreen,
                                boxShadow: '0 4px 12px rgba(30, 74, 45, 0.2)'
                            }}
                        >
                            {t.sync_recipe_btn}
                        </Button>
                    </Space>
                </div>
            </Form>
        </Modal>
    );
}

export default RecipeModal;
