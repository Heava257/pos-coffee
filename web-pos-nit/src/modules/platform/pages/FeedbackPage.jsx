import React from "react";
import { Card, Typography, Button, Input, Rate, Form, message } from "antd";
import { LikeOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text } = Typography;
const { TextArea } = Input;

const FeedbackPage = () => {
  const [form] = Form.useForm();

  const handleFeedback = async (values) => {
    try {
      const res = await request("support/feedback", "post", values);
      if (res && res.success) {
        message.success(res.message);
        form.resetFields();
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to submit feedback");
    }
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <LikeOutlined /> Tenant Feedback Hub
        </Title>
        <Text type="secondary">
          Gather survey results, merchant reviews, and product satisfaction rates.
        </Text>
      </div>

      <Card title="Merchant Satisfaction & Feedback" bordered={false}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 0' }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>We Value Your Feedback</Title>
          <Form form={form} layout="vertical" onFinish={handleFeedback}>
            <Form.Item name="rating" label="How satisfied are you with the platform stability?" required initialValue={5}>
              <Rate allowHalf />
            </Form.Item>
            <Form.Item name="desired_feature" label="What is your most desired missing feature?" required rules={[{ required: true }]}>
              <Input placeholder="e.g. Inventory multi-warehouse transfers" />
            </Form.Item>
            <Form.Item name="suggestions" label="Tell us your experience or any suggestions">
              <TextArea rows={5} placeholder="Write your experience details here..." />
            </Form.Item>
            <Button type="primary" block size="large" htmlType="submit">
              Submit Feedback
            </Button>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default FeedbackPage;
