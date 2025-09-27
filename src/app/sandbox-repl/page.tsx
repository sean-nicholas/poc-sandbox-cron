import { Sandbox } from '@vercel/sandbox'
import ms from 'ms'
import { redirect } from 'next/navigation'
import { ActionButton } from './ActionButton'

export default function SandboxPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50 px-4 py-16">
      <section className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/80 bg-white/80 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.6)] backdrop-blur">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-500/25 via-indigo-500/10 to-transparent"
        />
        <div className="relative space-y-8 p-10">
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Sandbox REPL
            </span>
            <h1 className="text-2xl font-semibold text-slate-900">Launch a fresh sandbox</h1>
            <p className="text-sm leading-relaxed text-slate-600">
              Spin up an isolated Vercel Sandbox to experiment, run commands, or reproduce tricky bugs without
              touching production infrastructure.
            </p>
          </div>

          <ActionButton
            className="w-full px-6 py-3 text-base"
            action={async () => {
              'use server'
              const sandbox = await Sandbox.create({
                source: {
                  url: 'https://github.com/vercel/sandbox-example-next.git',
                  // revision: '', // TODO: add branch from vercel env / local git
                  type: 'git',
                  // username: 'x-access-token',
                  // password: process.env.SANDBOX_TEST_GITHUB_TOKEN, // Only needed for private repos
                },
                ports: [3000],
                resources: { vcpus: 2 },
                timeout: ms('15m'),
                runtime: 'node22',
              })

              redirect(`/sandbox/${sandbox.sandboxId}`)
            }}
          >
            Start Sandbox
          </ActionButton>

          <p className="text-xs text-slate-400">
            Sandboxes automatically shut down after 15 minutes of inactivity to free up resources.
          </p>
        </div>
      </section>
    </main>
  )
}
