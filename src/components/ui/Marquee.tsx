import React from 'react';

export const Marquee: React.FC = () => {
    return (
        <div className="relative flex overflow-hidden py-6 bg-emerald-950/50 border-y border-white/5 transform -rotate-1 my-10 backdrop-blur-sm pointer-events-none select-none">
            <style>
                {`
                @keyframes scroll-infinite {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                `}
            </style>
            <div
                className="flex min-w-full w-max"
                style={{ animation: 'scroll-infinite 10s linear infinite' }}
            >
                <div className="flex shrink-0 items-center gap-8 pl-8">
                    {[...Array(20)].map((_, i) => (
                        <span key={`a-${i}`} className="text-4xl font-black outline-text uppercase tracking-widest whitespace-nowrap">
                            Premium Cuts • Beard Trim • Styling • Hot Towel •
                        </span>
                    ))}
                </div>
                <div className="flex shrink-0 items-center gap-8 pl-8" aria-hidden="true">
                    {[...Array(20)].map((_, i) => (
                        <span key={`b-${i}`} className="text-4xl font-black outline-text uppercase tracking-widest whitespace-nowrap">
                            Premium Cuts • Beard Trim • Styling • Hot Towel •
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};
