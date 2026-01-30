
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, 
  Copy, 
  RotateCcw, 
  ShieldCheck, 
  AlertCircle, 
  FileCheck, 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  X,
  ChevronDown,
  HelpCircle,
  Hash,
  Mail,
  Link as LinkIcon
} from 'lucide-react';
import { BuilderTemplate, MacroItem, ConditionType, ConditionLink } from '../types';
import { INITIAL_BUILDERS } from '../constants';

declare const chrome: any;

type ItemStatus = 'received' | 'requested' | 'none';

interface SmartBuilderProps {
  macros?: MacroItem[];
  handleCopyMacro?: (item: MacroItem) => Promise<void>;
}

const SmartBuilder: React.FC<SmartBuilderProps> = ({ macros = [], handleCopyMacro }) => {
  // Persistence State
  const [templates, setTemplates] = useState<BuilderTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('');
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BuilderTemplate | null>(null);

  // Workflow State
  const [docStatuses, setDocStatuses] = useState<Record<string, ItemStatus>>({});
  const [docDetails, setDocDetails] = useState<Record<string, string>>({});
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedMacroId, setCopiedMacroId] = useState<string | null>(null);

  // Load Templates
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['builderTemplates'], (result: any) => {
        const loaded = (result.builderTemplates || INITIAL_BUILDERS).map((t: any) => ({
          ...t,
          links: t.links || []
        }));
        setTemplates(loaded);
        if (loaded.length > 0) setActiveTemplateId(loaded[0].id);
      });
    } else {
      const saved = localStorage.getItem('builder_templates');
      const loaded = saved ? JSON.parse(saved) : INITIAL_BUILDERS;
      const finalTemplates = loaded.map((t: any) => ({ ...t, links: t.links || [] }));
      setTemplates(finalTemplates);
      if (finalTemplates.length > 0) setActiveTemplateId(finalTemplates[0].id);
    }
  }, []);

  // Save Templates
  useEffect(() => {
    if (templates.length === 0) return;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ builderTemplates: templates });
    } else {
      localStorage.setItem('builder_templates', JSON.stringify(templates));
    }
  }, [templates]);

  const activeTemplate = useMemo(() => 
    templates.find(t => t.id === activeTemplateId) || templates[0], 
  [templates, activeTemplateId]);

  const setItemStatus = (label: string, status: ItemStatus) => {
    setDocStatuses(prev => {
      const nextStatus = prev[label] === status ? 'none' : status;
      if (nextStatus !== 'received') {
        setDocDetails(d => {
          const newD = { ...d };
          delete newD[label];
          return newD;
        });
      }
      return { ...prev, [label]: nextStatus };
    });
  };

  const toggleOutcome = (label: string) => {
    setSelectedOutcomes(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]);
  };

  const selectAllOutcomes = () => {
    if (activeTemplate) {
      if (selectedOutcomes.length === activeTemplate.outcomes.length) {
        setSelectedOutcomes([]);
      } else {
        setSelectedOutcomes(activeTemplate.outcomes);
      }
    }
  };

  const reset = () => {
    setDocStatuses({});
    setDocDetails({});
    setSelectedOutcomes([]);
  };

  const generatedNote = useMemo(() => {
    if (!activeTemplate) return '';
    const received = activeTemplate.items.filter(item => docStatuses[item] === 'received');
    const requested = activeTemplate.items.filter(item => docStatuses[item] === 'requested');
    const outcomes = selectedOutcomes;
    let noteParts: string[] = [];
    if (received.length > 0) {
      noteParts.push(`**Received:**\n${received.map(i => `- ${i}${docDetails[i] ? ' ' + docDetails[i] : ''}`).join('\n')}`);
    }
    if (requested.length > 0) {
      noteParts.push(`**Requested:**\n${requested.map(i => `- ${i}`).join('\n')}`);
    }
    if (outcomes.length > 0) {
      noteParts.push(`**Outcome:**\n${outcomes.map(o => `- ${o}`).join('\n')}`);
    }
    return noteParts.join('\n\n') || 'Start selecting items to build your note...';
  }, [docStatuses, docDetails, selectedOutcomes, activeTemplate]);

  // Dynamic Logic: Determine which macros should be shown as quick copy buttons
  const activeLinks = useMemo(() => {
    if (!activeTemplate) return [];
    return (activeTemplate.links || []).filter(link => {
      switch (link.type) {
        case 'item_requested':
          return docStatuses[link.triggerLabel] === 'requested';
        case 'item_received':
          return docStatuses[link.triggerLabel] === 'received';
        case 'outcome_selected':
          return selectedOutcomes.includes(link.triggerLabel);
        case 'all_outcomes_selected':
          return activeTemplate.outcomes.length > 0 && selectedOutcomes.length === activeTemplate.outcomes.length;
        default:
          return false;
      }
    });
  }, [activeTemplate, docStatuses, selectedOutcomes]);

  const handleCopyNote = () => {
    navigator.clipboard.writeText(generatedNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLinkedMacro = async (macroId: string) => {
    const macro = macros.find(m => m.id === macroId);
    if (macro && handleCopyMacro) {
      await handleCopyMacro(macro);
      setCopiedMacroId(macroId);
      setTimeout(() => setCopiedMacroId(null), 2000);
    }
  };

  // Editor Actions
  const startEditing = () => {
    if (activeTemplate) {
      setEditingTemplate({ ...activeTemplate, links: activeTemplate.links || [] });
      setIsEditingTemplate(true);
    }
  };

  const startNewTemplate = () => {
    setEditingTemplate({
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Builder',
      primaryLabel: 'Items',
      secondaryLabel: 'Outcomes',
      items: [],
      outcomes: [],
      links: []
    });
    setIsEditingTemplate(true);
  };

  const addLink = () => {
    if (!editingTemplate) return;
    const newLink: ConditionLink = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'item_requested',
      triggerLabel: editingTemplate.items[0] || '',
      macroId: macros[0]?.id || ''
    };
    setEditingTemplate({ ...editingTemplate, links: [...editingTemplate.links, newLink] });
  };

  const removeLink = (id: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({ ...editingTemplate, links: editingTemplate.links.filter(l => l.id !== id) });
  };

  const updateLink = (id: string, updates: Partial<ConditionLink>) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      links: editingTemplate.links.map(l => l.id === id ? { ...l, ...updates } : l)
    });
  };

  if (isEditingTemplate && editingTemplate) {
    return (
      <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-300">
        <header className="p-6 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Manage Template</h2>
            <p className="text-slate-500 text-xs">Configure headers, items, and dynamic macro links.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsEditingTemplate(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-all">Cancel</button>
            <button onClick={() => {
              if (editingTemplate) {
                setTemplates(prev => {
                  const exists = prev.find(t => t.id === editingTemplate.id);
                  if (exists) return prev.map(t => t.id === editingTemplate.id ? editingTemplate : t);
                  return [...prev, editingTemplate];
                });
                setActiveTemplateId(editingTemplate.id);
                setIsEditingTemplate(false);
              }
            }} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100">
              <Save size={18} /> Save Template
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-10">
              {/* Basic Config */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Builder Name</label>
                  <input type="text" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Label</label>
                  <input type="text" value={editingTemplate.primaryLabel} onChange={e => setEditingTemplate({...editingTemplate, primaryLabel: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50/50" />
                </div>
              </div>

              {/* Items & Outcomes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Checklist Items</label>
                    <button onClick={() => setEditingTemplate({...editingTemplate, items: [...editingTemplate.items, '']})} className="text-indigo-600 font-bold text-xs">+ Add Item</button>
                  </div>
                  <div className="space-y-2">
                    {editingTemplate.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" value={item} onChange={e => {
                          const next = [...editingTemplate.items];
                          next[idx] = e.target.value;
                          setEditingTemplate({...editingTemplate, items: next});
                        }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/30" />
                        <button onClick={() => setEditingTemplate({...editingTemplate, items: editingTemplate.items.filter((_, i) => i !== idx)})} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outcome Options</label>
                    <button onClick={() => setEditingTemplate({...editingTemplate, outcomes: [...editingTemplate.outcomes, '']})} className="text-emerald-600 font-bold text-xs">+ Add Outcome</button>
                  </div>
                  <div className="space-y-2">
                    {editingTemplate.outcomes.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" value={item} onChange={e => {
                          const next = [...editingTemplate.outcomes];
                          next[idx] = e.target.value;
                          setEditingTemplate({...editingTemplate, outcomes: next});
                        }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/30" />
                        <button onClick={() => setEditingTemplate({...editingTemplate, outcomes: editingTemplate.outcomes.filter((_, i) => i !== idx)})} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Dynamic Links Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <LinkIcon size={18} className="text-indigo-600" /> Macro Shortcuts & Links
                    </h3>
                    <p className="text-slate-500 text-xs">Define logic to show quick-copy buttons based on builder state.</p>
                  </div>
                  <button onClick={addLink} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all">+ Add Logic Link</button>
                </div>

                <div className="space-y-3">
                  {editingTemplate.links.map((link) => (
                    <div key={link.id} className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-left-2 duration-200">
                      <span className="text-xs font-bold text-slate-400 uppercase">If</span>
                      
                      <select value={link.type} onChange={e => updateLink(link.id, { type: e.target.value as ConditionType })} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-medium outline-none">
                        <option value="item_requested">Item Requested</option>
                        <option value="item_received">Item Received</option>
                        <option value="outcome_selected">Outcome Selected</option>
                        <option value="all_outcomes_selected">All Outcomes Selected</option>
                      </select>

                      {link.type !== 'all_outcomes_selected' && (
                        <select value={link.triggerLabel} onChange={e => updateLink(link.id, { triggerLabel: e.target.value })} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-medium outline-none max-w-[150px]">
                          {(link.type.includes('item') ? editingTemplate.items : editingTemplate.outcomes).map(label => (
                            <option key={label} value={label}>{label}</option>
                          ))}
                        </select>
                      )}

                      <span className="text-xs font-bold text-slate-400 uppercase">→ Show</span>

                      <select value={link.macroId} onChange={e => updateLink(link.id, { macroId: e.target.value })} className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-medium outline-none">
                        <option value="">Select a Macro...</option>
                        {macros.map(m => (
                          <option key={m.id} value={m.id}>{m.title}</option>
                        ))}
                      </select>

                      <button onClick={() => removeLink(link.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                    </div>
                  ))}
                  {editingTemplate.links.length === 0 && (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-sm italic">
                      No shortcuts defined. Add one to speed up your workflow!
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button onClick={() => {
                if(confirm("Permanently delete this template?")) {
                  setTemplates(prev => prev.filter(t => t.id !== editingTemplate.id));
                  if(templates.length > 1) setActiveTemplateId(templates[0].id);
                  setIsEditingTemplate(false);
                }
              }} className="flex items-center gap-2 text-red-400 hover:text-red-600 font-bold uppercase tracking-widest text-[10px] transition-all"><Trash2 size={16} /> Delete Builder Forever</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
      <div className="px-8 py-6 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <select value={activeTemplateId} onChange={e => { setActiveTemplateId(e.target.value); reset(); }} className="appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 pr-12 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer min-w-[240px]">
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="h-8 w-[1px] bg-slate-200"></div>
          <button onClick={startEditing} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Edit Template"><Settings size={20} /></button>
          <button onClick={startNewTemplate} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="New Template"><Plus size={20} /></button>
        </div>
        <button onClick={reset} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-bold uppercase tracking-widest"><RotateCcw size={14} /> Reset Builder</button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
        {!activeTemplate ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
              <FileCheck size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No active builder</h3>
            <p className="text-slate-500 max-w-sm mb-8">Please select a template from the dropdown or create a new one to get started.</p>
            <button onClick={startNewTemplate} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100">Create New Template</button>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-10">
              {/* Main Checklist */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeTemplate.primaryLabel} Checklist</label>
                  <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="w-16 text-center">Received</span>
                    <span className="w-16 text-center">Requested</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {activeTemplate.items.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${
                        docStatuses[item] && docStatuses[item] !== 'none'
                        ? (docStatuses[item] === 'received' ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 'bg-orange-50/50 border-orange-200 shadow-sm')
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}>
                        <span className={`font-bold text-sm ${docStatuses[item] === 'received' ? 'text-emerald-800' : docStatuses[item] === 'requested' ? 'text-orange-800' : 'text-slate-600'}`}>{item}</span>
                        <div className="flex items-center gap-4">
                          <button onClick={() => setItemStatus(item, 'received')} className={`w-16 h-10 rounded-2xl border flex items-center justify-center transition-all ${docStatuses[item] === 'received' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border-slate-200 text-slate-300 hover:border-emerald-300 hover:text-emerald-400'}`}><Check size={20} strokeWidth={3} /></button>
                          <button onClick={() => setItemStatus(item, 'requested')} className={`w-16 h-10 rounded-2xl border flex items-center justify-center transition-all ${docStatuses[item] === 'requested' ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white border-slate-200 text-slate-300 hover:border-orange-300 hover:text-orange-400'}`}><HelpCircle size={20} strokeWidth={2.5} /></button>
                        </div>
                      </div>
                      {docStatuses[item] === 'received' && (item.toLowerCase().includes('poo') || item.toLowerCase().includes('ownership')) && (
                        <div className="flex items-center gap-3 px-5 py-3 bg-emerald-600/5 rounded-2xl border border-emerald-100 animate-in slide-in-from-top-2 duration-200">
                          <Hash size={16} className="text-emerald-600" />
                          <input type="text" placeholder="Add details (e.g. 4598)" value={docDetails[item] || ''} onChange={(e) => setDocDetails({...docDetails, [item]: e.target.value})} className="bg-transparent text-emerald-800 text-sm font-bold outline-none placeholder:text-emerald-300 w-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Outcomes */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeTemplate.secondaryLabel}</label>
                  <button onClick={selectAllOutcomes} className="text-[10px] font-bold text-indigo-600 uppercase hover:underline">Select All</button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {activeTemplate.outcomes.map((out, idx) => (
                    <button key={idx} onClick={() => toggleOutcome(out)} className={`flex items-center gap-4 p-4 rounded-3xl border text-left transition-all ${selectedOutcomes.includes(out) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-4 ring-indigo-500/5' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 shadow-sm'}`}>
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${selectedOutcomes.includes(out) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                        {selectedOutcomes.includes(out) && <Check size={16} strokeWidth={4} />}
                      </div>
                      <span className="font-bold text-sm">{out}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Result Panel */}
            <div className="lg:sticky lg:top-8 self-start">
              <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-2xl shadow-indigo-500/5 flex flex-col min-h-[500px]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.25rem] shadow-sm"><FileCheck size={24} /></div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xl">Account Note</h3>
                    <p className="text-xs text-slate-400 font-medium">Automatic formatting based on logic</p>
                  </div>
                </div>
                
                <div className="flex-1 whitespace-pre-wrap font-mono text-slate-700 text-sm leading-relaxed p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 min-h-[240px]">
                  {generatedNote}
                </div>

                <div className="mt-8 space-y-4">
                  <button onClick={handleCopyNote} disabled={generatedNote.includes('Start selecting items')} className={`w-full flex items-center justify-center gap-3 py-6 rounded-[1.75rem] font-bold text-xl transition-all disabled:opacity-50 ${copied ? 'bg-emerald-600 text-white shadow-lg' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95'}`}>
                    {copied ? <><Check size={24} strokeWidth={3} /> Note Copied!</> : <><Copy size={24} /> Copy Note</>}
                  </button>

                  {/* Dynamic Macro Shortcuts Stack */}
                  <div className="space-y-3 animate-in fade-in duration-500">
                    {activeLinks.map(link => {
                      const macro = macros.find(m => m.id === link.macroId);
                      if (!macro) return null;
                      return (
                        <button key={link.id} onClick={() => handleCopyLinkedMacro(macro.id)} className={`w-full flex items-center justify-between gap-3 px-8 py-4 rounded-[1.5rem] font-bold text-sm transition-all border group ${copiedMacroId === macro.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'}`}>
                          <div className="flex items-center gap-3">
                            <Mail size={18} className={copiedMacroId === macro.id ? 'text-white' : 'text-emerald-600 group-hover:scale-110 transition-transform'} />
                            <span>Copy '{macro.title}'</span>
                          </div>
                          {copiedMacroId === macro.id ? <Check size={18} strokeWidth={3} /> : <Copy size={16} className="opacity-40" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartBuilder;
