import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Button, Table, Tag, Badge, Input, Select, Form, message } from "antd";
import { CustomerServiceOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text } = Typography;
const { TextArea } = Input;

const SupportTicketsPage = () => {
  const [form] = Form.useForm();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await request("support/tickets", "get");
      if (res && res.success) {
        setTickets(res.list || []);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleNewTicket = async (values) => {
    setLoading(true);
    try {
      const res = await request("support/tickets", "post", values);
      if (res && res.success) {
        message.success(res.message);
        form.resetFields();
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to submit ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <CustomerServiceOutlined /> Support Tickets
        </Title>
        <Text type="secondary">
          Track, update, and resolve customer support tickets.
        </Text>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card title="Active Helpdesk Tickets" bordered={false}>
            <Table
              dataSource={tickets}
              rowKey="id"
              loading={loading}
              columns={[
                { title: "ID", dataIndex: "ticket_number", key: "ticket_number", render: val => <Text strong>{val}</Text> },
                { title: "Subject", dataIndex: "title", key: "title" },
                { title: "Category", dataIndex: "category", key: "category" },
                {
                  title: "Priority",
                  dataIndex: "priority",
                  key: "priority",
                  render: val => <Tag color={val === "Critical" ? "magenta" : val === "High" ? "red" : "blue"}>{val}</Tag>
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  render: val => (
                    <Badge status={val === "Open" ? "processing" : val === "In Progress" ? "warning" : "success"} text={val} />
                  )
                },
                { title: "Created At", dataIndex: "created_at", key: "created_at", render: val => new Date(val).toLocaleString() }
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Submit New Ticket" bordered={false}>
            <Form form={form} layout="vertical" onFinish={handleNewTicket}>
              <Form.Item name="title" label="Ticket Subject" rules={[{ required: true, message: "Please enter ticket subject" }]}>
                <Input placeholder="e.g. Printer not printing labels" />
              </Form.Item>
              <Form.Item name="category" label="Category" initialValue="Software">
                <Select options={[
                  { label: "Software / POS", value: "Software" },
                  { label: "Hardware / Printer", value: "Hardware" },
                  { label: "Finance / Settlement", value: "Finance" },
                  { label: "Account / Subscription", value: "Account" }
                ]} />
              </Form.Item>
              <Form.Item name="priority" label="Priority" initialValue="Medium">
                <Select options={[
                  { label: "Low", value: "Low" },
                  { label: "Medium", value: "Medium" },
                  { label: "High", value: "High" },
                  { label: "Critical", value: "Critical" }
                ]} />
              </Form.Item>
              <Form.Item name="description" label="Detailed Description">
                <TextArea rows={4} placeholder="Please provide details about the issue..." />
              </Form.Item>
              <Button type="primary" block htmlType="submit" loading={loading}>
                Submit Ticket
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SupportTicketsPage;
