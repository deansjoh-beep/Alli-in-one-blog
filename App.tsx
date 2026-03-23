import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { COLOR_THEMES, EEAT_CATEGORIES_DATA, EVERGREEN_SUBCATEGORIES } from './constants';
import { ColorTheme, GeneratedContent } from './types';
import { generateBlogPost, generateEeatTopicSuggestions, generateCategoryTopicSuggestions, generateEvergreenTopicSuggestions, suggestInteractiveElementForTopic, generateImage, generateTopicsFromMemo, generateLongtailTopicSuggestions, regenerateBlogPostHtml } from './services/geminiService';
import { CurrentStatus } from './components/CurrentStatus';
import { Shortcuts } from './components/Shortcuts';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  doc, 
  Timestamp, 
  ALLOWED_EMAILS,
  User
} from './firebase';

const Header: React.FC<{ 
  onOpenHelp: () => void; 
  user: User | null; 
  onLogout: () => void; 
  onViewHistory: () => void;
  onViewMain: () => void;
  view: 'main' | 'history';
}> = ({ onOpenHelp, user, onLogout, onViewHistory, onViewMain, view }) => (
  <header className="relative text-center p-8 bg-white border-b border-gray-100">
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
        올인원블로깅 <span className="text-indigo-600 text-sm font-medium align-middle ml-2">app sourced by GPT PARK</span><sup className="text-indigo-400 text-xl ml-1 font-semibold">BASIC</sup>
      </h1>
      <p className="text-gray-500 mt-3 max-w-4xl mx-auto text-base font-light whitespace-nowrap overflow-hidden text-ellipsis">AI와 함께 아이디어 발굴부터 SEO 최적화 포스팅까지, 블로깅의 모든 것을 한 곳에서 해결하세요.</p>
      
      {user && (
        <div className="mt-6 flex items-center space-x-4">
          <button 
            onClick={view === 'main' ? onViewHistory : onViewMain}
            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm hover:bg-indigo-100 transition-all flex items-center"
          >
            {view === 'main' ? (
              <><span className="mr-2">📜</span> 히스토리 보기</>
            ) : (
              <><span className="mr-2">🏠</span> 메인으로</>
            )}
          </button>
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <img src={user.photoURL || ''} alt="" className="w-6 h-6 rounded-full" />
            <span className="text-xs font-bold text-gray-600">{user.displayName}</span>
            <button onClick={onLogout} className="text-xs text-red-500 hover:text-red-700 font-bold ml-2">로그아웃</button>
          </div>
        </div>
      )}
    </div>
    <div className="absolute top-1/2 right-8 -translate-y-1/2 flex items-center space-x-3">
      <button
        onClick={onOpenHelp}
        className="text-gray-400 hover:text-indigo-600 transition-all p-2.5 rounded-full hover:bg-indigo-50 border border-transparent hover:border-indigo-100"
        aria-label="사용법 보기"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </button>
    </div>
  </header>
);

const Footer: React.FC = () => (
  <footer className="text-center p-10 mt-12 bg-gray-50 border-t border-gray-100 text-gray-400 text-sm">
    <p className="font-medium text-gray-500">Made by GPT PARK</p>
    <a href="https://www.youtube.com/@AIFACT-GPTPARK" target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-3 hover:text-indigo-600 transition-colors">
       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
      </svg>
      YouTube Channel
    </a>
  </footer>
);

const CopyToClipboardButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="flex items-center space-x-1 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-all disabled:opacity-50 font-medium" disabled={copied}>
      {copied ? <span className="text-green-600">✅</span> : <span>📋</span>}
      <span>{copied ? '복사됨!' : '복사'}</span>
    </button>
  );
};

const SocialMediaPostCard: React.FC<{ platform: string; content: string; icon: string }> = ({ platform, content, icon }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 flex items-center">
          <span className="mr-2 text-xl">{icon}</span>
          {platform} 포스트
        </h3>
        <CopyToClipboardButton textToCopy={content} />
      </div>
      <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-korean leading-relaxed">{content}</p>
    </div>
  );
};

const InteractiveCodeModal: React.FC<{ code: string; onClose: () => void; }> = ({ code, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const highlightedCode = useMemo(() => {
    if (!code) return '';
    const formattedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const tokenizer = /(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?[\w-]+)|(\s+[\w-:]+="[^"]*")|(&gt;)|([^&<>]+)/g;

    return formattedCode.replace(tokenizer, (match, comment, tag, attribute, closingBracket, text) => {
        if (comment) return `<span class="text-gray-400 italic">${comment}</span>`;
        if (tag) {
            const tagName = tag.replace(/&lt;\/?/, '');
            const bracket = tag.substring(0, tag.indexOf(tagName));
            return `<span class="text-gray-400">${bracket}</span><span class="text-indigo-600 font-bold">${tagName}</span>`;
        }
        if (attribute) {
            const parts = attribute.match(/(\s+)([\w-:]+)=(".*")/);
            if (parts) {
                const [, whitespace, attrName, attrValue] = parts;
                return `${whitespace}<span class="text-emerald-600">${attrName}</span>=<span class="text-amber-600">${attrValue}</span>`;
            }
        }
        if (closingBracket) return `<span class="text-gray-400">${closingBracket}</span>`;
        if (text) return `<span class="text-gray-800">${text}</span>`;
        return match;
    });
  }, [code]);

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-gray-900">인터랙티브 요소 코드</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-gray-50">
          <pre className="text-sm whitespace-pre-wrap break-all font-mono leading-relaxed">
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          </pre>
        </div>
        <div className="p-5 border-t border-gray-100 flex justify-end bg-white">
          <button onClick={handleCopy} className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold disabled:bg-gray-300" disabled={copied}>
            {copied ? <span>✅</span> : <span>📋</span>}
            <span>{copied ? '복사 완료!' : '코드 복사'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};


const ResultDisplay: React.FC<{
  topic: string;
  title: string;
  htmlContent: string;
  isLoading: boolean;
  supplementaryInfo: GeneratedContent['supplementaryInfo'] | null;
  socialMediaPosts: GeneratedContent['socialMediaPosts'] | null;
  imageBase64: string | null;
  subImages: GeneratedContent['subImages'] | null;
  onGenerateImage: () => Promise<void>;
  isGeneratingImage: boolean;
  onGenerateSubImage: (index: number) => Promise<void>;
  isGeneratingSubImages: Record<number, boolean>;
  shouldAddThumbnailText: boolean;
  onGenerateThumbnail: () => Promise<void>;
  isGeneratingThumbnail: boolean;
  thumbnailDataUrl: string | null;
  thumbnailAspectRatio: '16:9' | '1:1';
  onSave: () => Promise<void>;
  isSaving: boolean;
}> = ({
  topic,
  title,
  htmlContent,
  isLoading,
  supplementaryInfo,
  socialMediaPosts,
  imageBase64,
  subImages,
  onGenerateImage,
  isGeneratingImage,
  onGenerateSubImage,
  isGeneratingSubImages,
  shouldAddThumbnailText,
  onGenerateThumbnail,
  isGeneratingThumbnail,
  thumbnailDataUrl,
  thumbnailAspectRatio,
  onSave,
  isSaving
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
  const [isInteractiveCodeModalOpen, setIsInteractiveCodeModalOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const charCountNoSpaces = useMemo(() => {
    if (!htmlContent) {
      return 0;
    }
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Explicitly remove script and style tags to prevent their content from being counted.
    tempDiv.querySelectorAll('script, style').forEach(el => el.remove());

    // Use textContent for a more reliable result on non-rendered elements.
    const textOnly = tempDiv.textContent || '';

    // Remove all whitespace characters (spaces, newlines, tabs) and get the length.
    return textOnly.replace(/\s/g, '').length;
  }, [htmlContent]);

  const interactiveCode = useMemo(() => {
    if (!htmlContent) return null;
    const startMarker = '<!-- Interactive Element Start -->';
    const endMarker = '<!-- Interactive Element End -->';
    const startIndex = htmlContent.indexOf(startMarker);
    const endIndex = htmlContent.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1) {
      return htmlContent.substring(startIndex + startMarker.length, endIndex).trim();
    }
    return null;
  }, [htmlContent]);


  const imageUrl = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null;
  
  const imageHtml = imageUrl
    ? `<figure style="margin: 25px 0;">
         <img src="${imageUrl}" alt="${supplementaryInfo?.altText || 'Blog post image'}" style="width: 100%; max-height: 400px; border-radius: 8px; object-fit: contain;">
         <figcaption style="text-align: center; font-size: 14px; color: #6c757d; margin-top: 8px;">${supplementaryInfo?.altText || ''}</figcaption>
       </figure>`
    : '';

  const htmlToCopyAndShow = htmlContent
    .replace('<!--IMAGE_PLACEHOLDER-->', '')
    .replace(/<!--SUB_IMAGE_PLACEHOLDER_\d+-->/g, '');
  
  const highlightedHtmlCode = useMemo(() => {
    if (!htmlToCopyAndShow) return '';

    const code = htmlToCopyAndShow
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // This regex tokenizes the HTML string into parts for highlighting
    const tokenizer = /(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?[\w-]+)|(\s+[\w-:]+="[^"]*")|(&gt;)|([^&<>]+)/g;

    return code.replace(tokenizer, (match, comment, tag, attribute, closingBracket, text) => {
        if (comment) return `<span class="text-gray-500">${comment}</span>`;
        if (tag) {
            const tagName = tag.replace(/&lt;\/?/, '');
            const bracket = tag.substring(0, tag.indexOf(tagName));
            return `<span class="text-gray-400">${bracket}</span><span class="text-red-400">${tagName}</span>`;
        }
        if (attribute) {
            const parts = attribute.match(/(\s+)([\w-:]+)=(".*")/);
            if (parts) {
                const [, whitespace, attrName, attrValue] = parts;
                return `${whitespace}<span class="text-green-300">${attrName}</span>=<span class="text-yellow-300">${attrValue}</span>`;
            }
        }
        if (closingBracket) return `<span class="text-gray-400">${closingBracket}</span>`;
        if (text) return `<span class="text-white">${text}</span>`;
        return match; // Fallback
    });
  }, [htmlToCopyAndShow]);


  const handleCopy = () => {
    navigator.clipboard.writeText(htmlToCopyAndShow);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  useEffect(() => {
    if (viewMode === 'preview' && previewRef.current && htmlContent) {
        const container = previewRef.current;
        container.innerHTML = ''; // Clear previous content to prevent script duplication

        let htmlToPreview = htmlContent.replace('<!--IMAGE_PLACEHOLDER-->', imageHtml);

        // Replace sub-image placeholders
        if (subImages) {
            subImages.forEach((image, index) => {
                if (image.base64) {
                    const subImageUrl = `data:image/jpeg;base64,${image.base64}`;
                    const subImageHtml = `<figure style="margin: 25px 0;">
                                              <img src="${subImageUrl}" alt="${image.altText}" style="width: 100%; max-height: 400px; border-radius: 8px; object-fit: contain;">
                                              <figcaption style="text-align: center; font-size: 14px; color: #6c757d; margin-top: 8px;">${image.altText}</figcaption>
                                          </figure>`;
                    htmlToPreview = htmlToPreview.replace(`<!--SUB_IMAGE_PLACEHOLDER_${index + 1}-->`, subImageHtml);
                }
            });
        }
        
        // Use a temporary div to parse the HTML string and extract scripts
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlToPreview;

        const scripts = Array.from(tempDiv.getElementsByTagName('script'));
        
        // Remove script tags from the temporary div before appending its content
        scripts.forEach(script => script.parentNode?.removeChild(script));

        // Append the sanitized HTML (without scripts) to the container
        while (tempDiv.firstChild) {
            container.appendChild(tempDiv.firstChild);
        }

        // Create new script elements and append them to the container to execute them
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            // Copy all attributes
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.textContent = oldScript.textContent;
            container.appendChild(newScript);
        });
    }
  }, [viewMode, htmlContent, imageHtml, subImages]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm h-96">
        <div className="relative">
            <span className="text-6xl animate-bounce inline-block">✨</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping"></div>
        </div>
        <p className="text-gray-900 mt-6 text-xl font-bold">블로그 포스트를 생성 중입니다...</p>
        <p className="text-gray-500 mt-2 text-sm">잠시만 기다려 주세요. 최대 1분 정도 소요될 수 있습니다.</p>
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm h-96 text-center">
        <span className="text-6xl text-gray-200 mb-6">✍️</span>
        <p className="text-gray-900 text-xl font-bold">생성된 콘텐츠가 여기에 표시됩니다.</p>
        <p className="text-gray-500 mt-2 text-sm">위에서 주제를 입력하고 옵션을 선택한 후 생성 버튼을 클릭하세요.</p>
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">생성된 콘텐츠</h2>
        <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Ready to publish</span>
        </div>
      </div>
      
      {title && (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Suggested Title
            </div>
            <CopyToClipboardButton textToCopy={title} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 font-korean leading-tight group-hover:text-indigo-600 transition-colors">{title}</h1>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden flex flex-col">
          <div className="flex flex-wrap justify-between items-center p-4 bg-gray-50/50 border-b border-gray-100 gap-4">
            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
              <button onClick={() => setViewMode('preview')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-gray-500 hover:text-gray-900'}`}>
                미리보기
              </button>
              <button onClick={() => setViewMode('html')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'html' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-gray-500 hover:text-gray-900'}`}>
                HTML 코드
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-2">
                    {charCountNoSpaces.toLocaleString()} characters
                </div>
                <button
                  onClick={() => setIsInteractiveCodeModalOpen(true)}
                  disabled={!interactiveCode}
                  className="px-4 py-2 text-sm font-bold rounded-xl bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="mr-2">🎮</span>
                  인터랙티브
                </button>
                <button onClick={handleCopy} className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg shadow-indigo-100 disabled:bg-gray-300" disabled={copied}>
                  {copied ? <span className="mr-1">✅</span> : <span className="mr-1">📋</span>}
                  <span>{copied ? '복사됨' : 'HTML 복사'}</span>
                </button>
                <button 
                  onClick={onSave} 
                  disabled={isSaving || !htmlContent}
                  className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2 rounded-xl hover:bg-emerald-700 transition-all font-bold text-sm shadow-lg shadow-emerald-100 disabled:bg-gray-300"
                >
                  {isSaving ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  ) : (
                    <span className="mr-1">💾</span>
                  )}
                  <span>{isSaving ? '저장 중...' : '포스트 저장'}</span>
                </button>
            </div>
          </div>

          <div className="flex-grow overflow-auto">
            {viewMode === 'preview' ? (
              <div ref={previewRef} className="p-8 bg-white font-korean prose prose-indigo max-w-none" />
            ) : (
              <pre className="p-8 text-sm bg-gray-900 overflow-x-auto whitespace-pre-wrap break-all font-mono text-gray-300 leading-relaxed">
                <code dangerouslySetInnerHTML={{ __html: highlightedHtmlCode }} />
              </pre>
            )}
          </div>
        </div>

        {/* Right Column Wrapper */}
        <div className="flex flex-col gap-8">
          {supplementaryInfo && (
            <div className="bg-white rounded-2xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 p-6 flex flex-col space-y-8">
              
              {/* Image Section */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                    <h3 className="font-bold text-lg text-gray-900">대표 이미지</h3>
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-sm">🖼️</div>
                 </div>
                 
                 <div className="space-y-4">
                    {imageUrl ? (
                        <div className="relative group rounded-xl overflow-hidden shadow-md">
                            <img src={imageUrl} alt={supplementaryInfo.altText} className="w-full transition-transform duration-500 group-hover:scale-105" style={{ aspectRatio: thumbnailAspectRatio === '16:9' ? '16 / 9' : '1 / 1', objectFit: 'cover' }} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                                <a href={imageUrl} download="featured-image.jpeg" className="bg-white text-gray-900 p-2 rounded-full hover:bg-indigo-600 hover:text-white transition-colors shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                </a>
                            </div>
                        </div>
                    ): (
                        <div className="rounded-xl w-full bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8" style={{ aspectRatio: thumbnailAspectRatio === '16:9' ? '16 / 9' : '1 / 1' }}>
                            <span className="text-3xl mb-2">📸</span>
                            <span className="text-xs font-medium">이미지가 없습니다</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Image Prompt</h4>
                                <CopyToClipboardButton textToCopy={supplementaryInfo.imagePrompt} />
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed italic">"{supplementaryInfo.imagePrompt}"</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alt Text</h4>
                                <CopyToClipboardButton textToCopy={supplementaryInfo.altText} />
                            </div>
                            <p className="text-sm text-gray-600 font-medium">{supplementaryInfo.altText}</p>
                        </div>
                    </div>

                    <button
                        onClick={onGenerateImage}
                        disabled={isGeneratingImage}
                        className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:bg-gray-300 flex items-center justify-center"
                    >
                    {isGeneratingImage ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    ) : (imageBase64 ? '이미지 다시 생성' : '이미지 생성하기')}
                    </button>

                    {shouldAddThumbnailText && (
                      <button
                        onClick={onGenerateThumbnail}
                        disabled={isGeneratingThumbnail || !imageBase64}
                        className="w-full bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:bg-gray-300 flex items-center justify-center"
                      >
                        {isGeneratingThumbnail ? (
                           <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                            생성 중...
                          </>
                        ) : '🖼️ 썸네일 생성하기'}
                      </button>
                    )}
                 </div>

                 {thumbnailDataUrl && (
                  <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                    <h4 className="text-sm font-bold text-gray-900">생성된 썸네일</h4>
                    <div className="rounded-xl overflow-hidden shadow-lg border border-gray-100">
                        <img src={thumbnailDataUrl} alt="Generated thumbnail" className="w-full" />
                    </div>
                    <a href={thumbnailDataUrl} download="thumbnail.jpeg" className="w-full text-center bg-gray-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-all flex items-center justify-center shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      썸네일 다운로드
                    </a>
                  </div>
                )}
              </div>

              {/* Sub Images Section */}
              {subImages && subImages.length > 0 && (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                        <h3 className="font-bold text-lg text-gray-900">본문 서브 이미지</h3>
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-sm">📸</div>
                    </div>
                    <div className="space-y-10">
                        {subImages.map((subImage, index) => (
                            <div key={index} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Image #{index + 1}</h4>
                                    {subImage.base64 && (
                                        <a href={`data:image/jpeg;base64,${subImage.base64}`} download={`sub-image-${index + 1}.jpeg`} className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            Download
                                        </a>
                                    )}
                                </div>
                                {subImage.base64 ? (
                                    <div className="rounded-xl overflow-hidden shadow-md">
                                        <img src={`data:image/jpeg;base64,${subImage.base64}`} alt={subImage.altText} className="w-full" style={{ aspectRatio: '16 / 9', objectFit: 'cover' }} />
                                    </div>
                                ) : (
                                    <div className="rounded-xl w-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400" style={{ aspectRatio: '16 / 9' }}>
                                        <span className="text-xs font-medium">이미지가 없습니다</span>
                                    </div>
                                )}
                                
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Prompt</span>
                                            <CopyToClipboardButton textToCopy={subImage.prompt} />
                                        </div>
                                        <p className="text-xs text-gray-500 italic leading-relaxed">"{subImage.prompt}"</p>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Alt Text</span>
                                            <CopyToClipboardButton textToCopy={subImage.altText} />
                                        </div>
                                        <p className="text-xs text-gray-700 font-medium">{subImage.altText}</p>
                                    </div>
                                </div>

                                <button onClick={() => onGenerateSubImage(index)} disabled={isGeneratingSubImages[index]} className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center text-sm shadow-sm disabled:opacity-30">
                                     {isGeneratingSubImages[index] ? (
                                        <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                    ) : (subImage.base64 ? '이미지 재생성' : '이미지 생성하기')}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {/* SEO and Prompt Section */}
              <div className="space-y-6 pt-6 border-t border-gray-100">
                <div className="space-y-3">
                    <h3 className="font-bold text-gray-900 flex items-center">
                        <span className="mr-2">📈</span> SEO 제목 제안
                    </h3>
                    <div className="space-y-2">
                      {supplementaryInfo.seoTitles.map((title, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 font-medium flex items-start">
                            <span className="text-indigo-500 mr-2 mt-0.5">•</span>
                            {title}
                        </div>
                      ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <h3 className="font-bold text-gray-900 flex items-center">
                           <span className="mr-2">🔑</span> 핵심 키워드
                       </h3>
                       <CopyToClipboardButton textToCopy={supplementaryInfo.keywords.join(', ')} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {supplementaryInfo.keywords.map((kw, i) => (
                            <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                                #{kw}
                            </span>
                        ))}
                    </div>
                </div>
              </div>
            </div>
          )}
          
          {socialMediaPosts && (
            <div className="bg-white rounded-2xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 p-6 flex flex-col space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <h2 className="text-xl font-bold text-gray-900">소셜 미디어 홍보</h2>
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-sm">📢</div>
              </div>
              <div className="space-y-4">
                <SocialMediaPostCard platform="Threads" content={socialMediaPosts.threads} icon="🧵" />
                <SocialMediaPostCard platform="Instagram" content={socialMediaPosts.instagram} icon="📸" />
                <SocialMediaPostCard platform="Facebook" content={socialMediaPosts.facebook} icon="👍" />
                <SocialMediaPostCard platform="X" content={socialMediaPosts.x} icon="✖️" />
              </div>
            </div>
          )}
        </div>
      </div>
      {isInteractiveCodeModalOpen && interactiveCode && (
        <InteractiveCodeModal code={interactiveCode} onClose={() => setIsInteractiveCodeModalOpen(false)} />
      )}
    </div>
  );
};

const THUMBNAIL_COLORS = ['#FFFFFF', '#000000', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7B801', '#E53935', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6'];

const ManualSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h3 className="text-lg font-bold text-gray-900 border-l-4 border-indigo-600 pl-3 mb-3">{title}</h3>
    <div className="space-y-2 text-sm text-gray-600 leading-relaxed">{children}</div>
  </section>
);

const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-900">GPT PARK 올인원 블로깅 매뉴얼</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar bg-gray-50/30">
          <ManualSection title="[시작하며] 이 앱은 무엇인가요?">
            <p>GPT PARK의 올인원 블로깅은 아이디어 발굴부터 SEO(검색엔진최적화) 분석, 고품질의 기사 작성, 소셜 미디어 홍보까지 블로그 운영의 전 과정을 돕는 강력한 AI 어시스턴트입니다.</p>
            <p>복잡한 과정을 2개의 핵심 탭 <span className="text-yellow-300 font-semibold">'주제 아이디어 얻기', '트렌드 바로가기'</span>으로 단순화하여 누구나 쉽게 전문적인 블로그 콘텐츠를 만들 수 있도록 지원합니다.</p>
          </ManualSection>

          <ManualSection title="[Part 1] 주제 아이디어 얻기">
            <p>어떤 글을 써야 할지 막막할 때 사용하는 기능입니다. 5가지의 서로 다른 AI 분석 모델을 통해 다양한 관점의 주제를 추천받을 수 있습니다.</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li><strong className="text-slate-100">E-E-A-T 기반:</strong> 구글 SEO의 핵심인 '경험, 전문성, 권위성, 신뢰성'을 높일 수 있는 주제를 추천받아 블로그의 신뢰도를 높입니다.</li>
              <li><strong className="text-slate-100">카테고리별:</strong> IT, 건강, 재테크 등 특정 카테고리 내에서 독자의 흥미를 끌 만한 최신 트렌드 주제를 발굴합니다.</li>
              <li><strong className="text-slate-100">에버그린 콘텐츠:</strong> 시간이 지나도 가치가 변하지 않아 꾸준한 트래픽을 유도할 수 있는 '스테디셀러' 주제를 추천받습니다.</li>
              <li><strong className="text-slate-100">롱테일 키워드 주제:</strong> 실시간 구글 검색을 통해 경쟁이 낮고, 명확한 목적을 가진 사용자를 타겟으로 하는 구체적인 주제를 찾아냅니다.</li>
              <li><strong className="text-slate-100">메모/파일 기반:</strong> 가지고 있는 아이디어 메모, 초안, 자료 파일 등을 업로드하면 AI가 핵심을 분석하여 최적의 블로그 주제를 제안합니다.</li>
            </ul>
          </ManualSection>

          <ManualSection title="[Part 2] 포스트 생성하기">
            <p>추천받았거나 직접 입력한 주제로 실제 블로그 포스트를 생성하는 핵심 기능입니다.</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li><strong className="text-gray-900">블로그 주제:</strong> 생성할 포스트의 주제를 입력합니다. '주제 아이디어 얻기'에서 추천받은 주제를 클릭하면 자동으로 입력됩니다.</li>
              <li><strong className="text-gray-900">추가 요청사항:</strong> '특정 내용을 더 강조해달라'거나 '초보자 눈높이에서 쉽게 설명해달라'는 등 구체적인 요구사항을 AI에게 전달할 수 있습니다.</li>
              <li><strong className="text-gray-900">고급 옵션:</strong>
                <ul className="list-['-_'] list-inside space-y-1 pl-4 mt-1">
                    <li><strong className="text-indigo-600">이미지 생성:</strong> 대표 이미지와 본문 이미지를 AI가 자동으로 생성하고 배치합니다.</li>
                    <li><strong className="text-indigo-600">썸네일 텍스트 추가:</strong> 대표 이미지 위에 원하는 텍스트를 추가하여 클릭을 유도하는 썸네일을 제작합니다. 글꼴, 색상, 크기 등을 자유롭게 조절할 수 있습니다.</li>
                </ul>
              </li>
            </ul>
          </ManualSection>
          
           <ManualSection title="[Part 3] 결과물 확인 및 활용">
            <p>포스트 생성이 완료되면 결과물을 확인하고 다양하게 활용할 수 있습니다.</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
                <li><strong className="text-slate-100">미리보기/HTML:</strong> 생성된 포스트의 실제 모습과 블로그에 바로 붙여넣을 수 있는 HTML 소스 코드를 확인할 수 있습니다.</li>
                <li><strong className="text-slate-100">이미지 관리:</strong> 생성된 대표 이미지와 서브 이미지를 다시 생성하거나 PC에 다운로드할 수 있습니다.</li>
                <li><strong className="text-slate-100">SEO 정보:</strong> AI가 제안하는 다양한 SEO 최적화 제목과 핵심 키워드를 복사하여 블로그 포스팅 시 활용할 수 있습니다.</li>
                <li><strong className="text-slate-100">소셜 미디어 포스트:</strong> 블로그 홍보를 위해 Threads, 인스타그램, 페이스북, X(트위터)에 최적화된 홍보 문구를 AI가 자동으로 생성해 줍니다.</li>
            </ul>
          </ManualSection>

           <ManualSection title="[Part 4] 피드백 및 재작성">
            <p>AI가 생성한 글이 마음에 들지 않을 경우, 구체적인 수정 요청사항을 입력하여 기사 본문만 다시 생성할 수 있습니다. 이 기능을 통해 결과물의 완성도를 더욱 높일 수 있습니다.</p>
          </ManualSection>
        </div>
      </div>
    </div>
  );
};


const Login: React.FC<{ onLogin: () => void; isLoading: boolean; error: string | null }> = ({ onLogin, isLoading, error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-gray-100 text-center">
      <div className="mb-8">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
          ✨
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">올인원블로깅</h1>
        <p className="text-gray-500">지정된 관리자 계정으로 로그인해 주세요.</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
          {error}
        </div>
      )}
      
      <button
        onClick={onLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-100 py-4 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50 transition-all font-bold text-gray-700 shadow-sm disabled:opacity-50"
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
        ) : (
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
        )}
        <span>Google 계정으로 시작하기</span>
      </button>
      
      <div className="mt-10 pt-8 border-t border-gray-50">
        <p className="text-xs text-gray-400">접속 권한이 있는 계정만 이용 가능합니다.</p>
      </div>
    </div>
  </div>
);

const HistoryPage: React.FC<{ 
  posts: any[]; 
  onDelete: (id: string) => void; 
  onSelect: (post: any) => void;
  isLoading: boolean;
}> = ({ posts, onDelete, onSelect, isLoading }) => (
  <div className="max-w-5xl mx-auto p-6 space-y-8">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-extrabold text-gray-900 flex items-center">
        <span className="mr-3">📜</span> 저장된 포스트 히스토리
      </h2>
      <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
        {posts.length} Posts Saved
      </div>
    </div>

    {isLoading ? (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
        <p className="text-gray-500 font-medium">불러오는 중...</p>
      </div>
    ) : posts.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
        <span className="text-5xl mb-6">🏜️</span>
        <p className="text-gray-900 text-xl font-bold">저장된 포스트가 없습니다.</p>
        <p className="text-gray-500 mt-2">블로그 글을 생성한 후 '포스트 저장' 버튼을 눌러보세요.</p>
      </div>
    ) : (
      <div className="grid md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group flex flex-col">
            <div className="aspect-video bg-gray-100 relative overflow-hidden">
              {post.imageBase64 ? (
                <img src={`data:image/jpeg;base64,${post.imageBase64}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">📸</div>
              )}
              <div className="absolute top-4 left-4">
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-gray-600 shadow-sm">
                  {post.createdAt?.toDate().toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="p-6 flex-grow flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2 italic">"{post.topic}"</p>
              
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                <button 
                  onClick={() => onSelect(post)}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center"
                >
                  상세 보기 <span className="ml-1">→</span>
                </button>
                <button 
                  onClick={() => onDelete(post.id)}
                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                  title="삭제"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);


function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [view, setView] = useState<'main' | 'history'>('main');
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [topic, setTopic] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [isGeneratingSubImages, setIsGeneratingSubImages] = useState<Record<number, boolean>>({});
  const [regenerationFeedback, setRegenerationFeedback] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Assume success per guidelines
    }
  };


  // --- Main Tab State ---
  type MainTab = 'generator' | 'shortcuts';
  const [mainTab, setMainTab] = useState<MainTab>('generator');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // --- Topic Suggestion State ---
  type TopicSuggestionTab = 'eeat' | 'category' | 'evergreen' | 'longtail' | 'memo';
  const [activeSuggestionTab, setActiveSuggestionTab] = useState<TopicSuggestionTab>('category');
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [isSuggestingTopics, setIsSuggestingTopics] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  // E-E-A-T Tab State
  const EEAT_CATEGORIES = Object.keys(EEAT_CATEGORIES_DATA);
  const [selectedEeatCategory, setSelectedEeatCategory] = useState<string>(EEAT_CATEGORIES[0]);
  const [selectedEeatSubCategory, setSelectedEeatSubCategory] = useState<string>(EEAT_CATEGORIES_DATA[EEAT_CATEGORIES[0]][0]);

  // Category Tab State
  const GENERAL_CATEGORIES = [
    "재정/투자 (부동산, 주식, 연금, 세금, 대출 등)",
    "IT/기술 (프로그래밍, 앱 사용법, 소프트웨어, 디지털기기 등)",
    "생활/라이프스타일 (인테리어, 요리, 미니멀라이프, 반려동물 등)",
    "건강/자기계발 (운동, 독서, 습관, 정신건강 등)",
    "교육/학습 (외국어, 자격증, 온라인강의, 공부법 등)",
    "쇼핑/소비 (온라인쇼핑, 중고거래, 할인혜택, 가성비제품 등)",
    "자동차/교통 (자동차보험, 중고차, 대중교통, 주차 등)",
    "취업/직장 (이직, 연차, 퇴사, 직장생활, 4대보험 등)",
    "인생/운명/운세 (사주명리, 자미두수, 관상, 점성술 등)",
    "기타(사용자입력)"
  ];
  const [selectedGenCategory, setSelectedGenCategory] = useState<string>(GENERAL_CATEGORIES[0]);
  const [customGenCategory, setCustomGenCategory] = useState<string>('');
  
  // Evergreen Tab State
  const EVERGREEN_CATEGORIES = [
    "사례 연구(Case Study)",
    "백서(White Paper)",
    "통계 및 데이터 정리",
    "제품 리뷰 (업데이트 가능)",
    "역사적 배경 설명",
    "How-to 가이드",
    "초보자 가이드",
    "리스트 콘텐츠 (Top 10, 체크리스트 등)",
    "체크리스트",
    "용어집(Glossary) & 정의",
    "베스트 프랙티스 (Best Practices)",
    "실패 사례 공유",
    "성공 사례 공유",
    "스토리텔링 기반 글",
    "FAQ(자주 묻는 질문) 정리",
    "튜토리얼 (단계별 안내)",
    "리소스 모음/큐레이션 (추천 툴·사이트 모음)",
    "비교 콘텐츠 (제품·서비스 비교)",
    "전문가 인터뷰",
    "종합 가이드(Ultimate Guide)",
    "문제 해결형 글 (솔루션 제시)",
    "핵심 팁 모음 (Tips & Tricks)",
    "오해와 진실(신화 깨기, Myth Busting)",
    "업계/분야 베스트 사례 아카이브"
  ];
  const [selectedEvergreenCategory, setSelectedEvergreenCategory] = useState<string>(EVERGREEN_CATEGORIES[0]);
  const [selectedEvergreenSubCategory, setSelectedEvergreenSubCategory] = useState<string>(EVERGREEN_SUBCATEGORIES[0]);

  // Long-tail Tab State
  const LONGTAIL_CATEGORIES = [
    "계절/이벤트",
    "건강/피트니스",
    "재테크/금융",
    "IT/기술/소프트웨어",
    "부동산/인테리어",
    "교육/학습/자기계발",
    "취업/커리어",
    "쇼핑/제품 리뷰",
    "여행 (국내/해외)",
    "자동차 (구매/관리)",
    "법률/세금",
    "인생/운명/운세 (사주명리, 자미두수, 관상, 점성술 등)",
  ];
  const [selectedLongtailCategory, setSelectedLongtailCategory] = useState<string>(LONGTAIL_CATEGORIES[0]);
  
  // Memo Tab State
  const [memoContent, setMemoContent] = useState<string>('');
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  const [additionalRequest, setAdditionalRequest] = useState<string>('');

  // --- Generation Options State ---
  const [shouldGenerateImage, setShouldGenerateImage] = useState<boolean>(true);
  const [shouldGenerateSubImages, setShouldGenerateSubImages] = useState<boolean>(true);
  const [shouldIncludeInteractiveElement, setShouldIncludeInteractiveElement] = useState<boolean>(false);
  const [interactiveElementIdea, setInteractiveElementIdea] = useState<string | null>(null);
  const [isSuggestingInteractiveElement, setIsSuggestingInteractiveElement] = useState<boolean>(false);
  
  // --- Thumbnail Generation State ---
  const [shouldAddThumbnailText, setShouldAddThumbnailText] = useState<boolean>(false);
  const [thumbnailText, setThumbnailText] = useState<string>('');
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState<boolean>(false);
  const [thumbnailAspectRatio, setThumbnailAspectRatio] = useState<'16:9' | '1:1'>('16:9');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (ALLOWED_EMAILS.includes(currentUser.email || '')) {
          setUser(currentUser);
          setAuthError(null);
        } else {
          signOut(auth);
          setAuthError('접속 권한이 없는 계정입니다.');
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
      setAuthError('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('main');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const fetchSavedPosts = useCallback(async () => {
    if (!user) return;
    setIsFetchingHistory(true);
    try {
      const q = query(
        collection(db, 'blogPosts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedPosts(posts);
    } catch (error) {
      console.error("Fetch history error:", error);
    } finally {
      setIsFetchingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    if (view === 'history' && user) {
      fetchSavedPosts();
    }
  }, [view, user, fetchSavedPosts]);

  const handleSavePost = async () => {
    if (!user || !generatedContent) return;
    setIsSaving(true);
    try {
      const postData = {
        userId: user.uid,
        userEmail: user.email,
        topic: topic,
        title: generatedContent.title,
        blogPostHtml: generatedContent.blogPostHtml,
        keywords: generatedContent.supplementaryInfo.keywords,
        seoTitles: generatedContent.supplementaryInfo.seoTitles,
        imagePrompt: generatedContent.supplementaryInfo.imagePrompt,
        altText: generatedContent.supplementaryInfo.altText,
        imageBase64: generatedContent.imageBase64,
        thumbnailDataUrl: thumbnailDataUrl,
        createdAt: Timestamp.now()
      };
      await addDoc(collection(db, 'blogPosts'), postData);
      alert('포스트가 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error("Save post error:", error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'blogPosts', postId));
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error("Delete post error:", error);
    }
  };

  const handleSelectPostFromHistory = (post: any) => {
    setGeneratedContent({
      title: post.title,
      blogPostHtml: post.blogPostHtml,
      supplementaryInfo: {
        keywords: post.keywords || [],
        imagePrompt: post.imagePrompt || '',
        altText: post.altText || '',
        seoTitles: post.seoTitles || [],
        subImagePrompts: []
      },
      imageBase64: post.imageBase64 || null,
      subImages: null
    });
    setTopic(post.topic);
    setThumbnailDataUrl(post.thumbnailDataUrl || null);
    setView('main');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [thumbnailFont, setThumbnailFont] = useState<string>('Pretendard');
  const [thumbnailColor, setThumbnailColor] = useState<string>('#FFFFFF');
  const [thumbnailFontSize, setThumbnailFontSize] = useState<number>(100);
  const [thumbnailOutlineWidth, setThumbnailOutlineWidth] = useState<number>(8);

  useEffect(() => {
    // Reset subcategory when main E-E-A-T category changes
    setSelectedEeatSubCategory(EEAT_CATEGORIES_DATA[selectedEeatCategory][0]);
  }, [selectedEeatCategory]);

  useEffect(() => {
    if (generatedContent?.supplementaryInfo?.seoTitles?.length) {
      setThumbnailText(generatedContent.supplementaryInfo.seoTitles[0]);
    } else {
      setThumbnailText('');
    }
    setThumbnailDataUrl(null);
  }, [generatedContent]);

  useEffect(() => {
    if (!shouldGenerateImage) {
        setShouldAddThumbnailText(false);
    }
  }, [shouldGenerateImage]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsHelpModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  const handleSuggestionTabChange = (tab: TopicSuggestionTab) => {
    setActiveSuggestionTab(tab);
    setSuggestedTopics([]);
    setSuggestionError(null);
  }
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      let combinedText = '';
      const names: string[] = [];
      let totalSize = 0;

      // FIX: Replaced for...of with a standard for loop to iterate over the FileList and prevent potential type errors.
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file) {
            totalSize += file.size;
        }
      }

      if (totalSize > 5 * 1024 * 1024) { // 5MB total limit
        setSuggestionError("총 파일 크기는 5MB를 초과할 수 없습니다.");
        return;
      }

      try {
        // FIX: Replaced for...of with a standard for loop to iterate over the FileList and prevent potential type errors.
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file) {
                names.push(file.name);
                const text = await file.text();
                combinedText += `\n\n--- START OF FILE: ${file.name} ---\n\n${text}\n\n--- END OF FILE: ${file.name} ---\n\n`;
            }
        }
        setMemoContent(combinedText.trim());
        setUploadedFileNames(names);
        setSuggestionError(null);
      } catch (err) {
        setSuggestionError("파일을 읽는 중 오류가 발생했습니다.");
      }
    }
  };

  const handleSuggestTopics = useCallback(async (generator: (currentDate: string) => Promise<string[]>) => {
    setIsSuggestingTopics(true);
    setSuggestionError(null);
    setSuggestedTopics([]);
    try {
      const currentDate = new Date();
      const formattedDate = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
      }).format(currentDate);
      const topics = await generator(formattedDate);
      setSuggestedTopics(topics);
    } catch (err) {
      console.error("Topic suggestion error:", err);
      if (err instanceof Error) {
        if (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED')) {
          setSuggestionError('API 할당량이 초과되었습니다. 개인 API 키를 설정하여 계속 이용하실 수 있습니다.');
          setHasApiKey(false);
        } else if (err.message.includes('403') || err.message.includes('PERMISSION_DENIED')) {
          setSuggestionError('API 키 권한이 없거나 모델 접근이 제한되었습니다. API 키 설정을 확인해 주세요.');
          setHasApiKey(false);
        } else if (err.message.includes('Requested entity was not found')) {
          setSuggestionError('API 키 설정에 문제가 있습니다. 다시 설정해 주세요.');
          setHasApiKey(false);
        } else {
          setSuggestionError(err.message);
        }
      } else {
        setSuggestionError('주제 추천 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsSuggestingTopics(false);
    }
  }, []);

  const handleTopicSelect = (selectedTopic: string) => {
    setTopic(selectedTopic);
    window.scrollTo({
        top: document.getElementById('generation-section')?.offsetTop || 0,
        behavior: 'smooth'
    });
  };

  useEffect(() => {
    setInteractiveElementIdea(null);
    if (shouldIncludeInteractiveElement && topic.trim()) {
      setIsSuggestingInteractiveElement(true);
      const handler = setTimeout(async () => {
        try {
          const idea = await suggestInteractiveElementForTopic(topic);
          setInteractiveElementIdea(idea);
        } catch (e) {
          console.error("Failed to suggest interactive element", e);
          setInteractiveElementIdea("오류: 인터랙티브 요소 아이디어를 가져오지 못했습니다.");
        } finally {
          setIsSuggestingInteractiveElement(false);
        }
      }, 800); // Debounce API call

      return () => {
        clearTimeout(handler);
        setIsSuggestingInteractiveElement(false);
      };
    }
  }, [shouldIncludeInteractiveElement, topic]);


  const handleGenerate = useCallback(async () => {
    if (!topic) {
      setError('블로그 주제를 입력해주세요.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setGeneratedContent(null);

    try {
      const finalInteractiveElementIdea = shouldIncludeInteractiveElement ? interactiveElementIdea : null;
      const finalRawContent = activeSuggestionTab === 'memo' ? memoContent : null;
      
      const currentDate = new Date();
      const formattedDate = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
      }).format(currentDate);

      const whiteTheme: ColorTheme = {
        name: '화이트',
        description: '깔끔하고 세련된 화이트 테마',
        colors: {
          primary: '#4f46e5',
          primaryDark: '#4338ca',
          secondary: '#64748b',
          background: '#ffffff',
          text: '#1e293b',
          highlightBg: '#f1f5f9',
          infoBoxBg: '#eff6ff',
          infoBoxBorder: '#3b82f6',
          warningBoxBg: '#fffbeb',
          warningBoxBorder: '#f59e0b',
          tableHeaderBg: '#f8fafc',
          tableBorder: '#e2e8f0',
          tableEvenRowBg: '#f8fafc',
        }
      };

      const content = await generateBlogPost(topic, whiteTheme, shouldGenerateImage, shouldGenerateSubImages, finalInteractiveElementIdea, finalRawContent, additionalRequest, thumbnailAspectRatio, formattedDate);
      setGeneratedContent(content);
    } catch (err) {
      console.error("Generation error:", err);
      if (err instanceof Error) {
        if (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED')) {
          setError('API 할당량이 초과되었습니다. 개인 API 키를 설정하여 계속 이용하실 수 있습니다.');
          setHasApiKey(false);
        } else if (err.message.includes('403') || err.message.includes('PERMISSION_DENIED')) {
          setError('API 키 권한이 없거나 모델 접근이 제한되었습니다. API 키 설정을 확인해 주세요.');
          setHasApiKey(false);
        } else if (err.message.includes('Requested entity was not found')) {
          setError('API 키 설정에 문제가 있습니다. 다시 설정해 주세요.');
          setHasApiKey(false);
        } else {
          setError(err.message);
        }
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [topic, shouldGenerateImage, shouldGenerateSubImages, interactiveElementIdea, shouldIncludeInteractiveElement, activeSuggestionTab, memoContent, additionalRequest, thumbnailAspectRatio]);

  const handleGenerateImage = async () => {
    if (!generatedContent?.supplementaryInfo.imagePrompt) return;

    setIsGeneratingImage(true);
    setError(null);
    try {
        const newImageBase64 = await generateImage(generatedContent.supplementaryInfo.imagePrompt, thumbnailAspectRatio);
        if (newImageBase64) {
            setGeneratedContent(prev => {
                if (!prev) return null;
                return { ...prev, imageBase64: newImageBase64 };
            });
        } else {
             setError("이미지를 생성하지 못했습니다.");
        }
    } catch (err) {
        console.error("Image generation error:", err);
        if (err instanceof Error) {
            if (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED')) {
                setError('API 할당량이 초과되었습니다. 개인 API 키를 설정하여 계속 이용하실 수 있습니다.');
                setHasApiKey(false);
            } else if (err.message.includes('403') || err.message.includes('PERMISSION_DENIED')) {
                setError('API 키 권한이 없거나 모델 접근이 제한되었습니다. API 키 설정을 확인해 주세요.');
                setHasApiKey(false);
            } else if (err.message.includes('Requested entity was not found')) {
                setError('API 키 설정에 문제가 있습니다. 다시 설정해 주세요.');
                setHasApiKey(false);
            } else {
                setError(err.message);
            }
        } else {
            setError('이미지 생성 중 알 수 없는 오류가 발생했습니다.');
        }
    } finally {
        setIsGeneratingImage(false);
    }
  };
  
  const handleGenerateSubImage = async (index: number) => {
    if (!generatedContent?.subImages?.[index]?.prompt) return;

    setIsGeneratingSubImages(prev => ({ ...prev, [index]: true }));
    setError(null);
    try {
        const prompt = generatedContent.subImages[index].prompt;
        const newImageBase64 = await generateImage(prompt, '16:9');
        if (newImageBase64) {
            setGeneratedContent(prev => {
                if (!prev || !prev.subImages) return prev;
                const newSubImages = [...prev.subImages];
                newSubImages[index] = { ...newSubImages[index], base64: newImageBase64 };
                return { ...prev, subImages: newSubImages };
            });
        } else {
            setError(`서브 이미지 #${index + 1}을(를) 생성하지 못했습니다.`);
        }
    } catch (err) {
        console.error("Sub-image generation error:", err);
        if (err instanceof Error) {
            if (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED')) {
                setError('API 할당량이 초과되었습니다. 개인 API 키를 설정하여 계속 이용하실 수 있습니다.');
                setHasApiKey(false);
            } else if (err.message.includes('403') || err.message.includes('PERMISSION_DENIED')) {
                setError('API 키 권한이 없거나 모델 접근이 제한되었습니다. API 키 설정을 확인해 주세요.');
                setHasApiKey(false);
            } else if (err.message.includes('Requested entity was not found')) {
                setError('API 키 설정에 문제가 있습니다. 다시 설정해 주세요.');
                setHasApiKey(false);
            } else {
                setError(err.message);
            }
        } else {
            setError('서브 이미지 생성 중 알 수 없는 오류가 발생했습니다.');
        }
    } finally {
        setIsGeneratingSubImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleRegenerate = useCallback(async () => {
    if (!regenerationFeedback.trim() || !generatedContent) {
      setError('피드백을 입력해주세요.');
      return;
    }
    setError(null);
    setIsRegenerating(true);

    try {
      const currentDate = new Date();
      const formattedDate = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
      }).format(currentDate);
      
      const whiteTheme: ColorTheme = {
        name: '화이트',
        description: '깔끔하고 세련된 화이트 테마',
        colors: {
          primary: '#4f46e5',
          primaryDark: '#4338ca',
          secondary: '#64748b',
          background: '#ffffff',
          text: '#1e293b',
          highlightBg: '#f1f5f9',
          infoBoxBg: '#eff6ff',
          infoBoxBorder: '#3b82f6',
          warningBoxBg: '#fffbeb',
          warningBoxBorder: '#f59e0b',
          tableHeaderBg: '#f8fafc',
          tableBorder: '#e2e8f0',
          tableEvenRowBg: '#f8fafc',
        }
      };
      
      const newHtml = await regenerateBlogPostHtml(generatedContent.blogPostHtml, regenerationFeedback, whiteTheme, formattedDate);
      setGeneratedContent(prev => {
        if (!prev) return null;
        return { ...prev, blogPostHtml: newHtml };
      });
      setRegenerationFeedback('');
      document.getElementById('generation-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error("Regeneration error:", err);
      if (err instanceof Error) {
        if (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED')) {
          setError('API 할당량이 초과되었습니다. 개인 API 키를 설정하여 계속 이용하실 수 있습니다.');
          setHasApiKey(false);
        } else if (err.message.includes('403') || err.message.includes('PERMISSION_DENIED')) {
          setError('API 키 권한이 없거나 모델 접근이 제한되었습니다. API 키 설정을 확인해 주세요.');
          setHasApiKey(false);
        } else if (err.message.includes('Requested entity was not found')) {
          setError('API 키 설정에 문제가 있습니다. 다시 설정해 주세요.');
          setHasApiKey(false);
        } else {
          setError(err.message);
        }
      } else {
        setError('기사 재작성 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsRegenerating(false);
    }
  }, [generatedContent, regenerationFeedback]);

  const createThumbnail = (
      baseImageSrc: string, 
      text: string, 
      aspectRatio: '16:9' | '1:1',
      font: string,
      color: string,
      size: number,
      outlineWidth: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return reject(new Error('Could not get canvas context'));
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const targetWidth = 1200;
            const targetAspectRatioValue = aspectRatio === '16:9' ? 16 / 9 : 1;
            const targetHeight = Math.round(targetWidth / targetAspectRatioValue);

            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // Center-crop logic
            const sourceAspectRatio = img.width / img.height;
            let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

            if (sourceAspectRatio > targetAspectRatioValue) {
                sWidth = img.height * targetAspectRatioValue;
                sx = (img.width - sWidth) / 2;
            } else if (sourceAspectRatio < targetAspectRatioValue) {
                sHeight = img.width / targetAspectRatioValue;
                sy = (img.height - sHeight) / 2;
            }

            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const padding = Math.floor(targetWidth * 0.1);
            const maxWidth = targetWidth - padding;
            const maxHeight = targetHeight - padding;

            const getWrappedLines = (context: CanvasRenderingContext2D, textToWrap: string, maxWidth: number): string[] => {
                const words = textToWrap.trim().split(/\s+/).filter(w => w.length > 0);
                if (words.length === 0) return [];
                let line = '';
                const lines: string[] = [];
                
                if (words.length === 1 && context.measureText(words[0]).width > maxWidth) {
                    return [words[0]];
                }

                for (const word of words) {
                    const testLine = line ? `${line} ${word}` : word;
                    if (context.measureText(testLine).width > maxWidth && line) {
                        lines.push(line);
                        line = word;
                    } else {
                        line = testLine;
                    }
                }
                if (line) lines.push(line);
                
                // Balance the last line if it's too short
                if (lines.length > 1) {
                    const lastLine = lines[lines.length - 1];
                    const secondLastLine = lines[lines.length - 2];
                    const lastLineWords = lastLine.split(' ');
                    if (lastLineWords.length <= 2) {
                        const secondLastLineWords = secondLastLine.split(' ');
                        if (secondLastLineWords.length > 1) {
                            const wordToMove = secondLastLineWords.pop();
                            lines[lines.length - 2] = secondLastLineWords.join(' ');
                            lines[lines.length - 1] = `${wordToMove} ${lastLine}`;
                        }
                    }
                }
                
                return lines;
            };

            const textForWrapping = text.replace(/\s*\/\s*/g, '\n');
            let fontSize = size;
            let lines: string[] = [];
            let lineHeight = 0;

            while (fontSize > 20) {
                ctx.font = `700 ${fontSize}px '${font}', sans-serif`;
                lineHeight = fontSize * 1.2;
                
                const paragraphs = textForWrapping.split('\n');
                const tempLines: string[] = [];
                paragraphs.forEach(p => {
                    tempLines.push(...getWrappedLines(ctx, p, maxWidth));
                });
                lines = tempLines;
                
                const totalTextHeight = lines.length * lineHeight;
                const isAnyWordTooWide = textForWrapping.replace('\n', ' ').split(/\s+/).some(word => ctx.measureText(word).width > maxWidth);

                if (totalTextHeight <= maxHeight && !isAnyWordTooWide) {
                    break;
                }
                fontSize -= 4;
            }

            const totalTextHeight = lines.length * lineHeight;
            let currentY = (targetHeight - totalTextHeight) / 2 + lineHeight / 2;

            // Set styles for text outline to ensure readability on any background
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.lineWidth = outlineWidth;
            ctx.lineJoin = 'round';

            for (const line of lines) {
                if (outlineWidth > 0) {
                    // Draw outline first
                    ctx.strokeText(line, targetWidth / 2, currentY);
                }
                // Draw white text on top
                ctx.fillStyle = color;
                ctx.fillText(line, targetWidth / 2, currentY);
                currentY += lineHeight;
            }
            
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = () => reject(new Error('Failed to load image for thumbnail.'));
        img.src = baseImageSrc;
    });
  };

  const handleGenerateThumbnail = async () => {
      if (!generatedContent?.imageBase64 || !thumbnailText) return;
      setIsGeneratingThumbnail(true);
      setError(null);
      try {
          const imageSrc = `data:image/jpeg;base64,${generatedContent.imageBase64}`;
          const dataUrl = await createThumbnail(imageSrc, thumbnailText, thumbnailAspectRatio, thumbnailFont, thumbnailColor, thumbnailFontSize, thumbnailOutlineWidth);
          setThumbnailDataUrl(dataUrl);
      } catch (err) {
          const message = err instanceof Error ? err.message : '썸네일 생성 중 알 수 없는 오류가 발생했습니다.';
          setError(message);
      } finally {
          setIsGeneratingThumbnail(false);
      }
  };
  
  const mainTabButtonStyle = (tabName: MainTab) => 
    `px-8 py-4 text-base font-bold transition-all duration-300 rounded-t-2xl focus:outline-none ${
      mainTab === tabName
      ? 'bg-white text-indigo-600 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)]'
      : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
    }`;
  
  const suggestionTabButtonStyle = (tabName: TopicSuggestionTab) => 
    `px-5 py-3 text-sm font-bold border-b-2 transition-all duration-200 focus:outline-none ${
      activeSuggestionTab === tabName
      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
      : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
    }`;
  
  const SuggestionButton: React.FC<{ onClick: () => void, disabled: boolean, text: string }> = ({ onClick, disabled, text }) => (
     <button
        onClick={onClick}
        disabled={disabled}
        className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-100 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center"
      >
        {disabled ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        ) : text}
      </button>
  );

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} isLoading={!isAuthReady} error={authError} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-korean">
      <Header 
        onOpenHelp={() => setIsHelpModalOpen(true)} 
        user={user} 
        onLogout={handleLogout}
        onViewHistory={() => setView('history')}
        onViewMain={() => setView('main')}
        view={view}
      />
      
      <div className="max-w-7xl mx-auto pb-20">
        {!hasApiKey && (
          <div className="bg-amber-50 border-b border-amber-100 p-4 text-center">
            <p className="text-amber-800 text-sm mb-3 font-medium">
              현재 API 할당량이 부족할 수 있습니다. 원활한 이용을 위해 개인 API 키를 설정해 주세요.
            </p>
            <button
              onClick={handleOpenKeySelector}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-full text-sm font-bold transition-all shadow-md shadow-amber-100"
            >
              API 키 설정하기
            </button>
            <p className="text-xs text-amber-600/70 mt-2">
              * 유료 프로젝트의 API 키를 선택해야 하며, <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">결제 설정</a>이 필요할 수 있습니다.
            </p>
          </div>
        )}

        {view === 'history' ? (
          <HistoryPage 
            posts={savedPosts} 
            onDelete={handleDeletePost} 
            onSelect={handleSelectPostFromHistory}
            isLoading={isFetchingHistory}
          />
        ) : (
          <main className="px-4 sm:px-6 lg:px-8">
          <CurrentStatus />
          
          {/* --- Main Tab Navigation --- */}
          <div className="flex justify-start items-end border-b border-gray-200 mb-0">
            <div className="flex space-x-1">
                <button onClick={() => setMainTab('generator')} className={mainTabButtonStyle('generator')}>
                주제 아이디어 얻기
                </button>
                <button onClick={() => setMainTab('shortcuts')} className={mainTabButtonStyle('shortcuts')}>
                트렌드 바로가기
                </button>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-b-2xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border-x border-b border-gray-100 mb-10">
            {mainTab === 'generator' && (
              <div>
                {/* --- Topic Suggestion Section --- */}
                <div>
                  {/* Tab Navigation */}
                  <div className="border-b border-gray-100 mb-6">
                      <nav className="-mb-px flex flex-wrap gap-2" aria-label="Tabs">
                          <button onClick={() => handleSuggestionTabChange('category')} className={suggestionTabButtonStyle('category')}>카테고리별</button>
                          <button onClick={() => handleSuggestionTabChange('eeat')} className={suggestionTabButtonStyle('eeat')}>E-E-A-T 기반</button>
                          <button onClick={() => handleSuggestionTabChange('evergreen')} className={suggestionTabButtonStyle('evergreen')}>에버그린 콘텐츠</button>
                          <button onClick={() => handleSuggestionTabChange('longtail')} className={suggestionTabButtonStyle('longtail')}>롱테일 키워드 주제</button>
                          <button onClick={() => handleSuggestionTabChange('memo')} className={suggestionTabButtonStyle('memo')}>메모/파일 기반</button>
                      </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="pt-2">
                    {activeSuggestionTab === 'eeat' && (
                      <div className="space-y-6">
                        <p className="text-gray-500 text-sm leading-relaxed">구글 SEO의 핵심인 E-E-A-T(경험, 전문성, 권위성, 신뢰성) 원칙을 만족시키는 주제를 추천받으세요. 사용자의 실제 경험과 전문 지식을 효과적으로 보여주어 블로그의 신뢰도를 높이고 검색 순위 상승을 목표로 합니다.</p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="eeat-category" className="block text-sm font-bold text-gray-700 mb-2">콘텐츠 유형 선택</label>
                                <select id="eeat-category" value={selectedEeatCategory} onChange={(e) => setSelectedEeatCategory(e.target.value)}
                                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                                  {EEAT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="eeat-subcategory" className="block text-sm font-bold text-gray-700 mb-2">세부 분야 선택</label>
                                <select id="eeat-subcategory" value={selectedEeatSubCategory} onChange={(e) => setSelectedEeatSubCategory(e.target.value)}
                                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                                  {EEAT_CATEGORIES_DATA[selectedEeatCategory].map(subcat => <option key={subcat} value={subcat}>{subcat}</option>)}
                                </select>
                            </div>
                        </div>
                        <SuggestionButton
                               onClick={() => handleSuggestTopics((currentDate) => generateEeatTopicSuggestions(selectedEeatCategory, selectedEeatSubCategory, currentDate))}
                               disabled={isSuggestingTopics}
                               text="E-E-A-T 주제 추천받기"
                           />
                      </div>
                    )}
                    {activeSuggestionTab === 'category' && (
                      <div className="space-y-6">
                        <p className="text-gray-500 text-sm leading-relaxed">선택한 카테고리 내에서 독자의 흥미를 끌고 소셜 미디어 공유를 유도할 만한 최신 트렌드 및 인기 주제를 추천받으세요. 광범위한 독자층을 대상으로 하는 매력적인 콘텐츠 아이디어를 얻을 수 있습니다.</p>
                        <div>
                          <label htmlFor="gen-category" className="block text-sm font-bold text-gray-700 mb-2">카테고리 선택</label>
                          <select id="gen-category" value={selectedGenCategory} onChange={(e) => setSelectedGenCategory(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                            {GENERAL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>
                        {selectedGenCategory === '기타(사용자입력)' && (
                          <div>
                            <label htmlFor="custom-gen-category" className="block text-sm font-bold text-gray-700 mb-2">사용자 입력</label>
                            <input type="text" id="custom-gen-category" value={customGenCategory} onChange={(e) => setCustomGenCategory(e.target.value)} placeholder="관심 카테고리를 입력하세요" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
                          </div>
                        )}
                        <SuggestionButton 
                          onClick={() => handleSuggestTopics((currentDate) => generateCategoryTopicSuggestions(selectedGenCategory === '기타(사용자입력)' ? customGenCategory : selectedGenCategory, currentDate))}
                          disabled={isSuggestingTopics || (selectedGenCategory === '기타(사용자입력)' && !customGenCategory.trim())}
                          text="카테고리별 주제 추천받기"
                        />
                      </div>
                    )}

                    {activeSuggestionTab === 'evergreen' && (
                      <div className="space-y-6">
                        <p className="text-gray-500 text-sm leading-relaxed">시간이 흘러도 가치가 변하지 않아 꾸준한 검색 트래픽을 유도할 수 있는 '에버그린' 주제를 추천받으세요. 'How-to 가이드', '궁극의 가이드' 등 한번 작성해두면 장기적으로 블로그의 자산이 되는 콘텐츠 아이디어를 얻을 수 있습니다.</p>
                         <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="evergreen-category" className="block text-sm font-bold text-gray-700 mb-2">콘텐츠 형식 선택</label>
                                <select id="evergreen-category" value={selectedEvergreenCategory} onChange={(e) => setSelectedEvergreenCategory(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                                    {EVERGREEN_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="evergreen-subcategory" className="block text-sm font-bold text-gray-700 mb-2">주제 분야 선택</label>
                                <select id="evergreen-subcategory" value={selectedEvergreenSubCategory} onChange={(e) => setSelectedEvergreenSubCategory(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                                    {EVERGREEN_SUBCATEGORIES.map(subcat => <option key={subcat} value={subcat}>{subcat}</option>)}
                                </select>
                            </div>
                        </div>
                        <SuggestionButton 
                          onClick={() => handleSuggestTopics((currentDate) => generateEvergreenTopicSuggestions(selectedEvergreenCategory, selectedEvergreenSubCategory, currentDate))}
                          disabled={isSuggestingTopics}
                          text="에버그린 주제 추천받기"
                        />
                      </div>
                    )}

                    {activeSuggestionTab === 'longtail' && (
                      <div className="space-y-6">
                          <p className="text-gray-500 text-sm leading-relaxed">실시간 구글 검색을 활용하여, 검색량은 적지만 명확한 목적을 가진 사용자를 타겟으로 하는 '롱테일 키워드' 주제를 추천받으세요. 경쟁이 낮아 상위 노출에 유리하며, 구매나 특정 행동으로 이어질 확률이 높은 잠재고객을 유치하는 데 효과적입니다.</p>
                          <div>
                              <label htmlFor="longtail-category" className="block text-sm font-bold text-gray-700 mb-2">콘텐츠 유형 선택</label>
                              <select id="longtail-category" value={selectedLongtailCategory} onChange={(e) => setSelectedLongtailCategory(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                                  {LONGTAIL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                          </div>
                          <SuggestionButton 
                              onClick={() => handleSuggestTopics((currentDate) => generateLongtailTopicSuggestions(selectedLongtailCategory, currentDate))}
                              disabled={isSuggestingTopics}
                              text="롱테일 주제 추천받기"
                          />
                      </div>
                    )}

                    {activeSuggestionTab === 'memo' && (
                      <div className="space-y-6">
                        <p className="text-gray-500 text-sm leading-relaxed">아이디어 메모, 초안, 강의 노트, 관련 자료 파일 등을 기반으로 블로그 주제를 추천받으세요. AI가 핵심 내용을 분석하여 가장 매력적이고 발전 가능성이 높은 포스트 제목을 제안해 드립니다.</p>
                        <div>
                          <label htmlFor="memo-content" className="block text-sm font-bold text-gray-700 mb-2">메모/초안 입력</label>
                          <textarea id="memo-content" value={memoContent} onChange={(e) => setMemoContent(e.target.value)} rows={6} placeholder="여기에 아이디어를 자유롭게 작성하거나 아래 버튼을 통해 파일을 업로드하세요." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"></textarea>
                        </div>
                        <div className="flex items-center space-x-3">
                            <label htmlFor="file-upload" className="cursor-pointer bg-gray-100 text-gray-700 font-bold py-2.5 px-5 rounded-xl hover:bg-gray-200 transition-all duration-200 inline-flex items-center border border-gray-200">
                                <span className="mr-2">📤</span>
                                <span>파일 업로드 (.txt, .md 등)</span>
                            </label>
                            <input id="file-upload" type="file" multiple accept=".txt,.md,.html,.js,.jsx,.ts,.tsx,.json,.css" className="hidden" onChange={handleFileChange} />
                            {uploadedFileNames.length > 0 && (
                                <span className="text-sm text-gray-500 truncate font-medium">{uploadedFileNames.join(', ')}</span>
                            )}
                        </div>
                        <SuggestionButton 
                          onClick={() => handleSuggestTopics((currentDate) => generateTopicsFromMemo(memoContent, currentDate))}
                          disabled={isSuggestingTopics || !memoContent.trim()}
                          text="메모 기반 주제 추천받기"
                        />
                      </div>
                    )}
                  </div>

                  {/* Topic Suggestion Results */}
                  {suggestionError && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">{suggestionError}</div>
                  )}
                  {suggestedTopics.length > 0 && (
                    <div className="mt-8 p-6 bg-indigo-50/30 border border-indigo-100 rounded-2xl">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <span className="mr-2">🎯</span> 추천 주제 목록
                        </h4>
                        <ul className="grid gap-3">
                            {suggestedTopics.map((sTopic, index) => (
                                <li key={index} 
                                    onClick={() => handleTopicSelect(sTopic)}
                                    className="p-4 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100 transition-all duration-200 text-sm text-gray-700 font-medium flex items-center group">
                                    <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs mr-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">{index + 1}</span>
                                    {sTopic}
                                </li>
                            ))}
                        </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {mainTab === 'shortcuts' && (
                <Shortcuts />
            )}
          </div>
          
          {/* --- Main Generation Section --- */}
          <div id="generation-section" className="bg-white p-8 rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] border border-gray-100 mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
              <span role="img" aria-label="magic wand" className="w-8 h-8 mr-3 text-indigo-500 text-2xl">✨</span>
              포스트 생성하기
            </h3>
            <div className="grid lg:grid-cols-2 gap-10">
              <div className="space-y-6 flex flex-col">
                {/* Blog Topic Input */}
                <div>
                  <label htmlFor="blog-topic" className="block text-sm font-bold text-gray-700 mb-2">블로그 주제</label>
                  <input
                    type="text"
                    id="blog-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="예: 2024년 최고의 AI 생산성 도구 5가지"
                    className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>

                {/* Additional Request Input */}
                <div className="flex-grow flex flex-col">
                    <label htmlFor="additional-request" className="block text-sm font-bold text-gray-700 mb-2">
                        {activeSuggestionTab === 'memo' ? '메모 기반 생성 추가 요청사항' : '블로그에 반영하고 싶은 추가 요청'}
                    </label>
                    <textarea 
                        id="additional-request" 
                        value={additionalRequest} 
                        onChange={(e) => setAdditionalRequest(e.target.value)} 
                        placeholder={activeSuggestionTab === 'memo' ? "예: 초보자의 시각에서 더 쉽게 설명해주세요." : "예: 글 마지막에 행동 촉구 문구를 추가해주세요."} 
                        className="w-full flex-grow bg-white border border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm min-h-[150px]"
                    />
                </div>
              </div>

              {/* Generation Options */}
              <div className="space-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <h4 className="text-lg font-bold text-gray-800 mb-4">고급 옵션</h4>
                
                <div className="space-y-4">
                  <div className="flex items-start p-3 hover:bg-white rounded-xl transition-colors group">
                      <div className="flex items-center h-5">
                          <input id="generate-image" type="checkbox" checked={shouldGenerateImage} onChange={(e) => setShouldGenerateImage(e.target.checked)} className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded-lg cursor-pointer" />
                      </div>
                      <div className="ml-4 text-sm">
                          <label htmlFor="generate-image" className="font-bold text-gray-700 cursor-pointer">대표 이미지 자동 생성</label>
                          <p className="text-gray-500 mt-1">AI가 포스트와 어울리는 대표 이미지를 생성합니다.</p>
                      </div>
                  </div>
                  
                  <div className="flex items-start p-3 hover:bg-white rounded-xl transition-colors group">
                      <div className="flex items-center h-5">
                          <input id="generate-sub-images" type="checkbox" checked={shouldGenerateSubImages} onChange={(e) => setShouldGenerateSubImages(e.target.checked)} className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded-lg cursor-pointer" />
                      </div>
                      <div className="ml-4 text-sm">
                          <label htmlFor="generate-sub-images" className="font-bold text-gray-700 cursor-pointer">본문 서브 이미지 자동 생성</label>
                          <p className="text-gray-500 mt-1">AI가 글의 흐름에 맞춰 2~3개의 이미지를 생성하여 본문에 자동 배치합니다.</p>
                      </div>
                  </div>

                  <div className="flex items-start p-3 hover:bg-white rounded-xl transition-colors group">
                      <div className="flex items-center h-5">
                          <input id="add-thumbnail-text" type="checkbox" checked={shouldAddThumbnailText} onChange={(e) => setShouldAddThumbnailText(e.target.checked)} disabled={!shouldGenerateImage} className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded-lg cursor-pointer disabled:opacity-30" />
                      </div>
                      <div className="ml-4 text-sm">
                          <label htmlFor="add-thumbnail-text" className={`font-bold cursor-pointer ${!shouldGenerateImage ? 'text-gray-400' : 'text-gray-700'}`}>썸네일용 텍스트 추가</label>
                          <p className={`mt-1 ${!shouldGenerateImage ? 'text-gray-400' : 'text-gray-500'}`}>대표 이미지에 텍스트를 추가하여 썸네일을 생성합니다.</p>
                      </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-3">대표 이미지/썸네일 비율</label>
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={() => setThumbnailAspectRatio('16:9')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${thumbnailAspectRatio === '16:9' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
                            16:9 (와이드)
                        </button>
                        <button
                            type="button"
                            onClick={() => setThumbnailAspectRatio('1:1')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${thumbnailAspectRatio === '1:1' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
                            1:1 (정사각형)
                        </button>
                    </div>
                </div>

                {shouldAddThumbnailText && (
                    <div className="space-y-5 pt-6 border-t border-gray-100">
                      <div>
                        <label htmlFor="thumbnail-text" className="block text-sm font-bold text-gray-700 mb-2">썸네일 텍스트</label>
                        <input type="text" id="thumbnail-text" value={thumbnailText} onChange={(e) => setThumbnailText(e.target.value)} placeholder="글 생성 후 SEO 제목이 자동으로 제안됩니다." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" />
                        <p className="text-xs text-gray-400 mt-2 font-medium">/ 를 사용하여 강제로 줄바꿈할 수 있습니다.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="thumbnail-font" className="block text-sm font-bold text-gray-700 mb-2">글꼴</label>
                            <select id="thumbnail-font" value={thumbnailFont} onChange={(e) => setThumbnailFont(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 text-sm font-medium">
                              <option value="Pretendard">Pretendard (고딕)</option>
                              <option value="Gmarket Sans">Gmarket Sans (고딕)</option>
                              <option value="Noto Sans KR">Noto Sans KR (고딕)</option>
                              <option value="Cafe24Ssurround">카페24 써라운드 (장식)</option>
                              <option value="Gowun Dodum">Gowun Dodum (명조)</option>
                              <option value="Black Han Sans">Black Han Sans (두꺼운)</option>
                              <option value="Jua">Jua (손글씨)</option>
                              <option value="Nanum Pen Script">나눔 손글씨 펜 (손글씨)</option>
                            </select>
                        </div>
                        <div className="flex flex-col justify-end">
                            <label className="block text-sm font-bold text-gray-700 mb-2">글자 색상</label>
                            <div className="flex flex-wrap gap-1.5">
                                {THUMBNAIL_COLORS.slice(0, 6).map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setThumbnailColor(color)}
                                        className={`w-7 h-7 rounded-full border-2 transition-all ${thumbnailColor.toUpperCase() === color.toUpperCase() ? 'ring-2 ring-indigo-500 border-white' : 'border-transparent hover:scale-110'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label htmlFor="thumbnail-font-size" className="text-sm font-bold text-gray-700">크기</label>
                            <span className="text-xs font-bold text-indigo-600">{thumbnailFontSize}px</span>
                          </div>
                          <input type="range" id="thumbnail-font-size" min="20" max="200" value={thumbnailFontSize} onChange={(e) => setThumbnailFontSize(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label htmlFor="thumbnail-outline-width" className="text-sm font-bold text-gray-700">외곽선 굵기</label>
                            <span className="text-xs font-bold text-indigo-600">{thumbnailOutlineWidth}px</span>
                          </div>
                          <input type="range" id="thumbnail-outline-width" min="0" max="20" value={thumbnailOutlineWidth} onChange={(e) => setThumbnailOutlineWidth(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                        </div>
                      </div>

                      {generatedContent?.supplementaryInfo?.seoTitles && generatedContent.supplementaryInfo.seoTitles.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs text-gray-500 mb-3 font-bold">추천 텍스트 (클릭하여 사용):</p>
                          <div className="flex flex-wrap gap-2">
                            {generatedContent.supplementaryInfo.seoTitles.map((title, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setThumbnailText(title)}
                                className="text-[11px] bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition-all font-medium"
                              >
                                {title}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                )}

                <div className="flex items-start p-3 hover:bg-white rounded-xl transition-colors group">
                    <div className="flex items-center h-5">
                        <input id="include-interactive" type="checkbox" checked={shouldIncludeInteractiveElement} onChange={(e) => setShouldIncludeInteractiveElement(e.target.checked)} className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded-lg cursor-pointer" />
                    </div>
                    <div className="ml-4 text-sm">
                        <label htmlFor="include-interactive" className="font-bold text-gray-700 cursor-pointer">인터랙티브 요소 포함</label>
                        <p className="text-gray-500 mt-1">독자의 참여를 유도하는 계산기, 퀴즈 등을 자동으로 제안하고 포함시킵니다.</p>
                    </div>
                </div>
                
                {shouldIncludeInteractiveElement && (
                    <div className="pt-6 border-t border-gray-100">
                        <label htmlFor="interactive-idea" className="block text-sm font-bold text-gray-700 mb-2">인터랙티브 요소 아이디어</label>
                        <div className="relative">
                            <input type="text" id="interactive-idea" value={interactiveElementIdea || ''} onChange={(e) => setInteractiveElementIdea(e.target.value)} placeholder={isSuggestingInteractiveElement ? "AI가 아이디어를 제안 중..." : "자동 제안 또는 직접 입력"} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" />
                            {isSuggestingInteractiveElement && <div className="absolute inset-y-0 right-0 flex items-center pr-4"><svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></div>}
                        </div>
                    </div>
                )}
              </div>
            </div>
            <div className="mt-8">
              <button
                onClick={handleGenerate}
                disabled={isLoading || !topic}
                className="w-full bg-indigo-600 text-white font-extrabold py-4 px-8 rounded-2xl hover:bg-indigo-700 transition-all duration-300 disabled:bg-gray-300 disabled:shadow-none shadow-xl shadow-indigo-100 flex items-center justify-center text-xl"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    포스트 생성 중...
                  </>
                ) : (
                  <>
                    <span role="img" aria-label="magic wand" className="mr-3">✨</span>
                    AI 블로그 포스트 생성하기
                  </>
                )}
              </button>
            </div>
            {error && <p className="text-red-500 mt-6 text-center font-medium bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
          </div>

          <ResultDisplay
            topic={topic}
            title={generatedContent?.title || ''}
            htmlContent={generatedContent?.blogPostHtml || ''}
            isLoading={isLoading}
            supplementaryInfo={generatedContent?.supplementaryInfo || null}
            socialMediaPosts={generatedContent?.socialMediaPosts || null}
            imageBase64={generatedContent?.imageBase64 || null}
            subImages={generatedContent?.subImages || null}
            onGenerateImage={handleGenerateImage}
            isGeneratingImage={isGeneratingImage}
            onGenerateSubImage={handleGenerateSubImage}
            isGeneratingSubImages={isGeneratingSubImages}
            shouldAddThumbnailText={shouldAddThumbnailText}
            onGenerateThumbnail={handleGenerateThumbnail}
            isGeneratingThumbnail={isGeneratingThumbnail}
            thumbnailDataUrl={thumbnailDataUrl}
            thumbnailAspectRatio={thumbnailAspectRatio}
            onSave={handleSavePost}
            isSaving={isSaving}
          />

          {/* --- Regeneration Section --- */}
          {!isLoading && generatedContent && (
            <div className="mt-12 bg-white p-8 rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span role="img" aria-label="document with pencil" className="w-8 h-8 mr-3 text-emerald-500 text-2xl">📝</span>
                피드백 및 재작성
              </h3>
              <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 mb-8">
                <p className="text-emerald-800 text-sm leading-relaxed">
                  생성된 기사가 마음에 들지 않으시나요? 아래에 수정하고 싶은 부분을 구체적으로 작성하고 '기사 재작성' 버튼을 클릭하세요. <br />
                  이미지, SEO 제목, 키워드 등은 그대로 유지한 채 <strong className="text-emerald-900">기사 본문만</strong> 피드백에 맞춰 다시 생성됩니다.
                </p>
              </div>
              <div className="space-y-6">
                <div>
                  <label htmlFor="regeneration-feedback" className="block text-sm font-bold text-gray-700 mb-2">수정 요청사항</label>
                  <textarea
                    id="regeneration-feedback"
                    value={regenerationFeedback}
                    onChange={(e) => setRegenerationFeedback(e.target.value)}
                    rows={4}
                    placeholder="예: 전체적으로 좀 더 전문적인 용어를 사용해주세요. / 3번째 문단의 내용을 더 자세하게 설명해주세요."
                    className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating || !regenerationFeedback.trim()}
                  className="w-full bg-emerald-600 text-white font-extrabold py-4 px-8 rounded-2xl hover:bg-emerald-700 transition-all duration-300 disabled:bg-gray-300 disabled:shadow-none shadow-xl shadow-emerald-100 flex items-center justify-center text-xl"
                >
                  {isRegenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      재작성 중...
                    </>
                  ) : (
                    '기사 본문 재작성하기'
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      )}
      </div>
      <Footer />
      {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
    </div>
  );
}

export default App;
