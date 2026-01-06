import React, { useEffect } from 'react';
import './Popup.css';

export default function Popup({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(); 
    }, 600);

    return () => clearTimeout(timer); 
  }, [onClose]);

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <p>{message}</p>
      </div>
    </div>
  );
}
