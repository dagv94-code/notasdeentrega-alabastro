import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, getDoc, serverTimestamp, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { 
  Users, UserCheck, FileText, Download, Plus, 
  Trash2, ChevronRight, CheckCircle2, MapPin, Tag, ArrowLeft,
  History, Wallet, Edit, Share2, Search, Square, CheckSquare, Ban, Settings, RotateCcw, KeyRound, AlertTriangle, Calendar
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
    if (!document.getElementById('html2canvas-script')) {
      const script = document.createElement('script');
      script.id = 'html2canvas-script';
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

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
      setClientes(cls.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')));
    }, (err) => console.log("Clientes locales"));

    const unsubProductos = onSnapshot(collection(db, ...basePublicPath, 'catalogo'), async (snap) => {
      const prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (prods.length > 0) {
        setProductos(prods.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || '')));
      } else {
        try {
          for (const p of DEFAULT_PRODUCTOS) {
            await addDoc(collection(db, ...basePublicPath, 'catalogo'), { ...p, creado: serverTimestamp() });
          }
        } catch (e) { console.error(e); }
      }
    }, (err) => console.log("Catálogo local"));

    const unsubVendedores = onSnapshot(collection(db, ...basePublicPath, 'vendedores'), async (snap) => {
      const vends = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (vends.length > 0) {
        setVendedores(vends.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')));
      } else {
        try {
          for (const v of DEFAULT_VENDEDORES) {
            await addDoc(collection(db, ...basePublicPath, 'vendedores'), { nombre: v.nombre, creado: serverTimestamp() });
          }
        } catch (e) { console.error(e); }
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-28 selection:bg-rose-500/30">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-600/20 border border-rose-500 flex items-center justify-center text-rose-500 font-black text-lg">A</div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase">
            Agropecuaria <span className="text-rose-500">Alabastro</span>
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {activeTab === 'nueva-nota' && <NuevaNotaTab clientes={clientes} productos={productos} vendedores={vendedores} showToast={showToast} db={db} user={user} editingNota={editingNota} setEditingNota={setEditingNota} setActiveTab={setActiveTab} />}
        {activeTab === 'historial' && <HistorialTab notas={notas} showToast={showToast} db={db} handleEditNota={handleEditNota} />}
        {activeTab === 'cuentas' && <CuentasPorCobrarTab notas={notas} vendedores={vendedores} showToast={showToast} db={db} />}
        {activeTab === 'clientes' && <ClientesTab showToast={showToast} db={db} user={user} clientes={clientes} />}
        {activeTab === 'catalogo' && <CatalogoTab showToast={showToast} db={db} user={user} productos={productos} />}
        {activeTab === 'vendedores' && <VendedoresTab showToast={showToast} db={db} user={user} vendedores={vendedores} />}
        {activeTab === 'configuracion' && <ConfiguracionTab showToast={showToast} />}
        {activeTab === 'reiniciar' && <ReiniciarTab showToast={showToast} db={db} notas={notas} clientes={clientes} productos={productos} vendedores={vendedores} />}
      </main>

      <nav className="fixed bottom-0 w-full bg-zinc-900 border-t border-zinc-800 pb-safe overflow-x-auto no-scrollbar z-20">
        <div className="flex justify-between min-w-[700px] p-2 px-4 gap-1 max-w-4xl mx-auto">
          <NavButton icon={<FileText />} label="Nota" active={activeTab === 'nueva-nota'} onClick={() => { setActiveTab('nueva-nota'); setEditingNota(null); }} />
          <NavButton icon={<History />} label="Historial" active={activeTab === 'historial'} onClick={() => setActiveTab('historial')} />
          <NavButton icon={<Wallet />} label="Cuentas" active={activeTab === 'cuentas'} onClick={() => setActiveTab('cuentas')} />
          <NavButton icon={<Users />} label="Clientes" active={activeTab === 'clientes'} onClick={() => setActiveTab('clientes')} />
          <NavButton icon={<Tag />} label="Catálogo" active={activeTab === 'catalogo'} onClick={() => setActiveTab('catalogo')} />
          <NavButton icon={<UserCheck />} label="Vendedores" active={activeTab === 'vendedores'} onClick={() => setActiveTab('vendedores')} />
          <NavButton icon={<Settings />} label="Clave" active={activeTab === 'configuracion'} onClick={() => setActiveTab('configuracion')} />
          <NavButton icon={<RotateCcw />} label="Reset" active={activeTab === 'reiniciar'} onClick={() => setActiveTab('reiniciar')} />
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
    <button onClick={onClick} className={`flex flex-col items-center p-2 rounded-xl transition-all ${active ? 'text-rose-500 scale-105' : 'text-zinc-500 hover:text-zinc-300'}`}>
      <div className="mb-1">{React.cloneElement(icon, { className: 'w-5 h-5' })}</div>
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function ReciboView({ receiptData }) {
  const calcularFechaVencimientoTexto = (timestamp, termino) => {
    if (termino === 'Contado') return 'Inmediato (Contado)';
    if (termino.startsWith('Fija:')) {
      const parts = termino.split(':');
      if (parts[1]) {
        const [y, m, d] = parts[1].split('-');
        return `${d}/${m}/${y}`;
      }
    }
    const dias = termino === '7 días' ? 7 : termino === '15 días' ? 15 : termino === '30 días' ? 30 : 0;
    if (dias === 0) return 'Inmediato (Contado)';
    const dt = new Date(timestamp);
    dt.setDate(dt.getDate() + dias);
    return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
  };

  return (
    <div id={`recibo-${receiptData.id || 'final'}`} className="bg-white text-black p-8 w-[800px] mx-auto shadow-2xl relative" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="border-b-4 border-rose-600 pb-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase text-zinc-900">Agropecuaria <span className="text-rose-600">Alabastro</span></h1>
          <p className="text-sm text-zinc-500 font-bold mt-1">agropecuarialabastro@gmail.com</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black text-rose-600">NOTA DE ENTREGA</h2>
          <div className="mt-2 text-lg font-bold">N° {receiptData.numero}</div>
          <div className="text-sm text-zinc-600">FECHA: {receiptData.fecha}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-zinc-50 p-4 rounded-xl border">
          <h3 className="text-xs font-bold text-rose-600 uppercase mb-2">Cliente</h3>
          <p className="font-bold text-lg">{receiptData.cliente?.nombre}</p>
          <p className="text-sm text-zinc-600 mt-1">{receiptData.cliente?.telefono}</p>
          <p className="text-sm text-zinc-600">{receiptData.cliente?.direccion}</p>
        </div>
        <div className="bg-zinc-50 p-4 rounded-xl border flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-rose-600 uppercase mb-2">Vendedor</h3>
            <p className="font-bold text-lg">{receiptData.vendedor?.nombre}</p>
          </div>
          <div className="mt-2 pt-2 border-t border-zinc-200">
            <p className="text-xs text-zinc-600"><b>Condición:</b> {receiptData.terminoPago.startsWith('Fija:') ? 'Fecha Específica' : receiptData.terminoPago}</p>
            <p className="text-xs text-rose-600 font-bold mt-1"><b>Fecha de Pago:</b> {calcularFechaVencimientoTexto(receiptData.timestamp, receiptData.terminoPago)}</p>
          </div>
        </div>
      </div>

      <table className="w-full mb-6 text-sm">
        <thead>
          <tr className="bg-zinc-900 text-white">
            <th className="py-2 px-3 text-left">COD</th>
            <th className="py-2 px-3 text-left">DESCRIPCIÓN</th>
            <th className="py-2 px-3 text-right">PESO (KG)</th>
            <th className="py-2 px-3 text-right">PRECIO REF</th>
            <th className="py-2 px-3 text-right">SUBTOTAL REF</th>
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

      <div className="grid grid-cols-2 gap-4 border-t-2 border-dashed border-zinc-300 pt-6 items-center">
        <div className="border border-black text-[10px] leading-tight">
          <div className="bg-black text-white font-bold text-center py-1 uppercase tracking-wider">Medios de Pagos</div>
          <div className="p-2 space-y-1 font-mono">
            <div className="font-bold underline text-zinc-900">PAGO MÓVIL - TRANSFERENCIA</div>
            <div>BANCO: MERCANTIL</div>
            <div>TELEFONO: 0424-656 5520</div>
            <div>CEDULA: 22.362.833</div>
            <div>NRO CUENTA: 01740111471114416694</div>
            <div className="font-bold underline text-zinc-900 mt-2">BINANCE</div>
            <div>CORREO: DAGV94@GMAIL.COM</div>
            <div>BINANCE ID: 1254404157</div>
            <div>DAGV-1994</div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <div className="text-4xl">🐷</div>
          <div className="text-2xl font-black text-amber-900 tracking-wider uppercase" style={{ fontFamily: "Comic Sans MS, cursive, sans-serif" }}>
            ¡GRACIAS <br />POR SU COMPRA!
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] text-zinc-500 border-t mt-4 pt-2 font-bold uppercase">
        Tasa BCV Euro establecida por el Banco Central de Venezuela el día de su cancelación.
      </div>
    </div>
  );
}

function NuevaNotaTab({ clientes, productos, vendedores, showToast, db, user, editingNota, setEditingNota, setActiveTab }) {
  const [clienteId, setClienteId] = useState('');
  const [vendedorId, setVendedorId] = useState('');
  const [terminoPago, setTerminoPago] = useState('Contado');
  const [fechaEspecifica, setFechaEspecifica] = useState('');
  const [items, setItems] = useState([]);
  const [currProductoId, setCurrProductoId] = useState('');
  const [currPeso, setCurrPeso] = useState('');
  const [isTotalized, setIsTotalized] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (editingNota) {
      setClienteId(editingNota.cliente?.id || '');
      setVendedorId(editingNota.vendedor?.id || '');
      if (editingNota.terminoPago && editingNota.terminoPago.startsWith('Fija:')) {
        setTerminoPago('Fija');
        setFechaEspecifica(editingNota.terminoPago.split(':')[1] || '');
      } else {
        setTerminoPago(editingNota.terminoPago || 'Contado');
        setFechaEspecifica('');
      }
      setItems(editingNota.items || []);
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
      codigo: prod.codigo || '0000',
      descripcion: prod.descripcion || 'Producto',
      peso: pesoNum,
      precio: parseFloat(prod.precio || 0),
      subtotal: pesoNum * parseFloat(prod.precio || 0)
    }]);
    setCurrProductoId('');
    setCurrPeso('');
  };

  const removeItem = (id) => setItems(items.filter(i => i.id !== id));

  const totalizar = async () => {
    if (!clienteId || !vendedorId || items.length === 0) {
      return showToast("Faltan datos o productos para totalizar");
    }

    let condicionFinal = terminoPago;
    if (terminoPago === 'Fija') {
      if (!fechaEspecifica) return showToast("Por favor seleccione la fecha de pago específica");
      condicionFinal = `Fija:${fechaEspecifica}`;
    }

    setGenerating(true);
    try {
      const cliente = clientes.find(c => c.id === clienteId) || { nombre: 'Cliente General' };
      const vendedor = vendedores.find(v => v.id === vendedorId) || { nombre: 'Vendedor' };
      
      let currentNumber = 1;
      let timestamp = editingNota ? editingNota.timestamp : Date.now();

      if (!editingNota) {
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
      } else {
        currentNumber = parseInt(editingNota.numero) || 1;
      }

      const total = items.reduce((acc, item) => acc + item.subtotal, 0);
      const dateObj = new Date(timestamp);
      const fecha8 = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth()+1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;

      const finalReceiptData = {
        numero: currentNumber.toString().padStart(5, '0'),
        fecha: fecha8,
        timestamp: timestamp,
        cliente,
        vendedor,
        terminoPago: condicionFinal,
        items,
        total,
        pagado: editingNota ? editingNota.pagado : false,
        estado: editingNota ? editingNota.estado : 'activo'
      };

      if (editingNota) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notas', editingNota.id), finalReceiptData);
        showToast("Nota actualizada correctamente");
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notas'), finalReceiptData);
        showToast("Nota creada y guardada");
      }

      setReceiptData(finalReceiptData);
      setIsTotalized(true);
    } catch (error) {
      console.error(error);
      showToast("Error al procesar nota");
    } finally {
      setGenerating(false);
    }
  };

  const descargarImagen = async (idRecibo = 'recibo-final') => {
    const element = document.getElementById(idRecibo);
    if (!element) return showToast("No se encontró el recibo");

    try {
      setGenerating(true);
      if (!window.html2canvas) {
        showToast("Cargando motor de imágenes...");
        setGenerating(false);
        return;
      }

      const canvas = await window.html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      const link = document.createElement('a');
      link.download = `Nota_Entrega_${receiptData?.numero || 'Alabastro'}.jpg`;
      link.href = dataUrl;
      link.click();
      showToast("Imagen descargada con éxito");
    } catch (e) {
      console.error(e);
      showToast("Error al generar imagen");
    } finally {
      setGenerating(false);
    }
  };

  const compartirWhatsApp = async (notaObj = receiptData) => {
    if (!notaObj) return;
    await descargarImagen('recibo-final');
    window.open('https://api.whatsapp.com/send?phone=', '_blank');
    showToast("Imagen descargada automáticamente. Adjúntala en WhatsApp");
  };

  const reiniciar = () => {
    setIsTotalized(false);
    setReceiptData(null);
    setItems([]);
    setClienteId('');
    setEditingNota(null);
  };

  if (isTotalized && receiptData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center bg-zinc-900 p-4 rounded-2xl border border-zinc-800 gap-3">
          <button onClick={reiniciar} className="flex items-center text-zinc-400 hover:text-white"><ArrowLeft className="w-5 h-5 mr-2" /> Atrás / Nueva Nota</button>
          <div className="flex gap-2">
            <button onClick={() => descargarImagen('recibo-final')} disabled={generating} className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl font-bold flex items-center shadow disabled:opacity-50">
              <Download className="w-5 h-5 mr-2" /> {generating ? 'Generando...' : 'Descargar Imagen'}
            </button>
            <button onClick={() => compartirWhatsApp(receiptData)} disabled={generating} className="bg-[#25D366] hover:bg-[#1ebd5a] text-white px-4 py-2 rounded-xl font-bold flex items-center shadow disabled:opacity-50">
              <Share2 className="w-5 h-5 mr-2" /> WhatsApp
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pb-8">
          <ReciboView receiptData={receiptData} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
        <h2 className="text-xl font-black flex items-center gap-2 border-b border-zinc-800 pb-3">
          <FileText className="text-rose-500" /> {editingNota ? `Editando Nota N° ${editingNota.numero}` : 'Crear Nota de Entrega'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Cliente</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-rose-500">
              <option value="">Seleccione Cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Vendedor</label>
            <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-rose-500">
              <option value="">Seleccione Vendedor...</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Condición de Pago</label>
            <div className="flex gap-2 flex-wrap">
              {['Contado', '7 días', '15 días', '30 días', 'Fija'].map(term => (
                <button key={term} onClick={() => setTerminoPago(term)} className={`px-4 py-2 rounded-lg text-sm font-bold flex-1 ${terminoPago === term ? 'bg-rose-600 text-white' : 'bg-zinc-950 border border-zinc-800 text-zinc-400'}`}>
                  {term === 'Fija' ? '📅 Fecha Específica' : term}
                </button>
              ))}
            </div>

            {terminoPago === 'Fija' && (
              <div className="mt-3 bg-zinc-950 p-3 rounded-xl border border-rose-500/40 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase">Seleccione Fecha Exacta de Pago</label>
                  <input type="date" value={fechaEspecifica} onChange={e => setFechaEspecifica(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white text-sm outline-none mt-1 focus:border-rose-500" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-zinc-200">Agregar Productos</h3>
        <div className="flex gap-2 flex-col sm:flex-row">
          <select value={currProductoId} onChange={(e) => setCurrProductoId(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-rose-500">
            <option value="">Buscar en catálogo...</option>
            {productos.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.descripcion} (${p.precio})</option>)}
          </select>
          
          <div className="flex gap-2">
            <input type="number" step="0.01" placeholder="Peso/Cant" value={currPeso} onChange={(e) => setCurrPeso(e.target.value)} className="w-32 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-rose-500" onKeyDown={(e) => e.key === 'Enter' && addItem()} />
            <button onClick={addItem} className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl transition-colors"><Plus className="w-6 h-6" /></button>
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
        <button onClick={totalizar} disabled={generating} className="w-full bg-rose-600 hover:bg-rose-500 text-white p-4 rounded-2xl font-black text-lg uppercase shadow-lg shadow-rose-600/20">
          {generating ? 'Procesando...' : (editingNota ? 'Actualizar Nota de Entrega' : 'Totalizar y Generar Nota')}
        </button>
      )}
    </div>
  );
}

function HistorialTab({ notas, showToast, db, handleEditNota }) {
  const [notaVisualizando, setNotaVisualizando] = useState(null);

  const anularNota = async (notaId) => {
    if (!window.confirm("¿Seguro que deseas anular este documento? Se mantendrá el número pero tachado.")) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notas', notaId), { estado: 'anulado' });
      showToast("Nota anulada correctamente");
    } catch (e) {
      showToast("Error al anular");
    }
  };

  const descargarImagenHistorial = async (nota) => {
    setNotaVisualizando(nota);
    setTimeout(async () => {
      const element = document.getElementById(`recibo-${nota.id}`);
      if (!element) {
        showToast("Error al generar la imagen");
        setNotaVisualizando(null);
        return;
      }

      try {
        if (!window.html2canvas) {
          showToast("Cargando motor de imágenes...");
          setNotaVisualizando(null);
          return;
        }

        const canvas = await window.html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        const link = document.createElement('a');
        link.download = `Nota_Entrega_${nota.numero}.jpg`;
        link.href = dataUrl;
        link.click();
        showToast("Imagen descargada con éxito");
      } catch (e) {
        console.error(e);
        showToast("Error al generar imagen");
      } finally {
        setNotaVisualizando(null);
      }
    }, 150);
  };

  const compartirWhatsAppHistorial = async (nota) => {
    setNotaVisualizando(nota);
    setTimeout(async () => {
      const element = document.getElementById(`recibo-${nota.id}`);
      if (element && window.html2canvas) {
        try {
          const canvas = await window.html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const link = document.createElement('a');
          link.download = `Nota_Entrega_${nota.numero}.jpg`;
          link.href = dataUrl;
          link.click();
        } catch (e) {
          console.error("Error descargando para WhatsApp", e);
        }
      }

      window.open(`https://api.whatsapp.com/send?phone=`, '_blank');
      showToast("Imagen descargada automáticamente. Adjúntala en WhatsApp");
      setNotaVisualizando(null);
    }, 150);
  };

  return (
    <div className="space-y-4 pb-10">
      <h2 className="text-xl font-black border-b border-zinc-800 pb-3 flex items-center gap-2">
        <History className="text-rose-500" /> Historial de Notas
      </h2>
      {notas.length === 0 && <div className="text-center text-zinc-500 py-10">No hay notas registradas todavía.</div>}
      <div className="grid gap-4">
        {notas.map(nota => {
          const isAnulado = nota.estado === 'anulado';
          const condTexto = nota.terminoPago?.startsWith('Fija:') ? `Fecha: ${nota.terminoPago.split(':')[1]}` : nota.terminoPago;
          return (
            <div key={nota.id} className={`bg-zinc-900 border ${isAnulado ? 'border-red-900/50 opacity-75' : 'border-zinc-800'} rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-bold ${isAnulado ? 'text-red-500 line-through' : 'text-rose-500'}`}>#{nota.numero}</span>
                  <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{nota.fecha}</span>
                  {isAnulado && <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded">DOCUMENTO ANULADO</span>}
                </div>
                <h3 className={`font-bold text-lg mt-1 ${isAnulado ? 'line-through text-zinc-500' : 'text-white'}`}>{nota.cliente?.nombre}</h3>
                <p className="text-xs text-zinc-400">Vendedor: {nota.vendedor?.nombre} • {condTexto}</p>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <span className={`text-xl font-black ${isAnulado ? 'line-through text-zinc-600' : 'text-white'}`}>${parseFloat(nota.total || 0).toFixed(2)}</span>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => descargarImagenHistorial(nota)} disabled={isAnulado} className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-emerald-400 rounded-lg transition-all" title="Descargar Imagen del Recibo">
                    <Download className="w-5 h-5" />
                  </button>
                  <button onClick={() => compartirWhatsAppHistorial(nota)} disabled={isAnulado} className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-green-400 rounded-lg transition-all" title="Compartir WhatsApp">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleEditNota(nota)} disabled={isAnulado} className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-blue-400 rounded-lg transition-all" title="Modificar">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => anularNota(nota.id)} disabled={isAnulado} className="p-2 bg-zinc-800 hover:bg-red-900/50 disabled:opacity-30 text-red-500 rounded-lg transition-all" title="Anular">
                    <Ban className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {notaVisualizando && (
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', zIndex: -1000 }}>
          <ReciboView receiptData={notaVisualizando} />
        </div>
      )}
    </div>
  );
}

function CuentasPorCobrarTab({ notas, vendedores, showToast, db }) {
  const [filtroVendedor, setFiltroVendedor] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('pendientes');
  const [filtroMaduracion, setFiltroMaduracion] = useState('todos');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [notaVisualizando, setNotaVisualizando] = useState(null);

  const calcularMaduracion = (timestamp, termino) => {
    if (termino && termino.startsWith('Fija:')) {
      const fechaStr = termino.split(':')[1]; // YYYY-MM-DD
      if (fechaStr) {
        const [y, m, d] = fechaStr.split('-');
        const fVenc = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).getTime();
        const ahora = Date.now();
        const diasRestantes = Math.ceil((fVenc - ahora) / (1000 * 60 * 60 * 24));
        
        let categoria = 'Vigente';
        if (diasRestantes <= 0) categoria = 'Vencido';
        else if (diasRestantes <= 3) categoria = 'Por Vencer';
        return { diasRestantes, categoria };
      }
    }

    const diasPlazo = termino === '7 días' ? 7 : termino === '15 días' ? 15 : termino === '30 días' ? 30 : 0;
    if (diasPlazo === 0) return { diasRestantes: 0, categoria: 'Vigente' };

    const ahora = Date.now();
    const diferenciaMs = ahora - timestamp;
    const diasTranscurridos = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
    const diasRestantes = diasPlazo - diasTranscurridos;

    let categoria = 'Vigente';
    const umbralUltimoTercio = Math.ceil(diasPlazo / 3);

    if (diasRestantes <= 0) {
      categoria = 'Vencido';
    } else if (diasRestantes <= umbralUltimoTercio) {
      categoria = 'Por Vencer';
    } else {
      categoria = 'Vigente';
    }

    return { diasRestantes, categoria };
  };

  const togglePago = async (nota) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notas', nota.id), { pagado: !nota.pagado });
      showToast(nota.pagado ? "Marcado como pendiente" : "Pago registrado con éxito");
    } catch (e) {
      showToast("Error al actualizar pago");
    }
  };

  const enviarRecordatorioWhatsApp = async (nota) => {
    setNotaVisualizando(nota);
    setTimeout(async () => {
      const element = document.getElementById(`recibo-${nota.id}`);
      if (element && window.html2canvas) {
        try {
          const canvas = await window.html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const link = document.createElement('a');
          link.download = `Nota_Entrega_${nota.numero}.jpg`;
          link.href = dataUrl;
          link.click();
        } catch (e) {
          console.error("Error descargando imagen para recordatorio WA", e);
        }
      }

      const detalleItems = (nota.items || []).map(i => `- ${i.descripcion} (${i.peso} kg) \`Subtotal: $${i.subtotal.toFixed(2)} REF\``).join('\n');
      
      const mensaje = `¡Buenos días! ☀️\n\nEstimado(a) *${nota.cliente?.nombre || 'Cliente'}*, te escribimos para saludarte y recordarte amablemente el vencimiento de tu factura pendiente.\n\nA continuación, los detalles de tu pedido:\n• *Nota de Entrega N°:* \`${nota.numero}\`\n• *Fecha:* _${nota.fecha}_\n• *Detalle:* \n${detalleItems}\n\n*TOTAL A PAGAR:* \`$${parseFloat(nota.total || 0).toFixed(2)} REF\`\n\nPuedes realizar tu pago por los siguientes medios:\n\n🏦 *PAGO MÓVIL - TRANSFERENCIA*\n- Banco: _Mercantil_\n- Teléfono: \`0424-656 5520\`\n- Cédula: \`22.362.833\`\n- Nro. Cuenta: \`01740111471114416694\`\n\n🟡 *BINANCE*\n- Correo: _DAGV94@GMAIL.COM_\n- Binance ID: \`1254404157\`\n- Etiqueta/Memo: \`DAGV-1994\`\n\nPor favor, compártenos el capture del pago por aquí una vez lo realices.\n\n¡Estamos atentos a tus nuevos pedidos! Que tengas un excelente día. 🐷`;

      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`, '_blank');
      showToast("Imagen descargada automáticamente. Adjúntala en WhatsApp");
      setNotaVisualizando(null);
    }, 150);
  };

  const notasFiltradas = notas.filter(nota => {
    if (nota.estado === 'anulado') return false;
    if (filtroVendedor && nota.vendedor?.id !== filtroVendedor) return false;
    if (filtroEstado === 'pendientes' && nota.pagado) return false;
    if (filtroEstado === 'pagados' && !nota.pagado) return false;
    
    if (busquedaCliente.trim()) {
      const nombreCliente = (nota.cliente?.nombre || '').toLowerCase();
      if (!nombreCliente.includes(busquedaCliente.toLowerCase())) return false;
    }

    if (filtroMaduracion !== 'todos') {
      const { categoria } = calcularMaduracion(nota.timestamp, nota.terminoPago);
      if (categoria !== filtroMaduracion) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
        <h2 className="text-xl font-black flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Wallet className="text-rose-500" /> Cuentas por Cobrar (Estado de Cuenta)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Buscar Cliente</label>
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
              <input type="text" placeholder="Nombre..." value={busquedaCliente} onChange={e => setBusquedaCliente(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm outline-none focus:border-rose-500" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Filtrar por Vendedor</label>
            <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-sm outline-none focus:border-rose-500">
              <option value="">Todos los vendedores</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Estatus Pago</label>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-sm outline-none focus:border-rose-500">
              <option value="pendientes">Solo Pendientes</option>
              <option value="pagados">Solo Pagados</option>
              <option value="todos">Todos</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Maduración</label>
            <select value={filtroMaduracion} onChange={e => setFiltroMaduracion(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-sm outline-none focus:border-rose-500">
              <option value="todos">Todas las categorías</option>
              <option value="Vigente">Vigente</option>
              <option value="Por Vencer">Por Vencer</option>
              <option value="Vencido">Vencido</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-950 text-zinc-400">
            <tr>
              <th className="p-4">Nota</th>
              <th className="p-4">Cliente / Vendedor</th>
              <th className="p-4">Condición</th>
              <th className="p-4">Días de Maduración</th>
              <th className="p-4">Estatus Plazo</th>
              <th className="p-4">Total</th>
              <th className="p-4 text-center">Recordatorio WA</th>
              <th className="p-4 text-center">Registrar Pago</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {notasFiltradas.map(nota => {
              const { diasRestantes, categoria } = calcularMaduracion(nota.timestamp, nota.terminoPago);
              const colorCategoria = categoria === 'Vigente' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : categoria === 'Por Vencer' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30';
              const condLabel = nota.terminoPago?.startsWith('Fija:') ? `Fecha: ${nota.terminoPago.split(':')[1]}` : nota.terminoPago;
              
              return (
                <tr key={nota.id} className="hover:bg-zinc-800/30">
                  <td className="p-4 font-mono font-bold text-rose-500">#{nota.numero}</td>
                  <td className="p-4">
                    <div className="font-bold text-white">{nota.cliente?.nombre}</div>
                    <div className="text-xs text-zinc-500">{nota.vendedor?.nombre} • {nota.fecha}</div>
                  </td>
                  <td className="p-4 text-zinc-300">{condLabel}</td>
                  <td className="p-4 font-mono font-bold">
                    {nota.terminoPago === 'Contado' ? 'Inmediato' : (
                      <span className={diasRestantes <= 0 ? 'text-red-500 font-black' : diasRestantes <= 5 ? 'text-yellow-400' : 'text-blue-400'}>
                        {diasRestantes > 0 ? `${diasRestantes} días restantes` : `${Math.abs(diasRestantes)} días vencido`}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colorCategoria}`}>
                      {categoria}
                    </span>
                  </td>
                  <td className="p-4 font-black text-white">${parseFloat(nota.total || 0).toFixed(2)} REF</td>
                  <td className="p-4 text-center">
                    <button onClick={() => enviarRecordatorioWhatsApp(nota)} className="p-2 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] rounded-lg transition-all inline-flex items-center gap-1 font-bold text-xs" title="Enviar Recordatorio por WhatsApp">
                      <Share2 className="w-4 h-4" /> Enviar WA
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => togglePago(nota)} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors inline-flex items-center gap-2">
                      {nota.pagado ? (
                        <span className="text-green-400 font-bold inline-flex items-center gap-1 bg-green-500/10 px-3 py-1 rounded-full"><CheckSquare className="w-5 h-5"/> Pagado</span>
                      ) : (
                        <span className="text-yellow-400 font-bold inline-flex items-center gap-1 bg-yellow-500/10 px-3 py-1 rounded-full hover:bg-yellow-500/20"><Square className="w-5 h-5"/> Marcar Pago</span>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
            {notasFiltradas.length === 0 && (
              <tr><td colSpan="8" className="p-8 text-center text-zinc-500">No hay documentos con estos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {notaVisualizando && (
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', zIndex: -1000 }}>
          <ReciboView receiptData={notaVisualizando} />
        </div>
      )}
    </div>
  );
}

function ClientesTab({ showToast, db, clientes }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [clienteEditando, setClienteEditando] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editDireccion, setEditDireccion] = useState('');

  const addCliente = async (e) => {
    e.preventDefault();
    if(!nombre.trim()) return showToast("Nombre requerido");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'clientes'), {
        nombre: nombre.trim(), telefono: telefono.trim(), direccion: direccion.trim(), creado: serverTimestamp()
      });
      setNombre(''); setTelefono(''); setDireccion('');
      showToast("Cliente guardado");
    } catch(e) { showToast("Error al guardar"); }
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cliente?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clientes', id));
      showToast("Cliente eliminado");
    } catch (e) { showToast("Error al eliminar"); }
  };

  const clientesFiltrados = clientes.filter(c => (c.nombre || '').toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="space-y-6 pb-10">
      <form onSubmit={addCliente} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
        <h2 className="text-xl font-black flex items-center gap-2"><Users className="text-rose-500"/> Nuevo Cliente</h2>
        <input placeholder="Nombre y Apellido" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-rose-500" />
        <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-rose-500" />
        <textarea placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} rows="2" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white resize-none outline-none focus:border-rose-500" />
        <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl">Guardar Cliente</button>
      </form>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
          <input type="text" placeholder="Buscar cliente por nombre..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-rose-500" />
        </div>

        {clientesFiltrados.map(c => (
          <div key={c.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
            <div>
              <div className="font-bold text-white text-lg">{c.nombre}</div>
              <div className="text-sm text-zinc-400">{c.telefono} • {c.direccion}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setClienteEditando(c.id); setEditNombre(c.nombre); setEditTelefono(c.telefono || ''); setEditDireccion(c.direccion || ''); }} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded-lg" title="Editar"><Edit className="w-5 h-5"/></button>
              <button onClick={() => eliminarCliente(c.id)} className="p-2 bg-zinc-800 hover:bg-red-900/50 text-red-500 rounded-lg" title="Eliminar"><Trash2 className="w-5 h-5"/></button>
            </div>
          </div>
        ))}
        {clientesFiltrados.length === 0 && <div className="text-center text-zinc-500 py-4">No hay clientes.</div>}
      </div>

      {clienteEditando && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-rose-500">Editar Cliente</h3>
            <input value={editNombre} onChange={e => setEditNombre(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none" />
            <input value={editTelefono} onChange={e => setEditTelefono(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none" />
            <textarea value={editDireccion} onChange={e => setEditDireccion(e.target.value)} rows="2" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white resize-none outline-none" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setClienteEditando(null)} className="px-4 py-2 bg-zinc-800 text-white rounded-xl font-bold">Cancelar</button>
              <button onClick={async () => {
                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clientes', clienteEditando), { nombre: editNombre.trim(), telefono: editTelefono.trim(), direccion: editDireccion.trim() });
                setClienteEditando(null); showToast("Cliente actualizado");
              }} className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CatalogoTab({ showToast, db, productos }) {
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');

  const [prodEditando, setProdEditando] = useState(null);
  const [editCodigo, setEditCodigo] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrecio, setEditPrecio] = useState('');

  const addProducto = async (e) => {
    e.preventDefault();
    if(!codigo.trim() || !descripcion.trim() || !precio) return showToast("Faltan datos");
    const finalCode = codigo.padStart(4, '0').slice(0, 4);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'catalogo'), {
        codigo: finalCode, descripcion: descripcion.trim(), precio: parseFloat(precio), creado: serverTimestamp()
      });
      setCodigo(''); setDescripcion(''); setPrecio('');
      showToast("Producto guardado");
    } catch(e) { showToast("Error al guardar"); }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Eliminar este producto del catálogo?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'catalogo', id));
      showToast("Producto eliminado");
    } catch(e) { showToast("Error al eliminar"); }
  };

  return (
    <div className="space-y-6 pb-10">
      <form onSubmit={addProducto} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
        <h2 className="text-xl font-black flex items-center gap-2"><Tag className="text-rose-500"/> Nuevo Producto</h2>
        <div className="flex gap-3">
          <input placeholder="Código (ej. 0010)" value={codigo} onChange={e => setCodigo(e.target.value)} maxLength={4} className="w-1/3 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none font-mono" />
          <input placeholder="Precio REF" type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} className="w-2/3 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none" />
        </div>
        <input placeholder="Descripción del producto" value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none" />
        <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl">Guardar Producto</button>
      </form>

      <div className="space-y-3">
        <h3 className="font-bold text-zinc-400 uppercase text-xs">Inventario Disponible ({productos.length})</h3>
        {productos.map(p => (
          <div key={p.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="bg-zinc-800 text-zinc-300 font-mono text-xs px-2 py-1 rounded">{p.codigo}</span>
              <span className="font-bold text-white">{p.descripcion}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-black text-rose-500">${parseFloat(p.precio || 0).toFixed(2)}</span>
              <div className="flex gap-1">
                <button onClick={() => { setProdEditando(p.id); setEditCodigo(p.codigo); setEditDesc(p.descripcion); setEditPrecio(p.precio); }} className="p-2 bg-zinc-800 text-blue-400 rounded-lg" title="Editar"><Edit className="w-4 h-4"/></button>
                <button onClick={() => eliminarProducto(p.id)} className="p-2 bg-zinc-800 text-red-500 rounded-lg" title="Eliminar"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {prodEditando && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-rose-500">Editar Producto</h3>
            <div className="flex gap-3">
              <input value={editCodigo} onChange={e => setEditCodigo(e.target.value)} maxLength={4} className="w-1/3 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none font-mono" />
              <input value={editPrecio} onChange={e => setEditPrecio(e.target.value)} type="number" step="0.01" className="w-2/3 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none" />
            </div>
            <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setProdEditando(null)} className="px-4 py-2 bg-zinc-800 text-white rounded-xl font-bold">Cancelar</button>
              <button onClick={async () => {
                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'catalogo', prodEditando), { codigo: editCodigo.padStart(4, '0'), descripcion: editDesc.trim(), precio: parseFloat(editPrecio) });
                setProdEditando(null); showToast("Producto actualizado");
              }} className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VendedoresTab({ showToast, db, vendedores }) {
  const [nombre, setNombre] = useState('');
  const [vendEditando, setVendEditando] = useState(null);
  const [editNombre, setEditNombre] = useState('');

  const addVendedor = async (e) => {
    e.preventDefault();
    if(!nombre.trim()) return showToast("Nombre requerido");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'vendedores'), {
        nombre: nombre.trim(), creado: serverTimestamp()
      });
      setNombre('');
      showToast("Vendedor registrado");
    } catch(e) { showToast("Error al guardar"); }
  };

  const eliminarVendedor = async (id) => {
    if (!window.confirm("¿Eliminar este vendedor?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vendedores', id));
      showToast("Vendedor eliminado");
    } catch(e) { showToast("Error al eliminar"); }
  };

  return (
    <div className="space-y-6 pb-10">
      <form onSubmit={addVendedor} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
        <h2 className="text-xl font-black flex items-center gap-2"><UserCheck className="text-rose-500"/> Registrar Vendedor</h2>
        <input placeholder="Nombre del Vendedor" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-rose-500" />
        <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl">Guardar Vendedor</button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {vendedores.map(v => (
          <div key={v.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-600/20 flex items-center justify-center text-rose-500 font-bold">{v.nombre ? v.nombre.charAt(0) : 'V'}</div>
              <span className="font-bold text-white">{v.nombre}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setVendEditando(v.id); setEditNombre(v.nombre); }} className="p-2 bg-zinc-800 text-blue-400 rounded-lg" title="Editar"><Edit className="w-4 h-4"/></button>
              <button onClick={() => eliminarVendedor(v.id)} className="p-2 bg-zinc-800 text-red-500 rounded-lg" title="Eliminar"><Trash2 className="w-4 h-4"/></button>
            </div>
          </div>
        ))}
      </div>

      {vendEditando && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-rose-500">Editar Vendedor</h3>
            <input value={editNombre} onChange={e => setEditNombre(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setVendEditando(null)} className="px-4 py-2 bg-zinc-800 text-white rounded-xl font-bold">Cancelar</button>
              <button onClick={async () => {
                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vendedores', vendEditando), { nombre: editNombre.trim() });
                setVendEditando(null); showToast("Vendedor actualizado");
              }} className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfiguracionTab({ showToast }) {
  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [claveConfirmar, setClaveConfirmar] = useState('');

  const cambiarClave = (e) => {
    e.preventDefault();
    const claveGuardada = localStorage.getItem('alabastro_master_key') || 'Alabastro';
    
    if (claveActual !== claveGuardada) {
      return showToast("La clave actual es incorrecta");
    }
    if (!claveNueva || claveNueva.length < 4) {
      return showToast("La nueva clave debe tener al menos 4 caracteres");
    }
    if (claveNueva !== claveConfirmar) {
      return showToast("Las claves nuevas no coinciden");
    }

    localStorage.setItem('alabastro_master_key', claveNueva);
    setClaveActual('');
    setClaveNueva('');
    setClaveConfirmar('');
    showToast("¡Clave de seguridad actualizada con éxito!");
  };

  return (
    <div className="space-y-6 pb-10">
      <form onSubmit={cambiarClave} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4 shadow-xl max-w-md mx-auto">
        <h2 className="text-xl font-black flex items-center gap-2"><KeyRound className="text-rose-500"/> Configurar Clave de Seguridad</h2>
        <p className="text-xs text-zinc-400">Esta clave se utiliza para autorizar operaciones sensibles como el reinicio de fábrica del sistema.</p>
        
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-400 uppercase">Clave Actual</label>
          <input type="password" value={claveActual} onChange={e => setClaveActual(e.target.value)} placeholder="Por defecto: Alabastro" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-rose-500" required />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-400 uppercase">Nueva Clave</label>
          <input type="password" value={claveNueva} onChange={e => setClaveNueva(e.target.value)} placeholder="Mínimo 4 caracteres" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-rose-500" required />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-400 uppercase">Confirmar Nueva Clave</label>
          <input type="password" value={claveConfirmar} onChange={e => setClaveConfirmar(e.target.value)} placeholder="Repita la nueva clave" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-rose-500" required />
        </div>

        <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg">Actualizar Clave</button>
      </form>
    </div>
  );
}

function ReiniciarTab({ showToast, db, notas, clientes, productos, vendedores }) {
  const [claveIngresada, setClaveIngresada] = useState('');
  const [procesando, setProcesando] = useState(false);

  const realizarRespaldoJSON = () => {
    const datosRespaldo = {
      fechaRespaldo: new Date().toISOString(),
      notas,
      clientes,
      productos,
      vendedores
    };
    const blob = new Blob([JSON.stringify(datosRespaldo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Respaldo_Alabastro_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const limpiarColeccion = async (nombreColeccion) => {
    const querySnapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', nombreColeccion));
    const batch = writeBatch(db);
    querySnapshot.forEach((documento) => {
      batch.delete(documento.ref);
    });
    await batch.commit();
  };

  const ejecutarReinicioFabrica = async (e) => {
    e.preventDefault();
    const claveMaestra = localStorage.getItem('alabastro_master_key') || 'Alabastro';

    if (claveIngresada !== claveMaestra) {
      return showToast("Clave de seguridad incorrecta");
    }

    if (!window.confirm("⚠️ ADVERTENCIA: Se eliminará todo el historial de notas y cuentas por cobrar. Los clientes, productos y vendedores se conservarán intactos. ¿Desea proceder?")) {
      return;
    }

    setProcesando(true);
    try {
      // 1. Descargar respaldo completo antes de limpiar
      realizarRespaldoJSON();
      showToast("Respaldo descargado con éxito. Vaciando historial de notas...");

      // 2. Borrar ÚNICAMENTE la colección de notas
      await limpiarColeccion('notas');

      // 3. Reiniciar secuencia de notas a cero
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'secuencia'), { valor: 0 });
      } catch (err) {
        console.error(err);
      }

      setClaveIngresada('');
      showToast("¡Historial de notas restablecido con éxito! Catálogos y clientes conservados.");
    } catch (error) {
      console.error(error);
      showToast("Error al procesar el reinicio del historial");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <form onSubmit={ejecutarReinicioFabrica} className="bg-zinc-900 p-6 rounded-2xl border border-red-900/50 space-y-4 shadow-xl max-w-md mx-auto">
        <div className="flex items-center gap-3 text-red-500">
          <AlertTriangle className="w-8 h-8 flex-shrink-0" />
          <h2 className="text-xl font-black">Reiniciar Historial de Notas</h2>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Esta herramienta borra el historial de notas de entrega y el estado de cuentas por cobrar de manera definitiva. 
          <span className="text-rose-400 font-bold block mt-1">Se generará y descargará un archivo de respaldo (.json) completo antes de vaciar las notas. El catálogo de productos, los clientes y los vendedores se conservarán intactos.</span>
        </p>

        <div className="space-y-1 pt-2">
          <label className="text-xs font-bold text-zinc-400 uppercase">Ingrese Clave de Seguridad</label>
          <input type="password" value={claveIngresada} onChange={e => setClaveIngresada(e.target.value)} placeholder="Clave maestra" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-red-500" required />
        </div>

        <button type="submit" disabled={procesando} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50">
          {procesando ? 'Procesando Respaldo y Limpieza...' : 'Respaldar y Reiniciar Historial'}
        </button>
      </form>
    </div>
  );
}
