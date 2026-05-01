// pages/OrderPage.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Row,
  Col,
  Card,
  Statistic,
  Tabs,
  Badge,
  Tooltip,
  Typography,
  Avatar,
  Divider,
  Empty,
  Image,
  notification,
  InputNumber,
} from "antd";
import { useReactToPrint } from "react-to-print";
import PrintShiftReport from "../../component/pos/PrintShiftReport";
import {
  ShoppingCartOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  ExportOutlined,
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShopOutlined,
  FileTextOutlined,
  TagOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { formatDateClient, formatDateServer, isPermission, request } from "../../util/helper";
import { configStore } from "../../store/configStore";
import { Config } from "../../util/config";
import { useProfileStore } from "../../store/profileStore";
import { useLanguage, translations } from "../../store/language.store";
import { useExchangeRate } from "../../component/pos/ExchangeRateContext";

import QRPaymentModal from "../../QRPaymentModal/QRPaymentModal";
import PrintLabel from "../../component/pos/PrintLabel";
import PrintInvoice from "../../component/pos/PrintInvoice";
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

function OrderPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const { config } = configStore();
  const [formRef] = Form.useForm();
  const [list, setList] = useState([]);
  const [orderDetail, setOrderDetail] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [summary, setSummary] = useState({
    total_order: 0,
    total_amount: 0,
    total_cash: 0,
    total_aba: 0,
    total_wing: 0,
    total_qty: 0,
    total_expense: 0,
    total_cash_expense: 0,
    top_products: []
  });
  const [loading, setLoading] = useState(false);
  const [openingCash, setOpeningCash] = useState(0);
  const [openingCashKHR, setOpeningCashKHR] = useState(0);
  const [actualCash, setActualCash] = useState(null);
  const [actualCashKHR, setActualCashKHR] = useState(null);
  const [remark, setRemark] = useState("");
  const [currentShift, setCurrentShift] = useState(null);
  const [visibleOpenShiftModal, setVisibleOpenShiftModal] = useState(false);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [visibleCloseShiftModal, setVisibleCloseShiftModal] = useState(false);
  const [closeShiftSummary, setCloseShiftSummary] = useState(null);
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [printSummary, setPrintSummary] = useState(null);
  const [printStaffName, setPrintStaffName] = useState("");
  const [printShiftDate, setPrintShiftDate] = useState(null);
  const [printOpeningUSD, setPrintOpeningUSD] = useState(0);
  const [printOpeningKHR, setPrintOpeningKHR] = useState(0);
  const refShiftReport = useRef(null);
  const { profile } = useProfileStore();
  const isOwner = profile?.role_name?.toUpperCase() === "OWNER" || profile?.role_code === "owner";
  const isAdmin = profile?.role_name?.toUpperCase().includes("ADMIN") || profile?.role_code === "admin";
  const canSeeAllReports = isOwner || isAdmin;
  const { exchangeRate } = useExchangeRate();
  const [branchInfo, setBranchInfo] = useState(null);
  const refLabel = useRef(null);
  const refInvoice = useRef(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrData, setQrData] = useState({ orderNo: "", total: 0 });

  const handlePrintShift = useReactToPrint({
    contentRef: refShiftReport,
  });

  const getCurrentShift = async () => {
    try {
      const res = await request("shift/current", "get");
      if (res && res.success && res.data) {
        setCurrentShift(res.data);
        setOpeningCash(Number(res.data.opening_cash_usd || 0).toFixed(2));
        setOpeningCashKHR(Number(res.data.opening_cash_khr || 0).toFixed(0));
      } else {
        setCurrentShift(null);
        // Removed auto-open: user will click 'Open Shift' manually.
        setVisibleOpenShiftModal(false);
      }
    } catch (error) {
      console.error("Error getting current shift:", error);
    }
  };

  const onOpenShift = async (values) => {
    const usd = Number(values.opening_cash_usd || 0);
    const khr = Number(values.opening_cash_khr || 0);

    const proceed = async () => {
      try {
        const data = {
          opening_cash_usd: usd,
          opening_cash_khr: khr,
        };
        const res = await request("shift/open", "post", data);
        if (res && res.success) {
          message.success(res.message);
          setVisibleOpenShiftModal(false);
          getCurrentShift(); // Refresh to get the shift ID
        } else {
          message.warning(res.message);
        }
      } catch (error) {
        console.error(error);
        message.error("Failed to open shift");
      }
    };

    if (usd === 0 && khr === 0) {
      Modal.confirm({
        title: 'Open with zero cash? / បើកបញ្ជីដោយគ្មានលុយដើម?',
        content: 'You are opening this shift with $0.00 and 0៛. Are you sure? / អ្នកកំពុងបើកបញ្ជីដោយគ្មានសាច់ប្រាក់ដើមគ្រាសោះ តើអ្នកប្រាកដទេ?',
        onOk: proceed,
        okText: 'Yes, Open / បាទ/ចាស បើក',
        cancelText: 'Cancel / បោះបង់'
      });
    } else {
      proceed();
    }
  };

  const handleOpenCloseShift = async () => {
    if (!currentShift) {
      setVisibleOpenShiftModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await request("shift/summary", "get");
      if (res && res.success) {
        setCloseShiftSummary(res.summary);
        setActualCash(null);
        setActualCashKHR(null);
        setRemark("");
        setVisibleCloseShiftModal(true);
      }
    } catch (error) {
      message.error("Failed to load shift summary");
    } finally {
      setLoading(false);
    }
  };

  const onConfirmCloseShift = async () => {
    if (!currentShift || !closeShiftSummary) return;

    const actual_usd = Number(actualCash || 0);
    const actual_khr = Number(actualCashKHR || 0);

    const proceed = async () => {
      setIsClosingShift(true);
      try {
        const opening_usd = Number(openingCash);
        const opening_khr = Number(openingCashKHR);

        const actual_total_usd = actual_usd + (actual_khr / exchangeRate);
        const expected_total_usd = closeShiftSummary.expected_cash_usd;
        const diff_usd = actual_total_usd - expected_total_usd;

        const data = {
          id: currentShift.id,
          opening_cash_usd: opening_usd,
          opening_cash_khr: opening_khr,
          actual_cash_usd: actual_usd,
          actual_cash_khr: actual_khr,
          expected_cash_usd: expected_total_usd,
          total_sales_usd: closeShiftSummary.total_sales_usd,
          total_cash_usd: closeShiftSummary.total_cash_usd,
          total_aba_usd: closeShiftSummary.total_aba_usd,
          total_wing_usd: closeShiftSummary.total_wing_usd,
          total_expense_usd: closeShiftSummary.total_expense_usd,
          diff_usd: diff_usd,
          remark: remark
        };

        const res = await request("shift", "post", data);
        if (res && res.success) {
          message.success("Shift Closed Successfully!");

          // Prepare for immediate print
          setPrintSummary(closeShiftSummary);
          setPrintStaffName(profile?.name || "Staff");
          setPrintShiftDate(dayjs());
          setPrintOpeningUSD(openingCash);
          setPrintOpeningKHR(openingCashKHR);

          setVisibleCloseShiftModal(false);
          setTimeout(() => {
            handlePrintShift();
            getCurrentShift();
            getShiftHistory();
            getList();
          }, 500);
        }
      } catch (error) {
        message.error("Shift closing failed");
      } finally {
        setIsClosingShift(false);
      }
    };

    if (actualCash === null || actualCashKHR === null) {
      message.warning("Please enter actual cash counts / សូមបញ្ចូលចំនួនសាច់ប្រាក់ជាក់ស្តែង");
      return;
    }

    if (actual_usd === 0 && actual_khr === 0) {
      Modal.confirm({
        title: 'Close with zero cash? / បិទបញ្ជីដោយគ្មានលុយ?',
        content: 'You are closing this shift with $0.00 and 0៛ actual cash count. Are you sure? / អ្នកកំពុងបិទបញ្ជីដោយគ្មានសាច់ប្រាក់រាប់បានសោះ តើអ្នកប្រាកដទេ?',
        onOk: proceed,
        okText: 'Yes, Close / បាទ/ចាស បិទ',
        cancelText: 'Cancel / បោះបង់'
      });
    } else {
      proceed();
    }
  };

  const handlePrintLabel = useReactToPrint({
    contentRef: refLabel,
    pageStyle: `@page { size: 40mm 30mm !important; margin: 0 !important; } @media print { body { -webkit-print-color-adjust: exact; margin: 0 !important; } }`,
  });

  const handlePrintInvoice = useReactToPrint({
    contentRef: refInvoice,
  });

  const [state, setState] = useState({
    visibleModal: false,
    visibleExpenseModal: false,
    txtSearch: "",
    activeTab: "1", // Initial state updated to match Segmented
  });

  // Determine default user filter: Owners/Admins see "All", Staff sees themselves
  const defaultUserId = canSeeAllReports ? "" : (profile?.id || profile?.user_id || "");

  const [filter, setFilter] = useState({
    from_date: dayjs(), // Default to Today
    to_date: dayjs(),
    user_id: defaultUserId,
  });

  // 🧠 Fetch Orders - Fixed to match backend response
  const getList = async () => {
    setLoading(true);
    try {
      const user_id = filter.user_id;
      const params = {
        from_date: formatDateServer(filter.from_date),
        to_date: formatDateServer(filter.to_date),
        txtSearch: state.txtSearch,
        user_id: user_id,
        // For staff, strictly filter by current shift ID if open. 
        // If no shift open, hide orders (send -1 as ID)
        shift_id: canSeeAllReports ? "" : (currentShift?.id || -1)
      };

      // Standardized API endpoint to match backend route
      const res = await request(`order`, "get", params);
      if (res && res.list) {
        setList(res.list || []);
        setSummary(res.summary || { total_order: 0, total_amount: 0 });
      } else {
        console.warn("Unexpected response format:", res);
        setList([]);
        setSummary({ total_order: 0, total_amount: 0 });
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      message.error(t.no_data);
      setList([]);
      setSummary({ total_order: 0, total_amount: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Fixed getOrderDetail function to match backend response
  const getOrderDetail = async (data) => {
    setLoading(true);
    try {
      const res = await request(`order/${data.id}`, "get");

      if (res) {
        const orderItems = res.list || res.items || res.details || [];
        const orderInfo = res.order || res.data || data;

        if (orderItems.length > 0 || orderInfo) {
          setOrderDetail(orderItems);
          setCurrentOrder(orderInfo);
          setState(prev => ({ ...prev, visibleModal: true }));
        } else {
          message.warning(t.no_data);
        }
      } else {
        message.warning(t.no_data);
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      message.error(t.failed);
    } finally {
      setLoading(false);
    }
  };

  const onSaveExpense = async (values) => {
    try {
      const data = {
        ...values,
        expense_date: formatDateServer(dayjs()), // Today
        shift_id: currentShift?.id
      };
      const res = await request("expense", "post", data);
      if (res && res.success) {
        message.success(res.message);
        setState(prev => ({ ...prev, visibleExpenseModal: false }));
        getList(); // Refresh summary
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to save expense");
    }
  };

  const onCloseModal = () => {
    formRef.resetFields();
    setOrderDetail([]);
    setCurrentOrder(null);
    setState(prev => ({ ...prev, visibleModal: false }));
  };

  const getShiftHistory = async () => {
    setLoadingHistory(true);
    try {
      const params = {
        from_date: formatDateServer(filter.from_date),
        to_date: formatDateServer(filter.to_date),
        user_id: filter.user_id,
      };
      const res = await request("shift", "get", params);
      if (res && res.list) {
        setShiftHistory(res.list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const profileUserId = profile?.id || profile?.user_id;

  // Sync filter.user_id with profile when profile loads
  useEffect(() => {
    if (profileUserId && !filter.user_id && !canSeeAllReports) {
      setFilter(prev => ({ ...prev, user_id: profileUserId }));
    }
  }, [profileUserId, canSeeAllReports]);

  const getBranchInfo = async () => {
    try {
      const res = await request("branch", "get");
      if (res && res.list) {
        const currentBranch = res.list.find(b => b.id === profile?.branch_id) || res.list[0];
        setBranchInfo(currentBranch);
      }
    } catch (error) {
      console.error("Error fetching branch info:", error);
    }
  };

  useEffect(() => {
    if (profileUserId) {
      getList();
      getCurrentShift();
      getShiftHistory();
      getBranchInfo();
    }
  }, [profileUserId, filter.user_id, filter.from_date, filter.to_date, currentShift?.id]);

  const handleSearch = () => {
    getList();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      completed: 'green',
      cancelled: 'red',
      processing: 'blue',
      paid: 'green',
      unpaid: 'red'
    };
    return colors[status?.toLowerCase()] || 'default';
  };

  const getStatusText = (status) => {
    if (!status) return t.unknown;
    const statusMap = {
      pending: t.pending,
      paid: t.paid,
      cancelled: t.cancelled,
      completed: t.paid,
      processing: t.pending
    };
    return statusMap[status.toLowerCase()] || status;
  };

  return (
    <div style={{
      padding: '16px',
      background: '#f4f6f8',
      minHeight: '100vh'
    }}>
      {/* Header Section */}
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ color: '#2d3748', margin: 0 }}>
          <ShopOutlined style={{ marginRight: 12 }} />
          {t.daily_closing_title}
        </Title>
        <Text style={{ color: '#6b7280', fontSize: 14 }}>
          {t.daily_closing_desc}
        </Text>
      </div>

      <style>{`
        .premium-table .ant-table-thead > tr > th {
          background-color: #1e4a2d !important;
          color: white !important;
          border-bottom: none !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          padding: 12px !important;
        }
        .premium-table .ant-table-tbody > tr > td {
          padding: 12px !important;
        }
        .premium-table .ant-table-tbody > tr:hover > td {
          background-color: #f0fdf4 !important;
        }
        .premium-table {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
      `}</style>

      {/* Summary Cards - Only visible to Owners/Admins */}
      {canSeeAllReports && (
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          {/* Total Orders Card */}
          <Col xs={24} sm={12} lg={4}>
            <div style={{
              background: '#fff',
              padding: '16px 12px',
              borderRadius: 16,
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}>
                <ShoppingCartOutlined style={{ fontSize: 20, color: '#1e4a2d' }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{summary.total_order || 0}</div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{t.total_orders_label}</div>
            </div>
          </Col>

          {/* Cash Card */}
          <Col xs={24} sm={12} lg={4}>
            <div style={{
              background: '#fff',
              padding: '24px 20px',
              borderRadius: 20,
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}>
                <DollarOutlined style={{ fontSize: 20, color: '#1e4a2d' }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>${(summary.total_cash || 0).toLocaleString()}</div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{t.dash_cash}</div>
            </div>
          </Col>

          {/* ABA Card */}
          <Col xs={24} sm={12} lg={4}>
            <div style={{
              background: '#fff',
              padding: '24px 20px',
              borderRadius: 20,
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}>
                <CheckCircleOutlined style={{ fontSize: 20, color: '#1e4a2d' }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>${(summary.total_aba || 0).toLocaleString()}</div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{t.dash_aba}</div>
            </div>
          </Col>

          {/* Wing Card */}
          <Col xs={24} sm={12} lg={4}>
            <div style={{
              background: '#fff',
              padding: '24px 20px',
              borderRadius: 20,
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#1e4a2d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>W</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>${(Number(summary.total_wing || 0) + Number(summary.total_other || 0)).toLocaleString()}</div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{t.dash_wing}</div>
            </div>
          </Col>

          {/* Expenses Card */}
          <Col xs={24} sm={12} lg={4}>
            <div style={{
              background: '#fff',
              padding: '24px 20px',
              borderRadius: 20,
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}>
                <ArrowDownOutlined style={{ fontSize: 20, color: '#1e4a2d' }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>${(summary.total_expense || 0).toLocaleString()}</div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{t.expenses}</div>
            </div>
          </Col>

          {/* Net Profit Card */}
          <Col xs={24} sm={12} lg={4}>
            <div style={{
              background: '#1e4a2d',
              padding: '24px 20px',
              borderRadius: 20,
              boxShadow: '0 10px 25px rgba(30, 74, 45, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              color: '#fff'
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}>
                <DollarOutlined style={{ fontSize: 20, color: '#fff' }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>${(Number(summary.total_amount || 0) - Number(summary.total_expense || 0)).toLocaleString()}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{t.net_profit}</div>
            </div>
          </Col>
          {/* Top Selling Card */}
          <Col xs={24} sm={12} lg={4}>
            <div style={{
              background: '#fff',
              padding: '12px 16px',
              borderRadius: 16,
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9',
              minHeight: 128,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.top_selling_label}</div>
              {summary.top_products?.slice(0, 3).map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: '#1e293b', fontWeight: 500 }}>{item.name}</span>
                  <span style={{ color: '#1e4a2d', fontWeight: 700 }}>{item.total_qty} qty</span>
                </div>
              ))}
              {(!summary.top_products || summary.top_products.length === 0) && <div style={{ fontSize: 10, color: '#94a3b8' }}>No data</div>}
            </div>
          </Col>
        </Row>
      )}

      {/* Main Content Card */}
      <Card
        style={{
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          border: 'none'
        }}
        bodyStyle={{ padding: 20 }}
      >
        {/* Tabs Control - Redesigned as Segmented Pill */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{
            background: '#f1f5f9',
            padding: 4,
            borderRadius: 30,
            display: 'inline-flex',
            gap: 4
          }}>
            <button
              onClick={() => setState(prev => ({ ...prev, activeTab: "1" }))}
              style={{
                padding: '8px 20px',
                borderRadius: 25,
                border: 'none',
                background: state.activeTab === "1" ? '#1e4a2d' : 'transparent',
                color: state.activeTab === "1" ? '#fff' : '#64748b',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: state.activeTab === "1" ? '0 4px 10px rgba(30, 74, 45, 0.2)' : 'none'
              }}
            >
              <ClockCircleOutlined /> {t.tab_today}
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, activeTab: "2" }))}
              style={{
                padding: '8px 20px',
                borderRadius: 25,
                border: 'none',
                background: state.activeTab === "2" ? '#1e4a2d' : 'transparent',
                color: state.activeTab === "2" ? '#fff' : '#64748b',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: state.activeTab === "2" ? '0 4px 10px rgba(30, 74, 45, 0.2)' : 'none'
              }}
            >
              <HistoryOutlined /> {t.tab_history}
            </button>
          </div>
        </div>

        {state.activeTab === "1" && (
          <div>
            {/* Filter Header & Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 32,
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <CalendarOutlined style={{ color: '#667eea', fontSize: 20 }} />
                <RangePicker
                  value={[filter.from_date, filter.to_date]}
                  onChange={(dates) => {
                    if (dates?.length === 2) {
                      setFilter(prev => ({
                        ...prev,
                        from_date: dates[0],
                        to_date: dates[1]
                      }));
                    }
                  }}
                  style={{ borderRadius: 8 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  icon={<ArrowDownOutlined />}
                  onClick={() => setState(prev => ({ ...prev, visibleExpenseModal: true }))}
                  style={{
                    borderRadius: 8,
                    height: 40,
                    color: '#ef4444',
                    borderColor: '#ef4444'
                  }}
                >
                  {t.add_expense_btn}
                </Button>

                <Button
                  type="primary"
                  icon={<ExportOutlined />}
                  style={{
                    borderRadius: 8,
                    height: 40,
                  }}
                >
                  {t.export}
                </Button>
              </div>

              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleOpenCloseShift}
                loading={loading}
                style={{
                  borderRadius: 8,
                  height: 40,
                  background: '#1e4a2d',
                  borderColor: '#1e4a2d'
                }}
              >
                {currentShift ? "Close Shift & Recon / បិទបញ្ជី និងទូទាត់" : t.open_shift_btn}
              </Button>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            {/* Filter Controls (Search Orders) */}
            <div style={{
              background: '#f8fafc',
              padding: 24,
              borderRadius: 16,
              marginBottom: 24
            }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12} md={8}>
                  <Input.Search
                    size="large"
                    allowClear
                    placeholder={t.search}
                    value={state.txtSearch}
                    onChange={(e) => setState(prev => ({ ...prev, txtSearch: e.target.value }))}
                    onSearch={handleSearch}
                    style={{ borderRadius: 8 }}
                    prefix={<SearchOutlined style={{ color: '#667eea' }} />}
                  />
                </Col>

                {canSeeAllReports && (
                  <Col xs={24} sm={12} md={8}>
                    <Select
                      size="large"
                      allowClear
                      style={{ width: '100%', borderRadius: 8 }}
                      placeholder={t.user}
                      value={filter.user_id}
                      options={config?.user || []}
                      onChange={(val) => setFilter(prev => ({ ...prev, user_id: val }))}
                      prefix={<UserOutlined />}
                    />
                  </Col>
                )}

                <Col xs={24} sm={12} md={8}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<FilterOutlined />}
                    onClick={handleSearch}
                    style={{
                      width: '100%',
                      borderRadius: 8,
                    }}
                  >
                    {t.apply_filters}
                  </Button>
                </Col>
              </Row>
            </div>

            <Divider style={{ margin: '16px 0' }} />
            <Text strong>{t.orders_this_shift}</Text>

            {/* Orders Table */}
            <Table
              loading={loading}
              rowKey="id"
              dataSource={list}
              pagination={false}
              className="premium-table"
              style={{
                background: '#fff',
                marginTop: 16
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t.no_orders}
                    style={{ padding: 40 }}
                  />
                )
              }}
              columns={[
                {
                  title: t.order_details,
                  dataIndex: "order_no",
                  width: 160,
                  render: (val, record) => (
                    <div>
                      <Tag
                        color="blue"
                        style={{
                          borderRadius: 6,
                          fontWeight: 'bold',
                          marginBottom: 4
                        }}
                      >
                        {val || `#${record.id}`}
                      </Tag>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {formatDateClient(record.created_at, "MMM DD, YYYY HH:mm")}
                      </div>
                    </div>
                  )
                },
                {
                  title: t.staff,
                  dataIndex: "staff_name",
                  width: 120,
                  render: (val) => (
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1e4a2d' }} />
                      <Text style={{ fontSize: 13, fontWeight: 500 }}>{val || 'System'}</Text>
                    </Space>
                  )
                },
                {
                  title: "Shift",
                  dataIndex: "shift_id",
                  width: 80,
                  render: (val) => val ? (
                    <Tag color="cyan" style={{ borderRadius: 4, fontWeight: 'bold' }}>
                      #{val}
                    </Tag>
                  ) : "-"
                },
                {
                  title: t.product,
                  dataIndex: "product_names",
                  width: 250,
                  render: (val, record) => (
                    <div>
                      <div style={{ fontSize: 12, color: '#1e293b', fontWeight: 500 }}>
                        {val?.length > 60 ? `${val.substring(0, 60)}...` : val}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Badge
                          count={`${record.total_quantity || 0} ${t.items}`}
                          style={{
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            boxShadow: 'none',
                            fontSize: 10,
                            fontWeight: 600
                          }}
                        />
                      </div>
                    </div>
                  )
                },
                {
                  title: t.amount,
                  dataIndex: "total_amount",
                  width: 140,
                  align: 'right',
                  render: (val) => (
                    <Text style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                      ${Number(val || 0).toFixed(2)}
                    </Text>
                  )
                },
                {
                  title: t.payment_method,
                  dataIndex: "payment_method",
                  width: 120,
                  render: val => (
                    <Tag color="success" style={{ borderRadius: 6, fontWeight: 'bold' }}>{val || t.paid}</Tag>
                  )
                },
                {
                  title: t.action,
                  width: 180,
                  render: (_, rec) => (
                    <Space>
                      <Tooltip title={t.view_details}>
                        <Button
                          shape="circle"
                          icon={<EyeOutlined />}
                          onClick={() => getOrderDetail(rec)}
                          style={{ color: '#1890ff', borderColor: '#1890ff' }}
                        />
                      </Tooltip>
                      <Tooltip title="Print Label">
                        <Button
                          shape="circle"
                          icon={<TagOutlined />}
                          onClick={async () => {
                            setState(p => ({ ...p, loading: true }));
                            try {
                              const res = await request(`order/${rec.id}`, "get");
                              if (res && res.details) {
                                setOrderDetail(res.details);
                                setCurrentOrder({ ...rec, ...res });
                                setTimeout(() => {
                                  handlePrintLabel();
                                  setState(p => ({ ...p, loading: false }));
                                }, 500);
                              }
                            } catch (error) {
                              setState(p => ({ ...p, loading: false }));
                            }
                          }}
                          style={{ color: '#eb2f96', borderColor: '#eb2f96' }}
                        />
                      </Tooltip>
                      <Tooltip title="Print Invoice">
                        <Button
                          shape="circle"
                          icon={<FileTextOutlined />}
                          onClick={async () => {
                            setState(p => ({ ...p, loading: true }));
                            try {
                              const res = await request(`order/${rec.id}`, "get");
                              if (res && res.details) {
                                setOrderDetail(res.details);
                                setCurrentOrder({ ...rec, ...res });
                                setTimeout(() => {
                                  handlePrintInvoice();
                                  setState(p => ({ ...p, loading: false }));
                                }, 500);
                              }
                            } catch (error) {
                              setState(p => ({ ...p, loading: false }));
                            }
                          }}
                          style={{ color: '#722ed1', borderColor: '#722ed1' }}
                        />
                      </Tooltip>
                    </Space>
                  )
                }
              ]}
            />
          </div>
        )}

        {state.activeTab === "2" && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={12}>
                <RangePicker
                  value={[filter.from_date, filter.to_date]}
                  onChange={d => setFilter(p => ({ ...p, from_date: d[0], to_date: d[1] }))}
                />
              </Col>
              {canSeeAllReports && (
                <Col span={8}>
                  <Select
                    allowClear placeholder="Filter by user" style={{ width: '100%' }}
                    options={config?.user || []}
                    onChange={v => setFilter(p => ({ ...p, user_id: v }))}
                    value={filter.user_id}
                  />
                </Col>
              )}
              <Col span={4}>
                <Button type="primary" block onClick={getShiftHistory}>Refresh</Button>
              </Col>
            </Row>

            <Table
              loading={loadingHistory}
              dataSource={shiftHistory}
              rowKey="id"
              className="premium-table"
              style={{ background: '#fff' }}
              columns={[
                {
                  title: t.close_date,
                  dataIndex: 'closed_at',
                  render: v => (
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{formatDateClient(v, "MMM DD, YYYY")}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{formatDateClient(v, "hh:mm A")}</div>
                    </div>
                  )
                },
                {
                  title: t.staff,
                  dataIndex: 'staff_name',
                  render: v => (
                    <Space>
                      <div style={{ background: '#f1f5f9', width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserOutlined style={{ color: '#64748b' }} />
                      </div>
                      <Text style={{ fontWeight: 500 }}>{v}</Text>
                    </Space>
                  )
                },
                {
                  title: t.opening_cash_label,
                  dataIndex: 'opening_cash_usd',
                  render: v => <Text style={{ color: '#1e293b' }}>${Number(v || 0).toFixed(2)}</Text>
                },
                {
                  title: t.expected_label,
                  dataIndex: 'expected_cash_usd',
                  render: v => <Text style={{ color: '#1e293b' }}>${Number(v || 0).toFixed(2)}</Text>
                },
                {
                  title: t.actual_in_drawer,
                  dataIndex: 'actual_cash_usd',
                  render: v => <Text strong style={{ color: '#1e293b' }}>${Number(v || 0).toFixed(2)}</Text>
                },
                {
                  title: t.difference_label,
                  dataIndex: 'diff_usd',
                  render: v => {
                    const isZero = Math.abs(v) < 0.1;
                    return (
                      <Text style={{ color: isZero ? '#059669' : '#ef4444', fontWeight: 600 }}>
                        {v >= 0 ? '+' : ''}${Number(v).toFixed(2)}
                      </Text>
                    );
                  }
                },
                {
                  title: t.status_label,
                  dataIndex: 'diff_usd',
                  render: v => {
                    const isZero = Math.abs(v) < 0.1;
                    return (
                      <Tag
                        color={isZero ? 'green' : 'red'}
                        style={{
                          borderRadius: 20,
                          padding: '0 12px',
                          border: 'none',
                          background: isZero ? '#f0fdf4' : '#fef2f2',
                          color: isZero ? '#059669' : '#ef4444',
                          fontWeight: 600
                        }}
                      >
                        {isZero ? t.balanced_status : t.discrepancy_status}
                      </Tag>
                    );
                  }
                },
                {
                  title: t.action,
                  width: 150,
                  render: (row) => (
                    <Space>
                      <Button
                        icon={<FileTextOutlined />}
                        style={{
                          borderRadius: 8,
                          borderColor: '#1e4a2d',
                          color: '#1e4a2d',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                        onClick={async () => {
                          setLoadingHistory(true);
                          try {
                            const res = await request(`shift/summary?id=${row.id}`, "get");
                            if (res && res.success) {
                              setPrintSummary(res.summary);
                              setActualCash(row.actual_cash_usd);
                              setActualCashKHR(row.actual_cash_khr);
                              setPrintStaffName(row.staff_name);
                              setPrintShiftDate(row.closed_at);
                              setPrintOpeningUSD(row.opening_cash_usd);
                              setPrintOpeningKHR(row.opening_cash_khr);

                              setTimeout(() => {
                                handlePrintShift();
                                setLoadingHistory(false);
                              }, 500);
                            }
                          } catch (err) {
                            message.error("Failed to load report");
                            setLoadingHistory(false);
                          }
                        }}
                      >
                        {t.print_receipt_btn}
                      </Button>
                    </Space>
                  )
                }
              ]}
            />
          </div>
        )}
      </Card>

      {/* Enhanced Order Detail Modal */}
      <Modal
        open={state.visibleModal}
        onCancel={onCloseModal}
        footer={null}
        title={
          <div style={{ padding: '8px 0' }}>
            <Title level={3} style={{ margin: 0, color: '#2d3748' }}>
              <ShoppingCartOutlined style={{ marginRight: 8, color: '#667eea' }} />
              {t.order_details}
              {currentOrder?.order_no && (
                <Text style={{ fontSize: 14, color: '#6b7280', marginLeft: 8 }}>
                  ({currentOrder.order_no})
                </Text>
              )}
            </Title>
          </div>
        }
        width={900}
        style={{ top: 20 }}
        bodyStyle={{
          padding: 0,
          background: '#f8fafc'
        }}
      >
        <div style={{ padding: 16 }}>
          {/* Order Summary */}
          {currentOrder && (
            <Card style={{ marginBottom: 16, borderRadius: 8 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Text strong>{t.order_no}:</Text>
                  <br />
                  <Text>{currentOrder.order_no || `#${currentOrder.id}`}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>{t.date}:</Text>
                  <br />
                  <Text>{formatDateClient(currentOrder.created_at, "MMM DD, YYYY h:mm A")}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>{t.status}:</Text>
                  <br />
                  <Tag color={getStatusColor(currentOrder.status)}>
                    {getStatusText(currentOrder.status)}
                  </Tag>
                </Col>
                <Col span={6}>
                  <Text strong>{t.payment_method}:</Text>
                  <br />
                  <Text>{currentOrder.payment_method || t.paid}</Text>
                </Col>
              </Row>
            </Card>
          )}

          <Table
            dataSource={orderDetail}
            rowKey={(record) => `${record.product_id}-${record.id}`}
            pagination={false}
            loading={loading}
            style={{
              background: '#fff',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}
            columns={[
              {
                key: "image",
                title: t.image,
                dataIndex: "image",
                width: 80,
                render: (value) => (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid #e0e0e0",
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                      transition: "transform 0.3s, box-shadow 0.3s",
                    }}
                  >
                    {value ? (
                      <Image
                        src={Config.getFullImagePath(value)}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        preview={{
                          mask: (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                width: "100%",
                                height: "100%",
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                color: "#fff",
                                fontSize: 16,
                              }}
                            >
                              {t.view_details}
                            </div>
                          ),
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: "#EEE",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontSize: 10,
                          color: "#999",
                          textAlign: "center"
                        }}
                      >
                        {t.no_data}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: t.product_name,
                dataIndex: "product_name",
                render: (name, record) => (
                  <div>
                    <Text strong style={{ color: '#2d3748' }}>{name}</Text>
                    {record.note && (
                      <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                        {record.note}
                      </div>
                    )}
                    {record.category_name && (
                      <div>
                        <Tag size="small" color="blue" style={{ marginTop: 4 }}>
                          {record.category_name}
                        </Tag>
                      </div>
                    )}
                  </div>
                )
              },
              {
                title: t.quantity,
                dataIndex: "qty",
                align: "center",
                width: 100,
                render: val => (
                  <Badge
                    count={val || 0}
                    style={{
                      backgroundColor: '#667eea',
                      fontSize: 14,
                      fontWeight: 'bold'
                    }}
                  />
                )
              },
              {
                title: t.discount,
                dataIndex: "discount_percent",
                align: "center",
                width: 100,
                render: (val) => {
                  const value = Number(val) || 0;

                  return value > 0 ? (
                    <Badge
                      count={`${value}% OFF`}
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 'bold',
                        padding: '0 10px',
                        borderRadius: '12px',
                        boxShadow: '0 0 0 1px #fff inset'
                      }}
                    />
                  ) : (
                    <Tag
                      color="default"
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        borderRadius: '10px',
                      }}
                    >
                      {t.no_discount}
                    </Tag>
                  );
                }
              }
              ,
              {
                title: t.price,
                dataIndex: "price",
                align: "right",
                width: 120,
                render: val => (
                  <Text style={{ fontSize: 14, color: '#6b7280' }}>
                    ${Number(val || 0).toFixed(2)}
                  </Text>
                )
              },
              {
                title: t.total,
                dataIndex: "total",
                align: "right",
                width: 140,
                render: (val, record) => {
                  const totalAmount = record.grand_total || record.line_total || record.total || (record.qty * record.price) || 0;
                  return (
                    <Text strong style={{ fontSize: 16, color: '#10b981' }}>
                      ${Number(totalAmount).toFixed(2)}
                    </Text>
                  );
                }
              }
            ]}
            summary={(pageData) => {
              const total = pageData.reduce((sum, item) => {
                const itemTotal = item.grand_total || item.line_total || item.total || (item.qty * item.price) || 0;
                return sum + Number(itemTotal);
              }, 0);

              return (
                <Table.Summary.Row style={{ background: '#f8fafc' }}>
                  <Table.Summary.Cell colSpan={4}>
                    <Text strong style={{ fontSize: 16 }}>{t.total_amount}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell align="right">
                    <Text strong style={{ fontSize: 18, color: '#667eea' }}>
                      ${total.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </div>
        <Divider style={{ margin: 0 }} />
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          {(currentOrder?.payment_method !== "Cash" && currentOrder?.status !== "Cancel") && (
            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              style={{ background: '#10b981', borderColor: '#10b981' }}
              onClick={() => {
                setQrData({ orderNo: currentOrder?.order_no || `#${currentOrder?.id}`, total: currentOrder?.total_amount });
                setQrModalVisible(true);
              }}
            >
              Re-Scan KHQR
            </Button>
          )}
          <Button
            icon={<TagOutlined />}
            size="large"
            onClick={handlePrintLabel}
            style={{ marginLeft: 8 }}
          >
            Reprint Labels
          </Button>
          <Button
            icon={<FileTextOutlined />}
            size="large"
            onClick={handlePrintInvoice}
            style={{ marginLeft: 8 }}
          >
            Reprint Invoice
          </Button>
        </div>
      </Modal>

      <QRPaymentModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        orderNo={qrData.orderNo}
        total={qrData.total}
        branchInfo={branchInfo}
      />

      <div style={{ display: "none" }}>
        <PrintShiftReport
          ref={refShiftReport}
          summary={printSummary}
          profile={profile}
          staff_name={printStaffName}
          filter={{ from_date: printShiftDate }}
          actual_cash={actualCash}
          actual_cash_khr={actualCashKHR}
          opening_cash={printOpeningUSD}
          opening_cash_khr={printOpeningKHR}
          exchange_rate={exchangeRate}
        />
        <div ref={refLabel}>
          <PrintLabel
            cart_list={orderDetail}
            objSummary={currentOrder}
            branchInfo={branchInfo}
          />
        </div>
        <div ref={refInvoice}>
          <PrintInvoice
            cart_list={orderDetail}
            objSummary={currentOrder}
            branchInfo={branchInfo}
            layoutType={"coffee"}
            exchangeRate={exchangeRate}
          />
        </div>
      </div>

      {/* Quick Expense Modal */}
      <Modal
        title={t.quick_expense_title}
        open={state.visibleExpenseModal}
        onCancel={() => setState(prev => ({ ...prev, visibleExpenseModal: false }))}
        footer={null}
        width={400}
      >
        <Form
          layout="vertical"
          onFinish={onSaveExpense}
          initialValues={{ payment_method: 'Cash' }}
        >
          <Form.Item
            name="expense_type_id"
            label={t.category}
            rules={[{ required: true }]}
          >
            <Select
              options={config?.expense_type || []}
              placeholder="Select category"
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label={t.expense_amount}
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} prefix="$" min={0.01} step={0.1} />
          </Form.Item>
          <Form.Item
            name="payment_method"
            label={t.payment_type}
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="Cash">{t.dash_cash} (ដកពីថត)</Select.Option>
              <Select.Option value="Bank">Bank / QR / ធនាគារ (មិនប៉ះសាច់ប្រាក់)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label={t.description}
            rules={[{ required: true }]}
          >
            <Input.TextArea placeholder={t.describe_expense} rows={3} />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setState(prev => ({ ...prev, visibleExpenseModal: false }))}>
                {t.cancel}
              </Button>
              <Button type="primary" htmlType="submit">
                {t.save}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* 🧾 X-Report / Close Shift Reconciliation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#f8fafc', padding: 8, borderRadius: 8 }}>
              <FileTextOutlined style={{ fontSize: 24, color: '#1e4a2d' }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0 }}>X-Report: Shift Reconciliation</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Accountability check for shift completion</Text>
            </div>
          </div>
        }
        open={visibleCloseShiftModal}
        onCancel={() => setVisibleCloseShiftModal(false)}
        width={750}
        centered
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={() => setVisibleCloseShiftModal(false)} size="large">Cancel</Button>,
          <Button
            key="submit"
            type="primary"
            size="large"
            loading={isClosingShift}
            onClick={onConfirmCloseShift}
            style={{ minWidth: 200, background: '#1e4a2d', borderColor: '#1e4a2d' }}
          >
            Confirm & Print X-Report
          </Button>
        ]}
      >
        <Divider style={{ margin: '16px 0' }} />

        {closeShiftSummary && (
          <Row gutter={24}>
            {/* Left Column: Automated Summary */}
            <Col span={10}>
              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, height: '100%' }}>
                <Title level={5} style={{ marginBottom: 20, fontSize: 13, textTransform: 'uppercase', color: '#64748b' }}>System Expected</Title>

                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Total Sales:</Text>
                    <Text strong>${closeShiftSummary.total_sales_usd.toFixed(2)}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Cash Sales:</Text>
                    <Text strong style={{ color: '#059669' }}>+${closeShiftSummary.total_cash_usd.toFixed(2)}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">ABA/QR Sales:</Text>
                    <Text strong style={{ color: '#2563eb' }}>${closeShiftSummary.total_aba_usd.toFixed(2)}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Float/Opening:</Text>
                    <Text strong>+${(Number(openingCash) + (Number(openingCashKHR) / exchangeRate)).toFixed(2)}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Expenses:</Text>
                    <Text strong style={{ color: '#ef4444' }}>-${closeShiftSummary.total_expense_usd.toFixed(2)}</Text>
                  </div>

                  <Divider style={{ margin: '12px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>EXPECTED CASH:</Text>
                    <Title level={4} style={{ margin: 0, color: '#1e4a2d' }}>${closeShiftSummary.expected_cash_usd.toFixed(2)}</Title>
                  </div>
                </Space>
              </div>
            </Col>

            {/* Right Column: Actual Count & Differences */}
            <Col span={14}>
              <div style={{ padding: '0 10px' }}>
                <Title level={5} style={{ marginBottom: 20, fontSize: 13, textTransform: 'uppercase', color: '#64748b' }}>Actual Physical Count</Title>

                <Form layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Cash Count (USD)">
                        <InputNumber
                          size="large"
                          style={{ width: '100%' }}
                          prefix="$"
                          value={actualCash}
                          onChange={setActualCash}
                          placeholder="0.00"
                          autoFocus
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Cash Count (KHR)">
                        <InputNumber
                          size="large"
                          style={{ width: '100%' }}
                          prefix="៛"
                          value={actualCashKHR}
                          onChange={setActualCashKHR}
                          placeholder="0"
                          step={100}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="Shift Notes / Remark">
                    <Input.TextArea
                      placeholder="Provide context for any discrepancies..."
                      rows={2}
                      value={remark}
                      onChange={e => setRemark(e.target.value)}
                    />
                  </Form.Item>
                </Form>

                {/* Difference Visualization */}
                {(() => {
                  const actualTotal = Number(actualCash) + (Number(actualCashKHR) / exchangeRate);
                  const diff = actualTotal - closeShiftSummary.expected_cash_usd;
                  const isExact = Math.abs(diff) < 0.01;
                  const isShort = diff < -0.01;

                  return (
                    <div style={{
                      padding: 24,
                      borderRadius: 16,
                      background: isExact ? '#f0fdf4' : (isShort ? '#fef2f2' : '#eff6ff'),
                      border: '1px solid',
                      borderColor: isExact ? '#bbf7d0' : (isShort ? '#fecaca' : '#bfdbfe'),
                      textAlign: 'center',
                      marginTop: 20
                    }}>
                      <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Reconciliation Difference</Text>
                      <div style={{
                        fontSize: 32,
                        fontWeight: 900,
                        color: isExact ? '#166534' : (isShort ? '#991b1b' : '#1e40af'),
                        margin: '8px 0'
                      }}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(2)}$
                      </div>
                      {isShort && <Tag color="error">Shortage Detected - Review Required</Tag>}
                      {isExact && <Tag color="success">Perfect Balance</Tag>}
                      {!isExact && !isShort && <Tag color="processing">Overland / Excess Cash</Tag>}
                    </div>
                  );
                })()}
              </div>
            </Col>
          </Row>
        )}
      </Modal>

      {/* 🚀 Open Shift Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <Title level={4} style={{ margin: 0 }}><ShopOutlined /> {t.open_new_shift}</Title>
            <Text type="secondary">{t.enter_opening_cash}</Text>
          </div>
        }
        open={visibleOpenShiftModal}
        onCancel={() => setVisibleOpenShiftModal(false)}
        footer={null}
        width={400}
        maskClosable={false}
      >
        <Form layout="vertical" onFinish={onOpenShift}>
          <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, marginBottom: 20 }}>
            <Form.Item
              name="opening_cash_usd"
              label={t.opening_cash_usd}
              initialValue={0}
            >
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                prefix="$"
                min={0}
              />
            </Form.Item>
            <Form.Item
              name="opening_cash_khr"
              label={t.opening_cash_khr}
              initialValue={0}
            >
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                prefix="៛"
                min={0}
                step={100}
              />
            </Form.Item>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.authorized_by}: <Text strong>{profile?.name}</Text> {profile?.role_name && <Tag size="small" style={{ marginLeft: 4, transform: 'scale(0.8)' }}>{profile.role_name}</Tag>}
            </Text>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            style={{ height: 50, borderRadius: 8, background: '#1e4a2d' }}
          >
            {t.open_shift_now}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderPage;
