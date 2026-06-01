import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Medal, Star, BookA, UserStar, Award, Lock, Unlock, Check, X } from 'lucide-react';
import schoolLogo from './gambar/SM_Sains_Sultan_Mohamad_Jiwa_logo.png';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const HOUSES = ['Panglima', 'Temenggung', 'Laksamana', 'Bendahara'];

const HOUSE_COLORS = {
  Panglima: '#EF4444',
  Temenggung: '#22C55E',
  Laksamana: '#3B82F6',
  Bendahara: '#FBBF24'
};

const DEFAULT_RAW_SCORES = {
  sahsiah:      { Temenggung: 95, Panglima: 88, Laksamana: 82, Bendahara: 75 },
  kokorikulum:  { Panglima: 180, Laksamana: 165, Bendahara: 155, Temenggung: 140 },
  akademik:     { Laksamana: 173, Panglima: 170, Temenggung: 145, Bendahara: 80 }
};

const ADMIN_PASSWORD = 'admin123';

function buildScores(raw) {
  const result = {};

  ['sahsiah', 'kokorikulum', 'akademik'].forEach(cat => {
    const entries = HOUSES.map(name => ({ name, score: raw[cat][name] ?? 0 }));
    const maxScore = Math.max(...entries.map(e => e.score), 1);
    result[cat] = entries
      .map(e => ({ ...e, percentage: Math.round((e.score / maxScore) * 100) }))
      .sort((a, b) => b.score - a.score);
  });

  const overall = HOUSES.map(name => ({
    name,
    score: (raw.sahsiah[name] ?? 0) + (raw.kokorikulum[name] ?? 0) + (raw.akademik[name] ?? 0)
  }));
  const maxOverall = Math.max(...overall.map(e => e.score), 1);
  result.keseluruhan = overall
    .map(e => ({ ...e }))
    .sort((a, b) => b.score - a.score);

  return result;
}

export default function RumahSukanDashboard() {
  const [activeTab, setActiveTab] = useState('keseluruhan');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [editingCell, setEditingCell] = useState(null); // { houseName, category }
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  const [rawScores, setRawScores] = useState(DEFAULT_RAW_SCORES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'scores', 'rawScores'), (snap) => {
      if (snap.exists()) {
        setRawScores(snap.data());
      } else {
        setDoc(doc(db, 'scores', 'rawScores'), DEFAULT_RAW_SCORES);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (editingCell && inputRef.current) inputRef.current.focus();
  }, [editingCell]);

  const scores = buildScores(rawScores);

  const handleAdminToggle = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      setEditingCell(null);
    } else {
      setShowPasswordModal(true);
      setPasswordInput('');
      setPasswordError('');
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdminMode(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Wrong password. Please try again.');
    }
  };

  const startEditing = (houseName, category) => {
    if (!isAdminMode || category === 'keseluruhan') return;
    setEditingCell({ houseName, category });
    setEditValue(String(rawScores[category][houseName] ?? 0));
  };

  const commitEdit = async () => {
    if (!editingCell) return;
    const val = parseInt(editValue, 10);
    if (!isNaN(val) && val >= 0) {
      const newScores = {
        ...rawScores,
        [editingCell.category]: {
          ...rawScores[editingCell.category],
          [editingCell.houseName]: val
        }
      };
      await setDoc(doc(db, 'scores', 'rawScores'), newScores);
    }
    setEditingCell(null);
  };

  const cancelEdit = () => setEditingCell(null);

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const getHouseColor = (name) => HOUSE_COLORS[name] || '#666';

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return <Award className="w-5 h-5 text-blue-400" />;
  };

  const currentScores = scores[activeTab];

  const tabs = [
    { id: 'keseluruhan', label: 'Keseluruhan Markah', },
    { id: 'sahsiah', label: 'Sahsiah', icon: <UserStar className="w-4 h-4" /> },
    { id: 'kokorikulum', label: 'Kokorikulum', icon: <Medal className="w-4 h-4" /> },
    { id: 'akademik', label: 'Akademik', icon: <BookA className="w-4 h-4" /> }
  ];

  if (loading) return (
    <div style={{
      background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#9CA3AF',
      fontSize: '18px',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      Page loading...
    </div>
  );

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
      minHeight: '100vh',
      padding: '40px 20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      position: 'relative'
    }}>

      {/* Admin Toggle Button */}
      <button
        onClick={handleAdminToggle}
        title={isAdminMode ? 'Logout Admin Mode' : 'Login Admin Mode'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          padding: '12px 20px',
          border: 'none',
          borderRadius: '12px',
          background: isAdminMode
            ? 'linear-gradient(135deg, #10B981, #059669)'
            : 'linear-gradient(135deg, #374151, #4B5563)',
          color: 'white',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: isAdminMode
            ? '0 4px 20px rgba(16,185,129,0.4)'
            : '0 4px 12px rgba(0,0,0,0.4)',
          transition: 'all 0.3s ease'
        }}
      >
        {isAdminMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        {isAdminMode ? 'Admin mode(Active)' : 'Admin'}
      </button>

      {/* Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '20px',
            padding: '36px',
            width: '100%',
            maxWidth: '360px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                display: 'inline-flex',
                padding: '16px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F97316, #EC4899)',
                marginBottom: '12px'
              }}>
                <Lock className="w-6 h-6" style={{ color: 'white' }} />
              </div>
              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0 }}>
                Admin Login
              </h2>
              <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '6px' }}>
                Enter password to edit scores.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <input
                autoFocus
                type="password"
                placeholder="Password..."
                value={passwordInput}
                onChange={e => { setPasswordInput(e.target.value); setPasswordError(''); }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: passwordError ? '1px solid #EF4444' : '1px solid #374151',
                  background: '#111827',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {passwordError && (
                <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px' }}>
                  {passwordError}
                </p>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: '1px solid #374151',
                    background: 'transparent',
                    color: '#9CA3AF',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #F97316, #EC4899)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '10px'
        }}>
          <img
            src={schoolLogo}
            alt="Logo Sekolah"
            style={{
              height: '80px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))'
            }}
          />
          <h1 style={{
            fontSize: '45px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #FBBF24, #F97316, #EC4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
            letterSpacing: '-1px',
            lineHeight: '1.2',
            padding: '4px 0',
            display: 'inline-block'
          }}>
            SISTEM RUMAH 
          </h1>
        </div>

        <p style={{ color: '#9CA3AF', fontSize: '16px', margin: 0 }}>
           Kedudukan Terkini Sistem Rumah SMADJ
        </p>
        {isAdminMode && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '12px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: '#10B981',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <Unlock className="w-3 h-3" />
            Mod Admin — Klik pada markah untuk mengedit
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '40px',
        flexWrap: 'wrap'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '12px',
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, #F97316, #EC4899)'
                : '#374151',
              color: activeTab === tab.id ? 'white' : '#D1D5DB',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              transform: activeTab === tab.id ? 'scale(1.05)' : 'scale(1)',
              boxShadow: activeTab === tab.id ? '0 4px 20px rgba(249, 115, 22, 0.4)' : 'none'
            }}
          >
            {tab.icon}
            {tab.label}
            {isAdminMode && tab.id !== 'keseluruhan' && (
              <span style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'rgba(16,185,129,0.25)',
                color: '#10B981',
                border: '1px solid rgba(16,185,129,0.4)'
              }}>
                EDIT
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Leaderboard Container */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gap: '16px' }}>
        {currentScores.map((entry, index) => {
          const houseColor = getHouseColor(entry.name);
          const rank = index + 1;
          const isEditing = editingCell?.houseName === entry.name && editingCell?.category === activeTab;
          const canEdit = isAdminMode && activeTab !== 'keseluruhan';

          return (
            <div
              key={entry.name}
              style={{
                background: '#1F2937',
                border: `1px solid ${canEdit ? houseColor + '40' : '#374151'}`,
                borderRadius: '16px',
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: '80px 1fr 140px',
                alignItems: 'center',
                gap: '24px',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                if (!canEdit) {
                  e.currentTarget.style.transform = 'translateX(8px)';
                  e.currentTarget.style.borderColor = houseColor;
                  e.currentTarget.style.boxShadow = `0 10px 30px ${houseColor}30`;
                }
              }}
              onMouseLeave={e => {
                if (!canEdit) {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.borderColor = '#374151';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {/* Rank Badge */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: houseColor,
                borderRadius: '12px',
                padding: '16px',
                minHeight: '80px',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '24px'
              }}>
                #{rank}
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  {getRankIcon(rank)}
                </div>
              </div>

              {/* House Name & Score Bar */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    color: houseColor,
                    fontSize: '18px',
                    fontWeight: '700',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {entry.name}
                  </h3>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#111827',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    background: houseColor,
                    width: `${entry.percentage}%`,
                    borderRadius: '4px',
                    transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: `0 0 10px ${houseColor}80`
                  }} />
                </div>
              </div>

              {/* Score Display / Edit */}
              <div style={{ textAlign: 'right' }}>
                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                    <input
                      ref={inputRef}
                      type="number"
                      min="0"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      style={{
                        width: '80px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: `2px solid ${houseColor}`,
                        background: '#111827',
                        color: houseColor,
                        fontSize: '20px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        outline: 'none'
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button
                        onClick={commitEdit}
                        style={{
                          padding: '4px',
                          border: 'none',
                          borderRadius: '6px',
                          background: '#10B981',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          padding: '4px',
                          border: 'none',
                          borderRadius: '6px',
                          background: '#EF4444',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => startEditing(entry.name, activeTab)}
                    style={{
                      cursor: canEdit ? 'pointer' : 'default',
                      padding: canEdit ? '6px 10px' : '0',
                      borderRadius: '10px',
                      border: canEdit ? `1px dashed ${houseColor}60` : 'none',
                      transition: 'all 0.2s ease',
                      display: 'inline-block'
                    }}
                    onMouseEnter={e => {
                      if (canEdit) e.currentTarget.style.borderColor = houseColor;
                    }}
                    onMouseLeave={e => {
                      if (canEdit) e.currentTarget.style.borderColor = `${houseColor}60`;
                    }}
                    title={canEdit ? 'Klik untuk edit markah' : undefined}
                  >
                    <div style={{
                      fontSize: '32px',
                      fontWeight: 'bold',
                      color: houseColor,
                      lineHeight: '1'
                    }}>
                      {entry.score}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                      {activeTab === 'keseluruhan' ? 'jumlah' : 'markah'}
                      {canEdit && <span style={{ color: '#10B981', marginLeft: '4px' }}>✎</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin hint for keseluruhan */}
      {isAdminMode && activeTab === 'keseluruhan' && (
        <div style={{
          maxWidth: '1000px',
          margin: '20px auto 0',
          padding: '14px 20px',
          borderRadius: '10px',
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.2)',
          color: '#FBBF24',
          fontSize: '13px',
          textAlign: 'center'
        }}>
          💡 Keseluruhan = Sahsiah + Kokorikulum + Akademik.
          Tukar tab lain untuk mengedit markah.
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '60px',
        textAlign: 'center',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        maxWidth: '1000px',
        margin: '60px auto 0'
      }}>
        <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
          💪 Goodluck to all students! You represents your house with pride and determination.
        </p>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
