import React from 'react';
import './ConfirmLogoutPopup.css';

export default function ConfirmLogoutPopup({ onConfirm, onCancel }) {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <p>Are you sure you want to log out?</p>
        <div className="popup-actions">
          <button onClick={onConfirm} className="btn confirm">Yes, Logout</button>
          <button onClick={onCancel} className="btn cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
}
