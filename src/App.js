import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Paper, Grid, IconButton, Divider } from '@mui/material';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import MinimizeIcon from '@mui/icons-material/Minimize';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PhoneIcon from '@mui/icons-material/Phone';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { motion } from 'framer-motion';
import Menu from './Menu';
import './App.css';

function App() {
  const [analyzingResult, setAnalyzingResult] = useState('');
  const [username, setUsername] = useState('');
  const [contact, setContact] = useState('');
  const [type, setType] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [result, setResult] = useState('');
  const [countdown, setCountdown] = useState(10);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const avatarRef = useRef(null);
  const resultRef = useRef(null);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchStartPosition, setTouchStartPosition] = useState({ x: 0, y: 0 });
  const iframeRef = useRef(null);
  const [iframeSrc, setIframeSrc] = useState("https://fly88u.cc/?id=299796531");



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Kiểm tra xem username đã tồn tại chưa
      const userDoc = await getDoc(doc(db, 'users', username));
      
      if (!userDoc.exists()) {
        // Nếu tài khoản chưa tồn tại, thêm mới
        await setDoc(doc(db, 'users', username), {
          username,
          contact,
          type: 0,
          timestamp: new Date()
        });
      } else {
        // Nếu tài khoản đã tồn tại, lấy giá trị type từ Firebase
        setType(userDoc.data().type);
      }
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  const handleMouseDown = (e) => {
    const targetRef = e.target.closest('.minimized-avatar') ? avatarRef : resultRef;
    if (e.target === targetRef.current || 
        (e.target.closest('.draggable-area') && !e.target.closest('.minimize-button')) ||
        e.target.closest('.minimized-avatar')) {
      e.preventDefault();
      setIsDragging(true);
      const rect = targetRef.current.getBoundingClientRect();
      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top
      });

      // Lưu thời gian và vị trí bắt đầu chạm cho mobile
      if (e.touches) {
        setTouchStartTime(Date.now());
        setTouchStartPosition({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        });
      }
    }
  };

  const handleTouchEnd = (e) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;
    
    // Nếu thời gian chạm ngắn (dưới 200ms) và không di chuyển nhiều (dưới 10px) thì coi là click
    if (touchDuration < 200 && e.changedTouches) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const moveDistance = Math.sqrt(
        Math.pow(touchEndX - touchStartPosition.x, 2) +
        Math.pow(touchEndY - touchStartPosition.y, 2)
      );
      
      if (moveDistance < 10) {
        setIsMinimized(false);
      }
    }
    
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    setPosition({
      x: clientX - dragOffset.x,
      y: clientY - dragOffset.y
    });
  };

  const handleMouseUp = (e) => {
    if (isDragging) {
      e.preventDefault();
    }
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleIframeLoad = () => {
    try {
      const iframe = iframeRef.current;
      const links = iframe.querySelectorAll("a");
      links.forEach(link => {
        link.setAttribute("target", "_self");
      });
    } catch (e) {
      console.warn("Không thể chỉnh sửa iframe (CORS).");
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh',
      overflow: 'hidden',
      position: 'fixed'
    }}>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        onLoad={handleIframeLoad}
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none',
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserDrag: 'none',
          WebkitTapHighlightColor: 'transparent',
          WebkitTextSizeAdjust: 'none',
          textSizeAdjust: 'none',
          fontSizeAdjust: 'none',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}
        title="F168 Frame"
        scrolling="no"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
      
      <Menu
        avatarRef={avatarRef}
        resultRef={resultRef}
        position={position}
        isDragging={isDragging}
        handleMouseDown={handleMouseDown}
        handleTouchEnd={handleTouchEnd}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
        isSubmitted={isSubmitted}
        handleSubmit={handleSubmit}
        username={username}
        setUsername={setUsername}
        contact={contact}
        setContact={setContact}
        result={result}
        type={type}
        setIsSubmitted={setIsSubmitted}
      />
    </div>
  );
}

export default App;
