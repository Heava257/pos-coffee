// pages/OrderPage.jsx
import React, { useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Row,
  Col,
  Card,
  Statistic,
  Tabs,
  Badge,
  Tooltip,
  Typography,
  Avatar,
  Divider,
  Empty,
  Image,
  notification,
} from "antd";
import {
  ShoppingCartOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  MoreOutlined,
  ExportOutlined,
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { formatDateClient, formatDateServer, isPermission, request } from "../../util/helper";
import { configStore } from "../../store/configStore";
import { getProfile } from "../../store/profile.store";
import { Config } from "../../util/config";

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

function OrderPage() {
  const { config } = configStore();
  const [formRef] = Form.useForm();
  const [list, setList] = useState([]);
  const [orderDetail, setOrderDetail] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [summary, setSummary] = useState({ total_order: 0, total_amount: 0 });
  const [loading, setLoading] = useState(false);

  const [state, setState] = useState({
    visibleModal: false,
    txtSearch: "",
    activeTab: "all",
  });

  const [filter, setFilter] = useState({
    from_date: dayjs().subtract(7, "day"),
    to_date: dayjs(),
    user_id: "",
  });

  // 🧠 Fetch Orders - Fixed to match backend response
  const getList = async () => {
    setLoading(true);
    try {
      const user_id = filter.user_id || getProfile()?.id;
      const params = {
        from_date: formatDateServer(filter.from_date),
        to_date: formatDateServer(filter.to_date),
        txtSearch: state.txtSearch,
      };

      // Fixed API endpoint to match backend route
      const res = await request(`orders/user/${user_id}`, "get", params);
      if (res && res.list) {
        setList(res.list || []);
        setSummary(res.summary || { total_order: 0, total_amount: 0 });
      } else {
        console.warn("Unexpected response format:", res);
        setList([]);
        setSummary({ total_order: 0, total_amount: 0 });
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      message.error("Failed to fetch orders. Please check your connection.");
      setList([]);
      setSummary({ total_order: 0, total_amount: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Fixed getOrderDetail function to match backend response
  const getOrderDetail = async (data) => {
    setLoading(true);
    try {
      // Use the correct API endpoint - based on your Postman it should be /orders/{id}
      const res = await request(`orders/${data.id}`, "get");

      if (res) {
        // Based on your API response structure
        const orderItems = res.list || res.items || [];
        const orderInfo = res.order || data;

        setOrderDetail(orderItems);
        setCurrentOrder(orderInfo);
        setState(prev => ({ ...prev, visibleModal: true }));
      } else {
        console.warn("Unexpected order detail response:", res);
        message.warning("Order details not found");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      message.error("Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  const onCloseModal = () => {
    formRef.resetFields();
    setOrderDetail([]);
    setCurrentOrder(null);
    setState(prev => ({ ...prev, visibleModal: false }));
  };

  useEffect(() => {
    getList();
  }, [filter.user_id, filter.from_date, filter.to_date]);

  const handleSearch = () => {
    getList();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      completed: 'green',
      cancelled: 'red',
      processing: 'blue',
      paid: 'green',
      unpaid: 'red'
    };
    return colors[status?.toLowerCase()] || 'default';
  };

  const getStatusText = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <div style={{
      padding: '24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh'
    }}>
      {/* Header Section */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ color: 'white', margin: 0 }}>
          <ShopOutlined style={{ marginRight: 12 }} />
          Order Management
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
          Track and manage your orders efficiently
        </Text>
      </div>

      {/* Summary Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Total Orders</span>}
              value={summary.total_order}
              prefix={<ShoppingCartOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 8 }}>
              <ArrowUpOutlined style={{ color: '#4ade80', marginRight: 4 }} />
              <Text style={{ color: '#4ade80' }}>+12% from last month</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              border: 'none',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(0,0,0,0.7)' }}>Total Revenue</span>}
              value={summary.total_amount}
              prefix={<DollarOutlined style={{ color: '#ff6b6b' }} />}
              precision={2}
              valueStyle={{ color: '#2d3748', fontSize: 32, fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 8 }}>
              <ArrowUpOutlined style={{ color: '#4ade80', marginRight: 4 }} />
              <Text style={{ color: '#4ade80' }}>+8% from last month</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              border: 'none',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(0,0,0,0.7)' }}>Avg Order Value</span>}
              value={summary.total_order > 0 ? summary.total_amount / summary.total_order : 0}
              prefix={<DollarOutlined style={{ color: '#8b5cf6' }} />}
              precision={2}
              valueStyle={{ color: '#2d3748', fontSize: 32, fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 8 }}>
              <ArrowUpOutlined style={{ color: '#4ade80', marginRight: 4 }} />
              <Text style={{ color: '#4ade80' }}>+5% from last month</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
              border: 'none',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(0,0,0,0.7)' }}>This Month</span>}
              value={Math.floor(summary.total_order * 0.7)}
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#2d3748', fontSize: 32, fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 8 }}>
              <ArrowUpOutlined style={{ color: '#4ade80', marginRight: 4 }} />
              <Text style={{ color: '#4ade80' }}>+15% from last month</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content Card */}
      <Card
        style={{
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          border: 'none'
        }}
        bodyStyle={{ padding: 32 }}
      >
        {/* Filter Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <CalendarOutlined style={{ color: '#667eea', fontSize: 20 }} />
            <RangePicker
              value={[filter.from_date, filter.to_date]}
              onChange={(dates) => {
                if (dates?.length === 2) {
                  setFilter(prev => ({
                    ...prev,
                    from_date: dates[0],
                    to_date: dates[1]
                  }));
                }
              }}
              style={{ borderRadius: 8 }}
            />
          </div>

          <Button
            type="primary"
            icon={<ExportOutlined />}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 8,
              height: 40,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            Export Data
          </Button>
        </div>

        <Divider style={{ margin: '32px 0' }} />

        {/* Filter Controls */}
        <div style={{
          background: '#f8fafc',
          padding: 24,
          borderRadius: 16,
          marginBottom: 24
        }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Input.Search
                size="large"
                allowClear
                placeholder="Search orders, products..."
                value={state.txtSearch}
                onChange={(e) => setState(prev => ({ ...prev, txtSearch: e.target.value }))}
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
                placeholder="Select User"
                value={filter.user_id}
                options={config?.user || []}
                onChange={(val) => setFilter(prev => ({ ...prev, user_id: val }))}
                prefix={<UserOutlined />}
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

        {/* Orders Table */}
        <Table
          loading={loading}
          rowKey="id"
          dataSource={list}
          pagination={false}
          style={{
            background: '#fff',
            borderRadius: 12,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No orders found"
                style={{ padding: 40 }}
              />
            )
          }}
          columns={[
            {
              title: "Order Details",
              dataIndex: "order_no",
              width: 200,
              render: (val, record) => (
                <div>
                  <Tag
                    color="blue"
                    style={{
                      borderRadius: 6,
                      fontWeight: 'bold',
                      marginBottom: 4
                    }}
                  >
                    {val || `#${record.id}`}
                  </Tag>
                  <div style={{ fontSize: 12, color: '#8b5cf6' }}>
                    {formatDateClient(record.created_at, "MMM DD, YYYY")}
                  </div>
                  {record.table_number && (
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      Table: {record.table_number}
                    </div>
                  )}
                </div>
              )
            },
            {
              title: "Products",
              dataIndex: "category_name",
              width: 300,
              render: (val, record) => (
                <div>
                  <Text strong style={{ color: '#2d3748' }}>
                    {val || 'No items'}
                  </Text>
                  {record.product_names && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      <Tooltip title={record.product_names}>
                        {record.product_names.length > 50
                          ? `${record.product_names.substring(0, 50)}...`
                          : record.product_names
                        }
                      </Tooltip>
                    </div>
                  )}
                  {record.total_quantity && (
                    <Badge
                      count={`${record.total_quantity} items`}
                      style={{ backgroundColor: '#f0f9ff', color: '#0369a1', marginTop: 4 }}
                    />
                  )}
                </div>
              )
            },
            {
              title: "Amount",
              dataIndex: "total_amount",
              align: "right",
              width: 120,
              render: val => (
                <Text strong style={{ fontSize: 16, color: '#2d3748' }}>
                  ${Number(val || 0).toFixed(2)}
                </Text>
              )
            },
            {
              title: "Status",
              dataIndex: "status",
              width: 100,
              render: val => (
                <Tag
                  color={getStatusColor(val)}
                  style={{
                    borderRadius: 6,
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}
                >
                  {getStatusText(val)}
                </Tag>
              )
            },
            {
              title: "Payment",
              dataIndex: "payment_method",
              width: 120,
              render: val => (
                <Tag
                  color="success"
                  style={{
                    borderRadius: 6,
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}
                >
                  {val || 'Cash'}
                </Tag>
              )
            },
            {
              title: "Time",
              dataIndex: "timestamp",
              width: 120,
              render: (val, record) => (
                <div style={{ textAlign: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>
                    {formatDateClient(val || record.created_at, "h:mm A")}
                  </Text>
                </div>
              )
            },
            {
              title: "Action",
              width: 80,
              align: 'center',
              render: (_, rec) => (
                <Tooltip title="View Details">
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => getOrderDetail(rec)}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                    }}
                  />
                </Tooltip>
              )
            }
          ]}
        />
      </Card>

      {/* Enhanced Order Detail Modal */}
      <Modal
        open={state.visibleModal}
        onCancel={onCloseModal}
        footer={null}
        title={
          <div style={{ padding: '8px 0' }}>
            <Title level={3} style={{ margin: 0, color: '#2d3748' }}>
              <ShoppingCartOutlined style={{ marginRight: 8, color: '#667eea' }} />
              Order Details
              {currentOrder?.order_no && (
                <Text style={{ fontSize: 14, color: '#6b7280', marginLeft: 8 }}>
                  ({currentOrder.order_no})
                </Text>
              )}
            </Title>
          </div>
        }
        width={900}
        style={{ top: 20 }}
        bodyStyle={{
          padding: 0,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }}
      >
        <div style={{ padding: 24 }}>
          {/* Order Summary */}
          {currentOrder && (
            <Card style={{ marginBottom: 16, borderRadius: 8 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Text strong>Order No:</Text>
                  <br />
                  <Text>{currentOrder.order_no || `#${currentOrder.id}`}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>Date:</Text>
                  <br />
                  <Text>{formatDateClient(currentOrder.created_at, "MMM DD, YYYY h:mm A")}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>Status:</Text>
                  <br />
                  <Tag color={getStatusColor(currentOrder.status)}>
                    {getStatusText(currentOrder.status)}
                  </Tag>
                </Col>
                <Col span={6}>
                  <Text strong>Payment:</Text>
                  <br />
                  <Text>{currentOrder.payment_method || 'Cash'}</Text>
                </Col>
              </Row>
            </Card>
          )}

          <Table
            dataSource={orderDetail}
            rowKey={(record) => `${record.product_id}-${record.id}`}
            pagination={false}
            loading={loading}
            style={{
              background: '#fff',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}
            columns={[
              {
                key: "image",
                title: "Image",
                dataIndex: "image",
                width: 80,
                render: (value) => (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid #e0e0e0",
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                      transition: "transform 0.3s, box-shadow 0.3s",
                    }}
                  >
                    {value ? (
                      <Image
                        src={Config.getFullImagePath(value)}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        preview={{
                          mask: (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                width: "100%",
                                height: "100%",
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                color: "#fff",
                                fontSize: 16,
                              }}
                            >
                              View
                            </div>
                          ),
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: "#EEE",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontSize: 14,
                          color: "#999",
                        }}
                      >
                        No Image
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: "Product Name",
                dataIndex: "product_name",
                render: (name, record) => (
                  <div>
                    <Text strong style={{ color: '#2d3748' }}>{name}</Text>
                    {record.category_name && (
                      <div>
                        <Tag size="small" color="blue" style={{ marginTop: 4 }}>
                          {record.category_name}
                        </Tag>
                      </div>
                    )}
                  </div>
                )
              },
              {
                title: "Quantity",
                dataIndex: "total_quantity",
                align: "center",
                width: 100,
                render: val => (
                  <Badge
                    count={val || 0}
                    style={{
                      backgroundColor: '#667eea',
                      fontSize: 14,
                      fontWeight: 'bold'
                    }}
                  />
                )
              },
              {
                title: "Discount",
                dataIndex: "discount_percent",
                align: "center",
                width: 100,
                render: (val) => {
                  const value = Number(val) || 0;

                  return value > 0 ? (
                    <Badge
                      count={`${value}% OFF`}
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 'bold',
                        padding: '0 10px',
                        borderRadius: '12px',
                        boxShadow: '0 0 0 1px #fff inset'
                      }}
                    />
                  ) : (
                    <Tag
                      color="default"
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        borderRadius: '10px',
                      }}
                    >
                      No Discount
                    </Tag>
                  );
                }
              }
              ,
              {
                title: "Price",
                dataIndex: "price",
                align: "right",
                width: 120,
                render: val => (
                  <Text style={{ fontSize: 14, color: '#6b7280' }}>
                    ${Number(val || 0).toFixed(2)}
                  </Text>
                )
              },
              {
                title: "Total Amount",
                dataIndex: "total",
                align: "right",
                width: 140,
                render: (val, record) => {
                  // FIXED: Use the correct field names from your API response
                  const totalAmount = record.grand_total || record.line_total || record.total || 0;
                  return (
                    <Text strong style={{ fontSize: 16, color: '#10b981' }}>
                      ${Number(totalAmount).toFixed(2)}
                    </Text>
                  );
                }
              }
            ]}
            summary={(pageData) => {
              // FIXED: Calculate total using the correct field names
              const total = pageData.reduce((sum, item) => {
                const itemTotal = item.grand_total || item.line_total || item.total || 0;
                return sum + Number(itemTotal);
              }, 0);

              return (
                <Table.Summary.Row style={{ background: '#f8fafc' }}>
                  <Table.Summary.Cell colSpan={4}>
                    <Text strong style={{ fontSize: 16 }}>Total Order Amount</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell align="right">
                    <Text strong style={{ fontSize: 18, color: '#667eea' }}>
                      ${total.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </div>
      </Modal>
    </div>
  );
}

export default OrderPage;