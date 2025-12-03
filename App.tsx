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
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 flex flex-col">
        
        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-8 p-4 bg-red-950/50 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center shadow-lg animate-fade-in">
            <span className="mr-3 bg-red-900/50 p-1 rounded-full"><AlertCircle className="w-4 h-4" /></span> 
            {errorMsg}
          </div>
        )}

        {/* --- VIEW 1: INPUT --- */}
        {appState === AppState.INPUT && (
          <div className="flex flex-col items-center justify-center flex-1 space-y-10 animate-fade-in">
            <div className="text-center space-y-6 max-w-3xl">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-white">
                유튜브 대본을 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                  AI로 분석하고 확장하세요
                </span>
              </h1>
              <p className="text-xl text-slate-300 font-light leading-relaxed">
                기존 대본을 붙여넣으세요. AI가 스타일을 분석하고 <br className="hidden sm:block"/>
                시청자가 반응할 새로운 영상 주제를 제안합니다.
              </p>
            </div>

            <div className="w-full max-w-4xl bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden p-2 group focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
              <div className="relative">
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="여기에 지난 영상의 대본이나 스크립트를 붙여넣으세요..."
                  className="w-full h-72 p-6 bg-slate-950/50 text-slate-100 placeholder-slate-500 resize-none focus:outline-none rounded-2xl transition-colors text-lg leading-relaxed"
                />
              </div>
              <div className="bg-slate-900 px-4 py-4 flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={!inputText.trim()}
                  className={`flex items-center space-x-2 px-8 py-3.5 rounded-xl font-bold text-lg transition-all duration-300 
                    ${inputText.trim() 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transform hover:-translate-y-1' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}
                >
                  <BarChart2 className="w-5 h-5" />
                  <span>분석 시작하기</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mt-8 w-full max-w-5xl">
              <div className="flex flex-col items-center p-6 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-1 ring-white/5">
                  <BarChart2 className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">스타일 분석</h3>
                <p className="text-slate-400 text-sm">대본의 톤앤매너와 타겟을<br/>정밀하게 파악합니다.</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-1 ring-white/5">
                  <Wand2 className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">주제 추천</h3>
                <p className="text-slate-400 text-sm">채널 성장에 도움이 될<br/>바이럴 주제를 제안합니다.</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-1 ring-white/5">
                  <FileText className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">대본 생성</h3>
                <p className="text-slate-400 text-sm">클릭 한 번으로<br/>완성된 대본을 받아보세요.</p>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 2: LOADING --- */}
        {appState === AppState.ANALYZING && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
              <Loader2 className="w-20 h-20 text-indigo-400 animate-spin relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl text-white font-bold">분석 중입니다...</h2>
              <p className="text-slate-400">대본의 패턴을 파악하고 트렌드를 분석하고 있습니다.</p>
            </div>
          </div>
        )}

        {/* --- VIEW 3: DASHBOARD (ANALYSIS + TOPICS) --- */}
        {appState === AppState.DASHBOARD && analysisData && (
          <div className="space-y-10 animate-fade-in-up pb-10">
            {/* Analysis Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center pb-4 border-b border-slate-800">
                  <BarChart2 className="w-6 h-6 mr-3 text-indigo-400" />
                  분석 리포트
                </h2>
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider bg-indigo-950/50 border border-indigo-500/20 px-2.5 py-1 rounded-md">요약</span>
                    <p className="text-slate-200 mt-3 leading-relaxed text-lg">{analysisData.analysis.summary}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                     <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                       <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider bg-indigo-950/50 border border-indigo-500/20 px-2.5 py-1 rounded-md">톤앤매너</span>
                       <div className="mt-3 flex flex-wrap gap-2">
                         <span className="px-3 py-1.5 bg-indigo-500/10 text-indigo-100 border border-indigo-500/30 rounded-lg text-base font-semibold">
                           {analysisData.analysis.tone}
                         </span>
                       </div>
                     </div>
                     <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                       <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider bg-indigo-950/50 border border-indigo-500/20 px-2.5 py-1 rounded-md">타겟 시청자</span>
                        <p className="text-slate-100 mt-3 text-base font-medium">{analysisData.analysis.targetAudience}</p>
                     </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/50 border border-emerald-500/20 px-2.5 py-1 rounded-md">강점</span>
                    <ul className="mt-3 space-y-2.5 bg-slate-950/50 p-5 rounded-xl border border-slate-800">
                      {analysisData.analysis.strengths.map((s, i) => (
                        <li key={i} className="text-slate-200 text-sm sm:text-base flex items-start">
                          <Check className="w-5 h-5 mr-3 mt-0.5 text-emerald-500 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-xl flex flex-col h-full">
                <h2 className="text-xl font-bold text-white mb-6 pb-4 border-b border-slate-800">핵심 키워드</h2>
                <div className="flex flex-wrap gap-2.5 mb-8">
                  {analysisData.analysis.keywords.map((keyword, idx) => (
                    <span key={idx} className="px-3.5 py-1.5 bg-slate-800 text-white rounded-lg text-sm border border-slate-600 font-medium shadow-sm">
                      #{keyword}
                    </span>
                  ))}
                </div>
                <div className="mt-auto pt-6 border-t border-slate-800">
                   <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-950/50 border border-amber-500/20 px-2.5 py-1 rounded-md block mb-4 w-fit">보완점</span>
                   <ul className="space-y-3 bg-slate-950/50 p-5 rounded-xl border border-slate-800">
                    {analysisData.analysis.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start leading-relaxed">
                         <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-3 mt-2 shrink-0"></span>
                         {w}
                      </li>
                    ))}
                   </ul>
                </div>
              </div>
            </section>

            {/* Suggestions Section */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                <Wand2 className="w-8 h-8 mr-3 text-purple-400" />
                추천 주제 <span className="text-base font-normal text-slate-400 ml-4 hidden sm:inline-block bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">마음에 드는 주제 카드를 클릭하세요</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {analysisData.suggestions.map((topic, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleGenerateClick(topic)}
                    className="group bg-slate-900 border border-slate-700 hover:border-indigo-500 hover:bg-slate-800 rounded-3xl p-7 cursor-pointer transition-all duration-300 relative overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1.5"
                  >
                    <div className="absolute top-0 right-0 p-5 opacity-40 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                      <ChevronRight className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="mb-5">
                      <span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 text-xs font-bold rounded-md uppercase border border-purple-500/30">
                        {topic.expectedVibe}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4 leading-tight group-hover:text-indigo-300 transition-colors">
                      {topic.title}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed border-t border-slate-800 pt-4 mt-2 group-hover:border-slate-700 group-hover:text-slate-200 transition-colors">
                      {topic.reason}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* --- VIEW 4 & 5: GENERATING & RESULT --- */}
        {(appState === AppState.GENERATING || appState === AppState.RESULT) && selectedTopic && (
          <div className="flex-1 flex flex-col h-full animate-fade-in pb-8">
            <div className="mb-6 flex items-center justify-between">
              <button 
                onClick={handleBackToDashboard} 
                className="flex items-center text-slate-400 hover:text-white transition-colors font-medium px-2 py-1 rounded-lg hover:bg-slate-900"
                disabled={appState === AppState.GENERATING}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                다른 주제 선택
              </button>
              
              {appState === AppState.RESULT && (
                <div className="flex space-x-3">
                   <button 
                     onClick={() => handleGenerateClick(selectedTopic)}
                     className="flex items-center px-4 py-2.5 text-sm bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors border border-slate-700 font-medium"
                   >
                     <RefreshCw className="w-4 h-4 mr-2" />
                     다시 생성
                   </button>
                   <button 
                     onClick={handleCopy}
                     className="flex items-center px-5 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-lg shadow-indigo-600/20 font-bold"
                   >
                     {isCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                     {isCopied ? "복사완료!" : "대본 복사"}
                   </button>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-3xl flex-1 flex flex-col overflow-hidden shadow-2xl relative ring-1 ring-white/5">
              <div className="p-5 border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center overflow-hidden">
                  <span className="bg-slate-800 text-xs font-bold text-slate-300 px-2.5 py-1 rounded-md mr-4 uppercase tracking-wider shrink-0 border border-slate-700">생성된 대본</span>
                  <h2 className="text-lg font-bold text-white truncate">
                    {selectedTopic.title}
                  </h2>
                </div>
                {appState === AppState.GENERATING && (
                  <div className="flex items-center text-indigo-400 text-sm font-medium animate-pulse ml-4 shrink-0">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    작성 중...
                  </div>
                )}
              </div>
              
              <div className="flex-1 p-6 sm:p-10 overflow-y-auto bg-slate-950/30 custom-scrollbar">
                <div className="prose prose-invert prose-lg max-w-none markdown-body">
                   <ReactMarkdown>{generatedScript}</ReactMarkdown>
                   {appState === AppState.GENERATING && (
                     <span className="inline-block w-2.5 h-5 bg-indigo-400 animate-pulse ml-1 align-middle rounded-sm"></span>
                   )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Example Dialog - Radix UI 사용 예시 */}
        <Dialog>
          <DialogContent aria-describedby="dialog-description">
            <DialogTitle>대화 상자 제목</DialogTitle>
            <p id="dialog-description">대화 상자 내용입니다.</p>
          </DialogContent>
        </Dialog>
      </main>

      <footer className="border-t border-slate-900 py-10 mt-auto bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm font-medium">© 2024 튜브지니어스 AI. Google Gemini 기술 기반.</p>
        </div>
      </footer>
    </div>
  );
};

// Simple Alert Icon component since it wasn't imported
const AlertCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
);

export default App;