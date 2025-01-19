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
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (!snippet) {
        return <div>Snippet not found</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">{snippet.title}</h1>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                <code>{snippet.content}</code>
            </pre>
            <div className="mt-4">
                <p className="text-gray-600">Language: {snippet.programmingLanguage}</p>
                {snippet.tags?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                        {snippet.tags.map(tag => (
                            <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharedSnippet;
