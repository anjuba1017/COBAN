import estilos from './Deslizador.module.css';

const MINIMO = 0;
const MAXIMO = 8;

export interface DeslizadorProps {
  /** Etiqueta a la izquierda (p. ej. el nombre del método de envío). */
  etiqueta?: string;
  valor: number;
  onChange: (valor: number) => void;
  disabled?: boolean;
  id?: string;
}

/** Slider de dispersión 0..8 (×1000) con ticks numerados y chip de valor. */
export function Deslizador({ etiqueta, valor, onChange, disabled, id }: DeslizadorProps) {
  const porcentaje = ((valor - MINIMO) / (MAXIMO - MINIMO)) * 100;
  const ticks = Array.from({ length: MAXIMO - MINIMO + 1 }, (_, indice) => MINIMO + indice);

  return (
    <div className={[estilos.fila, etiqueta === undefined ? estilos.filaSinEtiqueta : ''].join(' ')}>
      {etiqueta !== undefined && <div className={estilos.etiqueta}>{etiqueta}</div>}
      <input
        id={id}
        type="range"
        className={estilos.slider}
        min={MINIMO}
        max={MAXIMO}
        step={1}
        value={valor}
        disabled={disabled}
        style={{ ['--pct' as string]: `${porcentaje}%` }}
        onChange={(evento) => onChange(Number(evento.target.value))}
      />
      <div className={estilos.ticks}>
        {ticks.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      <div className={estilos.chip}>
        {valor}
        <span className={estilos.chipUnidad}>x1000</span>
      </div>
    </div>
  );
}
