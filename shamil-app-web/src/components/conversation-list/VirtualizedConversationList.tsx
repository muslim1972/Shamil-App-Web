import React from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import type { Conversation } from '../../types';
import { ConversationItem } from './ConversationItem';

interface VirtualizedConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
}

export const VirtualizedConversationList: React.FC<VirtualizedConversationListProps> = ({ 
  conversations, 
  onSelectConversation 
}) => {
  return (
    <div className="flex-1 overflow-y-auto">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={conversations.length}
            itemSize={80} // Approximate height of each conversation item
            overscanCount={5} // Number of items to render outside visible area
          >
            {({ index, style }) => (
              <div style={style}>
                <ConversationItem
                  conversation={conversations[index]}
                  onSelect={onSelectConversation}
                />
              </div>
            )}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

VirtualizedConversationList.displayName = 'VirtualizedConversationList';
