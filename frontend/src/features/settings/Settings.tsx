import { useEffect, useState } from 'react';
import { Save, Store, ShieldCheck, Database } from 'lucide-react';
import { useResource, useApp } from '../../app/context';
import { Fields } from '../admin/Entities';
import { PageHeader, Loading, ErrorBox, DataTable } from '../../components/ui';
import { send } from '../../services/api';
import { toast } from 'sonner';
export default function Settings() {
  const { data, loading, error } = useResource('/admin/settings');
  const { data: audit } = useResource<any[]>('/admin/audit');
  const { user, reload } = useApp();
  const [form, setForm] = useState<any>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);
  if (user.role !== 'ADMIN') return <ErrorBox message="Requiere administrador" />;
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  return (
    <>
      <PageHeader title="Configuración" subtitle="Los detalles que hacen a FerreMax tu negocio." />
      <div className="settings-layout">
        <section className="panel settings-form">
          <div className="panel-heading">
            <span className="settings-icon">
              <Store size={23} />
            </span>
            <div>
              <h3>Datos de la tienda</h3>
              <p>Se reflejan en la tienda pública</p>
            </div>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                const { id, ...body } = form;
                await send('/admin/settings', body, 'PATCH');
                toast.success('Configuración guardada');
                reload();
              } catch (e: any) {
                toast.error(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Fields
              fields={[
                { key: 'name', label: 'Nombre comercial' },
                { key: 'phone', label: 'Celular (solo dígitos)' },
                { key: 'email', label: 'Correo de contacto', type: 'email' },
                { key: 'address', label: 'Dirección' },
                {
                  key: 'currency',
                  label: 'Moneda',
                  options: [{ value: 'PEN', label: 'Soles peruanos (PEN)' }],
                },
              ]}
              form={form}
              setForm={setForm}
            />
            <div className="form-actions">
              <button className="btn primary" disabled={busy}>
                <Save size={17} />
                {busy ? 'Guardando…' : 'Guardar configuración'}
              </button>
            </div>
          </form>
        </section>
        <aside className="settings-notes">
          <div>
            <ShieldCheck size={24} />
            <h3>Acceso por roles</h3>
            <p>
              Los permisos se validan en el servidor. Solo administradores pueden editar el
              catálogo, usuarios y configuración.
            </p>
          </div>
          <div>
            <Database size={24} />
            <h3>Tus datos permanecen</h3>
            <p>
              En demo se guardan en backend/data/store.json. Puedes activar MySQL siguiendo el
              README.
            </p>
          </div>
        </aside>
      </div>
      <section className="panel report-table">
        <div className="panel-heading">
          <div>
            <h3>Actividad administrativa</h3>
            <p>Historial de cambios del catálogo y ajustes</p>
          </div>
        </div>
        <DataTable
          rows={audit || []}
          columns={[
            { label: 'Fecha', render: (r: any) => new Date(r.createdAt).toLocaleString('es-PE') },
            { label: 'Acción', render: (r: any) => r.action },
            { label: 'Módulo', render: (r: any) => r.entity },
            { label: 'Usuario', render: (r: any) => r.userId },
            {
              label: 'Registro',
              render: (r: any) => <span className="mono">{r.entityId.slice(0, 12)}</span>,
            },
          ]}
        />
      </section>
    </>
  );
}
