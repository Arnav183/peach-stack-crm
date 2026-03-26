export default function PeachLogo({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/peach-logo.png.png"
      alt="Peach Stack"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}
