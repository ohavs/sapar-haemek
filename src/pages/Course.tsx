import React from 'react';
import { ArrowRight, Play, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { COURSE_VIDEOS } from '../data';

export const Course: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="px-6 pt-32 pb-32 min-h-screen animate-slide-up">
            <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
                <ArrowRight className="w-5 h-5" />
                חזרה
            </button>
            <div className="mb-10">
                <span className="text-emerald-400 text-xs font-bold tracking-[0.3em] uppercase mb-2 block">Online Academy</span>
                <h2 className="text-4xl font-black text-white leading-tight">MASTER THE<br /><span className="metallic-text">BLADE.</span></h2>
            </div>

            <div className="space-y-4">
                {COURSE_VIDEOS.map((video) => (
                    <div key={video.id} className="glass-panel rounded-2xl p-4 flex items-center gap-4 hover:border-emerald-500/30 transition-all cursor-pointer group">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${video.locked ? 'bg-gray-800 text-gray-500' : 'bg-emerald-500 text-black group-hover:scale-110 transition-transform'}`}>
                            {video.locked ? <Lock className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-bold ${video.locked ? 'text-gray-400' : 'text-white'}`}>{video.title}</h4>
                            <span className="text-xs text-gray-500">{video.duration}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-black border border-emerald-500/20 text-center">
                <p className="text-white font-bold mb-4">רוצה לפתוח את כל השיעורים?</p>
                <button className="bg-emerald-500 text-black px-6 py-3 rounded-full font-bold text-sm hover:bg-emerald-400 transition-colors w-full cursor-pointer">רכוש גישה מלאה (₪299)</button>
            </div>
        </div>
    );
};
