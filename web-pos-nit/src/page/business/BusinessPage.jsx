import React, { useEffect, useState } from "react";
import {
    Table, Button, Card, Row, Col, Input,
    Modal, Form, message, Tag, Space,
    Typography, Divider, Badge, Tooltip, Statistic,
    Select, Checkbox, Tabs, Spin
} from "antd";
import {
    PlusOutlined,
    ShopOutlined,
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
    AppstoreOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import CategoryManageTab from "../settings/CategoryManageTab";
import { CAMBODIA_GEO } from "../../util/cambodia_geo";

const { Title, Text } = Typography;

const BusinessPage = () => {
    const [list, setList] = useState([]);
    const [packageList, setPackageList] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false); // 'create', 'edit', 'renew', false
    const [catVisible, setCatVisible] = useState(false);
    const [selectedBiz, setSelectedBiz] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState("");

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
            if (res && res.list) setList(res.list);
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
            
            if (res) {
                message.success("Operation successful!");
                setVisible(false);
                form.resetFields();
                getList();
            }
        } catch (error) {
            message.error(error.message || "Operation failed");
        }
    };

    const toggleStatus = async (record) => {
        const newStatus = record.status === 'active' ? 'suspended' : 'active';
        try {
            const res = await request("business/status", "put", { id: record.id, status: newStatus });
            if (res) {
                message.success(`Business ${newStatus} successfully`);
                getList();
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
                        getList();
                    }
                } catch (error) {
                    message.error(error.message || "Failed to delete business. It may have existing sales data.");
                }
            }
        });
    };

    const columns = [
        {
            title: "Business / Enterprise",
            dataIndex: "name",
            render: (text, record) => (
                <Space size="middle">
                    <div style={{
                        width: 45, height: 45, borderRadius: '12px',
                        background: 'linear-gradient(135deg, #1e4a2d 0%, #2d6a3e 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        <ShopOutlined style={{ fontSize: '20px' }} />
                    </div>
                    <div>
                        <Text strong style={{ fontSize: '14px', color: '#1e4a2d', display: 'block' }}>{text}</Text>
                        <Space size={4}>
                            <Tag color="blue" style={{ fontSize: '10px', borderRadius: 4, margin: 0 }}>{record.province}</Tag>
                            <Tag color="cyan" style={{ fontSize: '10px', borderRadius: 4, margin: 0 }}>{record.district}</Tag>
                        </Space>
                    </div>
                </Space>
            )
        },
        {
            title: "Owner",
            dataIndex: "owner_name",
            render: (text, record) => (
                <div>
                    <Text strong style={{ fontSize: '13px' }}>{text}</Text><br/>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{record.email}</Text>
                </div>
            )
        },
        {
            title: "Plan",
            dataIndex: "plan_name",
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
            render: (status) => <Badge status={status === 'active' ? 'success' : 'error'} text={status?.toUpperCase()} />
        },
        {
            title: "Management",
            key: "actions",
            align: 'right',
            render: (record) => (
                <Space>
                    <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>View</Button>
                    <Button 
                        icon={<AppstoreOutlined />} 
                        onClick={() => {
                            setSelectedBiz(record);
                            setCatVisible(true);
                        }}
                        style={{ color: '#2d6a3e' }}
                    >
                        Categories
                    </Button>
                    <Button icon={<CrownOutlined />} onClick={() => {
                        setVisible('renew');
                        form.setFieldsValue({ business_id: record.id, plan_id: record.plan_id, duration_days: 30 });
                    }} style={{ color: '#c0a060' }}>Renew</Button>
                    <Button icon={<EditOutlined />} onClick={() => {
                        setVisible('edit');
                        form.setFieldsValue({
                            ...record,
                            business_name: record.name,
                            active_modules: record.active_modules?.split(',')
                        });
                    }} type="link">Edit</Button>
                    <Button 
                        danger={record.status === 'active'}
                        icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                        onClick={() => toggleStatus(record)}
                        disabled={record.id === 1}
                    >
                        {record.status === 'active' ? "Suspend" : "Activate"}
                    </Button>
                    <Tooltip title="Delete Business">
                        <Button 
                            danger
                            type="text"
                            icon={<DeleteOutlined />} 
                            onClick={() => onClickDelete(record)}
                            disabled={record.id === 1}
                        />
                    </Tooltip>
                </Space>
            )
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
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setVisible('create'); form.resetFields(); }} style={{ background: '#1e4a2d' }}>Onboard Business</Button>
                    </Space>
                </div>}
            >
                <Table columns={columns} dataSource={filteredList} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
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
                onCancel={() => setVisible(false)}
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
                            {visible === 'create' && <Col span={8}><Form.Item name="password" label="Temp Password" rules={[{required:true}]}><Input.Password prefix={<LockOutlined />} size="large" autoComplete="new-password"/></Form.Item></Col>}
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
