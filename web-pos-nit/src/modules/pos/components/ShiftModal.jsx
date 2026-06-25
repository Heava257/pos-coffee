import React, { useState, useEffect } from "react";
import {
  Modal, Steps, Button, Form, Input, InputNumber, Select,
  Row, Col, Typography, Divider, Tag, Space, Spin, message
} from "antd";
import {
  CheckCircleOutlined, ClockCircleOutlined, LogoutOutlined,
  ShoppingOutlined, DollarOutlined, LockOutlined, SyncOutlined,
  ArrowRightOutlined, ArrowLeftOutlined, RocketOutlined
} from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import { useShiftStore } from "@/app/store/shiftStore";
import { useExchangeRate } from "@/app/providers/ExchangeRateProvider";

const { Text, Title } = Typography;
const { Option } = Select;

const G = "#1e4a2d";
const card = { background: "#f8fafc", borderRadius: 16, padding: "20px 24px", border: "1px solid #edf2f7" };

// ── OPEN SHIFT ───────────────────────────────────────────────────────────────
export function OpenShiftModal({ open, onClose, onSuccess, profile }) {
  const [step, setStep] = useState(0); // 0=form, 1=confirm, 2=done
  const [form] = Form.useForm();
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const { openShift } = useShiftStore();

  const SHIFT_TYPES = [
    { value: "morning", label: "🌅 Morning Shift  (07:00 AM – 03:00 PM)" },
    { value: "evening", label: "🌆 Evening Shift  (03:00 PM – 11:00 PM)" },
    { value: "night",   label: "🌙 Night Shift    (11:00 PM – 07:00 AM)" },
  ];

  useEffect(() => {
    if (open) { setStep(0); form.resetFields(); setValues({}); }
  }, [open]);

  const handleNext = () => {
    form.validateFields().then(v => { setValues(v); setStep(1); });
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const usd = Number(values.opening_cash_usd || 0);
      const khr = Number(values.opening_cash_khr || 0);
      const res = await openShift(usd, khr);
      if (res && res.success) {
        setStep(2);
      } else {
        message.warning(res?.message || "Failed to open shift");
      }
    } catch (e) {
      message.error("Error opening shift");
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => { onSuccess?.(); onClose(); };

  const shiftLabel = SHIFT_TYPES.find(s => s.value === values.shift_type)?.label || "—";

  return (
    <Modal open={open} footer={null} closable={step < 2} onCancel={onClose}
      width={520} centered
      styles={{ content: { borderRadius: 24, padding: "28px 32px" } }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: `${G}12`,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <ShoppingOutlined style={{ fontSize: 26, color: G }} />
        </div>
        <Title level={4} style={{ margin: 0, color: G }}>គ្រប់គ្រងវេនលក់ (Shift Management)</Title>
        <Text type="secondary" style={{ fontSize: 13 }}>ការចាប់ផ្តើមវេនថ្មី</Text>
      </div>

      {/* Steps */}
      <Steps size="small" current={step} style={{ marginBottom: 28 }}
        items={[
          { title: "ព័ត៌មានវេន" },
          { title: "បញ្ជាក់" },
          { title: "បានបើក" },
        ]} />

      {/* STEP 0: Form */}
      {step === 0 && (
        <Form form={form} layout="vertical">
          <div style={card}>
            <Form.Item label={<b>ប្រភេទវេន (Shift Type)</b>} name="shift_type"
              rules={[{ required: true, message: "Please select shift type" }]}>
              <Select size="large" placeholder="ជ្រើសរើសប្រភេទវេន" style={{ borderRadius: 10 }}>
                {SHIFT_TYPES.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
              </Select>
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={<b>$ USD (Float)</b>} name="opening_cash_usd" initialValue={0}>
                  <InputNumber size="large" style={{ width: "100%", borderRadius: 10 }}
                    min={0} prefix="$" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<b>៛ KHR (Float)</b>} name="opening_cash_khr" initialValue={0}>
                  <InputNumber size="large" style={{ width: "100%", borderRadius: 10 }}
                    min={0} step={1000} prefix="៛" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="កំណត់សម្គាល់ (Note)" name="note">
              <Input.TextArea rows={2} placeholder="Optional note..." style={{ borderRadius: 10 }} />
            </Form.Item>
          </div>
          <Button type="primary" size="large" block onClick={handleNext}
            icon={<ArrowRightOutlined />}
            style={{ marginTop: 20, height: 50, borderRadius: 14, background: G, fontWeight: 700 }}>
            បន្ទាប់ (Next)
          </Button>
        </Form>
      )}

      {/* STEP 1: Confirm */}
      {step === 1 && (
        <div>
          <div style={{ ...card, marginBottom: 20 }}>
            <Title level={5} style={{ color: "#64748b", marginBottom: 16 }}>ពិនិត្យព័ត៌មាន (Confirm Details)</Title>
            {[
              ["ប្រភេទវេន (Shift Type)", shiftLabel],
              ["$ USD (Float)", `$${Number(values.opening_cash_usd || 0).toFixed(2)}`],
              ["៛ KHR (Float)", `${Number(values.opening_cash_khr || 0).toLocaleString()}៛`],
              ["Staff", profile?.name || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between",
                padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <Text type="secondary">{k}</Text>
                <Text strong>{v}</Text>
              </div>
            ))}
          </div>
          <Row gutter={12}>
            <Col span={10}>
              <Button size="large" block onClick={() => setStep(0)}
                icon={<ArrowLeftOutlined />}
                style={{ height: 50, borderRadius: 14, fontWeight: 700 }}>
                ត្រលប់
              </Button>
            </Col>
            <Col span={14}>
              <Button type="primary" size="large" block loading={loading} onClick={handleConfirm}
                style={{ height: 50, borderRadius: 14, background: G, fontWeight: 700 }}>
                ✅ បញ្ជាក់ & បើក
              </Button>
            </Col>
          </Row>
        </div>
      )}

      {/* STEP 2: Done */}
      {step === 2 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ ...card, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Title level={5} style={{ margin: 0, color: G }}>Active Shift</Title>
              <Tag color="success" style={{ fontWeight: 700, borderRadius: 8 }}>ON GOING</Tag>
            </div>
            {[
              ["Shift Type", shiftLabel],
              ["Staff", profile?.name || "—"],
              ["Cash in Hand", `$${Number(values.opening_cash_usd || 0).toFixed(2)}`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0",
                borderBottom: "1px solid #f1f5f9" }}>
                <Text type="secondary">{k}</Text>
                <Text strong>{v}</Text>
              </div>
            ))}
          </div>
          <CheckCircleOutlined style={{ fontSize: 48, color: "#22c55e", marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: G, marginBottom: 20 }}>
            វេនបានបើករួចរាល់! Shift is now active!
          </div>
          <Button type="primary" size="large" block onClick={handleDone} icon={<RocketOutlined />}
            style={{ height: 52, borderRadius: 14, background: G, fontWeight: 800, fontSize: 15 }}>
            Go to POS
          </Button>
        </div>
      )}
    </Modal>
  );
}

// ── CLOSE SHIFT ──────────────────────────────────────────────────────────────
export function CloseShiftModal({ open, onClose, onSuccess, currentShift, onPrint, profile }) {
  const [step, setStep] = useState(0); // 0=request, 1=count, 2=summary, 3=confirm, 4=closed
  const [summary, setSummary] = useState(null);
  const [shiftData, setShiftData] = useState(null); // real shift row from server
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [actualUSD, setActualUSD] = useState(0);
  const [actualKHR, setActualKHR] = useState(0);
  const [password, setPassword] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [loadingClose, setLoadingClose] = useState(false);
  const { closeShift } = useShiftStore();
  const { exchangeRate } = useExchangeRate();

  useEffect(() => {
    if (open) { setStep(0); setActualUSD(0); setActualKHR(0); setPassword(""); setSummary(null); setShiftData(null); setVerifyError(""); }
  }, [open]);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await request("shift/summary", "get");
      if (res && res.success) {
        setSummary(res.summary);
        setShiftData(res.shift); // real shift row with id, created_at, etc.
      } else message.error("Cannot fetch shift summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleRequestClose = async () => {
    await fetchSummary();
    setStep(1);
  };

  const handleCountNext = () => setStep(2);

  const handleSummaryNext = () => setStep(3);

  const handleConfirmClose = async () => {
    if (!password) { setVerifyError("Please enter your password / សូមបញ្ចូលលេខសម្ងាត់"); return; }
    setVerifyError("");
    setLoadingClose(true);
    try {
      // Step 1: Verify the logged-in user's own password
      const verifyRes = await request("auth/verify-manager", "post", {
        username: profile?.email,
        password: password,
      });
      if (!verifyRes || !verifyRes.success) {
        setVerifyError(verifyRes?.message || "Password incorrect! / លេខសម្ងាត់មិនត្រឹមត្រូវ");
        setLoadingClose(false);
        return;
      }

      // Step 2: Close the shift
      const totalActual = actualUSD + (actualKHR / (summary?.exchange_rate || exchangeRate));
      const expected = summary?.expected_cash_usd || 0;
      const shiftId = shiftData?.id || currentShift?.id;
      const data = {
        id: shiftId,
        actual_cash_usd: actualUSD,
        actual_cash_khr: actualKHR,
        expected_cash_usd: expected,
        total_sales_usd: summary?.total_sales_usd,
        total_cash_usd: summary?.total_cash_usd,
        total_expense_usd: summary?.total_expense_usd,
        diff_usd: totalActual - expected,
      };
      const res = await closeShift(data);
      if (res && res.success) {
        setStep(4);
        onPrint?.();
      } else {
        message.error(res?.message || "Failed to close shift");
      }
    } finally {
      setLoadingClose(false);
    }
  };

  const realShiftId = shiftData?.id || currentShift?.id;
  const variance = actualUSD + (actualKHR / (summary?.exchange_rate || exchangeRate)) - (summary?.expected_cash_usd || 0);
  const isBalanced = Math.abs(variance) < 0.01;
  const isOver = variance > 0.01;

  const STEPS = ["សំណើបិទ", "រាប់លុយ", "សង្ខេប", "បញ្ជាក់", "បិទរួច"];

  return (
    <Modal open={open} footer={null} closable={step < 4} onCancel={onClose}
      width={560} centered
      styles={{ content: { borderRadius: 24, padding: "28px 32px" } }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fef3c710",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
          border: "2px solid #f59e0b20" }}>
          <LogoutOutlined style={{ fontSize: 26, color: "#d97706" }} />
        </div>
        <Title level={4} style={{ margin: 0, color: G }}>បិទវេនលក់ (Close Shift)</Title>
        <Text type="secondary">Shift ID: #{realShiftId || "—"}</Text>
      </div>

      <Steps size="small" current={step} style={{ marginBottom: 24 }}
        items={STEPS.map(t => ({ title: t }))} />

      {/* STEP 0: Request Close */}
      {step === 0 && (
        <div>
          <div style={{ ...card, marginBottom: 20, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              តើអ្នកប្រាកដចង់បិទវេននេះ?
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Are you sure you want to close this shift? This will begin the closing process.
            </Text>
          </div>
          <Row gutter={12}>
            <Col span={10}><Button size="large" block onClick={onClose}
              style={{ height: 50, borderRadius: 14 }}>បោះបង់</Button></Col>
            <Col span={14}><Button type="primary" danger size="large" block
              onClick={handleRequestClose} style={{ height: 50, borderRadius: 14, fontWeight: 700 }}>
              សំណើបិទ (Request Close)
            </Button></Col>
          </Row>
        </div>
      )}

      {/* STEP 1: Count Cash */}
      {step === 1 && (
        <div>
          {loadingSummary ? <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div> : (
            <>
              <div style={{ ...card, marginBottom: 20 }}>
                <Title level={5} style={{ color: "#64748b", marginBottom: 16 }}>Cash Counting</Title>
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>
                        Opening Float (USD)
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: G }}>
                        ${(summary?.opening_cash_usd || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>
                        Total Cash Sales
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e" }}>
                        ${(summary?.total_cash_usd || 0).toFixed(2)}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>
                        Total Cash Out
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444" }}>
                        ${(summary?.total_expense_usd || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>
                        Expected Cash
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: G }}>
                        ${(summary?.expected_cash_usd || 0).toFixed(2)}
                      </div>
                    </div>
                  </Col>
                </Row>
                <Divider style={{ margin: "16px 0" }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>
                  ចំនួនលុយជាក់ស្តែង (Actual Cash Count):
                </div>
                <Row gutter={12}>
                  <Col span={12}>
                    <InputNumber size="large" style={{ width: "100%", borderRadius: 10 }}
                      placeholder="0.00" min={0} prefix="$"
                      value={actualUSD} onChange={v => setActualUSD(v || 0)} />
                  </Col>
                  <Col span={12}>
                    <InputNumber size="large" style={{ width: "100%", borderRadius: 10 }}
                      placeholder="0" min={0} step={1000} prefix="៛"
                      value={actualKHR} onChange={v => setActualKHR(v || 0)} />
                  </Col>
                </Row>
                <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 12,
                  background: isBalanced ? "#f0fdf4" : isOver ? "#eff6ff" : "#fef2f2",
                  border: `1px solid ${isBalanced ? "#86efac" : isOver ? "#93c5fd" : "#fca5a5"}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontWeight: 700, color: "#64748b" }}>Variance</Text>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Text strong style={{ fontSize: 18, color: isBalanced ? G : isOver ? "#2563eb" : "#dc2626" }}>
                      {isOver ? "+" : ""}{variance.toFixed(2)}$
                    </Text>
                    <Tag color={isBalanced ? "success" : isOver ? "processing" : "error"}
                      style={{ fontWeight: 800, borderRadius: 6 }}>
                      {isBalanced ? "BALANCED" : isOver ? "OVER" : "SHORTAGE"}
                    </Tag>
                  </div>
                </div>
              </div>
              <Row gutter={12}>
                <Col span={8}><Button size="large" block onClick={() => setStep(0)}
                  style={{ height: 48, borderRadius: 14 }}>ត្រលប់</Button></Col>
                <Col span={16}><Button type="primary" size="large" block onClick={handleCountNext}
                  style={{ height: 48, borderRadius: 14, background: G, fontWeight: 700 }}>
                  <ArrowRightOutlined /> បន្ទាប់
                </Button></Col>
              </Row>
            </>
          )}
        </div>
      )}

      {/* STEP 2: Summary Review */}
      {step === 2 && (
        <div>
          <div style={{ ...card, marginBottom: 20 }}>
            <Title level={5} style={{ marginBottom: 16, color: "#64748b" }}>Shift Summary</Title>
            {[
              ["Net Sales", `$${(summary?.total_sales_usd || 0).toFixed(2)}`, "#22c55e"],
              ["Expenses", `-$${(summary?.total_expense_usd || 0).toFixed(2)}`, "#ef4444"],
              ["Cash In", `$${(summary?.total_cash_usd || 0).toFixed(2)}`, G],
              ["Expected Cash", `$${(summary?.expected_cash_usd || 0).toFixed(2)}`, G],
              ["Actual Cash", `$${actualUSD.toFixed(2)} + ${actualKHR.toLocaleString()}៛`, "#475569"],
            ].map(([k, v, c]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between",
                padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <Text type="secondary">{k}</Text>
                <Text strong style={{ color: c }}>{v}</Text>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12,
              background: isBalanced ? "#f0fdf4" : isOver ? "#eff6ff" : "#fef2f2",
              display: "flex", justifyContent: "space-between" }}>
              <Text strong>Difference</Text>
              <Text strong style={{ fontSize: 18, color: isBalanced ? G : isOver ? "#2563eb" : "#dc2626" }}>
                {isOver ? "+" : ""}{variance.toFixed(2)}$
              </Text>
            </div>
          </div>
          <Row gutter={12}>
            <Col span={8}><Button size="large" block onClick={() => setStep(1)}
              style={{ height: 48, borderRadius: 14 }}>ត្រលប់</Button></Col>
            <Col span={16}><Button type="primary" size="large" block onClick={handleSummaryNext}
              style={{ height: 48, borderRadius: 14, background: G, fontWeight: 700 }}>
              <ArrowRightOutlined /> បញ្ជាក់
            </Button></Col>
          </Row>
        </div>
      )}

      {/* STEP 3: Confirm with password */}
      {step === 3 && (
        <div>
          <div style={{ ...card, marginBottom: 20 }}>
            <Title level={5} style={{ marginBottom: 8, color: "#64748b" }}>Confirm Close Shift</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Please confirm to close this shift. This action cannot be undone.
            </Text>
            <Divider />
            {/* Pre-filled email — read only */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, color: "#94a3b8", textTransform: "uppercase" }}>
                👤 Staff
              </div>
              <div style={{
                padding: "10px 14px", background: "#f1f5f9", borderRadius: 10,
                fontWeight: 700, color: "#475569", fontSize: 14
              }}>
                {profile?.name || "—"} &nbsp;<Text type="secondary" style={{ fontSize: 12 }}>({profile?.email || "—"})</Text>
              </div>
            </div>
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#475569" }}>
                <LockOutlined /> Password / លេខសម្ងាត់
              </div>
              <Input.Password size="large" value={password}
                onChange={e => { setPassword(e.target.value); setVerifyError(""); }}
                placeholder="Enter your login password"
                style={{ borderRadius: 10, borderColor: verifyError ? "#ef4444" : undefined }}
                status={verifyError ? "error" : ""}
                onPressEnter={handleConfirmClose} />
              {verifyError && (
                <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6, fontWeight: 600 }}>
                  ⚠ {verifyError}
                </div>
              )}
            </div>
          </div>
          <Row gutter={12}>
            <Col span={8}><Button size="large" block onClick={() => setStep(2)}
              style={{ height: 48, borderRadius: 14 }}>ត្រលប់</Button></Col>
            <Col span={16}><Button type="primary" danger size="large" block
              loading={loadingClose} onClick={handleConfirmClose}
              style={{ height: 48, borderRadius: 14, fontWeight: 700 }}>
              Confirm & Close
            </Button></Col>
          </Row>
        </div>
      )}

      {/* STEP 4: Shift Closed */}
      {step === 4 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ ...card, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Title level={5} style={{ margin: 0, color: G }}>Shift Closed ✅</Title>
              <Tag color="success" style={{ fontWeight: 700, borderRadius: 8 }}>COMPLETED</Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>Shift has been closed successfully!</Text>
            <Divider />
            {[
              ["Shift ID", `#${realShiftId || "—"}`],
              ["Staff", profile?.name || "—"],
              ["Actual Cash", `$${actualUSD.toFixed(2)}`],
              ["Difference", `${isOver ? "+" : ""}${variance.toFixed(2)}$`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between",
                padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <Text type="secondary">{k}</Text>
                <Text strong>{v}</Text>
              </div>
            ))}
          </div>
          <CheckCircleOutlined style={{ fontSize: 48, color: "#22c55e", marginBottom: 16 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: G, marginBottom: 20 }}>
            ការបិទវេនត្រូវបានបញ្ចប់! Shift closed successfully!
          </div>
          <Button type="primary" size="large" block onClick={() => { onSuccess?.(); onClose(); }}
            style={{ height: 52, borderRadius: 14, background: G, fontWeight: 800 }}>
            ចប់ (Done)
          </Button>
        </div>
      )}
    </Modal>
  );
}
