
import React, { useMemo } from 'react';
import { ShuffleIcon } from './Icons';

interface EmojiPromptProps {
  emojiOptions: string[];
  selectedEmojis: string[];
  customEmoji: string;
  onRefreshEmojis: () => void;
  onToggleEmoji: (emoji: string) => void;
  onCustomEmojiChange: (value: string) => void;
  maxSelectionReached: boolean;
}

const EmojiPrompt: React.FC<EmojiPromptProps> = ({
  emojiOptions,
  selectedEmojis,
  customEmoji,
  onRefreshEmojis,
  onToggleEmoji,
  onCustomEmojiChange,
  maxSelectionReached,
}) => {
  const selectionCount = useMemo(() => {
      return selectedEmojis.length + [...customEmoji.trim()].length;
  }, [selectedEmojis, customEmoji]);

  const handleCustomEmojiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newCustomEmojiCount = [...value.trim()].length;
    const availableSlots = 3 - selectedEmojis.length;
    
    if (newCustomEmojiCount > availableSlots) {
      const trimmedValue = [...value.trim()].slice(0, availableSlots).join('');
      onCustomEmojiChange(trimmedValue);
    } else {
      onCustomEmojiChange(value);
    }
  };

  return (
    <div className="text-left w-full animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div>
            <p className="text-gray-300">Select 2-3 emojis.</p>
            <p className={`text-sm ${selectionCount < 2 || selectionCount > 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                {selectionCount} / 3 selected
            </p>
        </div>
        <button
          onClick={onRefreshEmojis}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors duration-200 text-sm"
          aria-label="Refresh emoji suggestions"
        >
          <ShuffleIcon />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {emojiOptions.map((emoji) => {
          const isSelected = selectedEmojis.includes(emoji);
          const isDisabled = !isSelected && maxSelectionReached;
          return (
            <button
              key={emoji}
              onClick={() => onToggleEmoji(emoji)}
              disabled={isDisabled}
              className={`px-3 py-1.5 text-2xl font-medium rounded-full transition-all duration-200 border flex items-center justify-center
                ${
                  isSelected
                    ? 'bg-indigo-500 border-indigo-400 text-white'
                    : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500'
                }
                ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }
              `}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              {emoji}
            </button>
          );
        })}
      </div>
      
      <div>
        <input
            type="text"
            value={customEmoji}
            onChange={handleCustomEmojiChange}
            placeholder="Or, add custom emojis..."
            disabled={maxSelectionReached && ![...customEmoji.trim()].length}
            className="w-full p-3 text-2xl bg-gray-800 border-2 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
};

export default EmojiPrompt;