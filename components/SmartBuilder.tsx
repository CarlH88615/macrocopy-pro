
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
  Link as LinkIcon,
  MessageSquare
} from 'lucide-react';
import { BuilderTemplate, MacroItem, ConditionType, ConditionLink } from '../types';
import { INITIAL_BUILDERS, INITIAL_MACROS } from '../constants';
import { normalizeEmailText } from '../utils/normalize';

declare const chrome: any;

type ItemStatus = 'received' | 'requested' | 'rejected' | 'none';
type ViewMode = 'note' | 'email';

interface SmartBuilderProps {
  macros?: MacroItem[];
  handleCopyMacro?: (item: MacroItem) => Promise<void>;
  onMacrosChange?: (macros: MacroItem[]) => void;
}

const SmartBuilder: React.FC<SmartBuilderProps> = ({ macros = [], handleCopyMacro, onMacrosChange }) => {
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
  const [viewMode, setViewMode] = useState<ViewMode>('note');
  const [isEditMode, setIsEditMode] = useState(false);
  const [builderDraft, setBuilderDraft] = useState<{
    name: string;
    primaryLabel: string;
    secondaryLabel: string;
    headerNote: string;
    itemsText: string;
    outcomesText: string;
  } | null>(null);
  const [macroEdit, setMacroEdit] = useState<{ id: string; title: string; content: string } | null>(null);

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

  const startBuilderEdit = () => {
    if (!activeTemplate) return;
    setBuilderDraft({
      name: activeTemplate.name,
      primaryLabel: activeTemplate.primaryLabel,
      secondaryLabel: activeTemplate.secondaryLabel,
      headerNote: activeTemplate.headerNote || '',
      itemsText: activeTemplate.items.join('\n'),
      outcomesText: activeTemplate.outcomes.join('\n')
    });
    setIsEditMode(true);
  };

  const cancelBuilderEdit = () => {
    setBuilderDraft(null);
    setIsEditMode(false);
  };

  const saveBuilderEdit = () => {
    if (!activeTemplate || !builderDraft) return;
    const updated: BuilderTemplate = {
      ...activeTemplate,
      name: builderDraft.name.trim() || activeTemplate.name,
      primaryLabel: builderDraft.primaryLabel.trim() || activeTemplate.primaryLabel,
      secondaryLabel: builderDraft.secondaryLabel.trim() || activeTemplate.secondaryLabel,
      headerNote: builderDraft.headerNote.trim() || undefined,
      items: builderDraft.itemsText.split(/\r?\n/).map(i => i.trim()).filter(Boolean),
      outcomes: builderDraft.outcomesText.split(/\r?\n/).map(i => i.trim()).filter(Boolean),
      links: activeTemplate.links || []
    };
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    setActiveTemplateId(updated.id);
    setIsEditMode(false);
    setBuilderDraft(null);
    alert('Builder saved.');
  };

  const startMacroEdit = (macro: MacroItem) => {
    setMacroEdit({ id: macro.id, title: macro.title, content: macro.content });
  };

  const cancelMacroEdit = () => setMacroEdit(null);

  const saveMacroEdit = () => {
    if (!macroEdit) return;
    const updated = macros.map(m => m.id === macroEdit.id ? { ...m, content: macroEdit.content, updatedAt: Date.now() } : m);
    onMacrosChange?.(updated);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ macros: updated });
    } else {
      localStorage.setItem('macro_system_data', JSON.stringify(updated));
    }
    alert('Macro saved.');
    setMacroEdit(null);
  };

  const generatedNote = useMemo(() => {
    if (!activeTemplate) return '';
    const received = activeTemplate.items.filter(item => docStatuses[item] === 'received');
    const requested = activeTemplate.items.filter(item => docStatuses[item] === 'requested');
    const rejected = activeTemplate.items.filter(item => docStatuses[item] === 'rejected');
    const outcomes = selectedOutcomes;
    let noteParts: string[] = [];
    const isSeonTemplate = activeTemplate?.id === 'seon-closed-kyc';
    const isAppleTemplate = activeTemplate?.id === 'apple-pay-linked';
    let handledOutcome = false;
    if (activeTemplate.headerNote) {
      noteParts.push(activeTemplate.headerNote);
    }
    if (isAppleTemplate) {
      noteParts.push('**ApplePay has been used on multiple accounts**');
    }
    if (received.length > 0) {
      noteParts.push(`**Received:**\n${received.map(i => `- ${i}${docDetails[i] ? ' ' + docDetails[i] : ''}`).join('\n')}`);
    }
    if (requested.length > 0) {
      noteParts.push(`**Requested:**\n${requested.map(i => `- ${i}`).join('\n')}`);
    }
    if (rejected.length > 0) {
      noteParts.push(`**Rejected:**\n${rejected.map(i => `- ${i}${docDetails[i] ? ' ' + docDetails[i] : ''}`).join('\n')}`);
    }
    if (isSeonTemplate && outcomes.length > 0) {
      const selected = outcomes[0]; // only one outcome is meaningful here
      const actions: string[] = [];
      let outcomeText = '';
      if (selected === 'Re-opened') {
        noteParts.push('**Review:**\n- KYC provided and reviewed: Risk reduced and account deemed low risk');
        actions.push('SA flag removed', 'Manual KYC passed', 'SDD flag approved');
        outcomeText = 'Account reopened / active';
      } else if (selected === 'Remains closed (SEON high risk)') {
        noteParts.push('**Review:**\n- SEON deemed this account high risk');
        outcomeText = 'Account to remain closed';
      } else if (selected === 'Request more docs') {
        actions.push('Restrictions remain in place / awaiting documents');
        const outstanding = [...requested, ...rejected];
        const extra = outstanding.length > 0 ? `Additional KYC required: ${outstanding.join(', ')}` : 'Additional KYC required';
        outcomeText = extra;
      }
      if (actions.length > 0) {
        noteParts.push(`**Actions:**\n${actions.map(a => `- ${a}`).join('\n')}`);
      }
      if (outcomeText) {
        noteParts.push(`**Outcome:**\n- ${outcomeText}`);
      }
      handledOutcome = true;
    }

    if (isAppleTemplate && outcomes.length > 0) {
      const selected = outcomes[0];
      if (selected === 'High risk → Close') {
        noteParts.push('**Review:**\n- High risk linkage (SE/GS/Time-out etc)');
        noteParts.push('**Outcome:**\n- Account closed. No docs requested.');
      } else if (selected === 'Medium risk → Restrict + request PoO') {
        noteParts.push('**Review:**\n- Medium risk linkage (bonus abuse/limits/AML controls etc)');
        noteParts.push('**Actions:**\n- Restrictions applied\n- Payment method remains blocked\n- Requested: PoO of Apple Pay (blocked)');
        noteParts.push('**Outcome:**\n- Pending review (awaiting documents)');
      } else if (selected === 'Low risk → Keep open + warn') {
        noteParts.push('**Review:**\n- Low risk linkage identified.');
        noteParts.push('**Actions:**\n- Restrictions removed\n- Payment method remains blocked\n- Both accounts warned');
        noteParts.push('**Outcome:**\n- Account remains open');
      }
      handledOutcome = true;
    }

    if (outcomes.length > 0 && !handledOutcome) {
      noteParts.push(`**Outcome:**\n${outcomes.map(o => `- ${o}`).join('\n')}`);
    }
    return noteParts.join('\n\n') || 'Start selecting items to build your note...';
  }, [docStatuses, docDetails, selectedOutcomes, activeTemplate]);

  const generatedEmail = useMemo(() => {
    if (!activeTemplate) return '';
    
    // Rule: IDNTF should say Selfie with ID
    const translateLabel = (label: string) => label === 'IDNTF' ? 'Selfie with ID' : label;
    
    const received = activeTemplate.items
      .filter(item => docStatuses[item] === 'received')
      .map(translateLabel);
      
    const requested = activeTemplate.items
      .filter(item => docStatuses[item] === 'requested')
      .map(translateLabel);

    const rejected = activeTemplate.items
      .filter(item => docStatuses[item] === 'rejected')
      .map(translateLabel);

    const isSeonTemplate = activeTemplate?.id === 'seon-closed-kyc';
    const seonOutcome = selectedOutcomes[0];
    const isAppleTemplate = activeTemplate?.id === 'apple-pay-linked';
    const appleOutcome = selectedOutcomes[0];

    if (isSeonTemplate && (seonOutcome === 'Re-opened' || seonOutcome === 'Remains closed (SEON high risk)') && requested.length === 0 && rejected.length === 0) {
      return 'Use the macro shortcut for this outcome.';
    }

    if (isAppleTemplate) {
      if (appleOutcome === 'Low risk → Keep open + warn') {
        return 'Use the macro shortcut for this outcome.';
      }
      if (appleOutcome === 'High risk → Close') {
        return 'No email required for this outcome.';
      }
    }

    if (received.length === 0 && requested.length === 0 && rejected.length === 0) {
      return 'Start selecting items to build your email...';
    }

    let email = "Hello,\n\nThank you for sending your documents.\n";
    
    if (received.length > 0) {
      email += `We have processed your ${received.join(', ')}.\n`;
    }
    
    if (requested.length > 0) {
      email += `We still require:\n${requested.map(r => `- ${r}`).join('\n')}\n`;
    }

    if (rejected.length > 0) {
      email += `Please resubmit:\n${rejected.map(r => `- Resubmit: ${r} (previous submission could not be accepted).`).join('\n')}\n`;
    }
    
    email += "\nPlease log into your account to upload.";
    
    return normalizeEmailText(email);
  }, [docStatuses, activeTemplate, selectedOutcomes]);

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

  const handleCopyResult = () => {
    const text = viewMode === 'note' ? generatedNote : generatedEmail;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLinkedMacro = async (macroId: string) => {
    const macro = macros.find(m => m.id === macroId) || INITIAL_MACROS.find(m => m.id === macroId);
    if (macro && handleCopyMacro) {
      await handleCopyMacro(macro);
      setCopiedMacroId(macroId);
      setTimeout(() => setCopiedMacroId(null), 2000);
    }
  };

  const resetBuilderStorage = () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ builderTemplates: INITIAL_BUILDERS });
    } else {
      localStorage.setItem('builder_templates', JSON.stringify(INITIAL_BUILDERS));
    }
  };

  const resetMacroStorage = () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ macros: INITIAL_MACROS });
    } else {
      localStorage.setItem('macro_system_data', JSON.stringify(INITIAL_MACROS));
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

  const handleResetBuilders = () => {
    if (!confirm('Reset builder templates to defaults?')) return;
    setTemplates(INITIAL_BUILDERS);
    if (INITIAL_BUILDERS.length > 0) {
      setActiveTemplateId(INITIAL_BUILDERS[0].id);
    }
    reset();
    resetBuilderStorage();
    alert('Builder templates reset to defaults.');
  };

  const handleResetMacros = () => {
    if (!confirm('Reset macros to defaults?')) return;
    resetMacroStorage();
    alert('Macros reset to defaults.');
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
           <div className="w-full max-w-none space-y-8 pb-12">
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
    <>
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden animate-in fade-in duration-300">
      <div className="px-8 py-6 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 w-full">
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
          <button onClick={startBuilderEdit} className={`px-3 py-2 text-xs font-bold rounded-xl border ${isEditMode ? 'bg-indigo-600 text-white border-indigo-600' : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`} title="Inline edit mode">Edit</button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={reset} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-bold uppercase tracking-widest"><RotateCcw size={14} /> Reset Builder</button>
          <button onClick={handleResetBuilders} className="text-[11px] font-bold text-indigo-600 hover:underline">Reset builders</button>
          <button onClick={handleResetMacros} className="text-[11px] font-bold text-indigo-600 hover:underline">Reset macros</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 bg-slate-50/30 w-full">
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
          <div className="w-full max-w-full grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-start gap-6 sm:gap-8 lg:gap-12">
            <div className="space-y-10 min-w-0">
              {isEditMode && builderDraft && (
                <div className="p-5 bg-white border border-indigo-100 rounded-2xl shadow-sm space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={builderDraft.name} onChange={e => setBuilderDraft({...builderDraft, name: e.target.value})} placeholder="Builder name" />
                    <input className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={builderDraft.headerNote} onChange={e => setBuilderDraft({...builderDraft, headerNote: e.target.value})} placeholder="Header note (optional)" />
                    <input className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={builderDraft.primaryLabel} onChange={e => setBuilderDraft({...builderDraft, primaryLabel: e.target.value})} placeholder="Primary label" />
                    <input className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={builderDraft.secondaryLabel} onChange={e => setBuilderDraft({...builderDraft, secondaryLabel: e.target.value})} placeholder="Secondary label" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <textarea className="w-full h-28 px-3 py-2 border border-slate-200 rounded-lg" value={builderDraft.itemsText} onChange={e => setBuilderDraft({...builderDraft, itemsText: e.target.value})} placeholder="Items (one per line)"></textarea>
                    <textarea className="w-full h-28 px-3 py-2 border border-slate-200 rounded-lg" value={builderDraft.outcomesText} onChange={e => setBuilderDraft({...builderDraft, outcomesText: e.target.value})} placeholder="Outcomes (one per line)"></textarea>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={saveBuilderEdit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">Save</button>
                    <button onClick={cancelBuilderEdit} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold">Cancel</button>
                  </div>
                </div>
              )}
              {/* Main Checklist */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeTemplate.primaryLabel} Checklist</label>
                  <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="w-16 text-center">Received</span>
                    <span className="w-16 text-center">Requested</span>
                    <span className="w-16 text-center">Rejected</span>
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
                          <button onClick={() => setItemStatus(item, 'rejected')} className={`w-16 h-10 rounded-2xl border flex items-center justify-center transition-all ${docStatuses[item] === 'rejected' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200' : 'bg-white border-slate-200 text-slate-300 hover:border-red-300 hover:text-red-400'}`}><X size={20} strokeWidth={3} /></button>
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
            <div className="w-full min-w-0 lg:sticky lg:top-6">
              <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-2xl shadow-indigo-500/5 flex flex-col min-h-[500px]">
                <div className="flex flex-col mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.25rem] shadow-sm">
                        {viewMode === 'note' ? <FileCheck size={24} /> : <Mail size={24} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-xl">{viewMode === 'note' ? 'Account Note' : 'Generated Email'}</h3>
                        <p className="text-xs text-slate-400 font-medium">Automatic formatting based on logic</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* View Mode Switcher */}
                  <div className="flex bg-slate-100 p-1 rounded-2xl self-start">
                    <button 
                      onClick={() => setViewMode('note')}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'note' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      <MessageSquare size={16} /> Note
                    </button>
                    <button 
                      onClick={() => setViewMode('email')}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'email' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      <Mail size={16} /> Email
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 whitespace-pre-wrap font-mono text-slate-700 text-sm leading-relaxed p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 min-h-[240px]">
                  {viewMode === 'note' ? generatedNote : generatedEmail}
                </div>

                <div className="mt-8 space-y-4">
                  <button 
                    onClick={handleCopyResult} 
                    disabled={(viewMode === 'note' ? generatedNote : generatedEmail).includes('Start selecting items')} 
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-[1.25rem] font-bold text-base transition-all disabled:opacity-50 ${copied ? 'bg-emerald-600 text-white shadow-lg' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95'}`}
                  >
                    {copied ? <><Check size={20} strokeWidth={3} /> Copied!</> : <><Copy size={20} /> Copy {viewMode === 'note' ? 'Note' : 'Email'}</>}
                  </button>

                  {/* Dynamic Macro Shortcuts Stack */}
                  <div className="space-y-3 animate-in fade-in duration-500">
                    {activeLinks.map(link => {
                      const macro = macros.find(m => m.id === link.macroId) || INITIAL_MACROS.find(m => m.id === link.macroId);
                      if (!macro) return null;
                      return (
                        <div key={link.id} className={`w-full flex items-center justify-between gap-3 px-8 py-4 rounded-[1.5rem] font-bold text-sm transition-all border group ${copiedMacroId === macro.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'}`}>
                          <button onClick={() => handleCopyLinkedMacro(macro.id)} className="flex-1 flex items-center justify-between gap-3 text-left">
                            <div className="flex items-center gap-3">
                              <Mail size={18} className={copiedMacroId === macro.id ? 'text-white' : 'text-emerald-600 group-hover:scale-110 transition-transform'} />
                              <span>Copy '{macro.title}'</span>
                            </div>
                            {copiedMacroId === macro.id ? <Check size={18} strokeWidth={3} /> : <Copy size={16} className="opacity-40" />}
                          </button>
                          {isEditMode && (
                            <button onClick={() => startMacroEdit(macro)} className="text-[11px] font-bold text-indigo-600 hover:underline px-2">Edit macro</button>
                          )}
                        </div>
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
    {macroEdit && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900">Edit macro</h3>
            <button onClick={cancelMacroEdit} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
          </div>
          <div className="text-sm font-semibold text-slate-600">{macroEdit.title}</div>
          <textarea className="w-full h-48 border border-slate-200 rounded-xl p-3 text-sm" value={macroEdit.content} onChange={e => setMacroEdit({...macroEdit, content: e.target.value})} />
          <div className="flex gap-3 justify-end">
            <button onClick={cancelMacroEdit} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">Cancel</button>
            <button onClick={saveMacroEdit} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold text-sm">Save</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default SmartBuilder;

// Modal for macro edit
// (Placed after component for clarity; rendered inside return above)
