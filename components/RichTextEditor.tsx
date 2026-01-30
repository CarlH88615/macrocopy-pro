
import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Type } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
        <button onClick={() => handleCommand('bold')} className="p-2 hover:bg-white rounded transition-colors text-slate-600" title="Bold"><Bold size={16} /></button>
        <button onClick={() => handleCommand('italic')} className="p-2 hover:bg-white rounded transition-colors text-slate-600" title="Italic"><Italic size={16} /></button>
        <button onClick={() => handleCommand('underline')} className="p-2 hover:bg-white rounded transition-colors text-slate-600" title="Underline"><Underline size={16} /></button>
        <div className="w-[1px] h-6 bg-slate-300 mx-1"></div>
        <button onClick={() => handleCommand('insertUnorderedList')} className="p-2 hover:bg-white rounded transition-colors text-slate-600" title="Bullet List"><List size={16} /></button>
        <button onClick={() => handleCommand('insertOrderedList')} className="p-2 hover:bg-white rounded transition-colors text-slate-600" title="Numbered List"><ListOrdered size={16} /></button>
        <div className="w-[1px] h-6 bg-slate-300 mx-1"></div>
        <select 
          onChange={(e) => handleCommand('fontSize', e.target.value)}
          className="bg-transparent text-sm text-slate-600 outline-none p-1 font-medium"
        >
          <option value="3">Normal</option>
          <option value="1">Small</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>
      </div>
      {/* 
        Fix: Div elements do not have a 'placeholder' property in React's HTMLAttributes.
        Using 'data-placeholder' is the standard way to pass custom attributes for CSS styling
        or other non-native properties while satisfying TypeScript's type checking.
      */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[300px] outline-none rich-content prose prose-slate max-w-none text-slate-900 leading-relaxed"
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
