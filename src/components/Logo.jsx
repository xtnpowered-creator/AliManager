import React from 'react';

const Logo = ({ className = "w-8 h-8" }) => {
    return (
        <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Main 'A' Structure - Left Leg (Dark Blue) */}
            <path
                d="M14 32L20 8L24 8L18 32H14Z"
                fill="#0f172a"
            />

            {/* Main 'A' Structure - Right Leg (Tapered Slate) */}
            <path
                d="M18.5 16L26 32H30L21 12L18.5 16Z"
                fill="#334155"
            />

            {/* Stylized Gear Detail */}
            <g className="animate-spin-slow">
                <circle cx="12" cy="24" r="4" stroke="#475569" strokeWidth="1.5" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <rect
                        key={angle}
                        x="11.25"
                        y="18.5"
                        width="1.5"
                        height="2.5"
                        rx="0.5"
                        fill="#475569"
                        transform={`rotate(${angle} 12 24)`}
                    />
                ))}
            </g>

            {/* Upward Growth Arrow (Teal) */}
            <path
                d="M12 28C15 26 22 24 32 12"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-pulse"
            />
            <path
                d="M27 12H32V17"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Connecting Circuit Detail */}
            <circle cx="18" cy="30" r="1.5" fill="#0f172a" />
            <circle cx="21" cy="24" r="1.5" fill="#334155" />
            <path d="M18 30L21 24" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
    );
};

export default Logo;
