# Imágenes referenciales del catálogo

## Galerías y precios consultados el 14 de noviembre de 2026

Se añadieron nueve imágenes de las fichas de Promart Perú: producto, características y aplicación. Son archivos publicados por la tienda, no imágenes generadas por FerreMax. Algunas vistas de aplicación son ilustraciones comerciales de la fuente.

| Producto y presentación | Precio publicado consultado | Fuente |
| --- | --- | --- |
| Vencedor Supersatinado Blanco Decorativo, 1 galón | S/ 105,00 | [Promart](https://www.promart.pe/vencedor-satinado-blanco-1-galon/p) |
| Sikacryl-200, 300 ml | S/ 35,50 | [Promart](https://www.promart.pe/sellante-acrilico-sikacryl-200-x-300-ml/p) |
| Cemento Sol Portland Tipo I, 42,5 kg | S/ 30,90 | [Promart](https://www.promart.pe/cemento-portland-tipo-i-x42-5kg-sol/p) |

Precios obtenidos del campo público `commertialOffer.Price` de la API de catálogo de Promart, sin aplicar tarjetas ni cupones. Pueden cambiar según ubicación, promoción y disponibilidad; no incluyen envío. No se asegura vigencia futura. Los demás precios del demo continúan siendo referenciales.

Las URLs exactas de las nueve imágenes, las fichas y los importes en céntimos quedan registradas en `frontend/src/data/catalog-references.json`. Los archivos locales usan los prefijos `paint-vencedor-promart-`, `sealant-sika-promart-` y `cement-sol-promart-`. Las fichas de FerreMax muestran la referencia externa separada del precio administrable de venta.

Los nuevos seeds incorporan estos importes. Para actualizar una instalación MySQL existente: `node scripts/apply-reference-prices.mjs`. El script solo sustituye los precios originales del demo de esos productos; conserva precios personalizados y todo el historial. En JSON existente, actualizar los precios desde Productos en el panel.

## Galería añadida el 14 de noviembre de 2026

- `drill-kit-bosch.png`: fotografía oficial del conjunto GSB 185-LI; medio `363999-54/scope-of-supply-image`.
- `drill-dimensions-bosch.jpg`: imagen técnica de dimensiones; medio `371206-117/dimensional-drawing-image`.

Fuente: [Bosch Professional Perú](https://www.bosch-professional.com/pe/es/products/gsb-185-li-06019K31E4). Descargadas de la página oficial e inspeccionadas visualmente. La galería permite alternar producto, conjunto, dimensiones y aplicación. Son referencias de una variante; la tienda debe confirmar las características del producto real. No se generaron imágenes con IA.

## Fotografías de aplicación añadidas el 12 de octubre de 2026

- `drill-workshop.jpg`: profesional perforando ladrillo, medio Bosch `370217-117`.
- `drill-masonry.jpg`: profesional instalando una estructura, medio Bosch `370219-117`.

Ambas proceden de [Bosch Professional Perú, GSB 185-LI](https://www.bosch-professional.com/pe/es/products/gsb-185-li-06019K31E4). Se usan únicamente como referencia del demo. No representan personal, instalaciones o proyectos propios de FerreMax. Se descartó y eliminó la descarga `370218-117` al observar una etiqueta de imagen generada por IA.


Las fotografías de producto incluidas en `frontend/public/images/reference/` se usan únicamente para la demostración local de FerreMax. No implican afiliación, distribución autorizada ni disponibilidad comercial. Antes de publicar la tienda, deben reemplazarse por archivos autorizados por los proveedores del negocio.

| Archivo | Producto mostrado | Fuente consultada |
| --- | --- | --- |
| `drill-bosch.jpg` | Taladro Bosch GSB 185-LI | [Sodimac Perú](https://www.sodimac.com.pe/sodimac-pe/articulo/131701102/Taladro-percutor-Bosch-GSB-185-LI-18V-%2B-1-Bateria-18V-GBA-2.0Ah-%2B-23-accesorios/131701108) |
| `paint-vencedor.jpg` | Pintura Vencedor 1 galón | [Sodimac Perú](https://www.sodimac.com.pe/sodimac-pe/articulo/113326524/Pintura-Vencedor-SuperSatinado-Blanco-1GL/113326525) |
| `tools-stanley.jpg` | Set Stanley 120 piezas | [Sodimac Perú](https://www.sodimac.com.pe/sodimac-pe/articulo/113087334/set-de-herramientas-manuales-120-piezas-stanley/113087336) |
| `cable-indeco.jpg` | Cable Indeco NH-90 2.5 mm² | [Sodimac Perú](https://www.sodimac.com.pe/sodimac-pe/articulo/126701454/Cable-NH90-2.5mm-Indeco-X100m-RJ) |
| `faucet-vainsa.jpg` | Grifería Vainsa | [Sodimac Perú](https://www.sodimac.com.pe/sodimac-pe/articulo/113521543/Llave-para-Lavatorio-al-Mueble-Especializada/113521545) |
| `cement-sol.jpg` | Cemento Sol 42.5 kg | [Sodimac Perú](https://www.sodimac.com.pe/sodimac-pe/articulo/113518067/Cemento-Sol-Portland-Tipo-I-42.5-kg) |
| `helmet-steelpro.jpg` | Casco Steelpro | [Promart](https://www.promart.pe/casco-de-seguridad-dielectrico-mountain-steelpro-1001216513/p) |
| `grinder-bosch.jpg` | Amoladora Bosch GWS 850 | [Sodimac Perú](https://www.sodimac.com.pe/sodimac-pe/articulo/114551695/amoladora-angular-bosch-gws-850-850w-3-discos-maletin-de-plastico-combo/114552123) |
| `sealant-sika.jpg` | Sellador Sikacryl 200 | [Sodimac Perú](https://www.sodimac.com.pe/sodimac-pe/articulo/137459634/sellador-acrilico-para-fisuras-y-uniones-Sikacryl-200-blanco-300ml/137459635) |
| `pipe-pavco.jpg` | Tubo Pavco ½ pulgada | [Sodimac Perú](https://www.sodimac.com.pe/sodimac-pe/articulo/113531542/Tubo-PVC-1-2-SP-Agua-Fria/113531547) |
| `gloves-steelpro.jpg` | Guantes Steelpro | [Sodimac Perú](https://www.sodimac.com.pe/sodimac-pe/articulo/153863726/guante-de-nitrilo-puno-tejido-talla-l-steelpro/153863727) |
| `breaker-schneider.jpg` | Interruptor Schneider referencial | [Wikimedia Commons, CC BY-SA](https://commons.wikimedia.org/wiki/File:Schneider_Electric_Double_Single-Pole_15-Amp_Circuit_Breaker_-_Front_and_Back_View.JPG) |

Los nombres, precios, existencias, proveedores, RUC, contactos, compras, lotes y fechas mostrados en el modo demo son ficticios o referenciales. Las fichas técnicas y fechas de vencimiento deben confirmarse con el fabricante y el lote físico.
