import React from 'react';
import axios from 'axios';
import './UploadPDF.css';

export default function UploadPDF({ onSuccess }) {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${apiBaseUrl}/api/pdf/upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload success:', res.data);
      onSuccess?.(res.data);
    } catch (err) {
      console.error('Upload error:', err);
      alert("❌ Failed to upload PDF");
    }
  };

  return (
    <div className="upload-container">
      <label className="file-label">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="file-input"
        />
        📄 Select PDF
      </label>
    </div>
  );
}
