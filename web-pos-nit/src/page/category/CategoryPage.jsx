import React, { useEffect, useState } from "react";
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
  Divider
} from "antd";
import { MdAdd, MdDelete, MdEdit, MdCategory } from "react-icons/md";
import { SearchOutlined } from "@ant-design/icons";
import { request, getIconForCategory, getColorForCategory } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";

const { Title } = Typography;

function CategoryPage() {
  const [form] = Form.useForm();
  const [state, setState] = useState({
    list: [],
    visibleModal: false,
    loading: false,
  });
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    getList();
  }, []);

  const getList = async () => {
    setState((pre) => ({ ...pre, loading: true }));
    const res = await request("category", "get");
    if (res && !res.error) {
      setState((pre) => ({
        ...pre,
        list: res.list || [],
        loading: false,
      }));
    } else {
      message.error("Failed to fetch categories");
      setState((pre) => ({ ...pre, loading: false }));
    }
  };

  const onCloseModal = () => {
    setState((p) => ({ ...p, visibleModal: false }));
    form.resetFields();
  };

  const onFinish = async (values) => {
    const res = await request("category", values.id ? "put" : "post", values);
    if (res && !res.error) {
      message.success("Category saved!");
      onCloseModal();
      getList();
    } else {
      message.error("Failed to save category");
    }
  };

  const onClickEdit = (item) => {
    form.setFieldsValue(item);
    setState((pre) => ({ ...pre, visibleModal: true }));
  };

  const onClickDelete = (item) => {
    Modal.confirm({
      title: "Delete Category",
      content: `Remove category "${item.name}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await request("category", "delete", { id: item.id });
        if (res && !res.error) {
          message.success("Removed successfuly");
          getList();
        } else {
          message.error(res?.message || "Error deleting category");
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
            <Title level={4} style={{ margin: 0 }}>Category Setup</Title>
          </Space>
          <Button
            type="primary"
            icon={<MdAdd />}
            onClick={() => setState({ ...state, visibleModal: true })}
            size="large"
            style={{ borderRadius: 10, background: "#2d6a42", borderColor: "#2d6a42" }}
          >
            New Category
          </Button>
        </div>

        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="Search categories..."
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
              title: "Category",
              dataIndex: "name",
              render: (name) => (
                <Space>
                  <span style={{ fontSize: 20 }}>{getIconForCategory(name)}</span>
                  <span style={{ fontWeight: 600 }}>{name}</span>
                </Space>
              )
            },
            {
              title: "Badge",
              dataIndex: "name",
              render: (name) => <Tag color={getColorForCategory(name)}>{name.toUpperCase()}</Tag>
            },
            {
              title: "Action",
              align: "center",
              render: (_, record) => (
                <Space>
                  <Button type="text" icon={<MdEdit color="#2d6a42" size={18} />} onClick={() => onClickEdit(record)} />
                  <Button type="text" danger icon={<MdDelete size={18} />} onClick={() => onClickDelete(record)} />
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Modal
        open={state.visibleModal}
        title={form.getFieldValue("id") ? "Edit Category" : "New Category"}
        onCancel={onCloseModal}
        footer={null}
        centered
        width={400}
      >
        <Form layout="vertical" form={form} onFinish={onFinish} style={{ marginTop: 20 }}>
          <Form.Item name="id" hidden><Input /></Form.Item>
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: "Enter name" }]}
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
            Save Category
          </Button>
        </Form>
      </Modal>
    </MainPage>
  );
}

export default CategoryPage;