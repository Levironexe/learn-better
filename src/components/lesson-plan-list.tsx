'use client'

interface PlanMeta {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface LessonPlanListProps {
  plans: PlanMeta[]
  activePlanId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

export function LessonPlanList({ plans, activePlanId, onSelect, onNew }: LessonPlanListProps) {
  return (
    <div className="border-b border-border px-4 py-2 h-12 flex items-center gap-2 overflow-x-auto shrink-0">
      <button
        onClick={onNew}
        className="shrink-0 text-xs px-2 py-1 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
      >
        + New
      </button>
      {plans.map((plan) => (
        <button
          key={plan.id}
          onClick={() => onSelect(plan.id)}
          className={`shrink-0 text-xs px-3 py-1 rounded-xl border transition-colors max-w-[160px] truncate ${
            plan.id === activePlanId
              ? 'border-foreground bg-foreground text-background'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/50'
          }`}
          title={plan.title}
        >
          {plan.title}
        </button>
      ))}
    </div>
  )
}
