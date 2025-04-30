import { useState } from 'react';
import axios from '../../../Config/Axios';
import { motion } from 'framer-motion';
import { FiX, FiCode, FiFileText, FiChevronDown, FiLoader, FiDownload, FiCopy, FiCheck } from 'react-icons/fi';

const DocumentationModal = ({ isOpen, onClose, snippet }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentation, setDocumentation] = useState(null);
  const [error, setError] = useState('');
  const [docStyle, setDocStyle] = useState('standard');
  const [detailLevel, setDetailLevel] = useState('medium');
  const [copiedSection, setCopiedSection] = useState(null);

  // Documentation style options
  const docStyles = [
    { value: 'standard', label: 'Standard' },
    { value: 'jsdoc', label: 'JSDoc' },
    { value: 'javadoc', label: 'JavaDoc' },
    { value: 'docstring', label: 'Python Docstring' }
  ];

  // Detail level options
  const detailLevels = [
    { value: 'basic', label: 'Basic' },
    { value: 'medium', label: 'Medium' },
    { value: 'comprehensive', label: 'Comprehensive' }
  ];

  const handleGenerate = async () => {
    if (!snippet?.content) {
      setError('No code content available.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setDocumentation(null);

    try {
      const { data } = await axios.post('/api/ai/documentation', {
        code: snippet.content,
        language: snippet.programmingLanguage,
        style: docStyle,
        level: detailLevel
      });
      
      if (data.success) {
        setDocumentation(data.documentation);
        // Show a warning if there was a generation error but we're displaying fallback content
        if (data.generationError) {
          setError("The documentation couldn't be fully generated. Showing limited information. Try again or choose a different style.");
        }
      } else {
        throw new Error(data.error || 'Failed to generate documentation');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to generate documentation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownload = () => {
    if (!documentation) return;
    
    // Create file content based on documentation
    const content = documentation.formattedDocumentation;
    
    // Allow selection of file format
    let fileExtension;
    let mimeType;
    
    switch(docStyle) {
      case 'jsdoc':
        fileExtension = 'js';
        mimeType = 'text/javascript';
        break;
      case 'javadoc':
        fileExtension = 'java';
        mimeType = 'text/plain';
        break;
      case 'docstring':
        fileExtension = 'py';
        mimeType = 'text/plain';
        break;
      default:
        fileExtension = 'md';
        mimeType = 'text/markdown';
    }
    
    const fileName = `${snippet.title || 'code'}_documentation.${fileExtension}`;
    
    // Create a blob and download it
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto pt-16 sm:pt-20">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-4xl w-full bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/40 overflow-hidden transition-all transform duration-300 hover:border-slate-600/70"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700/40 bg-gradient-to-r from-slate-800/40 to-slate-900/40">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/40 shadow-lg">
                  <FiFileText className="text-slate-300" size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Generate Documentation
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Create professional documentation for your code snippet
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-slate-300 transition-colors duration-200 p-2 rounded-full hover:bg-slate-800/70"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto 
            scrollbar-thin scrollbar-track-slate-900/20 
            scrollbar-thumb-slate-700/40 
            hover:scrollbar-thumb-slate-700/60 
            scrollbar-thumb-rounded-full
            scrollbar-track-rounded-full">

            {!documentation ? (
              <div className="space-y-6">
                {/* Error display */}
                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-300">
                    {error}
                  </div>
                )}

                {/* Options */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Documentation Style
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {docStyles.map(style => (
                        <button
                          key={style.value}
                          onClick={() => setDocStyle(style.value)}
                          className={`px-4 py-2 rounded-lg text-center transition-all duration-200 text-sm ${
                            docStyle === style.value 
                              ? 'bg-slate-700 text-white border-slate-600 shadow-inner'
                              : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border-slate-700/40'
                          } border`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Detail Level
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {detailLevels.map(level => (
                        <button
                          key={level.value}
                          onClick={() => setDetailLevel(level.value)}
                          className={`px-4 py-2 rounded-lg text-center transition-all duration-200 text-sm ${
                            detailLevel === level.value 
                              ? 'bg-slate-700 text-white border-slate-600 shadow-inner'
                              : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border-slate-700/40'
                          } border`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Snippet Preview */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-300">
                    Code Preview
                  </h3>
                  <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 max-h-60 overflow-y-auto">
                    <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
                      {snippet?.content ? 
                        (snippet.content.length > 500 
                          ? `${snippet.content.substring(0, 500)}...` 
                          : snippet.content) 
                        : 'No code content available'}
                    </pre>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !snippet?.content}
                    className={`px-6 py-2.5 rounded-xl flex items-center gap-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-md ${
                      isGenerating || !snippet?.content ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <FiLoader className="animate-spin" size={16} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FiFileText size={16} />
                        Generate Documentation
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Documentation Result */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-white">Documentation Result</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleDownload}
                      className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-all duration-200"
                      title="Download documentation"
                    >
                      <FiDownload size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Overview */}
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-300">Overview</h3>
                  <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="flex justify-between">
                      <p className="text-slate-300">{documentation.documentation.overview}</p>
                      <button
                        onClick={() => handleCopyText(documentation.documentation.overview, 'overview')}
                        className="p-1.5 text-slate-400 hover:text-slate-300 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedSection === 'overview' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sections */}
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-300">Sections</h3>
                  {documentation.documentation.sections.map((section, index) => (
                    <div key={index} className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-slate-200">{section.title}</h4>
                        <button
                          onClick={() => handleCopyText(section.content, `section-${index}`)}
                          className="p-1.5 text-slate-400 hover:text-slate-300 transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedSection === `section-${index}` ? <FiCheck size={16} /> : <FiCopy size={16} />}
                        </button>
                      </div>
                      <p className="text-slate-300 mt-2 text-sm">{section.content}</p>
                      
                      {/* Parameters */}
                      {section.params && section.params.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-slate-400">Parameters</h5>
                          <ul className="mt-1 space-y-1">
                            {section.params.map((param, paramIndex) => (
                              <li key={paramIndex} className="text-sm">
                                <span className="text-indigo-400">{param.name}</span>
                                <span className="text-slate-500"> : {param.type} - </span>
                                <span className="text-slate-300">{param.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Returns */}
                      {section.returns && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-slate-400">Returns</h5>
                          <p className="mt-1 text-sm">
                            <span className="text-green-400">{section.returns.type}</span>
                            <span className="text-slate-300"> - {section.returns.description}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Examples */}
                {documentation.documentation.examples && documentation.documentation.examples.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-300">Examples</h3>
                    {documentation.documentation.examples.map((example, index) => (
                      <div key={index} className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-slate-200">{example.title}</h4>
                          <button
                            onClick={() => handleCopyText(example.code, `example-${index}`)}
                            className="p-1.5 text-slate-400 hover:text-slate-300 transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedSection === `example-${index}` ? <FiCheck size={16} /> : <FiCopy size={16} />}
                          </button>
                        </div>
                        <pre className="mt-2 p-3 bg-slate-900/50 rounded-lg overflow-x-auto text-sm text-slate-300 font-mono">
                          {example.code}
                        </pre>
                        <p className="mt-2 text-sm text-slate-400">{example.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formatted Documentation */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-slate-300">Formatted Documentation</h3>
                    <button
                      onClick={() => handleCopyText(documentation.formattedDocumentation, 'formatted')}
                      className="p-1.5 text-slate-400 hover:text-slate-300 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedSection === 'formatted' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                    </button>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono">
                      {documentation.formattedDocumentation}
                    </pre>
                  </div>
                </div>

                {/* Back Button */}
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setDocumentation(null)}
                    className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/50 transition-all duration-200 flex items-center gap-1"
                  >
                    <FiChevronDown className="rotate-180" size={16} />
                    Back to Options
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-700/40 bg-slate-800/20 flex justify-between">
            <p className="text-xs text-slate-400">
              {docStyle === 'jsdoc' ? 'JSDoc' : 
               docStyle === 'javadoc' ? 'JavaDoc' : 
               docStyle === 'docstring' ? 'Python Docstring' : 'Standard'} 
              format with {detailLevel} detail
            </p>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DocumentationModal;