import React, { useEffect, useState } from "react";
import {
  Card, Switch, Row, Col, Typography, Button, message, Spin, Tag, Empty, Badge
} from "antd";
import {
  AppstoreOutlined, SaveOutlined, CheckCircleOutlined, CloseCircleOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";

const { Title, Text } = Typography;

const CATEGORY_ICONS = {
  coffee: "☕",
  juice: "🧃",
  milk: "🥛",
  tea: "🍵",
  snack: "🍿",
  food: "🍽️",
  rice: "🍚",
  dessert: "🍰",
  drink: "🥤",
  beverage: "🍶",
  pizza: "🍕",
  noodle: "🍜",
  soup: "🍲",
  bread: "🥖",
  cake: "🎂",
};

const getCategoryIcon = (name) => {
  const lower = (name || "").toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "🏷️";
};

const CategoryManageTab = ({ targetBusinessId }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [targetBusinessId]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // If targetBusinessId is provided, fetch for that specific business
      const url = targetBusinessId 
        ? `business-categories?business_id=${targetBusinessId}` 
        : "business-categories";
      const res = await request(url, "get");
      if (res && res.list) {
        setCategories(res.list.map(c => ({ ...c, is_active: !!c.is_active })));
      }
    } catch (error) {
      message.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (categoryId, checked) => {
    setCategories(prev =>
      prev.map(c => c.id === categoryId ? { ...c, is_active: checked } : c)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const selections = categories.map(c => ({
        category_id: c.id,
        is_active: c.is_active ? 1 : 0,
      }));
      
      const payload = { 
        target_business_id: targetBusinessId, 
        selections 
      };

      const res = await request("business-categories/bulk", "post", payload);
      if (res && res.success) {
        message.success("✅ Category settings saved! Please refresh to see changes in the product form.");
      } else {
        message.error(res?.message || "Save failed");
      }
    } catch (error) {
      message.error("Failed to save category settings");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = categories.filter(c => c.is_active).length;

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: "#6b7280" }}>Loading categories...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 24,
        flexWrap: "wrap",
        gap: 16
      }}>
        <div>
          <Title level={4} style={{ margin: 0, color: "#1e4a2d", display: "flex", alignItems: "center", gap: 8 }}>
            <AppstoreOutlined /> ជ្រើសរើស Category / Select Your Categories
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            ជ្រើសរើស Category ដែលហាងលោកអ្នកប្រើ ។ Category ដែលជ្រើស នឹងបង្ហាញក្នុង Product Form.
          </Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Badge
            count={`${activeCount} Active`}
            style={{ background: "#1e4a2d", fontSize: 12, borderRadius: 8, padding: "0 10px" }}
          />
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
            style={{
              background: "#1e4a2d",
              borderColor: "#1e4a2d",
              borderRadius: 10,
              height: 40,
              fontWeight: 600,
              paddingLeft: 20,
              paddingRight: 20
            }}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Category Grid */}
      {categories.length === 0 ? (
        <Empty description="No categories found. Please contact support." />
      ) : (
        <Row gutter={[16, 16]}>
          {categories.map(cat => {
            const icon = getCategoryIcon(cat.name);
            const hasConfig = cat.default_moods || cat.default_sizes || cat.default_addons;
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={cat.id}>
                <Card
                  style={{
                    borderRadius: 16,
                    border: cat.is_active
                      ? "2px solid #1e4a2d"
                      : "2px solid #e8e3d8",
                    background: cat.is_active ? "#f0f7f2" : "#fafafa",
                    transition: "all 0.25s ease",
                    cursor: "pointer",
                    boxShadow: cat.is_active
                      ? "0 4px 15px rgba(30,74,45,0.12)"
                      : "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                  bodyStyle={{ padding: "16px 20px" }}
                  onClick={() => handleToggle(cat.id, !cat.is_active)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        fontSize: 32,
                        width: 52,
                        height: 52,
                        background: cat.is_active ? "#1e4a2d" : "#f0ede6",
                        borderRadius: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.25s ease"
                      }}>
                        {icon}
                      </div>
                      <div>
                        <div style={{
                          fontWeight: 700,
                          fontSize: 15,
                          color: cat.is_active ? "#1e4a2d" : "#374151"
                        }}>
                          {cat.name}
                        </div>
                        {hasConfig && (
                          <Tag
                            color="green"
                            style={{ fontSize: 10, borderRadius: 6, marginTop: 4, border: "none" }}
                          >
                            ✨ Has Config
                          </Tag>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={cat.is_active}
                      onChange={(checked, e) => { e.stopPropagation(); handleToggle(cat.id, checked); }}
                      style={{
                        background: cat.is_active ? "#1e4a2d" : undefined
                      }}
                    />
                  </div>

                  {/* Active State Footer */}
                  <div style={{
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: `1px dashed ${cat.is_active ? "#c3dac8" : "#e8e3d8"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: cat.is_active ? "#2d6a42" : "#9ca3af",
                    fontWeight: 500
                  }}>
                    {cat.is_active
                      ? <><CheckCircleOutlined /> Showing in Product Form</>
                      : <><CloseCircleOutlined /> Hidden from Product Form</>
                    }
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <div style={{
        marginTop: 24,
        padding: "16px 20px",
        background: "#fff9ef",
        borderRadius: 12,
        border: "1px solid #f0d9a0",
        fontSize: 13,
        color: "#8a6d2f"
      }}>
        💡 <strong>Note:</strong> Categories ថ្មី ឬ Configuration ថ្មី ត្រូវបង្កើតដោយ Platform Admin ។ 
        ហាងរបស់លោកអ្នកគ្រាន់តែ <strong>ជ្រើស</strong> Category ដែលពាក់ព័ន្ធ។
      </div>
    </div>
  );
};

export default CategoryManageTab;
