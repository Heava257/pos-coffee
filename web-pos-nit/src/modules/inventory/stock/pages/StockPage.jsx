import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Button,
    Form,
    Input,
    message,
    Modal,
    Space,
    Table,
    Tag,
    Card,
    Typography,
    Select,
    InputNumber,
    Row,
    Col,
    Statistic,
    Tooltip,
    Divider,
    Empty,
    Tabs,
} from "antd";
import { 
    MdInventory, 
    MdTrendingDown, 
    MdHistory, 
    MdAdd, 
    MdSearch, 
    MdFilterList,
    MdMoreHoriz,
    MdWarning,
    MdCheckCircle,
    MdOutlineRotateLeft,
    MdAutoGraph,
    MdCalendarMonth,
    MdShowChart,
    MdMilitaryTech,
    MdTrendingUp,
    MdRocketLaunch,
    MdExtension,
    MdSchedule,
    MdCategory,
    MdAnalytics,
    MdDeleteSweep,
    MdAccountBalanceWallet,
    MdShoppingCartCheckout,
    MdInfo
} from "react-icons/md";
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, 
    Cell, PieChart, Pie
} from 'recharts';
import { useLanguage, translations } from "@/app/store/language.store";
import { useProfileStore } from "@/app/store/profileStore";
import MainPage from "@/app/layouts/MainPage";
import { formatDateClient, request } from "@/shared/utils/helper";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

// ─── Starbucks-Inspired Aesthetics ──────────────────────────────────────────
const COLORS = {
    primary: "#006241",    // Classic Starbucks Green
    secondary: "#1e3932",  // Deep Forest Green
    accent: "#d4e9e2",     // Light Sage
    gold: "#cba258",       // Premium Gold
    lightBg: "#f9fbf9",
    white: "#ffffff",
    danger: "#d62300",     // Refined Red
    warning: "#e4b000",
    textPrimary: "#2d2926",
    textSecondary: "#6b7177",
};

const SHADOWS = {
    soft: "0 4px 20px rgba(0, 98, 65, 0.05)",
    premium: "0 8px 30px rgba(0, 0, 0, 0.08)",
};

const StockPage = () => {
    const navigate = useNavigate();
    const { lang } = useLanguage();
    const { profile } = useProfileStore();
    const t = translations[lang];
    const [form] = Form.useForm();
    const [searchTerm, setSearchTerm] = useState("");
    const [state, setState] = useState({
        logs: [],
        products: [],
        rawMaterials: [],
        expenses: [],
        visibleModal: false,
        loading: false,
    });
    const [filters, setFilters] = useState({
        item_type: null,
        type: null,
        txtSearch: "",
    });

    // 🚀 DEBOUNCE SEARCH: Avoid hammering the API on every keystroke
    useEffect(() => {
        const handler = setTimeout(() => {
            setFilters(f => ({ ...f, txtSearch: searchTerm }));
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        getLogs();
        getItems();
        getExpenses();
    }, [filters]);

    const getExpenses = async () => {
        try {
            const today = dayjs().format("YYYY-MM-DD");
            const res = await request("expense", "get", { from_date: today, to_date: today });
            if (res && res.list) {
                setState(p => ({ ...p, expenses: res.list }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getLogs = async () => {
        setState((pre) => ({ ...pre, loading: true }));
        try {
            const res = await request("stock/logs", "get", filters);
            if (res && res.logs) {
                setState((pre) => ({
                    ...pre,
                    logs: res.logs || [],
                    loading: false,
                }));
            } else {
                setState((pre) => ({ ...pre, loading: false }));
            }
        } catch (e) {
            setState((pre) => ({ ...pre, loading: false }));
        }
    };

    const getItems = async () => {
        try {
            const [resProd, resRM] = await Promise.all([
                request("product", "get", { is_list_all: 1 }),
                request("raw_material", "get")
            ]);

            setState(p => ({
                ...p,
                products: (resProd && resProd.list) ? resProd.list : p.products,
                rawMaterials: (resRM && resRM.list) ? resRM.list : p.rawMaterials
            }));
        } catch (e) {
            console.error(e);
        }
    };

    const onFinish = async (values) => {
        setState(p => ({ ...p, loading: true }));
        const res = await request("stock/adjust", "post", values);
        setState(p => ({ ...p, loading: false }));
        if (res && !res.error) {
            message.success(res.message);
            setState((p) => ({ ...p, visibleModal: false }));
            form.resetFields();
            getLogs();
        } else {
            message.error(res?.message || "Adjustment failed");
        }
    };

    // ── Metrics ─────────────────────────────────────────────────────────────
    const lowStockProducts = state.products.filter(p => Number(p.qty || 0) <= 10).length;
    const lowStockMaterials = state.rawMaterials.filter(rm => Number(rm.qty || 0) <= 5).length;

    // --- Audit Logic ---
    const [auditState, setAuditState] = useState({
        active: false,
        items: [], // { id, name, system_qty, physical_qty, variance }
        category: 'product',
        loading: false
    });

    const startAudit = (category) => {
        const sourceItems = category === 'product' ? state.products : state.rawMaterials;
        setAuditState({
            active: true,
            category: category,
            items: sourceItems.map(item => ({
                id: item.id,
                name: item.name,
                code: item.code || item.barcode,
                system_qty: item.qty || 0,
                physical_qty: item.qty || 0,
                variance: 0
            })),
            loading: false
        });
    };

    const handlePhysicalQtyChange = (id, value) => {
        setAuditState(prev => {
            const newItems = prev.items.map(item => {
                if (item.id === id) {
                    const physical = Number(value) || 0;
                    return { ...item, physical_qty: physical, variance: physical - item.system_qty };
                }
                return item;
            });
            return { ...prev, items: newItems };
        });
    };

    // --- Intelligence Logic ---
    const calculateStockHealth = () => {
        // Group sales by item_id and calculate avg daily usage
        const sales = state.logs.filter(l => l.type === 'sale');
        if (sales.length === 0) return [];

        const itemUsage = {}; // { item_id_type: { total: 0, days: Set() } }
        sales.forEach(l => {
            const key = `${l.item_id}_${l.item_type}`;
            if (!itemUsage[key]) itemUsage[key] = { total: 0, days: new Set() };
            itemUsage[key].total += Math.abs(l.qty_changed);
            itemUsage[key].days.add(formatDateClient(l.created_at, "YYYY-MM-DD"));
        });

        const healthData = [];
        const allItems = [
            ...state.products.map(p => ({ ...p, item_type: 'product' })),
            ...state.rawMaterials.map(rm => ({ ...rm, item_type: 'raw_material' }))
        ];

        allItems.forEach(item => {
            const key = `${item.id}_${item.item_type}`;
            const usage = itemUsage[key];
            const avg = usage ? (usage.total / usage.days.size) : 0;
            const daysLeft = avg > 0 ? (item.qty / avg) : (item.qty > 0 ? 999 : 0);
            
            healthData.push({
                ...item,
                avg_usage: avg,
                days_left: daysLeft,
                run_out_date: avg > 0 ? dayjs().add(Math.floor(daysLeft), 'day') : null
            });
        });

        return healthData.sort((a, b) => a.days_left - b.days_left);
    };

    const calculateMenuAnalysis = () => {
        const sales = state.logs.filter(l => l.type === 'sale' && l.item_type === 'product');
        if (sales.length === 0) return [];

        const salesStats = {}; // { product_id: { count: 0, revenue: 0 } }
        sales.forEach(l => {
            if (!salesStats[l.item_id]) salesStats[l.item_id] = { count: 0, revenue: 0 };
            salesStats[l.item_id].count += Math.abs(l.qty_changed);
        });

        const analysisData = state.products.map(p => {
            const stats = salesStats[p.id] || { count: 0 };
            const cost = p.cost || (p.price * 0.4); // Fallback to 40% if cost is missing
            const margin = p.price - cost;
            const totalProfit = margin * stats.count;

            return {
                ...p,
                count: stats.count,
                margin: margin,
                totalProfit: totalProfit,
                margin_percent: p.price > 0 ? (margin / p.price) * 100 : 0
            };
        });

        // Calculate averages for categorization
        const avgCount = analysisData.reduce((acc, item) => acc + item.count, 0) / analysisData.length;
        const avgMargin = analysisData.reduce((acc, item) => acc + item.margin, 0) / analysisData.length;

        return analysisData.map(item => {
            let category = "DOG";
            if (item.count >= avgCount && item.margin >= avgMargin) category = "STAR";
            else if (item.count >= avgCount && item.margin < avgMargin) category = "PLOWHORSE";
            else if (item.count < avgCount && item.margin >= avgMargin) category = "PUZZLE";

            return { ...item, category };
        }).sort((a, b) => b.totalProfit - a.totalProfit);
    };

    const calculateBusinessInsights = () => {
        const today = dayjs().format("YYYY-MM-DD");
        const sales = state.logs.filter(l => l.type === 'sale' && formatDateClient(l.created_at, "YYYY-MM-DD") === today);
        
        // 1. Basic Stats
        let totalRevenue = 0;
        sales.forEach(l => {
            const amount = l.total_amount || (Math.abs(l.qty_changed) * (l.price || 0));
            totalRevenue += amount;
        });

        const orderIds = new Set(sales.map(l => l.order_id || l.ref_id).filter(id => id));
        const totalOrders = orderIds.size;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // 2. Hourly Trend (Peak Hours)
        const hourlyData = Array.from({ length: 24 }, (_, i) => {
            const label = dayjs().hour(i).format("h A");
            return {
                hour: label,
                orders: 0,
                revenue: 0,
                rawHour: i
            };
        });

        sales.forEach(l => {
            const h = dayjs(l.created_at).hour();
            if (hourlyData[h]) {
                const amount = l.total_amount || (Math.abs(l.qty_changed) * (l.price || 0));
                hourlyData[h].revenue += amount;
                hourlyData[h].orders += 1;
            }
        });

        // 3. Category Mix
        const categoryDataMap = {};
        sales.forEach(l => {
            const catName = l.category_name || "General";
            if (!categoryDataMap[catName]) {
                categoryDataMap[catName] = { name: catName, value: 0 };
            }
            const amount = l.total_amount || (Math.abs(l.qty_changed) * (l.price || 0));
            categoryDataMap[catName].value += amount;
        });
        const categoryData = Object.values(categoryDataMap).sort((a, b) => b.value - a.value);

        return {
            kpis: {
                revenue: totalRevenue,
                orders: totalOrders,
                aov: avgOrderValue
            },
            hourlyTrend: hourlyData.filter(d => d.rawHour >= 6 && d.rawHour <= 22),
            categoryMix: categoryData
        };
    };

    const calculateWastageInsights = () => {
        const wasteLogs = state.logs.filter(l => (l.type === 'waste' || l.type === 'adjustment') && l.qty_changed < 0);
        
        let totalLossValue = 0;
        const reasonMap = {};
        const itemMap = {};

        wasteLogs.forEach(l => {
            const cost = l.unit_cost || l.price * 0.4 || 1;
            const lossAmount = Math.abs(l.qty_changed) * cost;
            totalLossValue += lossAmount;

            // Reason Analysis
            const reason = l.reason || "Other";
            if (!reasonMap[reason]) reasonMap[reason] = { name: reason, value: 0 };
            reasonMap[reason].value += lossAmount;

            // Item Analysis
            if (!itemMap[l.item_id]) itemMap[l.item_id] = { name: l.item_name || "Unknown", value: 0, qty: 0 };
            itemMap[l.item_id].value += lossAmount;
            itemMap[l.item_id].qty += Math.abs(l.qty_changed);
        });

        const topItems = Object.values(itemMap).sort((a, b) => b.value - a.value).slice(0, 5);
        const reasonMix = Object.values(reasonMap).sort((a, b) => b.value - a.value);

        return {
            totalLoss: totalLossValue,
            reasonMix,
            topItems
        };
    };

    const calculateFinancialSnapshot = () => {
        const today = dayjs().format("YYYY-MM-DD");
        const sales = state.logs.filter(l => l.type === 'sale' && dayjs(l.created_at).format("YYYY-MM-DD") === today);
        
        let netSales = 0;
        let totalCOGS = 0;
        
        sales.forEach(l => {
            const revenue = l.total_amount || (Math.abs(l.qty_changed) * (l.price || 0));
            const cost = Math.abs(l.qty_changed) * (l.unit_cost || (l.price * 0.4) || 0.5);
            netSales += revenue;
            totalCOGS += cost;
        });

        const totalExpenses = state.expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
        const grossProfit = netSales - totalCOGS;
        const netProfit = grossProfit - totalExpenses;
        const margin = netSales > 0 ? (netProfit / netSales) * 100 : 0;

        return {
            netSales,
            totalCOGS,
            totalExpenses,
            grossProfit,
            netProfit,
            margin
        };
    };

    const calculateItemForecast = (id, type) => {
        const logs = state.logs.filter(l => l.item_id === id && l.item_type === type && l.type === 'sale');
        if (logs.length === 0) return { avgDaily: 0, daysLeft: 999 };

        const totalQty = logs.reduce((sum, l) => sum + Math.abs(l.qty_changed), 0);
        const days = new Set(logs.map(l => dayjs(l.created_at).format("YYYY-MM-DD")));
        const avgDaily = totalQty / days.size;
        
        return {
            avgDaily,
            daysCount: days.size
        };
    };

    const calculateReorderRecommendations = () => {
        const recommendations = [];
        
        // Combine products and raw materials for checking
        const allItems = [
            ...state.products.map(p => ({ ...p, type: 'product', current_qty: p.stock_qty || 0 })),
            ...state.rawMaterials.map(rm => ({ ...rm, type: 'raw_material', current_qty: rm.qty || 0 }))
        ];

        allItems.forEach(item => {
            const consumption = calculateItemForecast(item.id, item.type);
            const avgDaily = consumption.avgDaily;
            
            if (avgDaily > 0) {
                const daysLeft = item.current_qty / avgDaily;
                
                // If it will run out in less than 7 days, recommend reorder
                if (daysLeft < 7) {
                    const recommendedQty = Math.ceil((avgDaily * 7) - item.current_qty);
                    recommendations.push({
                        ...item,
                        daysLeft: daysLeft.toFixed(1),
                        recommendedQty: recommendedQty > 0 ? recommendedQty : 0,
                        riskLevel: daysLeft < 2 ? 'High' : daysLeft < 5 ? 'Medium' : 'Low'
                    });
                }
            } else if (item.current_qty <= (item.min_stock || 5)) {
                // Also recommend if below min_stock even if no recent sales
                recommendations.push({
                    ...item,
                    daysLeft: 'N/A',
                    recommendedQty: (item.par_level || 20) - item.current_qty,
                    riskLevel: 'Medium'
                });
            }
        });

        return recommendations.sort((a, b) => a.daysLeft - b.daysLeft);
    };

    const quickAdjust = (item) => {
        form.setFieldsValue({
            item_type: item.item_type,
            item_id: item.id,
            type: 'adjustment'
        });
        setState(s => ({ ...s, visibleModal: true }));
    };

    const commitAudit = async () => {
        const variances = auditState.items.filter(item => item.variance !== 0);
        if (variances.length === 0) {
            message.info(t.no_variance_msg || "No variances found. Everything is accurate!");
            setAuditState({ ...auditState, active: false });
            return;
        }

        Modal.confirm({
            title: t.audit_commit_confirm,
            content: (t.audit_commit_confirm_desc || "This will create {n} automatic adjustments...").replace("{n}", variances.length),
            centered: true,
            okText: t.confirm || "Confirm",
            cancelText: t.cancel,
            onOk: async () => {
                setAuditState(prev => ({ ...prev, loading: true }));
                let successCount = 0;
                for (const item of variances) {
                    try {
                        const res = await request("stock/adjust", "post", {
                            item_type: auditState.category,
                            item_id: item.id,
                            qty_changed: item.variance,
                            type: item.variance > 0 ? "adjustment" : "waste",
                            reason: "CORRECT",
                            custom_note: `Audit Correction: Physical=${item.physical_qty}, System=${item.system_qty}`
                        });
                        if (res && !res.error) successCount++;
                    } catch (e) {
                        console.error("Audit error", e);
                    }
                }
                
                const successMsg = (t.audit_success_msg || "Audit complete! Updated {successCount}/{total} discrepancies.")
                    .replace("{successCount}", successCount)
                    .replace("{total}", variances.length);
                message.success(successMsg);
                setAuditState({ active: false, items: [], category: 'product', loading: false });
                getLogs();
                getItems();
            }
        });
    };

    const columns = [
        {
            title: t.date_and_time_label,
            dataIndex: "created_at",
            width: 130,
            render: (d) => (
                <div style={{ fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, color: COLORS.textPrimary }}>{formatDateClient(d, "DD MMM YYYY")}</div>
                    <div style={{ color: COLORS.textSecondary }}>{formatDateClient(d, "HH:mm A")}</div>
                </div>
            )
        },
        {
            title: t.item_category_label,
            dataIndex: "item_type",
            width: 140,
            render: (v) => (
                <Tag style={{ 
                    borderRadius: 20, 
                    padding: '2px 12px',
                    fontWeight: 600,
                    border: 'none',
                    background: v === 'product' ? '#e6f4ff' : '#f6ffed',
                    color: v === 'product' ? '#0958d9' : '#389e0d'
                }}>
                    {(v === 'product' ? t.product : t.raw_material).toUpperCase()}
                </Tag>
            )
        },
        {
            title: t.item_name_label,
            dataIndex: "item_name",
            render: (name) => <span style={{ fontWeight: 800, color: COLORS.secondary }}>{name}</span>
        },
        {
            title: t.transaction_label,
            dataIndex: "type",
            render: (v) => {
                const types = {
                    sale: { color: "#006241", bg: "#d4e9e2", icon: "☕", label: t.sale_label },
                    purchase: { color: "#0958d9", bg: "#e6f4ff", icon: "📦", label: t.purchase },
                    receive: { color: "#722ed1", bg: "#f9f0ff", icon: "📥", label: t.receive },
                    adjustment: { color: "#fa8c16", bg: "#fff7e6", icon: "⚙️", label: t.adjustment },
                    waste: { color: "#f5222d", bg: "#fff1f0", icon: "🗑️", label: t.waste },
                };
                const config = types[v] || { color: "#595959", bg: "#f5f5f5", icon: "📝", label: v };
                return (
                    <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 6,
                        background: config.bg,
                        color: config.color,
                        padding: '2px 10px',
                        borderRadius: 6,
                        fontSize: '11px',
                        fontWeight: 700
                    }}>
                        <span>{config.icon}</span>
                        {config.label.toUpperCase()}
                    </div>
                );
            }
        },
        {
            title: t.change_label,
            dataIndex: "qty_changed",
            align: 'right',
            render: (v, r) => (
                <span style={{ 
                    color: v > 0 ? '#1e7b1e' : COLORS.danger, 
                    fontWeight: 900,
                    fontSize: '15px'
                }}>
                    {v > 0 ? `+${v.toLocaleString()}` : v.toLocaleString()} <span style={{ fontSize: 10 }}>{r.unit || r.unit_name}</span>
                </span>
            )
        },
        {
            title: t.balance_label,
            dataIndex: "new_qty",
            align: 'right',
            render: (v, r) => (
                <div style={{ 
                    fontWeight: 800, 
                    color: COLORS.textPrimary,
                    background: '#f1f1f1',
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 8,
                    minWidth: 50
                }}>
                    {v.toLocaleString()} <span style={{ fontSize: 10, opacity: 0.7 }}>{r.unit || r.unit_name}</span>
                </div>
            )
        },
        {
            title: t.authorized_by_label,
            dataIndex: "staff_name",
            render: (v) => <Text style={{ fontSize: '12px', fontWeight: 600 }}>👤 {v}</Text>
        },
        {
            title: t.reason_remark_label,
            dataIndex: "reason",
            ellipsis: true,
            render: (v) => <Text italic style={{ color: COLORS.textSecondary, fontSize: '13px' }}>{v || "---"}</Text>
        }
    ];

    const REASONS = [
        { value: 'BAR_ERR', label: t.reason_barista_error || 'Barista Error' },
        { value: 'SPILL', label: t.reason_spillage || 'Spillage' },
        { value: 'EXP', label: t.reason_expired || 'Item Expired' },
        { value: 'SMPL', label: t.reason_sampling || 'Customer Sampling' },
        { value: 'ST_USE', label: t.reason_store_use || 'Internal Store Use' },
        { value: 'CORRECT', label: t.reason_correction || 'General Stock Correction' }
    ];

    return (
        <MainPage loading={state.loading}>
            {/* Header Performance Section */}
            <div style={{ marginBottom: 30 }}>
                <Row gutter={[20, 20]}>
                    <Col xs={24} sm={12} lg={6}>
                        <div className="op-mini-card" style={{ padding: "15px 20px", position: 'relative', overflow: 'hidden' }}>
                            <MdInventory size={80} style={{ position: 'absolute', right: -10, top: -10, color: 'rgba(30, 74, 45, 0.05)' }} />
                            <Statistic 
                                title={<span style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>{t.available_products}</span>}
                                value={state.products.length}
                                valueStyle={{ color: 'var(--theme-dark-green)', fontWeight: 900, fontSize: 32 }}
                                prefix={<MdInventory size={20} style={{ marginRight: 8 }} />}
                            />
                        </div>
                    </Col>
                    {Number(profile?.plan_id) >= 2 && (
                        <Col xs={24} sm={12} lg={6}>
                            <div className="op-mini-card" style={{ padding: "15px 20px", position: 'relative', overflow: 'hidden' }}>
                                <MdHistory size={80} style={{ position: 'absolute', right: -10, top: -10, color: 'rgba(30, 74, 45, 0.05)' }} />
                                <Statistic 
                                    title={<span style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>{t.raw_materials_ledger}</span>}
                                    value={state.rawMaterials.length}
                                    valueStyle={{ color: 'var(--theme-dark-green)', fontWeight: 900, fontSize: 32 }}
                                    prefix={<MdOutlineRotateLeft size={20} style={{ marginRight: 8 }} />}
                                />
                            </div>
                        </Col>
                    )}
                    <Col xs={24} sm={12} lg={6}>
                        <div className="op-mini-card" style={{ padding: "15px 20px", position: 'relative', overflow: 'hidden' }}>
                             <MdWarning size={80} style={{ position: 'absolute', right: -10, top: -10, color: 'rgba(0,0,0,0.05)' }} />
                            <Statistic 
                                title={<span style={{ color: lowStockProducts > 0 ? '#ef4444' : '#64748b', fontSize: 13, fontWeight: 700 }}>{t.product_alerts}</span>}
                                value={lowStockProducts}
                                valueStyle={{ color: lowStockProducts > 0 ? '#ef4444' : 'var(--theme-dark-green)', fontWeight: 900, fontSize: 32 }}
                                prefix={<MdWarning size={20} style={{ marginRight: 8 }} />}
                            />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} lg={Number(profile?.plan_id) >= 2 ? 6 : 12}>
                        <div className="op-mini-card" style={{ padding: "15px 20px", position: 'relative', overflow: 'hidden' }}>
                            <MdTrendingDown size={80} style={{ position: 'absolute', right: -10, top: -10, color: 'rgba(0,0,0,0.05)' }} />
                            <Statistic 
                                title={<span style={{ color: lowStockMaterials > 0 ? '#fa8c16' : '#64748b', fontSize: 13, fontWeight: 700 }}>{Number(profile?.plan_id) >= 2 ? t.ingredient_alerts : t.stock_alerts_general || "STOCK ALERTS"}</span>}
                                value={lowStockMaterials + lowStockProducts}
                                valueStyle={{ color: lowStockMaterials > 0 ? '#fa8c16' : 'var(--theme-dark-green)', fontWeight: 900, fontSize: 32 }}
                                suffix={<span style={{ fontSize: 14, marginLeft: 8 }}>{t.items_low}</span>}
                            />
                        </div>
                    </Col>
                </Row>
            </div>

            <Tabs
                defaultActiveKey="1"
                className="premium-tabs"
                items={[
                    {
                        key: "1",
                        label: (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
                                <MdHistory size={20} />
                                <span style={{ fontWeight: 700 }}>{t.stock_ledger_audit}</span>
                            </span>
                        ),
                        children: (
                            <Card bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft, padding: '10px' }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: 'wrap', marginBottom: 25, gap: 16 }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ padding: 10, background: `${COLORS.primary}10`, borderRadius: 14 }}>
                                                <MdHistory size={26} style={{ color: COLORS.primary }} />
                                            </div>
                                            <div>
                                                <Title level={3} style={{ margin: 0, color: COLORS.secondary, letterSpacing: '-0.5px' }}>{t.stock_ledger_audit}</Title>
                                                <Text type="secondary" style={{ fontSize: 13 }}>{t.stock_ledger_audit_desc}</Text>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <Button
                                            type="primary"
                                            icon={<MdAdd size={20} />}
                                            onClick={() => setState(s => ({ ...s, visibleModal: true }))}
                                            style={{ 
                                                background: COLORS.primary, 
                                                borderColor: COLORS.primary, 
                                                borderRadius: 12,
                                                height: 45,
                                                fontWeight: 700,
                                                boxShadow: "0 4px 12px rgba(0, 98, 65, 0.2)"
                                            }}
                                            size="large"
                                        >
                                            {t.manual_adjustment}
                                        </Button>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div style={{ 
                                    background: 'var(--theme-cream-card-bg)', 
                                    padding: '20px', 
                                    borderRadius: 18, 
                                    marginBottom: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 15,
                                    border: '1.5px solid var(--theme-dark-green)'
                                }}>
                                    <MdFilterList size={22} style={{ color: COLORS.textSecondary }} />
                                    <Space size="large" style={{ flex: 1 }}>
                                        <Select
                                            placeholder={t.all}
                                            allowClear
                                            style={{ width: 180 }}
                                            onChange={(v) => setFilters(f => ({ ...f, item_type: v }))}
                                        >
                                            <Option value="product">☕ {t.product}</Option>
                                            {Number(profile?.plan_id) >= 2 && <Option value="raw_material">🌿 {t.raw_material}</Option>}
                                        </Select>
                                        <Select
                                            placeholder={t.transaction}
                                            allowClear
                                            style={{ width: 180 }}
                                            onChange={(v) => setFilters(f => ({ ...f, type: v }))}
                                        >
                                            <Option value="purchase">📦 {t.purchase}</Option>
                                            <Option value="sale">💳 {t.sale}</Option>
                                            <Option value="adjustment">⚙️ {t.adjustment}</Option>
                                            <Option value="waste">🗑️ {t.waste}</Option>
                                            <Option value="transfer_in">📥 {t.receive} In</Option>
                                            <Option value="transfer_out">📤 {t.stock_transfer} Out</Option>
                                        </Select>
                                        <Input 
                                            prefix={<MdSearch size={18} style={{ color: '#aaa' }} />}
                                            placeholder={t.search}
                                            style={{ width: 250, borderRadius: 10 }}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </Space>
                                    <Tooltip title="Reset Filters">
                                        <Button shape="circle" icon={<MdAdd style={{ transform: 'rotate(45deg)' }} />} onClick={() => {
                                            setSearchTerm("");
                                            setFilters({ item_type: null, type: null, txtSearch: "" });
                                        }} />
                                    </Tooltip>
                                </div>

                                <Table
                                    dataSource={state.logs}
                                    rowKey="id"
                                    pagination={{ pageSize: 15, showTotal: (total) => `${t.total} ${total} ${t.movements_found}` }}
                                    columns={columns}
                                    loading={state.loading}
                                    size="middle"
                                />
                            </Card>
                        )
                    },
                    {
                        key: "2",
                        label: (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
                                <MdCheckCircle size={20} />
                                <span style={{ fontWeight: 700 }}>{t.physical_stock_audit || "Physical Audit"}</span>
                            </span>
                        ),
                        children: (
                            <Card bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft, padding: '30px', minHeight: 400 }}>
                                {!auditState.active ? (
                                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                        <div style={{ marginBottom: 24 }}>
                                            <div style={{ 
                                                width: 100, 
                                                height: 100, 
                                                background: `${COLORS.primary}10`, 
                                                borderRadius: '50%', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                margin: '0 auto'
                                            }}>
                                                <MdInventory size={50} style={{ color: COLORS.primary }} />
                                            </div>
                                        </div>
                                        <Title level={2}>{t.start_new_audit || "Start New Physical Audit"}</Title>
                                        <Text type="secondary" style={{ display: 'block', maxWidth: 500, margin: '0 auto 32px' }}>
                                            {t.audit_instructions || "Select a category to begin a physical stock count..."}
                                        </Text>
                                        <Space size="large">
                                            <Button 
                                                size="large" 
                                                type="primary" 
                                                icon={<MdInventory />}
                                                style={{ height: 55, padding: '0 40px', borderRadius: 15, background: COLORS.primary, fontWeight: 700 }}
                                                onClick={() => startAudit('product')}
                                            >
                                                {t.audit_product_title || "Audit Products"}
                                            </Button>
                                            {Number(profile?.plan_id) >= 2 && (
                                                <Button 
                                                    size="large" 
                                                    icon={<MdOutlineRotateLeft />}
                                                    style={{ height: 55, padding: '0 40px', borderRadius: 15, fontWeight: 700 }}
                                                    onClick={() => startAudit('raw_material')}
                                                >
                                                    {t.audit_material_title || "Audit Raw Materials"}
                                                </Button>
                                            )}
                                        </Space>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                                            <div>
                                                <Title level={3} style={{ margin: 0 }}>
                                                    {auditState.category === 'product' ? t.audit_product_title : t.audit_material_title}
                                                </Title>
                                                <Text type="secondary">{(t.audit_items_count || "Reviewing {n} items").replace("{n}", auditState.items.length)}</Text>
                                            </div>
                                            <Space>
                                                <Button size="large" style={{ borderRadius: 12 }} onClick={() => setAuditState({ ...auditState, active: false })}>{t.cancel}</Button>
                                                <Button 
                                                    size="large" 
                                                    type="primary" 
                                                    loading={auditState.loading}
                                                    style={{ borderRadius: 12, background: COLORS.primary, fontWeight: 700 }}
                                                    onClick={commitAudit}
                                                >
                                                    {t.complete_commit_btn || "Complete & Commit Audit"}
                                                </Button>
                                            </Space>
                                        </div>

                                        <Table
                                            dataSource={auditState.items}
                                            rowKey="id"
                                            pagination={false}
                                            columns={[
                                                {
                                                    title: t.item_name_label || "ITEM",
                                                    render: (_, r) => (
                                                        <div>
                                                            <div style={{ fontWeight: 800 }}>{r.name}</div>
                                                            <div style={{ fontSize: 11, color: '#999' }}>{r.code}</div>
                                                        </div>
                                                    )
                                                },
                                                {
                                                    title: t.system_qty_label || "SYSTEM QTY",
                                                    dataIndex: "system_qty",
                                                    align: 'center',
                                                    render: (v) => <span style={{ fontWeight: 700, color: '#666' }}>{v}</span>
                                                },
                                                {
                                                    title: t.physical_count_label || "PHYSICAL COUNT",
                                                    width: 150,
                                                    render: (_, r) => (
                                                        <InputNumber
                                                            min={0}
                                                            value={r.physical_qty}
                                                            onChange={(val) => handlePhysicalQtyChange(r.id, val)}
                                                            style={{ width: '100%', borderRadius: 8, fontWeight: 800 }}
                                                            size="large"
                                                        />
                                                    )
                                                },
                                                {
                                                    title: t.variance_label || "VARIANCE",
                                                    align: 'right',
                                                    render: (_, r) => {
                                                        const color = r.variance === 0 ? '#333' : (r.variance > 0 ? '#22c55e' : '#ef4444');
                                                        return (
                                                            <div style={{ fontWeight: 900, color: color, fontSize: 16 }}>
                                                                {r.variance > 0 ? `+${r.variance}` : r.variance}
                                                                {r.variance !== 0 && (
                                                                    <div style={{ fontSize: 10, fontWeight: 400 }}>
                                                                        {r.variance > 0 ? t.extra_stock_label : t.missing_stock_label}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                }
                                            ]}
                                        />
                                    </div>
                                )}
                            </Card>
                        )
                    },
                    {
                        key: "3",
                        label: (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
                                <MdAutoGraph size={20} />
                                <span style={{ fontWeight: 700 }}>{t.stock_intelligence_title}</span>
                            </span>
                        ),
                        children: (
                            <div style={{ padding: '10px' }}>
                                <Row gutter={[20, 20]}>
                                    {calculateStockHealth().filter(h => h.avg_usage > 0 || h.qty <= 10).map((item, idx) => {
                                        const isUrgent = item.days_left <= 3;
                                        const isCritical = item.days_left <= 1 || item.qty <= 0;
                                        
                                        return (
                                            <Col xs={24} sm={12} lg={8} key={idx}>
                                                <Card bordered={false} style={{ 
                                                    borderRadius: 24, 
                                                    boxShadow: SHADOWS.soft,
                                                    border: isCritical ? '2px solid #ef4444' : (isUrgent ? '2px solid #f59e0b' : 'none')
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                                                        <div>
                                                            <Tag color={item.item_type === 'product' ? 'blue' : 'green'} style={{ borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                                                                {item.item_type.toUpperCase()}
                                                            </Tag>
                                                            <div style={{ fontWeight: 800, fontSize: 18, marginTop: 4, color: COLORS.secondary }}>{item.name}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: 24, fontWeight: 900, color: isCritical ? '#ef4444' : COLORS.primary }}>
                                                                {item.qty} <span style={{ fontSize: 14, fontWeight: 600 }}>{item.unit || item.unit_name}</span>
                                                            </div>
                                                            <div style={{ fontSize: 10, color: '#999', fontWeight: 600 }}>{t.balance_label}</div>
                                                        </div>
                                                    </div>

                                                    <Divider style={{ margin: '12px 0' }} />

                                                    <Row gutter={12}>
                                                        <Col span={12}>
                                                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{t.avg_daily_usage}</div>
                                                            <div style={{ fontWeight: 800, fontSize: 14 }}>{item.avg_usage.toFixed(2)} {item.unit || item.unit_name} / day</div>
                                                        </Col>
                                                        <Col span={12} style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{t.days_left_label}</div>
                                                            <div style={{ 
                                                                fontWeight: 900, 
                                                                fontSize: 16, 
                                                                color: isCritical ? '#ef4444' : (isUrgent ? '#f59e0b' : COLORS.primary) 
                                                            }}>
                                                                {item.days_left > 100 ? "∞" : Math.floor(item.days_left)} {t.days_left_label.includes("ថ្ងៃ") ? "ថ្ងៃ" : "Days"}
                                                            </div>
                                                        </Col>
                                                    </Row>

                                                    <div style={{ 
                                                        marginTop: 20, 
                                                        padding: '12px', 
                                                        background: isCritical ? '#fef2f2' : (isUrgent ? '#fffbeb' : '#f0fdf4'),
                                                        borderRadius: 14,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 10
                                                    }}>
                                                        {isCritical ? <MdWarning color="#ef4444" size={20} /> : (isUrgent ? <MdShowChart color="#f59e0b" size={20} /> : <MdCheckCircle color="#22c55e" size={20} />)}
                                                        <div style={{ fontSize: 12, fontWeight: 700, color: isCritical ? '#ef4444' : (isUrgent ? '#b45309' : '#166534') }}>
                                                            {isCritical || isUrgent ? t.replenish_urgent : t.stock_health_good}
                                                            {item.run_out_date && (
                                                                <div style={{ fontSize: 10, opacity: 0.8 }}>
                                                                    {t.run_out_date_label}: {item.run_out_date.format("DD MMM YYYY")}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
                                                        <Button 
                                                            size="small" 
                                                            block 
                                                            style={{ borderRadius: 8, fontSize: 11, fontWeight: 700 }}
                                                            onClick={() => quickAdjust(item)}
                                                        >
                                                            ⚙️ {t.adjust_now_btn}
                                                        </Button>
                                                        {item.item_type === 'raw_material' && (
                                                            <Button 
                                                                size="small" 
                                                                type="primary" 
                                                                block 
                                                                style={{ borderRadius: 8, fontSize: 11, fontWeight: 700, background: COLORS.secondary }}
                                                                onClick={() => window.location.href = '/purchase'}
                                                            >
                                                                📦 {t.go_to_purchase}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                    {calculateStockHealth().filter(h => h.avg_usage > 0 || h.qty <= 10).length === 0 && (
                                        <Col span={24}>
                                            <Empty description="Not enough sales data to generate intelligence report yet." />
                                        </Col>
                                    )}
                                </Row>
                            </div>
                        )
                    },
                    {
                        key: "4",
                        label: (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
                                <MdTrendingUp size={20} />
                                <span style={{ fontWeight: 700 }}>{t.profit_analysis_title}</span>
                            </span>
                        ),
                        children: (
                            <div style={{ padding: '10px' }}>
                                <Row gutter={[20, 20]}>
                                    {calculateMenuAnalysis().map((item, idx) => {
                                        const config = {
                                            STAR: { label: t.star_item_label, color: '#3b82f6', bg: '#eff6ff', icon: <MdRocketLaunch size={24} /> },
                                            PLOWHORSE: { label: t.plowhorse_item_label, color: '#10b981', bg: '#ecfdf5', icon: <MdMilitaryTech size={24} /> },
                                            PUZZLE: { label: t.puzzle_item_label, color: '#f59e0b', bg: '#fffbeb', icon: <MdExtension size={24} /> },
                                            DOG: { label: t.dog_item_label, color: '#ef4444', bg: '#fef2f2', icon: <MdWarning size={24} /> }
                                        }[item.category];

                                        return (
                                            <Col xs={24} sm={12} lg={12} key={idx}>
                                                <Card bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft, padding: '5px' }}>
                                                    <div style={{ display: 'flex', gap: 20 }}>
                                                        <div style={{ 
                                                            width: 80, 
                                                            height: 80, 
                                                            borderRadius: 20, 
                                                            background: config.bg, 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                            color: config.color
                                                        }}>
                                                            {config.icon}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <div>
                                                                    <div style={{ fontSize: 12, fontWeight: 700, color: config.color }}>{config.label}</div>
                                                                    <Title level={4} style={{ margin: '4px 0 0', fontWeight: 800 }}>{item.name}</Title>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <div style={{ fontSize: 20, fontWeight: 900, color: COLORS.primary }}>${item.totalProfit.toFixed(2)}</div>
                                                                    <div style={{ fontSize: 10, color: '#999', fontWeight: 700 }}>{t.total_contribution}</div>
                                                                </div>
                                                            </div>
                                                            
                                                            <Divider style={{ margin: '15px 0' }} />
                                                            
                                                            <Row gutter={16}>
                                                                <Col span={8}>
                                                                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{t.order_count}</div>
                                                                    <div style={{ fontWeight: 800, fontSize: 14 }}>{item.count} {t.items}</div>
                                                                </Col>
                                                                <Col span={8}>
                                                                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{t.margin_per_unit}</div>
                                                                    <div style={{ fontWeight: 800, fontSize: 14 }}>${item.margin.toFixed(2)}</div>
                                                                </Col>
                                                                <Col span={8}>
                                                                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{t.profit_margin}</div>
                                                                    <div style={{ fontWeight: 800, fontSize: 14, color: '#10b981' }}>{item.margin_percent.toFixed(0)}%</div>
                                                                </Col>
                                                            </Row>

                                                            <div style={{ 
                                                                marginTop: 15, 
                                                                padding: '10px 15px', 
                                                                background: '#f8fafc', 
                                                                borderRadius: 12,
                                                                fontSize: 12,
                                                                color: '#475569',
                                                                fontWeight: 600,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 8
                                                            }}>
                                                                <MdAutoGraph style={{ color: COLORS.primary }} />
                                                                {item.category === 'STAR' && (t.rec_star || "Highly Profitable!")}
                                                                {item.category === 'PLOWHORSE' && (t.rec_plowhorse || "Popular but Low Margin.")}
                                                                {item.category === 'PUZZLE' && (t.rec_puzzle || "Great Profit but Low Sales.")}
                                                                {item.category === 'DOG' && (t.rec_dog || "Poor performance.")}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            </div>
                        )
                    },
                    {
                        key: "5",
                        label: (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
                                <MdAnalytics size={20} />
                                <span style={{ fontWeight: 700 }}>{t.business_insights_title}</span>
                            </span>
                        ),
                        children: (() => {
                            const insights = calculateBusinessInsights();
                            return (
                                <div style={{ padding: '10px' }}>
                                    {/* KPI Header */}
                                    <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
                                        <Col xs={24} sm={8}>
                                            <Card bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft, background: COLORS.primary, color: '#fff' }}>
                                                <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 600 }}>{t.net_sales_label}</div>
                                                <div style={{ fontSize: 32, fontWeight: 900 }}>${insights.kpis.revenue.toFixed(2)}</div>
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <Card bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft }}>
                                                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{t.order_count_label}</div>
                                                <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.secondary }}>{insights.kpis.orders}</div>
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <Card bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft }}>
                                                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{t.avg_order_value}</div>
                                                <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.primary }}>${insights.kpis.aov.toFixed(2)}</div>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Row gutter={[20, 20]}>
                                        <Col xs={24} lg={16}>
                                            <Card title={<span style={{ fontWeight: 800 }}><MdSchedule size={18} style={{ marginRight: 8 }} /> {t.sales_trend_label}</span>} bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft }}>
                                                <div style={{ height: 350, width: '100%' }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={insights.hourlyTrend}>
                                                            <XAxis dataKey="hour" fontSize={11} fontWeight={600} stroke="#94a3b8" />
                                                            <YAxis fontSize={11} fontWeight={600} stroke="#94a3b8" />
                                                            <ChartTooltip 
                                                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: SHADOWS.soft }}
                                                                cursor={{ fill: '#f8fafc' }}
                                                            />
                                                            <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                                                                {insights.hourlyTrend.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.revenue === Math.max(...insights.hourlyTrend.map(d => d.revenue)) ? COLORS.primary : '#e2e8f0'} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div style={{ textAlign: 'center', marginTop: 10 }}>
                                                    <Tag color="gold" style={{ borderRadius: 6, fontWeight: 700 }}>
                                                        <MdTrendingUp /> {t.busiest_time_label}: {insights.hourlyTrend.length > 0 ? insights.hourlyTrend.reduce((prev, current) => (prev.revenue > current.revenue) ? prev : current).hour : 'N/A'}
                                                    </Tag>
                                                </div>
                                            </Card>
                                        </Col>

                                        <Col xs={24} lg={8}>
                                            <Card title={<span style={{ fontWeight: 800 }}><MdCategory size={18} style={{ marginRight: 8 }} /> {t.category_mix_label}</span>} bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft, height: '100%' }}>
                                                <div style={{ height: 300, width: '100%' }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={insights.categoryMix}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={80}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                            >
                                                                {insights.categoryMix.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={[COLORS.primary, COLORS.secondary, '#3a6a9a', '#9a5a2a', '#7a4a8a'][index % 5]} />
                                                                ))}
                                                            </Pie>
                                                            <ChartTooltip />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div style={{ marginTop: 10 }}>
                                                    {insights.categoryMix.map((cat, i) => (
                                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                                                            <span style={{ fontWeight: 600, color: '#64748b' }}>
                                                                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: [COLORS.primary, COLORS.secondary, '#3a6a9a', '#9a5a2a', '#7a4a8a'][i % 5], marginRight: 8 }}></span>
                                                                {cat.name}
                                                            </span>
                                                            <span style={{ fontWeight: 800 }}>${cat.value.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>
                                        </Col>
                                    </Row>
                                </div>
                            )
                        })()
                    },
                    {
                        key: "6",
                        label: (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
                                <MdDeleteSweep size={20} />
                                <span style={{ fontWeight: 700 }}>{t.wastage_intelligence_title}</span>
                            </span>
                        ),
                        children: (() => {
                            const waste = calculateWastageInsights();
                            return (
                                <div style={{ padding: '10px' }}>
                                    <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
                                        <Col xs={24} sm={12} lg={8}>
                                            <Card bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft, background: '#fee2e2', border: '1px solid #fecaca' }}>
                                                <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>{t.total_loss_value}</div>
                                                <div style={{ fontSize: 32, fontWeight: 900, color: '#b91c1c' }}>${waste.totalLoss.toFixed(2)}</div>
                                                <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, marginTop: 4 }}>
                                                    <MdWarning style={{ marginRight: 4 }} /> {t.cost_impact_label}
                                                </div>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Row gutter={[20, 20]}>
                                        <Col xs={24} lg={12}>
                                            <Card title={<span style={{ fontWeight: 800 }}>{t.waste_reason_mix}</span>} bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft }}>
                                                <div style={{ height: 300, width: '100%' }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={waste.reasonMix}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={80}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                            >
                                                                {waste.reasonMix.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={['#f43f5e', '#fb923c', '#facc15', '#94a3b8'][index % 4]} />
                                                                ))}
                                                            </Pie>
                                                            <ChartTooltip />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div style={{ marginTop: 10 }}>
                                                    {waste.reasonMix.map((r, i) => (
                                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                                                            <span style={{ fontWeight: 600, color: '#64748b' }}>
                                                                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: ['#f43f5e', '#fb923c', '#facc15', '#94a3b8'][i % 4], marginRight: 8 }}></span>
                                                                {r.name}
                                                            </span>
                                                            <span style={{ fontWeight: 800 }}>${r.value.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>
                                        </Col>

                                        <Col xs={24} lg={12}>
                                            <Card title={<span style={{ fontWeight: 800 }}>{t.top_wasted_items}</span>} bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft }}>
                                                {waste.topItems.map((item, idx) => (
                                                    <div key={idx} style={{ 
                                                        padding: '15px', 
                                                        background: '#f8fafc', 
                                                        borderRadius: 16, 
                                                        marginBottom: 10,
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}>
                                                        <div>
                                                            <div style={{ fontWeight: 800, fontSize: 15 }}>{item.name}</div>
                                                            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{item.qty} {t.items} {t.lost}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ color: '#ef4444', fontWeight: 900, fontSize: 16 }}>-${item.value.toFixed(2)}</div>
                                                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>{t.total_loss_value}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {waste.topItems.length === 0 && <Empty description="No wastage recorded today" />}
                                            </Card>
                                        </Col>
                                    </Row>
                                </div>
                            )
                        })()
                    },
                    {
                        key: "7",
                        label: (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
                                <MdAccountBalanceWallet size={20} />
                                <span style={{ fontWeight: 700 }}>{t.net_profit_intelligence_title}</span>
                            </span>
                        ),
                        children: (() => {
                            const fin = calculateFinancialSnapshot();
                            return (
                                <div style={{ padding: '10px' }}>
                                    <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
                                        <Col xs={24} sm={8}>
                                            <Card bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft, background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
                                                <div style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>{t.gross_profit_label}</div>
                                                <div style={{ fontSize: 32, fontWeight: 900, color: '#15803d' }}>${fin.grossProfit.toFixed(2)}</div>
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <Card bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft, background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)' }}>
                                                <div style={{ fontSize: 13, color: '#9f1239', fontWeight: 600 }}>{t.total_expenses_label}</div>
                                                <div style={{ fontSize: 32, fontWeight: 900, color: '#be123c' }}>${fin.totalExpenses.toFixed(2)}</div>
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <Card bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft, background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: `2px solid ${COLORS.primary}20` }}>
                                                <div style={{ fontSize: 13, color: '#075985', fontWeight: 600 }}>{t.net_profit_label}</div>
                                                <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.primary }}>${fin.netProfit.toFixed(2)}</div>
                                                <Tag color={fin.margin > 20 ? 'success' : 'warning'} style={{ borderRadius: 10, fontWeight: 800 }}>
                                                    {t.operating_margin}: {fin.margin.toFixed(1)}%
                                                </Tag>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Row gutter={[20, 20]}>
                                        <Col xs={24} lg={16}>
                                            <Card title={<span style={{ fontWeight: 800 }}>{t.p_and_l_summary}</span>} bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft }}>
                                                <div style={{ padding: '10px 0' }}>
                                                    {[
                                                        { label: t.net_sales_label, val: fin.netSales, color: COLORS.secondary },
                                                        { label: t.cogs_label, val: -fin.totalCOGS, color: '#f97316' },
                                                        { label: t.total_expenses_label, val: -fin.totalExpenses, color: '#ef4444' },
                                                        { label: t.net_profit_label, val: fin.netProfit, color: COLORS.primary, bold: true, border: true }
                                                    ].map((item, i) => (
                                                        <div key={i} style={{ 
                                                            display: 'flex', 
                                                            justifyContent: 'space-between', 
                                                            padding: '12px 0',
                                                            borderTop: item.border ? '2px dashed #e2e8f0' : 'none',
                                                            marginTop: item.border ? 10 : 0
                                                        }}>
                                                            <span style={{ fontWeight: 700, color: '#475569' }}>{item.label}</span>
                                                            <span style={{ fontWeight: 900, color: item.color, fontSize: item.bold ? 18 : 14 }}>
                                                                {item.val < 0 ? `-$${Math.abs(item.val).toFixed(2)}` : `$${item.val.toFixed(2)}`}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>
                                        </Col>
                                        <Col xs={24} lg={8}>
                                            <Card title={<span style={{ fontWeight: 800 }}>{t.profit_breakdown}</span>} bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft }}>
                                                <div style={{ height: 250 }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={[
                                                                    { name: t.cogs_label, value: fin.totalCOGS },
                                                                    { name: t.total_expenses_label, value: fin.totalExpenses },
                                                                    { name: t.net_profit_label, value: Math.max(0, fin.netProfit) }
                                                                ]}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={50}
                                                                outerRadius={70}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                            >
                                                                <Cell fill="#f97316" />
                                                                <Cell fill="#ef4444" />
                                                                <Cell fill={COLORS.primary} />
                                                            </Pie>
                                                            <ChartTooltip />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                                    {t.financial_health_msg}
                                                </div>
                                            </Card>
                                        </Col>
                                    </Row>
                                </div>
                            )
                        })()
                    },
                    {
                        key: "8",
                        label: (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
                                <MdShoppingCartCheckout size={20} />
                                <span style={{ fontWeight: 700 }}>{t.reorder_intelligence_title}</span>
                            </span>
                        ),
                        children: (() => {
                            const recs = calculateReorderRecommendations();
                            return (
                                <div style={{ padding: '10px' }}>
                                    <div style={{ marginBottom: 20, background: '#f0f9ff', padding: '15px 20px', borderRadius: 20, border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ background: '#0369a1', color: 'white', padding: 8, borderRadius: 10 }}><MdInfo /></div>
                                        <div style={{ fontSize: 14, color: '#0369a1', fontWeight: 600 }}>{t.reorder_hint}</div>
                                    </div>

                                    <Row gutter={[20, 20]}>
                                        {recs.map((item, idx) => (
                                            <Col key={idx} xs={24} md={12} lg={8}>
                                                <Card bordered={false} style={{ borderRadius: 24, boxShadow: SHADOWS.soft, border: item.riskLevel === 'High' ? '2px solid #fee2e2' : '1px solid #f1f5f9' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                                                        <div>
                                                            <Tag color={item.riskLevel === 'High' ? 'error' : item.riskLevel === 'Medium' ? 'warning' : 'processing'} style={{ borderRadius: 8, fontWeight: 800, marginBottom: 8 }}>
                                                                {item.riskLevel === 'High' ? 'CRITICAL' : item.riskLevel === 'Medium' ? 'LOW STOCK' : 'PLANNING'}
                                                            </Tag>
                                                            <div style={{ fontWeight: 800, fontSize: 18 }}>{item.name}</div>
                                                            <div style={{ fontSize: 12, color: '#64748b' }}>{t.days_until_out_of_stock}: <b style={{ color: item.riskLevel === 'High' ? '#ef4444' : '#0f172a' }}>{item.daysLeft} {t.days_label || 'Days'}</b></div>
                                                        </div>
                                                        <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 12, textAlign: 'right' }}>
                                                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>{t.current_stock}</div>
                                                            <div style={{ fontWeight: 900, fontSize: 16 }}>{item.current_qty}</div>
                                                        </div>
                                                    </div>

                                                    <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: 20, marginBottom: 20 }}>
                                                        <div style={{ fontSize: 12, color: '#166534', fontWeight: 700, marginBottom: 4 }}>{t.recommended_order_qty}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <span style={{ fontSize: 24, fontWeight: 900, color: '#15803d' }}>+{item.recommendedQty}</span>
                                                            <span style={{ fontSize: 14, color: '#15803d', fontWeight: 600 }}>{item.unit || item.purchase_unit}</span>
                                                        </div>
                                                    </div>

                                                    <Button 
                                                        type="primary" 
                                                        block 
                                                        size="large" 
                                                        style={{ borderRadius: 15, fontWeight: 800, height: 45, background: COLORS.secondary }}
                                                        icon={<MdShoppingCartCheckout />}
                                                        onClick={() => navigate("/purchase")}
                                                    >
                                                        {t.create_po_now}
                                                    </Button>
                                                </Card>
                                            </Col>
                                        ))}
                                        {recs.length === 0 && (
                                            <Col span={24}>
                                                <Empty description="All stock levels are healthy! No reorders needed." />
                                            </Col>
                                        )}
                                    </Row>
                                </div>
                            )
                        })()
                    }
                ].filter(item => {
                    // Plan Restrictions:
                    // Plan <= 5 (Web Ordering / Basic) can only see Ledger (1) and Physical Audit (2)
                    if (Number(profile?.plan_id) < 2) {
                        return ["1", "2"].includes(item.key);
                    }
                    return true;
                })}
            />

            <style>{`
                .premium-tabs .ant-tabs-nav::before { border-bottom: 2px solid #f0f0f0; }
                .premium-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: var(--theme-dark-green) !important; }
                .premium-tabs .ant-tabs-ink-bar { background: var(--theme-dark-green) !important; height: 3px !important; }
            `}</style>

            {/* Premium Adjustment Modal */}
            <Modal
                title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: `${COLORS.primary}15`, padding: 8, borderRadius: 8 }}><MdOutlineRotateLeft style={{ color: COLORS.primary }} /></div>
                    <span style={{ fontWeight: 800, color: COLORS.secondary }}>{t.stock_audit_correction}</span>
                </div>}
                open={state.visibleModal}
                onCancel={() => setState(s => ({ ...s, visibleModal: false }))}
                footer={null}
                centered
                width={500}
                styles={{ content: { borderRadius: 24, padding: 30 } }}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
                    {t.stock_adj_desc || "Adjust inventory manually..."}
                </Text>
                
                <Form layout="vertical" form={form} onFinish={onFinish}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="item_type" label={<span style={{ fontWeight: 700, fontSize: 13 }}>{t.inventory_item_type || "ITEM TYPE"}</span>} rules={[{ required: true }]} initialValue={Number(profile?.plan_id) < 2 ? "product" : undefined}>
                                <Select placeholder={t.select_item_type || "Pick level"} size="large" style={{ borderRadius: 10 }} onChange={() => form.setFieldValue("item_id", undefined)}>
                                    <Option value="product">☕ {t.finished_product_opt || "Finished Product"}</Option>
                                    {Number(profile?.plan_id) >= 2 && <Option value="raw_material">🌿 {t.raw_material_opt || "Raw Ingredient"}</Option>}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                             <Form.Item name="type" label={<span style={{ fontWeight: 700, fontSize: 13 }}>{t.action_type || "ACTION"}</span>} rules={[{ required: true }]}>
                                <Select placeholder={t.select_action || "Select action"} size="large" style={{ borderRadius: 10 }}>
                                    <Option value="adjustment">⚙️ {t.adjustment || "Correction (+/-)"}</Option>
                                    <Option value="waste">🗑️ {t.waste || "Wastage (-)"}</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) => prev.item_type !== curr.item_type}
                    >
                        {({ getFieldValue }) => {
                            const itemType = getFieldValue("item_type");
                            const items = itemType === 'product' ? state.products : state.rawMaterials;
                            const options = items.map(item => ({
                                label: `${item.name} ${item.code ? `(${item.code})` : ''}`,
                                value: item.id,
                                qty: item.qty || 0
                            }));

                            return (
                                <Form.Item name="item_id" label={<span style={{ fontWeight: 700, fontSize: 13 }}>{t.search_item || "SEARCH ITEM"}</span>} rules={[{ required: true }]}>
                                    <Select
                                        size="large"
                                        placeholder={t.search_product || "Type item name..."}
                                        showSearch
                                        optionFilterProp="label"
                                        options={options}
                                        style={{ borderRadius: 10 }}
                                        optionRender={(opt) => (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{opt.label}</span>
                                                <Tag color={opt.data.qty <= 0 ? "red" : "green"}>{opt.data.qty} {t.in_stock_badge || "in stock"}</Tag>
                                            </div>
                                        )}
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>

                    <Form.Item name="qty_changed" label={<span style={{ fontWeight: 700, fontSize: 13 }}>{t.qty_change || "QUANTITY CHANGE"}</span>} rules={[{ required: true }]}>
                        <InputNumber 
                            size="large" 
                            style={{ width: '100%', borderRadius: 10 }} 
                            placeholder={t.qty_adj_placeholder || "e.g. 10 to add, -5 to remove"} 
                        />
                    </Form.Item>

                    <Form.Item name="reason" label={<span style={{ fontWeight: 700, fontSize: 13 }}>{t.reason_label || "REASON FOR CHANGE"}</span>} rules={[{ required: true }]}>
                        <Select 
                            placeholder={t.reason_placeholder || "Select common reason..."} 
                            size="large" 
                            style={{ borderRadius: 10 }}
                            options={REASONS}
                            showSearch
                        />
                    </Form.Item>

                    <Form.Item name="custom_note" label={<span style={{ fontWeight: 700, fontSize: 13 }}>{t.remark_optional || "CUSTOM REMARK (OPTIONAL)"}</span>}>
                        <Input.TextArea rows={2} style={{ borderRadius: 12 }} placeholder={t.remark_placeholder || "Additional details..."} />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                        <Button onClick={() => setState(s => ({ ...s, visibleModal: false }))} block size="large" style={{ borderRadius: 12, height: 50, fontWeight: 600 }}>{t.discard}</Button>
                         <Button type="primary" htmlType="submit" block size="large" style={{ background: COLORS.primary, height: 50, borderRadius: 12, fontWeight: 800 }}>{t.submit_audit}</Button>
                    </div>
                </Form>
            </Modal>
        </MainPage>
    );
};

export default StockPage;
