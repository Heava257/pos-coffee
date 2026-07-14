import React, { useState, useEffect } from "react";
import { Card, Table, Tag, Button, Space, Typography, Popconfirm, message, Spin, Alert } from "antd";
import { CloudDownloadOutlined, PlusOutlined, DeleteOutlined, SyncOutlined, DatabaseOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const BackupRecoveryPage = () => {
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState([]);
  const [generating, setGenerating] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await request("backup", "get");
      if (res && res.success) {
        setBackups(res.list);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load database backups list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setGenerating(true);
    message.loading({ content: "Generating database dump snapshot...", key: "backup_gen" });
    try {
      const res = await request("backup/generate", "post");
      if (res && res.success) {
        setBackups([res.file, ...backups]);
        message.success({ content: "Database backup created successfully!", key: "backup_gen", duration: 3 });
      } else {
        message.error({ content: "Failed to generate database backup.", key: "backup_gen" });
      }
    } catch (err) {
      console.error(err);
      message.error({ content: "Failed to connect to backup service.", key: "backup_gen" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteBackup = async (filename) => {
    try {
      const res = await request("backup/delete", "post", { filename });
      if (res && res.success) {
        setBackups(backups.filter(b => b.filename !== filename));
        message.success("Backup snapshot deleted successfully.");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to delete backup file.");
    }
  };

  const columns = [
    {
      title: "Backup File Name",
      dataIndex: "filename",
      key: "filename",
      render: (t) => <Text strong style={{ color: "#1e4a2d" }}>{t}</Text>
    },
    {
      title: "File Size",
      dataIndex: "size_mb",
      key: "size_mb",
      render: (size) => <Tag color="blue">{size} MB</Tag>
    },
    {
      title: "Created Timestamp",
      dataIndex: "created_at",
      key: "created_at",
      render: (time) => dayjs(time).format("YYYY-MM-DD HH:mm:ss A")
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to delete this backup?"
            onConfirm={() => handleDeleteBackup(r.filename)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: "#1e4a2d", margin: 0 }}>
            <DatabaseOutlined style={{ marginRight: 8 }} /> Backup & Disaster Recovery
          </Title>
          <Paragraph style={{ color: "#666", marginTop: 4 }}>
            Take instant database snapshot backups, download raw SQL dumps, and keep your multi-tenant SaaS ecosystem secure.
          </Paragraph>
        </div>
        <Space>
          <Button icon={<SyncOutlined />} onClick={fetchBackups} disabled={generating}>
            Refresh List
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreateBackup} 
            loading={generating}
            style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }}
          >
            Create Backup Snapshot
          </Button>
        </Space>
      </div>

      <Alert
        message="Automated Snapshot Schedule Active"
        description="The system performs automated database backups every night at 02:00 AM UTC. Automated backups are stored in AWS S3 and kept for 30 days."
        type="success"
        showIcon
        style={{ marginBottom: 24, borderRadius: 8 }}
      />

      <Spin spinning={loading}>
        <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12 }} title={<b>Platform Database Backups</b>}>
          <Table columns={columns} dataSource={backups} pagination={false} size="small" rowKey="filename" />
        </Card>
      </Spin>
    </div>
  );
};

export default BackupRecoveryPage;
