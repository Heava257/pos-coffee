import React, { useEffect, useState } from "react";
import { Button, Form, InputNumber, message, Modal, Select, Space, Table } from "antd";
import { request } from "../../util/helper";
import { MdDelete, MdAdd } from "react-icons/md";

function RecipeModal({ open, onCancel, product }) {
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
        const res = await request("raw_material", "get", { status: 1 }); // Active only
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
                unit: material ? material.unit : ing.unit // Ensure unit is correct
            };
        });

        const res = await request("recipe", "post", {
            product_id: product.id,
            ingredients: cleanIngredients
        });

        if (res && !res.error) {
            message.success("Recipe saved successfully!");
            onCancel();
        } else {
            message.error(res.error || "Failed to save recipe");
        }
        setLoading(false);
    };

    const calculateCost = () => {
        // client-side calculation for estimation
        const currentIngredients = form.getFieldValue("ingredients") || [];
        let total = 0;
        currentIngredients.forEach(ing => {
            if (!ing) return;
            const material = rawMaterials.find(rm => rm.value === ing.raw_material_id);
            if (material) {
                total += (Number(ing.qty) || 0) * (Number(material.price) || 0);
            }
        });
        return total.toFixed(2);
    };

    return (
        <Modal
            title={`Recipe for: ${product?.name}`}
            open={open}
            onCancel={onCancel}
            width={700}
            footer={null}
            destroyOnClose
        >
            <div style={{ marginBottom: 16, padding: 10, background: "#f5f5f5", borderRadius: 4 }}>
                <strong>Est. Cost: ${calculateCost()}</strong>
                <span style={{ marginLeft: 15, color: '#888' }}>Selling Price: ${product?.price}</span>
            </div>

            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.List name="ingredients">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="start">
                                    <Form.Item
                                        {...restField}
                                        name={[name, "raw_material_id"]}
                                        label="Ingredient"
                                        rules={[{ required: true, message: "Required" }]}
                                        style={{ width: 250 }}
                                    >
                                        <Select
                                            placeholder="Select Raw Material"
                                            options={rawMaterials}
                                            showSearch
                                            filterOption={(input, option) =>
                                                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                            }
                                            onChange={() => form.setFieldsValue({})} // trigger re-render for cost calc
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        {...restField}
                                        name={[name, "qty"]}
                                        label="Quantity"
                                        rules={[{ required: true, message: "Required" }]}
                                    >
                                        <InputNumber min={0.01} onChange={() => form.setFieldsValue({})} />
                                    </Form.Item>

                                    {/* Display Unit (read-only based on selection) */}
                                    <Form.Item
                                        shouldUpdate={(prevValues, currentValues) => {
                                            return prevValues.ingredients?.[name]?.raw_material_id !== currentValues.ingredients?.[name]?.raw_material_id;
                                        }}
                                        label="Unit"
                                    >
                                        {() => {
                                            const selectedId = form.getFieldValue(["ingredients", name, "raw_material_id"]);
                                            const material = rawMaterials.find(rm => rm.value === selectedId);
                                            return <span style={{ lineHeight: '32px', display: 'inline-block' }}>{material?.unit || '-'}</span>
                                        }}
                                    </Form.Item>

                                    <Button danger type="text" icon={<MdDelete />} onClick={() => { remove(name); form.setFieldsValue({}); }} style={{ marginTop: 30 }} />
                                </Space>
                            ))}

                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<MdAdd />}>
                                    Add Ingredient
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <div style={{ textAlign: "right", marginTop: 20 }}>
                    <Space>
                        <Button onClick={onCancel}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Save Recipe
                        </Button>
                    </Space>
                </div>
            </Form>
        </Modal>
    );
}

export default RecipeModal;
