import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Statistic,
  Card,
} from "antd";
import { MdAdd, MdDelete, MdEdit, MdStore, MdQrCode } from "react-icons/md";
import { UserOutlined, SearchOutlined, FilterOutlined, ShoppingOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import { getProfile } from "../../store/profile.store";
import { configStore } from "../../store/configStore";

function ShopPage() {
  const { config } = configStore();
  const [form] = Form.useForm();
  const [state, setState] = useState({
    list: [],
    visibleModal: false,
    loading: false,
    selectedShop: null,
  });
  const [filter, setFilter] = useState({
    txt_search: "",
    user_id: "",
  });

  useEffect(() => {
    getList();
  }, [filter.user_id]);

  const getList = async () => {
    setState((pre) => ({ ...pre, loading: true }));
    const userId = filter.user_id || getProfile()?.id;
    
    if (!userId) {
      message.error("User not authenticated");
      setState((pre) => ({ ...pre, loading: false }));
      return;
    }

    const params = {
      user_id: userId,
      is_list_all: 1
    };

    const res = await request("shops", "get", params);
    
    if (res && !res.error) {
      // Enhance shop data with product and order counts
      const enhancedList = await Promise.all(
        (res.list || []).map(async (shop) => {
          try {
            // Fetch products for this shop
            const productRes = await request(`product/shop/${shop.id}`, "get", { is_list_all: 1 });
            const productCount = productRes?.total || 0;

            // Fetch orders for this shop (if shop has user_id)
            let orderCount = 0;
            if (shop.user_id) {
              const orderRes = await request(`orders/user/${shop.user_id}`, "get", { 
                is_list_all: 1,
                shop_id: shop.id 
              });
              orderCount = orderRes?.summary?.total_order || 0;
            }

            return {
              ...shop,
              product_count: productCount,
              total_orders: orderCount
            };
          } catch (error) {
            console.error(`Error fetching data for shop ${shop.id}:`, error);
            return {
              ...shop,
              product_count: 0,
              total_orders: 0
            };
          }
        })
      );

      setState((pre) => ({
        ...pre,
        list: enhancedList,
        total: res.total || 0,
        loading: false,
      }));
    } else {
      message.error(res?.error || "Failed to fetch shops");
      setState((pre) => ({ ...pre, loading: false }));
    }
  };

  const onCloseModal = () => {
    setState((p) => ({
      ...p,
      visibleModal: false,
      selectedShop: null,
    }));
    form.resetFields();
  };

  const onFinish = async (values) => {
    const params = {
      name: values.name,
      location: values.location,
      table_count: values.table_count || 10,
      user_id: values.user_id,
    };

    const method = form.getFieldValue("id") ? "put" : "post";
    const endpoint = form.getFieldValue("id") 
      ? `shops/${form.getFieldValue("id")}` 
      : "shops";

    const res = await request(endpoint, method, params);
    
    if (res && !res.error) {
      message.success(res.message || "Shop saved successfully");
      onCloseModal();
      getList();
    } else {
      message.error(res?.error || "Failed to save shop");
    }
  };

  const onBtnNew = () => {
    setState((p) => ({
      ...p,
      visibleModal: true,
      selectedShop: null,
    }));
    form.resetFields();
    const currentUserId = filter.user_id || getProfile()?.id;
    form.setFieldsValue({
      table_count: 10,
      user_id: currentUserId,
    });
  };

  const onClickEdit = (item) => {
    form.setFieldsValue({
      id: item.id,
      name: item.name,
      location: item.location,
      table_count: item.table_count,
      user_id: item.user_id,
    });
    setState((pre) => ({ 
      ...pre, 
      visibleModal: true,
      selectedShop: item,
    }));
  };

  const onClickDelete = (item) => {
    Modal.confirm({
      title: "Delete Shop",
      content: `Are you sure you want to delete "${item.name}"? This will remove all associated products and orders.`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        const userId = filter.user_id || getProfile()?.id;
        const res = await request(`shops/${item.id}`, "delete", { user_id: userId });
        
        if (res && !res.error) {
          message.success(res.message || "Shop deleted successfully");
          getList();
        } else {
          message.error(res?.error || "Failed to delete shop");
        }
      },
    });
  };

  const onViewProducts = async (shop) => {
    setState((pre) => ({ ...pre, loading: true }));
    
    try {
      const res = await request(`product/shop/${shop.id}`, "get", { is_list_all: 1 });
      
      if (res && !res.error) {
        Modal.info({
          title: `Products in ${shop.name}`,
          width: 900,
          content: (
            <div>
              <Card size="small" style={{ marginBottom: 16 }}>
                <Statistic 
                  title="Total Products" 
                  value={res.total || 0} 
                  prefix={<ShoppingOutlined />}
                />
              </Card>
              <Table
                dataSource={res.list || []}
                rowKey="id"
                size="small"
                columns={[
                  { 
                    title: "Name", 
                    dataIndex: "name", 
                    key: "name",
                    width: 200
                  },
                  { 
                    title: "Category", 
                    dataIndex: "category_name", 
                    key: "category_name",
                    width: 150,
                    render: (val) => <Tag color="blue">{val}</Tag>
                  },
                  { 
                    title: "Price", 
                    dataIndex: "price", 
                    key: "price",
                    align: "right",
                    width: 100,
                    render: (price) => `$${Number(price || 0).toFixed(2)}`
                  },
                  { 
                    title: "Stock", 
                    dataIndex: "qty", 
                    key: "qty",
                    align: "center",
                    width: 80,
                    render: (qty) => (
                      <Tag color={qty > 0 ? "green" : "red"}>
                        {qty || 0}
                      </Tag>
                    )
                  },
                  {
                    title: "Status",
                    dataIndex: "status",
                    key: "status",
                    align: "center",
                    width: 100,
                    render: (status) => (
                      <Tag color={status === 1 ? "green" : "red"}>
                        {status === 1 ? "Active" : "Inactive"}
                      </Tag>
                    ),
                  },
                ]}
                pagination={{ pageSize: 10 }}
              />
            </div>
          ),
        });
      }
    } catch (error) {
      message.error("Failed to load products");
    } finally {
      setState((pre) => ({ ...pre, loading: false }));
    }
  };

  const onViewOrders = async (shop) => {
    setState((pre) => ({ ...pre, loading: true }));
    
    try {
      if (!shop.user_id) {
        message.warning("No user associated with this shop");
        return;
      }

      const res = await request(`orders/user/${shop.user_id}`, "get", { 
        is_list_all: 1,
        shop_id: shop.id 
      });
      
      if (res && res.list) {
        Modal.info({
          title: `Orders from ${shop.name}`,
          width: 900,
          content: (
            <div>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Card size="small">
                    <Statistic 
                      title="Total Orders" 
                      value={res.summary?.total_order || 0} 
                      prefix={<ShoppingCartOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Statistic 
                      title="Total Revenue" 
                      value={res.summary?.total_amount || 0}
                      precision={2}
                      prefix="$"
                    />
                  </Card>
                </Col>
              </Row>
              <Table
                dataSource={res.list || []}
                rowKey="id"
                size="small"
                columns={[
                  { 
                    title: "Order No", 
                    dataIndex: "order_no", 
                    key: "order_no",
                    width: 150,
                    render: (val, record) => (
                      <Tag color="blue">{val || `#${record.id}`}</Tag>
                    )
                  },
                  { 
                    title: "Table", 
                    dataIndex: "table_number", 
                    key: "table_number",
                    width: 80,
                    align: "center"
                  },
                  { 
                    title: "Amount", 
                    dataIndex: "total_amount", 
                    key: "total_amount",
                    align: "right",
                    width: 120,
                    render: (val) => `$${Number(val || 0).toFixed(2)}`
                  },
                  {
                    title: "Status",
                    dataIndex: "status",
                    key: "status",
                    width: 100,
                    render: (status) => {
                      const colors = {
                        pending: 'orange',
                        completed: 'green',
                        cancelled: 'red',
                      };
                      return (
                        <Tag color={colors[status?.toLowerCase()] || 'default'}>
                          {status || 'Pending'}
                        </Tag>
                      );
                    },
                  },
                  {
                    title: "Date",
                    dataIndex: "created_at",
                    key: "created_at",
                    width: 150,
                    render: (date) => new Date(date).toLocaleString()
                  }
                ]}
                pagination={{ pageSize: 10 }}
              />
            </div>
          ),
        });
      }
    } catch (error) {
      message.error("Failed to load orders");
    } finally {
      setState((pre) => ({ ...pre, loading: false }));
    }
  };

  const downloadQRCode = (shopName, tableNumber, qrUrl) => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${shopName}-Table-${tableNumber}-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateQRCode = (shop) => {
    const tableCount = shop.table_count || 10;
    const qrCodes = [];
    
    for (let i = 1; i <= tableCount; i++) {
      const qrData = `${window.location.origin}/scan?shop_id=${shop.id}&table_number=${i}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
      qrCodes.push({
        tableNumber: i,
        url: qrUrl,
        data: qrData
      });
    }

    Modal.info({
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MdQrCode size={24} />
          <span>QR Codes for {shop.name}</span>
        </div>
      ),
      width: 1000,
      icon: null,
      content: (
        <div>
          <Card size="small" style={{ marginBottom: 16, background: '#f0f9ff' }}>
            <Space direction="vertical" size={4}>
              <strong>Shop Information:</strong>
              <div>Name: {shop.name}</div>
              <div>Location: {shop.location}</div>
              <div>Total Tables: {tableCount}</div>
            </Space>
          </Card>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 16,
            maxHeight: '60vh',
            overflowY: 'auto',
            padding: 8
          }}>
            {qrCodes.map((qr) => (
              <Card
                key={qr.tableNumber}
                size="small"
                style={{
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: 12
                }}
                cover={
                  <div style={{ 
                    padding: 16, 
                    background: '#fff',
                    borderRadius: '12px 12px 0 0'
                  }}>
                    <img
                      src={qr.url}
                      alt={`Table ${qr.tableNumber}`}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxWidth: 200,
                        margin: '0 auto',
                        display: 'block'
                      }}
                    />
                  </div>
                }
              >
                <div style={{ padding: '8px 0' }}>
                  <Tag color="blue" style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
                    Table {qr.tableNumber}
                  </Tag>
                  <div style={{ 
                    fontSize: 11, 
                    color: '#666', 
                    marginBottom: 12,
                    wordBreak: 'break-all' 
                  }}>
                    {qr.data}
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    icon={<MdQrCode />}
                    onClick={() => downloadQRCode(shop.name, qr.tableNumber, qr.url)}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    Download QR
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card size="small" style={{ marginTop: 16, background: '#fff7ed' }}>
            <Space direction="vertical" size={4}>
              <strong>Instructions:</strong>
              <div>1. Click "Download QR" to save each QR code</div>
              <div>2. Print the QR codes</div>
              <div>3. Place them on respective tables</div>
              <div>4. Customers scan to order from their table</div>
            </Space>
          </Card>
        </div>
      ),
    });
  };

  const handleSearch = () => {
    getList();
  };

  const filteredList = state.list.filter((item) =>
    item.name?.toLowerCase().includes(filter.txt_search.toLowerCase()) ||
    item.location?.toLowerCase().includes(filter.txt_search.toLowerCase())
  );

  return (
    <MainPage loading={state.loading}>
      <div className="pageHeader">
        <Space>
          <MdStore size={24} />
          <div style={{ fontSize: 18, fontWeight: 600 }}>Shop Management</div>
        </Space>
        <Button type="primary" icon={<MdAdd />} onClick={onBtnNew}>
          New Shop
        </Button>
      </div>

      {/* Filter Section */}
      <div style={{
        background: '#f8fafc',
        padding: 24,
        borderRadius: 16,
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              size="large"
              allowClear
              placeholder="Search shops by name or location..."
              value={filter.txt_search}
              onChange={(e) => setFilter(prev => ({ ...prev, txt_search: e.target.value }))}
              onSearch={handleSearch}
              style={{ borderRadius: 8 }}
              prefix={<SearchOutlined style={{ color: '#667eea' }} />}
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Select
              size="large"
              allowClear
              style={{ width: '100%', borderRadius: 8 }}
              placeholder={
                <span>
                  <UserOutlined style={{ marginRight: 8 }} />
                  Select Shop Owner
                </span>
              }
              value={filter.user_id}
              options={config?.user || []}
              onChange={(val) => setFilter(prev => ({ ...prev, user_id: val }))}
              suffixIcon={<UserOutlined style={{ color: '#667eea' }} />}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Button
              type="primary"
              size="large"
              icon={<FilterOutlined />}
              onClick={handleSearch}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 8,
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
            >
              Apply Filters
            </Button>
          </Col>
        </Row>
      </div>

      <Modal
        open={state.visibleModal}
        title={
          <Space>
            <MdStore />
            {form.getFieldValue("id") ? "Edit Shop" : "Create New Shop"}
          </Space>
        }
        footer={null}
        onCancel={onCloseModal}
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={onFinish}
          form={form}
          style={{ marginTop: 24 }}
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="user_id"
            label="Shop Owner"
            rules={[{ required: true, message: "Please select shop owner" }]}
          >
            <Select
              size="large"
              placeholder="Select shop owner"
              options={config?.user || []}
              suffixIcon={<UserOutlined />}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Shop Name"
            rules={[
              { required: true, message: "Please enter shop name" },
              { min: 3, message: "Shop name must be at least 3 characters" },
            ]}
          >
            <Input placeholder="Enter shop name" size="large" />
          </Form.Item>

          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: "Please enter location" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter shop location/address"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="table_count"
            label="Number of Tables"
            rules={[
              { required: true, message: "Please enter number of tables" },
            ]}
          >
            <InputNumber
              min={1}
              max={100}
              placeholder="Number of tables"
              style={{ width: "100%" }}
              size="large"
            />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: 24 }}>
            <Space>
              <Button onClick={onCloseModal} size="large">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" size="large">
                {form.getFieldValue("id") ? "Update" : "Create"}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Table
        dataSource={filteredList}
        loading={state.loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} shops`,
        }}
        columns={[
          {
            key: "name",
            title: "Shop Name",
            dataIndex: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (name, record) => (
              <Space>
                <MdStore size={18} />
                <strong>{name}</strong>
              </Space>
            ),
          },
          {
            key: "location",
            title: "Location",
            dataIndex: "location",
            ellipsis: true,
          },
          {
            key: "table_count",
            title: "Tables",
            dataIndex: "table_count",
            align: "center",
            render: (count) => (
              <Tag color="blue">{count} Tables</Tag>
            ),
          },
          {
            key: "owner_name",
            title: "Owner",
            dataIndex: "owner_name",
            render: (name) => (
              <Space>
                <UserOutlined style={{ color: '#667eea' }} />
                {name || 'N/A'}
              </Space>
            ),
          },
          {
            key: "product_count",
            title: "Products",
            dataIndex: "product_count",
            align: "center",
            render: (count, record) => (
              <Button
                type="link"
                onClick={() => onViewProducts(record)}
                style={{ padding: 0 }}
              >
                <Tag color="green" style={{ cursor: 'pointer' }}>
                  {count || 0} <ShoppingOutlined />
                </Tag>
              </Button>
            ),
          },
          {
            key: "total_orders",
            title: "Orders",
            dataIndex: "total_orders",
            align: "center",
            render: (count, record) => (
              <Button
                type="link"
                onClick={() => onViewOrders(record)}
                style={{ padding: 0 }}
              >
                <Tag color="orange" style={{ cursor: 'pointer' }}>
                  {count || 0} <ShoppingCartOutlined />
                </Tag>
              </Button>
            ),
          },
          {
            key: "created_at",
            title: "Created",
            dataIndex: "created_at",
            render: (date) => new Date(date).toLocaleDateString(),
          },
          {
            key: "action",
            title: "Action",
            align: "center",
            fixed: "right",
            width: 200,
            render: (_, record) => (
              <Space>
                <Button
                  type="link"
                  icon={<MdQrCode />}
                  onClick={() => generateQRCode(record)}
                  title="Generate QR Code"
                />
                <Button
                  type="primary"
                  icon={<MdEdit />}
                  onClick={() => onClickEdit(record)}
                  title="Edit"
                />
                <Button
                  type="primary"
                  danger
                  icon={<MdDelete />}
                  onClick={() => onClickDelete(record)}
                  title="Delete"
                />
              </Space>
            ),
          },
        ]}
      />
    </MainPage>
  );
}

export default ShopPage;