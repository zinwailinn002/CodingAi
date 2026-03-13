import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Send, Code2, Eye, PanelRightClose, PanelRightOpen, Loader2, Terminal,
  Sparkles, ChevronRight, Copy, Check, Plus, FileText, Image as ImageIcon,
  X, Settings, BookOpen, Layers, Cpu, Paperclip, Maximize2, Minimize2,
  Download, Trash2, Folder, FileCode, UserCog, LayoutTemplate, Play,
  Smartphone, Monitor, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, Artifact, AIModel, FileInfo, NotebookItem, ProjectFile, Persona } from './types';

const MODELS: { id: AIModel; name: string; description: string; icon: string }[] = [
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Best for coding & reasoning', icon: '🎭' },
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Fast & versatile', icon: '🧠' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Large context & multimodal', icon: '✨' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', description: 'Advanced logic & math', icon: '🐳' },
  { id: 'llama-3-1-405b', name: 'Llama 3.1 405B', description: 'Powerful open source', icon: '🦙' },
];

const PERSONAS: { id: Persona; name: string; prompt: string }[] = [
  { id: 'general', name: 'General Assistant', prompt: 'You are a helpful AI assistant.' },
  { id: 'full-stack', name: 'Expert Full Stack Dev', prompt: 'You are an expert Full Stack Developer. Always provide complete, working, and production-ready code. When writing code, ALWAYS specify the filename in the markdown block like so: ```javascript filename="src/app.js"' },
  { id: 'frontend', name: 'Frontend UI/UX Expert', prompt: 'You are an expert Frontend Developer and UI/UX Designer. Focus on beautiful, accessible, and responsive interfaces using modern frameworks. ALWAYS specify the filename in the markdown block like so: ```tsx filename="src/components/Button.tsx"' },
  { id: 'backend', name: 'Backend & Architecture', prompt: 'You are an expert Backend Engineer. Focus on scalable architecture, security, and performance. ALWAYS specify the filename in the markdown block like so: ```python filename="api/main.py"' },
  { id: 'data-scientist', name: 'Data Scientist', prompt: 'You are an expert Data Scientist and Python Developer. Focus on efficient data processing and clear visualizations. ALWAYS specify the filename in the markdown block like so: ```python filename="analysis.py"' },
];

export default function App() {
  // State with LocalStorage Memory
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('puter_ide_messages');
    return saved ? JSON.parse(saved) : [{ role: 'assistant', content: 'Welcome to Puter AI Pro IDE. I am upgraded for advanced coding projects with Mobile UI previews. I can manage multiple files, maintain project context, and adapt to different developer personas. What are we building today?' }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    return (localStorage.getItem('puter_ide_model') as AIModel) || 'claude-3-5-sonnet';
  });
  const [selectedPersona, setSelectedPersona] = useState<Persona>(() => {
    return (localStorage.getItem('puter_ide_persona') as Persona) || 'frontend';
  });
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasView, setCanvasView] = useState<'code' | 'preview'>('preview');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('mobile');
  
  // Project State
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(() => {
    const saved = localStorage.getItem('puter_ide_files');
    return saved ? JSON.parse(saved) : [];
  });
  const [openFileIds, setOpenFileIds] = useState<string[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const [attachedFiles, setAttachedFiles] = useState<FileInfo[]>([]);
  const [notebookItems, setNotebookItems] = useState<NotebookItem[]>(() => {
    const saved = localStorage.getItem('puter_ide_notebook');
    return saved ? JSON.parse(saved) : [];
  });

  // Memory Save Effects
  useEffect(() => { localStorage.setItem('puter_ide_messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('puter_ide_files', JSON.stringify(projectFiles)); }, [projectFiles]);
  useEffect(() => { localStorage.setItem('puter_ide_notebook', JSON.stringify(notebookItems)); }, [notebookItems]);
  useEffect(() => { localStorage.setItem('puter_ide_model', selectedModel); }, [selectedModel]);
  useEffect(() => { localStorage.setItem('puter_ide_persona', selectedPersona); }, [selectedPersona]);

  const clearMemory = () => {
    localStorage.clear();
    setMessages([{ role: 'assistant', content: 'Memory cleared. Welcome to a fresh session of Puter AI Pro IDE. What are we building today?' }]);
    setProjectFiles([]);
    setNotebookItems([]);
    setOpenFileIds([]);
    setActiveFileId(null);
    setShowCanvas(false);
  };
  
  // Responsive Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  
  const [copied, setCopied] = useState(false);
  const [isPuterReady, setIsPuterReady] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for Puter availability
  useEffect(() => {
    const checkPuter = setInterval(() => {
      if ((window as any).puter) {
        setIsPuterReady(true);
        clearInterval(checkPuter);
      }
    }, 500);
    return () => clearInterval(checkPuter);
  }, []);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // File Handling
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = Math.random().toString(36).substr(2, 9);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newFile: FileInfo = {
            id,
            name: file.name,
            type: file.type,
            size: file.size,
            url: event.target?.result as string
          };
          setAttachedFiles(prev => [...prev, newFile]);
        };
        reader.readAsDataURL(file);
      } else {
        const text = await file.text();
        const newFile: FileInfo = {
          id,
          name: file.name,
          type: file.type,
          size: file.size,
          content: text
        };
        setAttachedFiles(prev => [...prev, newFile]);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const addToNotebook = (file: FileInfo) => {
    if (notebookItems.find(item => item.id === file.id)) return;
    const newItem: NotebookItem = {
      id: file.id,
      title: file.name,
      content: file.content || `[Image File: ${file.name}]`,
      type: 'file'
    };
    setNotebookItems(prev => [...prev, newItem]);
  };

  const handleCopy = () => {
    const activeFile = projectFiles.find(f => f.id === activeFileId);
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Artifact Parsing for Project Files
  const parseArtifacts = (text: string) => {
    const codeBlockRegex = /```(\w+)?(?:[ \t]+(?:filename=)?["']?([a-zA-Z0-9._/-]+)["']?)?\n([\s\S]*?)```/g;
    let match;
    const newFiles: ProjectFile[] = [];

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = match[1] || 'text';
      let filename = match[2];
      let code = match[3].trim();

      if (!filename) {
        const firstLineMatch = code.match(/^(?:\/\/|#|<!--)\s*(?:file|filename|filepath)?[:\s]*([a-zA-Z0-9._/-]+\.[a-zA-Z0-9]+)/i);
        if (firstLineMatch) {
          filename = firstLineMatch[1];
        } else {
          filename = `snippet-${Math.random().toString(36).substr(2, 5)}.${language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'html' ? 'html' : 'txt'}`;
        }
      }

      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        name: filename.split('/').pop() || filename,
        path: filename,
        language,
        content: code
      });
    }

    if (newFiles.length > 0) {
      setProjectFiles(prev => {
        const updated = [...prev];
        newFiles.forEach(nf => {
          const existingIdx = updated.findIndex(f => f.path === nf.path);
          if (existingIdx >= 0) {
            updated[existingIdx] = { ...updated[existingIdx], content: nf.content, language: nf.language };
            nf.id = updated[existingIdx].id;
          } else {
            updated.push(nf);
          }
        });
        return updated;
      });
      
      const lastFile = newFiles[newFiles.length - 1];
      setOpenFileIds(prev => {
        if (!prev.includes(lastFile.id)) return [...prev, lastFile.id];
        return prev;
      });
      setActiveFileId(lastFile.id);
      setShowCanvas(true);
      setCanvasView(lastFile.language === 'html' ? 'preview' : 'code');
      
      // Auto-switch to mobile preview if it's a UI component/HTML
      if (lastFile.language === 'html') {
        setPreviewDevice('mobile');
      }
    }
  };

  // AI Interaction
  const sendMessage = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

    if (!(window as any).puter) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Puter.js is still loading or could not be initialized. Please refresh the page or wait a few seconds.' }]);
      return;
    }

    const userMessage: Message = { 
      role: 'user', 
      content: input,
      files: [...attachedFiles]
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      const selectedPersonaObj = PERSONAS.find(p => p.id === selectedPersona);
      
      const notebookContext = notebookItems.length > 0 
        ? `\n\nContext from Notebook:\n${notebookItems.map(item => `--- ${item.title} ---\n${item.content}`).join('\n\n')}`
        : '';

      const projectContext = projectFiles.length > 0
        ? `\n\nCurrent Project Files:\n${projectFiles.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n')}`
        : '';

      const systemMessage = {
        role: 'system',
        content: `${selectedPersonaObj?.prompt}${notebookContext}${projectContext}`
      };

      // Include conversation history for memory
      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      let currentUserContent = input;
      if (userMessage.files && userMessage.files.length > 0) {
        currentUserContent += `\n\nAttached Files:\n${userMessage.files.map(f => `File: ${f.name}\nContent: ${f.content || '[Binary/Image]'}`).join('\n')}`;
      }

      const messagesToSend = [
        systemMessage,
        ...chatHistory,
        { role: 'user', content: currentUserContent }
      ];

      const puter = (window as any).puter;
      
      let response;
      try {
        // Try array format for conversation history
        response = await puter.ai.chat(messagesToSend, { model: selectedModel });
      } catch (e) {
        console.warn('Array format failed, falling back to string prompt...', e);
        // Fallback to string concatenation if array format is not fully supported by the specific model
        const fullPrompt = systemMessage.content + "\n\n" + chatHistory.map(m => `${m.role}: ${m.content}`).join("\n\n") + "\n\nUser: " + currentUserContent;
        try {
          response = await puter.ai.chat(fullPrompt, { model: selectedModel });
        } catch (e2) {
          response = await puter.ai.chat(fullPrompt);
        }
      }
      
      const assistantMessage: Message = { role: 'assistant', content: response.toString() };
      setMessages(prev => [...prev, assistantMessage]);
      parseArtifacts(response.toString());
    } catch (error) {
      console.error('Puter AI Error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error connecting to Puter AI: "${errorMsg}". This might be due to rate limits or connectivity issues. Please try again in a moment.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const openFile = (id: string) => {
    if (!openFileIds.includes(id)) {
      setOpenFileIds(prev => [...prev, id]);
    }
    setActiveFileId(id);
    setShowCanvas(true);
    const file = projectFiles.find(f => f.id === id);
    if (file) {
      setCanvasView(file.language === 'html' ? 'preview' : 'code');
    }
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const closeFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenFileIds(prev => prev.filter(fid => fid !== id));
    if (activeFileId === id) {
      const remaining = openFileIds.filter(fid => fid !== id);
      if (remaining.length > 0) {
        setActiveFileId(remaining[remaining.length - 1]);
      } else {
        setActiveFileId(null);
        setShowCanvas(false);
      }
    }
  };

  const activeFile = projectFiles.find(f => f.id === activeFileId);

  const renderPreview = () => {
    if (!activeFile) return null;
    if (activeFile.language.toLowerCase() === 'html') {
      return (
        <div className="w-full h-full bg-zinc-950 flex items-center justify-center overflow-auto p-4 md:p-8">
          <div className={`transition-all duration-500 ease-in-out bg-white relative ${
            previewDevice === 'mobile' 
              ? 'w-[375px] h-[667px] rounded-[2.5rem] border-[12px] border-zinc-800 shadow-2xl overflow-hidden flex-shrink-0' 
              : 'w-full h-full rounded-lg overflow-hidden shadow-lg'
          }`}>
            {previewDevice === 'mobile' && (
              <div className="absolute top-0 inset-x-0 h-6 bg-zinc-800 rounded-b-3xl w-40 mx-auto z-10" />
            )}
            <iframe
              title="Preview"
              className="w-full h-full border-none bg-white"
              srcDoc={activeFile.content}
            />
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 bg-zinc-950 font-mono text-sm p-8 text-center">
        Preview is only available for HTML content. <br/>
        Switch to "Code" view to see the source.
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans relative">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar: Models & Notebook */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed md:relative z-50 w-[280px] h-full border-r border-zinc-800 bg-zinc-950/95 md:bg-zinc-900/50 flex flex-col overflow-hidden flex-shrink-0 backdrop-blur-xl md:backdrop-blur-none"
          >
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold tracking-tight">AI Workspace</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-zinc-800 rounded md:hidden">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
              <button onClick={() => setIsSidebarOpen(false)} className="hidden md:block p-1 hover:bg-zinc-800 rounded">
                <PanelRightClose className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
              {/* Persona Selection */}
              <section>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <UserCog className="w-3 h-3" /> Persona
                </h3>
                <select 
                  value={selectedPersona}
                  onChange={(e) => setSelectedPersona(e.target.value as Persona)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  {PERSONAS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </section>

              {/* Model Selection */}
              <section>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Layers className="w-3 h-3" /> Select Model
                </h3>
                <div className="space-y-2">
                  {MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all group ${
                        selectedModel === model.id 
                          ? 'bg-indigo-600/10 border-indigo-500/50 ring-1 ring-indigo-500/20' 
                          : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{model.icon}</span>
                        <div className="flex flex-col overflow-hidden">
                          <span className={`text-sm font-semibold ${selectedModel === model.id ? 'text-indigo-400' : 'text-zinc-300'}`}>
                            {model.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 truncate">{model.description}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Project Explorer */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Folder className="w-3 h-3" /> Project Files
                  </h3>
                  <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                    {projectFiles.length} files
                  </span>
                </div>
                <div className="space-y-1">
                  {projectFiles.length === 0 ? (
                    <div className="p-4 border border-dashed border-zinc-800 rounded-xl text-center">
                      <p className="text-[10px] text-zinc-600">No files generated yet. Ask AI to write some code.</p>
                    </div>
                  ) : (
                    projectFiles.map(file => (
                      <button 
                        key={file.id}
                        onClick={() => openFile(file.id)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-all ${
                          activeFileId === file.id ? 'bg-indigo-600/20 text-indigo-300' : 'hover:bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{file.path}</span>
                      </button>
                    ))
                  )}
                </div>
              </section>

              {/* Notebook / Context */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen className="w-3 h-3" /> Notebook
                  </h3>
                  <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                    {notebookItems.length} items
                  </span>
                </div>
                <div className="space-y-2">
                  {notebookItems.length === 0 ? (
                    <div className="p-4 border border-dashed border-zinc-800 rounded-xl text-center">
                      <p className="text-[10px] text-zinc-600">Add files to notebook to use as context (NotebookLM style)</p>
                    </div>
                  ) : (
                    notebookItems.map(item => (
                      <div key={item.id} className="p-2 bg-zinc-950/50 border border-zinc-800 rounded-lg flex items-center justify-between group">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                          <span className="text-xs text-zinc-400 truncate">{item.title}</span>
                        </div>
                        <button 
                          onClick={() => setNotebookItems(prev => prev.filter(i => i.id !== item.id))}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-zinc-800 rounded transition-all"
                        >
                          <X className="w-3 h-3 text-zinc-500" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <Settings className="w-4 h-4" />
                <span>Memory Active</span>
              </div>
              <button 
                onClick={clearMemory}
                className="p-1.5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-lg transition-colors flex items-center gap-2 text-xs"
                title="Clear Memory (Reset All)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-zinc-800 rounded-lg">
                <Menu className="w-5 h-5 text-zinc-400 md:hidden" />
                <PanelRightOpen className="w-5 h-5 text-zinc-400 hidden md:block" />
              </button>
            )}
            <div className="flex flex-col">
              <h1 className="font-bold text-sm tracking-tight">Puter AI Pro</h1>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isPuterReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                  {isPuterReady ? selectedModel : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showCanvas && (
              <button 
                onClick={() => setShowCanvas(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {showCanvas && (
              <button 
                onClick={() => setShowCanvas(false)}
                className="hidden md:block p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"
              >
                <PanelRightClose className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scrollbar-thin">
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none shadow-lg shadow-indigo-600/10' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="flex gap-3 md:gap-4">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-700">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 space-y-4 overflow-hidden">
                      <div className="prose prose-invert prose-sm max-w-none break-words">
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <div className="relative group my-4">
                                  <div className="absolute right-3 top-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                                    <button 
                                      onClick={() => {
                                        const codeStr = String(children).replace(/\n$/, '');
                                        const firstLineMatch = codeStr.match(/^(?:\/\/|#|<!--)\s*(?:file|filename|filepath)?[:\s]*([a-zA-Z0-9._/-]+\.[a-zA-Z0-9]+)/i);
                                        const filename = firstLineMatch ? firstLineMatch[1] : `snippet-${Math.random().toString(36).substr(2, 5)}.${match[1]}`;
                                        
                                        const newFile: ProjectFile = {
                                          id: Math.random().toString(36).substr(2, 9),
                                          name: filename.split('/').pop() || filename,
                                          path: filename,
                                          language: match[1],
                                          content: codeStr
                                        };
                                        
                                        setProjectFiles(prev => [...prev, newFile]);
                                        setOpenFileIds(prev => [...prev, newFile.id]);
                                        setActiveFileId(newFile.id);
                                        setShowCanvas(true);
                                        if (match[1] === 'html') setPreviewDevice('mobile');
                                      }}
                                      className="px-2 py-1 bg-zinc-800/90 backdrop-blur rounded border border-zinc-700 hover:bg-zinc-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
                                    >
                                      <PanelRightOpen className="w-3 h-3" />
                                      Open in Editor
                                    </button>
                                  </div>
                                  <SyntaxHighlighter
                                    style={atomDark}
                                    language={match[1]}
                                    PreTag="div"
                                    className="rounded-xl !bg-zinc-950 !m-0 border border-zinc-800 shadow-2xl text-[13px] md:text-sm"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs break-all" {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.files && msg.files.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                        {msg.files.map(file => (
                          <div key={file.id} className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-lg text-[10px] font-medium">
                            {file.type.startsWith('image/') ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            <span className="truncate max-w-[100px]">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center animate-pulse border border-zinc-700">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-4 w-48 bg-zinc-900 rounded animate-pulse" />
                <div className="h-4 w-32 bg-zinc-900 rounded animate-pulse" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Attached Files Preview */}
            <AnimatePresence>
              {attachedFiles.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-wrap gap-2"
                >
                  {attachedFiles.map(file => (
                    <div key={file.id} className="relative group">
                      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-xl pr-8">
                        {file.type.startsWith('image/') ? (
                          <div className="w-8 h-8 rounded bg-zinc-800 overflow-hidden">
                            <img src={file.url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded bg-indigo-600/20 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-indigo-400" />
                          </div>
                        )}
                        <div className="flex flex-col overflow-hidden max-w-[100px] md:max-w-[120px]">
                          <span className="text-[10px] font-medium truncate text-zinc-300">{file.name}</span>
                          <span className="text-[8px] text-zinc-500">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <button 
                          onClick={() => removeFile(file.id)}
                          className="absolute right-1 top-1 p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {/* Notebook Button */}
                        <button 
                          onClick={() => addToNotebook(file)}
                          className="absolute right-1 bottom-1 p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-indigo-400 transition-colors"
                          title="Add to Notebook context"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <div className="absolute left-2 md:left-4 top-3 md:top-4 flex items-center gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-indigo-400 transition-all"
                  title="Attach Files"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  multiple 
                  className="hidden" 
                />
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={`Message ${MODELS.find(m => m.id === selectedModel)?.name}...`}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl py-4 md:py-5 pl-12 md:pl-14 pr-14 md:pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none min-h-[56px] md:min-h-[64px] max-h-40 md:max-h-60 text-sm shadow-2xl"
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                className="absolute right-2 md:right-3 bottom-2 md:bottom-3 p-2.5 md:p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 disabled:text-zinc-700 rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            <div className="hidden md:flex items-center justify-center gap-6 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> Multimodal</span>
              <span className="flex items-center gap-1.5"><LayoutTemplate className="w-3 h-3" /> Multi-file IDE</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> Context Aware</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Canvas (IDE Editor) */}
      <AnimatePresence>
        {showCanvas && (
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed md:relative inset-0 md:inset-auto z-50 md:z-auto w-full md:w-[45%] lg:w-[50%] h-full flex flex-col bg-zinc-900 md:border-l border-zinc-800 shadow-2xl"
          >
            {/* Editor Tabs */}
            <div className="flex items-center bg-zinc-950 border-b border-zinc-800 overflow-x-auto scrollbar-none pt-safe">
              {openFileIds.map(id => {
                const file = projectFiles.find(f => f.id === id);
                if (!file) return null;
                return (
                  <div 
                    key={id} 
                    onClick={() => {
                      setActiveFileId(id);
                      setCanvasView(file.language === 'html' ? 'preview' : 'code');
                    }}
                    className={`flex items-center gap-2 px-4 py-3 border-r border-zinc-800 cursor-pointer min-w-[120px] max-w-[200px] group ${
                      activeFileId === id ? 'bg-zinc-900 text-zinc-100 border-t-2 border-t-indigo-500' : 'text-zinc-500 hover:bg-zinc-900/50'
                    }`}
                  >
                    <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${activeFileId === id ? 'text-indigo-400' : ''}`} />
                    <span className="text-xs truncate flex-1">{file.name}</span>
                    <button 
                      onClick={(e) => closeFile(e, id)}
                      className={`p-0.5 rounded-md hover:bg-zinc-700 ${activeFileId === id ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Canvas Header */}
            {activeFile && (
              <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-2 md:px-4 bg-zinc-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs text-zinc-400 truncate max-w-[30%] md:max-w-[40%]">
                  <Folder className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{activeFile.path}</span>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    <button
                      onClick={() => setCanvasView('code')}
                      className={`px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 md:gap-2 ${
                        canvasView === 'code' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Code</span>
                    </button>
                    <button
                      onClick={() => setCanvasView('preview')}
                      className={`px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 md:gap-2 ${
                        canvasView === 'preview' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Preview</span>
                    </button>
                  </div>
                  
                  {canvasView === 'preview' && (
                    <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 ml-1">
                      <button
                        onClick={() => setPreviewDevice('mobile')}
                        className={`p-1.5 rounded-lg transition-all ${previewDevice === 'mobile' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Mobile View"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPreviewDevice('desktop')}
                        className={`p-1.5 rounded-lg transition-all ${previewDevice === 'desktop' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Desktop View"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  
                  <div className="h-6 w-px bg-zinc-800 mx-1 md:mx-2 hidden sm:block" />
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        const blob = new Blob([activeFile.content], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = activeFile.name;
                        a.click();
                      }}
                      className="hidden sm:block p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                      title="Download File"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleCopy}
                      className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                      title="Copy Code"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => setShowCanvas(false)}
                      className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                      title="Close Editor"
                    >
                      <X className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              </header>
            )}

            {/* Canvas Content */}
            <div className="flex-1 overflow-hidden relative bg-zinc-950">
              {!activeFile ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-4">
                  <LayoutTemplate className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Select a file from the Project Explorer to view</p>
                </div>
              ) : canvasView === 'code' ? (
                <div className="h-full overflow-auto p-4 md:p-6 font-mono text-xs md:text-sm scrollbar-thin">
                  <SyntaxHighlighter
                    style={atomDark}
                    language={activeFile.language || 'text'}
                    PreTag="div"
                    className="!bg-transparent !m-0 !p-0"
                    showLineNumbers
                  >
                    {activeFile.content}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <div className="h-full bg-zinc-950 relative">
                  {renderPreview()}
                </div>
              )}
            </div>
            
            {/* Canvas Footer */}
            <footer className="h-8 border-t border-zinc-800 flex items-center justify-between px-4 bg-zinc-900 text-[10px] text-zinc-500 font-mono">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  IDE Mode
                </span>
                {activeFile && (
                  <>
                    <span className="opacity-50 hidden sm:inline">|</span>
                    <span className="hidden sm:inline">{activeFile.language.toUpperCase()}</span>
                    <span className="opacity-50">|</span>
                    <span>{activeFile.content.split('\n').length} lines</span>
                  </>
                )}
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
