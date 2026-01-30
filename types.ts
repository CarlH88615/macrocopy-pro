
export type CategoryType = 'Emails' | 'Notes' | 'Macros' | 'Snippets';

export interface MacroItem {
  id: string;
  title: string;
  content: string; // HTML string
  category: CategoryType;
  updatedAt: number;
  shortcut?: string; // Optional single digit shortcut (0-9)
}

export type ConditionType = 'item_requested' | 'item_received' | 'outcome_selected' | 'all_outcomes_selected';

export interface ConditionLink {
  id: string;
  type: ConditionType;
  triggerLabel: string; // The name of the item or outcome
  macroId: string;      // The ID of the macro to copy
}

export interface BuilderTemplate {
  id: string;
  name: string;
  primaryLabel: string; // e.g. "Documents"
  secondaryLabel: string; // e.g. "Outcomes"
  items: string[];
  outcomes: string[];
  links: ConditionLink[]; // New field for dynamic shortcuts
}

export interface AppState {
  macros: MacroItem[];
  searchQuery: string;
  activeCategory: CategoryType | 'All';
  isEditing: boolean;
  editingId: string | null;
}
