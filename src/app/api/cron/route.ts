import { sandboxCron } from '@/lib/sandboxCron'

export const GET = sandboxCron({
  run: async () => {
    console.log('Running cron')
    fetch('https://webhook.site/06272e11-6f18-4831-a204-066105e8bd7b', {
      method: 'POST',
      body: JSON.stringify({ message: 'Running in a sandbox!' }),
    })
  },
})
