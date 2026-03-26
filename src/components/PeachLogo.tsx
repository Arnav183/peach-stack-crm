export default function PeachLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <line x1="50" y1="18" x2="46" y2="10" stroke="#2a6a2a" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="55" cy="8" rx="8" ry="5" fill="#3a8a3a" transform="rotate(-25 55 8)"/>
      <path d="M50 88 C30 72 12 58 12 40 C12 28 22 20 34 20 C41 20 47 24 50 28 C53 24 59 20 66 20 C78 20 88 28 88 40 C88 58 70 72 50 88Z" fill="none" stroke="#e8795a" strokeWidth="5" strokeLinejoin="round"/>
      <rect x="33" y="37" width="34" height="9" rx="4" fill="#f5e6d3"/>
      <rect x="30" y="50" width="40" height="9" rx="4" fill="#e8795a"/>
      <rect x="33" y="63" width="34" height="9" rx="4" fill="#c4522a"/>
    </svg>
  );
}
