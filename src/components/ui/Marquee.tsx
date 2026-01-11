import React from 'react';

export const Marquee: React.FC = () => {
    return (
        <div className="relative flex overflow-hidden py-6 bg-emerald-950/50 border-y border-white/5 transform -rotate-1 my-10 backdrop-blur-sm pointer-events-none select-none">
            <div className="marquee-content animate-scroll">
                {[...Array(20)].map((_, i) => (
                    <span key={`a-${i}`} className="text-4xl font-black outline-text uppercase tracking-widest whitespace-nowrap px-4">
                        Premium Cuts • Beard Trim • Styling • Hot Towel • Premium Cuts • Beard Trim • Styling • Hot Towel •
                    </span>
                ))}
            </div>
            <div className="marquee-content animate-scroll" aria-hidden="true">
                {[...Array(20)].map((_, i) => (
                    <span key={`b-${i}`} className="text-4xl font-black outline-text uppercase tracking-widest whitespace-nowrap px-4">
                        Premium Cuts • Beard Trim • Styling • Hot Towel • Premium Cuts • Beard Trim • Styling • Hot Towel •
                    </span>
                ))}
            </div>
        </div>
    );
};
