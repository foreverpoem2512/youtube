export enum AppState {
  INPUT = 'INPUT',
  ANALYZING = 'ANALYZING',
  DASHBOARD = 'DASHBOARD',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT'
}

export interface ScriptAnalysis {
  tone: string;
  targetAudience: string;
  keywords: string[];
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export interface TopicSuggestion {
  title: string;
  reason: string;
  expectedVibe: string;
}

export interface AnalysisResponse {
  analysis: ScriptAnalysis;
  suggestions: TopicSuggestion[];
}

export interface GeneratedScript {
  title: string;
  content: string;
}
