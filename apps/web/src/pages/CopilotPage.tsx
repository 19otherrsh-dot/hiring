import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles, Clock, Target, ChevronDown, ChevronRight,
  Copy, Check, AlertCircle, Zap, Brain
} from 'lucide-react';

export default function CopilotPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [questions, setQuestions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<{speaker: string, text: string}[]>([]);
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (user?.role === 'RECRUITER') {
      api.getMyJobs().then(setJobs).catch(() => {});
    }
  }, [user]);

  const handleGenerate = async () => {
    if (!selectedJob) return;
    setLoading(true);
    setQuestions(null);
    try {
      const data = await api.generateInterviewQuestions(selectedJob);
      setQuestions(data);
    } catch (err: any) {
      alert(err.message || 'Failed to generate questions');
    }
    setLoading(false);
  };

  const copyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const copyAll = () => {
    if (!questions?.questions) return;
    const text = questions.questions
      .map((q: any, i: number) => `${i + 1}. [${q.category}] ${q.question}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedIdx(-1);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const categoryColors: Record<string, string> = {
    'Technical': '#6366f1',
    'Behavioral': '#f59e0b',
    'System Design': '#06b6d4',
    'Culture Fit': '#10b981',
    'Skill Gap': '#ef4444',
  };

  const difficultyColors: Record<string, string> = {
    'Easy': '#10b981',
    'Medium': '#f59e0b',
    'Hard': '#ef4444',
    'Expert': '#8b5cf6',
  };

  const toggleListening = () => {
    if (!isListening) {
      setTranscript([]);
      setLiveSuggestions([]);
      let step = 0;
      const tId = setInterval(() => {
        if (step === 0) {
          setTranscript(prev => [...prev, { speaker: 'Recruiter', text: 'Could you tell me about your experience with React?' }]);
        } else if (step === 1) {
          setTranscript(prev => [...prev, { speaker: 'Candidate', text: 'I have used React for 3 years, mainly building dashboards with Redux and React Query.' }]);
          setLiveSuggestions(['Ask about state management tradeoffs', 'Ask for examples of complex hooks they wrote']);
        } else if (step === 2) {
          setTranscript(prev => [...prev, { speaker: 'Candidate', text: 'I also optimized rendering performance using memo.' }]);
          setLiveSuggestions(['Ask how they measure React performance', 'Ask what useMemo vs useCallback does']);
        }
        step++;
        if (step > 2) clearInterval(tId);
      }, 3000);
    }
    setIsListening(!isListening);
  };

  if (user?.role !== 'RECRUITER') {
    return (
      <div className="empty-state fade-in">
        <div className="empty-state-icon">🔒</div>
        <p>Interview copilot is available for recruiters.</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Brain size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            Interview AI Copilot
          </h1>
          <p className="page-subtitle">Generate structured questions or run a Live Interview Copilot session</p>
        </div>
        <button 
          className={isLiveMode ? "btn btn-secondary" : "btn btn-primary"} 
          onClick={() => setIsLiveMode(!isLiveMode)}
        >
          <Zap size={16} /> {isLiveMode ? 'Exit Live Mode' : 'Start Live Mode'}
        </button>
      </div>

      {/* Job Selector */}
      {!isLiveMode && (
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Select a Job</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
            <select
              className="input"
              value={selectedJob}
              onChange={e => setSelectedJob(e.target.value)}
            >
              <option value="">Choose a job posting…</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} — {j.location} ({j._count?.applications || 0} applicants)
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={!selectedJob || loading}
            style={{ height: 44, whiteSpace: 'nowrap' }}
          >
            {loading ? (
              <><span className="pulse">⚡</span> Generating…</>
            ) : (
              <><Sparkles size={16} /> Generate Questions</>
            )}
          </button>
        </div>
      </div>
      )}

      {/* Results */}
      {!isLiveMode && questions && (
        <div className="fade-in">
          {/* Summary strip */}
          <div style={{
            display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap',
            alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                <Target size={14} style={{ marginRight: 4 }} /> {questions.job_title}
              </div>
              <div className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', fontSize: '0.8rem', padding: '6px 12px' }}>
                {questions.seniority} Level
              </div>
              <div className="badge" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', fontSize: '0.8rem', padding: '6px 12px' }}>
                <Clock size={14} style={{ marginRight: 4 }} /> ~{questions.estimated_duration}
              </div>
              <div className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', fontSize: '0.8rem', padding: '6px 12px' }}>
                {questions.total_questions} questions
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={copyAll}>
              {copiedIdx === -1 ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy All</>}
            </button>
          </div>

          {questions.fallback && (
            <div style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: '0.85rem', color: '#f59e0b',
            }}>
              <AlertCircle size={16} />
              AI service unavailable — showing skill-based fallback questions.
            </div>
          )}

          {/* Question Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {questions.questions.map((q: any, i: number) => (
              <div
                key={i}
                className="card"
                style={{
                  padding: '16px 20px',
                  borderLeft: `4px solid ${categoryColors[q.category] || '#6366f1'}`,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    {/* Meta badges row */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span className="badge" style={{
                        background: `${categoryColors[q.category] || '#6366f1'}18`,
                        color: categoryColors[q.category] || '#6366f1',
                        fontSize: '0.7rem',
                      }}>
                        {q.category}
                      </span>
                      <span className="badge" style={{
                        background: `${difficultyColors[q.difficulty] || '#f59e0b'}15`,
                        color: difficultyColors[q.difficulty] || '#f59e0b',
                        fontSize: '0.7rem',
                      }}>
                        {q.difficulty}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {q.time_estimate}
                      </span>
                    </div>

                    {/* Question text */}
                    <p style={{ margin: 0, fontWeight: 500, fontSize: '0.92rem', lineHeight: 1.55 }}>
                      {q.question}
                    </p>

                    {/* Follow-ups */}
                    {q.follow_ups?.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <button
                          onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--accent-primary)', fontSize: '0.78rem',
                            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                            padding: 0, fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {expandedIdx === i ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          {q.follow_ups.length} Follow-up{q.follow_ups.length > 1 ? 's' : ''}
                        </button>
                        {expandedIdx === i && (
                          <ul style={{
                            margin: '8px 0 0', paddingLeft: 20,
                            fontSize: '0.83rem', color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                          }}>
                            {q.follow_ups.map((f: string, fi: number) => (
                              <li key={fi}>{f}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Copy button */}
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flexShrink: 0, padding: '6px 8px' }}
                    onClick={() => copyQuestion(q.question, i)}
                    title="Copy question"
                  >
                    {copiedIdx === i ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLiveMode && (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Live Transcript Pane */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 500 }}>
            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>Live Transcript</h3>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {transcript.length === 0 ? (
                <div className="empty-state" style={{ height: '100%', margin: 0 }}>Click Start to simulate live transcription.</div>
              ) : (
                transcript.map((t, idx) => (
                  <div key={idx} style={{ 
                    alignSelf: t.speaker === 'Recruiter' ? 'flex-end' : 'flex-start',
                    background: t.speaker === 'Recruiter' ? 'var(--color-primary)' : 'var(--bg-elevated)',
                    color: t.speaker === 'Recruiter' ? 'white' : 'var(--text-primary)',
                    padding: '8px 12px', borderRadius: 12, maxWidth: '80%'
                  }}>
                    <div style={{ fontSize: '0.65rem', opacity: 0.8, marginBottom: 2 }}>{t.speaker}</div>
                    <div style={{ fontSize: '0.9rem' }}>{t.text}</div>
                  </div>
                ))
              )}
            </div>
            <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)', marginTop: 12 }}>
              <button 
                className={isListening ? "btn btn-secondary" : "btn btn-primary"} 
                style={{ width: '100%' }}
                onClick={toggleListening}
              >
                {isListening ? '🛑 Stop Mock Session' : '🎙️ Start Mock Session'}
              </button>
            </div>
          </div>

          {/* AI Suggestions Pane */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 500, background: '#f8fafc' }}>
            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="var(--accent-primary)" /> Copilot Suggestions
            </h3>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {liveSuggestions.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: 40 }}>Listening for context...</div>
              ) : (
                liveSuggestions.map((sug, idx) => (
                  <div key={idx} className="fade-in" style={{ 
                    background: 'white', padding: '12px 16px', borderRadius: 8, 
                    borderLeft: '4px solid var(--accent-primary)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>{sug}</p>
                    <button className="btn btn-sm btn-outline" style={{ marginTop: 12, fontSize: '0.75rem' }}>Ask Question</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLiveMode && !questions && !loading && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <div className="empty-state-icon">🤖</div>
          <p>Select a job posting and click "Generate Questions" to get AI-powered interview questions.</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Questions are tailored to the job's skills, seniority level, and candidate profile.
          </p>
        </div>
      )}
    </div>
  );
}
