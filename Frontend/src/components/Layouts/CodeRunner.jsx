import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FaPlay, FaTrash, FaCopy } from 'react-icons/fa';

const CodeRunner = () => {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const defaultCode = {
    javascript: '// Write your JavaScript code here\n\n// Example:\nfunction example() {\n  return "Hello, World!";\n}\n\nexample();',
    python: '# Write your Python code here\n\n# Example:\ndef example():\n    return "Hello, World!"\n\nprint(example())'
  };

  useEffect(() => {
    setCode(defaultCode[language]);
  }, [language]);

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const runCode = async () => {
    setIsRunning(true);
    try {
        const response = await fetch('http://localhost:3000/api/run-code/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                code,
                language 
            })
        });

        const data = await response.json();
        
        if (data.success) {
            let finalOutput = '';
            if (data.output) {
                finalOutput += data.output + '\n';
            }
            if (data.result !== undefined) {
                finalOutput += '=> ' + data.result;
            }
            setOutput(finalOutput.trim());
        } else {
            setOutput(`Error: ${data.error}`);
        }
    } catch (error) {
        setOutput(`Error: ${error.message}`);
    } finally {
        setIsRunning(false);
    }
  };

  const clearOutput = () => {
    setOutput('');
  };

  const copyOutput = () => {
    if (output) {
      navigator.clipboard.writeText(output);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 pt-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              Code Runner
            </h1>
            <p className="text-indigo-400 text-sm">
              Write and execute code in real-time
            </p>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#0B1120] text-white border border-indigo-500/20 rounded-lg 
                     px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
        </div>

        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#1E1E1E] border-b border-indigo-500/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Language:</span>
              <span className="text-indigo-400 font-mono">{language}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Lines:</span>
              <span className="text-indigo-400 font-mono">{code.split('\n').length}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCode(defaultCode[language])}
              className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
              title="Reset to Default"
            >
              Reset
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
              title="Copy Code"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Section */}
          <div className="space-y-4">
            <div className="bg-[#0B1120]/80 backdrop-blur-xl rounded-xl border border-indigo-500/20 overflow-hidden">
              <div className="border-b border-indigo-500/20 p-4 flex justify-between items-center">
                <h3 className="text-white font-medium">Editor</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={runCode}
                    disabled={isRunning}
                    className="px-4 py-1.5 rounded-lg text-white 
                             bg-[#007ACC] hover:bg-[#005A9C]
                             transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center gap-2 text-sm font-medium"
                  >
                    <FaPlay size={12} />
                    {isRunning ? 'Running...' : 'Run Code'}
                  </button>
                </div>
              </div>
              <Editor
                height="500px"
                defaultLanguage={language}
                language={language}
                value={code}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  fontFamily: "'Fira Code', 'Consolas', monospace",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  padding: { top: 16 },
                  cursorStyle: 'line',
                  wordWrap: 'on',
                  renderLineHighlight: 'all',
                  suggestOnTriggerCharacters: true,
                  acceptSuggestionOnCommitCharacter: true,
                  tabSize: 2,
                  bracketPairColorization: true,
                  guides: {
                    bracketPairs: true,
                    indentation: true,
                  }
                }}
              />
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <div className="bg-[#1E1E1E] rounded-xl border border-indigo-500/20">
              <div className="border-b border-indigo-500/20 p-3 flex justify-between items-center bg-[#252526]">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium">Output</h3>
                  {isRunning && (
                    <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"/>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyOutput}
                    disabled={!output}
                    className="p-1.5 text-indigo-400 hover:text-white disabled:opacity-50 
                             disabled:cursor-not-allowed transition-colors duration-200
                             hover:bg-white/10 rounded"
                    title="Copy Output"
                  >
                    <FaCopy size={14} />
                  </button>
                  <button
                    onClick={clearOutput}
                    disabled={!output}
                    className="p-1.5 text-indigo-400 hover:text-white disabled:opacity-50 
                             disabled:cursor-not-allowed transition-colors duration-200
                             hover:bg-white/10 rounded"
                    title="Clear Output"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
              <div className="p-4 min-h-[200px] font-mono text-sm bg-[#1E1E1E]">
                {output ? (
                  <pre className="text-gray-300 whitespace-pre-wrap">{output}</pre>
                ) : (
                  <div className="text-gray-500 italic">
                    Output will appear here after running the code...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeRunner;
