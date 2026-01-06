import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import './DisplayPDFWords.css';

const LeftArrow = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none" viewBox="0 0 24 24" stroke="currentColor"
    strokeWidth={2} width="20" height="20"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const RightArrow = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none" viewBox="0 0 24 24" stroke="currentColor"
    strokeWidth={2} width="20" height="20"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export default function DisplayPDFWords({ pdfId, accessToken }) {
  const [pages, setPages] = useState([]);
  const [paginatedPages, setPaginatedPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem(`currentPage_${pdfId}`);
    return savedPage ? parseInt(savedPage, 10) : 0;
  });
  const [showPopup, setShowPopup] = useState(false);
  const [translatedWord, setTranslatedWord] = useState('');
  const [originalWord, setOriginalWord] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const measureRef = useRef(null);
  const containerRef = useRef(null);

  const [allWords, setAllWords] = useState([]);

  const resizeTimeout = useRef(null);

  useEffect(() => {
    const fetchText = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${apiBaseUrl}/api/pdf/${pdfId}/extract/`);
        setPages(res.data.pages);
        setCurrentPage(() => {
          const savedPage = localStorage.getItem(`currentPage_${pdfId}`);
          return savedPage ? parseInt(savedPage, 10) : 0;
        });
      } catch (err) {
        console.error('Failed to fetch extracted text:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchText();
  }, [pdfId, apiBaseUrl]);

  useEffect(() => {
    const flattened = pages.flat();
    setAllWords(flattened);
  }, [pages]);

const paginateWords = useCallback(() => {
    if (!allWords.length) {
      setPaginatedPages([]);
      return;
    }

    const container = measureRef.current;
    const displayContainer = containerRef.current;
    if (!container || !displayContainer) return;

    const computedStyle = window.getComputedStyle(displayContainer);
    container.style.width = computedStyle.width;
    container.style.fontSize = computedStyle.fontSize;
    container.style.lineHeight = computedStyle.lineHeight;
    container.style.fontWeight = computedStyle.fontWeight;
    container.style.fontFamily = computedStyle.fontFamily;
    container.style.padding = computedStyle.padding;
    container.style.letterSpacing = computedStyle.letterSpacing;
    container.style.wordSpacing = computedStyle.wordSpacing;
    container.style.whiteSpace = 'normal';
    container.style.boxSizing = computedStyle.boxSizing || 'border-box';
    const maxHeight = displayContainer.clientHeight;
    let chunks = [];
    let tempWords = [];

    container.innerHTML = '';
    for (let i = 0; i < allWords.length; i++) {
      const wordObj = allWords[i];
      const span = document.createElement('span');
      span.textContent = wordObj.word + ' ';
      span.className = 'measure-word';
      container.appendChild(span);

      tempWords.push(wordObj);

      if (container.scrollHeight > maxHeight) {
        tempWords.pop();
        container.removeChild(span);
        if (tempWords.length > 0) {
          chunks.push(tempWords);
        }
        tempWords = [wordObj];
        container.innerHTML = '';
        const newSpan = document.createElement('span');
        newSpan.textContent = wordObj.word + ' ';
        newSpan.className = 'measure-word';
        container.appendChild(newSpan);
      }
    }
    if (tempWords.length > 0) {
      chunks.push(tempWords);
    }

    setPaginatedPages(chunks);

    setCurrentPage((p) => (p >= chunks.length ? 0 : p));
  }, [allWords]);

useEffect(() => {
  paginateWords();
}, [paginateWords]);

useEffect(() => {
  const handleResize = () => {
    clearTimeout(resizeTimeout.current);
    resizeTimeout.current = setTimeout(() => {
      paginateWords();
    }, 200);
  };
  window.addEventListener('resize', handleResize);
  return () => {
    clearTimeout(resizeTimeout.current);
    window.removeEventListener('resize', handleResize);
  };
}, [paginateWords]);

  const handleTranslate = async (word) => {
    const cleanedWord = word.replace(/[^\w\d]/g, '');
    try {
      const res = await axios.post(`${apiBaseUrl}/api/pdf/translate/`, { word: cleanedWord });
      setOriginalWord(cleanedWord);
      setTranslatedWord(res.data.translated);
      setShowPopup(true);
    } catch (err) {
      console.error('Translation failed:', err);
    }
  };

  const handleSaveWord = async () => {
    setSaveLoading(true);
    try {
      if (!accessToken) {
        alert('Please login to save words.');
        setSaveLoading(false);
        return;
      }

      await axios.post(
        `${apiBaseUrl}/api/learnwords/save/`,
        { word: originalWord.toLowerCase(), translation: translatedWord },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setTimeout(() => {
        setSaveLoading(false);
        setShowPopup(false);
        setTranslatedWord('');
        setOriginalWord('');
      }, 150);
    } catch (err) {
      console.error('Save word failed:', err);
      alert('❌ Failed to save word.');
      setSaveLoading(false);
      setShowPopup(false);
      setTranslatedWord('');
      setOriginalWord('');
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setTranslatedWord('');
    setOriginalWord('');
  };

  const prevPage = () => {
    setCurrentPage((p) => {
      const newPage = p > 0 ? p - 1 : 0;
      localStorage.setItem(`currentPage_${pdfId}`, newPage);
      return newPage;
    });
  };

  const nextPage = () => {
    setCurrentPage((p) => {
      const newPage = p < paginatedPages.length - 1 ? p + 1 : p;
      localStorage.setItem(`currentPage_${pdfId}`, newPage);
      return newPage;
    });
  };

  if (loading) return <p className="book-loading">Loading PDF content...</p>;

  return (
    <>
      <div className="book-container">
        <div className="book-frame">
          <div
            className="book-page"
            ref={containerRef}
          >
            {paginatedPages[currentPage] && (
              <div className="book-text">
                {paginatedPages[currentPage].map((w, i) => (
                  <span
                    key={i}
                    onClick={() => handleTranslate(w.word)}
                    title="Click to translate"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleTranslate(w.word);
                      }
                    }}
                  >
                    {w.word}{' '}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="pagination-buttons">
            <button onClick={prevPage} disabled={currentPage === 0} className="page-btn">
              <LeftArrow /> Previous
            </button>
            <span>
              Page {currentPage + 1} of {paginatedPages.length || 1}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === paginatedPages.length - 1}
              className="page-btn"
            >
              Next <RightArrow />
            </button>
          </div>
        </div>
      </div>

      <div className="measure-container" ref={measureRef} />

      {showPopup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <h2>Translated</h2>
            <p className="original-word">{originalWord}</p>
            <p className="translated-word">{translatedWord}</p>
            <div className="popup-actions">
              {accessToken && (
                <button
                  onClick={handleSaveWord}
                  disabled={saveLoading}
                  className="popup-btn"
                >
                  {saveLoading ? 'Saving...' : 'Save'}
                </button>
              )}
              <button
                onClick={closePopup}
                className="popup-btn"
                disabled={saveLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
