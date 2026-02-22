"use client";
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, BookOpen, Send, Loader2, Sparkles, BrainCircuit, Mic, MicOff, CheckCircle, GraduationCap, Volume2, StopCircle, FileQuestion, Zap, Globe, FileText, Plus, MessageSquare, Settings, Edit3, Save, X, Trash2, Youtube, TrendingUp, Sun, Moon, AlertTriangle } from 'lucide-react';

const useTheme = () => {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);
  return { theme };
};

const WelcomeScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => { setTimeout(onComplete, 2200); }, []);
  return (
    <motion.div exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-3xl text-indigo-900">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-400 blur-3xl opacity-20 animate-pulse"></div>
        <BrainCircuit className="w-24 h-24 text-indigo-600 mb-6 relative z-10 animate-bounce" />
      </div>
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">SYLLABUS AI</motion.h1>
      <div className="w-64 h-1.5 bg-gray-200 rounded-full mt-6 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.2 }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"></motion.div>
      </div>
      <p className="text-sm text-indigo-400 mt-3 font-bold tracking-widest">INITIALIZING...</p>
    </motion.div>
  );
};

// --- RENDERERS ---
const ExamRenderer = ({ data }: { data: any }) => {
  const [mcqState, setMcqState] = useState<{[key: number]: string | null}>({});
  const [showAnswer, setShowAnswer] = useState<{[key: string]: boolean}>({});

  if (!data || !data.mcqs) return <div className="text-red-500 bg-red-50 p-4 rounded-xl border border-red-200">Error generating exam.</div>;

  const toggle = (id: string) => setShowAnswer(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="space-y-4 w-full">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 rounded-xl text-white text-center font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"><GraduationCap/> Mock Exam</div>
      
      {data.mcqs.map((q: any, i: number) => (
        <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <p className="font-bold text-gray-800 mb-3 text-lg">{i+1}. {q.question}</p>
            <div className="grid gap-2">
                {q.options?.map((o: string) => (
                    <button key={o} onClick={() => setMcqState(p => ({...p, [i]: o === q.correct_answer ? 'correct' : 'wrong'}))} 
                    className={`text-left p-3 rounded-xl border text-sm font-medium transition-all ${
                        mcqState[i] === 'correct' && o === q.correct_answer ? 'bg-green-100 border-green-500 text-green-700' :
                        mcqState[i] === 'wrong' ? 'bg-red-50 border-red-200 opacity-50' : 
                        'bg-gray-50 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 text-gray-600'
                    }`}>
                        {o} {mcqState[i] === 'correct' && o === q.correct_answer && <CheckCircle className="w-4 h-4 inline ml-2"/>}
                    </button>
                ))}
            </div>
        </div>
      ))}

      {[...(data.theory_2_marks || []), ...(data.theory_5_marks || [])].map((q: any, i: number) => (
         <div key={`th-${i}`} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="font-bold text-gray-800">{q.question}</p>
            <button onClick={() => toggle(`th-${i}`)} className="text-xs text-indigo-600 font-bold mt-2 underline">Reveal Answer</button>
            {showAnswer[`th-${i}`] && <div className="mt-3 text-sm text-gray-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100">{q.answer}</div>}
         </div>
      ))}
    </div>
  );
};

const TrendRenderer = ({ data }: { data: any }) => (
    <div className="space-y-4">
        <div className="bg-gradient-to-r from-orange-400 to-pink-500 p-4 rounded-xl text-white text-center font-bold shadow-lg shadow-orange-200"><TrendingUp className="inline mr-2"/> Trends</div>
        {data.trends?.map((t: any, i: number) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div><p className="font-bold text-gray-800">{t.topic}</p><p className="text-xs text-gray-500">{t.reason}</p></div>
                <span className="text-xs font-bold px-3 py-1 bg-orange-100 text-orange-600 rounded-full">{t.probability}</span>
            </div>
        ))}
    </div>
);

const PyqRenderer = ({ solutions }: { solutions: any[] }) => (
    <div className="space-y-4">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 rounded-xl text-white text-center font-bold shadow-lg shadow-cyan-200">Solved Solutions</div>
        {solutions.map((item, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <p className="font-bold text-gray-800 mb-2 text-lg">Q{idx+1}: {item.question}</p>
                <div className="text-gray-600 text-sm prose prose-sm"><ReactMarkdown>{item.answer}</ReactMarkdown></div>
                <div className={`text-[10px] font-bold mt-3 uppercase px-2 py-1 rounded w-fit ${item.tag.includes('Out') ? 'bg-red-100 text-red-500 border border-red-200' : 'bg-green-100 text-green-600 border border-green-200'}`}>{item.tag}</div>
            </div>
        ))}
    </div>
);

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  
  // File States
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [pyqFile, setPyqFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showYoutube, setShowYoutube] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [answerStyle, setAnswerStyle] = useState("concise");
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [newTitle, setNewTitle] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pyqInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const { theme } = useTheme();

  useEffect(() => { fetchSessions(); createNewSession(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // API Calls
  const fetchSessions = async () => { try { const res = await fetch('http://127.0.0.1:8000/sessions/'); setSessions(await res.json()); } catch {} };
  const createNewSession = async () => { const res = await fetch('http://127.0.0.1:8000/sessions/new/', { method: 'POST' }); const data = await res.json(); setSessionId(data.session_id); setMessages([]); fetchSessions(); };
  const loadSession = async (id: string) => { const res = await fetch(`http://127.0.0.1:8000/sessions/${id}`); const data = await res.json(); setSessionId(id); setMessages(data.messages); };
  const handleRename = async (id: string) => { await fetch('http://127.0.0.1:8000/sessions/rename/', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ session_id: id, new_title: newTitle }) }); setRenamingId(null); fetchSessions(); };
  const clearHistory = async () => { await fetch('http://127.0.0.1:8000/sessions/clear/', { method: 'DELETE' }); setSessions([]); setMessages([]); createNewSession(); setShowSettings(false); };

  // File Handlers
  const onSyllabusSelect = (e: any) => { if(e.target.files) setSyllabusFile(e.target.files[0]); };
  const onSyllabusUpload = async () => {
      if (!syllabusFile) return; setUploading(true);
      const fd = new FormData(); fd.append('files', syllabusFile);
      try { await fetch('http://127.0.0.1:8000/upload-pdfs/', { method: 'POST', body: fd }); alert("✅ Syllabus Locked!"); setSyllabusFile(null); } catch { alert("Error"); }
      setUploading(false);
  };

  const onPyqSelect = (e: any) => { if(e.target.files) setPyqFiles(e.target.files[0]); };
  const onPyqSubmit = async (mode: 'solve' | 'trend') => {
      if (!pyqFile) return; setLoading(true);
      const fd = new FormData(); fd.append('files', pyqFile);
      setMessages(p => [...p, { role: 'user', content: mode === 'solve' ? "Solve Paper" : "Analyze Trends" }]);
      try {
          const res = await fetch(`http://127.0.0.1:8000/${mode === 'solve' ? 'solve-pyq' : 'analyze-trends'}/`, { method: 'POST', body: fd });
          const data = await res.json();
          if(mode === 'solve') setMessages(p => [...p, { role: 'ai', type: 'pyq', data: data.pyq_solutions }]);
          else {
              let trendData = null; try { trendData = JSON.parse(data.analysis); } catch {}
              setMessages(p => [...p, { role: 'ai', type: 'trend', data: trendData }]);
          }
          setPyqFile(null);
      } catch { setMessages(p => [...p, { role: 'ai', content: "Error. Upload Syllabus first." }]); }
      setLoading(false);
  };

  // Feature Handlers
  const handleYoutube = async () => {
      if (!ytUrl) return; setLoading(true); setShowYoutube(false);
      setMessages(p => [...p, { role: 'user', content: `Analyze Video: ${ytUrl}` }]);
      try {
          const res = await fetch('http://127.0.0.1:8000/analyze-youtube/', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ url: ytUrl }) });
          const data = await res.json();
          setMessages(p => [...p, { role: 'ai', content: data.answer, source: 'youtube', tag: "Video Summary" }]);
      } catch { setMessages(p => [...p, { role: 'ai', content: "Error analyzing video." }]); }
      setLoading(false);
  };

  const handleExam = async () => {
    setLoading(true); setMessages(p => [...p, { role: 'user', content: "Generate Mock Exam" }]);
    try {
        const res = await fetch('http://127.0.0.1:8000/generate-exam/', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ topic: `ID:${Math.random()}` }) });
        const data = await res.json();
        let parsed = null; try { parsed = JSON.parse(data.quiz_json); } catch {}
        setMessages(p => [...p, { role: 'ai', type: 'exam', data: parsed }]);
    } catch { setMessages(p => [...p, { role: 'ai', content: "Error generating exam. Try again." }]); }
    setLoading(false);
  };

  const handleSend = async (txt?: string, mode: string = "syllabus") => {
    const textToSend = txt || input;
    if (!textToSend.trim() || !sessionId) return;
    
    if (mode === "syllabus") {
        setMessages(p => [...p, { role: 'user', content: textToSend }]);
        setInput("");
    }
    setLoading(true);
    try {
        const res = await fetch('http://127.0.0.1:8000/chat/', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ session_id: sessionId, question: textToSend, mode: mode, style: answerStyle }) });
        const data = await res.json();
        
        if (data.status === "missing") {
             setMessages(prev => [...prev, { role: 'system_ask', content: "Topic not in Syllabus.", originalQuestion: textToSend }]);
        } else if (data.status === "no_syllabus") {
             setMessages(prev => [...prev, { role: 'ai', content: "Please upload a Syllabus PDF first." }]);
        } else {
             setMessages(p => [...p, { role: 'ai', content: data.answer, source: data.source, tag: data.tag }]);
        }
        fetchSessions();
    } catch { setMessages(p => [...p, { role: 'ai', content: "Backend Error" }]); }
    setLoading(false);
  };

  // Voice
  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Use Chrome.");
    const rec = new SR(); rec.lang = 'en-US';
    rec.onresult = (e: any) => setInput(p => p + " " + e.results[0][0].transcript);
    rec.start(); setIsListening(true);
    rec.onend = () => setIsListening(false);
  };

  const speak = (text: string) => {
      window.speechSynthesis.cancel();
      if(isSpeaking) { setIsSpeaking(false); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.rate = voiceSpeed;
      u.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(u);
  };

  return (
    <div className="light">
    <AnimatePresence>{showIntro && <WelcomeScreen onComplete={() => setShowIntro(false)} />}</AnimatePresence>
    <div className="flex h-screen w-full bg-[#f8fafc] text-gray-900 font-sans overflow-hidden relative selection:bg-indigo-100">
      
      {/* SIDEBAR */}
      <div className="w-80 flex-shrink-0 bg-white/70 backdrop-blur-xl border-r border-gray-200/60 flex flex-col z-20 shadow-xl h-full">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2 font-black text-indigo-700 tracking-tight text-xl"><BrainCircuit className="w-6 h-6"/> SYLLABUS AI</div>
        </div>
        <button onClick={createNewSession} className="mx-6 mt-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-lg text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"><Plus className="w-4 h-4"/> New Chat</button>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {sessions.map(s => (
                <div key={s.id} onClick={() => loadSession(s.id)} className={`group flex justify-between p-3 rounded-xl cursor-pointer text-sm font-medium transition-all ${sessionId === s.id ? 'bg-white shadow-md text-indigo-700 border border-indigo-100' : 'text-gray-600 hover:bg-white/50'}`}>
                    {renamingId === s.id ? (
                        <div className="flex gap-1 w-full"><input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="bg-white border rounded px-2 text-gray-700 w-full outline-none ring-2 ring-indigo-200" autoFocus/><button onClick={(e) => {e.stopPropagation(); handleRename(s.id)}}><Save className="w-4 h-4 text-green-500"/></button></div>
                    ) : (
                        <><span className="truncate w-40">{s.title}</span>{sessionId === s.id && <button onClick={(e) => {e.stopPropagation(); setRenamingId(s.id); setNewTitle(s.title)}} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600"><Edit3 className="w-3 h-3"/></button>}</>
                    )}
                </div>
            ))}
        </div>
        <div className="p-6 border-t border-gray-100 space-y-3">
            <button onClick={() => setShowYoutube(true)} className="glass-btn w-full p-3 rounded-xl flex items-center gap-3 text-xs font-bold text-gray-600 bg-white/50 hover:bg-white hover:shadow-md transition-all"><Youtube className="w-4 h-4 text-red-500"/> YouTube Analysis</button>
            <button onClick={() => setShowSettings(true)} className="glass-btn w-full p-3 rounded-xl flex items-center gap-3 text-xs font-bold text-gray-600 bg-white/50 hover:bg-white hover:shadow-md transition-all"><Settings className="w-4 h-4 text-gray-500"/> Settings</button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col h-full relative">
        <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-40 custom-scrollbar">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-90">
                    <motion.div initial={{scale:0.9}} animate={{scale:1}} className="text-center">
                        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl mx-auto ring-4 ring-indigo-50"><Sparkles className="w-12 h-12 text-indigo-500 animate-pulse" /></div>
                        <h2 className="text-4xl font-black text-indigo-900 tracking-tight">Ready to Ace It?</h2>
                        <p className="text-gray-500 mt-2 font-medium">Upload your syllabus to unlock superpowers.</p>
                        
                        <div className="flex gap-4 mt-8 justify-center">
                             <div className="glass-panel p-5 rounded-3xl w-48 text-center hover:scale-105 transition-transform cursor-pointer relative overflow-hidden shadow-xl border border-white/50 group">
                                <input type="file" multiple accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer z-10" ref={fileInputRef} onChange={onSyllabusSelect}/>
                                <div onClick={() => fileInputRef.current?.click()}>
                                    <div className="bg-indigo-100 p-3 rounded-2xl w-fit mx-auto mb-3 text-indigo-600"><Upload className="w-6 h-6"/></div>
                                    <p className="text-sm font-bold text-gray-700">{syllabusFile ? "Selected" : "Upload Syllabus"}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">PDF Format</p>
                                </div>
                                {syllabusFile && <button onClick={onSyllabusUpload} disabled={uploading} className="mt-3 w-full bg-indigo-600 text-white text-[10px] py-2 rounded-xl font-bold z-20 relative shadow-lg">{uploading ? "Locking..." : "Confirm"}</button>}
                             </div>
                             
                             <div className="glass-panel p-5 rounded-3xl w-48 text-center hover:scale-105 transition-transform cursor-pointer relative overflow-hidden shadow-xl border border-white/50">
                                <input type="file" multiple accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer z-10" ref={pyqInputRef} onChange={onPyqSelect}/>
                                <div onClick={() => pyqInputRef.current?.click()}>
                                    <div className="bg-cyan-100 p-3 rounded-2xl w-fit mx-auto mb-3 text-cyan-600"><FileQuestion className="w-6 h-6"/></div>
                                    <p className="text-sm font-bold text-gray-700">{pyqFile ? "Selected" : "Solve PYQ"}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">AI Solver</p>
                                </div>
                                {pyqFile && <div className="flex gap-2 mt-3 z-20 relative"><button onClick={() => onPyqSubmit('solve')} className="bg-cyan-600 text-white text-[10px] py-2 rounded-xl flex-1 font-bold shadow-lg">Solve</button><button onClick={() => onPyqSubmit('trend')} className="bg-yellow-500 text-white text-[10px] py-2 rounded-xl flex-1 font-bold shadow-lg">Trend</button></div>}
                             </div>
                        </div>
                        <button onClick={handleExam} className="mt-8 px-8 py-3 bg-white text-purple-600 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 mx-auto"><Zap className="w-4 h-4"/> Generate Mock Exam</button>
                    </motion.div>
                </div>
            )}

            {messages.map((msg, idx) => (
                <motion.div key={idx} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl p-6 rounded-3xl shadow-xl ${msg.role === 'user' ? 'bubble-user rounded-br-sm' : 'bubble-ai rounded-bl-sm'}`}>
                        {msg.type === 'exam' ? <ExamRenderer data={msg.data}/> : 
                         msg.type === 'pyq' ? <PyqRenderer solutions={msg.data}/> : 
                         msg.type === 'trend' ? <TrendRenderer data={msg.data}/> : 
                         msg.role === 'system_ask' ? (
                            <div className="text-center p-4">
                                <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-3"><AlertTriangle className="w-6 h-6 text-orange-600"/></div>
                                <p className="font-bold text-gray-800 mb-1">Out of Syllabus</p>
                                <p className="text-xs text-gray-500 mb-4">I checked your notes. This topic is missing.</p>
                                <button onClick={() => handleSend(msg.originalQuestion, "internet")} className="bg-orange-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition flex items-center justify-center gap-2 mx-auto"><Globe className="w-3 h-3"/> Search Internet</button>
                            </div>
                         ) : (
                            <div>
                                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                                {msg.role === 'ai' && (
                                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                                        {/* CORRECTED TAG LOGIC */}
                                        <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full flex items-center gap-1.5 ${
                                            (msg.source === 'syllabus' || msg.tag?.toLowerCase().includes('syllabus'))
                                            ? 'bg-green-100 text-green-700 border border-green-200' 
                                            : 'bg-orange-100 text-orange-700 border border-orange-200'
                                        }`}>
                                            {(msg.source === 'syllabus' || msg.tag?.toLowerCase().includes('syllabus')) ? <BookOpen className="w-3 h-3"/> : <Globe className="w-3 h-3"/>}
                                            {(msg.source === 'syllabus' || msg.tag?.toLowerCase().includes('syllabus')) ? "Syllabus Verified" : "Internet Verified"}
                                        </span>
                                        <button onClick={() => speak(msg.content)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-indigo-600 transition"><Volume2 className="w-4 h-4"/></button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
            {loading && <div className="ml-4 text-indigo-500 font-bold text-sm flex items-center gap-2 animate-pulse"><Loader2 className="w-5 h-5 animate-spin"/> Processing Request...</div>}
            <div ref={messagesEndRef}/>
        </div>

        {/* INPUT BAR */}
        <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-gray-200/60 z-30">
            <div className="max-w-4xl mx-auto space-y-3">
               <div className="flex justify-center gap-2">
                  {['concise', 'detailed', 'step-by-step'].map((style) => (
                      <button key={style} onClick={() => setAnswerStyle(style)} 
                      className={`text-[10px] font-bold px-4 py-1.5 rounded-full border transition-all glass-btn ${
                          answerStyle === style ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}>
                          {style.charAt(0).toUpperCase() + style.slice(1)} Mode
                      </button>
                  ))}
               </div>

               <div className="flex gap-2 bg-white p-2 rounded-[24px] shadow-2xl border border-gray-200 items-center ring-4 ring-indigo-50 transition-all focus-within:ring-indigo-100">
                  <button onClick={toggleMic} className={`p-3 rounded-full hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition ${isListening ? 'text-red-500 animate-pulse bg-red-50' : ''}`}><Mic className="w-5 h-5"/></button>
                  <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask anything..." className="flex-1 bg-transparent outline-none text-gray-800 font-medium placeholder-gray-400 px-2" />
                  <button onClick={() => handleSend()} className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-300 transition-all hover:scale-105 active:scale-95"><Send className="w-5 h-5"/></button>
               </div>
            </div>
        </div>
      </div>

      {/* YOUTUBE MODAL */}
      <AnimatePresence>
        {showYoutube && (
            <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50">
                <div className="glass-panel p-8 rounded-3xl w-96 relative shadow-2xl border border-gray-100">
                    <button onClick={() => setShowYoutube(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X className="w-5 h-5"/></button>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Youtube className="w-6 h-6 text-red-600"/> Video Analysis</h2>
                    <input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="Paste YouTube Link..." className="glass-input w-full p-4 rounded-xl mb-4 outline-none"/>
                    <button onClick={handleYoutube} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200">Analyze</button>
                </div>
            </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
            <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50">
                <div className="glass-panel p-8 rounded-3xl w-96 relative shadow-2xl border border-gray-100">
                    <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600"><X className="w-5 h-5"/></button>
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Settings</h2>
                    <div className="space-y-6">
                        <div><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Voice Speed: {voiceSpeed}x</label><input type="range" min="0.5" max="2" step="0.1" value={voiceSpeed} onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))} className="w-full accent-indigo-500"/></div>
                        <button onClick={clearHistory} className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"><Trash2 className="w-4 h-4"/> Clear All History</button>
                    </div>
                </div>
            </div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}