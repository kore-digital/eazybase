'use client'

import { useActionState, useEffect, useRef, useState } from 'react'

import { submitQuoteRequest, type QuoteActionState } from '@/app/(frontend)/actions/quote'
import { EXTENSION_TYPES } from '@/components/quote/pricing'
import { SuccessPanel } from '@/components/quote/SuccessPanel'

/**
 * The consolidated Get A Quote form — merges the old site's two forms
 * (WPForms 825 + DHVC 119) into one canonical form per the content audit §8.
 * Real labels throughout; phone is type=tel (the old form's type=number
 * stripped leading zeros). Server action validates again and stores a
 * QuoteRequests doc (type 'full').
 */

const inputClass = (invalid?: boolean) =>
  [
    'w-full rounded-lg border bg-white px-4 py-3 text-ink-800',
    'placeholder:text-ink-300',
    'transition-[box-shadow,border-color] duration-200 outline-none',
    'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/25',
    invalid ? 'border-red-400' : 'border-ink-200 hover:border-ink-300',
  ].join(' ')

const labelClass = 'mb-1.5 block font-display text-sm font-semibold text-ink-800'

const initialQuoteState: QuoteActionState = { status: 'idle' }

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1.5 text-sm text-red-600">
      {message}
    </p>
  )
}

export function QuoteForm() {
  const [state, formAction, isPending] = useActionState<QuoteActionState, FormData>(
    submitQuoteRequest,
    initialQuoteState,
  )

  // Min-time-to-submit spam check: elapsed time is measured entirely on the
  // client clock (submit − mount) and written into the hidden field at submit,
  // so server/client clock skew can never flag a real visitor.
  const mountedAt = useRef(0)
  const elapsedRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    mountedAt.current = Date.now()
  }, [])
  const stampElapsed = () => {
    if (elapsedRef.current && mountedAt.current > 0) {
      elapsedRef.current.value = String(Date.now() - mountedAt.current)
    }
  }

  if (state.status === 'success') {
    return <SuccessPanel />
  }

  const errors = state.fieldErrors ?? {}
  const values = state.values ?? {}

  return (
    <form action={formAction} onSubmit={stampElapsed} noValidate={false} className="space-y-5">
      <input type="hidden" name="formType" value="full" />
      <input ref={elapsedRef} type="hidden" name="_eb_elapsed" defaultValue="" />

      {/* Honeypot — visually hidden, ignored by humans, filled by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="companyWebsite">Leave this field empty</label>
        <input
          type="text"
          id="companyWebsite"
          name="companyWebsite"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state.status === 'error' && state.message ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="qf-first-name" className={labelClass}>
            First name <span className="text-brand-600">*</span>
          </label>
          <input
            id="qf-first-name"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            defaultValue={values.firstName}
            aria-invalid={errors.firstName ? true : undefined}
            aria-describedby={errors.firstName ? 'qf-first-name-error' : undefined}
            className={inputClass(!!errors.firstName)}
          />
          <FieldError id="qf-first-name-error" message={errors.firstName} />
        </div>

        <div>
          <label htmlFor="qf-last-name" className={labelClass}>
            Last name <span className="text-brand-600">*</span>
          </label>
          <input
            id="qf-last-name"
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            defaultValue={values.lastName}
            aria-invalid={errors.lastName ? true : undefined}
            aria-describedby={errors.lastName ? 'qf-last-name-error' : undefined}
            className={inputClass(!!errors.lastName)}
          />
          <FieldError id="qf-last-name-error" message={errors.lastName} />
        </div>

        <div>
          <label htmlFor="qf-email" className={labelClass}>
            Email <span className="text-brand-600">*</span>
          </label>
          <input
            id="qf-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={values.email}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'qf-email-error' : undefined}
            className={inputClass(!!errors.email)}
          />
          <FieldError id="qf-email-error" message={errors.email} />
        </div>

        <div>
          <label htmlFor="qf-phone" className={labelClass}>
            Phone <span className="text-brand-600">*</span>
          </label>
          <input
            id="qf-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            // UK numbers: 0… or +44…, allowing spaces/dashes/brackets.
            pattern="^(\+44|0)[\d\s().-]{9,14}$"
            title="A UK phone number, starting 0 or +44"
            defaultValue={values.phone}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? 'qf-phone-error' : undefined}
            className={inputClass(!!errors.phone)}
          />
          <FieldError id="qf-phone-error" message={errors.phone} />
        </div>

        <div>
          <label htmlFor="qf-postcode" className={labelClass}>
            Postcode <span className="text-brand-600">*</span>
          </label>
          <input
            id="qf-postcode"
            name="postcode"
            type="text"
            required
            autoComplete="postal-code"
            pattern="^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$"
            title="A UK postcode, e.g. BB1 2AB"
            defaultValue={values.postcode}
            aria-invalid={errors.postcode ? true : undefined}
            aria-describedby={errors.postcode ? 'qf-postcode-error' : undefined}
            className={inputClass(!!errors.postcode)}
          />
          <FieldError id="qf-postcode-error" message={errors.postcode} />
        </div>

        <div>
          <label htmlFor="qf-extension-type" className={labelClass}>
            Extension type
          </label>
          <select
            id="qf-extension-type"
            name="extensionType"
            defaultValue={values.extensionType ?? ''}
            className={`${inputClass()} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20fill%3D%22none%22%20stroke%3D%22%236d7167%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22m4%206%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[position:right_1rem_center] bg-no-repeat pr-10`}
          >
            <option value="">Not sure yet</option>
            {EXTENSION_TYPES.map((t) => (
              <option key={t.key} value={t.label}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="qf-address" className={labelClass}>
            House no. &amp; street <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input
            id="qf-address"
            name="addressLine1"
            type="text"
            autoComplete="address-line1"
            defaultValue={values.addressLine1}
            className={inputClass()}
          />
        </div>

        <div>
          <label htmlFor="qf-town" className={labelClass}>
            Town or city <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input
            id="qf-town"
            name="town"
            type="text"
            autoComplete="address-level2"
            defaultValue={values.town}
            className={inputClass()}
          />
        </div>
      </div>

      <div>
        <label htmlFor="qf-message" className={labelClass}>
          Your project <span className="text-brand-600">*</span>
        </label>
        <textarea
          id="qf-message"
          name="message"
          required
          rows={5}
          placeholder="A few brief details — what you’d like to build, roughly how big, and when you’re hoping to start."
          defaultValue={values.message}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'qf-message-error' : undefined}
          className={`${inputClass(!!errors.message)} resize-y`}
        />
        <FieldError id="qf-message-error" message={errors.message} />
      </div>

      <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="eb-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Sending…' : 'Send my quote request'}
        </button>
        <p className="text-sm text-ink-400">
          Free and no obligation. We’ll only use your details to respond to your enquiry.
        </p>
      </div>
    </form>
  )
}

export default QuoteForm
