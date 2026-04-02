import React, { useEffect, useState } from "react";
import {
  Card, Switch, Row, Col, Typography, Button, message, Spin, Tag, Empty, Badge, Input, Space, Radio
} from "antd";
import {
  AppstoreOutlined, SaveOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined, FilterOutlined
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
  pharmacy: "💊",
  medicine: "💊",
  vitamin: "🧪",
  skincare: "🧴",
  equipment: "🩺",
  baby: "👶",
  first: "🩹",
  fever: "🌡️",
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
  const [searchText, setSearchText] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("all");

  useEffect(() => {
    fetchCategories();
  }, [targetBusinessId]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
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

  const filteredCategories = categories.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesIndustry = filterIndustry === "all" || c.industry_code === filterIndustry;
    return matchesSearch && matchesIndustry;
  });

  const activeCount = categories.filter(c => c.is_active).length;
  const industries = ["all", ...new Set(categories.map(c => c.industry_code))];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: "#6b7280" }}>Loading categories...</div>
      </div>
    );
  }

  const Divider = ({ style }) => <div style={{ height: "1px", background: "#f0f0f0", ...style }} />;

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      {/* Header & Controls */}
      <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", marginBottom: "20px", border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: "#1e4a2d", display: "flex", alignItems: "center", gap: 10 }}>
              <AppstoreOutlined style={{ fontSize: 24 }} /> Category Access Control
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Select categories that are active for this business unit.
            </Text>
          </div>
          <Space>
             <Badge count={`${activeCount} Active`} style={{ background: "#1e4a2d", fontSize: 12, borderRadius: 8 }} />
             <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave} style={{ background: "#1e4a2d", borderColor: "#1e4a2d", borderRadius: 10, height: 40, fontWeight: 600, padding: "0 24px" }}>
                Save Settings
              </Button>
          </Space>
        </div>

        <Divider style={{ margin: "16px 0" }} />

        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <Input 
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />} 
              placeholder="Search category name..." 
              allowClear
              onChange={e => setSearchText(e.target.value)}
              style={{ borderRadius: "10px", height: "40px" }}
            />
          </Col>
          <Col xs={24} md={14}>
            <Space size="middle" wrap>
              <Text strong style={{ fontSize: 13, color: "#666" }}><FilterOutlined /> INDUSTRY:</Text>
              <Radio.Group value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)} buttonStyle="solid">
                {industries.map(ind => (
                  <Radio.Button key={ind} value={ind} style={{ textTransform: "capitalize", borderRadius: "8px", margin: "0 4px" }}>
                    {ind === "all" ? "All Sectors" : (ind || "general").replace("_", " ")}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Category Grid */}
      {filteredCategories.length === 0 ? (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<Text type="secondary">No categories match your current filters.</Text>} 
          style={{ padding: "40px 0" }}
        />
      ) : (
        <Row gutter={[12, 12]}>
          {filteredCategories.map(cat => {
            const icon = getCategoryIcon(cat.name);
            const isActive = cat.is_active;
            const industryColor = cat.industry_code === 'pharmacy' ? '#08979c' : '#1e4a2d';

            return (
              <Col xs={24} sm={12} lg={8} key={cat.id}>
                <Card
                  hoverable
                  onClick={() => handleToggle(cat.id, !isActive)}
                  style={{
                    borderRadius: "14px",
                    border: isActive ? `1.5px solid ${industryColor}` : "1.5px solid #f0f0f0",
                    background: isActive ? `${industryColor}05` : "#fff",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    overflow: "hidden"
                  }}
                  bodyStyle={{ padding: "12px 16px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, overflow: "hidden" }}>
                      <div style={{
                        width: "44px",
                        height: "44px",
                        background: isActive ? industryColor : "#f5f5f5",
                        color: isActive ? "#fff" : "#999",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        flexShrink: 0,
                        transition: "all 0.2s"
                      }}>
                        {icon}
                      </div>
                      <div style={{ overflow: "hidden", flex: 1 }}>
                        <Text strong style={{ 
                          fontSize: "14px", 
                          display: "block", 
                          whiteSpace: "nowrap", 
                          overflow: "hidden", 
                          textOverflow: "ellipsis",
                          color: isActive ? industryColor : "#262626"
                        }}>
                          {cat.name}
                        </Text>
                        <Space size={4} wrap>
                            <Tag color={cat.industry_code === 'pharmacy' ? 'cyan' : 'green'} style={{ fontSize: '9px', borderRadius: '4px', margin: 0, border: 'none' }}>
                                {cat.industry_code?.toUpperCase()}
                            </Tag>
                            {(cat.default_moods || cat.default_sizes || cat.default_addons) && (
                                <Tag color="gold" style={{ fontSize: '9px', borderRadius: '4px', border: 'none' }}>CONFIGURED</Tag>
                            )}
                        </Space>
                      </div>
                    </div>
                    <div style={{ marginLeft: 8 }}>
                      <Switch
                        size="small"
                        checked={isActive}
                        onChange={(checked, e) => { e.stopPropagation(); handleToggle(cat.id, checked); }}
                        style={{ background: isActive ? industryColor : undefined }}
                      />
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <div style={{
        marginTop: 24,
        padding: "12px 16px",
        background: "#fafafa",
        borderRadius: "12px",
        border: "1px dashed #d9d9d9",
        fontSize: "12px",
        color: "#8c8c8c",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <CloseCircleOutlined style={{ color: "#bfbfbf" }} />
        <span>Only activated categories will be available for this enterprise to use when creating new products.</span>
      </div>
    </div>
  );
};

export default CategoryManageTab;
