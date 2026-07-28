import React, { useState, useEffect } from "react";
import { Card, Table, Tag, Button, Space, Typography, Popconfirm, message, Spin, Alert, Switch, Input, Row, Col, Divider, Select, Modal, Radio, Statistic, Progress } from "antd";
import {
  CloudDownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  SyncOutlined,
  DatabaseOutlined,
  SettingOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  UndoOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import { Config } from "@/shared/utils/config";
import { getAcccessToken } from "@/app/store/profile.store";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const BackupRecoveryPage = () => {
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState([]);
  
  // Modals and operations state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [backupType, setBackupType] = useState("db");
  const [generating, setGenerating] = useState(false);
  
  const [restoring, setRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState("");

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
        setBackups(res.list || []);
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
    setCreateModalVisible(false);
    const key = "backup_gen";
    message.loading({ content: `Generating ${backupType === "db" ? "database" : "files"} backup snapshot...`, key });
    
    try {
      const res = await request("backup/generate", "post", { type: backupType });
      if (res && res.success) {
        setBackups([res.file, ...backups]);
        message.success({ content: `${backupType === "db" ? "Database" : "Files"} backup created successfully!`, key, duration: 3 });
      } else {
        message.error({ content: "Failed to generate backup snapshot.", key });
      }
    } catch (err) {
      console.error(err);
      message.error({ content: "Failed to connect to backup service.", key });
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
    message.loading({ content: `Downloading backup snapshot ${filename}...`, key });
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

  const handleRestoreBackup = async (filename) => {
    setRestoreFile(filename);
    setRestoring(true);
    
    try {
      const res = await request("backup/restore", "post", { filename });
      if (res && res.success) {
        Modal.success({
          title: "System Restored Successfully",
          content: "The system snapshot was successfully restored. It is recommended to reload the page to load updated configurations.",
          okText: "Reload Page",
          onOk: () => window.location.reload()
        });
      } else {
        message.error(res.message || "Failed to restore system snapshot.");
      }
    } catch (err) {
      console.error(err);
      message.error(err.message || "Failed to connect to restoration engine.");
    } finally {
      setRestoring(false);
      setRestoreFile("");
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

  // Dashboard Stats Calculations
  const totalSnapshots = backups.length;
  const dbSnapshots = backups.filter(b => b.type === "db").length;
  const fileSnapshots = backups.filter(b => b.type === "files").length;
  const totalSizeBytes = backups.reduce((sum, b) => sum + (b.size_bytes || 0), 0);

  const columns = [
    {
      title: "Backup File Name",
      dataIndex: "filename",
      key: "filename",
      render: (t) => <Text strong style={{ color: "#1e4a2d" }}>{t}</Text>
    },
    {
      title: "Backup Type",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        if (type === "files") {
          return <Tag color="purple" style={{ borderRadius: 4 }}><FolderOpenOutlined /> MEDIA FILES</Tag>;
        }
        return <Tag color="green" style={{ borderRadius: 4 }}><DatabaseOutlined /> DATABASE</Tag>;
      },
      width: 160
    },
    {
      title: "File Size",
      dataIndex: "size_bytes",
      key: "size_bytes",
      render: (bytes) => <Tag color="blue">{formatSize(bytes)}</Tag>,
      width: 130
    },
    {
      title: "Created Timestamp",
      dataIndex: "created_at",
      key: "created_at",
      render: (time) => dayjs(time).format("YYYY-MM-DD HH:mm:ss A"),
      width: 230
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Space size="small">
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
            title={
              <div style={{ maxWidth: 300 }}>
                <Text strong style={{ color: "#ef4444" }}>Warning: Restore System?</Text>
                <br />
                <Text size="small">This will overwrite your current {r.type === "db" ? "database tables" : "media images"} with this backup. Current data may be lost.</Text>
              </div>
            }
            onConfirm={() => handleRestoreBackup(r.filename)}
            okText="Yes, Restore"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" icon={<UndoOutlined />} style={{ color: "#fa8c16", borderColor: "#fa8c16" }}>
              Restore
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Are you sure you want to delete this backup file?"
            onConfirm={() => handleDeleteBackup(r.filename)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
      width: 280
    }
  ];

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Restoring Overlay */}
      <Modal
        open={restoring}
        footer={null}
        closable={false}
        centered
        width={400}
      >
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: 24, color: "#1e4a2d" }}>Restoring System Snapshot</Title>
          <Paragraph type="secondary">
            Restoring <Text code>{restoreFile}</Text>.
            <br />
            Please do not close or reload this page while restoration is in progress.
          </Paragraph>
          <Progress percent={99} status="active" showInfo={false} style={{ width: "80%", margin: "0 auto" }} />
        </div>
      </Modal>

      {/* Title Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: "#1e4a2d", margin: 0 }}>
            <DatabaseOutlined style={{ marginRight: 8 }} /> Backup & Disaster Recovery Center
          </Title>
          <Paragraph style={{ color: "#666", marginTop: 4, marginBottom: 0 }}>
            Configure offsite backups, schedule automatic crons, package media folders, and restore SQL system snapshots.
          </Paragraph>
        </div>
        <Space>
          <Button icon={<SyncOutlined />} onClick={fetchBackupsAndSettings} disabled={generating}>
            Refresh List
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setCreateModalVisible(true)} 
            loading={generating}
            style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }}
          >
            Create Backup Snapshot
          </Button>
        </Space>
      </div>

      {/* Dashboard Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12 }}>
            <Statistic title="Total Snapshots" value={totalSnapshots} prefix={<DatabaseOutlined style={{ color: "#1e4a2d" }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12 }}>
            <Statistic title="Database SQL Backups" value={dbSnapshots} prefix={<DatabaseOutlined style={{ color: "#22c55e" }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12 }}>
            <Statistic title="File Archive Backups" value={fileSnapshots} prefix={<FolderOpenOutlined style={{ color: "#8b5cf6" }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12 }}>
            <Statistic title="Total Backup Size" value={formatSize(totalSizeBytes)} prefix={<CloudDownloadOutlined style={{ color: "#3b82f6" }} />} />
          </Card>
        </Col>
      </Row>

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
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 20 }}>
                  Automate database backups on a recurring cron interval. Retention cleanups run automatically to save disk space.
                </Text>
                
                <Row gutter={16}>
                  <Col span={14}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Cron Expression</label>
                      <Input 
                        value={cronPattern} 
                        onChange={(e) => setCronPattern(e.target.value)} 
                        placeholder="0 2 * * *" 
                        disabled={!scheduleEnabled}
                      />
                      <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: "block" }}>
                        Format: Min Hour Day Month Weekday (e.g., <Text code>0 2 * * *</Text> runs daily at 2:00 AM)
                      </Text>
                    </div>
                  </Col>
                  
                  <Col span={10}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Retention (Days)</label>
                      <Input 
                        type="number"
                        value={retentionDays} 
                        onChange={(e) => setRetentionDays(e.target.value)} 
                        placeholder="30" 
                        disabled={!scheduleEnabled}
                      />
                    </div>
                  </Col>
                </Row>
              </div>

              <Button 
                type="primary" 
                block 
                onClick={handleSaveScheduleSettings}
                loading={savingSettings}
                style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d", marginTop: 12, borderRadius: 8, height: 38 }}
              >
                Save Schedule Config
              </Button>
            </Card>
          </Col>

          {/* 2. Cloud S3 Storage Card */}
          <Col xs={24} lg={12}>
            <Card 
              bordered={false} 
              className="shadow-sm" 
              style={{ borderRadius: 12 }}
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span><CloudUploadOutlined style={{ marginRight: 8, color: "#1e4a2d" }} /><b>Cloud S3 Storage</b></span>
                  <Switch checked={s3Enabled} onChange={(val) => setS3Enabled(val)} />
                </div>
              }
            >
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 20 }}>
                Upload generated database snapshots to secure offsite S3-compatible cloud storage automatically.
              </Text>

              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Cloud Provider</label>
                    <Select 
                      style={{ width: "100%" }} 
                      value={s3Provider} 
                      onChange={(val) => setS3Provider(val)}
                      disabled={!s3Enabled}
                    >
                      <Select.Option value="aws">Amazon S3</Select.Option>
                      <Select.Option value="digitalocean">DigitalOcean Spaces</Select.Option>
                      <Select.Option value="minio">MinIO (Self-hosted)</Select.Option>
                    </Select>
                  </div>
                </Col>
                
                <Col span={12}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Bucket Name</label>
                    <Input 
                      value={s3Bucket} 
                      onChange={(e) => setS3Bucket(e.target.value)} 
                      placeholder="my-saas-backups" 
                      disabled={!s3Enabled}
                    />
                  </div>
                </Col>

                <Col span={12}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Access Key ID</label>
                    <Input 
                      value={s3AccessKey} 
                      onChange={(e) => setS3AccessKey(e.target.value)} 
                      placeholder="AKIAIOSFODNN7EXAMPLE" 
                      disabled={!s3Enabled}
                    />
                  </div>
                </Col>

                <Col span={12}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Secret Access Key</label>
                    <Input.Password 
                      value={s3SecretKey} 
                      onChange={(e) => setS3SecretKey(e.target.value)} 
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXA" 
                      disabled={!s3Enabled}
                    />
                  </div>
                </Col>

                <Col span={12}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>S3 Region</label>
                    <Input 
                      value={s3Region} 
                      onChange={(e) => setS3Region(e.target.value)} 
                      placeholder="ap-southeast-1" 
                      disabled={!s3Enabled}
                    />
                  </div>
                </Col>

                {s3Provider !== "aws" && (
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Custom Endpoint URL</label>
                      <Input 
                        value={s3Endpoint} 
                        onChange={(e) => setS3Endpoint(e.target.value)} 
                        placeholder="https://nyc3.digitaloceanspaces.com" 
                        disabled={!s3Enabled}
                      />
                    </div>
                  </Col>
                )}
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Button 
                    block 
                    disabled={!s3Enabled} 
                    onClick={handleTestS3Connection} 
                    loading={testingS3}
                    style={{ borderRadius: 8, height: 38 }}
                  >
                    Test Connection
                  </Button>
                </Col>
                <Col span={12}>
                  <Button 
                    type="primary" 
                    block 
                    onClick={handleSaveS3Settings}
                    loading={savingS3}
                    style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d", borderRadius: 8, height: 38 }}
                  >
                    Save Cloud Config
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 3. Platform Database and File Backups Table */}
          <Col span={24}>
            <Card 
              bordered={false} 
              className="shadow-sm" 
              style={{ borderRadius: 12 }} 
              title={<span><DatabaseOutlined style={{ marginRight: 8, color: "#1e4a2d" }} /><b>Snapshot History & Archives</b></span>}
            >
              <Table columns={columns} dataSource={backups} pagination={{ pageSize: 10 }} rowKey="filename" size="middle" />
            </Card>
          </Col>

        </Row>
      </Spin>

      {/* Create Backup Modal */}
      <Modal
        title={<span><DatabaseOutlined /> Create Manual Backup Snapshot</span>}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreateBackup}
        okText="Generate Snapshot"
        okButtonProps={{ style: { backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" } }}
      >
        <div style={{ padding: "12px 0" }}>
          <Alert 
            message="Snapshots Creation"
            description="Manual snapshots package current system state to local storage immediately. It is recommended to perform snapshots before major system upgrades."
            type="info"
            showIcon
            style={{ marginBottom: 20, borderRadius: 8 }}
          />

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Backup Type Target</label>
            <Radio.Group value={backupType} onChange={(e) => setBackupType(e.target.value)}>
              <Space direction="vertical">
                <Radio value="db">
                  <Text strong>Database SQL Dump</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Exports MySQL database structure and table rows to a raw SQL file.</Text>
                </Radio>
                <Radio value="files" style={{ marginTop: 12 }}>
                  <Text strong>Uploaded Media Assets</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Packages user uploaded images, logos, and QR codes into a compressed tarball archive.</Text>
                </Radio>
              </Space>
            </Radio.Group>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BackupRecoveryPage;
