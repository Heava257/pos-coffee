import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, message } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { request } from '../../util/helper';

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [msg, setMsg] = useState('Verifying your email...');

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    useEffect(() => {
        if (!token || !email) {
            setStatus('error');
            setMsg('Invalid verification link.');
            setLoading(false);
            return;
        }

        handleVerify();
    }, []);

    const handleVerify = async () => {
        try {
            const res = await request("auth/verify-email", "post", { token, email });
            setStatus('success');
            setMsg(res.message || "Email verified successfully!");
            
            // 🚀 SEAMLESS LOGIN: Store credentials and redirect
            if (res.access_token && res.profile) {
                localStorage.setItem("access_token", res.access_token);
                localStorage.setItem("profile", JSON.stringify(res.profile));
                localStorage.setItem("permission", JSON.stringify(res.permission || []));
                
                message.success("Account activated! Redirecting to dashboard...");
                setTimeout(() => {
                    navigate("/");
                    window.location.reload(); // Refresh to update layouts/sidebar
                }, 2000);
            }
        } catch (error) {
            setStatus('error');
            setMsg(error.message || "Verification failed. Link may be expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            background: '#f0f2f5' 
        }}>
            <div style={{ 
                background: 'white', 
                padding: '40px', 
                borderRadius: '12px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center'
            }}>
                {loading ? (
                    <div style={{ padding: '40px' }}>
                        <Spin size="large" />
                        <h3 style={{ marginTop: '20px' }}>Verifying your email...</h3>
                    </div>
                ) : status === 'success' ? (
                    <Result
                        status="success"
                        title="Verification Successful!"
                        subTitle="Account activated! Redirecting you to the dashboard..."
                        extra={[
                            <Spin size="small" style={{ marginRight: 8 }}/>,
                            <span style={{ color: '#1e4a2d' }}>Loading your enterprise workspace...</span>
                        ]}
                    />
                ) : (
                    <Result
                        status="error"
                        title="Verification Failed"
                        subTitle={msg}
                        extra={[
                            <Button type="primary" key="retry" size="large" onClick={() => navigate('/login')}>
                                Back to Login
                            </Button>
                        ]}
                    />
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
