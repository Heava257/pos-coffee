import { useEffect, useState } from "react";
import { request } from "@/shared/utils/helper";
import { getProfile } from "@/app/store/profile.store";
import { Button, Form, Input, message, Modal, Space, Table, Tag, Select, Typography, Drawer, Card } from "antd";

const { Text } = Typography;

function RolePage() {
  const profile = getProfile();
  const isSuperAdmin = profile?.business_id === 1;

  const [state, setState] = useState({
    list: [],
    businesses: [],
    loading: false,
    filterBusinessId: null,
  });
  const [searchText, setSearchText] = useState("");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [roleFormVisible, setRoleFormVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
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
      return res.list;
    } else {
      setState(pre => ({ ...pre, loading: false }));
      return [];
    }
  };

  const getBusinesses = async () => {
    const res = await request("business", "get");
    if (res && !res.error) {
      setState(pre => ({ ...pre, businesses: res.list }));
    }
  };

  const clickBtnDelete = (item) => {
    Modal.confirm({
      title: "Delete Role",
      content: `Are you sure you want to delete the role "${item.name}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await request("role", "delete", {
          id: item.id,
        });
        if (res && !res.error) {
          message.success(res.message);
          setState(prev => {
            const newList = prev.list.filter(r => r.id !== item.id);
            if (selectedGroup) {
              const bizId = selectedGroup.business_id;
              const bizName = selectedGroup.business_name;
              const bizRoles = newList.filter(r => (r.business_id || 1) === bizId);
              setSelectedGroup({
                business_id: bizId,
                business_name: bizName,
                roles: bizRoles
              });
            }
            return {
              ...prev,
              list: newList
            };
          });
        }
      },
    });
  };

  const onFinish = async (values) => {
    const data = {
      id: editingRole?.id || null,
      code: values.code,
      name: values.name,
      business_id: selectedGroup?.business_id, 
    };
    const method = editingRole?.id ? "put" : "post";
    const res = await request("role", method, data);
    if (res && !res.error && res.data) {
      message.success(res.message);
      setState(prev => {
        const isUpdate = !!editingRole?.id;
        const newList = isUpdate
          ? prev.list.map(r => r.id === editingRole.id ? res.data : r)
          : [res.data, ...prev.list];
          
        if (selectedGroup) {
          const bizId = selectedGroup.business_id;
          const bizName = selectedGroup.business_name;
          const bizRoles = newList.filter(r => (r.business_id || 1) === bizId);
          setSelectedGroup({
            business_id: bizId,
            business_name: bizName,
            roles: bizRoles
          });
        }
        return {
          ...prev,
          list: newList
        };
      });
      setRoleFormVisible(false);
      setEditingRole(null);
      form.resetFields();
    } else {
      message.warning(res?.error || "Operation failed");
    }
  };

  // Group roles by business
  const businessGroups = [];
  
  if (isSuperAdmin) {
    // Start with all businesses
    state.businesses.forEach(b => {
      businessGroups.push({
        business_id: b.id,
        business_name: b.name,
        roles: state.list.filter(r => (r.business_id || 1) === b.id)
      });
    });
    // Add System Default if not already in businesses
    if (!businessGroups.some(g => g.business_id === 1)) {
      businessGroups.unshift({
        business_id: 1,
        business_name: "System Default",
        roles: state.list.filter(r => (r.business_id || 1) === 1)
      });
    }
  } else {
    // For regular tenant, only show their own business roles group
    const myBizId = profile?.business_id || 1;
    const myBizName = profile?.business_name || "My Business";
    businessGroups.push({
      business_id: myBizId,
      business_name: myBizName,
      roles: state.list.filter(r => (r.business_id || 1) === myBizId)
    });
  }

  // Filter groups based on search text (search business name or role name/code)
  const filteredGroups = businessGroups.filter(group => {
    const search = searchText.toLowerCase();
    return (
      group.business_name.toLowerCase().includes(search) ||
      group.roles.some(role => 
        role.name?.toLowerCase().includes(search) || 
        role.code?.toLowerCase().includes(search)
      )
    );
  });

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

          <Input.Search 
            style={{ width: 250 }} 
            placeholder="Search roles or businesses" 
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
        </div>
      </div>

      <Table
        rowClassName={() => "pos-row"}
        loading={state.loading}
        dataSource={filteredGroups}
        rowKey="business_id"
        pagination={{ pageSize: 15 }}
        columns={[
          {
            key: "no",
            title: <span className="khmer-text">ល.រ</span>,
            width: 60,
            render: (value, data, index) => index + 1,
          },
          {
            key: "business_name",
            title: <span className="khmer-text">អាជីវកម្ម / សាខា</span>,
            render: (value, record) => {
              if (record.business_id === 1) {
                return <Tag color="gold" style={{ borderRadius: '6px', fontWeight: 'bold' }}>⭐ System Default</Tag>;
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Text strong style={{ color: '#1e4a2d' }}>{record.business_name || "Client Business"}</Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}>ID: #{record.business_id}</Text>
                </div>
              );
            }
          },
          {
            key: "roles",
            title: <span className="khmer-text">តួនាទី (Roles)</span>,
            render: (value, record) => {
              if (record.roles.length === 0) {
                return <Text type="secondary" italic>No roles defined yet</Text>;
              }
              return (
                <Space wrap>
                  {record.roles.map(role => (
                    <Tag 
                      key={role.id} 
                      color={record.business_id === 1 ? "gold" : "blue"} 
                      style={{ borderRadius: '4px', fontWeight: 500 }}
                    >
                      {role.name} ({role.code})
                    </Tag>
                  ))}
                </Space>
              );
            }
          },
          {
            key: "action",
            title: <span className="khmer-text">សកម្មភាព</span>,
            align: "center",
            width: 150,
            render: (value, record) => (
              <Button 
                onClick={() => {
                  setSelectedGroup(record);
                  setDrawerVisible(true);
                }} 
                type="primary" 
                ghost
                style={{ borderRadius: '6px' }}
              >
                Manage Roles
              </Button>
            ),
          },
        ]}
      />

      <Drawer
        title={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '16px', fontWeight: 600 }}>
              Manage Roles
            </span>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Business: {selectedGroup?.business_name} (ID: #{selectedGroup?.business_id})
            </Text>
          </div>
        }
        placement="right"
        width={550}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedGroup(null);
          setRoleFormVisible(false);
          setEditingRole(null);
          form.resetFields();
        }}
        open={drawerVisible}
        destroyOnClose
      >
        <div style={{ marginBottom: 20 }}>
          {!roleFormVisible ? (
            <Button 
              type="primary" 
              onClick={() => {
                setRoleFormVisible(true);
                setEditingRole(null);
                form.resetFields();
              }}
              style={{ background: '#1e4a2d', borderColor: '#1e4a2d', borderRadius: '6px' }}
            >
              + Create New Role
            </Button>
          ) : (
            <Card 
              title={
                editingRole ? (
                  <div><span className="khmer-text">កែប្រែតួនាទី</span> / Edit Role</div>
                ) : (
                  <div><span className="khmer-text">បង្កើតតួនាទីថ្មី</span> / Create New Role</div>
                )
              }
              size="small" 
              style={{ marginBottom: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item 
                  name="name" 
                  label={<div><span className="khmer-text">ឈ្មោះតួនាទី</span> / Role Name</div>}
                  rules={[{ required: true, message: 'Please input role name' }]}
                >
                  <Input placeholder="e.g. Cashier" style={{ borderRadius: '6px' }} />
                </Form.Item>
                <Form.Item 
                  name="code" 
                  label={<div><span className="khmer-text">កូដតួនាទី</span> / Role Code</div>}
                  rules={[{ required: true, message: 'Please input role code' }]}
                >
                  <Input placeholder="e.g. cashier" style={{ borderRadius: '6px' }} />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                  <Space>
                    <Button 
                      onClick={() => { 
                        setRoleFormVisible(false); 
                        setEditingRole(null); 
                        form.resetFields(); 
                      }}
                      style={{ borderRadius: '6px' }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      style={{ background: '#1e4a2d', borderColor: '#1e4a2d', borderRadius: '6px' }}
                    >
                      {editingRole ? "Save Changes" : "Create Role"}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          )}
        </div>

        <Table
          dataSource={selectedGroup?.roles || []}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: "Role Name",
              dataIndex: "name",
              render: (text) => <strong>{text}</strong>
            },
            {
              title: "Code",
              dataIndex: "code",
              render: (text) => <Tag color="cyan">{text?.toUpperCase()}</Tag>
            },
            {
              title: "Action",
              align: "center",
              width: 150,
              render: (record) => (
                <Space>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => {
                      setEditingRole(record);
                      form.setFieldsValue(record);
                      setRoleFormVisible(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button 
                    type="link" 
                    size="small" 
                    danger 
                    onClick={() => clickBtnDelete(record)}
                  >
                    Delete
                  </Button>
                </Space>
              )
            }
          ]}
        />
      </Drawer>
    </div>
  );
}

export default RolePage;