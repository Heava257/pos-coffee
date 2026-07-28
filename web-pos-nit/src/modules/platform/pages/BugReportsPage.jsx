import React from "react";
import { Card, Typography, Button, Input, Select, Form, message } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text } = Typography;
const { TextArea } = Input;

const BugReportsPage = () => {
  const [form] = Form.useForm();

  const handleBugReport = async (values) => {
    try {
      const res = await request("support/bugs", "post", values);
      if (res && res.success) {
        message.success(res.message);
        form.resetFields();
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to submit bug report");
    }
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <WarningOutlined /> Bug Tracking Center
        </Title>
        <Text type="secondary">
          Log, track, and assign technical system defects reported by tenants.
        </Text>
      </div>

      <Card title="System Defect Tracking" bordered={false}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 0' }}>
          <Title level={4} style={{ marginBottom: 24 }}>Log System Bug / Error</Title>
          <Form form={form} layout="vertical" onFinish={handleBugReport}>
            <Form.Item name="title" label="Defect Title" required rules={[{ required: true }]}>
              <Input placeholder="e.g. Sales summary exports timeout on large datasets" />
            </Form.Item>
            <Form.Item name="severity" label="Severity Level" required initialValue="Medium">
              <Select options={[
                { label: "Low (Cosmetic/Typo)", value: "Low" },
                { label: "Medium (Workaround exists)", value: "Medium" },
                { label: "High (Affects sales flow)", value: "High" },
                { label: "Critical (Crash/Data loss)", value: "Critical" }
              ]} />
            </Form.Item>
            <Form.Item name="steps" label="Steps to Reproduce" required rules={[{ required: true }]}>
              <TextArea rows={4} placeholder="1. Go to Reports page&#10;2. Select date range of 1 year&#10;3. Click Export to Excel" />
            </Form.Item>
            <Form.Item name="expected" label="Expected Behavior" required rules={[{ required: true }]}>
              <TextArea rows={3} placeholder="Should export successfully within 5 seconds without timeout." />
            </Form.Item>
            <Button type="primary" danger size="large" block htmlType="submit">
              Log Defect
            </Button>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default BugReportsPage;
