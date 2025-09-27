'use client'

import { ReactNode, useState } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

type ActionButtonProps = {
  children: ReactNode
  action: () => Promise<void>
  className?: string
  variant?: ButtonVariant
}

export const ActionButton = ({
  children,
  action,
  className,
  variant = 'primary',
}: ActionButtonProps) => {
  const [isPending, setIsPending] = useState(false)

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-indigo-500 text-white shadow-[0_10px_30px_-15px_rgba(79,70,229,0.8)] hover:bg-indigo-600 focus-visible:outline-indigo-500',
    secondary:
      'bg-white text-indigo-600 ring-1 ring-inset ring-indigo-100 hover:ring-indigo-200 focus-visible:outline-indigo-500',
    danger:
      'bg-rose-500 text-white shadow-[0_10px_30px_-15px_rgba(244,63,94,0.8)] hover:bg-rose-600 focus-visible:outline-rose-500',
  }

  const handleClick = async () => {
    try {
      setIsPending(true)
      await action()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      data-pending={isPending ? 'true' : 'false'}
      aria-busy={isPending}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-80',
        variantStyles[variant],
        isPending ? 'translate-y-[1px]' : '',
        className ?? '',
      ]
        .join(' ')
        .trim()}
    >
      {isPending && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      <span className="leading-none">{children}</span>
    </button>
  )
}
