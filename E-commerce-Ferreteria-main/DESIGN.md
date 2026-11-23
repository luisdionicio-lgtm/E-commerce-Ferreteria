# Sistema visual de FerreMax

Identidad existente: ferretería de portafolio, con fotografía comercial de referencia, grafito, naranja y superficies cálidas. La tienda ayuda a elegir productos y preparar un pedido; el panel prioriza lectura de datos y operaciones.

- Tokens compartidos: `tokens.css`. Refinamiento de componentes y contraste: `frontend/src/styles/ui-refinement.css`, cargado después de los estilos históricos.
- Títulos de portada: Barlow Condensed 600/700. Texto e interfaz: Source Sans 3 400–700. Archivos locales con licencias OFL.
- Fondo claro `#f5f3ed`, superficie blanca, texto `#19241f`, texto secundario `#526057`. Acción naranja `#b74412` con blanco. Sobre grafito, usar texto claro y acento `#ffab73`.
- Jerarquía: una acción principal por grupo; acciones de sesión separadas de compra y administración. Iconos Lucide, foco visible, tablas con cifras tabulares.
- Cuenta: perfil lateral y espacio de compra en escritorio; bloques apilados en móvil. El rol determina si aparece el acceso administrativo.
- Pedidos: navegación de cuenta, filas con fotografías y totales, detalle con seguimiento y pago separado. Yape utiliza su icono oficial y acento púrpura `#5c2677`; el aviso demo es explícito en todas las pantallas de pago. Estados y acciones no dependen solo del color.
- Mantener las fuentes de imagen y los precios consultados, los estados de carga/error/vacío, las restricciones por rol y los controles reales. No añadir métricas, entregas o beneficios que no existan.
- Verificación visual acotada a escritorio y móvil, pruebas de contraste y flujos funcionales. Evidencia en `docs/UI_REFINAMIENTO.md`.
