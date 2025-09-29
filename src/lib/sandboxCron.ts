import { Sandbox } from '@vercel/sandbox'
import ms from 'ms'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { setTimeout } from 'timers/promises'

export const sandboxCron = ({
  run,
  timeout = ms('5m'),
  vcpus = 2,
}: {
  run: () => Promise<void>
  vcpus?: number
  timeout?: number
}) => {
  return async (request: Request) => {
    const filteredEnv = removeUndefinedFromEnv(process.env)
    const { CRON_SECRET } = filteredEnv

    if (!CRON_SECRET) {
      throw new Error('CRON_SECRET is not set')
    }

    const authHeader = (await headers()).get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    if (process.env.IN_SANDBOX === 'true') {
      after(async () => {
        await run()
        const sandbox = await Sandbox.get({
          sandboxId: process.env.SANDBOX_ID!,
        })
        await sandbox.stop()
      })
      return new Response('Running...', { status: 202 })
    }

    console.log('Creating sandbox')
    const sandbox = await Sandbox.create({
      source: {
        url: 'https://github.com/sean-nicholas/poc-sandbox-cron.git',
        // revision: '', // TODO: add branch from vercel env / local git
        type: 'git',
        // username: 'x-access-token',
        // password: process.env.SANDBOX_TEST_GITHUB_TOKEN, // Only needed for private repos
      },
      ports: [3000],
      resources: { vcpus },
      timeout,
      runtime: 'node22',
    })

    console.log(`Installing dependencies...`)
    const install = await sandbox.runCommand({
      cmd: 'pnpm',
      args: ['install'],
      stderr: process.stderr,
      stdout: process.stdout,
      env: filteredEnv,
    })

    if (install.exitCode != 0) {
      console.log('installing packages failed')
      process.exit(1)
    }

    console.log('Bulding the project...')
    const build = await sandbox.runCommand({
      cmd: 'pnpm',
      args: ['build'],
      stderr: process.stderr,
      stdout: process.stdout,
      env: filteredEnv,
    })

    if (build.exitCode != 0) {
      console.log('building the project failed')
      process.exit(1)
    }

    console.log(`Starting the development server...`)
    await sandbox.runCommand({
      cmd: 'pnpm',
      args: ['start'],
      stderr: process.stderr,
      stdout: process.stdout,
      detached: true,
      env: {
        ...filteredEnv,
        IN_SANDBOX: 'true',
        SANDBOX_ID: sandbox.sandboxId,
      },
    })

    const originalUrl = new URL(request.url)
    const url = new URL(
      `${originalUrl.pathname}${originalUrl.search}${originalUrl.hash}`,
      'http://localhost:3000',
    )

    console.log(`Waiting for the dev server to respond at ${url.href}...`)

    // TODO: Try this with fetch?
    const maxAttempts = 15
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const probe = await sandbox.runCommand({
        cmd: 'curl',
        args: [url.href],
      })

      if (probe.exitCode === 0) {
        console.log(`Server responded on attempt ${attempt}`)
        break
      }

      if (attempt === maxAttempts) {
        throw new Error(
          `Server failed to respond after ${maxAttempts} attempts`,
        )
      }

      await setTimeout(ms('2s'))
    }

    console.log('Sandbox started')

    return new Response('Started')
  }
}

const removeUndefinedFromEnv = (env: NodeJS.ProcessEnv) =>
  Object.fromEntries(
    Object.entries(env).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  )
