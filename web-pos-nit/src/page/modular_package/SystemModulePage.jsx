import React, { useEffect, useState } from "react";
import {
    Table, Button, Card, Row, Col, Input,
    Modal, Form, message, Tag, Space,
    Typography, Switch, Tabs, Checkbox, Divider, Tooltip
} from "antd";
import {
    PlusOutlined, EditOutlined, AppstoreOutlined, DeleteOutlined,
    SafetyCertificateOutlined, ShopOutlined, GlobalOutlined,
    CoffeeOutlined, CheckCircleOutlined, DatabaseOutlined,
    LineChartOutlined, SettingOutlined, RocketOutlined,
    LoadingOutlined, SearchOutlined, FilterOutlined,
    FileTextOutlined, ShoppingCartOutlined, TeamOutlined,
    WalletOutlined, HistoryOutlined, BulbOutlined,
    ContainerOutlined, ClusterOutlined, SolutionOutlined,
    ControlOutlined, ToolOutlined, PartitionOutlined, SaveOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import { useProfileStore, broadcastRefresh } from "../../store/profileStore";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Khmer Translation Mapping
const khmerNames = {
    "/dashboard": "ផ្ទាំងគ្រប់គ្រងសង្ខេប",
    "/invoices": "បញ្ជីវិក្កយបត្រ",
    "/order": "បញ្ជីការកម្ម៉ង់",
    "/table": "គ្រប់គ្រងតុអាហារ",
    "/payments": "ការទូទាត់ប្រាក់",
    "/reports": "របាយការណ៍លម្អិត",
    "/product": "គ្រប់គ្រងទំនិញ",
    "/category": "ចំណាត់ថ្នាក់ទំនិញ",
    "/shop_managment": "គ្រប់គ្រងសាខា",
    "/raw_material": "ស្តុកវត្ថុធាតុដើម",
    "/supplier": "អ្នកផ្គត់ផ្គង់",
    "/purchase": "ការទិញចូល",
    "/user": "បុគ្គលិក និងតួនាទី",
    "/role": "សិទ្ធិប្រើប្រាស់",
    "/settings": "ការកំណត់ប្រព័ន្ធ",
    "/customer": "បញ្ជីអតិថិជន",
    "/promotion": "ការផ្សព្វផ្សាយ",
    "/stock": "ទិដ្ឋភាពស្តុក",
    "/stock/adjust": "កែតម្រូវស្តុក",
    "/qr-ordering": "កម្ម៉ង់តាម QR Code",
    "/kds": "ផ្ទះបាយ (KDS)",
    "/menu-board": "ម៉ឺនុយឌីជីថល",
    "/loyalty": "កម្មវិធីសមាជិក",
    "/expense": "ការចំណាយផ្សេងៗ",
    "/plans": "កញ្ចប់សេវាកម្ម",
    "/my-plan": "គម្រោងរបស់ខ្ញុំ"
};

const getPermIcon = (route) => {
    if (route.includes("dashboard")) return <LineChartOutlined />;
    if (route.includes("invoices")) return <FileTextOutlined />;
    if (route.includes("order")) return <HistoryOutlined />;
    if (route.includes("table")) return <ContainerOutlined />;
    if (route.includes("payment")) return <WalletOutlined />;
    if (route.includes("report")) return <LineChartOutlined />;
    if (route.includes("product")) return <CoffeeOutlined />;
    if (route.includes("category")) return <ClusterOutlined />;
    if (route.includes("shop")) return <ShopOutlined />;
    if (route.includes("user")) return <TeamOutlined />;
    if (route.includes("role")) return <SafetyCertificateOutlined />;
    if (route.includes("setting")) return <SettingOutlined />;
    if (route.includes("stock")) return <DatabaseOutlined />;
    if (route.includes("qr")) return <GlobalOutlined />;
    if (route.includes("kds")) return <BulbOutlined />;
    if (route.includes("menu")) return <AppstoreOutlined />;
    if (route.includes("expense")) return <WalletOutlined />;
    return <AppstoreOutlined />;
};

const MatrixTable = ({ data, planMappings, modMappings, onToggle, onBulkToggle, syncing, activeTarget, setActiveTarget }) => {
    const [searchText, setSearchText] = useState("");
    
    const groups = [
        { name: "POS & Operations", kh: "មុខងារសម្រាប់ប្រតិបត្តិការ POS ទូទៅ", perms: [2, 6, 22, 37, 24, 29], color: "#10b981", icon: <CoffeeOutlined /> },
        { name: "Inventory & Stock", kh: "ការគ្រប់គ្រងស្តុក និងទំនិញ", perms: [7, 8, 9, 20, 21, 27, 28, 32, 33], color: "#3b82f6", icon: <DatabaseOutlined /> },
        { name: "Reports & Analytics", kh: "របាយការណ៍ និងការវិភាគ", perms: [1, 12, 13, 14, 31], color: "#8b5cf6", icon: <LineChartOutlined /> },
        { name: "Admin & Setup", kh: "ការគ្រប់គ្រងប្រព័ន្ធ និងតួនាទី", perms: [3, 4, 5, 10, 11, 15, 16, 17, 18, 19, 23, 25, 26, 36], color: "#f59e0b", icon: <SettingOutlined /> },
        { name: "Marketing & CRM", kh: "ទីផ្សារ និងទំនាក់ទំនងអតិថិជន", perms: [30, 34, 35], color: "#ec4899", icon: <RocketOutlined /> }
    ];

    const currentMapping = activeTarget?.type === 'plan' ? planMappings[Number(activeTarget.id)] || [] : modMappings[Number(activeTarget?.id)] || [];
    const currentName = activeTarget?.type === 'plan' ? data.plans.find(p => Number(p.id) === Number(activeTarget.id))?.name : data.modules.find(m => Number(m.id) === Number(activeTarget?.id))?.name;

    const filteredPerms = data.permissions.filter(p => 
        p.name?.toLowerCase().includes(searchText.toLowerCase()) || 
        p.route_key?.toLowerCase().includes(searchText.toLowerCase())
    );

    const getGroupPerms = (group) => {
        const perms = filteredPerms.filter(p => group.perms.includes(Number(p.id)));
        const seenKeys = new Set();
        return perms.filter(p => {
            const normalizedKey = p.route_key?.replace(/^\//, '').toLowerCase();
            if (seenKeys.has(normalizedKey)) return false;
            seenKeys.add(normalizedKey);
            return true;
        });
    };

    const SidebarItem = ({ id, name, type, icon }) => {
        const isActive = activeTarget?.type === type && activeTarget?.id === id;
        const enabledCount = (type === 'plan' ? planMappings[id] : modMappings[id])?.length || 0;
        
        return (
            <div 
                onClick={() => setActiveTarget({ type, id })}
                style={{ 
                    padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: isActive ? '#f0fdf4' : 'transparent',
                    transition: 'all 0.2s', marginBottom: '2px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: isActive ? '#166534' : '#64748b', fontSize: '14px' }}>{icon}</div>
                    <Text strong style={{ color: isActive ? '#166534' : '#475569', fontSize: '13px' }}>{name}</Text>
                </div>
                {enabledCount > 0 && (
                    <Text type="secondary" style={{ fontSize: '10px', opacity: 0.7 }}>
                        {enabledCount}
                    </Text>
                )}
            </div>
        );
    };

    if (!activeTarget) return null;

    return (
        <div style={{ display: 'flex', gap: '12px', height: 'calc(100vh - 180px)', borderRadius: '20px', overflow: 'hidden' }}>
            {/* Sidebar */}
            <div style={{ width: '240px', background: '#fff', padding: '16px', border: '1px solid #f1f5f9', borderRadius: '20px', overflowY: 'auto' }}>
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>PLAN (BASE PACKAGE)</Text>
                    {data.plans.map(p => (
                        <SidebarItem key={`p-${p.id}`} id={p.id} name={p.name} type="plan" icon={<SafetyCertificateOutlined />} />
                    ))}
                </div>
                <div>
                    <Text strong style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>MODULES (ADD-ON)</Text>
                    {data.modules.map(m => (
                        <SidebarItem key={`m-${m.id}`} id={m.id} name={m.name} type="mod" icon={<AppstoreOutlined />} />
                    ))}
                </div>
            </div>

            {/* Main Matrix */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '20px' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#f0fdf4', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                {activeTarget.type === 'plan' ? <SafetyCertificateOutlined /> : <AppstoreOutlined />}
                            </div>
                            <div>
                                <Title level={4} style={{ margin: 0 }}>{currentName}</Title>
                                <Text type="secondary" style={{ fontSize: '12px' }}>{currentMapping.length} enabled</Text>
                            </div>
                        </div>
                        <Switch size="small" checked={currentMapping.length > 0} onChange={(checked) => onBulkToggle(activeTarget.type, activeTarget.id, checked)} />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                    {groups.map(group => {
                        const perms = getGroupPerms(group);
                        if (perms.length === 0) return null;
                        const enabledCount = perms.filter(p => currentMapping.includes(p.id)).length;
                        return (
                            <div key={group.name} style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <Space size={8}>
                                        <div style={{ width: 24, height: 24, borderRadius: '6px', background: `${group.color}10`, color: group.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                            {group.icon}
                                        </div>
                                        <div>
                                            <Text strong style={{ fontSize: '13px' }}>{group.name}</Text>
                                            <Text type="secondary" style={{ fontSize: '10px', marginLeft: 8 }}>{group.kh}</Text>
                                        </div>
                                    </Space>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>{enabledCount}/{perms.length}</Text>
                                </div>
                                <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                                    {perms.map((perm, idx) => {
                                        const isEnabled = currentMapping.includes(perm.id);

                                        // Smart Logic: Check if this permission is already in any BASE PLAN
                                        const plansProvidingThis = data.plans.filter(p => (planMappings[Number(p.id)] || []).includes(Number(perm.id)));
                                        const isRedundant = activeTarget.type === 'mod' && plansProvidingThis.length > 0;

                                        return (
                                            <div key={perm.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: isEnabled ? '#fff' : '#fafafa', borderBottom: idx === perms.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                                <Space size={12}>
                                                    <div style={{ color: isEnabled ? group.color : '#94a3b8', fontSize: '16px' }}>{getPermIcon(perm.route_key)}</div>
                                                    <div>
                                                        <Space align="center" size={8}>
                                                            <Text strong style={{ fontSize: '13px', lineHeight: '18px' }}>{perm.route_key}</Text>
                                                            {isRedundant && (
                                                                <Tooltip title={`មុខងារនេះមានរួចហើយក្នុង៖ ${plansProvidingThis.map(p => p.name).join(', ')}`}>
                                                                    <Tag color="orange" style={{ fontSize: '10px', height: '18px', lineHeight: '16px', margin: 0, borderRadius: '4px' }}>
                                                                        ស្ទួនជាមួយកញ្ចប់គោល
                                                                    </Tag>
                                                                </Tooltip>
                                                            )}
                                                        </Space>
                                                        <Text type="secondary" style={{ display: 'block', fontSize: '11px' }}>{khmerNames[perm.route_key] || perm.name}</Text>
                                                    </div>
                                                </Space>
                                                <Switch size="small" checked={isEnabled} onChange={() => onToggle(activeTarget.type, activeTarget.id, perm.id)} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const MatrixGrid = ({ data, planMappings, modMappings, onToggle }) => {
    const [searchText, setSearchText] = useState("");
    const filteredPerms = data.permissions.filter(p => p.name?.toLowerCase().includes(searchText.toLowerCase()) || p.route_key?.toLowerCase().includes(searchText.toLowerCase()));

    return (
        <Card style={{ borderRadius: '24px', border: '1px solid #f1f5f9' }} bodyStyle={{ padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Global Feature Grid</Text>
                <Input placeholder="Search..." prefix={<SearchOutlined />} onChange={e => setSearchText(e.target.value)} style={{ width: 300, borderRadius: '8px' }} />
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                            <th style={{ padding: '16px 24px', textAlign: 'left', minWidth: '250px', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 20 }}>Feature Name</th>
                            {data.plans.map(p => <th key={p.id} style={{ padding: '16px', textAlign: 'center' }}><Tag color="orange">{p.name}</Tag></th>)}
                            {data.modules.map(m => <th key={m.id} style={{ padding: '16px', textAlign: 'center' }}><Tag color="blue">{m.name}</Tag></th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPerms.map((perm, idx) => (
                            <tr key={perm.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                                <td style={{ padding: '12px 24px', position: 'sticky', left: 0, background: idx % 2 === 0 ? '#fff' : '#fcfcfc', zIndex: 10 }}>
                                    <Text strong>{perm.name}</Text><br/><Text type="secondary" style={{fontSize: '10px'}}>{perm.route_key}</Text>
                                </td>
                                {data.plans.map(p => <td key={p.id} style={{ textAlign: 'center' }}><Checkbox checked={planMappings[p.id]?.includes(perm.id)} onChange={() => onToggle('plan', p.id, perm.id)} /></td>)}
                                {data.modules.map(m => <td key={m.id} style={{ textAlign: 'center' }}><Checkbox checked={modMappings[m.id]?.includes(perm.id)} onChange={() => onToggle('mod', m.id, perm.id)} /></td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};



const SystemModulePage = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form] = Form.useForm();
    const [allPermissions, setAllPermissions] = useState([]);
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("matrix");
    const [matrixData, setMatrixData] = useState({
        permissions: [],
        plans: [],
        modules: [],
        plan_permissions: [],
        module_permissions: []
    });
    const [modifiedPlanMappings, setModifiedPlanMappings] = useState({});
    const [modifiedModuleMappings, setModifiedModuleMappings] = useState({});
    const { setProfile, setPermissions } = useProfileStore();

    const [activeMatrixTarget, setActiveMatrixTarget] = useState(null);

    useEffect(() => {
        getList();
        getMatrix();
    }, []);

    useEffect(() => {
        if (matrixData.plans.length > 0 && !activeMatrixTarget) {
            setActiveMatrixTarget({ type: 'plan', id: matrixData.plans[0].id });
        }
    }, [matrixData.plans]);

    const getMatrix = async () => {
        setLoading(true);
        try {
            const res = await request("permission_matrix", "get");
            if (res && res.success) {
                setMatrixData(res);

                const planMaps = {};
                res.plans.forEach(p => {
                    planMaps[Number(p.id)] = res.plan_permissions
                        .filter(pp => Number(pp.plan_id) === Number(p.id))
                        .map(pp => Number(pp.permission_id));
                });
                setModifiedPlanMappings(planMaps);

                const modMaps = {};
                res.modules.forEach(m => {
                    modMaps[Number(m.id)] = res.module_permissions
                        .filter(mp => Number(mp.module_id) === Number(m.id))
                        .map(mp => Number(mp.permission_id));
                });
                setModifiedModuleMappings(modMaps);
            }
        } catch (error) {
            message.error("Failed to fetch matrix");
        } finally {
            setLoading(false);
        }
    };

    const [hasChanges, setHasChanges] = useState(false);

    const togglePermission = (type, targetId, permId) => {
        const targetIdNum = Number(targetId);
        const permNum = Number(permId);
        
        const targetPerm = matrixData.permissions.find(p => Number(p.id) === permNum);
        if (!targetPerm) return;
        
        const normalizedKey = targetPerm.route_key?.replace(/^\//, '').toLowerCase();
        const relatedIds = matrixData.permissions
            .filter(p => p.route_key?.replace(/^\//, '').toLowerCase() === normalizedKey)
            .map(p => Number(p.id));

        if (type === 'plan') {
            const current = modifiedPlanMappings[targetIdNum] || [];
            const isEnabled = current.includes(permNum);
            let updated;
            if (isEnabled) {
                updated = current.filter(id => !relatedIds.includes(Number(id)));
            } else {
                updated = [...new Set([...current, ...relatedIds])];
            }
            setModifiedPlanMappings({ ...modifiedPlanMappings, [targetIdNum]: updated });
        } else {
            const current = modifiedModuleMappings[targetIdNum] || [];
            const isEnabled = current.includes(permNum);
            let updated;
            if (isEnabled) {
                updated = current.filter(id => !relatedIds.includes(Number(id)));
            } else {
                updated = [...new Set([...current, ...relatedIds])];
            }
            setModifiedModuleMappings({ ...modifiedModuleMappings, [targetIdNum]: updated });
        }
        setHasChanges(true);
    };

    const handleSaveMatrix = async () => {
        setSaving(true);
        try {
            const res = await request("permission_matrix", "post", {
                plan_mappings: modifiedPlanMappings,
                module_mappings: modifiedModuleMappings
            });
            if (res && res.success) {
                message.success("Permission Matrix saved successfully!");
                setHasChanges(false);
                getMatrix();
                refreshCurrentUserState();
            }
        } catch (error) {
            message.error("Failed to save matrix");
        } finally {
            setSaving(false);
        }
    };

    const refreshCurrentUserState = async () => {
        try {
            const res = await request("auth/profile", "get");
            if (res && res.profile) {
                setProfile(res.profile);
                setPermissions(res.permission);
                broadcastRefresh(); // Notify other tabs to refresh
            }
        } catch (error) {
            console.error("Failed to sync user state:", error);
        }
    };



    const handleBulkToggle = (type, targetId, checked) => {
        const tId = Number(targetId);
        const action = checked ? 'បើក' : 'បិទ';
        const targetName = type === 'plan' 
            ? matrixData.plans.find(p => Number(p.id) === tId)?.name 
            : matrixData.modules.find(m => Number(m.id) === tId)?.name;

        Modal.confirm({
            title: `បញ្ជាក់ការ${action}មុខងារទាំងអស់`,
            content: `តើអ្នកពិតជាចង់ ${action} មុខងារទាំងអស់ក្នុង "${targetName}" មែនទេ? សកម្មភាពនេះនឹងមានឥទ្ធិពលទៅលើគ្រប់ហាងទាំងអស់ដែលប្រើប្រាស់កញ្ចប់នេះ។`,
            okText: action,
            okButtonProps: { danger: !checked },
            cancelText: 'បោះបង់',
            onOk: () => {
                const allIds = matrixData.permissions.map(p => p.id);
                let nextPlanMaps = { ...modifiedPlanMappings };
                let nextModMaps = { ...modifiedModuleMappings };

                if (type === 'plan') {
                    nextPlanMaps[targetId] = checked ? allIds : [];
                    setModifiedPlanMappings(nextPlanMaps);
                } else {
                    nextModMaps[targetId] = checked ? allIds : [];
                    setModifiedModuleMappings(nextModMaps);
                }
                setHasChanges(true);
            }
        });
    };

    const getList = async () => {
        setLoading(true);
        try {
            const res = await request("system_module", "get");
            if (res && res.list) {
                setList(res.list);
            }
        } catch (error) {
            message.error("Failed to fetch module list");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditId(null);
        form.resetFields();
        form.setFieldsValue({ status: 'active' });
        setVisible(true);
    };

    const handleEdit = (record) => {
        setEditId(record.id);
        form.setFieldsValue({
            ...record,
            status: record.status
        });
        setVisible(true);
    };

    const onFinish = async (values) => {
        setSaving(true);
        try {
            const method = editId ? "put" : "post";
            const data = editId ? { ...values, id: editId } : values;
            const res = await request("system_module", method, data);
            if (res && res.success) {
                message.success(res.message);
                setVisible(false);
                getList();
                getMatrix(); // Refresh matrix too
            }
        } catch (error) {
            message.error(error.message || "Failed to save module");
        } finally {
            setSaving(false);
        }
    };

    const handleManagePermissions = async (record) => {
        setActiveMatrixTarget({ type: 'mod', id: record.id });
        setActiveTab("matrix");
        message.info(`Managing permissions for ${record.name}`);
    };

    const columns = [
        {
            title: "Module Details",
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <Space>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: '#f0f5f1', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: '#1e4a2d'
                    }}>
                        {record.code?.includes('POS') ? <CoffeeOutlined /> :
                            record.code?.includes('ORDERING') ? <GlobalOutlined /> : <ShopOutlined />}
                    </div>
                    <div>
                        <Text strong style={{ fontSize: '15px', color: '#1e4a2d' }}>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px', fontWeight: 700, color: '#999' }}>CODE: {record.code?.toUpperCase()}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (text) => <Text type="secondary" style={{ fontSize: '13px' }}>{text || "N/A"}</Text>
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => <Tag color={status === 'active' ? 'success' : 'error'}>{status?.toUpperCase()}</Tag>
        },
        {
            title: "Management",
            key: "actions",
            align: 'right',
            render: (record) => (
                <Space>
                    <Tooltip title="Manage Permissions">
                        <Button
                            icon={<SafetyCertificateOutlined />}
                            onClick={() => handleManagePermissions(record)}
                            shape="circle"
                            style={{ color: '#faad14', borderColor: '#faad14' }}
                        />
                    </Tooltip>
                    <Tooltip title="Edit Details">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            shape="circle"
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            shape="circle"
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Are you sure?',
                                    content: 'This will delete the module and all its permission mappings.',
                                    onOk: async () => {
                                        const res = await request("system_module", "delete", { id: record.id });
                                        if (res && res.success) {
                                            message.success(res.message);
                                            getList();
                                            getMatrix();
                                        }
                                    }
                                });
                            }}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '12px 16px', background: '#f8f9fa', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0 10px' }}>
                    <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                        <Col>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: '#1e4a2d', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '18px'
                                }}>
                                    <AppstoreOutlined />
                                </div>
                                <div>
                                    <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
                                        System Feature Registry
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        Configure subscription tiers and functional modules.
                                    </Text>
                                </div>
                            </div>
                        </Col>
                        <Col>
                            <Space size="middle">
                                {hasChanges && (
                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        onClick={handleSaveMatrix}
                                        loading={saving}
                                        style={{ borderRadius: '8px', background: '#3b82f6', border: 'none', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                                    >
                                        Save Changes
                                    </Button>
                                )}
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleCreate}
                                    size="middle"
                                    style={{ borderRadius: '8px', background: '#1e4a2d', border: 'none' }}
                                >
                                    New Module
                                </Button>
                            </Space>
                        </Col>
                    </Row>

                    <Tabs activeKey={activeTab} onChange={setActiveTab} size="small" style={{ marginBottom: '12px' }}>
                        <TabPane tab="Feature Matrix (Auto-Sync)" key="matrix">
                            <MatrixTable
                                data={matrixData}
                                planMappings={modifiedPlanMappings}
                                modMappings={modifiedModuleMappings}
                                onToggle={togglePermission}
                                onBulkToggle={handleBulkToggle}
                                syncing={saving}
                                activeTarget={activeMatrixTarget}
                                setActiveTarget={setActiveMatrixTarget}
                            />
                        </TabPane>
                        <TabPane tab="Module Management" key="list">
                            <Card style={{ borderRadius: '20px', border: '1px solid #f1f5f9' }} bodyStyle={{ padding: 0 }}>
                                <Table
                                    columns={columns}
                                    dataSource={list}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={false}
                                    className="compact-table"
                                    size="small"
                                />
                            </Card>
                        </TabPane>
                    </Tabs>
                </div>

                <Modal
                    title={<Title level={3} style={{ margin: 0, color: '#1e4a2d' }}>
                        {editId ? 'Edit Module' : 'Create New Module'}
                    </Title>}
                    open={visible}
                    onCancel={() => setVisible(false)}
                    footer={null}
                    width={600}
                    centered
                    bodyStyle={{ padding: '24px 32px' }}
                >
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Row gutter={24}>
                            <Col span={24}>
                                <Form.Item name="name" label="Module Name (e.g., Core POS System)" rules={[{ required: true }]}>
                                    <Input size="large" placeholder="Enter module name" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="code" label="Internal Code (e.g., POS, ORDERING)" rules={[{ required: true }]}>
                                    <Input size="large" placeholder="UNIQUE_CODE" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="description" label="Marketing Description">
                                    <Input.TextArea rows={2} placeholder="What does this module do?" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="status" label="Active Status" valuePropName="checked">
                                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <div style={{ textAlign: 'right', marginTop: 32 }}>
                            <Space size="large">
                                <Button size="large" onClick={() => setVisible(false)}>Cancel</Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    style={{ background: '#1e4a2d', borderColor: '#1e4a2d', minWidth: 200, borderRadius: 12 }}
                                >
                                    Save Module
                                </Button>
                            </Space>
                        </div>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default SystemModulePage;
