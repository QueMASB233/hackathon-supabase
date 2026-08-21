import { Button } from './Button'

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-3 py-16">
      <h2 className="font-display text-3xl tracking-display">{title}</h2>
      <p className="text-ink/65">{body}</p>
      {action ? (
        <Button className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
