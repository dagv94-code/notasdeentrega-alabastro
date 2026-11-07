import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Users, UserCheck, FileText, Download, Plus, 
  Trash2, ChevronRight, CheckCircle2, MapPin, Tag, ArrowLeft,
  History, Wallet, Edit, Share2
} from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyCCj2ZiCj040Wa8aO-NOYe_aSHxGiRtu3U",
  authDomain: "agropecuaria-alabastro.firebaseapp.com",
  projectId: "agropecuaria-alabastro",
  storageBucket: "agropecuaria-alabastro.firebasestorage.app",
  messagingSenderId: "277618306201",
  appId: "1:277618306201:web:c9e63bfe2b3c1264e8dc08",
  measurementId: "G-81TLRYTKFE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'agropecuaria-alabastro';

const DEFAULT_VENDEDORES = [
  { id: 'v1', nombre: 'David Garcia' },
  { id: 'v2', nombre: 'Yennifer Acosta' },
  { id: 'v3', nombre: 'Yulianny Acosta' },
  { id: 'v4', nombre: 'Yonida Barroso' }
];

const DEFAULT_PRODUCTOS = [
  { id: 'p1', codigo: "0001", descripcion: "Cerdo en canal kg", precio: 3 },
  { id: 'p2', codigo: "0002", descripcion: "Chuleta de Lomo kg", precio: 7 },
  { id: 'p3', codigo: "0003", descripcion: "Chuletón de Cerdo kg", precio: 7 },
  { id: 'p4', codigo: "0004", descripcion: "Lomo de Cerdo kg", precio: 10 },
  { id: 'p5', codigo: "0005", descripcion: "Pernil Entero kg", precio: 7 },
  { id: 'p6', codigo: "0006", descripcion: "Costilla de Cerdo kg", precio: 7 },
  { id: 'p7', codigo: "0007", descripcion: "Panceta kg", precio: 7 },
  { id: 'p8', codigo: "0008", descripcion: "Patas de Cerdo kg", precio: 3 },
  { id: 'p9', codigo: "0009", descripcion: "Recortes para Freír kg", precio: 4 }
];

export default function AgropecuariaApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('nueva-nota');
  const [loading, setLoading] = useState(true);

  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState(DEFAULT_PRODUCTOS);
  const [vendedores, setVendedores] = useState(DEFAULT_VENDEDORES);
  const [notas, setNotas] = useState([]);
  
  const [editingNota, setEditingNota] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const basePublicPath = ['artifacts', appId, 'public', 'data'];

    const unsubClientes = onSnapshot(collection(db, ...basePublicPath, 'clientes'), (snap) => {
      const cls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClientes(cls.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    }, (err) => console.log("Clientes locales"));

    const unsubProductos = onSnapshot(collection(db, ...basePublicPath, 'catalogo'), (snap) => {
      const prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (prods.length > 0) {
        setProductos(prods.sort((a, b) => a.codigo.localeCompare(b.codigo)));
      }
    }, (err) => console.log("Catálogo local"));

    const unsubVendedores = onSnapshot(collection(db, ...basePublicPath, 'vendedores'), (snap) => {
      const vends = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (vends.length > 0) {
        setVendedores(vends.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      }
    }, (err) => console.log("Vendedores locales"));

    const unsubNotas = onSnapshot(collection(db, ...basePublicPath, 'notas'), (snap) => {
      setNotas(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    }, (err) => console.log("Notas locales"));

    return () => {
      unsubClientes();
      unsubProductos();
      unsubVendedores();
      unsubNotas();
    };
  }, [user]);

  const handleEditNota = (nota) => {
    setEditingNota(nota);
    setActiveTab('nueva-nota');
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-rose-500 font-bold animate-pulse">Cargando Sistema Alabastro...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-24 selection:bg-rose-500/30">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-600/20 border border-rose-500 flex items-center justify-center text-rose-500 font-black text-lg">A</div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase">
            Distribuidora <span className="text-rose-500">Alabastro</span>
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {activeTab === 'nueva-nota' && <NuevaNotaTab clientes={clientes} productos={productos} vendedores={vendedores} showToast={showToast} db={db} user={user} editingNota={editingNota} setEditingNota={setEditingNota} />}
        {activeTab === 'historial' && <HistorialTab notas={notas} showToast={showToast} db={db} handleEditNota={handleEditNota} />}
        {activeTab === 'cuentas' && <CuentasPorCobrarTab notas={notas} vendedores={vendedores} showToast={showToast} db={db} />}
        {activeTab === 'clientes' && <ClientesTab showToast={showToast} db={db} user={user} clientes={clientes} />}
        {activeTab === 'catalogo' && <CatalogoTab showToast={showToast} db={db} user={user} productos={productos} />}
        {activeTab === 'vendedores' && <VendedoresTab showToast={showToast} db={db} user={user} vendedores={vendedores} />}
      </main>

      <nav className="fixed bottom-0 w-full bg-zinc-900 border-t border-zinc-800 pb-safe overflow-x-auto no-scrollbar">
        <div className="flex justify-between min-w-[600px] p-2 px-4 gap-2 max-w-4xl mx-auto">
          <NavButton icon={<FileText />} label="Nueva Nota" active={activeTab === 'nueva-nota'} onClick={() => { setActiveTab('nueva-nota'); setEditingNota(null); }} />
          <NavButton icon={<History />} label="Historial" active={activeTab === 'historial'} onClick={() => setActiveTab('historial')} />
          <NavButton icon={<Wallet />} label="Cuentas" active={activeTab === 'cuentas'} onClick={() => setActiveTab('cuentas')} />
          <NavButton icon={<Users />} label="Clientes" active={activeTab === 'clientes'} onClick={() => setActiveTab('clientes')} />
          <NavButton icon={<Tag />} label="Catálogo" active={activeTab === 'catalogo'} onClick={() => setActiveTab('catalogo')} />
          <NavButton icon={<UserCheck />} label="Vendedores" active={activeTab === 'vendedores'} onClick={() => setActiveTab('vendedores')} />
        </div>
      </nav>

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold">{toast}</span>
        </div>
      )}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center p-2 rounded-xl transition-all ${active ? 'text-rose-500 scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}>
      <div className="mb-1">{React.cloneElement(icon, { className: 'w-6 h-6' })}</div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function NuevaNotaTab({ clientes, productos, vendedores, showToast, db, user, editingNota, setEditingNota }) {
  const [clienteId, setClienteId] = useState('');
  const [vendedorId, setVendedorId] = useState('');
  const [terminoPago, setTerminoPago] = useState('Contado');
  const [items, setItems] = useState([]);
  const [currProductoId, setCurrProductoId] = useState('');
  const [currPeso, setCurrPeso] = useState('');
  const [isTotalized, setIsTotalized] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (editingNota) {
      setClienteId(editingNota.cliente.id);
      setVendedorId(editingNota.vendedor.id);
      setTerminoPago(editingNota.terminoPago);
      setItems(editingNota.items);
      setIsTotalized(false);
      setReceiptData(null);
    }
  }, [editingNota]);

  const addItem = () => {
    if (!currProductoId || !currPeso) return showToast("Seleccione producto y peso");
    const prod = productos.find(p => p.id === currProductoId);
    if (!prod) return;
    const pesoNum = parseFloat(currPeso);
    if (isNaN(pesoNum) || pesoNum <= 0) return showToast("Peso inválido");

    setItems([...items, {
      id: Date.now().toString(),
      productoId: prod.id,
      codigo: prod.codigo,
      descripcion: prod.descripcion,
      peso: pesoNum,
      precio: parseFloat(prod.precio),
      subtotal: pesoNum * parseFloat(prod.precio)
    }]);
    setCurrProductoId('');
    setCurrPeso('');
  };

  const removeItem = (id) => setItems(items.filter(i => i.id !== id));

  const totalizar = async () => {
    if (!clienteId || !vendedorId || items.length === 0) {
      return showToast("Faltan datos o productos para totalizar");
    }

    setGenerating(true);
    try {
      const cliente = clientes.find(c => c.id === clienteId) || { nombre: 'Cliente General' };
      const vendedor = vendedores.find(v => v.id === vendedorId) || { nombre: 'Vendedor' };
      
      let currentNumber = 1;
      let timestamp = Date.now();

      try {
        const seqRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'secuencia');
        let seqDoc = await getDoc(seqRef);
        if (seqDoc.exists()) {
          const dataVal = seqDoc.data().valor;
          currentNumber = (typeof dataVal === 'number' ? dataVal : parseInt(dataVal) || 0) + 1;
          await updateDoc(seqRef, { valor: currentNumber });
        } else {
          await setDoc(seqRef, { valor: 1 });
          currentNumber = 1;
        }
      } catch (e) {
        currentNumber = Math.floor(Math.random() * 90000) + 10000;
      }

      const total = items.reduce((acc, item) => acc + item.subtotal, 0);
      const dateObj = new Date();
      const fecha8 = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth()+1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;

      const finalReceiptData = {
        numero: currentNumber.toString().padStart(5, '0'),
        fecha: fecha8,
        timestamp: timestamp,
        cliente,
        vendedor,
        terminoPago,
        items,
        total,
        pagado: false,
        estado: 'activo'
      };

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notas'), finalReceiptData);
      showToast("Nota creada y guardada");

      setReceiptData(finalReceiptData);
      setIsTotalized(true);
    } catch (error) {
      console.error(error);
      showToast("Error al guardar nota");
    } finally {
      setGenerating(false);
    }
  };

  const descargarImagen = async () => {
    if (!window.html2canvas) return showToast("Cargando generador...");
    const element = document.getElementById('recibo-final');
    if (!element) return;

    try {
      setGenerating(true);
      const canvas = await window.html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      const link = document.createElement('a');
      link.download = `Recibo_Alabastro_${receiptData.numero}.jpg`;
      link.href = dataUrl;
      link.click();
      showToast("Imagen descargada");
    } catch (e) {
      showToast("Error al generar imagen");
    } finally {
      setGenerating(false);
    }
  };

  const reiniciar = () => {
    setIsTotalized(false);
    setReceiptData(null);
    setItems([]);
    setClienteId('');
  };

  if (isTotalized && receiptData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
          <button onClick={reiniciar} className="flex items-center text-zinc-400 hover:text-white"><ArrowLeft className="w-5 h-5 mr-2" /> Atrás</button>
          <button onClick={descargarImagen} className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl font-bold flex items-center"><Download className="w-5 h-5 mr-2" /> Descargar Recibo</button>
        </div>

        <div className="overflow-x-auto pb-8">
          <div id="recibo-final" className="bg-white text-black p-8 w-[800px] mx-auto shadow-2xl relative" style={{ fontFamily: "Arial, sans-serif" }}>
            <div className="border-b-4 border-rose-600 pb-4 mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black uppercase text-zinc-900">Distribuidora <span className="text-rose-600">Alabastro</span></h1>
                <p className="text-sm text-zinc-500 font-bold mt-1">agropecuarialabastro@gmail.com</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-black text-rose-600">RECIBO DE COMPRA</h2>
                <div className="mt-2 text-lg font-bold">N° {receiptData.numero}</div>
                <div className="text-sm text-zinc-600">FECHA: {receiptData.fecha}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-zinc-50 p-4 rounded-xl border">
                <h3 className="text-xs font-bold text-rose-600 uppercase mb-2">Cliente</h3>
                <p className="font-bold text-lg">{receiptData.cliente.nombre}</p>
              </div>
              <div className="bg-zinc-50 p-4 rounded-xl border">
                <h3 className="text-xs font-bold text-rose-600 uppercase mb-2">Vendedor</h3>
                <p className="font-bold text-lg">{receiptData.vendedor.nombre}</p>
                <p className="text-sm mt-2"><b>Pago:</b> {receiptData.terminoPago}</p>
              </div>
            </div>

            <table className="w-full mb-6 text-sm">
              <thead>
                <tr className="bg-zinc-900 text-white">
                  <th className="py-2 px-3 text-left">COD</th>
                  <th className="py-2 px-3 text-left">DESCRIPCIÓN</th>
                  <th className="py-2 px-3 text-right">PESO</th>
                  <th className="py-2 px-3 text-right">PRECIO</th>
                  <th className="py-2 px-3 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {receiptData.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3">{item.codigo}</td>
                    <td className="py-2 px-3 font-bold">{item.descripcion}</td>
                    <td className="py-2 px-3 text-right">{item.peso.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right">{item.precio.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-bold">{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-6">
              <div className="bg-zinc-100 p-4 rounded-xl border-2 border-rose-600 min-w-[250px] text-right">
                <span className="text-rose-600 font-bold text-lg">TOTAL: </span>
                <span className="text-xl font-black">{receiptData.total.toFixed(2)} REF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
        <h2 className="text-xl font-black flex items-center gap-2 border-b border-zinc-800 pb-3">
          <FileText className="text-rose-500" /> Crear Nota de Entrega
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Cliente</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none">
              <option value="">Seleccione Cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Vendedor</label>
            <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none">
              <option value="">Seleccione Vendedor...</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Condición de Pago</label>
            <div className="flex gap-2 flex-wrap">
              {['Contado', '7 días', '15 días', '30 días'].map(term => (
                <button key={term} onClick={() => setTerminoPago(term)} className={`px-4 py-2 rounded-lg text-sm font-bold flex-1 ${terminoPago === term ? 'bg-rose-600 text-white' : 'bg-zinc-950 border border-zinc-800 text-zinc-400'}`}>
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-zinc-200">Agregar Productos</h3>
        <div className="flex gap-2 flex-col sm:flex-row">
          <select value={currProductoId} onChange={(e) => setCurrProductoId(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none">
            <option value="">Buscar en catálogo...</option>
            {productos.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.descripcion} (${p.precio})</option>)}
          </select>
          
          <div className="flex gap-2">
            <input type="number" step="0.01" placeholder="Peso/Cant" value={currPeso} onChange={(e) => setCurrPeso(e.target.value)} className="w-32 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none" onKeyDown={(e) => e.key === 'Enter' && addItem()} />
            <button onClick={addItem} className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl"><Plus className="w-6 h-6" /></button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mt-6 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-400">
                <tr>
                  <th className="p-3">Producto</th>
                  <th className="p-3 text-right">Peso</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 bg-zinc-900/50">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="p-3 font-bold text-zinc-200">{item.descripcion}</td>
                    <td className="p-3 text-right">{item.peso}</td>
                    <td className="p-3 text-right font-bold text-rose-400">${item.subtotal.toFixed(2)}</td>
                    <td className="p-3"><button onClick={() => removeItem(item.id)} className="text-zinc-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <button onClick={totalizar} disabled={generating} className="w-full bg-rose-600 hover:bg-rose-500 text-white p-4 rounded-2xl font-black text-lg uppercase">
          {generating ? 'Procesando...' : 'Totalizar y Generar Recibo'}
        </button>
      )}
    </div>
  );
}

function HistorialTab({ notas }) {
  return (
    <div className="space-y-4 pb-10">
      <h2 className="text-xl font-black border-b border-zinc-800 pb-3">Historial de Notas</h2>
      {notas.length === 0 && <div className="text-center text-zinc-500 py-10">No hay notas registradas todavía.</div>}
      <div className="grid gap-4">
        {notas.map(nota => (
          <div key={nota.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
            <div>
              <span className="font-mono text-rose-500 font-bold">#{nota.numero}</span> <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded">{nota.fecha}</span>
              <h3 className="font-bold text-lg">{nota.cliente?.nombre}</h3>
            </div>
            <div className="text-xl font-black">${parseFloat(nota.total).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CuentasPorCobrarTab() {
  return <div className="p-5 text-center text-zinc-400">Módulo de Cuentas por Cobrar Activo</div>;
}

function ClientesTab({ showToast, db, clientes }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  const addCliente = async (e) => {
    e.preventDefault();
    if(!nombre.trim()) return showToast("Nombre requerido");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'clientes'), {
        nombre: nombre.trim(), telefono: telefono.trim(), direccion: direccion.trim(), creado: serverTimestamp()
      });
      setNombre(''); setTelefono(''); setDireccion('');
      showToast("Cliente guardado en la nube");
    } catch(e) { showToast("Error al guardar cliente"); }
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cliente repetido?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clientes', id));
      showToast("Cliente eliminado con éxito");
    } catch (e) {
      showToast("Error al eliminar");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={addCliente} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-4">
        <h2 className="text-xl font-black">Nuevo Cliente</h2>
        <input placeholder="Nombre y Apellido" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white" />
        <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white" />
        <textarea placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} rows="2" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white resize-none" />
        <button type="submit" className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl">Guardar Cliente</button>
      </form>

      <div className="space-y-3">
        <h3 className="font-bold text-zinc-400 uppercase text-xs">Clientes Registrados ({clientes.length})</h3>
        {clientes.map(c => (
          <div key={c.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
            <div>
              <div className="font-bold text-white text-lg">{c.nombre}</div>
              <div className="text-sm text-zinc-400">{c.telefono} • {c.direccion}</div>
            </div>
            <button onClick={() => eliminarCliente(c.id)} className="p-2 bg-zinc-800 hover:bg-red-900/50 text-red-500 rounded-lg transition-all" title="Eliminar cliente">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {clientes.length === 0 && <div className="text-center text-zinc-500 py-4">No hay clientes aún.</div>}
      </div>
    </div>
  );
}

function CatalogoTab({ productos }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-zinc-400 uppercase text-xs">Catálogo de Productos</h3>
      {productos.map(p => (
        <div key={p.id} className="bg-zinc-900 p-3 rounded-xl border flex justify-between items-center">
          <span className="bg-zinc-800 text-xs px-2 py-1 rounded">{p.codigo}</span>
          <span className="font-bold">{p.descripcion}</span>
          <span className="text-rose-500 font-black">${parseFloat(p.precio).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

function VendedoresTab({ vendedores }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {vendedores.map(v => (
        <div key={v.id} className="bg-zinc-900 p-4 rounded-xl border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-600/20 flex items-center justify-center text-rose-500 font-bold">{v.nombre.charAt(0)}</div>
          <span className="font-bold">{v.nombre}</span>
        </div>
      ))}
    </div>
  );
}
