import React, { useState, useCallback } from 'react';
import { generateCodeFromHtml } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

interface AssetList {
  images: string[];
  videos: string[];
  scripts: string[];
  styles: string[];
}
interface PageInfo {
  title: string;
  description: string;
  internalLinks: number;
  externalLinks: number;
}
interface AnalysisResult {
  generatedCode: string;
  assets: AssetList;
  pageInfo: PageInfo;
}

type ResultTab = 'code' | 'assets' | 'info';

export const WebsiteAnalyzer: React.FC = () => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [activeTab, setActiveTab] = useState<ResultTab>('code');
    const [isCopied, setIsCopied] = useState(false);

    const handleAnalyze = useCallback(async () => {
        if (!url.trim()) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            // Use a CORS proxy to fetch the website content
            const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
            }
            const html = await response.text();

            // Analyze the DOM client-side
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const base = new URL(url);

            const getAbsoluteUrl = (path: string) => new URL(path, base.href).href;

            const assets: AssetList = {
                images: Array.from(doc.querySelectorAll('img[src]')).map(el => getAbsoluteUrl(el.getAttribute('src')!)),
                videos: Array.from(doc.querySelectorAll('video source[src]')).map(el => getAbsoluteUrl(el.getAttribute('src')!)),
                scripts: Array.from(doc.querySelectorAll('script[src]')).map(el => getAbsoluteUrl(el.getAttribute('src')!)),
                styles: Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]')).map(el => getAbsoluteUrl(el.getAttribute('href')!)),
            };
            
            let internalLinks = 0, externalLinks = 0;
            doc.querySelectorAll('a[href]').forEach(a => {
                try {
                    const linkUrl = new URL(a.getAttribute('href')!, base.href);
                    if (linkUrl.hostname === base.hostname) {
                        internalLinks++;
                    } else {
                        externalLinks++;
                    }
                } catch (e) { /* Ignore invalid URLs */ }
            });

            const pageInfo: PageInfo = {
                title: doc.title || 'No title found',
                description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || 'No description found',
                internalLinks,
                externalLinks,
            };

            // Generate code using AI
            const generatedCode = await generateCodeFromHtml(html);
            
            setResult({ generatedCode, assets, pageInfo });
            setActiveTab('code');
        } catch (e) {
            setError((e as Error).message);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [url]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAnalyze();
    };
    
    const handleCopy = () => {
        if (!result?.generatedCode) return;
        navigator.clipboard.writeText(result.generatedCode).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    const TabButton: React.FC<{tab: ResultTab, children: React.ReactNode}> = ({tab, children}) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-dark-border'}`}
        >
            {children}
        </button>
    );
    
    const AssetSection: React.FC<{title: string, items: string[]}> = ({title, items}) => (
        <div>
            <h4 className="text-md font-semibold mb-2">{title} ({items.length})</h4>
            {items.length > 0 ? (
                <ul className="space-y-1 text-sm font-mono bg-gray-50 dark:bg-slate-900/70 p-3 rounded-md max-h-48 overflow-y-auto">
                    {items.map((item, i) => <li key={i} className="truncate" title={item}><a href={item} target="_blank" rel="noopener noreferrer" className="hover:underline">{item}</a></li>)}
                </ul>
            ) : <p className="text-sm text-gray-500 dark:text-dark-text-secondary">None found.</p>}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-border">
                <form onSubmit={handleFormSubmit}>
                    <label htmlFor="website-url" className="block text-lg font-medium text-dark dark:text-dark-text mb-2">
                        Website Scraper & Analyzer
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            id="website-url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            required
                            className="flex-grow px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-dark-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !url.trim()}
                            className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <GlobeIcon className="w-5 h-5 mr-2" />}
                            {isLoading ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </div>
                </form>
            </div>
            
            {isLoading && (
                 <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border">
                    <SpinnerIcon className="w-12 h-12 text-primary" />
                    <p className="mt-4 text-lg font-medium">Fetching page and analyzing...</p>
                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary">This might take a moment.</p>
                </div>
            )}
            
            {error && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-500/30">
                    <XCircleIcon className="w-12 h-12 text-red-500" />
                    <p className="mt-4 text-lg font-medium text-red-600 dark:text-red-400">An Error Occurred</p>
                    <p className="text-sm text-red-500 dark:text-red-400/80 max-w-md">{error}</p>
                </div>
            )}

            {result && (
                <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-border">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-border pb-3 mb-4">
                        <div className="flex space-x-2">
                           <TabButton tab="code">AI Generated Code</TabButton>
                           <TabButton tab="assets">Assets Found</TabButton>
                           <TabButton tab="info">Page Info</TabButton>
                        </div>
                         {activeTab === 'code' && (
                             <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-dark-text-secondary">
                                {isCopied ? <CheckIcon className="w-4 h-4 text-success" /> : <ClipboardIcon className="w-4 h-4" />}
                                {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                         )}
                    </div>
                    
                    {activeTab === 'code' && (
                        <pre className="bg-gray-50 dark:bg-slate-900/70 p-4 rounded-lg overflow-auto h-[500px]">
                            <code className="font-mono text-sm text-dark dark:text-dark-text whitespace-pre-wrap">
                                {result.generatedCode}
                            </code>
                        </pre>
                    )}
                    
                    {activeTab === 'assets' && (
                        <div className="space-y-4">
                            <AssetSection title="Images" items={result.assets.images} />
                            <AssetSection title="Videos" items={result.assets.videos} />
                            <AssetSection title="Stylesheets" items={result.assets.styles} />
                            <AssetSection title="Scripts" items={result.assets.scripts} />
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="space-y-3 text-sm">
                            <div>
                                <h4 className="font-semibold">Page Title</h4>
                                <p className="text-gray-600 dark:text-dark-text-secondary">{result.pageInfo.title}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Meta Description</h4>
                                <p className="text-gray-600 dark:text-dark-text-secondary">{result.pageInfo.description}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Links Found on Page</h4>
                                <p className="text-gray-600 dark:text-dark-text-secondary">{result.pageInfo.internalLinks} internal links</p>
                                <p className="text-gray-600 dark:text-dark-text-secondary">{result.pageInfo.externalLinks} external links</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};