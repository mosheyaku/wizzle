import React from 'react';
import UploadPDF from '../upload-pdf/UploadPDF';
import DisplayPDFWords from '../display-pdf-words/DisplayPDFWords';

export default function MainPage({ pdfId, onUploadSuccess, user, accessToken }) {
  return (
    <div className={`app-container ${pdfId ? 'uploaded' : ''}`}>
      {user && <p className="welcome-message">Hello, {user.first_name}!👋</p>}
      <UploadPDF onSuccess={onUploadSuccess} />
      {pdfId && (
        <>
          <hr />
          <DisplayPDFWords pdfId={pdfId} accessToken={accessToken} user={user} />
        </>
      )}
    </div>
  );
}
