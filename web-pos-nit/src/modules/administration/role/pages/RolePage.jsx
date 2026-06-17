import { useEffect, useState } from "react";
import { request } from "@/shared/utils/helper";
import { getProfile } from "@/app/store/profile.store";
import { Button, Form, Input, message, Modal, Space, Table, Tag, Select } from "antd";

function RolePage() {
  const profile = getProfile();
  const isSuperAdmin = profile?.business_id === 1;

  const [state, setState] = useState({
    list: [],
    businesses: [],
    loading: false,
    visible: false,
    filterBusinessId: null,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    getList();
    if (isSuperAdmin) {
      getBusinesses();
    }
  }, [state.filterBusinessId]);

  const getList = async () => {
    setState(pre => ({ ...pre, loading: true }));
    const url = state.filterBusinessId ? `role?target_business_id=${state.filterBusinessId}` : "role";
    const res = await request(url, "get");
    if (res && !res.error) {
      setState((pre) => ({
        ...pre,
        list: res.list,
        loading: false,
      }));
    } else {
      setState(pre => ({ ...pre, loading: false }));
    }
  };

  const getBusinesses = async () => {
    const res = await request("business", "get");
    if (res && !res.error) {
      setState(pre => ({ ...pre, businesses: res.list }));
    }
  };

  const clickBtnEdit = (item) => {
    form.setFieldsValue({
      ...item,
    });
    handleOpenModal();
  };

  const clickBtnDelete = (item) => {
    Modal.confirm({
      title: "Delete",
      content: "Are you sure to remove?",
      onOk: async () => {
        const res = await request("role", "delete", {
          id: item.id,
        });
        if (res && !res.error) {
          message.success(res.message);
          getList();
        }
      },
    });
  };

  const onFinish = async (item) => {
    var data = {
      id: form.getFieldValue("id"),
      code: item.code,
      name: item.name,
      business_id: item.business_id, // For Super Admin to specify which biz
    };
    var method = "post";
    if (form.getFieldValue("id")) {
      method = "put";
    }
    const res = await request("role", method, data);
    if (res && !res.error) {
      message.success(res.message);
      getList();
      handleCloseModal();
    } else {
      message.warning(res.error);
    }
  };

  const handleOpenModal = () => {
    setState((pre) => ({
      ...pre,
      visible: true,
    }));
  };

  const handleCloseModal = () => {
    setState((pre) => ({
      ...pre,
      visible: false,
    }));
    form.resetFields();
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingBottom: 20,
          background: "white",
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: '16px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Roles</div>
          
          {isSuperAdmin && (
            <Select
              placeholder="Filter by Business"
              style={{ width: 250 }}
              allowClear
              onChange={(val) => setState(pre => ({ ...pre, filterBusinessId: val }))}
              options={state.businesses.map(b => ({ label: b.name, value: b.id }))}
            />
          )}

          <Input.Search style={{ width: 250 }} placeholder="Search" />
        </div>
        <Button type="primary" size="large" onClick={handleOpenModal}>
          + New Role
        </Button>
      </div>

      <Modal
        title={
          form.getFieldValue("id") ? (
            <div>
              <span className="khmer-text">កែប្រែ</span> / <span className="english-text">Update</span>
            </div>
          ) : (
            <div>
              <span className="khmer-text">តួនាទីថ្មី</span> / <span className="english-text">New Role</span>
            </div>
          )
        }
        open={state.visible}
        onCancel={handleCloseModal}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {isSuperAdmin && !form.getFieldValue("id") && (
            <Form.Item
              name="business_id"
              label={
                <div>
                  <span className="khmer-text">ជ្រើសរើសអាជីវកម្ម</span> / <span className="english-text">Select Business</span>
                </div>
              }
              rules={[{ required: true, message: "Please select business" }]}
            >
              <Select 
                 placeholder="Select a business to assign this role to"
                 options={state.businesses.map(b => ({ label: b.name, value: b.id }))}
              />
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label={
              <div>
                <span className="khmer-text">ឈ្មោះតួនាទី</span> / <span className="english-text">Role Name</span>
              </div>
            }
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. Manager, Cashier..." />
          </Form.Item>
          <Form.Item
            name="code"
            label={
              <div>
                <span className="khmer-text">កូដតួនាទី</span> / <span className="english-text">Role Code</span>
              </div>
            }
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. manager, sale..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>
                <span className="khmer-text">បោះបង់</span> 
              </Button>
              <Button type="primary" htmlType="submit">
                {form.getFieldValue("id") ? (
                   <span className="khmer-text">កែប្រែ</span> 
                ) : (
                   <span className="khmer-text">រក្សាទុក</span> 
                )}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Table
        rowClassName={() => "pos-row"}
        loading={state.loading}
        dataSource={state.list}
        pagination={{ pageSize: 15 }}
        columns={[
          {
            key: "no",
            title: <span className="khmer-text">ល.រ</span>,
            width: 60,
            render: (value, data, index) => index + 1,
          },
          {
            key: "name",
            title: <span className="khmer-text">ឈ្មោះតួនាទី</span> ,
            dataIndex: "name",
            render: (text) => <strong>{text}</strong>
          },
          {
            key: "business_name",
            title: <span className="khmer-text">អាជីវកម្ម / សាខា</span> ,
            dataIndex: "business_name",
            render: (text) => <Tag color="blue" style={{ borderRadius: '4px' }}>{text || "System Admin"}</Tag>
          },
          {
            key: "code",
            title: <span className="khmer-text">កូដ</span>,
            dataIndex: "code",
            render: (text) => <Tag color="default">{text?.toUpperCase()}</Tag>
          },
          {
            key: "is_active",
            title: <span className="khmer-text">ស្ថានភាព</span> ,
            dataIndex: "is_active",
            align: 'center',
            render: (value) =>
              value ? (
                <Tag color="#87d068" className="khmer-text">សកម្ម</Tag>
              ) : (
                <Tag color="#f50" className="khmer-text">អសកម្ម</Tag>
              ),
          },
          {
            key: "action",
            title: <span className="khmer-text">សកម្មភាព</span>,
            align: "center",
            width: 200,
            render: (value, data) => (
              <Space>
                <Button onClick={() => clickBtnEdit(data)} type="link">
                   Edit
                </Button>
                <Button onClick={() => clickBtnDelete(data)} danger type="link">
                   Delete
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}

export default RolePage;