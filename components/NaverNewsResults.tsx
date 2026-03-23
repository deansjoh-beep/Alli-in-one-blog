
import React from 'react';
import type { NaverNewsData, NewsStrategyIdea } from '../types';

interface NaverNewsResultsProps {
    data: NaverNewsData[];
    onGenerateStrategy: () => void;
    strategyLoading: boolean;
    strategy: NewsStrategyIdea[] | null;
    onTopicSelect: (title: string, context: string) => void;
}

const NaverNewsResults: React.FC<NaverNewsResultsProps> = ({ data, onGenerateStrategy, strategyLoading, strategy, onTopicSelect }) => {

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) {
            return dateString;
        }
    };
    
    const handleSelectStrategy = (idea: NewsStrategyIdea) => {
        const context = `[뉴스 기반 AI 전략]\n- 핵심 키워드: ${idea.keywords.join(', ')}\n- 콘텐츠 전략: ${idea.strategy}`;
        onTopicSelect(idea.title, context);
    };


    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fade-in space-y-6">
            <h3 className="flex items-center text-lg font-bold text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h3m-3 4h3m-3 4h3m-3 4h3" /></svg>
                <span className="ml-2">Naver 실시간 뉴스 분석</span>
            </h3>
            <div className="space-y-4">
                {data.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors group">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                             <p className="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">{formatDate(item.pubDate)}</p>
                             <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">{item.title}</h4>
                             <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                        </a>
                    </div>
                ))}
            </div>
             {strategy && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="flex items-center text-lg font-bold text-gray-900 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 21v-1m-4.663-2H16.34" /></svg>
                        <span className="ml-2">AI 블로그 공략 전략 (클릭하여 주제 선택)</span>
                    </h3>
                    <div className="space-y-4">
                        {strategy.map((idea) => (
                            <div 
                                key={idea.id} 
                                onClick={() => handleSelectStrategy(idea)}
                                className="bg-indigo-50/30 p-5 rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100 transition-all duration-200 cursor-pointer group"
                            >
                                <h4 className="font-bold text-indigo-700 group-hover:underline">{idea.title}</h4>
                                <div className="flex flex-wrap gap-2 my-3">
                                    {idea.keywords.map(kw => (
                                        <span key={kw} className="bg-white text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-100 shadow-sm">#{kw}</span>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{idea.strategy}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {!strategy && (
                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <button
                        onClick={onGenerateStrategy}
                        disabled={strategyLoading}
                        className="bg-indigo-600 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:bg-gray-300 disabled:shadow-none transition duration-300 flex items-center justify-center w-full sm:w-auto mx-auto"
                    >
                        {strategyLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                전략 생성 중...
                            </>
                        ) : 'AI 기반 블로그 공략 전략 생성'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default NaverNewsResults;