export default function DashboardLoading() {
  return (
    <div className="grid gap-6">
      <div className="h-48 animate-pulse rounded-[2.5rem] bg-white/70" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="h-96 animate-pulse rounded-[2rem] bg-white/70" />
        <div className="h-72 animate-pulse rounded-[2rem] bg-white/70" />
      </div>
    </div>
  );
}
