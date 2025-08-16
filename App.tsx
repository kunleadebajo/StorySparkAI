
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PromptType, StoryIdea } from './types';
import { generateStoryIdeas, generateResearchPlan } from './services/geminiService';
import { TOPICS, EMOJIS } from './constants';

import TextPrompt from './components/TextPrompt';
import EmojiPrompt from './components/EmojiPrompt';
import ImagePrompt from './components/ImagePrompt';
import StoryIdeaCard from './components/StoryIdeaCard';
import Loader from './components/Loader';
import ErrorMessage from './components/ErrorMessage';
import { TextIcon, EmojiIcon, ImageIcon, SparklesIcon } from './components/Icons';

const App: React.FC = () => {
  const [activePromptType, setActivePromptType] = useState<PromptType>(PromptType.TEXT);
  
  // State for TextPrompt
  const [topicOptions, setTopicOptions] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState<string>('');
  
  // State for EmojiPrompt
  const [emojiOptions, setEmojiOptions] = useState<string[]>([]);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [customEmoji, setCustomEmoji] = useState<string>('');
  
  // State for ImagePrompt
  const [imagePrompts, setImagePrompts] = useState<{ base64: string; mimeType: string }[]>([]);

  const [storyIdeas, setStoryIdeas] = useState<StoryIdea[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingPlanIndex, setGeneratingPlanIndex] = useState<number | null>(null);

  const handleRefreshTopics = useCallback(() => {
    setTopicOptions(currentTopicOptions => {
      const otherTopics = TOPICS.filter(t => !currentTopicOptions.includes(t));
      
      if (otherTopics.length >= 10) {
        const shuffled = otherTopics.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 10);
      } else {
        const shuffled = TOPICS.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 10);
      }
    });
  }, []);

  const handleRefreshEmojis = useCallback(() => {
    setEmojiOptions(currentEmojiOptions => {
      const otherEmojis = EMOJIS.filter(e => !currentEmojiOptions.includes(e));

      if (otherEmojis.length >= 10) {
        const shuffled = otherEmojis.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 10);
      } else {
        const shuffled = EMOJIS.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 10);
      }
    });
  }, []);

  useEffect(() => {
    if (activePromptType === PromptType.TEXT && topicOptions.length === 0) {
      handleRefreshTopics();
    }
    if (activePromptType === PromptType.EMOJI && emojiOptions.length === 0) {
      handleRefreshEmojis();
    }
  }, [activePromptType, topicOptions, emojiOptions, handleRefreshTopics, handleRefreshEmojis]);

  const totalTextPrompts = useMemo(() => {
    return selectedTopics.length + (customTopic.trim() ? 1 : 0);
  }, [selectedTopics, customTopic]);

  const totalEmojiPrompts = useMemo(() => {
    // Spreading the custom emoji string correctly counts grapheme clusters.
    return selectedEmojis.length + [...customEmoji.trim()].length;
  }, [selectedEmojis, customEmoji]);

  const handleToggleTopic = useCallback((topic: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) {
        return prev.filter(t => t !== topic);
      }
      if (totalTextPrompts < 3) {
        return [...prev, topic];
      }
      return prev;
    });
  }, [totalTextPrompts]);

  const handleToggleEmoji = useCallback((emoji: string) => {
    setSelectedEmojis(prev => {
      if (prev.includes(emoji)) {
        return prev.filter(e => e !== emoji);
      }
      if (totalEmojiPrompts < 3) {
        return [...prev, emoji];
      }
      return prev;
    });
  }, [totalEmojiPrompts]);


  const handleImagesChange = useCallback((images: { base64: string; mimeType: string }[]) => {
    setImagePrompts(images);
  }, []);

  const isGenerateButtonDisabled = useMemo(() => {
    if (isLoading) return true;
    switch (activePromptType) {
      case PromptType.TEXT:
        return totalTextPrompts < 2 || totalTextPrompts > 3;
      case PromptType.EMOJI:
        return totalEmojiPrompts < 2 || totalEmojiPrompts > 3;
      case PromptType.IMAGE:
        return imagePrompts.length < 1 || imagePrompts.length > 2;
      default:
        return true;
    }
  }, [isLoading, activePromptType, selectedTopics, customTopic, imagePrompts, totalTextPrompts, totalEmojiPrompts]);
  
  const getPrompts = (): string[] | { base64: string, mimeType: string }[] => {
    switch (activePromptType) {
      case PromptType.TEXT:
        return [...selectedTopics, customTopic.trim()].filter(Boolean);
      case PromptType.EMOJI:
        const combinedEmojis = [...selectedEmojis, ...[...customEmoji.trim()]].join('');
        return [combinedEmojis];
      case PromptType.IMAGE:
        return imagePrompts;
      default:
        return [];
    }
  };

  const handleGenerateIdeas = async () => {
    setError(null);
    setIsLoading(true);
    setStoryIdeas([]);

    try {
      const prompts = getPrompts();
      const ideas = await generateStoryIdeas(activePromptType, prompts);
      setStoryIdeas(ideas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async (index: number) => {
    setGeneratingPlanIndex(index);
    setError(null);
    try {
      const ideaToExpand = storyIdeas[index];
      if (!ideaToExpand || ideaToExpand.researchPlan) return;

      const plan = await generateResearchPlan(ideaToExpand);
      setStoryIdeas(prevIdeas => prevIdeas.map((idea, i) =>
        i === index ? { ...idea, researchPlan: plan } : idea
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate research plan for "${storyIdeas[index].title}". ${errorMessage}`);
    } finally {
      setGeneratingPlanIndex(null);
    }
  };

  const renderPromptComponent = () => {
    switch (activePromptType) {
      case PromptType.TEXT:
        return <TextPrompt
            topicOptions={topicOptions}
            selectedTopics={selectedTopics}
            customTopic={customTopic}
            onRefreshTopics={handleRefreshTopics}
            onToggleTopic={handleToggleTopic}
            onCustomTopicChange={setCustomTopic}
            maxSelectionReached={totalTextPrompts >= 3}
          />;
      case PromptType.EMOJI:
        return <EmojiPrompt
            emojiOptions={emojiOptions}
            selectedEmojis={selectedEmojis}
            customEmoji={customEmoji}
            onRefreshEmojis={handleRefreshEmojis}
            onToggleEmoji={handleToggleEmoji}
            onCustomEmojiChange={setCustomEmoji}
            maxSelectionReached={totalEmojiPrompts >= 3}
        />;
      case PromptType.IMAGE:
        return <ImagePrompt 
          onImagesChange={handleImagesChange}
        />;
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-200 flex flex-col items-center p-4 sm:p-8 animate-fade-in">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 mb-2">
            StorySpark AI
          </h1>
          <p className="text-lg text-gray-400">Your AI-powered partner in creative storytelling.</p>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 text-center">1. Choose Your Inspiration</h2>
            <div className="grid grid-cols-3 gap-2 bg-gray-900/60 p-1 rounded-xl">
              <TabButton
                label="Text"
                icon={<TextIcon />}
                isActive={activePromptType === PromptType.TEXT}
                onClick={() => setActivePromptType(PromptType.TEXT)}
              />
              <TabButton
                label="Emoji"
                icon={<EmojiIcon />}
                isActive={activePromptType === PromptType.EMOJI}
                onClick={() => setActivePromptType(PromptType.EMOJI)}
              />
              <TabButton
                label="Image"
                icon={<ImageIcon />}
                isActive={activePromptType === PromptType.IMAGE}
                onClick={() => setActivePromptType(PromptType.IMAGE)}
              />
            </div>
          </div>

          <div className="min-h-[200px] flex items-center justify-center p-4 bg-gray-900/40 rounded-lg mb-6">
            {renderPromptComponent()}
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold mb-4 text-center">2. Generate Ideas</h2>
            <button
              onClick={handleGenerateIdeas}
              disabled={isGenerateButtonDisabled}
              className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 text-lg font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <SparklesIcon />
              {isLoading ? 'Sparking Ideas...' : 'Generate Story Ideas'}
            </button>
          </div>

          <div className="min-h-[100px]">
            {isLoading && <Loader />}
            {error && <ErrorMessage message={error} />}
            {!isLoading && storyIdeas.length > 0 && (
              <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
                    Your Generated Story Ideas
                  </h2>
                {storyIdeas.map((idea, index) => (
                  <StoryIdeaCard 
                    key={index} 
                    idea={idea} 
                    index={index}
                    onGeneratePlan={handleGeneratePlan}
                    isGeneratingPlan={generatingPlanIndex === index}
                  />
                ))}
              </div>
            )}
             {!isLoading && !error && storyIdeas.length === 0 && (
                <div className="text-center text-gray-500 py-10">
                    <p>Your creative story ideas will appear here.</p>
                </div>
            )}
          </div>
        </main>

        <footer className="text-center mt-12 text-gray-600 text-sm">
          <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};


interface TabButtonProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 ${
            isActive ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-700/50'
        }`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);


export default App;
