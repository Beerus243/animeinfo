export default function AppLoading() {
  return (
    <div className="shell-container py-8 md:py-12">
      <div className="panel animate-pulse space-y-6 px-6 py-8 md:px-10 md:py-12">
        <div className="h-8 w-40 rounded-full bg-line" />
        <div className="h-14 w-3/4 rounded-3xl bg-line" />
        <div className="h-6 w-2/3 rounded-full bg-line" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-48 rounded-3xl bg-line" />
          <div className="h-48 rounded-3xl bg-line" />
          <div className="h-48 rounded-3xl bg-line" />
        </div>
      </div>
    </div>
  );
}