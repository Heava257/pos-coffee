import React, { useEffect, useState } from "react";
import {
    Table, Button, Card, Row, Col, Input,
    Modal, Form, message, Tag, Space,
    Typography, Divider, Badge, Tooltip, Statistic, Popover,
    Select, Checkbox, Tabs, Spin, Progress
} from "antd";
import dayjs from "dayjs";
import {
    PlusOutlined,
    ShopOutlined,
    ShoppingOutlined,
    SearchOutlined,
    MailOutlined,
    PhoneOutlined,
    UserOutlined,
    GlobalOutlined,
    SafetyCertificateOutlined,
    CheckCircleOutlined,
    StopOutlined,
    CrownOutlined,
    CalendarOutlined,
    EyeOutlined,
    TeamOutlined,
    CoffeeOutlined,
    EditOutlined,
    PlusCircleOutlined,
    LockOutlined,
    InfoCircleOutlined,
    DeleteOutlined,
    AppstoreOutlined,
    MoreOutlined,
    SettingOutlined
} from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import { Config } from "@/shared/utils/config";
import CategoryManageTab from "@/modules/administration/user/components/CategoryManageTab";
import { CAMBODIA_GEO } from "@/shared/utils/cambodia_geo";
import { useLanguage } from "@/app/store/language.store";

const { Title, Text } = Typography;

const BusinessPage = () => {
    const { lang } = useLanguage();
    const [list, setList] = useState([]);
    const [packageList, setPackageList] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false); // 'create', 'edit', 'renew', false
    const [catVisible, setCatVisible] = useState(false);
    const [selectedBiz, setSelectedBiz] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState("");
    const [passwordVal, setPasswordVal] = useState("");

    const hasMinLen = passwordVal.length >= 8;
    const hasUppercase = /[A-Z]/.test(passwordVal);
    const hasNumber = /[0-9]/.test(passwordVal);
    const hasSpecial = /[^A-Za-z0-9]/.test(passwordVal);

    const metCount = [hasMinLen, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
    const strengthPercent = metCount * 25;

    let progressColor = "#ff4d4f";
    if (strengthPercent === 50 || strengthPercent === 75) {
        progressColor = "#faad14";
    } else if (strengthPercent === 100) {
        progressColor = "#52c41a";
    }

    const renderPasswordStrength = () => {
        if (!passwordVal) return null;

        return (
            <Progress 
                percent={strengthPercent} 
                strokeColor={progressColor} 
                showInfo={false} 
                strokeWidth={3} 
                style={{ marginTop: -10, marginBottom: 0, position: 'relative', zIndex: 1 }}
            />
        );
    };

    const generateStrongPassword = (e) => {
        e.preventDefault();
        const length = 12;
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const symbols = "@$!%*?&";
        
        let password = "";
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        
        const allChars = uppercase + lowercase + numbers + symbols;
        for (let i = 4; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        password = password.split('').sort(() => 0.5 - Math.random()).join('');
        
        form.setFieldsValue({
            password: password
        });
        
        setPasswordVal(password);
        
        navigator.clipboard.writeText(password);
        message.success(lang === 'kh' ? `លេខសម្ងាត់ខ្លាំងត្រូវបានបង្កើត និងចម្លងរួចរាល់៖ ${password}` : `Strong password generated and copied: ${password}`);
    };

    // Detail View State
    const [detailVisible, setDetailVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState({
        branches: [],
        users: [],
        products: [],
        insights: null
    });

    useEffect(() => {
        getList();
        getPlans();
        getPackages();
    }, []);

    const getPackages = async () => {
        try {
            const res = await request("modular_package", "get");
            if (res && res.list) setPackageList(res.list);
        } catch (error) {}
    };

    const getPlans = async () => {
        try {
            const res = await request("plans", "get");
            if (res && res.plans) setPlans(res.plans);
        } catch (error) {}
    };

    const getList = async () => {
        setLoading(true);
        try {
            const res = await request("business", "get");
            if (res && res.list) {
                // Exclude Platform Owner (business_id = 1)
                const clientList = res.list.filter(item => item.id !== 1);
                setList(clientList);
            }
        } catch (error) {
            message.error("Failed to fetch businesses");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (record) => {
        setSelectedBiz(record);
        setDetailVisible(true);
        setDetailLoading(true);
        try {
            const [bRes, uRes, pRes, iRes] = await Promise.all([
                request(`branch?target_business_id=${record.id}`, "get"),
                request(`user?target_business_id=${record.id}`, "get"),
                request(`product/business?target_business_id=${record.id}`, "get"),
                request(`business/insights?id=${record.id}`, "get")
            ]);
            
            setDetailData({
                branches: bRes?.list || [],
                users: uRes?.list || [],
                products: pRes?.list || [],
                insights: iRes || null
            });
        } catch (error) {
            message.error("Failed to load details");
        } finally {
            setDetailLoading(false);
        }
    };

    const onFinish = async (values) => {
        try {
            let res;
            if (visible === 'edit') {
                res = await request("business", "put", {
                    ...values,
                    active_modules: Array.isArray(values.active_modules) ? values.active_modules.join(",") : values.active_modules
                });
            } else if (visible === 'renew') {
                res = await request("business/plan", "put", values);
            } else {
                res = await request("business", "post", values);
            }
            
            if (res && res.success && res.data) {
                message.success("Operation successful!");
                setVisible(false);
                form.resetFields();
                setPasswordVal("");
                if (visible === 'edit' || visible === 'renew') {
                    setList(prev => prev.map(item => item.id === res.data.id ? res.data : item));
                } else {
                    setList(prev => [res.data, ...prev]);
                }
            }
        } catch (error) {
            message.error(error.message || "Operation failed");
        }
    };

    const toggleStatus = async (record) => {
        const newStatus = record.status === 'active' ? 'suspended' : 'active';
        try {
            const res = await request("business/status", "put", { id: record.id, status: newStatus });
            if (res && res.success && res.data) {
                message.success(`Business ${newStatus} successfully`);
                setList(prev => prev.map(item => item.id === record.id ? res.data : item));
            }
        } catch (error) {
            message.error("Status update failed");
        }
    };

    const onClickDelete = (record) => {
        Modal.confirm({
            title: `Are you sure you want to delete ${record.name}?`,
            content: 'WARNING: This will permanently remove the business and perform a COMPLETE WIPE of all associated data including users, branches, products, and ALL SALES/TRANSACTIONAL DATA. This action cannot be undone.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const res = await request("business", "delete", { id: record.id });
                    if (res) {
                        message.success("Business deleted successfully");
                        setList(prev => prev.filter(item => item.id !== record.id));
                    }
                } catch (error) {
                    message.error(error.message || "Failed to delete business. It may have existing sales data.");
                }
            }
        });
    };

    const handleVerifyOwner = async (record) => {
        try {
            const res = await request("business/verify-owner", "post", { business_id: record.id });
            if (res) {
                message.success(lang === 'kh' ? "បានបញ្ជាក់អ៊ីមែលម្ចាស់ហាងជោគជ័យ!" : "Owner email verified successfully!");
                getList();
            }
        } catch (error) {
            message.error(error.message || "Verification failed");
        }
    };

    const columns = [
        {
            title: "Business / Enterprise",
            dataIndex: "name",
            width: 250,
            render: (text, record) => {
                const hasLogo = record.logo && typeof record.logo === 'string' && record.logo.trim() !== '' && record.logo !== 'null' && record.logo !== 'undefined';
                return (
                    <Space size="middle">
                        <div style={{
                            width: 45,
                            height: 45,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#1e4a2d',
                            background: '#1e4a2d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {hasLogo ? (
                                <img
                                    src={Config.getFullImagePath(record.logo)}
                                    alt="Logo"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        const iconEl = e.target.parentElement.querySelector('.default-shop-icon');
                                        if (iconEl) iconEl.style.display = 'inline-block';
                                    }}
                                />
                            ) : null}
                            <ShoppingOutlined className="default-shop-icon" style={{ fontSize: '20px', color: '#fffffe', display: hasLogo ? 'none' : 'inline-block' }} />
                        </div>
                        <div>
                            <Text strong style={{ fontSize: '14px', color: '#1e4a2d', display: 'block' }}>{text}</Text>
                            <Space size={4}>
                                <Tag color="blue" style={{ fontSize: '10px', borderRadius: 4, margin: 0 }}>{record.province}</Tag>
                                <Tag color="cyan" style={{ fontSize: '10px', borderRadius: 4, margin: 0 }}>{record.district}</Tag>
                            </Space>
                        </div>
                    </Space>
                );
            }
        },
        {
            title: "Owner",
            dataIndex: "owner_name",
            width: 220,
            render: (text, record) => (
                <div style={{ whiteSpace: 'nowrap' }}>
                    <Space size={4} style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <Text strong style={{ fontSize: '13px' }}>{text}</Text>
                        {record.is_verified === 1 ? (
                            <Tooltip title={lang === 'kh' ? "បានបញ្ជាក់អ៊ីមែលរួចរាល់" : "Email Verified"}>
                                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
                            </Tooltip>
                        ) : (
                            <Tooltip title={lang === 'kh' ? "មិនទាន់បញ្ជាក់អ៊ីមែល" : "Email Not Verified"}>
                                <StopOutlined style={{ color: '#ff4d4f', fontSize: '12px' }} />
                            </Tooltip>
                        )}
                    </Space>
                    <br/>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{record.email}</Text>
                </div>
            )
        },
        {
            title: "Plan",
            dataIndex: "plan_name",
            width: 120,
            render: (name) => {
                let color = "default";
                const lowerName = name?.toLowerCase() || "";
                if (lowerName.includes("medium") || lowerName.includes("pro")) color = "green";
                if (lowerName.includes("large") || lowerName.includes("enterprise") || lowerName.includes("gold")) color = "gold";
                if (lowerName.includes("small") || lowerName.includes("starter")) color = "blue";
                
                return <Tag color={color} style={{ borderRadius: 6, fontWeight: 700 }}>{name?.toUpperCase()}</Tag>
            }
        },
        {
            title: "Status",
            dataIndex: "status",
            width: 120,
            render: (status) => <Badge status={status === 'active' ? 'success' : 'error'} text={status?.toUpperCase()} />
        },
        {
            title: "Registered Date",
            dataIndex: "created_at",
            width: 160,
            render: (created_at) => (
                <div style={{ lineHeight: '1.4' }}>
                    <Text style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>
                        {created_at ? dayjs(created_at).format("DD-MMM-YYYY") : "—"}
                    </Text>
                    <Text style={{ fontSize: '12px', color: '#475569', display: 'block', fontWeight: 500 }}>
                        {created_at ? dayjs(created_at).format("h:mm A") : ""}
                    </Text>
                </div>
            )
        },
        {
            title: "Last Active",
            dataIndex: "last_active",
            width: 160,
            render: (last_active) => (
                <div style={{ lineHeight: '1.4' }}>
                    <Text style={{ fontSize: '13px', fontWeight: 600, display: 'block', color: last_active ? '#2d6a3e' : '#64748b' }}>
                        {last_active ? dayjs(last_active).format("DD-MMM-YYYY") : "—"}
                    </Text>
                    <Text style={{ fontSize: '12px', color: last_active ? '#335e3b' : '#64748b', display: 'block', fontWeight: 500 }}>
                        {last_active ? dayjs(last_active).format("h:mm A") : (lang === 'kh' ? "មិនទាន់ចូលប្រើ" : "Never logged in")}
                    </Text>
                </div>
            )
        },
        {
            title: "Management",
            key: "actions",
            align: 'center',
            width: 100,
            render: (record) => {
                const popoverContent = (
                    <Space size={8}>
                        {record.is_verified !== 1 && (
                            <Tooltip title={lang === 'kh' ? "បញ្ជាក់អ៊ីមែល" : "Verify Email"}>
                                <Button 
                                    shape="circle" 
                                    icon={<SafetyCertificateOutlined />} 
                                    onClick={() => handleVerifyOwner(record)}
                                    style={{ color: '#10b981', borderColor: '#10b981' }}
                                />
                            </Tooltip>
                        )}
                        <Tooltip title={lang === 'kh' ? "មើលព័ត៌មានលម្អិត" : "View Details"}>
                            <Button 
                                shape="circle" 
                                icon={<EyeOutlined />} 
                                onClick={() => handleViewDetail(record)}
                            />
                        </Tooltip>
                        <Tooltip title={lang === 'kh' ? "គ្រប់គ្រងប្រភេទ" : "Manage Categories"}>
                            <Button 
                                shape="circle" 
                                icon={<AppstoreOutlined />} 
                                onClick={() => {
                                    setSelectedBiz(record);
                                    setCatVisible(true);
                                }}
                                style={{ color: '#2d6a3e', borderColor: '#2d6a3e' }}
                            />
                        </Tooltip>
                        <Tooltip title={lang === 'kh' ? "បន្តគម្រោង" : "Renew Subscription"}>
                            <Button 
                                shape="circle" 
                                icon={<CrownOutlined />} 
                                onClick={() => {
                                    setVisible('renew');
                                    form.setFieldsValue({ business_id: record.id, plan_id: record.plan_id, duration_days: 30 });
                                }} 
                                style={{ color: '#c0a060', borderColor: '#c0a060' }}
                            />
                        </Tooltip>
                        <Tooltip title={lang === 'kh' ? "កែសម្រួលព័ត៌មាន" : "Edit Business"}>
                            <Button 
                                shape="circle" 
                                icon={<EditOutlined />} 
                                onClick={() => {
                                    setVisible('edit');
                                    form.setFieldsValue({
                                        ...record,
                                        business_name: record.name,
                                        active_modules: record.active_modules?.split(',')
                                    });
                                }} 
                                style={{ color: '#1890ff', borderColor: '#1890ff' }}
                            />
                        </Tooltip>
                        {record.id !== 1 && (
                            <Tooltip title={record.status === 'active' ? (lang === 'kh' ? "ផ្អាកដំណើរការ" : "Suspend") : (lang === 'kh' ? "បើកដំណើរការ" : "Activate")}>
                                <Button 
                                    shape="circle" 
                                    danger={record.status === 'active'}
                                    icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                                    onClick={() => toggleStatus(record)}
                                />
                            </Tooltip>
                        )}
                        {record.id !== 1 && (
                            <Tooltip title={lang === 'kh' ? "លុបចោល" : "Delete Business"}>
                                <Button 
                                    shape="circle" 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                    onClick={() => onClickDelete(record)}
                                />
                            </Tooltip>
                        )}
                    </Space>
                );

                return (
                    <Popover content={popoverContent} trigger="click" placement="left">
                        <Button 
                            shape="circle" 
                            icon={<SettingOutlined />} 
                            style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                borderColor: '#1e4a2d',
                                color: '#1e4a2d'
                            }} 
                        />
                    </Popover>
                );
            }
        }
    ];

    const filteredList = list.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.owner_name.toLowerCase().includes(searchText.toLowerCase())
    );

    const regionalStats = list.reduce((acc, curr) => {
        const p = curr.province || "Unspecified";
        if (!acc[p]) acc[p] = { stores: 0, branches: 0 };
        acc[p].stores += 1;
        acc[p].branches += (curr.total_branches || 0);
        return acc;
    }, {});

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ color: '#1e4a2d', margin: 0 }}>Platform Ecosystem</Title>
                <Text type="secondary">Regional analysis and enterprise tenant management.</Text>
            </div>

            <Row gutter={16} style={{ marginBottom: 32 }}>
                <Col span={8}><Card><Statistic title="Total Businesses" value={list.length} prefix={<ShopOutlined />} /></Card></Col>
                <Col span={8}><Card><Statistic title="Active Users" value={list.reduce((a,b)=>a+b.total_users, 0)} prefix={<TeamOutlined />} /></Card></Col>
                <Col span={8}><Card><Statistic title="Total Branches" value={list.reduce((a,b)=>a+b.total_branches, 0)} prefix={<GlobalOutlined />} /></Card></Col>
            </Row>

            <Card title="Regional Market Insights" style={{ marginBottom: 32, borderRadius: 16 }}>
                <div style={{ display: 'flex', overflowX: 'auto', gap: 16, paddingBottom: 12 }}>
                    {Object.entries(regionalStats).sort((a,b)=>b[1].branches - a[1].branches).map(([prov, stats]) => (
                        <Card key={prov} size="small" style={{ minWidth: 180, background: '#fcfaf6', textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: 10 }}>{prov.toUpperCase()}</Text>
                            <Title level={4} style={{ margin: '4px 0', color: '#1e4a2d' }}>{stats.branches} Branches</Title>
                            <Text style={{ fontSize: 11 }}>{stats.stores} Entities</Text>
                            <div style={{ marginTop: 4 }}><Badge status="success" text="Occupied" /></div>
                        </Card>
                    ))}
                </div>
            </Card>

            <Card 
                title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>Business Registry</Text>
                    <Space>
                        <Input placeholder="Search..." prefix={<SearchOutlined />} onChange={e => setSearchText(e.target.value)} style={{ width: 250 }} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setVisible('create'); form.resetFields(); setPasswordVal(""); }} style={{ background: '#1e4a2d' }}>Onboard Business</Button>
                    </Space>
                </div>}
            >
                <Table columns={columns} dataSource={filteredList} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 'max-content' }} />
            </Card>

            {/* Category Assignment Modal */}
            <BusinessCategoryModal 
                visible={catVisible} 
                onCancel={() => setCatVisible(false)} 
                selectedBiz={selectedBiz} 
            />

            {/* Main Action Modal */}
            <Modal
                title={
                    <div style={{ paddingBottom: 12 }}>
                        <Title level={4} style={{ margin: 0, color: '#1e4a2d' }}>
                            {visible === 'create' ? <><PlusCircleOutlined /> New Business Provisioning</> : <><EditOutlined /> Modify Enterprise Details</>}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 11 }}>Configuring system architecture and access controls</Text>
                    </div>
                }
                open={!!visible}
                onCancel={() => { setVisible(false); setPasswordVal(""); }}
                onOk={() => form.submit()}
                width={visible === 'renew' ? 500 : 1000}
                centered
                destroyOnClose={true}
                okText="Confirm Action"
            >
                <Form layout="vertical" form={form} onFinish={onFinish}>
                    <Form.Item name="id" hidden><Input /></Form.Item>
                    <Form.Item name="business_id" hidden><Input /></Form.Item>

                    {visible === 'renew' ? (
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item name="plan_id" label="Subscription Tier" rules={[{ required: true }]}>
                                    <Select size="large">
                                        {plans.map(p => <Select.Option key={p.id} value={p.id}>{p.name} (${p.price})</Select.Option>)}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="duration_days" label="Extension Period" initialValue={30}>
                                    <Select size="large">
                                        <Select.Option value={30}>1 Month</Select.Option>
                                        <Select.Option value={365}>1 Year</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    ) : (
                        <>
                        <Row gutter={32}>
                            <Col span={12}>
                                <Divider orientation="left" style={{ marginTop: 0 }}><Text strong style={{ fontSize: 11 }}>BUSINESS IDENTITY</Text></Divider>
                                <Form.Item name="business_name" label="Enterprise Name" rules={[{ required: true }]}>
                                    <Input prefix={<ShopOutlined />} size="large" />
                                </Form.Item>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="province" label="Province" rules={[{ required: true }]}>
                                            <Select showSearch size="large" options={Object.keys(CAMBODIA_GEO).map(p=>({label:p, value:p}))} onChange={()=>form.setFieldsValue({district:undefined})} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item noStyle shouldUpdate={(p,c)=>p.province !== c.province}>
                                            {({getFieldValue}) => {
                                                const prov = getFieldValue("province");
                                                const dists = prov ? CAMBODIA_GEO[prov] : [];
                                                const occupied = list.filter(b=>b.province === prov).map(b=>b.district);
                                                return (
                                                    <Form.Item name="district" label="District" rules={[{ required: true }]}>
                                                        <Select size="large" disabled={!prov}>
                                                            {dists.map(d => (
                                                                <Select.Option key={d} value={d}>
                                                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                                                        {d} {occupied.includes(d) && <Tag color="orange" style={{fontSize:9}}>Managed</Tag>}
                                                                    </Space>
                                                                </Select.Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                )
                                            }}
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Form.Item name="phone" label="Official Contact Phone"><Input prefix={<PhoneOutlined />} size="large" /></Form.Item>
                            </Col>
                            <Col span={12}>
                                <Divider orientation="left" style={{ marginTop: 0 }}><Text strong style={{ fontSize: 11 }}>CAPABILITIES & PLAN</Text></Divider>
                                <Form.Item name="plan_id" label="Subscription Tier" rules={[{ required: true }]}>
                                    <Select 
                                        size="large" 
                                        placeholder="Select Plan"
                                        onChange={(val) => {
                                            const plan = plans.find(p => p.id === val);
                                            if (plan) {
                                                const planName = plan.name.toLowerCase();
                                                let modules = ['POS'];
                                                if (planName.includes('medium') || planName.includes('pro')) {
                                                    modules = ['POS', 'ORDERING'];
                                                } else if (planName.includes('large') || planName.includes('enterprise')) {
                                                    modules = ['POS', 'ORDERING', 'INVENTORY'];
                                                }
                                                form.setFieldsValue({ active_modules: modules });
                                            }
                                        }}
                                    >
                                        {plans.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
                                    </Select>
                                </Form.Item>
                                <Form.Item name="package_id" label="Industry Blueprint" rules={[{ required: true }]}>
                                    <Select size="large">
                                        {packageList.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
                                    </Select>
                                </Form.Item>
                                <Divider orientation="left" style={{ marginTop: 24 }}><Text strong style={{ fontSize: 11 }}>ACTIVE MODULES (FEATURES)</Text></Divider>
                                <Form.Item name="active_modules" rules={[{ required: true, message: 'Please select at least one module' }]}>
                                    <Checkbox.Group style={{ width: '100%' }}>
                                        <Row gutter={[16, 16]}>
                                            <Col span={12}><Checkbox value="POS">Core POS System</Checkbox></Col>
                                            <Col span={12}><Checkbox value="ORDERING">Web QR Ordering</Checkbox></Col>
                                            <Col span={12}><Checkbox value="INVENTORY">Advanced Inventory</Checkbox></Col>
                                            <Col span={12}><Checkbox value="CRM">Marketing & CRM (Loyalty)</Checkbox></Col>
                                        </Row>
                                    </Checkbox.Group>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Divider orientation="left"><Text strong style={{ fontSize: 11 }}>ADMIN ACCESS CONTROL</Text></Divider>
                        <Row gutter={24}>
                            <Col span={8}><Form.Item name="owner_name" label="Owner Full Name" rules={[{required:true}]}><Input prefix={<UserOutlined />} size="large" autoComplete="off"/></Form.Item></Col>
                            <Col span={8}><Form.Item name="email" label="Admin Email" rules={[{required:true, type:'email'}]}><Input prefix={<MailOutlined />} size="large" autoComplete="new-password"/></Form.Item></Col>
                            {visible === 'create' && (
                                <Col span={8}>
                                    <Form.Item 
                                        name="password" 
                                        label={
                                            <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                <Text strong style={{ margin: 0 }}>Temp Password</Text>
                                                <a onClick={generateStrongPassword} style={{ fontSize: '11px', color: '#1e4a2d', fontWeight: '500', marginLeft: '12px', textDecoration: 'underline' }}>
                                                    {lang === 'kh' ? 'បង្កើតស្វ័យប្រវត្ត' : 'Auto Generate'}
                                                </a>
                                            </span>
                                        } 
                                        rules={[{required:true}]}
                                        style={{ marginBottom: passwordVal ? 12 : 24 }}
                                    >
                                        <Input.Password 
                                            prefix={<LockOutlined />} 
                                            size="large" 
                                            autoComplete="new-password"
                                            value={passwordVal}
                                            onChange={(e) => setPasswordVal(e.target.value)}
                                        />
                                        {renderPasswordStrength()}
                                    </Form.Item>
                                </Col>
                            )}
                        </Row>
                        </>
                    )}
                </Form>
            </Modal>

            {/* Enterprise Inspection Modal (Restored Full Version) */}
            <Modal
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <EyeOutlined style={{ color: '#1e4a2d' }} />
                            <Title level={4} style={{ margin: 0 }}>Enterprise Inspection: {selectedBiz?.name}</Title>
                        </div>
                        {detailData.insights?.lastActive && (
                            <Tag color="cyan">Last Order Activity: {new Date(detailData.insights.lastActive).toLocaleString()}</Tag>
                        )}
                    </div>
                }
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={[<Button key="close" onClick={() => setDetailVisible(false)}>Done</Button>]}
                width={1000}
                centered
            >
                <Spin spinning={detailLoading}>
                <Tabs defaultActiveKey="branches">
                    <Tabs.TabPane 
                        tab={<span><ShopOutlined /> Branches</span>} 
                        key="branches"
                    >
                        <Table 
                            size="small"
                            dataSource={detailData.branches}
                            pagination={{ pageSize: 5 }}
                            columns={[
                                { title: 'Branch Name', dataIndex: 'name', key: 'name' },
                                { title: 'Location', dataIndex: 'location', key: 'location' },
                                { title: 'Phone', dataIndex: 'phone', key: 'phone' },
                                { title: 'Status', dataIndex: 'is_main', key: 'is_main', render: (val) => val == 1 ? <Tag color="gold">MAIN HQ</Tag> : <Tag>Regular</Tag> }
                            ]}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane 
                        tab={<span><TeamOutlined /> Team Roster</span>} 
                        key="team"
                    >
                        <Table 
                            size="small"
                            dataSource={detailData.users}
                            pagination={{ pageSize: 5 }}
                            columns={[
                                { title: 'Name', dataIndex: 'name', key: 'name' },
                                { title: 'Role', dataIndex: 'role_name', key: 'role_name' },
                                { title: 'Assigned Branch', dataIndex: 'branch_name', key: 'branch_name' },
                                { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'active' ? 'success' : 'error'}>{s?.toUpperCase()}</Tag> }
                            ]}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane 
                        tab={<span><CoffeeOutlined /> Product Menu</span>} 
                        key="products"
                    >
                         <Table 
                            size="small"
                            dataSource={detailData.products}
                            pagination={{ pageSize: 5 }}
                            columns={[
                                { title: 'Product Name', dataIndex: 'name', key: 'name' },
                                { title: 'Category', dataIndex: 'category_name', key: 'category_name' },
                                { title: 'Brand', dataIndex: 'brand', key: 'brand' },
                                { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => s == 1 ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag> }
                            ]}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane 
                        tab={<span><SafetyCertificateOutlined /> Operational Health</span>} 
                        key="insights"
                    >
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Card size="small" title="Order Volume Trend (Last 6 Months)" style={{ borderRadius: '12px' }}>
                                    {detailData.insights?.orderTrend?.map(item => (
                                        <div key={item.label} style={{ fontSize: '13px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                            <Text type="secondary">{item.label}</Text>
                                            <Text strong>{item.value} Orders</Text>
                                        </div>
                                    ))}
                                    {detailData.insights?.orderTrend?.length === 0 && <Text type="secondary">No order data available for this tenant.</Text>}
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Market Popularity" style={{ borderRadius: '12px' }}>
                                    {detailData.insights?.topProducts?.map((item, idx) => (
                                        <div key={idx} style={{ fontSize: '13px', marginBottom: '8px' }}>
                                            <Badge count={idx+1} style={{ backgroundColor: '#1e4a2d', marginRight: '8px' }} />
                                            <Text>{item.name}</Text>
                                            <Text type="secondary" style={{ float: 'right' }}>{item.total_sold} units</Text>
                                        </div>
                                    ))}
                                    {detailData.insights?.topProducts?.length === 0 && <Text type="secondary">No sales performance data yet.</Text>}
                                </Card>
                            </Col>
                        </Row>
                    </Tabs.TabPane>
                </Tabs>
                </Spin>
                <div style={{ marginTop: '16px', background: '#fff9ef', padding: '12px', borderRadius: '8px', border: '1px dashed #c0a060' }}>
                    <Text italic style={{ fontSize: '12px', color: '#c0a060' }}>
                        * Privacy Shield: Financial metrics and detailed revenue reports are restricted from this administrative view to maintain enterprise privacy.
                    </Text>
                </div>
            </Modal>
        </div>
    );
};

const BusinessCategoryModal = ({ visible, onCancel, selectedBiz }) => {
    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: '#f6ffed', color: '#1e4a2d',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <AppstoreOutlined style={{ fontSize: 20 }} />
                    </div>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>Assign Categories</Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>Manage active modules for {selectedBiz?.name}</Text>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={1000}
            centered
            destroyOnClose
            bodyStyle={{ padding: '0 24px 24px 24px' }}
        >
            <Divider style={{ marginTop: 0 }} />
            <CategoryManageTab targetBusinessId={selectedBiz?.id} />
        </Modal>
    );
};

export default BusinessPage;
