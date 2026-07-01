import React, { useState } from 'react';
import { Modal, Button, message, Spin, Image } from 'antd';
import QRCode from 'react-qr-code';
import { QrcodeOutlined, CopyOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Config } from '@/shared/utils/config';
import { useLanguage, translations } from '@/app/store/language.store';
import { useProfileStore } from '@/app/store/profileStore';


const CRC16 = (data) => {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

const generateKHQR = (merchantId, name, amount, orderNo, currency = "USD") => {
  const f = (id, val) => id + String(val).length.toString().padStart(2, '0') + String(val);
  const numAmount = Number(amount) || 0;

  // Safe Merchant Name: EMVCo strict requirement for Tag 59 is ASCII only.
  const safeName = name.replace(/[^\x00-\x7F]/g, "").trim().substring(0, 25) || "POS COFFEE";

  // Tag 29 — Bakong Solo/Individual Merchant Account Info
  // Per NBC KHQR Spec: Sub-tag 00 = the Bakong Account ID itself (NO Sub-tag 01)
  // e.g. "pong_chiva@bkrt" goes directly into Sub-tag 00
  const subTag00 = f("00", merchantId);
  const merchantInfo = f("29", subTag00);

  let payload =
    f("00", "01") + // Payload Format Indicator
    f("01", "12") + // Method 12 = Dynamic (Wing/Bakong P2P compatible — use static KHQR image for ABA)
    merchantInfo +  // Tag 29: Bakong Account
    f("52", "5999") + // Merchant Category Code
    f("53", currency === "USD" ? "840" : "116") + // Currency
    f("54", numAmount.toFixed(2)) + // Amount
    f("58", "KH") + // Country Code
    f("59", safeName) + // Merchant Name (ASCII only)
    f("60", "PHNOM PENH") + // City
    f("62", f("01", String(orderNo))); // Bill Number (Order No)

  payload += "6304"; // CRC placeholder
  return payload + CRC16(payload);
};

const QRPaymentModal = ({ open, onClose, paymentLink, orderNo, total, branchInfo }) => {
  const { lang } = useLanguage();
  const t = translations[lang] || {};
  const { permissions } = useProfileStore();
  const hasShopMgmtPerm = permissions?.some(p => p.route_key?.toLowerCase().replace(/^\/+|\/+$/g, '') === 'shop_managment');

  const [copying, setCopying] = useState(false);

  const staticQR = branchInfo?.khqr_image;
  // Only use merchant ID if explicitly configured for this branch — no shared fallback
  const merchantId = branchInfo?.payment_merchant_id || null;
  const receiverName = branchInfo?.payment_receiver_name || branchInfo?.name || "POS COFFEE";
  const branchName = branchInfo?.name || "Branch";

  let dynamicKHQR = null;
  // Only generate dynamic QR when NO static image is uploaded.
  // Static KHQR image (from bank app) = universally compatible (Wing, ABA, Acleda).
  // Dynamic generated QR = Wing/Bakong only.
  if (merchantId && total > 0 && !staticQR) {
    dynamicKHQR = generateKHQR(merchantId, receiverName, total, orderNo);
  }

  const isNotConfigured = !dynamicKHQR && !staticQR && !paymentLink;

  const handleCopyLink = async () => {
    try {
      setCopying(true);
      const textToCopy = paymentLink || dynamicKHQR || "";
      await navigator.clipboard.writeText(textToCopy);
      message.success('Payment content copied to clipboard!');
    } catch (error) {
      message.error('Failed to copy');
    } finally {
      setCopying(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0f7f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QrcodeOutlined style={{ fontSize: '18px', color: '#1e4a2d' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Payment QR Code</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        (paymentLink || dynamicKHQR) && (
          <Button key="copy" icon={<CopyOutlined />} onClick={handleCopyLink} loading={copying}>
            Copy {dynamicKHQR ? "QR Data" : "Link"}
          </Button>
        ),
        <Button key="close" type="primary" onClick={onClose} style={{ background: '#1e4a2d', borderColor: '#1e4a2d', fontWeight: 600 }}>
          Done
        </Button>
      ]}
      width={dynamicKHQR || staticQR || paymentLink ? 560 : 420}
      centered
      styles={{ body: { padding: '24px' } }}
    >
      <div style={{ padding: '4px 0' }}>
        {dynamicKHQR ? (
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div style={{
              background: '#fff',
              padding: '16px',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              border: '1px solid #f0f0f0',
              flexShrink: 0
            }}>
              <QRCode
                value={dynamicKHQR}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "200px" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#8c8c8c', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Amount</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#1e4a2d', lineHeight: 1.2 }}>${total.toFixed(2)}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f0f0f0', paddingBottom: 4 }}>
                  <span style={{ color: '#8c8c8c', fontSize: 13 }}>Order No</span>
                  <span style={{ fontWeight: 700, color: '#262626' }}>#{orderNo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f0f0f0', paddingBottom: 4 }}>
                  <span style={{ color: '#8c8c8c', fontSize: 13 }}>To</span>
                  <span style={{ fontWeight: 700, color: '#262626' }}>{receiverName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8c8c8c', fontSize: 13 }}>Branch</span>
                  <span style={{ fontWeight: 600, color: '#1e4a2d' }}>{branchName}</span>
                </div>
              </div>

              <div style={{
                background: '#f6ffed',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #b7eb8f',
                fontSize: '12px',
                color: '#52c41a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircleOutlined />
                <span>Dynamic KHQR generated for {branchName}</span>
              </div>
            </div>
          </div>
        ) : staticQR ? (
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div style={{ flexShrink: 0, width: 232 }}>
              <Image
                src={Config.getFullImagePath(staticQR)}
                style={{ width: '100%', borderRadius: 16, border: '1px solid #f0f0f0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                placeholder={<Spin />}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#8c8c8c', fontWeight: 500, textTransform: 'uppercase' }}>Scan to Pay</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#1e4a2d' }}>${Number(total || 0).toFixed(2)}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#262626', marginBottom: 4 }}>{receiverName}</div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 16 }}>📍 {branchName}</div>
              <div style={{ fontSize: 13, color: '#595959', padding: '10px', background: '#f5f5f5', borderRadius: 8 }}>
                Please show this QR to pay at <b>{branchName}</b>.
              </div>
            </div>
          </div>
        ) : isNotConfigured ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: '#fff7e6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <WarningOutlined style={{ fontSize: 32, color: '#faad14' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#262626', marginBottom: 8 }}>
              {lang === 'kh' ? 'មិនទាន់បានកំណត់ការទូទាត់ QR' : 'QR Payment Not Configured'}
            </div>
            <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 24 }}>
              {lang === 'kh' ? (
                <>សាខា៖ <b>{branchName}</b> មិនទាន់មានការកំណត់គណនីទូទាត់ប្រាក់នៅឡើយទេ។</>
              ) : (
                <>Branch: <b>{branchName}</b> has no payment settings.</>
              )}
            </div>
            <div style={{
              background: '#fff7e6', border: '1px solid #ffd591',
              borderRadius: 12, padding: '16px', fontSize: 13, color: '#d46b08', textAlign: 'left'
            }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                {lang === 'kh' ? 'របៀបដោះស្រាយ៖' : 'How to fix:'}
              </div>
              {hasShopMgmtPerm ? (
                lang === 'kh' ? (
                  <>
                    ១. ចូលទៅកាន់ <b>ការគ្រប់គ្រងហាង → សាខា</b><br />
                    ២. កែសម្រួលសាខា <b>{branchName}</b><br />
                    ៣. បញ្ចូល <b>Merchant ID</b> ឬ បង្ហោះរូបភាព <b>KHQR</b>
                  </>
                ) : (
                  <>
                    1. Go to <b>Shop Management → Branch</b><br />
                    2. Edit <b>{branchName}</b><br />
                    3. Set a <b>Merchant ID</b> or upload <b>KHQR Image</b>.
                  </>
                )
              ) : (
                lang === 'kh' ? (
                  <span>សូមទាក់ទងអ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin) ឬអ្នកចាត់ការទូទៅ (Manager) ដើម្បីបញ្ចូលគណនី និងរូបភាព QR សម្រាប់ទូទាត់ប្រាក់នៅសាខា <b>{branchName}</b>។</span>
                ) : (
                  <span>Please contact your system administrator or manager to configure QR payment settings for <b>{branchName}</b>.</span>
                )
              )}
            </div>
          </div>
        ) : paymentLink ? (
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div style={{
              background: '#fff',
              padding: '16px',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              border: '1px solid #f0f0f0',
              flexShrink: 0
            }}>
              <QRCode
                value={paymentLink}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "200px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#8c8c8c', fontWeight: 500 }}>Payment for Order</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e4a2d' }}>${Number(total || 0).toFixed(2)}</div>
                <div style={{ fontSize: 13, color: '#595959' }}>Order: #{orderNo}</div>
              </div>
              <div style={{
                background: '#e6f7ff',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #91d5ff',
                fontSize: '12px',
                color: '#0050b3'
              }}>
                Scan or click "Copy Link" to complete payment via the secure link.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Spin size="large" tip="Generating Secure QR Code..." />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default QRPaymentModal;