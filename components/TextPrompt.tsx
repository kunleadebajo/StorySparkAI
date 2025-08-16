
import React, { useMemo } from 'react';
import { ShuffleIcon } from './Icons';

interface TextPromptProps {
  topicOptions: string[];
  selectedTopics: string[];
  customTopic: string;
  onRefreshTopics: () => void;
  onToggleTopic: (topic: string) => void;
  onCustomTopicChange: (value: string) => void;
  maxSelectionReached: boolean;
}

const TextPrompt: React.FC<TextPromptProps> = ({
  topicOptions,
  selectedTopics,
  customTopic,
  onRefreshTopics,
  onToggleTopic,
  onCustomTopicChange,
  maxSelectionReached,
}) => {
  const selectionCount = useMemo(() => {
      return selectedTopics.length + (customTopic.trim() ? 1 : 0);
  }, [selectedTopics, customTopic]);

  const handleCustomTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (maxSelectionReached && !customTopic.trim()) {
        return;
    }
    onCustomTopicChange(e.target.value);
  }

  return (
    <div className="text-left w-full animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div>
            <p className="text-gray-300">Select 2-3 topics.</p>
            <p className={`text-sm ${selectionCount < 2 || selectionCount > 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                {selectionCount} / 3 selected
            </p>
        </div>
        <button
          onClick={onRefreshTopics}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors duration-200 text-sm"
          aria-label="Refresh topic suggestions"
        >
          <ShuffleIcon />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {topicOptions.map((topic) => {
          const isSelected = selectedTopics.includes(topic);
          const isDisabled = !isSelected && maxSelectionReached;
          return (
            <button
              key={topic}
              onClick={() => onToggleTopic(topic)}
              disabled={isDisabled}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 border
                ${
                  isSelected
                    ? 'bg-indigo-500 border-indigo-400 text-white'
                    : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500'
                }
                ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }
              `}
            >
              {topic}
            </button>
          );
        })}
      </div>
      
      <div>
        <input
            type="text"
            value={customTopic}
            onChange={handleCustomTopicChange}
            placeholder="Or, add one custom topic..."
            maxLength={50}
            disabled={maxSelectionReached && !customTopic.trim()}
            className="w-full p-3 text-base bg-gray-800 border-2 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
};

export default TextPrompt;
