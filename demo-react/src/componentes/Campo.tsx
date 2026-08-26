import type { ReactNode } from 'react';
import estilos from './Campo.module.css';

export interface CampoProps {
  label?: string;
  hint?: string;
  error?: string;
  id?: string;
  children: ReactNode;
}

/** Wrapper genérico label + control + hint/error, para envolver cualquier input. */
export function Campo({ label, hint, error, id, children }: CampoProps) {
  return (
    <div>
      {label !== undefined && <label htmlFor={id}>{label}</label>}
      {children}
      {error !== undefined ? (
        <p className={estilos.error}>{error}</p>
      ) : hint !== undefined ? (
        <p className={estilos.hint}>{hint}</p>
      ) : null}
    </div>
  );
}
