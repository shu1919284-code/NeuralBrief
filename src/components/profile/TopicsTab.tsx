import React from 'react';
import { motion } from 'motion/react';
import { BarChart2, Bot, BrainCircuit, Cpu, Settings, Zap, Briefcase, Code2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const TOPICS = [
  { id: 'data_science',      Icon: BarChart2,    labelKey: 'topic_data_science_label',      descKey: 'topic_data_science_desc' },
  { id: 'machine_learning',  Icon: Bot,          labelKey: 'topic_machine_learning_label',  descKey: 'topic_machine_learning_desc' },
  { id: 'ai_research',       Icon: BrainCircuit, labelKey: 'topic_ai_research_label',       descKey: 'topic_ai_research_desc' },
  { id: 'agentic_ai',        Icon: Cpu,          labelKey: 'topic_agentic_ai_label',        descKey: 'topic_agentic_ai_desc' },
  { id: 'mlops',             Icon: Settings,     labelKey: 'topic_mlops_label',             descKey: 'topic_mlops_desc' },
  { id: 'model_releases',    Icon: Zap,          labelKey: 'topic_model_releases_label',    descKey: 'topic_model_releases_desc' },
  { id: 'ai_industry',       Icon: Briefcase,    labelKey: 'topic_ai_industry_label',       descKey: 'topic_ai_industry_desc' },
  { id: 'tools_libraries',   Icon: Code2,        labelKey: 'topic_tools_libraries_label',   descKey: 'topic_tools_libraries_desc' },
];

interface TopicsTabProps {
  selectedTopics: string[];
  toggleTopic: (topicId: string) => void;
  canChangeTopics: () => boolean;
  daysUntilTopicChange: () => number;
}

export function TopicsTab({ selectedTopics, toggleTopic, canChangeTopics, daysUntilTopicChange }: TopicsTabProps) {
  const { t } = useLanguage();
  const locked = !canChangeTopics();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-widest font-bold text-text-muted">
          Select Your Topics
        </h4>
        {locked && (
          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
            Locked · {daysUntilTopicChange()}d left
          </span>
        )}
      </div>

      {locked && (
        <div className="text-[10px] text-text-muted italic border border-border-subtle rounded-lg p-3">
          Topics can be changed every 7 days. Next change available in {daysUntilTopicChange()} day{daysUntilTopicChange() !== 1 ? 's' : ''}.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {TOPICS.map(topic => {
          const isSelected = selectedTopics.includes(topic.id);
          return (
            <motion.button
              key={topic.id}
              whileTap={!locked ? { scale: 0.97 } : {}}
              onClick={() => toggleTopic(topic.id)}
              disabled={locked}
              className={`text-left p-3 border transition-all cursor-pointer ${
                isSelected
                  ? 'border-text-main bg-text-main/10 text-text-main'
                  : 'border-border-subtle hover:border-text-main/40 bg-transparent text-text-main'
              } ${locked ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <topic.Icon
                size={16}
                strokeWidth={1.5}
                className={`mb-2 ${isSelected ? 'text-text-main' : 'text-text-muted'}`}
              />
              <div className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                {t(topic.labelKey)}
              </div>
              <div className={`text-[9px] mt-1 leading-tight ${isSelected ? 'opacity-70 text-text-main' : 'text-text-muted'}`}>
                {t(topic.descKey)}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="text-[10px] text-text-muted">
        {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
      </div>
    </div>
  );
}
