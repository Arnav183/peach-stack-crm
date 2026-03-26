export default function PeachLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" fill="none">
      {/* Stem */}
      <path d="M60 22 C57 15 53 10 50 7" stroke="#2d6b2d" strokeWidth="4.5" strokeLinecap="round"/>
      {/* Leaf */}
      <ellipse cx="56" cy="9" rx="10" ry="6" fill="#3d8c3d" transform="rotate(-30 56 9)"/>
      {/* Peach/heart body with notch at top center */}
      <path d="M60 105 C38 88 14 72 14 50 C14 35 25 26 38 26 C46 26 53 30 60 36 C67 30 74 26 82 26 C95 26 106 35 106 50 C106 72 82 88 60 105 Z" stroke="#e07860" strokeWidth="6" strokeLinejoin="round" fill="none"/>
      {/* Top cleft/notch */}
      <path d="M52 30 C55 35 60 36 60 36 C60 36 65 35 68 30" stroke="#e07860" strokeWidth="4" strokeLinecap="round" fill="none"/>
      {/* Bar 1 - cream/white */}
      <rect x="36" y="46" width="48" height="12" rx="5" fill="#f0e0cc"/>
      {/* Bar 2 - orange */}
      <rect x="32" y="63" width="56" height="12" rx="5" fill="#e07858"/>
      {/* Bar 3 - dark burnt orange */}
      <rect x="36" y="80" width="48" height="12" rx="5" fill="#c04828"/>
    </svg>
  );
}
