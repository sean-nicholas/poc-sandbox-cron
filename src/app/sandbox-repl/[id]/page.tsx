import { Sandbox } from '@vercel/sandbox'
import { ActionButton } from '../ActionButton'
import { ActionForm, ActionFormSubmit } from '../ActionForm'

export default async function SandboxPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sandbox = await Sandbox.get({ sandboxId: id })
  const status = sandbox.status

  const statusStyles: Record<string, { label: string; badgeClass: string; chipClass: string; allowStop: boolean }> = {
    pending: {
      label: 'Pending',
      badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
      chipClass: 'bg-amber-100/60 text-amber-700',
      allowStop: true,
    },
    running: {
      label: 'Running',
      badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
      chipClass: 'bg-emerald-100/60 text-emerald-700',
      allowStop: true,
    },
    stopping: {
      label: 'Stopping',
      badgeClass: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
      chipClass: 'bg-sky-100/60 text-sky-700',
      allowStop: false,
    },
    stopped: {
      label: 'Stopped',
      badgeClass: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
      chipClass: 'bg-slate-200/70 text-slate-600',
      allowStop: false,
    },
    failed: {
      label: 'Failed',
      badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
      chipClass: 'bg-rose-100/70 text-rose-700',
      allowStop: false,
    },
  }

  const statusMeta = statusStyles[status] ?? {
    label: status,
    badgeClass: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
    chipClass: 'bg-slate-200/70 text-slate-600',
    allowStop: false,
  }
  const canStop = statusMeta.allowStop
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 px-4 py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <section className="overflow-hidden rounded-3xl border border-white/80 bg-white/80 p-8 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Sandbox
                </span>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusMeta.badgeClass}`}
                >
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusMeta.chipClass}`} />
                  {statusMeta.label}
                </span>
              </div>
              <h1 className="break-all text-2xl font-semibold text-slate-900">{sandbox.sandboxId}</h1>
              <p className="text-sm leading-relaxed text-slate-600">
                Use the command runner below to interact with this environment. Command output currently
                streams to the server logs.
              </p>
            </div>

            {canStop ? (
              <ActionButton
                variant="danger"
                className="px-6 py-2.5"
                action={async () => {
                  'use server'
                  const sandbox = await Sandbox.get({ sandboxId: id })
                  await sandbox.stop()
                }}
              >
                Stop Sandbox
              </ActionButton>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Run a command</h2>
            <p className="text-sm text-slate-600">
              Quickly send a command to your sandbox. You can follow the output from your terminal where this
              development server is running.
            </p>
          </div>

          <ActionForm
            className="mt-6"
            contentClassName="space-y-6"
            action={async (formData) => {
              'use server'
              const sandbox = await Sandbox.get({ sandboxId: id })
              const command = formData.get('command') as string
              const [cmd, ...args] = command.split(' ')
              await sandbox.runCommand({
                cmd,
                args,
                sudo: (formData.get('root') as string) === 'on',
                stdout: process.stdout,
                stderr: process.stderr,
              })
            }}
          >
            <div className="space-y-2">
              <label htmlFor="command" className="text-sm font-medium text-slate-700">
                Command
              </label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-inner transition focus-within:border-indigo-300 focus-within:bg-white focus-within:shadow-md">
                <input
                  id="command"
                  name="command"
                  type="text"
                  placeholder="npm run lint"
                  required
                  className="w-full border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <label htmlFor="root" className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  id="root"
                  type="checkbox"
                  name="root"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Run with sudo
              </label>
              <ActionFormSubmit className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60" pendingLabel="Running...">
                Run Command
              </ActionFormSubmit>
            </div>
          </ActionForm>

          <p className="mt-4 text-xs text-slate-400">
            Need multiple commands? Chain them with <code className="font-mono text-xs">&&</code> or create a
            script inside the sandbox first.
          </p>
        </section>
      </div>
    </main>
  )
}
