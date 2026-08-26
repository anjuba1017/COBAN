# Coban365 modular simulator

This folder is self-contained and can be copied or shared without the rest of
the COBAN repository.

## Open the simulator

Open `index.html`. It forwards to the generated central simulator in
`html-puntos/index.html`.

## Edit one point

1. Edit only `html-puntos/punto-N.html`.
2. From this folder, run:

```bash
cd html-puntos
node armar.mjs
```

The command rebuilds `html-puntos/index.html` from all registered points.

## Add a point

1. Create `html-puntos/punto-N.html` with one `tab-content` root.
2. Register it in `html-puntos/plantillas.mjs`.
3. Run `node html-puntos/armar.mjs`.

The global tab is generated automatically.

## Contents

- `html-puntos/punto-N.html`: editable point sources.
- `html-puntos/plantillas.mjs`: point registry and navigation order.
- `html-puntos/base-inicio.html`: shared header and styles.
- `html-puntos/base-fin.html`: shared JavaScript and footer.
- `html-puntos/index.html`: generated central simulator.
- `capturas/`: screenshots used by the point files.
