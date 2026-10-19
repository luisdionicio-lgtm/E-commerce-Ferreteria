import { useState } from 'react';
import {
  Plus,
  Pencil,
  Archive,
  Package,
  Users,
  Truck,
  Tags,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { useApp, useResource, money, dateLabel } from '../../app/context';
import {
  PageHeader,
  DataTable,
  Loading,
  ErrorBox,
  SearchInput,
  Modal,
  Status,
  ExportButton,
} from '../../components/ui';
import { api, send } from '../../services/api';
import { toast } from 'sonner';
type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
};
const configs: Record<string, any> = {
  productos: {
    api: 'products',
    title: 'Productos',
    sub: 'Un catálogo ordenado, listo para vender.',
    singular: 'producto',
    Icon: Package,
    fields: [
      ['name', 'Nombre del producto'],
      ['sku', 'Código SKU'],
      ['brand', 'Marca'],
      ['categoryId', 'Categoría', 'category'],
      ['price', 'Precio de venta (S/)', 'money'],
      ['minStock', 'Stock mínimo', 'number'],
      ['unit', 'Unidad de medida'],
      ['image', 'Foto referencial', 'image'],
      ['description', 'Descripción'],
      ['active', 'Producto activo', 'checkbox'],
      ['featured', 'Destacar en tienda', 'checkbox'],
    ],
    defaults: {
      name: '',
      sku: '',
      brand: '',
      categoryId: 'cat-1',
      price: 0,
      minStock: 5,
      unit: 'unidad',
      image: '/images/reference/drill-bosch.jpg',
      description: '',
      active: true,
      featured: false,
    },
  },
  categorias: {
    api: 'categories',
    title: 'Categorías',
    sub: 'Agrupa tus productos para encontrarlos con facilidad.',
    singular: 'categoría',
    Icon: Tags,
    fields: [
      ['name', 'Nombre'],
      ['active', 'Categoría activa', 'checkbox'],
    ],
    defaults: { name: '', active: true },
  },
  proveedores: {
    api: 'suppliers',
    title: 'Proveedores',
    sub: 'Tus aliados para mantener el negocio abastecido.',
    singular: 'proveedor',
    Icon: Truck,
    fields: [
      ['name', 'Razón social'],
      ['ruc', 'RUC (11 dígitos)'],
      ['contact', 'Persona de contacto'],
      ['phone', 'Teléfono'],
      ['email', 'Correo electrónico', 'email'],
      ['active', 'Proveedor activo', 'checkbox'],
    ],
    defaults: { name: '', ruc: '', contact: '', phone: '', email: '', active: true },
  },
  clientes: {
    api: 'customers',
    title: 'Clientes',
    sub: 'Conoce a quienes construyen contigo.',
    singular: 'cliente',
    Icon: Users,
    fields: [
      ['name', 'Nombre o razón social'],
      ['document', 'DNI o RUC'],
      ['phone', 'Teléfono'],
      ['email', 'Correo electrónico', 'email'],
      ['active', 'Cliente activo', 'checkbox'],
    ],
    defaults: { name: '', document: '', phone: '', email: '', active: true },
  },
  renovaciones: {
    api: 'renewals',
    title: 'Renovaciones',
    sub: 'Fechas importantes que merecen estar bajo control.',
    singular: 'renovación',
    Icon: Clock,
    fields: [
      ['name', 'Documento o mantenimiento'],
      ['dueDate', 'Próxima fecha', 'date'],
      ['responsible', 'Responsable'],
      ['status', 'Estado', 'renewal-status'],
      ['notes', 'Notas', 'textarea'],
    ],
    defaults: {
      name: '',
      dueDate: new Date().toISOString().slice(0, 10),
      responsible: '',
      status: 'PENDIENTE',
      notes: '',
    },
  },
  usuarios: {
    api: 'users',
    title: 'Usuarios',
    sub: 'El acceso correcto para cada persona de tu equipo.',
    singular: 'usuario',
    Icon: ShieldCheck,
    fields: [
      ['name', 'Nombre completo'],
      ['email', 'Correo electrónico', 'email'],
      ['role', 'Rol', 'role'],
      ['password', 'Contraseña (mínimo 10 caracteres)', 'password'],
      ['active', 'Acceso activo', 'checkbox'],
    ],
    defaults: { name: '', email: '', role: 'EMPLOYEE', password: '', active: true },
  },
};
const productPhotos = [
  ['drill-bosch', 'Taladro Bosch'],
  ['paint-vencedor', 'Pintura Vencedor'],
  ['tools-stanley', 'Herramientas Stanley'],
  ['cable-indeco', 'Cable Indeco'],
  ['faucet-vainsa', 'Grifería Vainsa'],
  ['cement-sol', 'Cemento Sol'],
  ['helmet-steelpro', 'Casco Steelpro'],
  ['grinder-bosch', 'Amoladora Bosch'],
  ['sealant-sika', 'Sellador Sika'],
  ['breaker-schneider', 'Interruptor Schneider'],
  ['pipe-pavco', 'Tubo Pavco'],
  ['gloves-steelpro', 'Guantes Steelpro'],
];
export function Fields({
  fields,
  form,
  setForm,
  editing = false,
}: {
  fields: Field[];
  form: any;
  setForm: (v: any) => void;
  editing?: boolean;
}) {
  return (
    <div className="form-grid">
      {fields.map((f) => (
        <label
          key={f.key}
          className={['textarea', 'checkbox'].includes(f.type || '') ? 'span-2' : ''}
        >
          {f.type === 'checkbox' ? (
            <span className="checkbox">
              <input
                type="checkbox"
                checked={Boolean(form[f.key])}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
              />
              {f.label}
            </span>
          ) : (
            <>
              {f.label}
              {f.type === 'textarea' ? (
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={form[f.key] || ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              ) : f.options ? (
                <select
                  value={form[f.key] || ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  required
                >
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={form[f.key] ?? ''}
                  type={f.type === 'money' ? 'number' : f.type || 'text'}
                  min={f.type === 'money' || f.type === 'number' ? 0 : undefined}
                  step={f.type === 'money' ? '0.01' : f.type === 'number' ? '1' : undefined}
                  minLength={f.type === 'password' ? 10 : undefined}
                  maxLength={f.type === 'password' ? 128 : 180}
                  required={f.type === 'password' ? !editing : f.required !== false}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )}
            </>
          )}
        </label>
      ))}
    </div>
  );
}
export default function Entities({ module }: { module: string }) {
  const config = configs[module];
  const { user, reload } = useApp();
  const { data, loading, error } = useResource<any[]>('/admin/' + config.api);
  const { data: categories } = useResource<any[]>('/admin/categories');
  const [term, setTerm] = useState('');
  const [state, setState] = useState('all');
  const [editing, setEditing] = useState<any>(undefined);
  const [form, setForm] = useState<any>({});
  const [confirm, setConfirm] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const canEdit = user.role === 'ADMIN';
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  const rows = (data || []).filter(
    (x) =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(x).filter(([k]) => !['image', 'description'].includes(k)),
        ),
      )
        .toLowerCase()
        .includes(term.toLowerCase()) &&
      (state === 'all' || (state === 'active' ? x.active !== false : x.active === false)),
  );
  const fields: Field[] = config.fields.map(([key, label, type]: string[]) => ({
    key,
    label,
    type: ['category', 'image', 'role', 'renewal-status'].includes(type) ? 'select' : type,
    options:
      type === 'category'
        ? (categories || []).map((c) => ({ value: c.id, label: c.name }))
        : type === 'image'
          ? productPhotos.map(([file, name]) => ({
              value: '/images/reference/' + file + '.jpg',
              label: name,
            }))
          : type === 'role'
            ? [
                { value: 'ADMIN', label: 'Administrador' },
                { value: 'EMPLOYEE', label: 'Empleado' },
              ]
            : type === 'renewal-status'
              ? [
                  { value: 'PENDIENTE', label: 'Pendiente' },
                  { value: 'COMPLETADO', label: 'Completado' },
                ]
              : undefined,
  }));
  const open = (row: any = null) => {
    setEditing(row);
    setForm(
      row
        ? { ...row, price: row.price !== undefined ? row.price / 100 : undefined, password: '' }
        : { ...config.defaults, price: 0 },
    );
    setFormError('');
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const body = Object.fromEntries(
        config.fields.map(([key, type]: string[]) => [key, form[key]]),
      );
      if (module === 'productos') {
        body.price = Math.round(Number(form.price) * 100);
        body.minStock = Number(form.minStock);
      }
      if (module === 'usuarios' && !body.password) delete body.password;
      await send(
        '/admin/' + config.api + (editing ? '/' + editing.id : ''),
        body,
        editing ? 'PATCH' : 'POST',
      );
      toast.success(editing ? 'Cambios guardados' : 'Registro creado');
      setEditing(undefined);
      reload();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setBusy(false);
    }
  };
  let columns: any[] = [
    {
      label: 'Nombre',
      render: (r: any) => (
        <div className="entity-name">
          <span className="entity-avatar">{r.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{r.name}</strong>
            <small>{r.email || r.contact || ''}</small>
          </div>
        </div>
      ),
    },
  ];
  if (module === 'productos')
    columns = [
      {
        label: 'Producto',
        render: (r: any) => (
          <div className="product-cell">
            <img src={r.image} alt="" />
            <div>
              <strong>{r.name}</strong>
              <small>
                {r.sku} · {r.brand}
              </small>
            </div>
          </div>
        ),
      },
      {
        label: 'Categoría',
        render: (r: any) => <span className="category-badge">{r.category}</span>,
      },
      { label: 'Precio', render: (r: any) => <strong>{money(r.price)}</strong> },
      {
        label: 'Stock vendible',
        render: (r: any) => (
          <span className={'stock-number ' + (r.availableStock <= r.minStock ? 'low' : '')}>
            {r.availableStock}
            <small> / mín. {r.minStock}</small>
          </span>
        ),
      },
    ];
  if (module === 'proveedores')
    columns.push(
      { label: 'RUC', render: (r: any) => <span className="mono">{r.ruc}</span> },
      { label: 'Teléfono', render: (r: any) => r.phone },
    );
  if (module === 'clientes')
    columns.push(
      { label: 'DNI / RUC', render: (r: any) => <span className="mono">{r.document}</span> },
      { label: 'Teléfono', render: (r: any) => r.phone },
    );
  if (module === 'renovaciones')
    columns.push(
      { label: 'Próxima fecha', render: (r: any) => dateLabel(r.dueDate) },
      { label: 'Responsable', render: (r: any) => r.responsible },
    );
  if (module === 'usuarios')
    columns.push({
      label: 'Rol',
      render: (r: any) => (
        <span className="category-badge">{r.role === 'ADMIN' ? 'Administrador' : 'Empleado'}</span>
      ),
    });
  columns.push({
    label: 'Estado',
    render: (r: any) => <Status value={r.status || (r.active ? 'ACTIVO' : 'INACTIVO')} />,
  });
  if (canEdit)
    columns.push({
      label: 'Acciones',
      render: (r: any) => (
        <div className="row-actions">
          <button className="icon-button" onClick={() => open(r)} aria-label={'Editar ' + r.name}>
            <Pencil size={16} />
          </button>
          <button
            className="icon-button danger"
            onClick={() => setConfirm(r)}
            aria-label={'Desactivar ' + r.name}
          >
            <Archive size={16} />
          </button>
        </div>
      ),
    });
  return (
    <>
      <PageHeader title={config.title} subtitle={config.sub}>
        <ExportButton
          rows={rows.map((r) =>
            Object.fromEntries(
              Object.entries(r).filter(
                ([k]) => !['image', 'passwordHash', 'description'].includes(k),
              ),
            ),
          )}
          name={module}
        />
        {canEdit && (
          <button className="btn primary" onClick={() => open()}>
            <Plus size={17} />
            Añadir {config.singular}
          </button>
        )}
      </PageHeader>
      {module === 'productos' && (
        <div className="mini-stats">
          <div>
            <span>Total de productos</span>
            <strong>{data?.length}</strong>
          </div>
          <div>
            <span>Activos en tienda</span>
            <strong>{data?.filter((x) => x.active).length}</strong>
          </div>
          <div>
            <span>Con stock bajo</span>
            <strong className="orange-text">
              {data?.filter((x) => x.active && x.availableStock <= x.minStock).length}
            </strong>
          </div>
          <div>
            <span>Categorías</span>
            <strong>{categories?.filter((x) => x.active).length}</strong>
          </div>
        </div>
      )}
      <section className="panel entity-panel">
        <div className="table-toolbar">
          <div className="table-tabs">
            <button className={state === 'all' ? 'active' : ''} onClick={() => setState('all')}>
              Todos<span>{data?.length}</span>
            </button>
            {module !== 'renovaciones' && (
              <>
                <button
                  className={state === 'active' ? 'active' : ''}
                  onClick={() => setState('active')}
                >
                  Activos
                </button>
                <button
                  className={state === 'inactive' ? 'active' : ''}
                  onClick={() => setState('inactive')}
                >
                  Inactivos
                </button>
              </>
            )}
          </div>
          <SearchInput
            value={term}
            onChange={setTerm}
            placeholder={'Buscar ' + config.title.toLowerCase() + '…'}
          />
        </div>
        <DataTable rows={rows} columns={columns} />
      </section>
      {editing !== undefined && (
        <Modal
          title={(editing ? 'Editar ' : 'Añadir ') + config.singular}
          onClose={() => !busy && setEditing(undefined)}
        >
          <form onSubmit={save}>
            {module === 'productos' && (
              <div className="form-note">
                El stock se registra al recibir una compra. El vencimiento se asigna a cada lote.
              </div>
            )}
            <Fields fields={fields} form={form} setForm={setForm} editing={Boolean(editing)} />
            {formError && (
              <p className="field-error" role="alert">
                {formError}
              </p>
            )}
            <div className="form-actions">
              <button
                className="btn secondary"
                type="button"
                disabled={busy}
                onClick={() => setEditing(undefined)}
              >
                Cancelar
              </button>
              <button className="btn primary" disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {confirm && (
        <Modal
          title={module === 'renovaciones' ? 'Completar renovación' : 'Desactivar registro'}
          onClose={() => !busy && setConfirm(null)}
        >
          <p className="confirm-copy">
            {module === 'renovaciones' ? 'Se marcará como completado' : 'Se desactivará'}{' '}
            <strong>{confirm.name}</strong>. El historial se conservará.
          </p>
          <div className="form-actions">
            <button className="btn secondary" disabled={busy} onClick={() => setConfirm(null)}>
              Volver
            </button>
            <button
              className="btn primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api('/admin/' + config.api + '/' + confirm.id, { method: 'DELETE' });
                  setConfirm(null);
                  reload();
                  toast.success('Registro actualizado');
                } catch (e: any) {
                  toast.error(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Confirmar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
