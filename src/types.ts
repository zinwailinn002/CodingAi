export interface Message {
  role: 'user' | 'assistant';
  content: string;
  artifacts?: Artifact[];
  files?: FileInfo[];
}

export interface FileInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string; // For text files
  url?: string; // For images/blobs
}

export interface Artifact {
  id: string;
  title: string;
  language: string;
  code: string;
  type: 'code' | 'web' | 'diagram' | 'markdown';
}

export type AIModel = 
  | 'claude-3-5-sonnet' 
  | 'gpt-4o' 
  | 'gemini-1.5-pro' 
  | 'deepseek-v3' 
  | 'llama-3-1-405b';

export type Persona = 'general' | 'full-stack' | 'frontend' | 'backend' | 'data-scientist';

export interface NotebookItem {
  id: string;
  title: string;
  content: string;
  type: 'file' | 'note';
}

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
}
