import React, { useState } from 'react';
import { Modal, Button, message, Spin } from 'antd';
import QRCode from 'react-qr-code';
import { QrcodeOutlined, CopyOutlined } from '@ant-design/icons';

const QRPaymentModal = ({ visible, onClose, paymentLink, orderNo, total }) => {
  const [copying, setCopying] = useState(false);

  const handleCopyLink = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(paymentLink);
      message.success('Payment link copied to clipboard!');
    } catch (error) {
      message.error('Failed to copy link');
    } finally {
      setCopying(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <QrcodeOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
          Payment QR Code
        </div>
      }
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="copy" icon={<CopyOutlined />} onClick={handleCopyLink} loading={copying}>
          Copy Link
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      width={400}
      centered
    >
      <div style={{ textAlign: 'center', padding: '20px' }}>
        {paymentLink ? (
          <>
            <div style={{ 
              background: '#f5f5f5', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <QRCode
                value={paymentLink}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p><strong>Order:</strong> {orderNo}</p>
              <p><strong>Amount:</strong> ${total}</p>
            </div>

            <div style={{ 
              background: '#e6f7ff', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#1890ff'
            }}>
              Scan QR code or click "Copy Link" to complete payment
            </div>
          </>
        ) : (
          <div style={{ padding: '40px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px' }}>Generating payment link...</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default QRPaymentModal;