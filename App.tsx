
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Copy, 
  Edit3, 
  Trash2, 
  Check, 
  ChevronLeft,
  Clock,
  Zap,
  Keyboard,
  Info,
  Globe,
  Wand2,
  Database,
  Download,
  Upload,
  X
} from 'lucide-react';
import { MacroItem, CategoryType } from './types';
import { INITIAL_MACROS, CATEGORY_ICONS } from './constants';
import RichTextEditor from './components/RichTextEditor';
import SmartBuilder from './components/SmartBuilder';

declare const chrome: any;

const App: React.FC = () => {
  const [macros, setMacros] = useState<MacroItem[]>([]);
  
  // State for forced app view (full shell) based on URL params
  const [isAppView, setIsAppView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
const v = params.get('view');
return v === 'app' || v === 'floating';
  });

  const isFloating = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'floating';
  }, []);

    const isPopupView = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    return view === 'popup'; // only true when explicitly popup
  }, []);



  // State for active tab, initializing from URL if present
  const [activeTab, setActiveTab] = useState<'Library' | 'Builder'>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'smart-builder' || tab === 'builder') return 'Builder';
    if (tab === 'library') return 'Library';
    const view = params.get('view');
    if (view === 'popup') return 'Builder';
    return 'Builder'; // Default to Builder
  });

  const [activeCategory, setActiveCategory] = useState<CategoryType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<MacroItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isExtensionMode, setIsExtensionMode] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [importJson, setImportJson] = useState('');

  // Sync URL parameters on mount and handle navigation
  useEffect(() => {
    const handleUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
            // If manifest default_popup has view=popup but something injects view=app, respect popup size context
      if (window.innerWidth <= 420 && view !== 'popup') {
        params.set('view', 'popup');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      }

            if (view === 'popup') {
        setActiveTab('Builder');
      }

      const tab = params.get('tab');
      
            if (view === 'app' || view === 'floating') setIsAppView(true);
else setIsAppView(false);


      
      if (tab === 'smart-builder' || tab === 'builder') {
        setActiveTab('Builder');
      } else if (tab === 'library') {
        setActiveTab('Library');
      }
    };

    handleUrlParams();
    window.addEventListener('popstate', handleUrlParams);
    return () => window.removeEventListener('popstate', handleUrlParams);
  }, []);

  // Load Data
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      setIsExtensionMode(true);
      chrome.storage.local.get(['macros'], (result: any) => {
        if (result.macros && result.macros.length > 0) {
          setMacros(result.macros);
        } else {
          setMacros(INITIAL_MACROS);
          chrome.storage.local.set({ macros: INITIAL_MACROS });
        }
      });
    } else {
      const saved = localStorage.getItem('macro_system_data');
      setMacros(saved ? JSON.parse(saved) : INITIAL_MACROS);
    }
  }, []);

  // Persist Data
  useEffect(() => {
    if (macros.length === 0) return;
    if (isExtensionMode && typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ macros });
    } else {
      localStorage.setItem('macro_system_data', JSON.stringify(macros));
    }
  }, [macros, isExtensionMode]);

  const filteredMacros = useMemo(() => {
    return macros.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           m.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || m.category === activeCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [macros, searchQuery, activeCategory]);

  const handleCopy = useCallback((item: MacroItem) => {
    let formatted = item.content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p>/gi, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]+>/g, '');
    
    const temp = document.createElement('textarea');
    temp.innerHTML = formatted;
    const finalResult = temp.value;
    
    return navigator.clipboard.writeText(finalResult).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
      setMacros(prev => prev.map(m => m.id === item.id ? { ...m, updatedAt: Date.now() } : m));
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!editingItem) return;
    if (editingItem.id === 'new') {
      const newItem = { ...editingItem, id: Math.random().toString(36).substr(2, 9), updatedAt: Date.now() };
      setMacros(prev => [newItem, ...prev]);
    } else {
      setMacros(prev => prev.map(m => m.id === editingItem.id ? { ...editingItem, updatedAt: Date.now() } : m));
    }
    setEditingItem(null);
  }, [editingItem]);

  const handleDelete = useCallback((id: string) => {
    setMacros(prev => prev.filter(m => m.id !== id));
    setIsDeleting(null);
  }, []);

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (Array.isArray(parsed)) {
        setMacros(prev => [...parsed, ...prev]);
        setImportJson('');
        setShowDataModal(false);
        alert('Data imported successfully!');
      } else {
        alert('Invalid format. Please provide a JSON array.');
      }
    } catch (e) {
      alert('Error parsing JSON. Please check the format.');
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(macros, null, 2);
    navigator.clipboard.writeText(dataStr);
    alert('Library JSON copied to clipboard!');
  };

  const startNew = (category?: CategoryType) => {
    setEditingItem({
      id: 'new',
      title: '',
      content: '',
      category: category || 'Notes',
      updatedAt: Date.now(),
      shortcut: ''
    });
  };

  const categories: (CategoryType | 'All')[] = ['All', 'Emails', 'Notes', 'Macros', 'Snippets'];

  const renderLibrary = () => (
    <>
      <header className="px-6 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-xl relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input type="text" placeholder="Search macros, notes, or email templates..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"/>
        </div>
        <button onClick={() => startNew()} className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"><Plus size={20} />Create New</button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
        {filteredMacros.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            {filteredMacros.map(item => (
              <div key={item.id} className={`group relative bg-white border rounded-3xl p-6 shadow-sm transition-all flex flex-col ${copiedId === item.id ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-200 hover:shadow-xl hover:-translate-y-1'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">{item.category}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors line-clamp-1">{item.title || 'Untitled'}</h3>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingItem(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => setIsDeleting(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden mb-6 relative">
                  <div className="text-slate-700 text-sm line-clamp-3 rich-content leading-relaxed" dangerouslySetInnerHTML={{ __html: item.content }} />
                  <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent"></div>
                </div>
                <button onClick={() => handleCopy(item)} className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all border ${copiedId === item.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'}`}>
                  {copiedId === item.id ? <><Check size={18} className="animate-in zoom-in" />Copied!</> : <><Copy size={18} />Quick Copy</>}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6"><Search size={40} /></div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Nothing found</h3>
            <button onClick={() => startNew()} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100">Create New</button>
          </div>
        )}
      </div>
    </>
  );

  if (editingItem) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button onClick={() => setEditingItem(null)} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors gap-2">
              <ChevronLeft size={20} />
              <span className="font-medium">Back to Library</span>
            </button>
            <div className="flex gap-3">
              <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={!editingItem.title || !editingItem.content} className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-50">Save changes</button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Title</label>
                <input type="text" value={editingItem.title} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} placeholder="e.g. Welcome Email Template" className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white text-slate-900 font-medium"/>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
                <select value={editingItem.category} onChange={e => setEditingItem({ ...editingItem, category: e.target.value as CategoryType })} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-900 font-medium">
                  <option value="Emails">Emails</option>
                  <option value="Notes">Notes</option>
                  <option value="Macros">Macros</option>
                  <option value="Snippets">Snippets</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Content Editor</label>
              <RichTextEditor value={editingItem.content} onChange={val => setEditingItem({ ...editingItem, content: val })} placeholder="Type your macro content here..."/>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Floating view: render only the Smart Builder, full width/height, no sidebar.
  if (isFloating) {
    return (
      <div className="flex h-screen w-screen bg-white flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('Builder')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'Builder' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Smart Builder
          </button>
          <button
            onClick={() => setActiveTab('Library')}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'Library' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Macro Library
          </button>
        </div>
        <div className="flex-1 min-h-0">
          {activeTab === 'Builder' ? (
            <SmartBuilder macros={macros} handleCopyMacro={handleCopy} />
          ) : (
            <div className="flex flex-col h-full">{renderLibrary()}</div>
          )}
        </div>
      </div>
    );
  }

  return (
<div className="flex h-full w-full bg-white text-slate-900">
      {/* Sidebar: Forces 'flex' display if isAppView is true via URL param ?view=app */}
           {!isPopupView && (
        <aside className={`w-64 bg-slate-50 border-r border-slate-200 ${isAppView ? 'flex' : 'hidden md:flex'} flex-col shrink-0`}>
          <div className="p-6">
            <div className="flex items-center gap-3 text-indigo-600 mb-8">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200"><Zap size={24} /></div>
              <h1 className="font-bold text-xl tracking-tight text-slate-900">MacroCopy</h1>
            </div>
            
            <nav className="space-y-1 mb-8">
              <button onClick={() => setActiveTab('Library')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all ${activeTab === 'Library' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}><Zap size={18} /> Macro Library</button>
              <button onClick={() => setActiveTab('Builder')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all ${activeTab === 'Builder' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}><Wand2 size={18} /> Smart Builder</button>
            </nav>

            {activeTab === 'Library' && (
              <div className="space-y-1 animate-in fade-in duration-300">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 block">Categories</label>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${activeCategory === cat ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}>
                    {CATEGORY_ICONS[cat]}{cat}
                    {cat !== 'All' && <span className="ml-auto text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{macros.filter(m => m.category === cat).length}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-auto p-6 space-y-4">
            <button 
              onClick={() => setShowDataModal(true)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 transition-all"
            >
              <Database size={18} /> Data Management
            </button>
            <div className="bg-emerald-600/5 rounded-2xl p-4 border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest mb-1">
                <Globe size={12} /> Sync Active
              </div>
              <p className="text-[10px] text-emerald-800 leading-relaxed">Changes sync to your right-click menu instantly.</p>
            </div>
          </div>
        </aside>
      )}


      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top toggle bar (web/full view only) */}
        {!isPopupView && (
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-white">
            <button
              onClick={() => setActiveTab('Builder')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'Builder' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Smart Builder
            </button>
            <button
              onClick={() => setActiveTab('Library')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'Library' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              Macro Library
            </button>
          </div>
        )}

        {isPopupView || activeTab === 'Builder' ? (
          <SmartBuilder macros={macros} handleCopyMacro={handleCopy} />
        ) : (
          <>{renderLibrary()}</>
        )}
      </main>

      {/* Data Management Modal */}
      {showDataModal && !isPopupView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Database size={24} /></div>
                <h2 className="text-2xl font-bold text-slate-900">Import / Export Library</h2>
              </div>
              <button onClick={() => setShowDataModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={24} /></button>
            </div>
            
            <div className="space-y-6 flex-1 overflow-auto">
              <section className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Download size={18} /> Export Data</h3>
                <p className="text-sm text-slate-500 mb-4">Copy your entire library as JSON to back it up or move it to another device.</p>
                <button onClick={exportData} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-2">
                   <Copy size={16} /> Copy JSON string
                </button>
              </section>

              <section className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Upload size={18} /> Import Data</h3>
                <p className="text-sm text-slate-500 mb-4">Paste your macros JSON from another app here. It will be added to your current library.</p>
                <textarea 
                  value={importJson}
                  onChange={e => setImportJson(e.target.value)}
                  placeholder='Paste JSON array here... e.g. [{"title": "Example", "content": "..."}]'
                  className="w-full h-32 p-4 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 mb-4 bg-white text-slate-900"
                />
                <button 
                  onClick={handleImport} 
                  disabled={!importJson}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  Confirm Import
                </button>
              </section>
            </div>
          </div>
        </div>
      )}

      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6"><Trash2 size={32} /></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Delete Macro?</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">This will also remove it from your right-click menu immediately.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleting(null)} className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={() => handleDelete(isDeleting)} className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
