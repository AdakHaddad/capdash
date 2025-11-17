'use client';

import { useEffect, useState } from 'react';

interface ShallotAvatarProps {
  airTemp: number;
  airHumidity: number;
  soilHumidity: number;
  soilTemp: number;
}

export default function ShallotAvatar({ airTemp, airHumidity, soilHumidity, soilTemp }: ShallotAvatarProps) {
  const [blink, setBlink] = useState(false);
  const [sweat, setSweat] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🧅 Shallot Avatar Updated:', { airTemp, airHumidity, soilHumidity, soilTemp });
  }, [airTemp, airHumidity, soilHumidity, soilTemp]);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Sweating when hot
  useEffect(() => {
    setSweat(airTemp > 32 || soilTemp > 30);
  }, [airTemp, soilTemp]);

  // Calculate health state
  const tempTooHigh = airTemp > 35;
  const tempHot = airTemp > 32;
  const tempTooCold = airTemp < 15;
  const soilDry = soilHumidity < 50;
  const soilCritical = soilHumidity < 30;
  const airDry = airHumidity < 50;
  const healthy = !tempHot && !soilDry && !airDry && !tempTooCold;

  // Determine current state for debugging
  const currentState = 
    (tempTooHigh && soilCritical) ? 'CRITICAL' :
    tempTooHigh ? 'OVERHEATED' :
    soilCritical ? 'THIRSTY' :
    (soilDry || airDry || tempHot) ? 'STRESSED' :
    airTemp < 15 ? 'COLD' :
    'HEALTHY';

  // Log state changes
  useEffect(() => {
    console.log(`🌱 Shallot State: ${currentState}`, {
      tempTooHigh,
      tempHot,
      soilDry,
      soilCritical,
      airDry,
      healthy
    });
  }, [currentState, tempTooHigh, tempHot, soilDry, soilCritical, airDry, healthy]);

  // Color changes based on health (from bawang.svg reference)
  const bulbColor = soilCritical 
    ? '#653850' // Deep purple-brown when critical
    : soilDry 
    ? '#774160' // Medium purple when dry
    : tempTooHigh
    ? '#873D68' // Rich mauve purple when hot
    : '#AF6C9E'; // Soft purple-mauve when healthy (exact from bawang.svg)

  const bulbShade = soilCritical 
    ? '#403D39' // Very dark purple-brown when critical
    : soilDry 
    ? '#653850' // Deep purple shade
    : tempTooHigh
    ? '#6B344F' // Dark mauve when hot
    : '#873D68'; // Deep purple shade (from bawang.svg)

  const leafColor = healthy 
    ? '#8BBC6D' // Fresh lime green when healthy (exact from bawang.svg)
    : tempTooCold
    ? '#60A5FA' // Soft blue tint when cold
    : tempHot || airDry
    ? '#83B963' // Pale lime green when stressed (from bawang.svg)
    : soilCritical
    ? '#96C37C' // Light green when critical (from bawang.svg)
    : '#9BCE7A'; // Mint green (from bawang.svg)

  const leafDarkColor = healthy 
    ? '#65A30D' // Olive green
    : tempTooCold
    ? '#2563EB' // Royal blue when cold
    : tempHot || airDry
    ? '#83B963' // Pale olive green
    : soilCritical
    ? '#8BBC6D' // Medium green
    : '#96C37C'; // Light olive

  // Animation states
  const isWilting = soilCritical || tempTooHigh;
  const isStressed = tempHot || soilDry || airDry;
  const isShaking = tempTooHigh && soilCritical;
  const isShivering = tempTooCold;

  // Eye states
  const eyeState = soilCritical 
    ? 'dizzy' 
    : tempTooHigh 
    ? 'worried' 
    : tempTooCold
    ? 'cold'
    : isStressed 
    ? 'sad' 
    : 'happy';

  // Mouth states
  const mouthState = soilCritical 
    ? 'shocked' 
    : tempTooHigh 
    ? 'panting' 
    : tempTooCold
    ? 'chattering'
    : isStressed 
    ? 'worried' 
    : 'smile';

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 200 240"
        className={`w-full h-full ${isShaking ? 'animate-shake' : ''} ${isShivering ? 'animate-shiver' : ''}`}
        style={{
          filter: isWilting ? 'saturate(0.6)' : tempTooCold ? 'brightness(0.85) saturate(0.8)' : 'saturate(1)',
          transition: 'filter 0.5s ease'
        }}
      >
        {/* Gradient definitions (inspired by bawang.svg) */}
        <defs>
          <radialGradient id="shallotGradient" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#F6F6F5" stopOpacity="0.6" />
            <stop offset="40%" stopColor="#AF6C9E" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#873D68" stopOpacity="0.4" />
          </radialGradient>
          
          <radialGradient id="bulbHighlight" cx="35%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#F6F6F5" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#E0E0E1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="3" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={leafColor} stopOpacity="1" />
            <stop offset="100%" stopColor={leafDarkColor} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        
        {/* Soil Base */}
        <ellipse
          cx="100"
          cy="205"
          rx="80"
          ry="20"
          fill="#6B5444"
          opacity="0.5"
        />
        <ellipse
          cx="100"
          cy="203"
          rx="72"
          ry="16"
          fill="#8B7355"
          opacity="0.7"
        />
        
        {/* Shallot Bulb - Much Chubbier! */}
        <g className={isWilting ? 'animate-droop' : ''}>
          {/* Shadow layer */}
          <ellipse
            cx="100"
            cy="180"
            rx="52"
            ry="55"
            fill="#000000"
            opacity="0.15"
            filter="blur(4px)"
          />
          
          {/* Main bulb body with gradient - CHUBBY ROUND SHAPE */}
          <ellipse
            cx="100"
            cy="175"
            rx="50"
            ry="52"
            fill={bulbColor}
            stroke={bulbShade}
            strokeWidth="3"
          />
          
          {/* Bulb texture lines - adjusted for rounder shape */}
          <path
            d="M 60 145 Q 100 148 140 145"
            stroke={bulbShade}
            strokeWidth="1.5"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M 58 165 Q 100 168 142 165"
            stroke={bulbShade}
            strokeWidth="1.5"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M 60 185 Q 100 188 140 185"
            stroke={bulbShade}
            strokeWidth="1.5"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M 65 200 Q 100 202 135 200"
            stroke={bulbShade}
            strokeWidth="1.5"
            fill="none"
            opacity="0.5"
          />
          
          {/* Root hints - adjusted for lower position */}
          <path
            d="M 90 220 Q 85 228 80 235"
            stroke="#654321"
            strokeWidth="2.5"
            fill="none"
            opacity="0.5"
            strokeLinecap="round"
          />
          <path
            d="M 100 223 Q 100 230 100 237"
            stroke="#654321"
            strokeWidth="2.5"
            fill="none"
            opacity="0.5"
            strokeLinecap="round"
          />
          <path
            d="M 110 220 Q 115 228 120 235"
            stroke="#654321"
            strokeWidth="2.5"
            fill="none"
            opacity="0.5"
            strokeLinecap="round"
          />
        </g>

        {/* Leaves */}
        <g className={isWilting ? 'animate-wilt' : 'animate-sway'}>
          {/* Left leaf */}
          <path
            d="M 100 140 Q 65 100 55 40 Q 60 30 70 35 Q 80 90 100 130"
            fill="url(#leafGradient)"
            stroke={leafDarkColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="origin-bottom"
          />
          <path
            d="M 75 70 Q 70 65 65 55"
            stroke={leafDarkColor}
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
          
          {/* Center leaf - main focal leaf */}
          <path
            d="M 100 140 Q 95 75 100 15 Q 105 10 110 15 Q 105 75 100 130"
            fill="url(#leafGradient)"
            stroke={leafDarkColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 100 80 L 100 40"
            stroke={leafDarkColor}
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
          
          {/* Right leaf */}
          <path
            d="M 100 140 Q 135 100 145 40 Q 140 30 130 35 Q 120 90 100 130"
            fill="url(#leafGradient)"
            stroke={leafDarkColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 125 70 Q 130 65 135 55"
            stroke={leafDarkColor}
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
        </g>

        {/* Face on bulb - adjusted for chubby body */}
        <g>
          {/* Eyes */}
          {eyeState === 'happy' && (
            <>
              {/* Outer eye white */}
              <ellipse
                cx="82"
                cy="168"
                rx="8"
                ry={blink ? 1 : 10}
                fill="white"
                className="transition-all duration-200"
              />
              <ellipse
                cx="118"
                cy="168"
                rx="8"
                ry={blink ? 1 : 10}
                fill="white"
                className="transition-all duration-200"
              />
              {/* Pupils */}
              {!blink && (
                <>
                  <ellipse
                    cx="82"
                    cy="169"
                    rx="4.5"
                    ry="6"
                    fill="#1F2937"
                  />
                  <ellipse
                    cx="118"
                    cy="169"
                    rx="4.5"
                    ry="6"
                    fill="#1F2937"
                  />
                  {/* Sparkle highlights */}
                  <circle cx="84.5" cy="166" r="3" fill="white" opacity="0.9" />
                  <circle cx="120.5" cy="166" r="3" fill="white" opacity="0.9" />
                  <circle cx="81" cy="171" r="1.8" fill="white" opacity="0.6" />
                  <circle cx="117" cy="171" r="1.8" fill="white" opacity="0.6" />
                </>
              )}
            </>
          )}
          
          {eyeState === 'sad' && (
            <>
              <ellipse cx="82" cy="168" rx="7" ry="9" fill="white" />
              <ellipse cx="118" cy="168" rx="7" ry="9" fill="white" />
              <ellipse cx="82" cy="170" rx="4" ry="6" fill="#1F2937" />
              <ellipse cx="118" cy="170" rx="4" ry="6" fill="#1F2937" />
              {/* Sad eyebrows */}
              <path d="M 74 160 Q 82 163 90 160" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 110 160 Q 118 163 126 160" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}
          
          {eyeState === 'worried' && (
            <>
              <ellipse cx="82" cy="166" rx="8" ry="10" fill="white" />
              <ellipse cx="118" cy="166" rx="8" ry="10" fill="white" />
              <ellipse cx="82" cy="167" rx="5" ry="7" fill="#1F2937" />
              <ellipse cx="118" cy="167" rx="5" ry="7" fill="#1F2937" />
              <circle cx="84" cy="164" r="2.5" fill="white" opacity="0.8" />
              <circle cx="120" cy="164" r="2.5" fill="white" opacity="0.8" />
              {/* Worried eyebrows */}
              <path d="M 73 157 Q 78 155 83 157" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 117 157 Q 122 155 127 157" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}
          
          {eyeState === 'dizzy' && (
            <>
              <g transform="translate(82, 168)">
                <path d="M -7 -7 L 7 7 M -7 7 L 7 -7" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
              </g>
              <g transform="translate(118, 168)">
                <path d="M -7 -7 L 7 7 M -7 7 L 7 -7" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
              </g>
              {/* Swirl effect */}
              <text x="92" y="150" fontSize="16" opacity="0.6" className="animate-spin-slow">💫</text>
            </>
          )}
          
          {eyeState === 'cold' && (
            <>
              {/* Shivering squinted eyes with white sclera */}
              <ellipse cx="82" cy="170" rx="7" ry="3" fill="white" />
              <ellipse cx="118" cy="170" rx="7" ry="3" fill="white" />
              <path d="M 75 170 L 89 170" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 111 170 L 125 170" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}

          {/* Mouth */}
          {mouthState === 'smile' && (
            <>
              <path
                d="M 80 188 Q 100 198 120 188"
                stroke="#1F2937"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />
              {/* Rosy cheeks - bigger for chubby face */}
              <ellipse cx="65" cy="180" rx="10" ry="8" fill="#F8BBD0" opacity="0.6" />
              <ellipse cx="135" cy="180" rx="10" ry="8" fill="#F8BBD0" opacity="0.6" />
            </>
          )}
          
          {mouthState === 'worried' && (
            <>
              <path
                d="M 80 192 Q 100 188 120 192"
                stroke="#1F2937"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />
            </>
          )}
          
          {mouthState === 'panting' && (
            <>
              <ellipse
                cx="100"
                cy="192"
                rx="12"
                ry="14"
                fill="#1F2937"
                className="animate-pulse"
              />
              {/* Tongue */}
              <ellipse
                cx="100"
                cy="199"
                rx="7"
                ry="5"
                fill="#EC4899"
                opacity="0.8"
              />
            </>
          )}
          
          {mouthState === 'shocked' && (
            <>
              <ellipse
                cx="100"
                cy="192"
                rx="12"
                ry="16"
                fill="#1F2937"
              />
              <ellipse
                cx="100"
                cy="192"
                rx="8"
                ry="12"
                fill="#2D3748"
              />
            </>
          )}
          
          {mouthState === 'chattering' && (
            <>
              {/* Chattering teeth effect */}
              <rect x="85" y="188" width="5" height="6" fill="white" stroke="#1F2937" strokeWidth="1" className="animate-chatter" />
              <rect x="90" y="188" width="5" height="6" fill="white" stroke="#1F2937" strokeWidth="1" className="animate-chatter" />
              <rect x="95" y="188" width="5" height="6" fill="white" stroke="#1F2937" strokeWidth="1" className="animate-chatter" />
              <rect x="100" y="188" width="5" height="6" fill="white" stroke="#1F2937" strokeWidth="1" className="animate-chatter" />
              <rect x="105" y="188" width="5" height="6" fill="white" stroke="#1F2937" strokeWidth="1" className="animate-chatter" />
              <rect x="85" y="194" width="5" height="6" fill="white" stroke="#1F2937" strokeWidth="1" />
              <rect x="90" y="194" width="5" height="6" fill="white" stroke="#1F2937" strokeWidth="1" />
              <rect x="95" y="194" width="5" height="6" fill="white" stroke="#1F2937" strokeWidth="1" />
              <rect x="100" y="194" width="5" height="6" fill="white" stroke="#1F2937" strokeWidth="1" />
              <rect x="105" y="194" width="5" height="6" fill="white" stroke="#1F2937" strokeWidth="1" />
            </>
          )}
        </g>

        {/* Sweat drops when hot */}
        {sweat && (
          <>
            <g className="animate-drip">
              <ellipse cx="68" cy="173" rx="3.5" ry="4" fill="#60A5FA" opacity="0.8" />
              <circle cx="68" cy="171" r="1.5" fill="#E0F2FE" opacity="0.9" />
            </g>
            <g className="animate-drip-delay">
              <ellipse cx="132" cy="176" rx="3.5" ry="4" fill="#60A5FA" opacity="0.8" />
              <circle cx="132" cy="174" r="1.5" fill="#E0F2FE" opacity="0.9" />
            </g>
          </>
        )}

        {/* Water drops when being irrigated */}
        {soilHumidity > 75 && (
          <>
            <g className="animate-fall">
              <circle cx="88" cy="50" r="3" fill="#3B82F6" opacity="0.7" />
              <circle cx="88" cy="50" r="1.5" fill="#DBEAFE" opacity="0.9" />
            </g>
            <g className="animate-fall-delay">
              <circle cx="112" cy="40" r="3" fill="#3B82F6" opacity="0.7" />
              <circle cx="112" cy="40" r="1.5" fill="#DBEAFE" opacity="0.9" />
            </g>
            <g className="animate-fall" style={{ animationDelay: '1.5s' }}>
              <circle cx="100" cy="45" r="2.5" fill="#3B82F6" opacity="0.6" />
            </g>
          </>
        )}

        {/* Heart particles when very healthy */}
        {healthy && soilHumidity > 70 && airTemp >= 25 && airTemp <= 30 && (
          <>
            <text x="60" y="148" fontSize="18" className="animate-float">💚</text>
            <text x="125" y="153" fontSize="18" className="animate-float-delay">✨</text>
            <text x="88" y="143" fontSize="16" className="animate-float" style={{ animationDelay: '1s' }}>🌟</text>
          </>
        )}
        
        {/* Frost/ice particles when too cold */}
        {tempTooCold && (
          <>
            <text x="68" y="140" fontSize="18" className="animate-float">❄️</text>
            <text x="118" y="145" fontSize="18" className="animate-float-delay">❄️</text>
            <text x="90" y="135" fontSize="16" className="animate-float" style={{ animationDelay: '1.2s' }}>🧊</text>
            <text x="80" y="152" fontSize="14" className="animate-float-delay" style={{ animationDelay: '0.8s' }}>❄️</text>
          </>
        )}
      </svg>

      {/* Status message */}
      <style jsx>{`
        @keyframes sway {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }
        
        @keyframes wilt {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(3deg) translateY(5px); }
        }
        
        @keyframes droop {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.95); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        
        @keyframes shiver {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-1px) rotate(-0.5deg); }
          50% { transform: translateX(1px) rotate(0.5deg); }
          75% { transform: translateX(-1px) rotate(-0.5deg); }
        }
        
        @keyframes chatter {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }
        
        @keyframes drip {
          0% { transform: translateY(0); opacity: 0.7; }
          100% { transform: translateY(20px); opacity: 0; }
        }
        
        @keyframes fall {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(100px); opacity: 0; }
        }
        
        @keyframes float {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-30px); opacity: 0; }
        }
        
        .animate-sway {
          animation: sway 4s ease-in-out infinite;
          transform-origin: center bottom;
        }
        
        .animate-wilt {
          animation: wilt 3s ease-in-out infinite;
          transform-origin: center bottom;
        }
        
        .animate-droop {
          animation: droop 2s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }
        
        .animate-shiver {
          animation: shiver 0.3s ease-in-out infinite;
        }
        
        .animate-chatter {
          animation: chatter 0.2s ease-in-out infinite;
        }
        
        .animate-drip {
          animation: drip 2s ease-in-out infinite;
        }
        
        .animate-drip-delay {
          animation: drip 2s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        
        .animate-fall {
          animation: fall 3s linear infinite;
        }
        
        .animate-fall-delay {
          animation: fall 3s linear infinite;
          animation-delay: 1s;
        }
        
        .animate-float {
          animation: float 2s ease-out infinite;
        }
        
        .animate-float-delay {
          animation: float 2s ease-out infinite;
          animation-delay: 0.8s;
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}
