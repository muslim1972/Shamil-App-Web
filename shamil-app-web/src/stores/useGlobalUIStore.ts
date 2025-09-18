import { create } from 'zustand';

interface GlobalUIState {
  activeScreen: 'chat' | 'conversations' | 'profile' | 'settings';
  selectionMode: 'none' | 'messages' | 'conversations';
  selectedItems: any[]; // Can be Message[] or Conversation[]
  
  setActiveScreen: (screen: 'chat' | 'conversations' | 'profile' | 'settings') => void;
  setSelectionMode: (mode: 'none' | 'messages' | 'conversations') => void;
  setSelectedItems: (items: any[]) => void;
  clearSelection: () => void;
  toggleSelectedItem: (item: any, type: 'message' | 'conversation') => void;
  
  // Actions to be triggered by the footer, handled by respective screens
  triggerAction: (actionType: 'deleteForMe' | 'deleteForAll' | 'pin' | 'forward' | 'deleteConversation' | 'archiveConversation') => void;
  lastTriggeredAction: { type: string; timestamp: number } | null;
  clearLastTriggeredAction: () => void;
}

export const useGlobalUIStore = create<GlobalUIState>((set, get) => ({
  activeScreen: 'conversations',
  selectionMode: 'none',
  selectedItems: [],
  lastTriggeredAction: null,

  setActiveScreen: (screen) => set({ activeScreen: screen }),
  setSelectionMode: (mode) => set({ selectionMode: mode }),
  setSelectedItems: (items) => set({ selectedItems: items }),
  clearSelection: () => set({ selectionMode: 'none', selectedItems: [] }),
  clearLastTriggeredAction: () => set({ lastTriggeredAction: null }),
  
  toggleSelectedItem: (item, type) => {
    const { selectedItems, selectionMode } = get();
    const isSelected = selectedItems.some(sItem => sItem.id === item.id);

    if (isSelected) {
      const newSelectedItems = selectedItems.filter(sItem => sItem.id !== item.id);
      if (newSelectedItems.length === 0) {
        set({ selectedItems: [], selectionMode: 'none' });
      } else {
        set({ selectedItems: newSelectedItems });
      }
    } else {
      // If selection mode is 'none' or different type, start new selection
      if (selectionMode === 'none' || (selectionMode === 'messages' && type === 'conversation') || (selectionMode === 'conversations' && type === 'message')) {
        set({ selectedItems: [item], selectionMode: type === 'message' ? 'messages' : 'conversations' });
      } else {
        set({ selectedItems: [...selectedItems, item] });
      }
    }
  },

  triggerAction: (actionType) => {
    set({ lastTriggeredAction: { type: actionType, timestamp: Date.now() } });
  },
}));
