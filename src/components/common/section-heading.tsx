export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base text-pretty text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
