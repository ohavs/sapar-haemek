import React, { useRef, useEffect } from 'react';

const GALLERY_IMAGES = [
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2525&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=2080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1887&auto=format&fit=crop"
];

export const Gallery = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto scroll animation
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        let animationFrameId: number;
        let scrollAmount = 0;
        const speed = 0.5; // Slow scroll

        const animate = () => {
            if (!el) return;
            scrollAmount += speed;
            if (scrollAmount >= el.scrollWidth / 2) {
                scrollAmount = 0;
            }
            el.scrollLeft = scrollAmount;
            animationFrameId = requestAnimationFrame(animate);
        };

        // Use standard scroll interaction? Or auto-marquee?
        // User asked for "Scroll animations like the site".
        // Site has marquee.
        // Let's implement a Marquee-like gallery or just a swipeable one with fade entry.

        // Actually, simple horizontal scroll with fade in on view is better UX than auto-scroll sometimes.
        // But user liked the "animations".

        // I'll skip auto-scroll JS and use CSS animation if possible, or keyframes.
        // Reusing `Marquee` logic? 
        // Let's duplicate the content for infinite loop and use CSS.
    }, []);

    return (
        <div className="py-12 bg-black/50 overflow-hidden">
            <h3 className="text-center text-2xl font-black mb-8 text-white opacity-0 animate-on-scroll">
                הלקוחות שלנו
            </h3>

            {/* Gallery Track / Marquee */}
            <div className="relative group w-full">
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>

                <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 snap-x snap-mandatory">
                    {GALLERY_IMAGES.map((img, i) => (
                        <div key={i} className="flex-none w-64 h-80 rounded-2xl overflow-hidden relative group snap-center transform transition-transform hover:scale-105 duration-500">
                            <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                <span className="text-emerald-400 font-bold">New Style</span>
                            </div>
                        </div>
                    ))}
                    {GALLERY_IMAGES.map((img, i) => (
                        <div key={`dup-${i}`} className="flex-none w-64 h-80 rounded-2xl overflow-hidden relative group snap-center transform transition-transform hover:scale-105 duration-500">
                            <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                <span className="text-emerald-400 font-bold">New Style</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .animate-on-scroll {
                    animation: fadeUp 0.8s ease-out forwards;
                    animation-timeline: view();
                    animation-range: entry 10% cover 30%;
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
