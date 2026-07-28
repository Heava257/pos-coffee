import React, { useState } from "react";
import { Card, Typography, Input, Button } from "antd";
import { CustomerServiceOutlined, SendOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const LiveChatPage = () => {
  const [chatMessages, setChatMessages] = useState([
    { sender: "agent", text: "Hello! Welcome to Live Support. How can we help you today?", time: "10:30 AM" }
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const newMsg = { sender: "user", text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput("");
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: "agent",
        text: "Thank you for the message. A support representative will join this session shortly.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <CustomerServiceOutlined /> Live Support Chat
        </Title>
        <Text type="secondary">
          Initiate real-time communications with active merchant terminals.
        </Text>
      </div>

      <Card title="Active Live Chat Session" bordered={true} style={{ border: '2px solid #1e4a2d' }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: 400, background: '#f8fafc', borderRadius: 12, border: '2px solid #1e4a2d', overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: '70%',
                background: msg.sender === "user" ? "#1e4a2d" : "#ffffff",
                color: msg.sender === "user" ? "#ffffff" : "#1e293b",
                padding: '10px 14px',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: msg.sender === "user" ? "none" : "1px solid #e2e8f0"
              }}>
                <div style={{ fontSize: 13 }}>{msg.text}</div>
                <div style={{ fontSize: 9, textAlign: 'right', marginTop: 4, opacity: 0.7 }}>{msg.time}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 12, background: '#ffffff', borderTop: '2px solid #1e4a2d', display: 'flex', gap: 10 }}>
            <Input
              placeholder="Type your message here..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onPressEnter={handleSendChat}
            />
            <Button type="primary" icon={<SendOutlined />} onClick={handleSendChat} />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LiveChatPage;
