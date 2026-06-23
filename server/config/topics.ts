/**
 * Canonical topic definitions for NeuralBrief.
 *
 * Each topic carries:
 *  - id          : slug used throughout the system
 *  - label       : human-readable display name
 *  - searchTerms : terms used by HN search + relevance scoring
 *  - relatedTerms: broader synonyms for partial-match scoring
 */

export interface Topic {
  id: string;
  label: string;
  searchTerms: string[];
  relatedTerms: string[];
}

export const TOPICS: Topic[] = [
  {
    id: 'ai',
    label: 'Artificial Intelligence',
    searchTerms: ['artificial intelligence', 'machine learning', 'deep learning', 'neural network'],
    relatedTerms: ['model', 'inference', 'training', 'llm', 'generative ai'],
  },
  {
    id: 'ai_research',
    label: 'AI Research',
    searchTerms: ['ai research', 'paper', 'arxiv', 'benchmark', 'transformer'],
    relatedTerms: ['dataset', 'fine-tuning', 'pretraining', 'alignment', 'rlhf'],
  },
  // FLAG: currently unused in sources.ts; consider removing later
  {
    id: 'ai-companies',
    label: 'AI Companies',
    searchTerms: ['openai', 'anthropic', 'google deepmind', 'mistral', 'cohere'],
    relatedTerms: ['startup', 'funding', 'valuation', 'series', 'acquisition'],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    searchTerms: ['openai', 'gpt', 'chatgpt', 'sora', 'o1'],
    relatedTerms: ['sam altman', 'dall-e', 'whisper', 'api', 'assistants'],
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    searchTerms: ['anthropic', 'claude', 'constitutional ai'],
    relatedTerms: ['dario amodei', 'safety', 'alignment', 'sonnet', 'haiku'],
  },
  {
    id: 'google-deepmind',
    label: 'Google DeepMind',
    searchTerms: ['google deepmind', 'gemini', 'bard', 'vertex ai'],
    relatedTerms: ['demis hassabis', 'alphafold', 'tpu', 'palm', 'imagen'],
  },
  {
    id: 'cloud',
    label: 'Cloud Computing',
    searchTerms: ['aws', 'azure', 'google cloud', 'cloud computing'],
    relatedTerms: ['serverless', 'kubernetes', 'container', 'microservice', 'iaas'],
  },
  {
    id: 'security',
    label: 'Cybersecurity',
    searchTerms: ['cybersecurity', 'vulnerability', 'exploit', 'breach', 'ransomware'],
    relatedTerms: ['cve', 'patch', 'zero-day', 'phishing', 'malware', 'infosec'],
  },
  {
    id: 'devops',
    label: 'DevOps & Infrastructure',
    searchTerms: ['devops', 'kubernetes', 'docker', 'ci/cd', 'infrastructure'],
    relatedTerms: ['helm', 'terraform', 'ansible', 'pipeline', 'deployment'],
  },
  {
    id: 'programming',
    label: 'Programming',
    searchTerms: ['programming', 'software engineering', 'open source', 'developer'],
    relatedTerms: ['library', 'framework', 'release', 'github', 'typescript'],
  },
  {
    id: 'data_science',
    label: 'Data Science',
    searchTerms: ['data science', 'pandas', 'numpy', 'dataframe'],
    relatedTerms: ['statistics', 'analytics', 'dataset', 'visualization'],
  },
  {
    id: 'machine_learning',
    label: 'Machine Learning',
    searchTerms: ['machine learning', 'ml', 'scikit-learn', 'xgboost'],
    relatedTerms: ['classification', 'regression', 'clustering', 'predictive'],
  },
  {
    id: 'agentic_ai',
    label: 'Agentic AI',
    searchTerms: ['agentic ai', 'autonomous agent', 'auto-gpt', 'langchain'],
    relatedTerms: ['planning', 'tool use', 'reasoning', 'workflow'],
  },
  {
    id: 'mlops',
    label: 'MLOps',
    searchTerms: ['mlops', 'model deployment', 'kubeflow', 'mlflow'],
    relatedTerms: ['monitoring', 'registry', 'pipeline', 'serving'],
  },
  {
    id: 'model_releases',
    label: 'Model Releases',
    searchTerms: ['model release', 'new model', 'open source model', 'huggingface'],
    relatedTerms: ['weights', 'llama', 'mistral', 'gemma'],
  },
  {
    id: 'ai_industry',
    label: 'AI Industry',
    searchTerms: ['ai industry', 'ai startup', 'funding', 'acquisition'],
    relatedTerms: ['investment', 'valuation', 'ceo', 'market'],
  },
  {
    id: 'tools_libraries',
    label: 'Tools & Libraries',
    searchTerms: ['ai tool', 'library release', 'framework', 'pytorch'],
    relatedTerms: ['tensorflow', 'jax', 'api', 'sdk'],
  },
];

/**
 * Look up a single topic by its id.
 * Returns undefined when the id is not found.
 */
export function getTopicById(topicId: string): Topic | undefined {
  return TOPICS.find((t) => t.id === topicId);
}

/**
 * Look up multiple topics by their ids.
 * Silently skips unknown ids.
 */
export function getTopicsByIds(topicIds: string[]): Topic[] {
  return topicIds.flatMap((id) => {
    const topic = getTopicById(id);
    return topic ? [topic] : [];
  });
}
