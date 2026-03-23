import React from 'react';

const links = [
    {
        title: '실시간 인기 검색어 모음',
        description: '구글, 네이트, 줌, 다음',
        url: 'https://adsensefarm.kr/realtime/',
    },
    {
        title: '시그널 실검 (구.네이버 실검)',
        description: '실시간 검색어 순위 제공',
        url: 'https://www.signal.bz/',
    },
    {
        title: '네이버 데이터랩',
        description: '네이버의 검색 트렌드 분석 도구',
        url: 'https://datalab.naver.com/',
    },
    {
        title: '블로그 수익화 전략',
        description: '스마트한 IT생계백서',
        url: 'https://smart-it-life.tistory.com/category/블로그수익화',
    },
    {
        title: '대한민국 정책포털',
        description: '전국 정책 뉴스와 브리핑',
        url: 'https://www.korea.kr/news/policyNewsList.do',
    },
    {
        title: '금융위원회',
        description: '금융정책, 금융소비자보호',
        url: 'https://www.fsc.go.kr/index',
    },
    {
        title: '기획재정부',
        description: '경제성장전략, 세제개편안',
        url: 'https://www.moef.go.kr/together.do',
    },
    {
        title: 'KDI 한국개발연구원',
        description: '경제·사회 관련 종합정책',
        url: 'https://eiec.kdi.re.kr/',
    },
];

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);


export const Shortcuts: React.FC = () => {
    return (
        <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-3 text-lg">🔗</span>
                실시간 트렌드 및 정보
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <ul className="divide-y divide-gray-50">
                    {links.map((link, index) => (
                        <li key={index}>
                            <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 group"
                            >
                                <div>
                                    <h3 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                        {link.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">{link.description}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                    <ExternalLinkIcon />
                                </div>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
