import React, { useEffect, useState, useMemo } from "react";
import { request } from "../../util/helper";
import { Row, Col, Typography, Spin, Carousel, Tag, Badge } from "antd";
import { Coffee, Star, Zap, Flame, Crown, Clock, Heart, Award, Maximize, Minimize } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const { Title, Text } = Typography;

const THEME = {
  bg: "radial-gradient(circle at center, #1a1a1a 0%, #050505 100%)",
  onyx: "#121212",
  gold: "#c0a060",
  goldGlow: "rgba(192, 160, 96, 0.4)",
  white: "#ffffff",
  glass: "rgba(20, 20, 20, 0.7)",
  accent: "#d4af37"
};

const ParallaxCard = ({ children, idx }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        height: '100%'
      }}
    >
      <div style={{
        background: THEME.glass,
        backdropFilter: 'blur(10px)',
        padding: '25px',
        borderRadius: '24px',
        border: '1px solid rgba(192, 160, 96, 0.15)',
        height: '100%',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden',
        transform: "translateZ(50px)"
      }}>
        {children}
      </div>
    </motion.div>
  );
};

const DigitalMenuBoard = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
    const fetchInterval = setInterval(fetchData, 60000);
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(clockInterval);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const fetchData = async () => {
    try {
      const prodRes = await request("product", "get");
      const catRes = await request("category", "get");
      if (prodRes && prodRes.list) setProducts(prodRes.list);
      if (catRes && catRes.list) setCategories(catRes.list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const groupedMenu = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      items: products.filter(p => p.category_id === cat.id).slice(0, 6)
    })).filter(cat => cat.items.length > 0);
  }, [products, categories]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <Coffee size={64} color={THEME.gold} />
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      background: THEME.bg, 
      color: THEME.white, 
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "'Inter', 'Kantumruy Pro', sans-serif"
    }}>
      {/* BACKGROUND AMBIANCE */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: THEME.goldGlow,
        filter: 'blur(150px)',
        borderRadius: '50%',
        opacity: 0.15,
        zIndex: 0
      }} />

      <Row gutter={0} style={{ height: '100%', position: 'relative', zIndex: 1 }}>
        
        {/* LEFT PANEL: MENU EXPLORER */}
        <Col span={15} style={{ height: '100%', padding: '50px', display: 'flex', flexDirection: 'column' }}>
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ marginBottom: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 10 }}>
                <div style={{ width: 40, height: 2, background: THEME.gold }} />
                <Text style={{ color: THEME.gold, textTransform: 'uppercase', letterSpacing: 5, fontWeight: 700, fontSize: 14 }}>
                  Est. 2024 • Premium Roastery
                </Text>
              </div>
              <Title level={1} style={{ color: THEME.white, margin: 0, fontSize: 64, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -1 }}>
                ONYX & <span style={{ color: THEME.gold, textShadow: `0 0 30px ${THEME.goldGlow}` }}>GOLD</span>
              </Title>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Title level={2} style={{ color: THEME.white, margin: 0, fontWeight: 300, fontSize: 32 }}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Title>
              <Text style={{ color: THEME.gold }}>{currentTime.toLocaleDateString('km-KH', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
            </div>
          </motion.div>

          <Row gutter={[40, 40]} style={{ flex: 1 }}>
            {groupedMenu.slice(0, 4).map((cat, idx) => (
              <Col span={12} key={cat.id}>
                <ParallaxCard idx={idx}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Coffee size={24} color={THEME.gold} />
                      <Title level={3} style={{ color: THEME.gold, margin: 0, fontSize: 22, fontWeight: 800, textTransform: 'uppercase' }}>
                        {cat.name}
                      </Title>
                    </div>
                    <Badge count={cat.items.length} style={{ backgroundColor: THEME.gold, color: '#000', fontWeight: 'bold' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    {cat.items.map((item, i) => (
                      <motion.div 
                        key={item.id} 
                        whileHover={{ x: 5 }}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 18, fontWeight: 600, color: THEME.white }}>{item.name}</Text>
                            {i === 0 && <Tag color="#c0a060" style={{ border: 'none', borderRadius: 4, fontSize: 10, height: 18, padding: '0 5px' }}>ល្អបំផុត</Tag>}
                          </div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{item.description || 'សម្រិតសម្រាំងបំផុត'}</div>
                        </div>
                        <div style={{ textAlign: 'right', position: 'relative' }}>
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ 
                              position: 'absolute', 
                              top: 0, left: 0, right: 0, bottom: 0, 
                              background: 'linear-gradient(90deg, transparent, rgba(192, 160, 96, 0.2), transparent)',
                              zIndex: 1
                            }}
                          />
                          <div style={{ fontSize: 20, fontWeight: 800, color: THEME.white, position: 'relative', zIndex: 2 }}>
                            ${Number(item.price).toFixed(2)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* DECORATIVE ELEMENT */}
                  <div style={{ position: 'absolute', bottom: -20, right: -20, opacity: 0.03 }}>
                    <Coffee size={150} color={THEME.gold} />
                  </div>
                </ParallaxCard>
              </Col>
            ))}
          </Row>

          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Award size={20} color={THEME.gold} />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>គ្រាប់កាហ្វេលេខ១</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={20} color={THEME.gold} />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>ឆុងក្នុងរយៈពេល ៤នាទី</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Heart size={20} color={THEME.gold} />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>ធ្វើឡើងដោយក្តីស្រឡាញ់</Text>
              </div>
            </div>
            <div style={{ background: 'rgba(192, 160, 96, 0.1)', padding: '10px 20px', borderRadius: '100px', border: `1px solid ${THEME.goldGlow}` }}>
              <Text style={{ color: THEME.gold, fontWeight: 700 }}>ស្កែនដើម្បីទទួលបានការបញ្ចុះតម្លៃ • @KOFI_POS</Text>
            </div>
          </div>
        </Col>

        {/* RIGHT PANEL: VISUAL SHOWCASE */}
        <Col span={9} style={{ height: '100%', padding: '20px' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              height: '100%', 
              background: '#000', 
              borderRadius: '40px', 
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 30px 100px rgba(0,0,0,1)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Carousel autoplay effect="fade" autoplaySpeed={5000} style={{ height: '100%' }}>
              {[
                {
                  img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1000",
                  title: "GOLDEN MATCHA",
                  tag: "ការផ្តល់ជូនពិសេស",
                  desc: "Premium grade Uji matcha with a touch of honey gold."
                },
                {
                  img: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=1000",
                  title: "OBSIDIAN LATTE",
                  tag: "ភេសជ្ជៈប្រចាំហាង",
                  desc: "Dark charcoal infused espresso with velvet cream."
                },
                {
                  img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1000",
                  title: "AMBER BREW",
                  tag: "រសជាតិថ្មី",
                  desc: "Cold extracted for 18 hours. Pure, crisp, and bold."
                }
              ].map((slide, i) => (
                <div key={i} style={{ height: '100vh', position: 'relative' }}>
                  <img 
                    src={slide.img} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                    alt={slide.title}
                  />
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    padding: '60px 40px', 
                    background: 'linear-gradient(transparent, rgba(0,0,0,1))' 
                  }}>
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Tag color="#c0a060" style={{ border: 'none', borderRadius: '100px', padding: '4px 15px', fontWeight: 800, marginBottom: 15 }}>
                        {slide.tag}
                      </Tag>
                      <Title level={1} style={{ color: THEME.white, margin: '10px 0', fontSize: 48, fontWeight: 900, textTransform: 'uppercase' }}>
                        {slide.title}
                      </Title>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, maxWidth: '80%', display: 'block' }}>
                        {slide.desc}
                      </Text>
                      
                      <div style={{ marginTop: 30, display: 'flex', gap: 15 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: THEME.gold }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                      </div>
                    </motion.div>
                  </div>
                </div>
              ))}
            </Carousel>

            {/* FLOATING 3D ICON OVERLAY */}
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: 'absolute',
                top: 40,
                right: 40,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                width: 80,
                height: 80,
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
                zIndex: 10
              }}
            >
              <Crown size={40} color={THEME.gold} />
            </motion.div>
          </motion.div>
        </Col>

      </Row>

      {/* FLOATING FULLSCREEN TOGGLE */}
      <motion.div
        whileHover={{ scale: 1.1, background: THEME.gold }}
        onClick={toggleFullscreen}
        style={{
          position: 'absolute',
          bottom: 30,
          right: 30,
          width: 50,
          height: 50,
          borderRadius: '15px',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 100,
          transition: 'all 0.3s ease'
        }}
      >
        {isFullscreen ? <Minimize size={20} color={isFullscreen ? "#000" : THEME.gold} /> : <Maximize size={20} color={THEME.gold} />}
      </motion.div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&family=Kantumruy+Pro:wght@100;300;400;600;700&display=swap');
        
        .ant-carousel .slick-slide {
          height: 100vh;
        }
        
        ::-webkit-scrollbar {
          display: none;
        }

        .ant-typography {
          font-family: 'Inter', 'Kantumruy Pro', sans-serif !important;
        }
      `}</style>
    </div>
  );
};

export default DigitalMenuBoard;

