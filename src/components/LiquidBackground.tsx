export default function LiquidBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="bg-app absolute inset-0" />
      <div className="glow-overlay absolute inset-0" />
      <div className="absolute -top-32 left-[8%] h-[42vw] w-[42vw] animate-blob-a bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,102,0.22),rgba(0,255,102,0)_70%)] opacity-70 blur-3xl" />
      <div className="absolute top-[30%] -right-[10%] h-[40vw] w-[40vw] animate-blob-b bg-[radial-gradient(circle_at_60%_40%,rgba(0,200,90,0.18),rgba(0,255,102,0)_70%)] opacity-60 blur-3xl" />
      <div className="absolute bottom-[-12%] left-[20%] h-[38vw] w-[38vw] animate-blob-c bg-[radial-gradient(circle_at_50%_50%,rgba(0,120,60,0.16),rgba(0,255,102,0)_70%)] opacity-50 blur-3xl" />
      <div className="vignette absolute inset-0" />
    </div>
  );
}
