import React, { useState, useEffect } from "react";
import { Card, Table, Tag, Button, Space, Typography, Popconfirm, message, Spin, Alert, Switch, Input, Row, Col, Divider } from "antd";
import { CloudDownloadOutlined, PlusOutlined, DeleteOutlined, SyncOutlined, DatabaseOutlined, SettingOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const BackupRecoveryPage = () => {
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState([]);
  const [generating, setGenerating] = useState(false);

  // Auto-backup configuration state
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [cronPattern, setCronPattern] = useState("0 2 * * *");
  const [retentionDays, setRetentionDays] = useState("30");
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchBackupsAndSettings = async () => {
    setLoading(true);
    try {
      const res = await request("backup", "get");
      if (res && res.success) {
        setBackups(res.list);
      }
      
      const settingsRes = await request("system-setting", "get");
      if (settingsRes && settingsRes.success && settingsRes.settings) {
        const s = settingsRes.settings;
        setScheduleEnabled(s.backup_schedule_enabled === "true");
        setCronPattern(s.backup_schedule_cron || "0 2 * * *");
        setRetentionDays(s.backup_schedule_retention_days || "30");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load database backups and settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupsAndSettings();
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

  const handleSaveScheduleSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await request("system-setting", "put", {
        backup_schedule_enabled: scheduleEnabled ? "true" : "false",
        backup_schedule_cron: cronPattern,
        backup_schedule_retention_days: retentionDays
      });
      if (res && res.success) {
        message.success("Automated backup schedule settings saved successfully.");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to save schedule settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
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
      dataIndex: "size_bytes",
      key: "size_bytes",
      render: (bytes) => <Tag color="blue">{formatSize(bytes)}</Tag>
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
          <Button icon={<SyncOutlined />} onClick={fetchBackupsAndSettings} disabled={generating}>
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

      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          {/* Scheduler Configuration Card */}
          <Col xs={24} lg={8}>
            <Card 
              bordered={false} 
              className="shadow-sm" 
              style={{ borderRadius: 12 }}
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span><SettingOutlined style={{ marginRight: 8 }} /><b>Scheduler Settings</b></span>
                  <Switch checked={scheduleEnabled} onChange={(val) => setScheduleEnabled(val)} />
                </div>
              }
            >
              <Paragraph style={{ fontSize: 12, color: "#666" }}>
                Automate your database backups on a recurring cron interval. System backup processes are run in the background.
              </Paragraph>
              
              <div style={{ margin: "16px 0" }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Cron Expression</label>
                <Input 
                  value={cronPattern} 
                  placeholder="e.g. 0 2 * * *" 
                  onChange={(e) => setCronPattern(e.target.value)} 
                  disabled={!scheduleEnabled}
                />
                <Text type="secondary" style={{ fontSize: 10 }}>
                  Format: Min Hour Day Month Weekday (e.g. <Text code>0 2 * * *</Text> runs daily at 2:00 AM)
                </Text>
              </div>

              <div style={{ margin: "16px 0" }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Retention Period (Days)</label>
                <Input 
                  type="number" 
                  value={retentionDays} 
                  placeholder="30" 
                  onChange={(e) => setRetentionDays(e.target.value)} 
                  disabled={!scheduleEnabled}
                />
                <Text type="secondary" style={{ fontSize: 10 }}>
                  Backups older than this will be deleted automatically.
                </Text>
              </div>

              <Divider style={{ margin: "16px 0" }} />
              
              <Button 
                type="primary" 
                block 
                style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }}
                onClick={handleSaveScheduleSettings}
                loading={savingSettings}
              >
                Save Schedule Config
              </Button>
            </Card>
          </Col>

          {/* Backup List Card */}
          <Col xs={24} lg={16}>
            <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12 }} title={<b>Platform Database Backups</b>}>
              <Table columns={columns} dataSource={backups} pagination={false} size="small" rowKey="filename" />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default BackupRecoveryPage;
