import { FuelGauge } from "@/components/common/fuel-gauge";
import { CheckeredFlag } from "@/components/landing/checkered-flag";

const WEEK = [
  { day: "M", planned: 4 },
  { day: "T", planned: 4 },
  { day: "W", planned: 4 },
  { day: "T", planned: 3 },
  { day: "F", planned: 4 },
  { day: "S", planned: 2 },
  { day: "S", planned: 0 },
];

/**
 * A mock "pit board" for the hero: a week strip and the budget gauge. The week
 * strip is decorative; the budget numbers remain real text.
 */
export function PitBoard({ className }: { className?: string }) {
  return (
    <div className={`p-5 sm:p-6 ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            This week · pit board
          </p>
          <p className="mt-1 font-display text-xl font-semibold">7 days, 4 meals a day</p>
        </div>
        <CheckeredFlag />
      </div>

      <div className="mt-5 flex items-end justify-between gap-1.5" aria-hidden="true">
        {WEEK.map(({ day, planned }, index) => (
          <div key={`${day}-${index}`} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-col-reverse gap-1">
              {Array.from({ length: 4 }).map((_, slot) => (
                <span
                  key={slot}
                  className={`h-2 w-full rounded-full ${
                    slot < planned ? "bg-accent/80" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-[0.65rem] font-medium text-muted-foreground">{day}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-muted/60 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Weekly budget
          </p>
          <p className="text-xs text-muted-foreground">estimate</p>
        </div>
        <p className="mt-1 font-display text-2xl font-semibold">
          ₹1,850 <span className="text-sm font-normal text-muted-foreground">of ₹2,500</span>
        </p>
        <FuelGauge
          value={1850}
          max={2500}
          label="Weekly budget used"
          className="mx-auto -mt-1 max-w-[15rem]"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2" aria-hidden="true">
        <div className="rounded-xl border border-border px-3 py-2">
          <p className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">Calories</p>
          <p className="text-sm font-medium">2,040 / day</p>
        </div>
        <div className="rounded-xl border border-border px-3 py-2">
          <p className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">To buy</p>
          <p className="text-sm font-medium">18 items</p>
        </div>
      </div>
    </div>
  );
}
