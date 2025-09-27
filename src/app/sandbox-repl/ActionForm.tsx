'use client'

import {
  ButtonHTMLAttributes,
  FormEvent,
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react'

type ActionFormProps = {
  action: (formData: FormData) => Promise<void>
  className?: string
  contentClassName?: string
  children: ReactNode
}

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: ReactNode
}

type ActionFormContextValue = {
  pending: boolean
}

const ActionFormContext = createContext<ActionFormContextValue>({ pending: false })

const useActionFormContext = () => useContext(ActionFormContext)

export const ActionForm = ({ action, className, contentClassName, children }: ActionFormProps) => {
  const [isPending, setIsPending] = useState(false)

  const contextValue = useMemo<ActionFormContextValue>(() => ({ pending: isPending }), [isPending])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    try {
      setIsPending(true)
      await action(formData)
    } finally {
      setIsPending(false)
    }
  }

  const contentClasses = contentClassName?.trim() || 'space-y-4'

  return (
    <ActionFormContext.Provider value={contextValue}>
      <form
        onSubmit={handleSubmit}
        data-pending={isPending ? 'true' : 'false'}
        aria-busy={isPending}
        className={['group/action-form', className ?? ''].join(' ').trim()}
      >
        <fieldset disabled={isPending} className={contentClasses}>
          {children}
        </fieldset>
      </form>
    </ActionFormContext.Provider>
  )
}

export const ActionFormSubmit = ({ pendingLabel, children, disabled, type, ...rest }: SubmitButtonProps) => {
  const { pending } = useActionFormContext()

  const resolvedLabel = pending ? pendingLabel ?? children : children

  return (
    <button
      type={type ?? 'submit'}
      disabled={pending || disabled}
      data-pending={pending ? 'true' : 'false'}
      aria-busy={pending}
      {...rest}
    >
      {resolvedLabel}
    </button>
  )
}
