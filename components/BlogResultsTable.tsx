
import React from 'react';
import type { BlogPostData } from '../types';

const BlogResultsTable: React.FC<{ data: BlogPostData[] }> = ({ data }) => {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
                <table className="w-full text-sm table-auto">
                    <thead className="bg-gray-50 text-gray-400 uppercase tracking-widest text-[10px] font-bold">
                        <tr>
                            <th scope="col" className="p-4 text-left w-16">No.</th>
                            <th scope="col" className="p-4 text-left">블로그 제목</th>
                            <th scope="col" className="p-4 text-center w-24">바로가기</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors duration-200 group">
                                <td className="p-4 text-gray-400 text-center font-mono">{item.id}</td>
                                <td className="p-4 font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.title}</td>
                                <td className="p-4 text-center">
                                    <a 
                                      href={item.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 hover:bg-indigo-600 hover:text-white transition-all duration-200"
                                      aria-label={`${item.title} (새 탭에서 열기)`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BlogResultsTable;
