import { Rule } from "../../design-system";
import { getPerformance } from "../../services/employees/operationsService";
import { formatINR } from "../../utils/shopping";
import { formatCount } from "../../utils/employee";

export default function PerformancePanel({ employeeId, compact = false }) {
  const data = getPerformance(employeeId);
  const target = Number(data.monthlyTarget) || 0;
  const achievement = Number(data.achievement) || 0;
  const percent = target > 0 ? Math.min(100, Math.round((achievement / target) * 100)) : null;

  return (
    <section className="border border-mist/80 bg-surface/40 p-6">
      <p className="font-ui text-[10px] uppercase tracking-[.2em] text-accent">Performance</p>
      <h2 className="mt-2 font-display text-2xl font-light text-ink">This month</h2>
      <Rule width="w-8" tone="accent" className="my-3" />

      {percent !== null ? (
        <div className="mb-5">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="font-ui text-xs text-taupe">Monthly target</p>
            <p className="font-ui text-xs text-ink">
              {formatINR(achievement)} · {percent}% of {formatINR(target)}
            </p>
          </div>
          <div className="h-1.5 w-full bg-mist/80" aria-hidden="true">
            <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
          </div>
          <span className="sr-only">
            Achievement {percent} percent of monthly target
          </span>
        </div>
      ) : null}

      <dl className={`grid gap-4 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {data.customersServed != null ? (
          <div>
            <dt className="font-ui text-[10px] uppercase tracking-[.16em] text-taupe">
              Customers served
            </dt>
            <dd className="mt-1 font-display text-2xl font-light text-ink">
              {formatCount(data.customersServed)}
            </dd>
          </div>
        ) : null}
        {data.ordersAssisted != null ? (
          <div>
            <dt className="font-ui text-[10px] uppercase tracking-[.16em] text-taupe">
              Orders assisted
            </dt>
            <dd className="mt-1 font-display text-2xl font-light text-ink">
              {formatCount(data.ordersAssisted)}
            </dd>
          </div>
        ) : null}
        {data.conversion ? (
          <div>
            <dt className="font-ui text-[10px] uppercase tracking-[.16em] text-taupe">Conversion</dt>
            <dd className="mt-1 font-display text-2xl font-light text-ink">{data.conversion}%</dd>
          </div>
        ) : null}
        {data.averageTicket ? (
          <div>
            <dt className="font-ui text-[10px] uppercase tracking-[.16em] text-taupe">
              Average ticket
            </dt>
            <dd className="mt-1 font-display text-2xl font-light text-ink">
              {formatINR(data.averageTicket)}
            </dd>
          </div>
        ) : null}
        {data.openCases != null ? (
          <div>
            <dt className="font-ui text-[10px] uppercase tracking-[.16em] text-taupe">Open cases</dt>
            <dd className="mt-1 font-display text-2xl font-light text-ink">
              {formatCount(data.openCases)}
            </dd>
          </div>
        ) : null}
        {data.appointments != null ? (
          <div>
            <dt className="font-ui text-[10px] uppercase tracking-[.16em] text-taupe">
              Appointments
            </dt>
            <dd className="mt-1 font-display text-2xl font-light text-ink">
              {formatCount(data.appointments)}
            </dd>
          </div>
        ) : null}
        {data.stockAccuracy != null ? (
          <div>
            <dt className="font-ui text-[10px] uppercase tracking-[.16em] text-taupe">
              Stock accuracy
            </dt>
            <dd className="mt-1 font-display text-2xl font-light text-ink">{data.stockAccuracy}%</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-5 font-ui text-[11px] text-taupe">Demo figures for the client preview.</p>
    </section>
  );
}
