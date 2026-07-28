import React, { useEffect, useState } from "react";
import * as Lucide from "lucide-react";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Card,
  Typography,
  Divider,
  Switch,
  Alert
} from "antd";
import { MdAdd, MdDelete, MdEdit, MdCategory } from "react-icons/md";
import { SearchOutlined } from "@ant-design/icons";
import { request, getIconForCategory, getColorForCategory } from "@/shared/utils/helper";
import MainPage from "@/app/layouts/MainPage";

import { useLanguage, translations } from "@/app/store/language.store";
import { HelpCircle } from "lucide-react";
import { useProfileStore } from "@/app/store/profileStore";

const { Title, Text } = Typography;

function CategoryPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const [form] = Form.useForm();
  const [state, setState] = useState({
    list: [],
    visibleModal: false,
    loading: false,
  });
  const [searchText, setSearchText] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  const profile = useProfileStore(s => s.profile);
  const businessId = profile?.business_id;
  const isSuperAdmin = profile?.is_super_admin === 1 || businessId === 1;
  const userId = profile?.id || profile?.user_id;

  useEffect(() => {
    if (userId) getList();
  }, [userId]);

  const getList = async () => {
    setState((pre) => ({ ...pre, loading: true }));
    const res = await request("category?all=1", "get");
    if (res && !res.error) {
      setState((pre) => ({
        ...pre,
        list: res.list || [],
        loading: false,
      }));
    } else {
      message.error(t.no_data);
      setState((pre) => ({ ...pre, loading: false }));
    }
  };

  const onCloseModal = () => {
    setState((p) => ({ ...p, visibleModal: false }));
    form.resetFields();
  };

  const onFinish = async (values) => {
    const res = await request("category", values.id ? "put" : "post", values);
    if (res && !res.error && res.data) {
      message.success(t.success);
      onCloseModal();
      if (values.id) {
        setState((prev) => ({
          ...prev,
          list: prev.list.map((c) => (c.id === values.id ? res.data : c)),
        }));
      } else {
        setState((prev) => ({
          ...prev,
          list: [res.data, ...prev.list],
        }));
      }
    } else {
      message.error(t.failed);
    }
  };

  const onClickEdit = (item) => {
    form.setFieldsValue(item);
    setState((pre) => ({ ...pre, visibleModal: true }));
  };

  const onClickDelete = (item) => {
    Modal.confirm({
      title: t.delete + " " + t.category,
      content: `${t.remove_data} "${item.name}"?`,
      okText: t.delete,
      okType: "danger",
      onOk: async () => {
        const res = await request("category", "delete", { id: item.id });
        if (res && !res.error) {
          message.success(t.success);
          setState((prev) => ({
            ...prev,
            list: prev.list.filter((c) => c.id !== item.id),
          }));
        } else {
          message.error(res?.message || t.failed);
        }
      },
    });
  };

  const filteredList = state.list.filter((item) =>
    item.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <MainPage loading={state.loading}>
      <Card style={{ borderRadius: 20, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Space size="middle">
            <div style={{
              width: 45, height: 45, borderRadius: 12,
              background: "#2d6a42", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#fff"
            }}>
              <MdCategory size={24} />
            </div>
            <Title level={4} style={{ margin: 0 }}>{t.categories}</Title>
            <Button
              type="text"
              icon={<HelpCircle size={15} style={{ color: "#2d6a42", marginRight: 4 }} />}
              onClick={() => setShowGuide(!showGuide)}
              style={{
                background: showGuide ? "rgba(45, 106, 66, 0.15)" : "rgba(45, 106, 66, 0.08)",
                color: "#2d6a42",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                height: 32,
                marginLeft: 8
              }}
            >
              {showGuide ? "លាក់ការណែនាំ" : "របៀបប្រើប្រាស់"}
            </Button>
          </Space>
          {isSuperAdmin && (
            <Button
              type="primary"
              icon={<MdAdd />}
              onClick={() => setState({ ...state, visibleModal: true })}
              size="large"
              style={{ borderRadius: 10, background: "#2d6a42", borderColor: "#2d6a42" }}
            >
              {t.add_new}
            </Button>
          )}
        </div>

        {showGuide && (
          <Alert
            message={<strong>💡 របៀបចាប់ផ្តើមប្រើប្រាស់ផ្នែកប្រភេទផលិតផល (Category Quick Guide)</strong>}
            description={
              <div style={{ fontSize: 13, marginTop: 4, color: '#333' }}>
                <p style={{ margin: '3px 0' }}>1. <strong>បើកដំណើរការ៖</strong> ចុចបើក/បិទលើប្រភេទផលិតផលណាមួយដែលអាជីវកម្មបងត្រូវលក់ ដើម្បីឱ្យវាបង្ហាញនៅក្នុងទំព័រលក់ (POS)។</p>
                <p style={{ margin: '3px 0' }}>2. <strong>ប្រភេទផលិតផលសកល៖</strong> ប្រភេទផលិតផលលំនាំដើមរបស់ប្រព័ន្ធ (Platform Categories) មិនអាចកែប្រែ ឬលុបបានទេ គឺសម្រាប់តែបើក/បិទប៉ុណ្ណោះ។</p>
                <p style={{ margin: '3px 0' }}>3. <strong>បន្ទាប់មក៖</strong> ក្រោយពីបើកដំណើរការប្រភេទផលិតផលហើយ បងអាចចូលទៅកាន់ទំព័រ <strong>Product (ផលិតផល)</strong> ដើម្បីចុះឈ្មោះទំនិញលក់បាន។</p>
              </div>
            }
            type="info"
            closable
            onClose={() => {
              setShowGuide(false);
            }}
            style={{ borderRadius: 16, marginBottom: 20, border: '1px solid #bae7ff', background: '#e6f7ff' }}
          />
        )}

        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder={t.search}
          size="large"
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 24, borderRadius: 12 }}
        />

        <Table
          dataSource={filteredList}
          rowKey="id"
          columns={[
            {
              title: t.category,
              dataIndex: "name",
              render: (name) => {
                const iconName = getIconForCategory(name);
                const IconComponent = Lucide[iconName] || Lucide.Coffee;
                const iconColor = getColorForCategory(name) || "#2d6a42";
                return (
                  <Space size="middle">
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${iconColor}12`, color: iconColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <IconComponent size={18} />
                    </div>
                    <span style={{ fontWeight: 600 }}>{name}</span>
                  </Space>
                );
              }
            },
            {
              title: t.status,
              dataIndex: "is_active",
              render: (is_active, record) => {
                const isPlatform = record.business_id === 1;
                return (
                  <Space size="middle">
                    <Switch
                      checked={is_active === 1}
                      disabled={!isPlatform}
                      onChange={async (checked) => {
                        const res = await request("category/business-categories/toggle", "put", {
                          category_id: record.id,
                          is_active: checked ? 1 : 0
                        });
                        if (res && !res.error) {
                          message.success(t.success || "Status Updated");
                          getList();
                        } else {
                          message.error(res?.message || t.failed);
                        }
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: is_active === 1 ? '#2d6a42' : '#8c8c8c' }}>
                      {is_active === 1 ? (t.active || "Active") : (t.inactive || "Inactive")}
                    </span>
                  </Space>
                );
              }
            },
            {
              title: t.action,
              align: "center",
              render: (_, record) => {
                const isPlatform = record.business_id === 1;
                if (isPlatform) {
                  return <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>Platform Category</Text>;
                }
                return (
                  <Space>
                    <Button type="text" icon={<MdEdit color="#2d6a42" size={18} />} onClick={() => onClickEdit(record)} />
                    <Button type="text" danger icon={<MdDelete size={18} />} onClick={() => onClickDelete(record)} />
                  </Space>
                );
              }
            }
          ]}
        />
      </Card>

      <Modal
        open={state.visibleModal}
        title={form.getFieldValue("id") ? t.edit : t.add_new}
        onCancel={onCloseModal}
        footer={null}
        centered
        width={400}
      >
        <Form layout="vertical" form={form} onFinish={onFinish} style={{ marginTop: 20 }}>
          <Form.Item name="id" hidden><Input /></Form.Item>
          <Form.Item
            name="name"
            label={t.name}
            rules={[{ required: true, message: t.name + " is required" }]}
          >
            <Input placeholder="e.g. Hot Drinks" size="large" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            style={{ marginTop: 10, background: "#2d6a42", height: 50, borderRadius: 10 }}
          >
            {t.save}
          </Button>
        </Form>
      </Modal>
    </MainPage>
  );
}

export default CategoryPage;