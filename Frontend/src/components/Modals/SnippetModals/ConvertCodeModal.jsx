import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCode, FiX, FiLoader, FiCopy, FiArrowRight, FiCheck, FiSave } from 'react-icons/fi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from '../../../Config/Axios';

const POPULAR_LANGUAGES = [
  { name: 'JavaScript', value: 'javascript' },
  { name: 'TypeScript', value: 'typescript' },
  { name: 'Python', value: 'python' },
  { name: 'Java', value: 'java' },
  { name: 'C#', value: 'csharp' },
  { name: 'C++', value: 'cpp' },
  { name: 'PHP', value: 'php' },
  { name: 'Go', value: 'go' },
  { name: 'Ruby', value: 'ruby' },
  { name: 'Rust', value: 'rust' },
  { name: 'Swift', value: 'swift' },
  { name: 'Kotlin', value: 'kotlin' }
];

const ConvertCodeModal = ({ isOpen, onClose, snippet, onSnippetUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [customLanguage, setCustomLanguage] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setError('');
      setResult(null);
      setCopied(false);
      setShowAllLanguages(false);
      setCustomLanguage('');
      
      // Try to set a different default target language from the current language
      if (snippet?.programmingLanguage) {
        const currentLanguage = snippet.programmingLanguage.toLowerCase();
        const alternatives = {
          javascript: 'python',
          python: 'javascript',
          java: 'kotlin',
          cpp: 'rust',
          'c++': 'rust',
          csharp: 'typescript',
          'c#': 'typescript',
          php: 'javascript',
          ruby: 'python',
          go: 'rust',
          typescript: 'python'
        };
        
        setTargetLanguage(alternatives[currentLanguage] || 'python');
      } else {
        setTargetLanguage('python');
      }
    }
  }, [isOpen, snippet]);

  const handleLanguageSelect = (language) => {
    setTargetLanguage(language);
    setCustomLanguage('');
  };

  const handleCustomLanguageChange = (e) => {
    setCustomLanguage(e.target.value);
    setTargetLanguage(e.target.value);
  };

  const handleConvertCode = async () => {
    if (!targetLanguage) {
      setError('Please select a target language');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/ai/convert-code', {
        code: snippet.content,
        sourceLanguage: snippet.programmingLanguage,
        targetLanguage
      });

      if (response.data.success) {
        setResult(response.data.result);
      } else {
        setError(response.data.error || 'Failed to convert code');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while converting the code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (result?.convertedCode) {
      navigator.clipboard.writeText(result.convertedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveAsNewSnippet = async () => {
    if (!result?.convertedCode) return;
    
    try {
      setLoading(true);
      
      const newSnippet = {
        title: `${snippet.title} (${targetLanguage})`,
        programmingLanguage: targetLanguage,
        content: result.convertedCode,
        tags: [...(snippet.tags || []), targetLanguage],
        parentId: snippet._id
      };
      
      const response = await axios.post('/api/snippets', newSnippet);
      
      if (response.data.success) {
        // If a callback was provided, call it with the new snippet
        if (typeof onSnippetUpdated === 'function') {
          onSnippetUpdated(response.data.snippet);
        }
        onClose();
      }
    } catch (err) {
      setError('Failed to save converted snippet');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !snippet) return null;
  
  const sourceLanguage = snippet.programmingLanguage?.toLowerCase() || 'plaintext';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto pt-16 sm:pt-20">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm"></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-6xl bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/40 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700/40 bg-slate-800/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600/50 to-indigo-800/50 border border-indigo-500/40">
                  <FiCode className="text-indigo-300" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Convert Code</h2>
                  <p className="text-sm text-slate-400">
                    Convert this snippet to another programming language
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-300 transition-colors rounded-full p-2 hover:bg-slate-800/50"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Error display */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Source code */}
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Source Code ({sourceLanguage})</h3>
                <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/50">
                  <SyntaxHighlighter
                    language={sourceLanguage}
                    style={atomDark}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: 'transparent',
                      fontSize: '0.9rem',
                      borderRadius: '0.5rem'
                    }}
                    wrapLines={true}
                  >
                    {snippet.content}
                  </SyntaxHighlighter>
                </div>
              </div>

              {/* Target code */}
              <div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {result ? `Converted Code (${targetLanguage})` : 'Target Language'}
                </h3>
                
                {!result ? (
                  <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 space-y-4">
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">
                        Select the language to convert to:
                      </label>
                      
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_LANGUAGES.slice(0, showAllLanguages ? POPULAR_LANGUAGES.length : 6).map(lang => (
                          <button
                            key={lang.value}
                            onClick={() => handleLanguageSelect(lang.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                              targetLanguage === lang.value
                                ? 'bg-indigo-500/70 text-white'
                                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/30'
                            }`}
                          >
                            {lang.name}
                          </button>
                        ))}
                        
                        {!showAllLanguages && (
                          <button
                            onClick={() => setShowAllLanguages(true)}
                            className="px-3 py-1.5 rounded-lg text-sm bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/30"
                          >
                            More...
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">
                        Or enter a custom language:
                      </label>
                      <input
                        type="text"
                        value={customLanguage}
                        onChange={handleCustomLanguageChange}
                        placeholder="Enter language name..."
                        className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                      />
                    </div>
                    
                    <div className="pt-3">
                      <button
                        onClick={handleConvertCode}
                        disabled={loading || !targetLanguage}
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <FiLoader className="animate-spin" size={18} />
                            Converting...
                          </>
                        ) : (
                          <>
                            <FiArrowRight size={18} />
                            Convert to {targetLanguage || 'selected language'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/50 relative">
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={handleCopyCode}
                        className="p-2 rounded-lg bg-slate-800/70 text-slate-400 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                        title="Copy code"
                      >
                        {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
                      </button>
                    </div>
                    
                    <SyntaxHighlighter
                      language={targetLanguage || 'plaintext'}
                      style={atomDark}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        background: 'transparent',
                        fontSize: '0.9rem',
                        borderRadius: '0.5rem'
                      }}
                      wrapLines={true}
                    >
                      {result.convertedCode}
                    </SyntaxHighlighter>
                  </div>
                )}
              </div>
            </div>
            
            {/* Explanation */}
            {result?.explanation && (
              <div className="mt-6 p-4 rounded-xl border border-slate-700/50 bg-slate-800/30">
                <h3 className="text-lg font-medium text-white mb-2">Explanation</h3>
                <p className="text-slate-300 whitespace-pre-line">{result.explanation}</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700/40 bg-slate-800/30 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-300 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 transition-all"
            >
              Cancel
            </button>
            
            {result && (
              <button
                onClick={handleSaveAsNewSnippet}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <FiLoader className="animate-spin" size={18} />
                ) : (
                  <FiSave size={18} />
                )}
                Save as New Snippet
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ConvertCodeModal;