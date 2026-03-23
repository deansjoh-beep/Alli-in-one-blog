import React, { useState, useEffect, FC } from 'react';
import { fetchCurrentWeather } from '../services/keywordService';
import type { WeatherData } from '../types';

export const CurrentStatus: FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const weatherData = await fetchCurrentWeather();
                setWeather(weatherData);
            } catch (e) {
                console.error("Failed to fetch weather", e);
                setWeather({condition: '날씨 정보 로딩 실패', temperature: '', wind: '', humidity: ''});
            }
        };
        fetchWeather();
        const timer = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    }).format(time);

    const formattedTime = new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit', minute: '2-digit', hour12: true
    }).format(time);

    return (
        <div className="text-[11px] font-bold text-gray-400 mb-6 text-center p-3 bg-gray-50 rounded-xl border border-gray-100 uppercase tracking-widest">
           <span className="inline-flex items-center">
               <svg className="w-3 h-3 mr-1.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               {formattedDate} {formattedTime}
           </span>
           {weather && (
               <span className="ml-4 inline-flex items-center">
                   <svg className="w-3 h-3 mr-1.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
                   서울: {weather.condition}, {weather.temperature}
               </span>
           )}
        </div>
    )
}
