
import React from 'react';
import { Mail, FileText, Zap, Code, LayoutGrid } from 'lucide-react';
import { CategoryType, MacroItem, BuilderTemplate } from './types';
import macros from "./src/data/macros.json";
import builders from "./src/data/builders.json";


export const INITIAL_MACROS: MacroItem[] = macros as MacroItem[];
export const INITIAL_BUILDERS: BuilderTemplate[] = builders as BuilderTemplate[];



export const CATEGORY_ICONS: Record<CategoryType | 'All', React.ReactNode> = {
  'All': <LayoutGrid size={18} />,
  'Emails': <Mail size={18} />,
  'Notes': <FileText size={18} />,
  'Macros': <Zap size={18} />,
  'Snippets': <Code size={18} />
};
