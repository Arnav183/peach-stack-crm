import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Plus, Phone, Mail, Tag, Trash2, CheckCircle } from 'lucide-react';

const tok = () => localStorage.getItem('token');
const api = (path: string, opts?: RequestInit) =>
  fetch('/api' + path, { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() }, ...opts }).then(r => r.json());

const BADGE: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  requested: 'bg-purple-100 text-purple-700',
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [tab, setTab] = useState<'overview'|'appointments'|'invoices'>('overview');
  const [loading, setLoading] = useState(true);
  const [newAppt, setNewAppt] = useState(false);
  const [newInv, setNewInv] = useState(false);
  const [apptForm, setApptForm] = useState({ service:'', date:'', time:'', notes:'' });
  const [invForm, setInvForm] = useState({ amount:'', description:'', due_date:'' });

  useEffect(() => {
    Promise.all([
      api('/clients/' + id),
      api('/appointments?client_id=' + id),
      api('/invoices?client_id=' + id),
    ]).then(([c, a, inv]) => {
      setClient(c); setForm(c);
      setAppointments(Array.isArray(a) ? a.filter((x:any) => String(x.client_id) === id) : []);
      setInvoices(Array.isArray(inv) ? inv.filter((x:any) => String(x.client_id) === id) : []);
    }).finally(() => setLoading(false));
  }, [id]);

  async function saveClient() {
    const u = await api('/clients/' + id, { method:'PUT', body: JSON.stringify(form) });
    setClient(u); setEditing(false);
  }
  async function deleteClient() {
    if (!confirm('Delete this client and all their data? This cannot be undone.')) return;
    await api('/clients/' + id, { method:'DELETE' });
    navigate('/clients');
  }
  async function addAppt() {
    const a = await api('/appointments', { method:'POST', body: JSON.stringify({ ...apptForm, client_id: Number(id), client_name: client.name, status:'scheduled' }) });
    setAppointments(p => [a,...p]); setNewAppt(false); setApptForm({ service:'', date:'', time:'', notes:'' });
  }
  async function addInv() {
    const i = await api('/invoices', { method:'POST', body: JSON.stringify({ ...invForm, client_id: Number(id), client_name: client.name }) });
    setInvoices(p => [i,...p]); setNewInv(false); setInvForm({ amount:'', description:'', due_date:'' });
  }
  async function markPaid(invId: number, inv: any) {
    const u = await api('/invoices/' + invId, { method:'PUT', body: JSON.stringify({ ...inv, status:'paid', paid_date: new Date().toISOString().split('T')[0] }) });
    setInvoices(p => p.map(i => i.id === u.id ? u : i));
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>;
  if (!client) return <div className="p-8 text-red-400 text-sm">Client not found</div>;

  const totalRevenue = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+Number(i.amount),0);
  const totalOwed    = invoices.filter(i=>i.status!=='paid').reduce((s,i)=>s+Number(i.amount),0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/clients')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          {editing
            ? <input className="text-2xl font-bold border-b-2 border-orange-400 outline-none bg-transparent w-full" value={form.name} onChange={e=>setForm((p:any)=>({...p,name:e.target.value}))} />
            : <h1 className="text-2xl font-bold text-gray-900 truncate">{client.name}</h1>}
          <p className="text-gray-400 text-xs mt-0.5">Client since {new Date(client.created_at).toLocaleDateString('en-US',{month:'long',year:'numeric'})}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {editing ? (
            <>
              <button onClick={saveClient} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-2 rounded-lg"><Save size={14}/> Save</button>
              <button onClick={()=>setEditing(false)} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg"><X size={14}/> Cancel</button>
            </>
          ) : (
            <>
              <button onClick={()=>setEditing(true)} className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg"><Edit2 size={14}/> Edit</button>
              <button onClick={deleteClient} className="flex items-center gap-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-500 text-xs font-semibold px-3 py-2 rounded-lg"><Trash2 size={14}/> Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Total Visits</div>
          <div className="text-2xl font-bold text-gray-900">{appointments.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Revenue Collected</div>
          <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Outstanding</div>
          <div className="text-2xl font-bold text-yellow-600">${totalOwed.toFixed(2)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {(['overview','appointments','invoices'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${tab===t?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab==='overview' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {([['email','Email',Mail,'email'],['phone','Phone',Phone,'tel'],['tags','Tags / Labels',Tag,'text']] as const).map(([key,label,Icon,type])=>(
              <div key={key}>
                <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1"><Icon size={11}/>{label}</label>
                {editing
                  ? <input type={type} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={form[key]||''} onChange={e=>setForm((p:any)=>({...p,[key]:e.target.value}))} />
                  : <p className="text-sm text-gray-800">{client[key] || <span className="text-gray-400 italic text-xs">Not set</span>}</p>}
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
              {editing
                ? <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={form.notes||''} onChange={e=>setForm((p:any)=>({...p,notes:e.target.value}))}/>
                : <p className="text-sm text-gray-800 whitespace-pre-wrap">{client.notes || <span className="text-gray-400 italic text-xs">No notes</span>}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Appointments */}
      {tab==='appointments' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Appointments</h2>
            <button onClick={()=>setNewAppt(true)} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"><Plus size={13}/> New</button>
          </div>
          {newAppt && (
            <div className="p-4 border-b border-gray-50 bg-orange-50 grid grid-cols-2 gap-3">
              {([['service','Service','text'],['date','Date','date'],['time','Time','text'],['notes','Notes','text']] as const).map(([k,l,t])=>(
                <div key={k}><label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label>
                <input type={t} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={(apptForm as any)[k]} onChange={e=>setApptForm(p=>({...p,[k]:e.target.value}))}/></div>
              ))}
              <div className="col-span-2 flex gap-2">
                <button onClick={addAppt} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg">Add</button>
                <button onClick={()=>setNewAppt(false)} className="bg-white border border-gray-200 text-gray-600 text-xs font-semibold px-4 py-1.5 rounded-lg">Cancel</button>
              </div>
            </div>
          )}
          <div className="divide-y divide-gray-50">
            {appointments.length===0 && <p className="p-6 text-center text-sm text-gray-400">No appointments yet</p>}
            {appointments.map(a=>(
              <div key={a.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-blue-600">{a.date?.slice(5).replace('-','/')}</div>
                <div className="flex-1 min-w-0"><div className="text-sm font-medium text-gray-900">{a.service}</div><div className="text-xs text-gray-400">{a.time}</div></div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[a.status]||'bg-gray-100 text-gray-600'}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices */}
      {tab==='invoices' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Invoices</h2>
            <button onClick={()=>setNewInv(true)} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"><Plus size={13}/> New</button>
          </div>
          {newInv && (
            <div className="p-4 border-b border-gray-50 bg-orange-50 grid grid-cols-2 gap-3">
              {([['amount','Amount ($)','number'],['description','Description','text'],['due_date','Due Date','date']] as const).map(([k,l,t])=>(
                <div key={k}><label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label>
                <input type={t} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" value={(invForm as any)[k]} onChange={e=>setInvForm(p=>({...p,[k]:e.target.value}))}/></div>
              ))}
              <div className="col-span-2 flex gap-2">
                <button onClick={addInv} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg">Add</button>
                <button onClick={()=>setNewInv(false)} className="bg-white border border-gray-200 text-gray-600 text-xs font-semibold px-4 py-1.5 rounded-lg">Cancel</button>
              </div>
            </div>
          )}
          <div className="divide-y divide-gray-50">
            {invoices.length===0 && <p className="p-6 text-center text-sm text-gray-400">No invoices yet</p>}
            {invoices.map(inv=>(
              <div key={inv.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{inv.description||'Invoice #'+inv.id}</div>
                  <div className="text-xs text-gray-400">{inv.due_date?'Due '+inv.due_date:'No due date'}{inv.paid_date?' · Paid '+inv.paid_date:''}</div>
                </div>
                <div className="font-semibold text-gray-900 text-sm">${Number(inv.amount).toFixed(2)}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[inv.status]||'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
                {inv.status!=='paid' && (
                  <button onClick={()=>markPaid(inv.id,inv)} className="flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold px-2.5 py-1 rounded-lg"><CheckCircle size={11}/> Paid</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
