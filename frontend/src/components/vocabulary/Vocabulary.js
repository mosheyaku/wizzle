import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './Vocabulary.css';

export default function Vocabulary({ accessToken }) {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [learnedWord, setLearnedWord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [waitingForFlipBack, setWaitingForFlipBack] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE_URL;

  const fetchWords = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/learnwords/mywords/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setWords(res.data);
      setCurrentIndex(0);
      setFlipped(false);
    } catch (err) {
      console.error('Failed to fetch saved words:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, API_BASE]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const processStatus = async (remembered) => {
    if (currentIndex >= words.length) return;

    const wordObj = words[currentIndex];
    try {
      const res = await axios.post(
        `${API_BASE}/api/learnwords/saved-words/review/`,
        { word_id: wordObj.id, remembered },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data.status === 'fully_learned') {
        setLearnedWord(wordObj);
        setShowPopup(true);
      } else {
        setWords((prev) => {
          const copy = [...prev];
          copy[currentIndex] = res.data;
          return copy;
        });
      }

      setCurrentIndex((prev) => prev + 1);
      setFlipped(false);
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleStatus = (remembered) => {
    if (waitingForFlipBack) return;

    if (flipped) {
      setWaitingForFlipBack(true);
      setFlipped(false);
      setTimeout(() => {
        processStatus(remembered);
        setWaitingForFlipBack(false);
      }, 600);
    } else {
      processStatus(remembered);
    }
  };

  const handleKeepWord = async () => {
    if (!learnedWord) return;
    try {
      await axios.post(
        `${API_BASE}/api/learnwords/reset_learning/`,
        { word_id: learnedWord.id },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setShowPopup(false);
      setLearnedWord(null);
      fetchWords();
    } catch (err) {
      console.error('Failed to reset learning:', err);
    }
  };

  const handleRemoveWord = async () => {
    if (!learnedWord) return;
    try {
      await axios.delete(
        `${API_BASE}/api/learnwords/save/${learnedWord.id}/`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setShowPopup(false);
      setLearnedWord(null);
      fetchWords();
    } catch (err) {
      console.error('Failed to remove word:', err);
    }
  };

  if (loading) return <p className="loading-text">Loading words...</p>;

  if (words.length === 0 || currentIndex >= words.length) {
    return <p className="loading-text">No words to review now. Come back later!</p>;
  }

  const currentWord = words[currentIndex];

  return (
    <div className="vocab-container">
      <h2 className="vocab-title">Learn Words</h2>

      <div
        className={`card ${flipped ? 'flipped' : ''}`}
        onClick={() => {
          if (!waitingForFlipBack) setFlipped((f) => !f);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !waitingForFlipBack)
            setFlipped((f) => !f);
        }}
        aria-label="Flip card to see translation"
      >
        <div className="card-front">{currentWord.word}</div>
        <div className="card-back">{currentWord.translation || 'No translation'}</div>
      </div>

      <div className="buttons">
        <button
          className="status-btn forgot"
          onClick={() => handleStatus(false)}
          aria-label="Did not remember"
          disabled={waitingForFlipBack}
        >
          ❌
        </button>
        <button
          className="status-btn remembered"
          onClick={() => handleStatus(true)}
          aria-label="Remembered"
          disabled={waitingForFlipBack}
        >
          ✅
        </button>
      </div>

      {showPopup && (
        <div className="popup-overlay" role="dialog" aria-modal="true">
          <div className="popup-box">
            <h3>Word Learned!🎉</h3>
            <p>
              You have fully learned <strong>{learnedWord.word}</strong>.
            </p>
            <p>Would you like to keep it in your list or remove it?</p>
            <div className="popup-actions">
              <button onClick={handleKeepWord} className="popup-btn keep-btn">
                Keep Learning
              </button>
              <button onClick={handleRemoveWord} className="popup-btn remove-btn">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
