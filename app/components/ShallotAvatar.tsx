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

  // Color changes based on health
  const bulbColor = soilCritical 
    ? '#6B3E3E' // Dark brown-red when critical
    : soilDry 
    ? '#9B4D4D' // Medium red-brown when dry
    : tempTooHigh
    ? '#C17171' // Light red-brown when hot
    : '#B8697C'; // Purple-red when healthy (typical shallot color)

  const bulbShade = soilCritical 
    ? '#4A2828' // Darker shade when critical
    : soilDry 
    ? '#7A3838' // Dark red-brown shade
    : tempTooHigh
    ? '#A85E5E' // Medium shade when hot
    : '#9A5566'; // Deep purple-red shade (healthy shallot)

  const leafColor = healthy 
    ? '#22C55E' // Bright green when healthy
    : tempTooCold
    ? '#3B82F6' // Blue-ish tint when cold
    : tempHot || airDry
    ? '#84CC16' // Yellow-green when stressed
    : soilCritical
    ? '#65A30D' // Dark yellow-green when critical
    : '#86EFAC'; // Light green

  const leafDarkColor = healthy 
    ? '#15803D' 
    : tempTooCold
    ? '#1E40AF' // Dark blue when cold
    : tempHot || airDry
    ? '#4D7C0F'
    : soilCritical
    ? '#3F6212'
    : '#22C55E';

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
    ? 'faint' 
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
        {/* Gradient definitions */}
        <defs>
          <radialGradient id="shallotGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D8A0B0" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#B8697C" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8B4560" stopOpacity="0.7" />
          </radialGradient>
        </defs>
        
        {/* Soil Base */}
        <ellipse
          cx="100"
          cy="200"
          rx="70"
          ry="15"
          fill="#8B7355"
          opacity="0.6"
        />
        
        {/* Shallot Bulb */}
        <g className={isWilting ? 'animate-droop' : ''}>
          {/* Main bulb body */}
          <ellipse
            cx="100"
            cy="170"
            rx="35"
            ry="45"
            fill={bulbColor}
            stroke={bulbShade}
            strokeWidth="2"
          />
          
          {/* Purple/red tint overlay */}
          <ellipse
            cx="100"
            cy="170"
            rx="35"
            ry="45"
            fill="url(#shallotGradient)"
            opacity="0.6"
          />
          
          {/* Bulb texture lines */}
          <path
            d="M 75 150 Q 100 155 125 150"
            stroke={bulbShade}
            strokeWidth="1"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M 75 170 Q 100 175 125 170"
            stroke={bulbShade}
            strokeWidth="1"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M 80 190 Q 100 193 120 190"
            stroke={bulbShade}
            strokeWidth="1"
            fill="none"
            opacity="0.7"
          />
          
          {/* Root hint */}
          <path
            d="M 95 210 Q 90 220 85 225"
            stroke="#654321"
            strokeWidth="1.5"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M 105 210 Q 110 220 115 225"
            stroke="#654321"
            strokeWidth="1.5"
            fill="none"
            opacity="0.4"
          />
        </g>

        {/* Leaves */}
        <g className={isWilting ? 'animate-wilt' : 'animate-sway'}>
          {/* Left leaf */}
          <path
            d="M 100 140 Q 60 120 50 60 Q 55 50 65 55 Q 75 100 100 130"
            fill={leafColor}
            stroke={leafDarkColor}
            strokeWidth="2"
            className="origin-bottom"
          />
          
          {/* Center-left leaf */}
          <path
            d="M 100 140 Q 70 100 65 40 Q 70 30 80 35 Q 85 90 100 130"
            fill={leafColor}
            stroke={leafDarkColor}
            strokeWidth="2"
          />
          
          {/* Center leaf */}
          <path
            d="M 100 140 Q 95 80 100 20 Q 105 15 110 20 Q 105 80 100 130"
            fill={leafColor}
            stroke={leafDarkColor}
            strokeWidth="2.5"
          />
          
          {/* Center-right leaf */}
          <path
            d="M 100 140 Q 130 100 135 40 Q 130 30 120 35 Q 115 90 100 130"
            fill={leafColor}
            stroke={leafDarkColor}
            strokeWidth="2"
          />
          
          {/* Right leaf */}
          <path
            d="M 100 140 Q 140 120 150 60 Q 145 50 135 55 Q 125 100 100 130"
            fill={leafColor}
            stroke={leafDarkColor}
            strokeWidth="2"
          />
        </g>

        {/* Face on bulb */}
        <g>
          {/* Eyes */}
          {eyeState === 'happy' && (
            <>
              <ellipse
                cx="85"
                cy="160"
                rx="5"
                ry={blink ? 1 : 7}
                fill="#2D3748"
                className="transition-all duration-200"
              />
              <ellipse
                cx="115"
                cy="160"
                rx="5"
                ry={blink ? 1 : 7}
                fill="#2D3748"
                className="transition-all duration-200"
              />
              {/* Sparkle in eyes */}
              {!blink && (
                <>
                  <circle cx="87" cy="158" r="2" fill="white" />
                  <circle cx="117" cy="158" r="2" fill="white" />
                </>
              )}
            </>
          )}
          
          {eyeState === 'sad' && (
            <>
              <path d="M 80 160 Q 85 165 90 160" stroke="#2D3748" strokeWidth="2" fill="none" />
              <path d="M 110 160 Q 115 165 120 160" stroke="#2D3748" strokeWidth="2" fill="none" />
            </>
          )}
          
          {eyeState === 'worried' && (
            <>
              <ellipse cx="85" cy="158" rx="6" ry="8" fill="#2D3748" />
              <ellipse cx="115" cy="158" rx="6" ry="8" fill="#2D3748" />
              <circle cx="87" cy="156" r="2" fill="white" />
              <circle cx="117" cy="156" r="2" fill="white" />
            </>
          )}
          
          {eyeState === 'dizzy' && (
            <>
              <text x="80" y="165" fontSize="16" fill="#2D3748">×</text>
              <text x="110" y="165" fontSize="16" fill="#2D3748">×</text>
            </>
          )}
          
          {eyeState === 'cold' && (
            <>
              {/* Squinted/shivering eyes */}
              <path d="M 80 162 L 90 162" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 110 162 L 120 162" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}

          {/* Mouth */}
          {mouthState === 'smile' && (
            <path
              d="M 85 175 Q 100 183 115 175"
              stroke="#2D3748"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          )}
          
          {mouthState === 'worried' && (
            <path
              d="M 85 180 Q 100 177 115 180"
              stroke="#2D3748"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          )}
          
          {mouthState === 'panting' && (
            <ellipse
              cx="100"
              cy="180"
              rx="8"
              ry="10"
              fill="#2D3748"
              className="animate-pulse"
            />
          )}
          
          {mouthState === 'faint' && (
            <line
              x1="85"
              y1="180"
              x2="115"
              y2="180"
              stroke="#2D3748"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
          
          {mouthState === 'chattering' && (
            <>
              {/* Chattering teeth effect */}
              <path
                d="M 90 178 L 95 178 L 95 182 L 90 182 Z M 95 178 L 100 178 L 100 182 L 95 182 Z M 100 178 L 105 178 L 105 182 L 100 182 Z M 105 178 L 110 178 L 110 182 L 105 182 Z"
                fill="none"
                stroke="#2D3748"
                strokeWidth="1.5"
                className="animate-chatter"
              />
            </>
          )}
        </g>

        {/* Sweat drops when hot */}
        {sweat && (
          <>
            <circle cx="75" cy="165" r="3" fill="#4FC3F7" opacity="0.7" className="animate-drip" />
            <circle cx="125" cy="168" r="3" fill="#4FC3F7" opacity="0.7" className="animate-drip-delay" />
          </>
        )}

        {/* Water drops when being irrigated */}
        {soilHumidity > 75 && (
          <>
            <circle cx="90" cy="50" r="2" fill="#60A5FA" className="animate-fall" />
            <circle cx="110" cy="40" r="2" fill="#60A5FA" className="animate-fall-delay" />
          </>
        )}

        {/* Heart particles when very healthy */}
        {healthy && soilHumidity > 70 && airTemp >= 25 && airTemp <= 30 && (
          <>
            <text x="70" y="145" fontSize="12" className="animate-float">💚</text>
            <text x="120" y="150" fontSize="12" className="animate-float-delay">✨</text>
          </>
        )}
        
        {/* Frost/ice particles when too cold */}
        {tempTooCold && (
          <>
            <text x="75" y="140" fontSize="14" className="animate-float">❄️</text>
            <text x="115" y="145" fontSize="14" className="animate-float-delay">❄️</text>
            <text x="95" y="135" fontSize="12" className="animate-float">🧊</text>
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
      `}</style>
    </div>
  );
}
