import React, { useState, useEffect } from 'react';
import axios from '../../Config/Axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../Context/UserContext';
import { json2csv } from 'json-2-csv';
import { Search } from 'react-feather';

const ALL_HTML_TAGS = [
    'a', 'article', 'aside', 'b', 'blockquote', 'body', 'button', 'div', 'footer', 'form',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'i', 'iframe', 'img', 'input', 'label',
    'li', 'main', 'nav', 'ol', 'p', 'section', 'span', 'strong', 'table', 'tbody', 'td',
    'th', 'thead', 'tr', 'ul'
];

const downloadFile = async (data, format) => {
    if (!data) {
        console.error('No data provided to downloadFile');
        return;
    }

    try {
        let content = '';
        let mimeType = '';
        let filename = '';

        switch (format.toLowerCase()) {
            case 'csv':
                if (data.formatted?.csv) {
                    content = data.formatted.csv;
                } else {
                    const flatData = Object.entries(data.data).flatMap(([tag, elements]) =>
                        elements.map(el => ({
                            tag,
                            content: el.content || '',
                            ...el.attributes
                        }))
                    );
                    content = await new Promise((resolve, reject) => {
                        json2csv(flatData, (err, csvData) => {
                            if (err) reject(err);
                            else resolve(csvData);
                        });
                    });
                }
                mimeType = 'text/csv';
                filename = 'scraped-data.csv';
                break;

            case 'xml':
                content = data.formatted?.xml || '';
                mimeType = 'application/xml';
                filename = 'scraped-data.xml';
                break;

            case 'json':
            default:
                content = JSON.stringify(data.data || {}, null, 2);
                mimeType = 'application/json';
                filename = 'scraped-data.json';
        }

        // Create download link
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error in downloadFile:', error);
        throw error;
    }
};

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass w-full max-w-4xl p-8 rounded-xl shadow-2xl relative animate-[fadeIn_0.3s_ease-out]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
                >
                    <span className="text-2xl">×</span>
                </button>
                {children}
            </div>
        </div>
    );
};

const Scraper = () => {
    const [url, setUrl] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [results, setResults] = useState({ data: {} });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedFormat, setSelectedFormat] = useState('json');
    const [filterContent, setFilterContent] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredTags, setFilteredTags] = useState(ALL_HTML_TAGS);
    const [isFormatting, setIsFormatting] = useState(false);

    useEffect(() => {
        const filtered = ALL_HTML_TAGS.filter(tag =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredTags(filtered);
    }, [searchQuery]);

    const handleScrape = async (isAllContent = false) => {
        if (!url) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/scrape', {
                url,
                selectors: isAllContent ? {} : selectedTags.reduce((acc, tag) => ({ ...acc, [tag]: tag }), {}),
                format: selectedFormat,
                filterContent,
                scrapeAll: isAllContent
            });

            setResults(response.data || { data: {} });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to scrape website');
            setResults({ data: {} });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleScrape(false);
    };

    const handleTagChange = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const revalidateContent = (data, shouldFilter) => {
        if (!shouldFilter || !data) return data;

        const isValidContent = (content) => {
            if (!content || typeof content !== 'string') return false;
            const trimmed = content.trim();
            if (!trimmed || /^\s*$/.test(trimmed)) return false;
            if (trimmed.length < 2) return false;
            if (/^[.…\-_=<>{}()\[\]\/\\]+$/.test(trimmed)) return false;
            if (!/[a-zA-Z0-9]/.test(trimmed)) return false;
            const emojiRegex = /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
            return !emojiRegex.test(trimmed);
        };

        const filtered = JSON.parse(JSON.stringify(data));

        if (filtered.data) {
            Object.keys(filtered.data).forEach(key => {
                filtered.data[key] = filtered.data[key].filter(item =>
                    isValidContent(item.content)
                );
            });
        }

        if (filtered.formatted?.rows) {
            filtered.formatted.rows = filtered.formatted.rows.filter(row =>
                Object.values(row).some(value => isValidContent(value))
            );
        }

        return filtered;
    };

    const renderContent = () => {
        if (!results.format) return null;

        const displayData = revalidateContent(results, filterContent);

        const FilterBadge = () => (
            results.metadata?.filtered && (
                <span className="ml-2 px-2 py-1 bg-[#3D2998] text-white text-xs rounded">
                    Filtered
                </span>
            )
        );

        const ExportButton = () => (
            <button
                onClick={() => downloadFile(displayData, displayData.format)}
                className="ml-4 px-4 py-2 bg-[#3D2998] text-white rounded-md hover:bg-[#4e35b5]"
            >
                Export as {displayData.format.toUpperCase()}
            </button>
        );

        switch (displayData.format) {
            case 'csv':
                return (
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                Scraped Data Table
                                <FilterBadge />
                            </h3>
                            <ExportButton />
                        </div>
                        <div className="border border-gray-700 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                                <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
                                    <table className="w-full bg-gray-900">
                                        <thead className="sticky top-0 bg-gray-800">
                                            <tr>
                                                {displayData.formatted?.headers.map((header, i) => (
                                                    <th key={i} className="px-4 py-2 text-left text-white border-b border-gray-700">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayData.formatted?.rows.map((row, i) => (
                                                <tr key={i} className="hover:bg-gray-800">
                                                    {displayData.formatted.headers.map((header, j) => {
                                                        const value = row[header];
                                                        const isUrl = header.endsWith('_url') && value;

                                                        return (
                                                            <td key={j}
                                                                className="px-4 py-2 text-gray-300 border-b border-gray-700"
                                                                style={{
                                                                    minWidth: '150px',
                                                                    maxWidth: '300px',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                                title={value}
                                                            >
                                                                {isUrl ? (
                                                                    <a
                                                                        href={value}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-[#3D2998] hover:text-[#4e35b5]"
                                                                    >
                                                                        {value}
                                                                    </a>
                                                                ) : (
                                                                    value
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 text-gray-400 text-sm">
                            * Hover over cells to see full content
                        </div>
                    </div>
                );

            case 'xml':
                return (
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">XML Output</h3>
                            <ExportButton />
                        </div>
                        <div className="border border-gray-700 rounded-lg bg-gray-900 p-4">
                            <div className="overflow-x-auto">
                                <div
                                    className="overflow-y-auto bg-gray-800 rounded p-4"
                                    style={{
                                        maxHeight: '600px',
                                        maxWidth: '100%'
                                    }}
                                >
                                    <pre className="whitespace-pre-wrap break-words">
                                        <code className="text-gray-300 text-sm font-mono">
                                            {displayData.formatted?.xml}
                                        </code>
                                    </pre>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 text-gray-400 text-sm flex items-center gap-2">
                            <span>* Scroll horizontally and vertically to view all content</span>
                        </div>
                    </div>
                );

            case 'json':
            default:
                return (
                    <div className="mt-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                JSON Output
                                <FilterBadge />
                            </h3>
                            <ExportButton />
                        </div>
                        {Object.entries(displayData.data).map(([tag, elements]) => (
                            <div key={tag} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                <h3 className="text-lg font-semibold text-white mb-3 flex justify-between items-center">
                                    <span>{`${tag} (${elements.length})`}</span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(elements.map(e => e.content).join('\n'));
                                        }}
                                        className="text-sm px-3 py-1 bg-[#3D2998] rounded-md hover:bg-[#4e35b5] text-white"
                                    >
                                        Copy All
                                    </button>
                                </h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {elements.map((element, index) => (
                                        <div
                                            key={index}
                                            className="p-2 bg-gray-800 rounded border border-gray-700"
                                        >
                                            {tag === 'img' ? (
                                                <img
                                                    src={isValidUrl(element.attributes.src) ? element.attributes.src : ''}
                                                    alt={element.attributes.alt || ''}
                                                    className="max-w-full h-auto"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : tag === 'a' ? (
                                                isValidUrl(element.attributes.href) ? (
                                                    <a
                                                        href={element.attributes.href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[#3D2998] hover:text-[#4e35b5]"
                                                        onClick={(e) => {
                                                            if (!isValidUrl(element.attributes.href)) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                    >
                                                        {element.content}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-300">{element.content}</span>
                                                )
                                            ) : (
                                                <span className="text-gray-300">{element.content}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
        }
    };

    const isValidUrl = (url) => {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch (e) {
            return false;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 pt-16 px-4">
            <div className="max-w-6xl mx-auto glass rounded-xl shadow-2xl p-8 animate-[fadeIn_0.5s_ease-out]">
                <div className='flex mb-4'>
                    <h2 className="text-3xl font-bold gradient-text">Dev</h2>
                    <h2 className="text-3xl font-bold text-white"> Scrapper</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 text-white">
                    <div>
                        <label className="block text-gray-400 mb-2" htmlFor="url">
                            Website URL
                        </label>
                        <input
                            type="url"
                            id="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full p-3 rounded-lg glass-card focus:outline-none focus:ring-2 focus:ring-[#3D2998] border-0"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2">
                            Select Tags to Scrape
                        </label>
                        <div className="relative mb-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tags..."
                                className="w-full p-3 pl-10 rounded-lg glass-card focus:outline-none focus:ring-2 focus:ring-[#3D2998] border-0"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        </div>

                        <div className="glass-card p-4 rounded-lg">
                            <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto">
                                {filteredTags.map(tag => (
                                    <label
                                        key={tag}
                                        className={`
                                            inline-flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-300
                                            ${selectedTags.includes(tag)
                                                ? 'btn-animate text-white'
                                                : 'glass-card text-gray-300'}
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedTags.includes(tag)}
                                            onChange={() => handleTagChange(tag)}
                                            className="hidden"
                                        />
                                        <span>{tag}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2">
                            Export Format
                        </label>
                        <select
                            value={selectedFormat}
                            onChange={(e) => setSelectedFormat(e.target.value)}
                            className="w-full p-3 rounded-lg glass-card focus:outline-none focus:ring-2 focus:ring-[#3D2998] border-0"
                        >
                            <option value="json">JSON</option>
                            <option value="csv">CSV</option>
                            <option value="xml">XML</option>
                        </select>
                    </div>

                    <label className="flex items-center space-x-3 text-gray-400">
                        <input
                            type="checkbox"
                            checked={filterContent}
                            onChange={(e) => setFilterContent(e.target.checked)}
                            className="rounded border-gray-700 bg-gray-800 text-[#3D2998]"
                        />
                        <span>Filter out blank cells, images, and emojis</span>
                    </label>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={isLoading || !url || selectedTags.length === 0}
                            className="flex-1 btn-animate text-white p-4 rounded-lg font-medium"
                        >
                            {isLoading ? 'Scraping...' : 'Scrape Selected Tags'}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleScrape(true)}
                            disabled={isLoading || !url}
                            className="flex-1 btn-animate text-white p-4 rounded-lg font-medium"
                        >
                            Scrape All Content
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="mt-4 glass-card bg-red-900/50 p-4 rounded-lg animate-[fadeIn_0.3s_ease-out]">
                        <p className="text-red-200">{error}</p>
                    </div>
                )}

                {renderContent()}
            </div>
        </div>
    );
};

export default Scraper;