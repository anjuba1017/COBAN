import estilos from './Selector.module.css';

export interface OpcionSelector {
  valor: string;
  texto: string;
}

export interface SelectorProps {
  label?: string;
  hint?: string;
  opciones: OpcionSelector[];
  valor: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
}

/** `<select>` con el estilo base del original (heredado de base.css). */
export function Selector({
  label,
  hint,
  opciones,
  valor,
  onChange,
  disabled,
  id,
  placeholder,
}: SelectorProps) {
  return (
    <div>
      {label !== undefined && <label htmlFor={id}>{label}</label>}
      <select
        id={id}
        value={valor}
        disabled={disabled}
        onChange={(evento) => onChange(evento.target.value)}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.texto}
          </option>
        ))}
      </select>
      {hint !== undefined && <p className={estilos.hint}>{hint}</p>}
    </div>
  );
}
