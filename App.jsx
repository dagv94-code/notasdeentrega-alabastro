import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, setDoc, getDoc, serverTimestamp, deleteDoc, writeBatch } from 'firebase/firestore';
import { 
  Users, ShoppingCart, UserCheck, FileText, Download, Plus, 
  Trash2, ChevronRight, CheckCircle2, Phone, MapPin, Tag, ArrowLeft,
  History, Wallet, Edit, Eye, Share2, Square, CheckSquare, Ban
} from 'lucide-react';

// --- FIREBASE INITIALIZATION (LLAVES REALES INSERTADAS) ---
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'agropecuaria-alabastro';

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
      let docRef = null;
      let timestamp = Date.now();

      if (!editingNota) {
        // Get and increment sequence safely only if it's a NEW note
        const seqRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'secuencia');
        let seqDoc = await getDoc(seqRef);
        
        if (seqDoc.exists()) {
          currentNumber = (seqDoc.data().valor || 0) + 1;
          await updateDoc(seqRef, { valor: currentNumber });
        } else {
          await setDoc(seqRef, { valor: currentNumber });
        }
      } else {
        timestamp = editingNota.timestamp || Date.now();
      }

      const total = items.reduce((acc, item) => acc + item.subtotal, 0);
      
      // Use existing date if editing, otherwise today
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

      // Save to Firebase
      if (editingNota) {
        docRef = doc(db, 'artifacts', appId, 'public', 'data', 'notas', editingNota.id);
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
        useCORS: true // Try to load the image cross-origin if needed
      });
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      if (shareToWhatsApp) {
        // Try native share if available and file sharing is supported
        if (navigator.canShare && navigator.canShare({ files: [new File([''], 'a.jpg', { type: 'image/jpeg' })] })) {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], `Recibo_Alabastro_${receiptData.numero}.jpg`, { type: 'image/jpeg' });
          await navigator.share({
            title: `Recibo ${receiptData.numero}`,
            text: `Adjunto nota de entrega N° ${receiptData.numero}`,
            files: [file]
          });
        } else {
           // Fallback to downloading + link to WhatsApp
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

        {/* RECEIPT PREVIEW - THIS IS WHAT GETS CONVERTED TO IMAGE */}
        <div className="overflow-x-auto pb-8">
          <div 
            id="recibo-final" 
            className="bg-white text-black p-8 w-[800px] mx-auto shadow-2xl relative"
            style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
          >
            {/* Header */}
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
                  <h2 className="text-2xl font-black text-rose-
