import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { AppState, AnalysisResponse, TopicSuggestion } from './types';
import { analyzeAndSuggest, generateScriptStream } from './services/geminiService';
import { 
  Wand2, 
  FileText, 
  BarChart2, 
  ChevronRight, 
  Youtube, 
  Loader2, 
  RefreshCw, 
  Copy, 
  Check, 
  ArrowLeft 
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@radix-ui/react-dialog';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INPUT);
  const [inputText, setInputText] = useState('');
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicSuggestion | null>(null);
  const [generatedScript, setGeneratedScript] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handlers
  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    try {
      const data = await analyzeAndSuggest(inputText);
      setAnalysisData(data);
      setAppState(AppState.DASHBOARD);
    } catch (err) {
      console.error("API 호출 오류:", err);
      setErrorMsg("분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setAppState(AppState.INPUT);
    }
  };

  const handleGenerateClick = async (topic: TopicSuggestion) => {
    if (!analysisData) return;
    setSelectedTopic(topic);
    setAppState(AppState.GENERATING);
    setGeneratedScript('');
    setErrorMsg(null);

    try {
      await generateScriptStream(topic, analysisData.analysis, (chunk) => {
        setGeneratedScript(prev => prev + chunk);
      });
      setAppState(AppState.RESULT);
    } catch (err) {
      setErrorMsg("대본 생성 중 오류가 발생했습니다.");
      setAppState(AppState.DASHBOARD);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleReset = () => {
    setAppState(AppState.INPUT);
    setGeneratedScript('');
    setSelectedTopic(null);
    setAnalysisData(null);
    setInputText('');
  };

  const handleBackToDashboard = () => {
    setAppState(AppState.DASHBOARD);
    setGeneratedScript('');
  };

  const Navbar = () => (
    <nav className="border-b border-slate-700 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={handleReset}>
            <div className="bg-gradient-to-br from-red-600 to-red-700 p-1.5 rounded-lg shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-100 tracking-tight group-hover:text-white transition-colors">
              튜브지니어스 AI
            </span>
          </div>
          {appState !== AppState.INPUT && (
             <button onClick={handleReset} className="text-sm font-medium text-slate-300 hover:text-white transition-colors border border-slate-700 rounded-md px-4 py-2 hover:bg-slate-800 hover:border-slate-600">
               처음으로
             </button>
          )}
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">유튜브 대본을 AI로 분석하고 확장하세요</h1>
          <p className="text-lg text-slate-300">기존 대본을 붙여넣으세요. AI가 스타일을 분석하고 시청자가 반응할 새로운 영상 주제를 제안합니다.</p>
        </section>
      </main>
    </div>
  );
};

// Simple Alert Icon component since it wasn't imported
const AlertCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
);

export default App;