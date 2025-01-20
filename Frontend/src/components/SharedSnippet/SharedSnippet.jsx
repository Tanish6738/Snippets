import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../Config/Axios';

const SharedSnippet = () => {
    const { snippetId } = useParams();
    const [snippet, setSnippet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSnippet = async () => {
            try {
                const { data } = await axios.get(`/api/snippets/get/${snippetId}`);
                setSnippet(data);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load snippet');
            } finally {
                setLoading(false);
            }
        };

        fetchSnippet();
    }, [snippetId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
                <div className="animate-pulse text-indigo-400">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
                <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-6 py-4 rounded-xl">
                    {error}
                </div>
            </div>
        );
    }

    if (!snippet) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
                <div className="text-indigo-300">Snippet not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B1120] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-[#1A1F35]/40 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/30 overflow-hidden transition-all transform hover:border-indigo-400/50 hover:shadow-indigo-500/10">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent mb-4">
                            {snippet.title}
                        </h1>
                        
                        <div className="mt-6 relative">
                            <pre className="bg-[#0B1120] p-4 rounded-xl overflow-x-auto border border-indigo-500/20 scrollbar-thin scrollbar-track-indigo-500/10 scrollbar-thumb-indigo-500/40">
                                <code className="text-indigo-100 font-mono text-sm">
                                    {snippet.content}
                                </code>
                            </pre>
                        </div>

                        <div className="mt-6 space-y-3">
                            <p className="text-indigo-300 text-sm">
                                Language: 
                                <span className="ml-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/30">
                                    {snippet.programmingLanguage}
                                </span>
                            </p>
                            
                            {snippet.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {snippet.tags.map(tag => (
                                        <span 
                                            key={tag} 
                                            className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 text-sm"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SharedSnippet;
