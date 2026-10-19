import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  X,
  LoaderCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  TriangleAlert,
  PackageOpen,
  ArrowDownToLine,
} from 'lucide-react';
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLElement>('input,button,select')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      if (e.key === 'Tab') {
        const elements = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]',
        );
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={'modal ' + (wide ? 'wide' : '')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={ref}
      >
        <div className="modal-top">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Status({ value }: { value: string }) {
  const kind = [
    'CONFIRMADA',
    'CONFIRMADO',
    'RECIBIDA',
    'COMPLETADO',
    'ACTIVO',
    'Disponible',
  ].includes(value)
    ? 'good'
    : ['ANULADA', 'ANULADO', 'INACTIVO', 'Agotado', 'Vencido'].includes(value)
      ? 'bad'
      : 'warn';
  return (
    <span className={'badge ' + kind}>
      <i />
      {value.replaceAll('_', ' ').toLowerCase()}
    </span>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} /> Cargando información…
    </div>
  );
}
export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="error-box" role="alert">
      <TriangleAlert size={20} />
      <div>
        <strong>No pudimos cargar esta vista</strong>
        <p>{message}. Comprueba que el backend esté ejecutándose.</p>
        <button className="btn secondary" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    </div>
  );
}
export function Empty({
  title = 'Todavía no hay registros',
  description = 'Las operaciones que realices aparecerán aquí.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty">
      <PackageOpen size={36} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function PageHeader({
  eyebrow = 'ADMINISTRACIÓN',
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="header-actions">{children}</div>
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="search-input">
      <Search size={17} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}
export function DataTable({
  rows,
  columns,
  emptyText = 'No hay registros',
  pageSize = 8,
}: {
  rows: any[];
  columns: { label: string; render: (r: any) => ReactNode }[];
  emptyText?: string;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const max = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, max);
  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice((current - 1) * pageSize, current * pageSize).map((r, i) => (
              <tr key={r.id || i}>
                {columns.map((c, j) => (
                  <td key={j}>{c.render(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty title={emptyText} />}
      </div>
      <div className="table-footer">
        <span>
          {rows.length
            ? `${(current - 1) * pageSize + 1}–${Math.min(current * pageSize, rows.length)} de ${rows.length} registros`
            : '0 registros'}
        </span>
        <div>
          <button
            className="icon-button"
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft size={17} />
          </button>
          <span>
            {current} / {max}
          </span>
          <button
            className="icon-button"
            disabled={current >= max}
            onClick={() => setPage(current + 1)}
            aria-label="Página siguiente"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </>
  );
}
export function downloadCSV(filename: string, rows: any[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const cell = (x: any) => {
    let s = String(x ?? '');
    if (/^[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const csv =
    '\uFEFF' +
    [keys.map(cell).join(','), ...rows.map((r) => keys.map((k) => cell(r[k])).join(','))].join(
      '\r\n',
    );
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
export function ExportButton({ rows, name }: { rows: any[]; name: string }) {
  return (
    <button
      className="btn secondary"
      disabled={!rows.length}
      onClick={() => downloadCSV(name + '.csv', rows)}
    >
      <ArrowDownToLine size={17} />
      Exportar CSV
    </button>
  );
}
