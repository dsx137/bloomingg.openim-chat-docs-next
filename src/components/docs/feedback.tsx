'use client';

import { useState } from 'react';
import type { Locale } from '@/src/lib/i18n';
import { t } from '@/src/lib/i18n';

export function Feedback({ path, locale = 'en' }: { path: string; locale?: Locale }) {
  const text = t(locale);
  const [answer, setAnswer] = useState<'yes' | 'no' | null>(null);

  function submit(value: 'yes' | 'no') {
    setAnswer(value);
    window.localStorage.setItem(`openim-docs-feedback:${path}`, value);
  }

  return (
    <section className="feedback-card">
      {answer ? (
        <p>{text.feedback.stored(answer)}</p>
      ) : (
        <>
          <p>{text.feedback.helpful}</p>
          <div>
            <button onClick={() => submit('yes')} type="button">
              {text.feedback.yes}
            </button>
            <button onClick={() => submit('no')} type="button">
              {text.feedback.no}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
