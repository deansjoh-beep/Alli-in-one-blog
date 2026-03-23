
import React from 'react';
import type { KeywordData, Feature } from '../types';

interface ResultsTableProps {
    data: KeywordData[];
    onKeywordClick: (keyword: string) => void;
    onGenerateTopicsFromMain: () => void;
    onGenerateTopicsFromAll: () => void;
    loading: boolean;
    feature: Feature;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ data, onKeywordClick, onGenerateTopicsFromMain, onGenerateTopicsFromAll, loading, feature }) => {
    
    const handleKeywordClick = (keyword: string) => {
        onKeywordClick(keyword);
    };

    const getTitle = () => {
        if (feature === 'related-keywords') {
            return '관련 검색어 (Related Searches)';
        }
        return '자동완성검색어';
    };

    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
                <table className="w-full text-sm table-auto">
                    <thead className="bg-gray-50 text-gray-400 uppercase tracking-widest text-[10px] font-bold">
                        <tr>
                            <th scope="col" className="p-4 text-left w-16">No.</th>
                            <th scope="col" className="p-4 text-left">{getTitle()}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors duration-200 group">
                                <td className="p-4 text-gray-400 text-center font-mono">{item.id}</td>
                                <td className="p-4 font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                     <button 
                                        onClick={() => handleKeywordClick(item.keyword)}
                                        className="text-left w-full hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1"
                                        aria-label={`${item.keyword}로 검색하기`}
                                    >
                                        {item.keyword}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {feature === 'keywords' && (
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={onGenerateTopicsFromMain}
                        disabled={loading}
                        className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl hover:border-indigo-300 hover:text-indigo-600 shadow-sm disabled:opacity-30 transition duration-300 flex items-center justify-center"
                    >
                        메인키워드로만 주제 만들기
                    </button>
                    <button 
                        onClick={onGenerateTopicsFromAll}
                        disabled={loading}
                        className="flex-1 bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:bg-gray-300 disabled:shadow-none transition duration-300 flex items-center justify-center"
                    >
                        자동완성검색어 조합으로 주제 만들기
                    </button>
                </div>
            )}
        </div>
    );
};

export default ResultsTable;
