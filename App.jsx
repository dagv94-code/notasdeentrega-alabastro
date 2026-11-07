import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, setDoc, getDoc, serverTimestamp, deleteDoc, writeBatch } from 'firebase/firestore';
import { 
  Users, ShoppingCart, UserCheck, FileText, Download, Plus, 
  Trash2, ChevronRight, CheckCircle2, Phone, MapPin, Tag, ArrowLeft,
  History, Wallet, Edit, Eye, Share2, Square, CheckSquare, Ban
} from 'lucide-react';

// --- FIREBASE INITIALIZATION (CONFIGURACIÓN REAL Y RUTA BLINDADA) ---
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
const appId = 'agropecuaria-alabastro'; // Ruta estática y directa

const LOGO_SRC = "WhatsApp Image 2026-11-06 at 12.57.48 PM.jpeg";

export default function AgropecuariaApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('nueva-nota');
  const [loading, setLoading] = useState(true);

  // Data States
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [notas, setNotas] = useState([]);
  
  // Note Editing State
  const [editingNota, setEditingNota] = useState(null);
  
  // Notification State
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- AUTHENTICATION ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
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

  // --- SCRIPT LOADER (html2canvas) ---
  useEffect(() => {
    if (!document.getElementById('html2canvas-script')) {
      const script = document.createElement('script');
      script.id = 'html2canvas-script';
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // --- DATA FETCHING & INITIALIZATION ---
  useEffect(() => {
    if (!user) return;

    const basePublicPath = ['artifacts', appId, 'public', 'data'];

    const unsubClientes = onSnapshot(collection(db, ...basePublicPath, 'clientes'), (snap) => {
      setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.nombre.localeCompare(b.nombre)));
    }, (err) => console.error(err));

    const unsubProductos = onSnapshot(collection(db, ...basePublicPath, 'catalogo'), async (snap) => {
      const prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProductos(prods.sort((a, b) => a.codigo.localeCompare(b.codigo)));
      
      // PRE-FILL PRODUCTS IF EMPTY
      if (prods.length === 0) {
        const initialProducts = [
          { codigo: "0001", descripcion: "Cerdo en canal kg", precio: 3 },
          { codigo: "0002", descripcion: "Chuleta de Lomo kg", precio: 7 },
          { codigo: "0003", descripcion: "Chuletón de Cerdo kg", precio: 7 },
          { codigo: "0004", descripcion: "Lomo de Cerdo kg", precio: 10 },
          { codigo: "0005", descripcion: "Pernil Entero kg", precio: 7 },
          { codigo: "0006", descripcion: "Costilla de Cerdo kg", precio: 7 },
          { codigo: "0007", descripcion: "Panceta kg", precio: 7 },
          { codigo: "0008", descripcion: "Patas de Cerdo kg", precio: 3 },
          { codigo: "0009", descripcion: "Recortes para Freír kg", precio: 4 }
        ];
        const batch = writeBatch(db);
        initialProducts.forEach(p => {
          const docRef = doc(collection(db, ...basePublicPath, 'catalogo'));
          batch.set(docRef, { ...p, creado: serverTimestamp() });
        });
        await batch.commit();
      }
    }, (err) => console.error(err));

    const unsubVendedores = onSnapshot(collection(db, ...basePublicPath, 'vendedores'), async (snap) => {
      const vends = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVendedores(vends.sort((a, b) => a.nombre.localeCompare(b.nombre)));

      // PRE-FILL VENDORS IF EMPTY
      if (vends.length === 0) {
        const initialVendors = ["David Garcia", "Yennifer Acosta", "Yulianny Acosta", "Yonida Barroso"];
        const batch = writeBatch(db);
        initialVendors.forEach(v => {
          const docRef = doc(collection(db, ...basePublicPath, 'vendedores'));
          batch.set(docRef, { nombre: v, creado: serverTimestamp() });
        });
        await batch.commit();
      }
    }, (err) => console.error(err));

    const unsubNotas = onSnapshot(collection(db, ...basePublicPath, 'notas'), (snap) => {
      setNotas(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    }, (err) => console.error(err));

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
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-3">
          <img src={LOGO_SRC} alt="Logo" className="w-10 h-10 rounded-full border border-rose-500/50 shadow-md" onError={(e) => e.target.style.display='none'} />
          <h1 className="text-xl font-black tracking-tight text-white uppercase">
            Distribuidora <span className="text-rose-500">Alabastro</span>
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto p-4">
        {activeTab === 'nueva-nota' && <NuevaNotaTab clientes={clientes} productos={productos} vendedores={vendedores} showToast={showToast} db={db} user={user} editingNota={editingNota} setEditingNota={setEditingNota} />}
        {activeTab === 'historial' && <HistorialTab notas={notas} showToast={showToast} db={db} handleEditNota={handleEditNota} />}
        {activeTab === 'cuentas' && <CuentasPorCobrarTab notas={notas} vendedores={vendedores} showToast={showToast} db={db} />}
        {activeTab === 'clientes' && <ClientesTab showToast={showToast} db={db} user={user} clientes={clientes} />}
        {activeTab === 'catalogo' && <CatalogoTab showToast={showToast} db={db} user={user} productos={productos} />}
        {activeTab === 'vendedores' && <VendedoresTab showToast={showToast} db={db} user={user} vendedores={vendedores} />}
      </main>

      {/* Bottom Navigation */}
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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold">{toast}</span>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavButton({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center p-2 rounded-xl transition-all ${
        active ? 'text-rose-500 scale-110' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <div className="mb-1">{React.cloneElement(icon, { className: 'w-6 h-6' })}</div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

// --- NUEVA NOTA TAB ---
function NuevaNotaTab({ clientes, productos, vendedores, showToast, db, user, editingNota, setEditingNota }) {
  const [clienteId, setClienteId] = useState('');
  const [vendedorId, setVendedorId] = useState('');
  const [terminoPago, setTerminoPago] = useState('Contado');
  const [items, setItems] = useState([]);
  
  // Current Item Form
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
      const cliente = clientes.find(c => c.id === clienteId) || (editingNota ? editingNota.cliente : null);
      const vendedor = vendedores.find(v => v.id === vendedorId) || (editingNota ? editingNota.vendedor : null);
      
      let currentNumber = editingNota ? editingNota.numero : 1;
      let timestamp = Date.now();

      if (!editingNota) {
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
      } else {
        timestamp = editingNota.timestamp || Date.now();
      }

      const total = items.reduce((acc, item) => acc + item.subtotal, 0);
      
      const dateObj = editingNota && editingNota.timestamp ? new Date(editingNota.timestamp) : new Date();
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
        pagado: editingNota ? editingNota.pagado : false,
        estado: editingNota?.estado || 'activo'
      };

      if (editingNota) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'notas', editingNota.id);
        await updateDoc(docRef, finalReceiptData);
        showToast("Nota actualizada correctamente");
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notas'), finalReceiptData);
        showToast("Nota creada y guardada");
      }

      setReceiptData(finalReceiptData);
      setIsTotalized(true);
    } catch (error) {
      console.error(error);
      showToast("Error al totalizar y guardar");
    } finally {
      setGenerating(false);
    }
  };

  const descargarImagen = async (shareToWhatsApp = false) => {
    if (!window.html2canvas) return showToast("El generador de imágenes aún está cargando...");
    
    const element = document.getElementById('recibo-final');
    if (!element) return;

    try {
      setGenerating(true);
      const canvas = await window.html2canvas(element, { 
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      if (shareToWhatsApp) {
        if (navigator.canShare && navigator.canShare({ files: [new File([''], 'a.jpg', { type: 'image/jpeg' })] })) {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], `Recibo_Alabastro_${receiptData.numero}.jpg`, { type: 'image/jpeg' });
          await navigator.share({
            title: `Recibo ${receiptData.numero}`,
            text: `Adjunto nota de entrega N° ${receiptData.numero}`,
            files: [file]
          });
        } else {
           downloadFile(dataUrl, `Recibo_Alabastro_${receiptData.numero}.jpg`);
           window.open(`https://api.whatsapp.com/send?text=Hola, adjunto los detalles de la nota de entrega N° ${receiptData.numero}. (Por favor adjunta la imagen que se acaba de descargar)`, '_blank');
        }
      } else {
        downloadFile(dataUrl, `Recibo_Alabastro_${receiptData.numero}.jpg`);
        showToast("Imagen descargada");
      }
    } catch (e) {
      console.error(e);
      showToast("Error al generar imagen");
    } finally {
      setGenerating(false);
    }
  };

  const downloadFile = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  const reiniciar = () => {
    setIsTotalized(false);
    setReceiptData(null);
    if (!editingNota) {
      setItems([]);
      setClienteId('');
    }
    setEditingNota(null);
  };

  if (isTotalized && receiptData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center bg-zinc-900 p-4 rounded-2xl border border-zinc-800 gap-3">
          <button onClick={reiniciar} className="flex items-center text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" /> Atrás
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => descargarImagen(false)} 
              disabled={generating}
              className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl font-bold flex items-center shadow-lg transition-all disabled:opacity-50"
            >
              <Download className="w-5 h-5 md:mr-2" /> <span className="hidden md:inline">Descargar</span>
            </button>
            <button 
              onClick={() => descargarImagen(true)} 
              disabled={generating}
              className="bg-[#25D366] hover:bg-[#1ebd5a] text-white px-4 py-2 rounded-xl font-bold flex items-center shadow-lg transition-all disabled:opacity-50"
            >
              <Share2 className="w-5 h-5 md:mr-2" /> <span className="hidden md:inline">WhatsApp</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pb-8">
          <div 
            id="recibo-final" 
            className="bg-white text-black p-8 w-[800px] mx-auto shadow-2xl relative"
            style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
          >
            <div className="border-b-4 border-rose-600 pb-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-rose-600 flex items-center justify-center">
                     <img src={LOGO_SRC} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black uppercase text-zinc-900 tracking-tighter leading-none">
                      Distribuidora
                      <br/><span className="text-rose-600">Alabastro</span>
                    </h1>
                    <p className="text-sm text-zinc-500 font-bold mt-1">agropecuarialabastro@gmail.com</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-rose-600 tracking-widest">RECIBO DE COMPRA</h2>
                  <div className="mt-2 text-lg font-bold text-zinc-800">N° {receiptData.numero}</div>
                  <div className="text-sm text-zinc-600 font-medium mt-1">FECHA: {receiptData.fecha}</div>
                </div>
              </div>
              
              <div className="mt-4 flex gap-6 text-sm font-bold text-zinc-700 bg-zinc-100 p-3 rounded-lg">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-600"/> Atendemos Mara: 0412-6991653</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-600"/> Maracaibo/San Francisco: 0412-3103301</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <h3 className="text-xs font-bold text-rose-600 uppercase mb-2">Datos del Cliente</h3>
                <p className="font-bold text-lg">{receiptData.cliente.nombre}</p>
                <p className="text-sm text-zinc-600 mt-1 flex items-center gap-1"><Phone className="w-3 h-3"/> {receiptData.cliente.telefono}</p>
                <p className="text-sm text-zinc-600 mt-1 break-words whitespace-normal leading-relaxed">{receiptData.cliente.direccion}</p>
              </div>
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-rose-600 uppercase mb-2">Vendedor Asignado</h3>
                  <p className="font-bold text-lg">{receiptData.vendedor.nombre}</p>
                </div>
                <div className="flex gap-4 mt-3">
                  <div>
                    <h3 className="text-xs font-bold text-rose-600 uppercase mb-1">Condición de Pago</h3>
                    <div className="inline-block bg-zinc-800 text-white text-sm font-bold px-3 py-1 rounded">
                      {receiptData.terminoPago.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-rose-600 uppercase mb-1">Fecha de Pago</h3>
                    <div className="inline-block bg-zinc-200 text-zinc-800 text-sm font-bold px-3 py-1 rounded border border-zinc-300">
                      {(() => {
                        const days = receiptData.terminoPago === '7 días' ? 7 : receiptData.terminoPago === '15 días' ? 15 : receiptData.terminoPago === '30 días' ? 30 : 0;
                        const d = new Date(receiptData.timestamp);
                        d.setDate(d.getDate() + days);
                        return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <table className="w-full mb-6 text-sm">
              <thead>
                <tr className="bg-zinc-900 text-white">
                  <th className="py-3 px-4 text-left font-bold rounded-tl-lg">COD</th>
                  <th className="py-3 px-4 text-left font-bold">DESCRIPCIÓN</th>
                  <th className="py-3 px-4 text-right font-bold">PESO (KG)</th>
                  <th className="py-3 px-4 text-right font-bold">PRECIO REF</th>
                  <th className="py-3 px-4 text-right font-bold rounded-tr-lg">SUBTOTAL REF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {receiptData.items.map((item, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="py-3 px-4 font-mono font-medium text-zinc-500">{item.codigo}</td>
                    <td className="py-3 px-4 font-bold text-zinc-800">{item.descripcion}</td>
                    <td className="py-3 px-4 text-right font-medium">{item.peso.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-medium">{item.precio.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-900">{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-8">
              <div className="bg-zinc-50 p-4 rounded-xl border-2 border-rose-600 min-w-[300px]">
                <div className="flex justify-between items-center text-xl font-black">
                  <span className="text-rose-600">TOTAL A PAGAR:</span>
                  <span>{receiptData.total.toFixed(2)} <span className="text-sm text-zinc-500 font-bold">REF</span></span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-center border-t-2 border-dashed border-zinc-300 pt-6">
              <div className="bg-green-100 text-green-800 py-2 px-4 rounded-lg inline-flex items-center justify-center font-bold text-sm gap-2">
                <Phone className="w-4 h-4"/> REALIZA TUS PEDIDOS AL WHATSAPP. DESPACHAMOS MARA, MARACAIBO, SAN FRANCISCO
              </div>
              <p className="text-[10px] text-zinc-500 font-bold max-w-2xl mx-auto uppercase leading-tight">
                ESTE DOCUMENTO SE CANCELARÁ A LA TASA BCV EURO ESTABLECIDA POR EL BANCO CENTRAL DE VENEZUELA EL DÍA DE SU CANCELACIÓN. GRACIAS POR SU COMPRA.
              </p>
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
          <FileText className="text-rose-500" /> {editingNota ? `Editando Nota N° ${editingNota.numero}` : 'Crear Nota de Entrega'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cliente</label>
            <select 
              value={clienteId} onChange={(e) => setClienteId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
            >
              <option value="">Seleccione Cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Vendedor</label>
            <select 
              value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
            >
              <option value="">Seleccione Vendedor...</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Condición de Pago</label>
            <div className="flex gap-2 flex-wrap">
              {['Contado', '7 días', '15 días', '30 días'].map(term => (
                <button
                  key={term}
                  onClick={() => setTerminoPago(term)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex-1 min-w-[100px] ${
                    terminoPago === term ? 'bg-rose-600 text-white' : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
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
          <select 
            value={currProductoId} onChange={(e) => setCurrProductoId(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
          >
            <option value="">Buscar en catálogo...</option>
            {productos.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.descripcion} (${p.precio})</option>)}
          </select>
          
          <div className="flex gap-2">
            <input 
              type="number" step="0.01" placeholder="Peso/Cant"
              value={currPeso} onChange={(e) => setCurrPeso(e.target.value)}
              className="w-32 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
            />
            <button onClick={addItem} className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl transition-colors">
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mt-6 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-400">
                <tr>
                  <th className="p-3 font-medium">Producto</th>
                  <th className="p-3 font-medium text-right">Peso</th>
                  <th className="p-3 font-medium text-right">Total</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 bg-zinc-900/50">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="p-3">
                      <div className="font-bold text-zinc-200">{item.descripcion}</div>
                      <div className="text-xs text-zinc-500">Ref: ${item.precio.toFixed(2)}</div>
                    </td>
                    <td className="p-3 text-right font-medium">{item.peso}</td>
                    <td className="p-3 text-right font-bold text-rose-400">${item.subtotal.toFixed(2)}</td>
                    <td className="p-3">
                      <button onClick={() => removeItem(item.id)} className="text-zinc-600 hover:text-red-500 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <button 
          onClick={totalizar}
          disabled={generating}
          className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white p-4 rounded-2xl font-black text-lg shadow-lg shadow-rose-600/20 transition-all flex justify-center items-center gap-2 uppercase tracking-wide"
        >
          {generating ? 'Procesando...' : (editingNota ? 'Actualizar Nota' : 'Totalizar y Generar Recibo')}
          {!generating && <ChevronRight className="w-6 h-6" />}
        </button>
      )}
    </div>
  );
}

// --- HISTORIAL TAB ---
function HistorialTab({ notas, showToast, db, handleEditNota }) {
  const [notaAAnular, setNotaAAnular] = React.useState(null);

  const confirmarAnulacion = async () => {
    if (!notaAAnular) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notas', notaAAnular), { estado: 'anulado' });
      showToast("Nota anulada exitosamente");
    } catch(e) {
      console.error(e);
      showToast("Error al anular");
    } finally {
      setNotaAAnular(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in pb-10">
      <h2 className="text-xl font-black flex items-center gap-2 border-b border-zinc-800 pb-3">
        <History className="text-rose-500" /> Historial de Notas
      </h2>
      
      {notas.length === 0 && (
        <div className="text-center text-zinc-500 py-10">No hay notas generadas todavía.</div>
      )}

      <div className="grid gap-4">
        {notas.map(nota => (
          <div key={nota.id} className={`bg-zinc-900 border ${nota.estado === 'anulado' ? 'border-red-900/50' : 'border-zinc-800'} rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-rose-500 font-bold">#{nota.numero}</span>
                <span className="text-xs font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{nota.fecha}</span>
                {nota.pagado && <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Pagado</span>}
                {nota.estado === 'anulado' && <span className="text-xs font-bold bg-red-500/20 text-red-500 px-2 py-0.5 rounded flex items-center gap-1">ANULADO</span>}
              </div>
              <h3 className={`font-bold text-lg ${nota.estado === 'anulado' ? 'line-through text-zinc-500' : ''}`}>{nota.cliente?.nombre || 'Cliente Desconocido'}</h3>
              <p className="text-sm text-zinc-400">Vend: {nota.vendedor?.nombre || 'N/A'} • {nota.terminoPago}</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className={`text-xl font-black mr-4 ${nota.estado === 'anulado' ? 'text-zinc-600 line-through' : 'text-white'}`}>${parseFloat(nota.total).toFixed(2)}</div>
              <div className="flex gap-2">
                <button onClick={() => handleEditNota(nota)} disabled={nota.estado === 'anulado'} className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-blue-400 rounded-lg transition-all" title="Ver / Modificar">
                  <Edit className="w-5 h-5" />
                </button>
                <button onClick={() => setNotaAAnular(nota.id)} disabled={nota.estado === 'anulado'} className="p-2 bg-zinc-800 hover:bg-red-900/50 disabled:opacity-50 text-red-500 rounded-lg transition-all" title="Anular Documento">
                  <Ban className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notaAAnular && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-black text-rose-500 mb-2">¿Anular Nota?</h3>
            <p className="text-zinc-300 mb-6">
              ¿Está seguro de ANULAR esta nota? Este documento quedará invalidado pero mantendrá su número correlativo.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setNotaAAnular(null)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all">
                Cancelar
              </button>
              <button onClick={confirmarAnulacion} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all">
                Sí, Anular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CUENTAS POR COBRAR TAB ---
function CuentasPorCobrarTab({ notas, vendedores, showToast, db }) {
  const [filtroVendedor, setFiltroVendedor] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('pendientes');

  const getDaysTerm = (termino) => {
    if (termino === '7 días') return 7;
    if (termino === '15 días') return 15;
    if (termino === '30 días') return 30;
    return 0;
  };

  const togglePago = async (nota) => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'notas', nota.id);
      await updateDoc(docRef, { pagado: !nota.pagado });
      showToast(nota.pagado ? "Marcado como Pendiente" : "Marcado como Pagado");
    } catch(e) {
      console.error(e);
      showToast("Error al actualizar estado");
    }
  };

  const filteredNotas = notas.filter(nota => {
    if (nota.estado === 'anulado') return false;
    if (filtroVendedor && nota.vendedor?.id !== filtroVendedor) return false;
    if (filtroEstado === 'pendientes' && nota.pagado) return false;
    if (filtroEstado === 'pagados' && !nota.pagado) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
        <h2 className="text-xl font-black flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Wallet className="text-rose-500" /> Cuentas por Cobrar
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Filtro por Vendedor</label>
            <select 
              value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
            >
              <option value="">Todos los vendedores</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Estado de Pago</label>
            <select 
              value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
            >
              <option value="pendientes">Solo Pendientes</option>
              <option value="pagados">Solo Pagados</option>
              <option value="todos">Todos</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-950 text-zinc-400">
            <tr>
              <th className="p-4 font-medium">Nota</th>
              <th className="p-4 font-medium">Cliente</th>
              <th className="p-4 font-medium">Monto</th>
              <th className="p-4 font-medium">Vencimiento</th>
              <th className="p-4 font-medium">Maduración</th>
              <th className="p-4 font-medium text-center">Pagado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filteredNotas.map(nota => {
              const termDays = getDaysTerm(nota.terminoPago);
              const issueDate = new Date(nota.timestamp || Date.now());
              const dueDate = new Date(issueDate.getTime() + termDays * 24 * 60 * 60 * 1000);
              const today = new Date();
              today.setHours(0,0,0,0);
              const diffTime = dueDate - today;
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              let statusColor = "text-green-400";
              let statusText = `${diffDays} días restantes`;
              
              if (nota.pagado) {
                 statusColor = "text-zinc-500";
                 statusText = "Saldada";
              } else if (diffDays < 0) {
                 statusColor = "text-red-500 font-bold";
                 statusText = `Vencida hace ${Math.abs(diffDays)} días`;
              } else if (diffDays === 0) {
                 statusColor = "text-yellow-500 font-bold";
                 statusText = "Vence hoy";
              } else if (diffDays <= 3) {
                 statusColor = "text-yellow-400";
              }

              return (
                <tr key={nota.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 font-mono font-bold">#{nota.numero}</td>
                  <td className="p-4 font-bold text-zinc-200">
                    {nota.cliente?.nombre}
                    <div className="text-xs text-zinc-500 font-normal">{nota.vendedor?.nombre}</div>
                  </td>
                  <td className="p-4 font-black text-white">${nota.total.toFixed(2)}</td>
                  <td className="p-4 text-zinc-400">
                    {dueDate.toLocaleDateString()}
                    <div className="text-xs text-zinc-600">{nota.terminoPago}</div>
                  </td>
                  <td className={`p-4 ${statusColor}`}>{statusText}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => togglePago(nota)}
                      className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      {nota.pagado ? 
                        <CheckSquare className="w-6 h-6 text-green-500 mx-auto" /> : 
                        <Square className="w-6 h-6 text-zinc-600 hover:text-white mx-auto" />
                      }
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredNotas.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-zinc-500">No hay cuentas que coincidan con el filtro.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- CLIENTES TAB ---
function ClientesTab({ showToast, db, user, clientes }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  const [clienteEditando, setClienteEditando] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editDireccion, setEditDireccion] = useState('');

  const addCliente = async (e) => {
    e.preventDefault();
    if(!nombre.trim()) return showToast("Nombre requerido");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'clientes'), {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        creado: serverTimestamp()
      });
      setNombre(''); setTelefono(''); setDireccion('');
      showToast("Cliente registrado");
    } catch (e) { console.error(e); showToast("Error al guardar"); }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <form onSubmit={addCliente} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
        <h2 className="text-xl font-black flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Users className="text-rose-500" /> Nuevo Cliente
        </h2>
        <input placeholder="Nombre y Apellido" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none" />
        <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none" />
        <textarea placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} rows="2" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none resize-none" />
        <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-colors">Guardar Cliente</button>
      </form>

      <div className="space-y-3">
        <h3 className="font-bold text-zinc-400 px-2 uppercase text-xs tracking-wider">Directorio ({clientes.length})</h3>
        {clientes.map(c => (
          <div key={c.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800/50 flex justify-between items-start gap-4">
            <div className="flex-1">
              <span className="font-bold text-lg text-zinc-200">{c.nombre}</span>
              <div className="flex items-center text-sm text-zinc-500 gap-4">
                {c.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{c.telefono}</span>}
              </div>
              {c.direccion && <p className="text-sm text-zinc-600 mt-1">{c.direccion}</p>}
            </div>
            <button 
              onClick={() => {
                setClienteEditando(c.id);
                setEditNombre(c.nombre);
                setEditTelefono(c.telefono || '');
                setEditDireccion(c.direccion || '');
              }} 
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded-lg transition-all" title="Editar Cliente">
              <Edit className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {clienteEditando && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <h3 className="text-xl font-black text-rose-500 flex items-center gap-2 mb-2"><Edit className="w-5 h-5"/> Editar Cliente</h3>
            <input 
              placeholder="Nombre y Apellido" value={editNombre} onChange={e => setEditNombre(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
            />
            <input 
              placeholder="Teléfono" value={editTelefono} onChange={e => setEditTelefono(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
            />
            <textarea 
              placeholder="Dirección" value={editDireccion} onChange={e => setEditDireccion(e.target.value)} rows="2"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none resize-none"
            />
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setClienteEditando(null)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all">Cancelar</button>
              <button 
                onClick={async () => {
                  try {
                    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clientes', clienteEditando), {
                      nombre: editNombre.trim(), telefono: editTelefono.trim(), direccion: editDireccion.trim()
                    });
                    setClienteEditando(null); showToast("Cliente actualizado");
                  } catch (e) { console.error(e); showToast("Error al actualizar"); }
                }} 
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CATALOGO TAB ---
function CatalogoTab({ showToast, db, user, productos }) {
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');

  const [productoEditando, setProductoEditando] = useState(null);
  const [editCodigo, setEditCodigo] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editPrecio, setEditPrecio] = useState('');

  const handleCodigoBlur = () => {
    if (codigo) setCodigo(codigo.padStart(4, '0').slice(0, 4));
  };

  const addProducto = async (e) => {
    e.preventDefault();
    if(!codigo.trim() || !descripcion.trim() || !precio) return showToast("Faltan datos");
    
    const finalCode = codigo.padStart(4, '0').slice(0, 4);

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'catalogo'), {
        codigo: finalCode,
        descripcion: descripcion.trim(),
        precio: parseFloat(precio),
        creado: serverTimestamp()
      });
      setCodigo(''); setDescripcion(''); setPrecio('');
      showToast("Producto guardado");
    } catch (e) { console.error(e); showToast("Error al guardar"); }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <form onSubmit={addProducto} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
        <h2 className="text-xl font-black flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Tag className="text-rose-500" /> Nuevo Producto
        </h2>
        <div className="flex gap-3">
          <input placeholder="Código" value={codigo} onChange={e => setCodigo(e.target.value)} onBlur={handleCodigoBlur} className="w-1/3 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none font-mono" maxLength={4} />
          <input placeholder="Precio" type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} className="w-2/3 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none" />
        </div>
        <input placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none" />
        <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-colors">Guardar Producto</button>
      </form>

      <div className="space-y-2">
        <h3 className="font-bold text-zinc-400 px-2 uppercase text-xs tracking-wider">Inventario ({productos.length})</h3>
        {productos.map(p => (
          <div key={p.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800/50 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <span className="bg-zinc-800 text-zinc-400 font-mono text-xs px-2 py-1 rounded">{p.codigo}</span>
              <span className="font-bold text-zinc-200">{p.descripcion}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-black text-rose-500">${parseFloat(p.precio).toFixed(2)}</span>
              <button 
                onClick={() => {
                  setProductoEditando(p.id);
                  setEditCodigo(p.codigo);
                  setEditDescripcion(p.descripcion);
                  setEditPrecio(p.precio);
                }} 
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded-lg transition-all" title="Editar Producto">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {productoEditando && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <h3 className="text-xl font-black text-rose-500 flex items-center gap-2 mb-2"><Edit className="w-5 h-5"/> Editar Producto</h3>
            <div className="flex gap-3">
              <input 
                placeholder="Código" value={editCodigo} onChange={e => setEditCodigo(e.target.value)}
                onBlur={() => setEditCodigo(editCodigo.padStart(4, '0').slice(0, 4))}
                className="w-1/3 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none font-mono"
                maxLength={4}
              />
              <input 
                placeholder="Precio" type="number" step="0.01" value={editPrecio} onChange={e => setEditPrecio(e.target.value)}
                className="w-2/3 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
              />
            </div>
            <input 
              placeholder="Descripción" value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
            />
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setProductoEditando(null)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all">Cancelar</button>
              <button 
                onClick={async () => {
                  try {
                    const finalCode = editCodigo.padStart(4, '0').slice(0, 4);
                    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'catalogo', productoEditando), {
                      codigo: finalCode, descripcion: editDescripcion.trim(), precio: parseFloat(editPrecio)
                    });
                    setProductoEditando(null); showToast("Producto actualizado");
                  } catch (e) { console.error(e); showToast("Error al actualizar"); }
                }} 
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- VENDEDORES TAB ---
function VendedoresTab({ showToast, db, user, vendedores }) {
  const [nombre, setNombre] = useState('');

  const addVendedor = async (e) => {
    e.preventDefault();
    if(!nombre.trim()) return showToast("Nombre requerido");
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'vendedores'), {
        nombre: nombre.trim(),
        creado: serverTimestamp()
      });
      setNombre('');
      showToast("Vendedor registrado");
    } catch (e) {
      console.error(e); showToast("Error al guardar");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <form onSubmit={addVendedor} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
        <h2 className="text-xl font-black flex items-center gap-2 border-b border-zinc-800 pb-3">
          <UserCheck className="text-rose-500" /> Registrar Vendedor
        </h2>
        <input 
          placeholder="Nombre del Vendedor" value={nombre} onChange={e => setNombre(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
        />
        <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-colors">Guardar Vendedor</button>
      </form>

      <div className="grid grid-cols-2 gap-3">
        {vendedores.map(v => (
          <div key={v.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-600/20 flex items-center justify-center text-rose-500 font-bold">
              {v.nombre.charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-zinc-200 truncate">{v.nombre}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
