import React, { useEffect, useState } from "react";
import {
    Table, Button, Card, Input,
    Modal, Form, message, Tag, Space,
    Typography, Select, Tooltip, Empty
} from "antd";
import {
    PlusOutlined,
    DeleteOutlined,
    SearchOutlined,
    QrcodeOutlined,
    PrinterOutlined,
    CopyOutlined,
    EyeOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { getProfile } from "../../store/profile.store";

const { Title, Text } = Typography;

const TablePage = () => {
    const [list, setList] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [qrModalVisible, setQrModalVisible] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState("");
    const profile = getProfile();

    useEffect(() => {
        getBranches();
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            getList();
        }
    }, [selectedBranch]);

    const getBranches = async () => {
        try {
            const res = await request("branch", "get");
            if (res && res.list) {
                setBranches(res.list);
                if (res.list.length > 0) {
                    // Default to current branch if it exists in list
                    const current = res.list.find(b => b.id === profile.branch_id);
                    setSelectedBranch(current ? current.id : res.list[0].id);
                }
            }
        } catch (error) {
            message.error("Failed to fetch branches");
        }
    };

    const getList = async () => {
        setLoading(true);
        try {
            const res = await request("table", "get", { branch_id: selectedBranch });
            if (res && res.list) {
                setList(res.list);
            }
        } catch (error) {
            message.error("Failed to fetch tables");
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        try {
            const res = await request("table", "post", { ...values, branch_id: selectedBranch });
            if (res && res.success) {
                message.success(res.message);
                setVisible(false);
                form.resetFields();
                getList();
            }
        } catch (error) {
            message.error(error.message || "Operation failed");
        }
    };

    const onClickDelete = (id) => {
        Modal.confirm({
            title: "Remove Table?",
            content: "This will permanently delete this table's QR setup.",
            okText: "Delete",
            okType: "danger",
            onOk: async () => {
                const res = await request("table", "delete", { id });
                if (res) {
                    message.success("Table removed");
                    getList();
                }
            }
        });
    };

    const showQR = (record) => {
        setSelectedTable(record);
        setQrModalVisible(true);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${selectedTable.table_name}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0; }
            .qr-container { padding: 40px; border: 3px dashed #1e4a2d; border-radius: 20px; text-align: center; background: #fff; }
            img { width: 350px; height: 350px; margin-bottom: 20px; }
            h1 { margin: 0; font-size: 32px; color: #1e4a2d; }
            p { font-size: 18px; color: #666; margin-top: 10px; }
            .logo { font-weight: bold; color: #1e4a2d; font-size: 24px; margin-bottom: 30px; }
          </style>
        </head>
        <body>
            <div class="qr-container">
            <div class="logo">☕ GREEN GROUNDS POS</div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(selectedTable.qr_code_url)}" />
            <h1>TABLE: ${selectedTable.table_name}</h1>
            <p>Scan to view Menu & Order</p>
          </div>
          <script>
            window.onload = () => { 
                setTimeout(() => {
                    window.print(); 
                    window.close(); 
                }, 500);
            }
          </script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    const handleCopy = () => {
        if (selectedTable?.qr_code_url) {
            navigator.clipboard.writeText(selectedTable.qr_code_url);
            message.success("Scanning link copied to clipboard!");
        }
    };

    const handleOpenMenu = () => {
        if (selectedTable?.qr_code_url) {
            window.open(selectedTable.qr_code_url, '_blank');
        }
    };

    const columns = [
        {
            title: "Table / Position",
            dataIndex: "table_name",
            key: "table_name",
            render: (text) => <Text strong style={{ fontSize: '16px', color: '#1e4a2d' }}>{text}</Text>
        },
        {
            title: "QR Status",
            dataIndex: "qr_code_url",
            key: "qr_code_url",
            render: (url) => url ? <Tag color="green">READY</Tag> : <Tag color="red">MISSING</Tag>
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === 'active' ? 'blue' : 'orange'}>
                    {status.toUpperCase()}
                </Tag>
            )
        },
        {
            title: "Actions",
            key: "actions",
            align: 'right',
            render: (record) => (
                <Space>
                    <Tooltip title="View QR">
                        <Button
                            type="primary"
                            icon={<QrcodeOutlined />}
                            onClick={() => showQR(record)}
                            style={{ background: '#1e4a2d', borderColor: '#1e4a2d' }}
                        >
                            View QR
                        </Button>
                    </Tooltip>
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onClickDelete(record.id)}
                    />
                </Space>
            )
        }
    ];

    const filteredList = list.filter(item =>
        item.table_name.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div style={{ padding: '24px', background: '#f4f1eb', minHeight: '100vh' }}>
            <div style={{
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fff',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <div>
                    <Title level={2} style={{ margin: 0, color: '#1e4a2d', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <QrcodeOutlined /> Table QR Setup
                    </Title>
                    <Text type="secondary">Generate and manage unique QR codes for each table</Text>
                </div>

                <Space size="middle">
                    <Select
                        placeholder="Select Branch"
                        style={{ width: 200 }}
                        value={selectedBranch}
                        onChange={(val) => setSelectedBranch(val)}
                        options={branches.map(b => ({ label: b.name, value: b.id }))}
                    />
                    <Input
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Search tables..."
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 200, borderRadius: '8px' }}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setVisible(true)}
                        style={{ background: '#1e4a2d', borderColor: '#1e4a2d', height: '40px', borderRadius: '8px', fontWeight: 600 }}
                    >
                        Add Table
                    </Button>
                </Space>
            </div>

            <Card
                style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    columns={columns}
                    dataSource={filteredList}
                    rowKey="id"
                    loading={loading}
                    locale={{ emptyText: <Empty description="No tables setup for this branch" /> }}
                    style={{ padding: '8px' }}
                />
            </Card>

            <Modal
                title={<Title level={4} style={{ margin: 0 }}>Add New Table</Title>}
                open={visible}
                onCancel={() => setVisible(false)}
                onOk={() => form.submit()}
                okText="Generate Table QR"
                okButtonProps={{ style: { background: '#1e4a2d', borderColor: '#1e4a2d' } }}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
                    <Form.Item
                        name="table_name"
                        label="Table Number / Name"
                        rules={[{ required: true, message: "Enter table number or name" }]}
                    >
                        <Input placeholder="e.g. T-01, Rooftop-A1" size="large" />
                    </Form.Item>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        System will automatically create a unique scanning link for this table.
                    </Text>
                </Form>
            </Modal>

            <Modal
                title={`QR Code Setup - ${selectedTable?.table_name}`}
                open={qrModalVisible}
                onCancel={() => setQrModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setQrModalVisible(false)}>Close</Button>,
                    <Button
                        key="copy"
                        icon={<CopyOutlined />}
                        onClick={handleCopy}
                    >
                        Copy Link
                    </Button>,
                    <Button
                        key="open"
                        icon={<EyeOutlined />}
                        onClick={handleOpenMenu}
                    >
                        Open Menu
                    </Button>,
                    <Button
                        key="print"
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
                        style={{ background: '#1e4a2d', borderColor: '#1e4a2d' }}
                    >
                        Print QR Tag
                    </Button>
                ]}
                centered
                width={400}
            >
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Card style={{ borderRadius: 15, border: '1px dashed #1e4a2d', background: '#fff' }}>
                        {selectedTable?.qr_code_url && (
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedTable.qr_code_url)}`}
                                alt="QR Code"
                                style={{ width: '100%', maxWidth: '250px', height: 'auto' }}
                            />
                        )}
                        <div style={{ marginTop: '16px' }}>
                            <Title level={3} style={{ margin: 0, color: '#1e4a2d' }}>{selectedTable?.table_name}</Title>
                            <Text strong type="secondary">SCAN TO ORDER</Text>
                        </div>
                    </Card>
                </div>
            </Modal>
        </div>
    );
};

export default TablePage;
