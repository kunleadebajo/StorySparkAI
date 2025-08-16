import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StoryIdea } from '../types';
import { DocumentTextIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface StoryIdeaCardProps {
  idea: StoryIdea;
  index: number;
  onGeneratePlan: (index: number) => void;
  isGeneratingPlan: boolean;
}

const StoryIdeaCard: React.FC<StoryIdeaCardProps> = ({ idea, index, onGeneratePlan, isGeneratingPlan }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasPlan = !!idea.researchPlan;
  const prevHasPlan = useRef(hasPlan);

  useEffect(() => {
    // Automatically expand the card when a research plan is first generated
    if (!prevHasPlan.current && hasPlan) {
      setIsExpanded(true);
    }
    prevHasPlan.current = hasPlan;
  }, [hasPlan]);

  const sanitizedHtml = useMemo(() => {
    if (!idea.researchPlan) return { __html: '' };
    const rawHtml = marked.parse(idea.researchPlan) as string;
    return { __html: DOMPurify.sanitize(rawHtml) };
  }, [idea.researchPlan]);

  const renderButton = () => {
    if (!hasPlan) {
      return (
        <button
          onClick={() => onGeneratePlan(index)}
          disabled={isGeneratingPlan}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-300 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-wait transition-colors"
          aria-label={`Generate research plan for ${idea.title}`}
        >
          {isGeneratingPlan ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Plan...
            </>
          ) : (
            <>
              <DocumentTextIcon />
              <span>Tell me more</span>
            </>
          )}
        </button>
      );
    }

    return (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-300 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`research-plan-${index}`}
      >
        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        <span>{isExpanded ? 'Hide Plan' : 'Show Plan'}</span>
      </button>
    );
  };

  return (
    <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: `${index * 100}ms` }}>
      <h3 className="text-xl font-bold text-indigo-300 mb-2">{idea.title}</h3>
      <p className="text-gray-300 prose prose-invert max-w-none">{idea.summary}</p>
      
      <div className="mt-4 text-right">
        {renderButton()}
      </div>

      {hasPlan && (
        <div
          id={`research-plan-${index}`}
          className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <div className={`mt-4 pt-4 border-t border-gray-700/50 transition-opacity duration-500 ease-in-out ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              <h4 className="text-lg font-semibold text-indigo-200 mb-2">Research Plan</h4>
              <div
                className="text-gray-300 prose prose-invert max-w-none font-sans"
                dangerouslySetInnerHTML={sanitizedHtml}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryIdeaCard;