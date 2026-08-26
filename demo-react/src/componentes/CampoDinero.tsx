import { useEffect, useState } from 'react';
import estilos from './CampoDinero.module.css';

export interface CampoDineroProps {
  label?: string;
  hint?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Permite valores negativos (p. ej. ajustes/diferencias). Por defecto false. */
  permiteNegativo?: boolean;
  valor: number;
  onChange: (valor: number) => void;
  id?: string;
}

/** Formatea un entero a "1.234.567" (separador de miles con punto, estilo es-CO). */
function formatearMiles(numero: number): string {
  return Math.abs(numero).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

/** Extrae solo dígitos (y el signo si aplica) del texto digitado por el usuario. */
function extraerNumero(textoCrudo: string, permiteNegativo: boolean): number {
  const esNegativo = permiteNegativo && textoCrudo.trim().startsWith('-');
  const soloDigitos = textoCrudo.replace(/[^0-9]/g, '');
  const magnitud = soloDigitos === '' ? 0 : parseInt(soloDigitos, 10);
  return esNegativo ? -magnitud : magnitud;
}

/**
 * Input controlado de dinero: muestra "$ 1.234.567" mientras se escribe y
 * emite el número plano al padre. Es el componente más usado de la demo.
 */
export function CampoDinero({
  label,
  hint,
  disabled,
  placeholder,
  permiteNegativo = false,
  valor,
  onChange,
  id,
}: CampoDineroProps) {
  const [texto, setTexto] = useState(() => (valor ? `$ ${formatearMiles(valor)}` : ''));

  // Si el padre cambia `valor` externamente (reset, recálculo), resincroniza el texto.
  useEffect(() => {
    const formateado = valor ? `$ ${valor < 0 ? '-' : ''}${formatearMiles(valor)}` : '';
    setTexto(formateado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  function manejarCambio(evento: React.ChangeEvent<HTMLInputElement>) {
    const numero = extraerNumero(evento.target.value, permiteNegativo);
    const formateado = numero ? `$ ${numero < 0 ? '-' : ''}${formatearMiles(numero)}` : '';
    setTexto(formateado);
    onChange(numero);
  }

  return (
    <div className={estilos.contenedor}>
      {label !== undefined && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        className={estilos.input}
        value={texto}
        onChange={manejarCambio}
        disabled={disabled}
        placeholder={placeholder ?? '$ 0'}
      />
      {hint !== undefined && <p className={estilos.hint}>{hint}</p>}
    </div>
  );
}
