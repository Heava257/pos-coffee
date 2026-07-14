import React, { useState, useEffect } from "react";
import { Card, Table, Tag, Button, Space, Typography, Popconfirm, message, Spin, Alert, Switch, Input, Row, Col, Divider, Select } from "antd";
import { CloudDownloadOutlined, PlusOutlined, DeleteOutlined, SyncOutlined, DatabaseOutlined, SettingOutlined, CloudUploadOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import { Config } from "@/shared/utils/config";
import { getAcccessToken } from "@/app/store/profile.store";
import axios from "axios";
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

  // S3 Cloud Storage state
  const [s3Enabled, setS3Enabled] = useState(false);
  const [s3Provider, setS3Provider] = useState("aws");
  const [s3AccessKey, setS3AccessKey] = useState("");
  const [s3SecretKey, setS3SecretKey] = useState("");
  const [s3Region, setS3Region] = useState("");
  const [s3Bucket, setS3Bucket] = useState("");
  const [s3Endpoint, setS3Endpoint] = useState("");
  const [savingS3, setSavingS3] = useState(false);
  const [testingS3, setTestingS3] = useState(false);

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

        setS3Enabled(s.backup_s3_enabled === "true");
        setS3Provider(s.backup_s3_provider || "aws");
        setS3AccessKey(s.backup_s3_access_key || "");
        setS3SecretKey(s.backup_s3_secret_key || "");
        setS3Region(s.backup_s3_region || "");
        setS3Bucket(s.backup_s3_bucket || "");
        setS3Endpoint(s.backup_s3_endpoint || "");
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

  const handleDownloadBackup = async (filename) => {
    const key = "download_progress";
    message.loading({ content: `Downloading database backup snapshot ${filename}...`, key });
    try {
      const token = getAcccessToken();
      const response = await axios({
        url: `${Config.base_url}backup/download/${filename}`,
        method: "GET",
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      message.success({ content: "Backup snapshot downloaded successfully!", key, duration: 3 });
    } catch (err) {
      console.error(err);
      message.error({ content: "Failed to download backup snapshot.", key });
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

  const handleSaveS3Settings = async () => {
    setSavingS3(true);
    try {
      const res = await request("system-setting", "put", {
        backup_s3_enabled: s3Enabled ? "true" : "false",
        backup_s3_provider: s3Provider,
        backup_s3_access_key: s3AccessKey,
        backup_s3_secret_key: s3SecretKey,
        backup_s3_region: s3Region,
        backup_s3_bucket: s3Bucket,
        backup_s3_endpoint: s3Endpoint
      });
      if (res && res.success) {
        message.success("Cloud backup destination settings saved successfully.");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to save cloud destination settings.");
    } finally {
      setSavingS3(false);
    }
  };

  const handleTestS3Connection = async () => {
    setTestingS3(true);
    try {
      const res = await request("backup/test-s3", "post", {
        provider: s3Provider,
        accessKey: s3AccessKey,
        secretKey: s3SecretKey,
        region: s3Region,
        bucket: s3Bucket,
        endpoint: s3Endpoint
      });
      if (res && res.success) {
        message.success(res.message || "S3 bucket connection test successful! Handshake established.");
      } else {
        message.error(res.error || res.message || "Failed to establish connection handshake.");
      }
    } catch (err) {
      console.error(err);
      message.error(err.message || "S3 connection failed. Verify keys and network configurations.");
    } finally {
      setTestingS3(false);
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
      render: (bytes) => <Tag color="blue">{formatSize(bytes)}</Tag>,
      width: 150
    },
    {
      title: "Created Timestamp",
      dataIndex: "created_at",
      key: "created_at",
      render: (time) => dayjs(time).format("YYYY-MM-DD HH:mm:ss A"),
      width: 250
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Space size="middle">
          <Button 
            size="small" 
            type="primary" 
            icon={<CloudDownloadOutlined />} 
            onClick={() => handleDownloadBackup(r.filename)}
            style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }}
          >
            Download
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this backup?"
            onConfirm={() => handleDeleteBackup(r.filename)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
      width: 220
    }
  ];

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Title Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: "#1e4a2d", margin: 0 }}>
            <DatabaseOutlined style={{ marginRight: 8 }} /> Backup & Disaster Recovery
          </Title>
          <Paragraph style={{ color: "#666", marginTop: 4 }}>
            Take instant database snapshot backups, download raw SQL dumps, and configure automated cloud storage destinations.
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
          
          {/* 1. Scheduler Settings Card */}
          <Col xs={24} lg={12}>
            <Card 
              bordered={false} 
              className="shadow-sm" 
              style={{ borderRadius: 12, height: "100%", display: "flex", flexDirection: "column" }}
              bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span><SettingOutlined style={{ marginRight: 8, color: "#1e4a2d" }} /><b>Scheduler Settings</b></span>
                  <Switch checked={scheduleEnabled} onChange={(val) => setScheduleEnabled(val)} />
                </div>
              }
            >
              <div>
                <Paragraph style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
                  Automate database backups on a recurring cron interval. Retention cleanups run automatically to save disk space.
                </Paragraph>
                
                <Row gutter={16}>
                  <Col span={14}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Cron Expression</label>
                      <Input 
                        value={cronPattern} 
                        placeholder="e.g. 0 2 * * *" 
                        onChange={(e) => setCronPattern(e.target.value)} 
                        disabled={!scheduleEnabled}
                      />
                    </div>
                  </Col>
                  <Col span={10}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Retention (Days)</label>
                      <Input 
                        type="number" 
                        value={retentionDays} 
                        placeholder="30" 
                        onChange={(e) => setRetentionDays(e.target.value)} 
                        disabled={!scheduleEnabled}
                      />
                    </div>
                  </Col>
                </Row>
                
                <Text type="secondary" style={{ fontSize: 10, display: "block", marginTop: -4, marginBottom: 16 }}>
                  Format: Min Hour Day Month Weekday (e.g. <Text code>0 2 * * *</Text> runs daily at 2:00 AM)
                </Text>
              </div>

              <div>
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
              </div>
            </Card>
          </Col>

          {/* 2. Cloud S3 Storage Card */}
          <Col xs={24} lg={12}>
            <Card 
              bordered={false} 
              className="shadow-sm" 
              style={{ borderRadius: 12, height: "100%", display: "flex", flexDirection: "column" }}
              bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span><CloudUploadOutlined style={{ marginRight: 8, color: "#1e4a2d" }} /><b>Cloud S3 Storage</b></span>
                  <Switch checked={s3Enabled} onChange={(val) => setS3Enabled(val)} />
                </div>
              }
            >
              <div>
                <Paragraph style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
                  Upload generated database snapshots to secure offsite S3-compatible cloud storage automatically.
                </Paragraph>

                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 12 }}>Cloud Provider</label>
                      <Select value={s3Provider} onChange={(val) => setS3Provider(val)} style={{ width: "100%" }} disabled={!s3Enabled}>
                        <Select.Option value="aws">Amazon S3</Select.Option>
                        <Select.Option value="digitalocean">DigitalOcean Spaces</Select.Option>
                        <Select.Option value="custom">Custom S3 Compatible</Select.Option>
                      </Select>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 12 }}>Bucket Name</label>
                      <Input value={s3Bucket} placeholder="my-saas-backups" onChange={(e) => setS3Bucket(e.target.value)} disabled={!s3Enabled} />
                    </div>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 12 }}>Access Key ID</label>
                      <Input value={s3AccessKey} placeholder="AKIAIOSFODNN7EXAMPLE" onChange={(e) => setS3AccessKey(e.target.value)} disabled={!s3Enabled} />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 12 }}>Secret Access Key</label>
                      <Input.Password value={s3SecretKey} placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" onChange={(e) => setS3SecretKey(e.target.value)} disabled={!s3Enabled} />
                    </div>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 12 }}>S3 Region</label>
                      <Input value={s3Region} placeholder="ap-southeast-1" onChange={(e) => setS3Region(e.target.value)} disabled={!s3Enabled} />
                    </div>
                  </Col>
                  <Col span={12}>
                    {s3Provider !== "aws" && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 12 }}>Endpoint URL</label>
                        <Input value={s3Endpoint} placeholder={s3Provider === 'digitalocean' ? 'sgp1.digitaloceanspaces.com' : 'https://endpoint.com'} onChange={(e) => setS3Endpoint(e.target.value)} disabled={!s3Enabled} />
                      </div>
                    )}
                  </Col>
                </Row>
              </div>

              <div>
                <Divider style={{ margin: "16px 0" }} />
                <Row gutter={16}>
                  <Col span={12}>
                    <Button 
                      block 
                      disabled={!s3Enabled} 
                      onClick={handleTestS3Connection} 
                      loading={testingS3}
                    >
                      Test Connection
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button 
                      type="primary" 
                      block 
                      style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }}
                      onClick={handleSaveS3Settings}
                      loading={savingS3}
                    >
                      Save Cloud Config
                    </Button>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>

          {/* 3. Backup List Table (Full Width below Configs) */}
          <Col span={24}>
            <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12 }} title={<b>Platform Database Backups</b>}>
              <Table columns={columns} dataSource={backups} pagination={{ pageSize: 10 }} size="small" rowKey="filename" />
            </Card>
          </Col>

        </Row>
      </Spin>
    </div>
  );
};

export default BackupRecoveryPage;
