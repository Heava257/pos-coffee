import React, { useState, useEffect } from "react";
import { Card, Table, Tag, Typography, Spin, Input, DatePicker, Select, Space, Button } from "antd";
import { HistoryOutlined, SearchOutlined, ReloadOutlined, FilterOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const AuditLogsPage = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await request(`securities/logs?page=${page}&limit=${limit}`, "get");
      if (res && res.list) {
        setLogs(res.list);
        setTotal(res.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.ip.toLowerCase().includes(search.toLowerCase()) ||
      (log.endpoint && log.endpoint.toLowerCase().includes(search.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()));
    
    const matchesType = eventType ? log.event_type === eventType : true;
    return matchesSearch && matchesType;
  });

  const columns = [
    {
      title: "Timestamp",
      dataIndex: "created_at",
      key: "created_at",
      render: (t) => dayjs(t).format("YYYY-MM-DD HH:mm:ss A"),
      width: 180
    },
    {
      title: "Event Type",
      dataIndex: "event_type",
      key: "event_type",
      render: (type) => {
        let color = "blue";
        if (type.includes("FAIL") || type.includes("BLOCK") || type.includes("ATTACK")) color = "red";
        if (type.includes("SUCCESS") || type.includes("LOGIN")) color = "green";
        return <Tag color={color}>{type.replace(/_/g, " ").toUpperCase()}</Tag>;
      },
      width: 150
    },
    {
      title: "IP Address",
      dataIndex: "ip",
      key: "ip",
      render: (ip) => <Text code>{ip}</Text>,
      width: 130
    },
    {
      title: "Target Endpoint",
      dataIndex: "endpoint",
      key: "endpoint",
      render: (ep) => ep ? <Text code>{ep}</Text> : <Text type="secondary">-</Text>
    },
    {
      title: "Event Details",
      dataIndex: "details",
      key: "details",
      render: (details) => <Text style={{ fontSize: "12px" }}>{details || "No details provided"}</Text>
    }
  ];

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: "#1e4a2d", margin: 0 }}>
            <HistoryOutlined style={{ marginRight: 8 }} /> Platform Audit Logs
          </Title>
          <Paragraph style={{ color: "#666", marginTop: 4 }}>
            Trace system-wide activities, admin operations, authentication attempts, and blocked intrusion logs.
          </Paragraph>
        </div>
        <Button type="primary" icon={<ReloadOutlined />} onClick={fetchLogs} style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }}>
          Refresh Logs
        </Button>
      </div>

      <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12, marginBottom: 20 }}>
        <Space size="middle" wrap style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search IP, endpoint, details..."
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            placeholder="Filter by Event Type"
            allowClear
            style={{ width: 220 }}
            onChange={(val) => setEventType(val)}
          >
            <Select.Option value="FAILED_LOGIN">Failed Login</Select.Option>
            <Select.Option value="IP_BLOCKED">IP Blocked</Select.Option>
            <Select.Option value="UNAUTHORIZED_ACCESS">Unauthorized Access</Select.Option>
            <Select.Option value="SUSPICIOUS_ACTIVITY">Suspicious Activity</Select.Option>
            <Select.Option value="FORCE_LOGOUT">Force Logout</Select.Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: limit,
            total: total,
            onChange: (p, l) => { setPage(p); setLimit(l); }
          }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default AuditLogsPage;
