export function PageHeader({
  eyebrow,
  title,
  accent,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="max-w-3xl animate-fade-up">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
        <span className="size-1.5 rounded-full bg-signal" />
        {eyebrow}
      </div>
      <h1 className="font-serif text-[2.5rem] leading-[1.02] tracking-[-0.02em] sm:text-5xl lg:text-[3.5rem]">
        {title}
        {accent && (
          <>
            <br />
            <span className="italic text-signal">{accent}</span>
          </>
        )}
      </h1>
      <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-muted-foreground sm:text-[15px]">
        {description}
      </p>
      {children}
    </header>
  );
}
