import { Sandbox } from '@vercel/sandbox'
import { execSync } from 'child_process'
import { readFile } from 'fs/promises'
import ms from 'ms'
import { setTimeout } from 'timers/promises'

export const GET = async (request: Request) => {
  if (process.env.IN_SANDBOX === 'true') {
    console.log('Im in the box')
    await fetch('https://webhook.site/06272e11-6f18-4831-a204-066105e8bd7b', {
      method: 'POST',
      body: JSON.stringify({ message: 'Running in sandbox' }),
    })
    execSync('reboot')

    return
  }

  const originalUrl = new URL(request.url)
  const url = new URL(
    `${originalUrl.pathname}${originalUrl.search}${originalUrl.hash}`,
    'http://localhost:3000',
  )

  console.log('Creating sandbox')
  const sandbox = await Sandbox.create({
    source: {
      url: 'https://github.com/SODEFA-GmbH-Co-KG/teampilot.git',
      revision: 'feature/sandbox-cron',
      type: 'git',
      username: 'x-access-token',
      password: process.env.SANDBOX_TEST_GITHUB_TOKEN,
    },
    resources: { vcpus: 2 },
    timeout: ms('5h'),
    ports: [3000],
    runtime: 'node22',
  })

  console.log(`Installing dependencies...`)
  const install = await sandbox.runCommand({
    cmd: 'pnpm',
    args: ['install'],
    stderr: process.stderr,
    stdout: process.stdout,
    env: {
      GITENVS_STAGE: process.env.GITENVS_STAGE || 'development',
      GITENVS_PASSPHRASE_DEVELOPMENT:
        process.env.GITENVS_PASSPHRASE_DEVELOPMENT ||
        (await getDevPassphraseFromFile()),
    },
  })

  if (install.exitCode != 0) {
    console.log('installing packages failed')
    process.exit(1)
  }

  console.log(`Starting the development server...`)
  await sandbox.runCommand({
    cmd: 'pnpm',
    args: ['run', 'dev'],
    stderr: process.stderr,
    stdout: process.stdout,
    detached: true,
    env: { IN_SANDBOX: 'true' },
  })

  console.log(`Waiting for the dev server to respond at ${url.href}...`)
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
      throw new Error(`Server failed to respond after ${maxAttempts} attempts`)
    }

    await setTimeout(ms('2s'))
  }

  console.log('Sandbox started')

  return new Response('Started')
}

const getDevPassphraseFromFile = async () => {
  const content = await readFile('gitenvs.passphrases.json', 'utf8')
  const passphrases = JSON.parse(content)
  return passphrases.find(
    (p: { stageName: string }) => p.stageName === 'development',
  )?.passphrase
}
