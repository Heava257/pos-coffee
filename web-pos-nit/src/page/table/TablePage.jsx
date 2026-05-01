import React, { useEffect, useState } from "react";
import {
    Table, Button, Card, Row, Col, Input,
    Modal, Form, message, Tag, Space,
    Typography, Select, Tooltip, Empty, Badge
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

import { useLanguage, translations } from "../../store/language.store";

const { Title, Text } = Typography;

const COLORS = {
    darkGreen: "#1e4a2d",
    midGreen: "#2d6a42",
    gold: "#d4af37",
    glassBg: "rgba(255, 255, 255, 0.85)",
    textSecondary: "#6b7c6b",
};

const TablePage = () => {
    const { lang } = useLanguage();
    const t = translations[lang];
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
                    const profile = getProfile();
                    const current = res.list.find(b => b.id === profile?.branch_id);
                    const defaultBranch = current ? current.id : res.list[0].id;
                    setSelectedBranch(defaultBranch);
                }
            }
        } catch (error) {
            message.error(t.fetch_branch_failed);
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
            message.error(t.fetch_table_failed);
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        if (!selectedBranch) {
            message.warning("Please select a branch first!");
            return;
        }
        setLoading(true);
        try {
            const res = await request("table", "post", { ...values, branch_id: selectedBranch });
            if (res && res.success) {
                message.success(res.message);
                setVisible(false);
                form.resetFields();
                getList();
            } else {
                message.error(res?.message || t.operation_failed);
            }
        } catch (error) {
            message.error(error.message || t.operation_failed);
        } finally {
            setLoading(false);
        }
    };

    const onClickDelete = (id) => {
        Modal.confirm({
            title: <span style={{ color: '#ff4d4f' }}>{t.delete} {t.table}?</span>,
            content: t.remove_table_confirm,
            okText: t.delete,
            okType: "danger",
            centered: true,
            onOk: async () => {
                const res = await request("table", "delete", { id });
                if (res) {
                    message.success(t.success);
                    getList();
                }
            }
        });
    };

    const showQR = (record) => {
        setSelectedTable(record);
        setQrModalVisible(true);
    };

    const getDynamicQrUrl = (url) => {
        if (!url) return "";
        try {
            const urlObj = new URL(url);
            return `${window.location.origin}/scan${urlObj.search}`;
        } catch (e) {
            return url;
        }
    };

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    const handlePrint = () => {
        const dynamicUrl = getDynamicQrUrl(selectedTable.qr_code_url);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
      <html>
        <head>
          <title>${t.print_qr_tag} - ${selectedTable.table_name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap');
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: 'Outfit', sans-serif; margin: 0; background: #fff; }
            .qr-container { padding: 40px; border: 4px solid #1e4a2d; border-radius: 30px; text-align: center; background: #fff; box-shadow: 0 10px 40px rgba(0,0,0,0.1); width: 450px; }
            img { width: 350px; height: 350px; margin-bottom: 25px; }
            h1 { margin: 0; font-size: 38px; color: #1e4a2d; font-weight: 700; letter-spacing: -1px; }
            p { font-size: 20px; color: #666; margin-top: 15px; font-weight: 400; }
            .logo { font-weight: 700; color: #d4af37; font-size: 28px; margin-bottom: 35px; text-transform: uppercase; letter-spacing: 2px; }
            .footer { margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #999; }
          </style>
        </head>
        <body>
            <div class="qr-container">
            <div class="logo">GREEN GROUNDS POS</div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(dynamicUrl)}" />
            <h1>${t.table.toUpperCase()} ${selectedTable.table_name}</h1>
            <p>${t.scan_menu_order}</p>
            <div class="footer">Powered by Smart POS Solutions</div>
          </div>
          <script>
            window.onload = () => { 
                setTimeout(() => {
                    window.print(); 
                    window.close(); 
                }, 800);
            }
          </script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    const handleCopy = () => {
        const dynamicUrl = getDynamicQrUrl(selectedTable?.qr_code_url);
        if (dynamicUrl) {
            navigator.clipboard.writeText(dynamicUrl);
            message.success(t.success);
        }
    };

    const handleOpenMenu = () => {
        const dynamicUrl = getDynamicQrUrl(selectedTable?.qr_code_url);
        if (dynamicUrl) {
            window.open(dynamicUrl, '_blank');
        }
    };

    const columns = [
        {
            title: <Text strong style={{ color: COLORS.darkGreen }}>{t.table.toUpperCase()} ID</Text>,
            dataIndex: "table_name",
            key: "table_name",
            render: (text) => (
                <Space size="middle">
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: '#f4f1eb',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: COLORS.darkGreen,
                        fontSize: '18px',
                        fontWeight: 'bold',
                        border: '1px solid #e8e3d9'
                    }}>
                        {text.match(/\d+/) ? text.match(/\d+/)[0] : text[0]}
                    </div>
                    <div>
                        <Text strong style={{ fontSize: '15px', color: COLORS.darkGreen }}>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>Branch: {branches.find(b => b.id === selectedBranch)?.name}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: <Text strong style={{ color: COLORS.darkGreen }}>QR CONNECT</Text>,
            dataIndex: "qr_code_url",
            key: "qr_code_url",
            render: (url) => (
                <Tag color={url ? "success" : "error"} style={{ borderRadius: '6px', padding: '0 12px', border: 'none', fontWeight: 600 }}>
                    {url ? "LINKED" : "UNLINKED"}
                </Tag>
            )
        },
        {
            title: <Text strong style={{ color: COLORS.darkGreen }}>STATUS</Text>,
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag
                    color={status === 'active' ? 'processing' : 'warning'}
                    style={{ borderRadius: '6px', padding: '0 12px', border: 'none', fontWeight: 600 }}
                >
                    {status === 'active' ? "OPERATIONAL" : "MAINTENANCE"}
                </Tag>
            )
        },
        {
            title: <Text strong style={{ color: COLORS.darkGreen }}>EXECUTIVE ACTIONS</Text>,
            key: "actions",
            align: 'right',
            render: (record) => (
                <Space size="small">
                    <Tooltip title={t.view_qr}>
                        <Button
                            type="primary"
                            icon={<QrcodeOutlined />}
                            onClick={() => showQR(record)}
                            style={{
                                background: COLORS.darkGreen,
                                borderColor: COLORS.darkGreen,
                                borderRadius: '8px',
                                height: '36px',
                                padding: '0 15px'
                            }}
                        >
                            {t.view_qr}
                        </Button>
                    </Tooltip>
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onClickDelete(record.id)}
                        style={{ borderRadius: '8px' }}
                    />
                </Space>
            )
        }
    ];

    const filteredList = list.filter(item =>
        item.table_name.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div style={{ padding: '24px', background: '#f8f9fa', minHeight: '100vh' }}>
            {/* Executive Glass Header */}
            <div style={{
                marginBottom: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: COLORS.glassBg,
                backdropFilter: 'blur(10px)',
                padding: '24px 32px',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                border: '1px solid rgba(255,255,255,0.4)',
                flexWrap: 'wrap',
                gap: '20px'
            }}>
                <div>
                    <Title level={2} style={{ margin: 0, color: COLORS.darkGreen, display: 'flex', alignItems: 'center', gap: '16px', fontWeight: 800 }}>
                        <QrcodeOutlined style={{ fontSize: '32px' }} /> {t.table_qr_setup}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '14px', letterSpacing: '0.5px' }}>
                        {t.manage_table_qr} • {branches.find(b => b.id === selectedBranch)?.name}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Select
                        placeholder={t.shop_managment}
                        style={{ width: 180 }}
                        value={selectedBranch}
                        onChange={(val) => setSelectedBranch(val)}
                        options={branches.map(b => ({ label: b.name, value: b.id }))}
                        size="large"
                        className="custom-executive-select"
                    />
                    <Input
                        prefix={<SearchOutlined style={{ color: COLORS.textSecondary }} />}
                        placeholder={t.search}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 220, borderRadius: '10px' }}
                        size="large"
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setVisible(true)}
                        style={{
                            background: COLORS.darkGreen,
                            borderColor: COLORS.darkGreen,
                            height: '40px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(30, 74, 45, 0.2)'
                        }}
                        size="large"
                    >
                        {t.add_table}
                    </Button>
                </div>
            </div>

            {/* Insights Row */}
            <Row gutter={24} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }} bodyStyle={{ padding: '20px' }}>
                        <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase' }}>Total Tables</Text>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.darkGreen, marginTop: '5px' }}>{list.length}</div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }} bodyStyle={{ padding: '20px' }}>
                        <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase' }}>Active QR</Text>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.midGreen, marginTop: '5px' }}>
                            {list.filter(i => i.qr_code_url).length}
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }} bodyStyle={{ padding: '20px' }}>
                        <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase' }}>Branch Status</Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#52c41a' }}></div>
                            <Text strong style={{ color: COLORS.darkGreen }}>OPERATIONAL</Text>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card
                style={{ borderRadius: '24px', border: 'none', boxShadow: '0 4px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    columns={columns}
                    dataSource={filteredList}
                    rowKey="id"
                    loading={loading}
                    locale={{ emptyText: <Empty description={t.no_data} /> }}
                    pagination={{ pageSize: 8 }}
                    className="custom-executive-table"
                />
            </Card>

            {/* Modal Setup Table */}
            <Modal
                title={<Title level={4} style={{ margin: 0, color: COLORS.darkGreen }}>{t.add_table}</Title>}
                open={visible}
                onCancel={() => setVisible(false)}
                onOk={() => form.submit()}
                okText={t.generate_table_qr}
                okButtonProps={{
                    style: { background: COLORS.darkGreen, borderColor: COLORS.darkGreen, height: '40px', borderRadius: '8px' }
                }}
                cancelButtonProps={{ style: { borderRadius: '8px', height: '40px' } }}
                destroyOnClose
                centered
            >
                <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
                    <Form.Item
                        name="table_name"
                        label={<Text strong>{t.table_number_name}</Text>}
                        rules={[{ required: true, message: t.table_number_name + " is required" }]}
                    >
                        <Input placeholder="e.g. T-01, Rooftop-A1" size="large" style={{ borderRadius: '10px' }} />
                    </Form.Item>
                    <div style={{ padding: '12px', background: '#f4f1eb', borderRadius: '8px', marginTop: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <SearchOutlined /> {t.manage_table_qr} • This will generate a unique QR code for digital ordering.
                        </Text>
                    </div>
                </Form>
            </Modal>

            {/* Modal QR Preview */}
            <Modal
                title={null}
                open={qrModalVisible}
                onCancel={() => setQrModalVisible(false)}
                footer={null}
                centered
                width={450}
                bodyStyle={{ padding: 0 }}
            >
                <div style={{
                    background: COLORS.darkGreen,
                    padding: '40px 20px',
                    textAlign: 'center',
                    borderTopLeftRadius: '20px',
                    borderTopRightRadius: '20px'
                }}>
                    <Card style={{
                        borderRadius: 24,
                        border: 'none',
                        background: '#fff',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                        padding: '10px'
                    }}>
                        {selectedTable?.qr_code_url && (
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getDynamicQrUrl(selectedTable.qr_code_url))}`}
                                alt="QR Code"
                                style={{ width: '100%', maxWidth: '280px', height: 'auto', borderRadius: '15px' }}
                            />
                        )}
                        <div style={{ marginTop: '24px', paddingBottom: '10px' }}>
                            <Text strong style={{ fontSize: '13px', color: COLORS.gold, letterSpacing: '2px', textTransform: 'uppercase' }}>
                                {branches.find(b => b.id === selectedBranch)?.name || "GREEN GROUNDS"}
                            </Text>
                            <Title level={2} style={{ margin: '5px 0', color: COLORS.darkGreen, fontWeight: 800 }}>
                                {t.table.toUpperCase()} {selectedTable?.table_name}
                            </Title>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                                <Tag color="green" style={{ borderRadius: '4px', border: 'none' }}>DIGITAL MENU</Tag>
                                <Tag color="gold" style={{ borderRadius: '4px', border: 'none' }}>SCAN TO ORDER</Tag>
                            </div>
                        </div>
                    </Card>
                </div>
                <div style={{ padding: '24px', background: '#fff', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Button
                                block
                                icon={<CopyOutlined />}
                                onClick={handleCopy}
                                style={{ borderRadius: '10px', height: '45px' }}
                            >
                                {t.copy_link}
                            </Button>
                        </Col>
                        <Col span={12}>
                            <Button
                                block
                                icon={<EyeOutlined />}
                                onClick={handleOpenMenu}
                                style={{ borderRadius: '10px', height: '45px' }}
                            >
                                {t.open_menu}
                            </Button>
                        </Col>
                        <Col span={24} style={{ marginTop: '12px' }}>
                            <Button
                                type="primary"
                                block
                                icon={<PrinterOutlined />}
                                onClick={handlePrint}
                                style={{
                                    background: COLORS.darkGreen,
                                    borderColor: COLORS.darkGreen,
                                    borderRadius: '10px',
                                    height: '50px',
                                    fontWeight: 700,
                                    fontSize: '16px'
                                }}
                            >
                                {t.print_qr_tag}
                            </Button>
                        </Col>
                    </Row>
                    {isLocalhost && (
                        <div style={{ marginTop: 20, textAlign: 'center' }}>
                            <Badge status="warning" text="Localhost Detection Active" />
                        </div>
                    )}
                </div>
            </Modal>

            {/* Styles for custom Ant components */}
            <style>{`
                .custom-executive-table .ant-table-thead > tr > th {
                    background: #fdfcf9 !important;
                    border-bottom: 2px solid #f4f1eb !important;
                    padding: 16px 24px !important;
                }
                .custom-executive-table .ant-table-tbody > tr > td {
                    padding: 16px 24px !important;
                    border-bottom: 1px solid #f4f1eb !important;
                }
                .custom-executive-table .ant-table-row:hover > td {
                    background: #faf9f6 !important;
                }
                .custom-executive-select.ant-select-single .ant-select-selector {
                    border-radius: 10px !important;
                }
            `}</style>
        </div>
    );
};

export default TablePage;
