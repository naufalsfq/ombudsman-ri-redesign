'use client';
import {useEffect,useMemo,useRef,useState,useCallback} from 'react';
import {Search,ChevronDown,ChevronRight,ArrowRight,FileText,HelpCircle,MapPin,Phone,Mail,Shield,Clock3,Upload,Check,Users,Building2,Scale,Menu,X,TrendingUp,MessageSquare,Accessibility,BookOpen,Newspaper,Gavel,ListChecks,AlertCircle,Loader2,Trash2,ClipboardList} from 'lucide-react';

const AS={
  logo:'https://www.figma.com/api/mcp/asset/cbbd1a62-2e2d-48e0-9087-1fb4e84bb814.png',
  hero:'https://www.figma.com/api/mcp/asset/e0194518-204f-4c10-af26-30563c827889.png',
  news1:'https://www.figma.com/api/mcp/asset/0349bfc2-adaa-4cfd-9d47-d90936a8aeb8.png',
  news2:'https://www.figma.com/api/mcp/asset/17305cf8-733c-42ae-b101-cf4e1d25e91e.png',
  news3:'https://www.figma.com/api/mcp/asset/de5eaaa7-e8ee-4008-9ddd-a76002c0ba9b.png',
  about:'https://www.figma.com/api/mcp/asset/f9d033dc-09ab-41a5-8c63-9bd5eeeafead.png'
};

type Page='home'|'track'|'validate'|'form'|'faq'|'information'|'information-detail'|'prosedur';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PersonalData {
  type:'individu'|'instansi';
  category:string;
  nik:string; nama:string; hp:string; email:string;
  alamat:string; provinsi:string; kota:string;
  rahasiakan:boolean;
  namaOrganisasi:string;
  jabatan:string;
}
interface ComplaintData { perihal:string; instansi:string; kronologi:string; harapan:string; }
interface EvidenceData { ktpFiles:string[]; docFiles:string[]; consent:boolean; }
interface Submission { regNumber:string; tanggal:string; nama:string; perihal:string; instansi:string; status:string; }
interface ResultItem { id:string; category:string; filterKey:string; title:string; snippet:string; hasDetail?:boolean; articleId?:string; }
interface DetailData { id:string; title:string; intro:string; requirements?:{icon:string,text:string}[]; steps?:{num:string,title:string,desc:string}[]; documents?:string[]; note?:string; }

// ─── Module-level scroll intent ───────────────────────────────────────────────
let pendingScroll:string|null=null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const NAVBAR_HEIGHT = 68;

const go=(p:Page)=>{
  // Clear any hash when navigating to a new page
  history.pushState({},'',p==='home'?'/':'/'+p);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const goSection=(section:string)=>{
  // If already on home, just scroll
  if(typeof window !== 'undefined' && (location.pathname === '/' || location.pathname === '')){
    history.replaceState({},'','/#'+section);
    smoothScrollTo(section);
  } else {
    // Navigate to home with pending scroll
    pendingScroll=section;
    history.pushState({},'','/#'+section);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};

const goSearch=(q:string)=>{
  history.pushState({},'','/information?q='+encodeURIComponent(q));
  window.dispatchEvent(new PopStateEvent('popstate'));
};
const goDetail=(id:string)=>{
  history.pushState({},'','/information-detail?id='+encodeURIComponent(id));
  window.dispatchEvent(new PopStateEvent('popstate'));
};
const getParam=(name:string)=>{
  if(typeof window==='undefined') return '';
  return new URLSearchParams(window.location.search).get(name)||'';
};
const smoothScrollTo=(id:string)=>{
  const el = document.getElementById(id);
  if(!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT - 8;
  window.scrollTo({top:y,behavior:'smooth'});
};
const genRegNumber=()=>`ORI-2026-${String(Math.floor(Math.random()*900000)+100000)}`;

// ─── Submission storage — use localStorage for persistence across tabs ────────
const saveSubmission=(s:Submission)=>{
  const list:Submission[]=JSON.parse(localStorage.getItem('ombudsman_submissions')||'[]');
  localStorage.setItem('ombudsman_submissions',JSON.stringify([...list,s]));
};
const findSubmission=(reg:string):Submission|null=>{
  const list:Submission[]=JSON.parse(localStorage.getItem('ombudsman_submissions')||'[]');
  return list.find(s=>s.regNumber.toLowerCase()===reg.toLowerCase())||null;
};

// ─── Demo data — pre-seeded so Lacak Pengaduan can be tested ──────────────────
const DEMO_SUBMISSIONS:Submission[]=[
  {regNumber:'ORI-2026-000001',tanggal:'15/09/2026',nama:'Ahmad Fauzi',perihal:'Penundaan Pembuatan Paspor',instansi:'Kantor Imigrasi Jakarta Selatan',status:'Dalam Proses Verifikasi'},
  {regNumber:'ORI-2026-000002',tanggal:'22/09/2026',nama:'Siti Nurhaliza',perihal:'Penolakan Pembuatan Akta Kelahiran',instansi:'Dinas Kependudukan DKI Jakarta',status:'Sedang Ditindaklanjuti'},
  {regNumber:'ORI-2026-000003',tanggal:'28/09/2026',nama:'Budi Santoso',perihal:'Pungutan Liar dalam Pengurusan Izin Usaha',instansi:'Dinas Perizinan Kota Bandung',status:'Dalam Proses'},
];

const seedDemoData=()=>{
  const existing=localStorage.getItem('ombudsman_submissions');
  if(!existing || JSON.parse(existing).length===0){
    localStorage.setItem('ombudsman_submissions',JSON.stringify(DEMO_SUBMISSIONS));
  }
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const PROVINCES=['DKI Jakarta','Jawa Barat','Jawa Tengah','Jawa Timur','Banten',
  'DI Yogyakarta','Bali','Sumatera Utara','Sumatera Barat','Sumatera Selatan',
  'Kalimantan Barat','Kalimantan Timur','Sulawesi Selatan','Aceh','Riau','Lampung',
  'Nusa Tenggara Barat','Papua','Papua Barat','Maluku'];

const ARTICLES=[
  {id:'art1',img:AS.news1,tag:'Siaran Pers',date:'24 April 2026',
   title:'Ombudsman Terima Penghargaan Pelayanan Publik Terbaik 2026',
   content:`Ombudsman Republik Indonesia menerima penghargaan bergengsi dari Kementerian Pendayagunaan Aparatur Negara dan Reformasi Birokrasi atas kontribusi luar biasa dalam meningkatkan kualitas pelayanan publik di Indonesia selama tahun 2025–2026.\n\nPenghargaan ini diberikan berdasarkan evaluasi menyeluruh terhadap kinerja lembaga dalam menangani laporan maladministrasi, responsivitas terhadap pengaduan masyarakat, serta inovasi dalam sistem pelayanan pengaduan digital.\n\nKetua Ombudsman RI menyatakan bahwa penghargaan ini menjadi motivasi untuk terus meningkatkan pelayanan kepada masyarakat dan memastikan setiap laporan ditindaklanjuti secara transparan dan akuntabel.`},
  {id:'art2',img:AS.news2,tag:'Kegiatan',date:'18 April 2026',
   title:'Workshop Pencegahan Maladministrasi bagi ASN',
   content:`Ombudsman RI menggelar workshop bertajuk "Pencegahan Maladministrasi dalam Pelayanan Publik" yang dihadiri lebih dari 200 Aparatur Sipil Negara dari berbagai instansi pemerintah pusat dan daerah.\n\nWorkshop ini bertujuan meningkatkan pemahaman ASN tentang bentuk-bentuk maladministrasi yang sering terjadi dalam pelayanan publik serta cara mencegah dan mengatasinya.\n\nPeserta mendapatkan pembekalan tentang standar pelayanan publik sesuai UU No. 25 Tahun 2009, teknik penanganan pengaduan yang efektif, dan pentingnya transparansi dalam setiap proses pelayanan.`},
  {id:'art3',img:AS.news3,tag:'Berita',date:'10 April 2026',
   title:'Laporan Pengaduan Meningkat 15% di Kuartal Pertama',
   content:`Data terbaru Ombudsman RI menunjukkan peningkatan signifikan sebesar 15% dalam jumlah laporan pengaduan masyarakat pada kuartal pertama 2026 dibandingkan periode yang sama tahun lalu.\n\nPeningkatan ini menunjukkan semakin tingginya kesadaran masyarakat untuk melaporkan dugaan maladministrasi melalui jalur resmi. Sebagian besar laporan berkaitan dengan penundaan berlarut, diskriminasi dalam pelayanan, dan penyimpangan prosedur.\n\nOmbudsman RI berkomitmen untuk menangani seluruh laporan secara profesional dan memastikan setiap warga negara mendapatkan pelayanan publik yang layak sesuai haknya.`},
];

const ARTICLE_MAP=Object.fromEntries(ARTICLES.map(a=>[a.id,a]));

const AC_DATA=[
  {cat:'INFORMASI',icon:'info',items:['Pengaduan Online','Informasi Publik','Layanan Ombudsman','Kantor Perwakilan']},
  {cat:'PROSEDUR',icon:'arrow',items:['Cara Membuat Pengaduan','Syarat Pengaduan','Prosedur Pengaduan','Tahapan Penanganan','Lacak Laporan']},
  {cat:'FAQ',icon:'help',items:['FAQ Pengaduan','FAQ Maladministrasi','FAQ Hak Pelapor','Apakah pengaduan gratis']},
  {cat:'BERITA',icon:'news',items:['Berita Terkini Ombudsman','Siaran Pers','Pengumuman','Workshop ASN']},
];

const RESULTS:ResultItem[]=[
  {id:'pengaduan-online',category:'Informasi · Pengaduan',filterKey:'Informasi',title:'Pengaduan Online',snippet:'Sampaikan laporan pelayanan publik kepada Ombudsman RI dengan mudah, aman, dan tanpa dipungut biaya apapun.'},
  {id:'cara-membuat-pengaduan',category:'Prosedur Pengaduan',filterKey:'Prosedur',title:'Cara Membuat Pengaduan',snippet:'Pelajari tahapan, persyaratan, dan dokumen yang perlu dipersiapkan sebelum mengajukan pengaduan kepada Ombudsman RI.',hasDetail:true},
  {id:'syarat-pengaduan',category:'Prosedur Pengaduan',filterKey:'Prosedur',title:'Syarat Pengaduan',snippet:'Ketahui syarat formal dan material laporan kepada Ombudsman RI agar pengaduan Anda dapat diproses dengan baik.',hasDetail:true},
  {id:'prosedur-pengaduan',category:'Prosedur Pengaduan',filterKey:'Prosedur',title:'Prosedur Pengaduan Lengkap',snippet:'Panduan lengkap alur penanganan laporan pengaduan oleh Ombudsman RI dari penerimaan hingga penyelesaian.',hasDetail:true},
  {id:'faq-gratis',category:'FAQ · Layanan Publik',filterKey:'FAQ',title:'Apakah pengaduan ke Ombudsman gratis?',snippet:'Pengaduan kepada Ombudsman RI dapat dilakukan secara gratis tanpa dipungut biaya apapun dalam bentuk apapun.'},
  {id:'hak-pelapor',category:'FAQ · Hak Pelapor',filterKey:'FAQ',title:'Hak Pelapor dalam Proses Pengaduan',snippet:'Setiap pelapor berhak mendapatkan perlindungan kerahasiaan identitas, informasi perkembangan laporan, dan perlakuan yang adil.'},
  {id:'faq-maladministrasi',category:'FAQ · Layanan Publik',filterKey:'FAQ',title:'Apa saja yang termasuk maladministrasi?',snippet:'Maladministrasi mencakup penundaan berlarut, penyimpangan prosedur, diskriminasi, dan bentuk pelayanan buruk lainnya.'},
  {id:'berita-penghargaan',category:'Berita · Siaran Pers',filterKey:'Berita',title:'Ombudsman Terima Penghargaan Pelayanan Publik Terbaik 2026',snippet:'Ombudsman RI menerima penghargaan bergengsi atas kontribusinya dalam meningkatkan kualitas pelayanan publik Indonesia.',articleId:'art1'},
  {id:'berita-workshop',category:'Berita · Kegiatan',filterKey:'Berita',title:'Workshop Pencegahan Maladministrasi bagi ASN',snippet:'Ombudsman RI menggelar workshop untuk meningkatkan pemahaman ASN tentang pencegahan maladministrasi.',articleId:'art2'},
  {id:'uu-ombudsman',category:'Dasar Hukum',filterKey:'Dasar Hukum',title:'UU No. 37 Tahun 2008 tentang Ombudsman RI',snippet:'Undang-Undang yang menjadi landasan pembentukan dan kewenangan Ombudsman Republik Indonesia.'},
  {id:'uu-pelayanan-publik',category:'Dasar Hukum',filterKey:'Dasar Hukum',title:'UU No. 25 Tahun 2009 tentang Pelayanan Publik',snippet:'Peraturan yang mengatur standar pelayanan publik dan hak warga negara untuk mendapatkan pelayanan yang baik.'},
  {id:'laporan-statistik',category:'Berita · Statistik',filterKey:'Berita',title:'Laporan Pengaduan Meningkat 15% di Kuartal Pertama',snippet:'Data terbaru menunjukkan peningkatan jumlah laporan pengaduan masyarakat kepada Ombudsman RI pada kuartal pertama 2026.',articleId:'art3'},
];

const DETAIL_MAP:Record<string,DetailData>={
  'cara-membuat-pengaduan':{id:'cara-membuat-pengaduan',title:'Cara Membuat Pengaduan ke Ombudsman RI',
    intro:'Ombudsman RI memberikan layanan penerimaan laporan pengaduan masyarakat yang mengalami dugaan maladministrasi oleh penyelenggara pelayanan publik. Proses pengaduan sepenuhnya gratis dan dijaga kerahasiaannya.',
    requirements:[{icon:'✓',text:'Telah menyampaikan keluhan ke instansi terkait terlebih dahulu'},{icon:'✓',text:'Memiliki bukti/nomor tiket laporan dari instansi terkait'},{icon:'✓',text:'Memiliki identitas diri yang sah (KTP/Paspor)'},{icon:'✓',text:'Dapat menjelaskan kronologi kejadian secara jelas'}],
    steps:[{num:'01',title:'Lapor ke Instansi Terkait',desc:'Sampaikan keluhan Anda terlebih dahulu ke instansi yang bersangkutan dan tunggu respons selama batas waktu yang wajar.'},{num:'02',title:'Siapkan Dokumen',desc:'Kumpulkan bukti seperti: bukti laporan ke instansi, KTP, dokumen pendukung peristiwa yang dilaporkan.'},{num:'03',title:'Isi Formulir Pengaduan',desc:'Akses formulir pengaduan online di website ini atau datang langsung ke kantor Ombudsman RI terdekat.'},{num:'04',title:'Terima Nomor Registrasi',desc:'Setelah pengaduan terkirim, Anda akan menerima nomor registrasi untuk memantau perkembangan laporan.'},{num:'05',title:'Proses Penanganan',desc:'Ombudsman RI akan memproses laporan dalam 60–90 hari kerja, menghubungi Anda untuk klarifikasi bila diperlukan.'},{num:'06',title:'Penyelesaian Laporan',desc:'Ombudsman akan memberikan Rekomendasi atau Saran kepada instansi terlapor untuk perbaikan pelayanan.'}],
    documents:['KTP/Kartu Identitas Diri yang masih berlaku','Bukti laporan ke instansi terkait (nomor tiket/surat)','Dokumen pendukung yang berkaitan dengan peristiwa','Foto/screenshot bukti pelayanan yang buruk (jika ada)'],
    note:'Seluruh proses pengaduan kepada Ombudsman RI tidak dipungut biaya apapun.'},
  'syarat-pengaduan':{id:'syarat-pengaduan',title:'Syarat Pengaduan ke Ombudsman RI',
    intro:'Agar pengaduan Anda dapat diproses, terdapat beberapa syarat formal dan material yang harus dipenuhi sesuai UU No. 37 Tahun 2008 tentang Ombudsman RI.',
    requirements:[{icon:'✓',text:'Pengadu adalah warga negara atau badan hukum yang menerima pelayanan publik'},{icon:'✓',text:'Terlapor adalah penyelenggara pelayanan publik (instansi pemerintah, BUMN/BUMD, dll)'},{icon:'✓',text:'Dugaan perbuatan yang dilaporkan adalah maladministrasi'},{icon:'✓',text:'Pengadu telah menyampaikan keluhan ke instansi yang bersangkutan'},{icon:'✓',text:'Peristiwa yang dilaporkan terjadi tidak lebih dari 2 tahun yang lalu'}],
    steps:[{num:'01',title:'Syarat Pengadu',desc:'Setiap orang termasuk warga negara asing atau badan hukum yang memiliki kepentingan langsung atau tidak langsung terhadap pelayanan publik.'},{num:'02',title:'Objek Pengaduan',desc:'Maladministrasi dalam penyelenggaraan pelayanan publik seperti penundaan berlarut, penyalahgunaan wewenang, diskriminasi, dll.'},{num:'03',title:'Instansi Terlapor',desc:'Lembaga eksekutif, legislatif, yudikatif, dan badan lain yang menyelenggarakan pelayanan publik sesuai UU.'}],
    documents:['Identitas diri yang sah','Bukti telah melapor ke instansi terkait','Dokumen atau bukti pendukung lainnya'],
    note:'Pengaduan yang tidak memenuhi syarat akan dikembalikan dengan penjelasan tertulis.'},
  'prosedur-pengaduan':{id:'prosedur-pengaduan',title:'Prosedur Pengaduan Lengkap Ombudsman RI',
    intro:'Berikut adalah prosedur lengkap penanganan laporan pengaduan oleh Ombudsman RI, dari saat pengaduan diterima hingga penyelesaian akhir.',
    requirements:[{icon:'📋',text:'Verifikasi kelengkapan berkas oleh petugas Ombudsman'},{icon:'📋',text:'Pemberitahuan tertulis kepada pelapor dalam 14 hari'},{icon:'📋',text:'Klarifikasi dan pemeriksaan substantif'},{icon:'📋',text:'Mediasi atau Rekomendasi kepada instansi terlapor'}],
    steps:[{num:'01',title:'Penerimaan Laporan',desc:'Laporan diterima melalui online, kantor, surat, atau email. Petugas melakukan pemeriksaan awal kelengkapan berkas dalam 14 hari.'},{num:'02',title:'Registrasi & Verifikasi',desc:'Laporan yang memenuhi syarat diregistrasi dan diberikan nomor registrasi kepada pelapor sebagai bukti pengaduan diterima.'},{num:'03',title:'Pemeriksaan Substantif',desc:'Ombudsman melakukan investigasi, meminta keterangan dari pelapor dan terlapor, serta menganalisis bukti yang ada.'},{num:'04',title:'Mediasi',desc:'Ombudsman dapat memfasilitasi mediasi antara pelapor dan instansi terlapor untuk mencapai solusi terbaik.'},{num:'05',title:'Rekomendasi/Saran',desc:'Jika mediasi tidak berhasil, Ombudsman mengeluarkan Rekomendasi yang wajib dilaksanakan oleh instansi terlapor.'},{num:'06',title:'Pelaporan Hasil',desc:'Ombudsman melaporkan hasil penanganan kepada pelapor dan memantau pelaksanaan Rekomendasi oleh instansi.'}],
    documents:['Surat konfirmasi penerimaan laporan','Nomor registrasi laporan','Berita acara klarifikasi (jika diperlukan)'],
    note:'Proses penanganan laporan membutuhkan waktu 60–90 hari kerja tergantung kompleksitas kasus.'},
};

const FAQS=[
  ['Tentang Ombudsman','Apa itu Ombudsman Republik Indonesia?','Ombudsman RI adalah lembaga negara yang mengawasi penyelenggaraan pelayanan publik yang diselenggarakan oleh Penyelenggara Negara dan pemerintahan, termasuk BUMN, BUMD, dan badan swasta tertentu yang mendapat pendanaan dari APBN/APBD.'],
  ['Tentang Ombudsman','Apakah Ombudsman RI memiliki perwakilan di daerah?','Ya, Ombudsman memiliki kantor perwakilan di berbagai provinsi di seluruh Indonesia untuk memberikan layanan yang lebih dekat kepada masyarakat.'],
  ['Hak Pelapor','Siapa saja yang dapat melapor ke Ombudsman RI?','Setiap warga negara Indonesia atau badan hukum yang menerima atau pernah menerima pelayanan publik dapat menyampaikan laporan kepada Ombudsman RI.'],
  ['Hak Pelapor','Apakah identitas saya akan dirahasiakan?','Identitas pelapor dapat dirahasiakan atas permintaan pelapor atau berdasarkan pertimbangan kebutuhan pemeriksaan. Ombudsman menjamin perlindungan identitas sesuai UU No. 37 Tahun 2008.'],
  ['Layanan Publik','Apa saja yang termasuk maladministrasi?','Maladministrasi meliputi: penundaan berlarut, penyimpangan prosedur, penyalahgunaan wewenang, diskriminasi, permintaan imbalan di luar ketentuan, dan tindakan tidak patut dalam pelayanan publik.'],
  ['Layanan Publik','Instansi apa saja yang dapat dilaporkan ke Ombudsman?','Instansi penyelenggara pelayanan publik termasuk: lembaga pemerintah pusat dan daerah, BUMN/BUMD, badan hukum swasta yang mendapat pendanaan dari APBN/APBD, atau penyelenggara pelayanan publik lainnya.'],
  ['Layanan Publik','Apakah pengaduan ke Ombudsman gratis?','Ya, seluruh proses pengaduan kepada Ombudsman RI tidak dipungut biaya apapun dalam bentuk apapun. Layanan ini sepenuhnya gratis untuk masyarakat.'],
  ['Dasar Hukum','Apa peraturan yang mengatur pelayanan publik di Indonesia?','Pelayanan publik diatur oleh Undang-Undang Nomor 25 Tahun 2009 tentang Pelayanan Publik dan Undang-Undang Nomor 37 Tahun 2008 tentang Ombudsman Republik Indonesia.'],
  ['Kontak & Akses','Bagaimana cara menghubungi Ombudsman RI?','Anda dapat menghubungi Ombudsman RI melalui telepon (021) 5790-6277, email info@ombudsman.go.id, atau datang langsung ke kantor kami.'],
  ['Kontak & Akses','Di mana kantor pusat Ombudsman RI?','Kantor pusat Ombudsman RI berlokasi di Jl. HR. Rasuna Said Kav. C-19, Jakarta Selatan 12920.'],
];

// ─── Components ───────────────────────────────────────────────────────────────

// News Modal
function NewsModal({articleId,onClose}:{articleId:string,onClose:()=>void}){
  const article=ARTICLE_MAP[articleId];
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};
    window.addEventListener('keydown',h);
    document.body.style.overflow='hidden';
    return()=>{window.removeEventListener('keydown',h);document.body.style.overflow='';};
  },[onClose]);
  if(!article) return null;
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Tutup"><X size={20}/></button>
        <img src={article.img} alt={article.title} className="modal-img"/>
        <div className="modal-body">
          <div className="modal-meta"><em>{article.tag}</em><small>{article.date}</small></div>
          <h2>{article.title}</h2>
          {article.content.split('\n\n').map((p,i)=><p key={i}>{p}</p>)}
        </div>
      </div>
    </div>
  );
}

// Header — Beranda, Berita, Profil, Pengaduan (dropdown), Bantuan
// Each menu targets a specific section via goSection with correct IDs
function Header({page,navSection,onSearch}:{page:Page,navSection:string,onSearch:()=>void}){
  const [mobileOpen,setMobileOpen]=useState(false);
  const [dropOpen,setDropOpen]=useState(false);
  const dropRef=useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(()=>{
    const h=(e:MouseEvent)=>{
      if(dropRef.current&&!dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);

  // Close dropdown on page change
  useEffect(()=>{setDropOpen(false);},[page]);

  const isActive=(label:string)=>{
    if(page==='home'){
      if(label==='Beranda') return !navSection||navSection==='hero'||navSection==='services'||navSection==='stats';
      if(label==='Profil') return navSection==='about';
      if(label==='Berita') return navSection==='news';
      return false;
    }
    if(label==='Pengaduan') return page==='validate'||page==='form'||page==='track'||page==='prosedur';
    if(label==='Bantuan') return page==='faq';
    return false;
  };

  // Beranda click: always go to home, scroll to top (hero)
  const handleBeranda=()=>{
    if(page==='home'){
      window.scrollTo({top:0,behavior:'smooth'});
      history.replaceState({},'','/');
    } else {
      pendingScroll='hero';
      go('home');
    }
    setMobileOpen(false);
  };

  return (
    <header className="header">
      <button className="brand" onClick={handleBeranda} aria-label="Beranda">
        <img src={AS.logo} alt="Ombudsman Republik Indonesia"/>
      </button>
      <nav className={mobileOpen?'nav open':'nav'}>
        {/* Beranda — always scrolls to top/hero */}
        <button className={isActive('Beranda')?'active':''} onClick={handleBeranda}>Beranda</button>
        {/* Berita — scrolls to #news section */}
        <button className={isActive('Berita')?'active':''} onClick={()=>{goSection('news');setMobileOpen(false);}}>Berita</button>
        {/* Profil — scrolls to #about section */}
        <button className={isActive('Profil')?'active':''} onClick={()=>{goSection('about');setMobileOpen(false);}}>Profil</button>

        {/* Pengaduan — dropdown */}
        <div className="nav-dropdown" ref={dropRef}>
          <button
            className={'nav-drop-trigger'+(isActive('Pengaduan')?' active':'')}
            onClick={()=>setDropOpen(o=>!o)}
            aria-expanded={dropOpen}
            aria-haspopup="true"
          >
            Pengaduan
            <ChevronDown size={12} style={{transform:dropOpen?'rotate(180deg)':'',transition:'transform .2s',marginLeft:3,flexShrink:0}}/>
          </button>
          {dropOpen&&(
            <div className="dropdown-menu" role="menu">
              <button role="menuitem" onClick={()=>{go('prosedur');setDropOpen(false);setMobileOpen(false);}}>
                <ClipboardList size={15}/>Prosedur Pengaduan
              </button>
              <button role="menuitem" onClick={()=>{go('validate');setDropOpen(false);setMobileOpen(false);}}>
                <FileText size={15}/>Buat Pengaduan
              </button>
              <button role="menuitem" onClick={()=>{go('track');setDropOpen(false);setMobileOpen(false);}}>
                <Search size={15}/>Lacak Pengaduan
              </button>
            </div>
          )}
        </div>

        {/* Bantuan (was FAQ) */}
        <button className={isActive('Bantuan')?'active':''} onClick={()=>{go('faq');setMobileOpen(false);}}>Bantuan</button>

        {/* Search icon */}
        <button aria-label="Cari" onClick={()=>{setMobileOpen(false);onSearch();}}>
          <Search size={19}/>
        </button>
      </nav>
      <button className="hamb" onClick={()=>setMobileOpen(!mobileOpen)} aria-label={mobileOpen?'Tutup menu':'Buka menu'}>
        {mobileOpen?<X/>:<Menu/>}
      </button>
    </header>
  );
}

// Footer — updated: FAQ→Bantuan, added Prosedur
function Footer(){
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <img src={AS.logo} alt="Ombudsman RI"/>
          <p>Pengawas penyelenggaraan pelayanan publik untuk mewujudkan pelayanan yang lebih baik dan berkualitas.</p>
        </div>
        <div>
          <h3>Tautan Cepat</h3>
          <button onClick={()=>goSection('about')}>Tentang Kami</button>
          <button onClick={()=>goSection('about')}>Visi &amp; Misi</button>
          <button onClick={()=>goSection('about')}>Struktur Organisasi</button>
          <button onClick={()=>goSection('stats')}>Laporan Tahunan</button>
        </div>
        <div>
          <h3>Layanan</h3>
          <button onClick={()=>go('prosedur')}>Prosedur Pengaduan</button>
          <button onClick={()=>go('validate')}>Pengaduan Online</button>
          <button onClick={()=>go('track')}>Lacak Laporan</button>
          <button onClick={()=>go('faq')}>Bantuan</button>
        </div>
        <div>
          <h3>Kontak</h3>
          <p><MapPin/> Jl. HR. Rasuna Said Kav. C-19,<br/> Jakarta 12920</p>
          <p><a href="tel:+622157906277" style={{color:'inherit',textDecoration:'none'}}><Phone/> (021) 5790-6277</a></p>
          <p><a href="mailto:info@ombudsman.go.id" style={{color:'inherit',textDecoration:'none'}}><Mail/> info@ombudsman.go.id</a></p>
        </div>
      </div>
      <div className="copyright">
        © 2026 Ombudsman Republik Indonesia. Hak Cipta Dilindungi.
        <span>●　◉　◎　▻</span>
      </div>
    </footer>
  );
}

// Search Panel
function SearchPanel({close,navigate}:{close:()=>void,navigate:(q:string)=>void}){
  const [q,setQ]=useState('');
  const inputRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{inputRef.current?.focus();},[]);
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.key==='Escape')close();};
    window.addEventListener('keydown',h);
    return()=>window.removeEventListener('keydown',h);
  },[close]);

  const filtered=useMemo(()=>{
    if(!q.trim()) return [];
    const lower=q.toLowerCase();
    return AC_DATA.map(g=>({...g,items:g.items.filter(i=>i.toLowerCase().includes(lower))})).filter(g=>g.items.length>0);
  },[q]);

  const submit=()=>{if(q.trim()){navigate(q.trim());}};

  return (
    <div className="search-panel-overlay" onClick={close}>
      <div className="search-panel" onClick={e=>e.stopPropagation()}>
        <div className="searchbox">
          <Search size={18}/>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter')submit();if(e.key==='Escape')close();}}
            placeholder="Cari informasi Ombudsman..." aria-label="Cari informasi Ombudsman"/>
          {q&&<button onClick={()=>setQ('')} aria-label="Hapus"><X size={18}/></button>}
          {q&&<button className="btn search-btn-inline" onClick={submit}>Cari</button>}
        </div>
        {q&&filtered.length>0&&(
          <div className="autocomplete">
            {filtered.map(g=>(
              <div key={g.cat}>
                <small>{g.cat}</small>
                {g.items.map(item=>(
                  <button key={item} onClick={()=>navigate(item)}>
                    {g.icon==='info'&&<FileText size={15}/>}
                    {g.icon==='arrow'&&<ArrowRight size={15}/>}
                    {g.icon==='help'&&<HelpCircle size={15}/>}
                    {g.icon==='news'&&<Newspaper size={15}/>}
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
        {!q&&(
          <div className="popular">
            <span>Pencarian populer:</span>
            {['pengaduan gratis','maladministrasi','hak pelapor','lacak laporan'].map(x=>(
              <button key={x} onClick={()=>setQ(x)}>{x}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Shell — manages nav section, updated crumb labels
function Shell({page,children,crumb=true,searchQ=''}:{page:Page,children:React.ReactNode,crumb?:boolean,searchQ?:string}){
  const [search,setSearch]=useState(false);
  const [navSection,setNavSection]=useState('hero');

  useEffect(()=>{
    const h=(e:Event)=>setNavSection((e as CustomEvent<string>).detail);
    window.addEventListener('sectionChange',h);
    return()=>window.removeEventListener('sectionChange',h);
  },[]);

  const openSearch=()=>setSearch(true);
  const closeSearch=()=>setSearch(false);
  const navigate=(q:string)=>{closeSearch();goSearch(q);};

  const crumbLabel=()=>{
    if(page==='faq') return 'Bantuan';
    if(page==='track') return 'Lacak Pengaduan';
    if(page==='information') return 'Hasil Pencarian';
    if(page==='information-detail') return null;
    if(page==='form') return 'Formulir Pengaduan';
    if(page==='prosedur') return 'Prosedur Pengaduan';
    return 'Validasi Laporan';
  };

  return (
    <>
      <Header page={page} navSection={navSection} onSearch={openSearch}/>
      {search&&<SearchPanel close={closeSearch} navigate={navigate}/>}
      {crumb&&page!=='home'&&(
        <div className="crumb">
          <button onClick={()=>go('home')}>Beranda</button>
          {page==='information-detail'
            ?<><ChevronRight/><button onClick={()=>go('information')}>Hasil Pencarian</button>{searchQ&&<><ChevronRight/><span>{searchQ}</span></>}</>
            :<><ChevronRight/><span>{crumbLabel()}</span></>
          }
        </div>
      )}
      {children}
      <Footer/>
    </>
  );
}

const Button=({children,onClick,secondary=false,disabled=false,loading=false}:{children:React.ReactNode,onClick?:()=>void,secondary?:boolean,disabled?:boolean,loading?:boolean})=>(
  <button className={'btn '+(secondary?'secondary':'')} onClick={onClick} disabled={disabled||loading}>
    {loading&&<Loader2 size={16} className="spin"/>}
    {children}
  </button>
);

function Field({label,value,set,placeholder,type='text',error,required=true}:{label:string,value?:string,set?:(x:string)=>void,placeholder?:string,type?:string,error?:string,required?:boolean}){
  return (
    <label className={'field'+(error?' field-has-error':'')}>
      {label}{required&&<b> *</b>}
      <input type={type} value={value??''} onChange={e=>set?.(e.target.value)} placeholder={placeholder}/>
      {error&&<span className="field-error"><AlertCircle size={13}/>{error}</span>}
    </label>
  );
}

function SectionTitle({title,sub}:{title:string,sub:string}){
  return <div className="section-title"><h2>{title}</h2><p>{sub}</p></div>;
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function Home(){
  const [newsModal,setNewsModal]=useState<string|null>(null);

  // Handle pending scroll (from other pages or hash in URL)
  useEffect(()=>{
    // Check for pending scroll from goSection
    if(pendingScroll){
      const target=pendingScroll;
      pendingScroll=null;
      setTimeout(()=>{
        if(target==='hero'){
          window.scrollTo({top:0,behavior:'smooth'});
        } else {
          smoothScrollTo(target);
        }
      },150);
    } else {
      // Check URL hash on initial load
      const hash = window.location.hash.replace('#','');
      if(hash && hash !== 'hero'){
        setTimeout(()=>smoothScrollTo(hash),150);
      }
    }
  },[]);

  useEffect(()=>{
    const dispatch=(id:string)=>window.dispatchEvent(new CustomEvent('sectionChange',{detail:id}));
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting) dispatch(e.target.id);});
    },{threshold:0,rootMargin:'-20% 0px -60% 0px'});
    ['hero','news','about'].forEach(id=>{
      const el=document.getElementById(id);
      if(el) observer.observe(el);
    });
    dispatch('hero');
    return()=>observer.disconnect();
  },[]);

  // Seed demo data for Lacak Pengaduan
  useEffect(()=>{seedDemoData();},[]);

  const services:[string,string,()=>void][]=[
    ['▣','Buat Pengaduan',()=>go('validate')],
    ['⌕','Lacak Pengaduan',()=>go('track')],
    ['♧','Kantor Perwakilan',()=>goSearch('kantor perwakilan')],
    ['▤','Pusat Bantuan',()=>go('faq')],
  ];

  return (
    <Shell page="home" crumb={false}>
      {newsModal&&<NewsModal articleId={newsModal} onClose={()=>setNewsModal(null)}/>}
      <main>
        <section id="hero" className="hero" style={{backgroundImage:`linear-gradient(90deg,rgba(2,43,123,.94),rgba(13,80,231,.75)),url(${AS.hero})`}}>
          <div className="hero-copy">
            <span>Pengawas Pelayanan Publik Indonesia</span>
            <h1>Laporkan<br/>Masalah<br/>Pelayanan Publik<br/>dengan Mudah</h1>
            <p>Sampaikan laporan maladministrasi pelayanan publik Anda. Ombudsman RI siap membantu menyelesaikannya dengan transparan dan akuntabel.</p>
            <div>
              <Button onClick={()=>go('validate')}>▣　Buat Pengaduan</Button>
              <Button secondary onClick={()=>go('track')}>⌕　Lacak Status Pengaduan</Button>
            </div>
          </div>
          <article className="feature">
            <img src={AS.news1} alt="Berita"/>
            <div>
              <em>Siaran Pers</em>
              <small>24 April 2026</small>
              <h3>Ombudsman Terima Penghargaan Pelayanan Publik Terbaik 2026</h3>
              <a role="button" tabIndex={0} onClick={()=>setNewsModal('art1')} onKeyDown={e=>e.key==='Enter'&&setNewsModal('art1')}>Baca Selengkapnya →</a>
            </div>
          </article>
        </section>

        <section id="services" className="services">
          <SectionTitle title="Layanan Kami" sub="Akses berbagai layanan untuk membantu Anda mendapatkan pelayanan publik yang lebih baik"/>
          <div className="service-grid">
            {services.map(([icon,label,action])=>(
              <button key={label} onClick={action}>
                <i>{icon}</i>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>



        <section id="news" className="news">
          <div className="section-head">
            <SectionTitle title="Berita Terkini" sub="Update dan informasi terbaru dari Ombudsman RI"/>
            <button onClick={()=>goSection('news')} style={{background:'none',color:'#155dfc',fontWeight:600,fontSize:14}}>Lihat Semua →</button>
          </div>
          <div className="news-grid">
            {ARTICLES.map(a=>(
              <article key={a.id}>
                <img src={a.img} alt={a.title}/>
                <div>
                  <small>▣ {a.date}　<em>{a.tag}</em></small>
                  <h3>{a.title}</h3>
                  <p>Peningkatan kualitas pelayanan publik menjadi komitmen utama dalam memberikan layanan terbaik kepada masyarakat.</p>
                  <a role="button" tabIndex={0} onClick={()=>setNewsModal(a.id)} onKeyDown={e=>e.key==='Enter'&&setNewsModal(a.id)}>Baca Selengkapnya→</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="about">
          <small>TENTANG KAMI</small>
          <h2>Ombudsman Republik Indonesia</h2>
          <p>Ombudsman Republik Indonesia adalah lembaga negara yang mempunyai kewenangan mengawasi penyelenggaraan pelayanan publik yang diselenggarakan oleh Penyelenggara Negara dan pemerintahan baik di pusat dan daerah, termasuk BUMN, BUMD, dan badan swasta tertentu.</p>
          <p>Ombudsman RI dibentuk berdasarkan Undang-Undang Nomor 37 Tahun 2008 tentang Ombudsman Republik Indonesia.</p>
          <div className="values">
            {([[Shield,'Independen','Bebas dari pengaruh kekuasaan'],[Scale,'Transparan','Terbuka kepada publik'],[Check,'Akuntabel','Bertanggung jawab atas kinerjanya']] as const).map(([Icon,a,b]:any)=>(
              <div key={a}><Icon/><span><b>{a}</b><small>{b}</small></span></div>
            ))}
          </div>
          <img className="about-img" src={AS.about} alt="Tentang Ombudsman"/>
        </section>
      </main>
      <button className="access" aria-label="Aksesibilitas" onClick={()=>document.body.classList.toggle('high-contrast')}>
        <Accessibility/>
      </button>
    </Shell>
  );
}

// ─── Track Page — with demo data for testing ──────────────────────────────────
function Track(){
  const [id,setId]=useState('');
  const [result,setResult]=useState<Submission|null>(null);
  const [notFound,setNotFound]=useState(false);
  const [empty,setEmpty]=useState(false);
  const [loading,setLoading]=useState(false);

  // Seed demo data
  useEffect(()=>{seedDemoData();},[]);

  const handleLacak=()=>{
    const trimmed=id.trim();
    if(!trimmed){setEmpty(true);setNotFound(false);setResult(null);return;}
    setEmpty(false);
    setNotFound(false);
    setResult(null);
    setLoading(true);
    setTimeout(()=>{
      setLoading(false);
      const found=findSubmission(trimmed);
      if(found){setResult(found);setNotFound(false);}
      else{setResult(null);setNotFound(true);}
    },600);
  };

  return (
    <Shell page="track">
      <section className="blue-hero">
        <Search/>
        <h1>Lacak Pengaduan</h1>
        <p>Pantau perkembangan laporan pengaduan Anda secara real-time<br/>dengan memasukkan nomor registrasi laporan.</p>
      </section>
      <main className="track-main">
        <div className="track-form">
          <label>Nomor Registrasi Laporan</label>
          <p className="track-hint">Nomor registrasi diberikan pada halaman konfirmasi setelah pengaduan berhasil dikirim. Format: <strong>ORI-XXXX-XXXXXX</strong></p>
          <div>
            <input
              value={id}
              onChange={e=>{setId(e.target.value);setNotFound(false);setEmpty(false);setResult(null);}}
              onKeyDown={e=>e.key==='Enter'&&!loading&&handleLacak()}
              placeholder="Contoh: ORI-2026-001234"
              aria-label="Nomor Registrasi Laporan"
              disabled={loading}
            />
            <Button onClick={handleLacak} loading={loading} disabled={loading}>
              <Search size={16}/> {loading?'Mencari...':'Lacak'}
            </Button>
          </div>
          {empty&&<p className="form-message"><AlertCircle size={14}/> Silakan masukkan nomor registrasi laporan.</p>}
          {notFound&&(
            <div className="track-not-found">
              <AlertCircle size={18}/>
              <div>
                <b>Nomor registrasi tidak ditemukan</b>
                <p>Pastikan nomor yang Anda masukkan sudah benar. Format: ORI-XXXX-XXXXXX. Coba gunakan salah satu nomor demo di bawah untuk menguji fitur ini.</p>
              </div>
            </div>
          )}
        </div>

        {result&&(
          <div className="track-result">
            <div className="track-result-header">
              <Check size={20}/>
              <div>
                <h3>Laporan Ditemukan</h3>
                <span className="status-badge">{result.status}</span>
              </div>
            </div>
            <div className="track-result-grid">
              <div><small>Nomor Registrasi</small><b>{result.regNumber}</b></div>
              <div><small>Tanggal Laporan</small><b>{result.tanggal}</b></div>
              <div><small>Nama Pelapor</small><b>{result.nama||'—'}</b></div>
              <div><small>Perihal</small><b>{result.perihal||'—'}</b></div>
              <div><small>Instansi Terlapor</small><b>{result.instansi||'—'}</b></div>
              <div><small>Estimasi Selesai</small><b>60–90 hari kerja</b></div>
            </div>
            <p className="track-note">Ombudsman RI akan menghubungi Anda jika diperlukan klarifikasi lebih lanjut.</p>
          </div>
        )}



        <div className="tip-grid">
          {([[Search,'Masukkan Nomor Registrasi','Nomor registrasi dikirimkan ke halaman konfirmasi saat laporan berhasil dikirim.'],[Clock3,'Waktu Penanganan','Proses penanganan laporan membutuhkan 60–90 hari kerja tergantung kompleksitas.'],[Shield,'Kerahasiaan Terjamin','Identitas pelapor dijaga kerahasiaannya sesuai UU No. 37 Tahun 2008.']] as any[]).map(([Icon,t,d])=>(
            <div key={t}><Icon/><span><b>{t}</b><p>{d}</p></span></div>
          ))}
        </div>
        <div className="cta-row">
          <span><b>Belum punya nomor registrasi?</b><p>Buat laporan pengaduan baru dan dapatkan nomor registrasi untuk pemantauan.</p></span>
          <Button onClick={()=>go('validate')}>Buat Laporan Baru <ArrowRight/></Button>
        </div>
      </main>
    </Shell>
  );
}

// ─── Validate Page — fixed radio: both selections visually correct ─────────────
function Validate(){
  const [choice,setChoice]=useState<'sudah'|'belum'>('sudah');
  const [ticket,setTicket]=useState('');
  const [date,setDate]=useState('');
  const [showSearch,setShowSearch]=useState(false);
  const [errors,setErrors]=useState<Record<string,string>>({});

  const handleLanjut=()=>{
    if(choice==='belum'){return;}
    const errs:Record<string,string>={};
    if(!ticket) errs.ticket='Nomor tiket wajib diisi';
    if(!date) errs.date='Tanggal pelaporan wajib diisi';
    if(Object.keys(errs).length){setErrors(errs);return;}
    go('form');
  };

  return (
    <Shell page="validate">
      {showSearch&&<SearchPanel close={()=>setShowSearch(false)} navigate={q=>{setShowSearch(false);goSearch(q);}}/>}
      <main className="form-bg">
        <div className="form-heading">
          <h1>Formulir Pengaduan Masyarakat</h1>
          <p>Sampaikan laporan Anda kepada Ombudsman Republik Indonesia</p>
        </div>
        <div className="warning">
          <b>ⓘ　Peringatan</b>
          <span>Pastikan Anda telah menyampaikan keluhan ke instansi terkait terlebih dahulu sebelum melapor ke Ombudsman RI.</span>
        </div>
        <section className="card validate">
          <h2>Validasi Laporan</h2>
          <label>Apakah Anda sudah melapor ke instansi terkait? <b>*</b></label>
          <div className="choices">
            {/* Sudah: filled circle when selected, empty when not */}
            <button className={choice==='sudah'?'selected':''} onClick={()=>{setChoice('sudah');setErrors({})}}>
              <span className="radio-circle">{choice==='sudah'?'◉':'◯'}</span>　Sudah
            </button>
            {/* Belum: filled circle when selected, empty when not */}
            <button className={choice==='belum'?'selected':''} onClick={()=>{setChoice('belum');setErrors({})}}>
              <span className="radio-circle">{choice==='belum'?'◉':'◯'}</span>　Belum
            </button>
          </div>

          {choice==='sudah'&&(
            <div className="blue-fields">
              <Field label="Nomor Tiket/Bukti Lapor Instansi" value={ticket} set={v=>{setTicket(v);setErrors(e=>({...e,ticket:''}));}}
                placeholder="Contoh: TKT-2024-001234" error={errors.ticket}/>
              <Field type="date" label="Tanggal Pelaporan ke Instansi" value={date} set={v=>{setDate(v);setErrors(e=>({...e,date:''}));}}
                error={errors.date}/>
            </div>
          )}

          {choice==='belum'&&(
            <div className="belum-guidance">
              <AlertCircle size={20}/>
              <div>
                <b>Anda harus melapor ke instansi terkait terlebih dahulu</b>
                <p>Sesuai prosedur Ombudsman RI, Anda wajib menyampaikan keluhan kepada instansi yang bersangkutan dan menunggu tanggapan sebelum dapat mengajukan laporan ke Ombudsman RI.</p>
                <div className="belum-actions">
                  <Button onClick={()=>go('prosedur')} secondary>Lihat Prosedur</Button>
                  <Button onClick={()=>go('faq')} secondary>Pusat Bantuan</Button>
                </div>
              </div>
            </div>
          )}

          <div className="info-link">
            Belum yakin bagaimana cara melapor?
            <button onClick={()=>go('prosedur')}>Pelajari prosedur pengaduan　➜</button>
          </div>
          <div className="center">
            {choice==='sudah'
              ?<Button onClick={handleLanjut}>Lanjut Isi Laporan　<ArrowRight/></Button>
              :<button className="btn" disabled style={{opacity:.4,cursor:'not-allowed'}}>Lapor ke Instansi Dulu</button>
            }
          </div>
        </section>
      </main>
    </Shell>
  );
}

// ─── Form — full lifted state, validation, per-step logic ─────────────────────
const DEFAULT_PERSONAL:PersonalData={type:'individu',category:'',nik:'',nama:'',hp:'',email:'',alamat:'',provinsi:'',kota:'',rahasiakan:false,namaOrganisasi:'',jabatan:''};
const DEFAULT_COMPLAINT:ComplaintData={perihal:'',instansi:'',kronologi:'',harapan:''};
const DEFAULT_EVIDENCE:EvidenceData={ktpFiles:[],docFiles:[],consent:false};

function Form(){
  const [step,setStep]=useState(1);
  const [submitted,setSubmitted]=useState(false);
  const [loading,setLoading]=useState(false);
  const [regNumber,setRegNumber]=useState('');
  const [personal,setPersonal]=useState<PersonalData>(DEFAULT_PERSONAL);
  const [complaint,setComplaint]=useState<ComplaintData>(DEFAULT_COMPLAINT);
  const [evidence,setEvidence]=useState<EvidenceData>(DEFAULT_EVIDENCE);
  const [errors,setErrors]=useState<Record<string,string>>({});

  const setP=<K extends keyof PersonalData>(k:K,v:PersonalData[K])=>setPersonal(p=>({...p,[k]:v}));
  const setC=<K extends keyof ComplaintData>(k:K,v:string)=>setComplaint(p=>({...p,[k]:v}));

  const validate=(s:number)=>{
    const e:Record<string,string>={};
    if(s===1){
      if(!personal.category) e.category='Pilih kategori pelapor';
      if(!personal.nik) e.nik='NIK wajib diisi';
      else if(personal.nik.replace(/\D/g,'').length<16) e.nik='NIK harus 16 digit angka';
      if(!personal.nama.trim()) e.nama='Nama lengkap wajib diisi';
      if(!personal.hp.trim()) e.hp='Nomor HP wajib diisi';
      else if(!/^08\d{8,11}$/.test(personal.hp.replace(/\s/g,''))) e.hp='Format: 08xxxxxxxxxx';
      if(!personal.email.trim()) e.email='Email wajib diisi';
      else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email)) e.email='Format email tidak valid';
      if(!personal.alamat.trim()) e.alamat='Alamat lengkap wajib diisi';
      if(!personal.provinsi||personal.provinsi==='') e.provinsi='Pilih provinsi';
      // If instansi type, also validate org fields
      if(personal.type==='instansi'){
        if(!personal.namaOrganisasi.trim()) e.namaOrganisasi='Nama organisasi wajib diisi';
        if(!personal.jabatan.trim()) e.jabatan='Jabatan wajib diisi';
      }
    }
    if(s===2){
      if(!complaint.perihal.trim()) e.perihal='Perihal laporan wajib diisi';
      if(!complaint.instansi.trim()) e.instansi='Nama instansi wajib diisi';
      if(!complaint.kronologi.trim()) e.kronologi='Uraian kronologi wajib diisi';
      else if(complaint.kronologi.trim().length<50) e.kronologi='Uraian minimal 50 karakter';
      if(!complaint.harapan.trim()) e.harapan='Harapan pelapor wajib diisi';
    }
    if(s===3){
      if(evidence.ktpFiles.length===0) e.ktp='Kartu identitas wajib diunggah';
      if(!evidence.consent) e.consent='Anda harus menyetujui syarat & ketentuan';
    }
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const handleNext=async()=>{
    if(!validate(step)) return;
    if(step<3){setStep(s=>s+1);window.scrollTo({top:0,behavior:'smooth'});}
    else{
      setLoading(true);
      await new Promise(r=>setTimeout(r,1200));
      const reg=genRegNumber();
      setRegNumber(reg);
      const sub:Submission={regNumber:reg,tanggal:new Date().toLocaleDateString('id-ID'),nama:personal.nama,perihal:complaint.perihal,instansi:complaint.instansi,status:'Dalam Proses'};
      saveSubmission(sub);
      setLoading(false);
      setSubmitted(true);
      window.scrollTo({top:0,behavior:'smooth'});
    }
  };

  const handleBack=()=>{
    if(step===1) go('validate');
    else{setStep(s=>s-1);setErrors({});window.scrollTo({top:0,behavior:'smooth'});}
  };

  if(submitted){
    return (
      <Shell page="form">
        <main className="form-bg">
          <div className="form-heading"><h1>Formulir Pengaduan Online</h1></div>
          <section className="card success">
            <div className="success-icon"><Check size={36}/></div>
            <h2>Laporan Berhasil Dikirim!</h2>
            <p>Terima kasih, <b>{personal.nama||'Pelapor'}</b>. Laporan Anda telah kami terima.</p>
            <div className="success-reg">
              <small>Nomor Registrasi Anda</small>
              <strong>{regNumber}</strong>
              <small>Simpan nomor ini untuk memantau status laporan Anda</small>
            </div>
            <p style={{color:'#667085',fontSize:14}}>Proses penanganan laporan membutuhkan 60–90 hari kerja. Kami akan menghubungi Anda jika diperlukan klarifikasi.</p>
            <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
              <Button onClick={()=>go('track')}>Lacak Laporan</Button>
              <Button secondary onClick={()=>go('home')}>Kembali ke Beranda</Button>
            </div>
          </section>
        </main>
      </Shell>
    );
  }

  return (
    <Shell page="form">
      <main className="form-bg">
        <div className="form-heading">
          <h1>Formulir Pengaduan Online</h1>
          <p>Sampaikan laporan pelayanan publik Anda kepada Ombudsman RI</p>
        </div>
        <Steps current={step}/>
        <section className="card form-card">
          {step===1&&<StepPersonal data={personal} set={setP} errors={errors} setErrors={setErrors}/>}
          {step===2&&<StepDetail data={complaint} set={setC} errors={errors} setErrors={setErrors}/>}
          {step===3&&<StepEvidence data={evidence} setData={setEvidence} errors={errors} setErrors={setErrors}/>}
          <div className="form-actions">
            <Button secondary onClick={handleBack}>Kembali</Button>
            <Button onClick={handleNext} loading={loading}>
              {loading?'Mengirim...':(step<3?'Lanjutkan　→':'✓　Kirim Laporan')}
            </Button>
          </div>
        </section>
      </main>
    </Shell>
  );
}

// ─── Horizontal Stepper — centered columns with arrow connectors ─────────────────────────────────
function Steps({current}:{current:number}){
  const labels = ['Data Diri','Detail Pengaduan','Unggah Bukti'];
  return (
    <div className="stepper">
      {[1,2,3].map((n,i)=>(
        <div key={n} className="stepper-row">
          <div className={'stepper-col'+(n<current?' done':n===current?' active':'')}>
            <div className="stepper-circle">
              {n<current?<Check size={16}/>:n}
            </div>
            <span className="stepper-label">{labels[i]}</span>
          </div>
          {i<2&&(
            <div className={'stepper-arrow'+(n<current?' done':'')}>&#8250;</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Personal Data — with Jenis Pelapor (Individu / Badan Hukum) ─────
function StepPersonal({data,set,errors,setErrors}:{data:PersonalData,set:<K extends keyof PersonalData>(k:K,v:PersonalData[K])=>void,errors:Record<string,string>,setErrors:(f:(e:Record<string,string>)=>Record<string,string>)=>void}){
  const clrErr=(k:string)=>setErrors(e=>({...e,[k]:''}));
  return (
    <>
      <h2>Data Diri</h2>
      <p>Lengkapi informasi pribadi Anda</p>
      <details>
        <summary>ⓘ　Lihat Panduan Pengisian Data Diri</summary>
        <p>Isi data sesuai dokumen identitas yang sah dan pastikan kontak aktif untuk menerima informasi perkembangan laporan.</p>
      </details>

      {/* Jenis Pelapor label */}
      <div style={{marginBottom:8}}>
        <label style={{fontWeight:700,fontSize:15,color:'#1e293b'}}>Jenis Pelapor <b style={{color:'#ef2b2b'}}>*</b></label>
      </div>
      <div className="choice-cards">
        <button className={data.type==='individu'?'selected':''} onClick={()=>set('type','individu')}>
          <span className="radio-circle">{data.type==='individu'?'◉':'◯'}</span>　<b>Individu</b><small>Perseorangan</small>
        </button>
        <button className={data.type==='instansi'?'selected':''} onClick={()=>set('type','instansi')}>
          <span className="radio-circle">{data.type==='instansi'?'◉':'◯'}</span>　<b>Badan Hukum/Organisasi</b><small>Perusahaan, Yayasan, dll</small>
        </button>
      </div>

      {/* Conditional fields for Badan Hukum/Organisasi */}
      {data.type==='instansi'&&(
        <div className="org-fields">
          <Field label="Nama Organisasi/Badan Hukum" value={data.namaOrganisasi} set={v=>{set('namaOrganisasi',v);clrErr('namaOrganisasi');}} placeholder="Contoh: PT. Sejahtera Mandiri" error={errors.namaOrganisasi}/>
          <Field label="Jabatan dalam Organisasi" value={data.jabatan} set={v=>{set('jabatan',v);clrErr('jabatan');}} placeholder="Contoh: Direktur Utama" error={errors.jabatan}/>
        </div>
      )}

      <div style={{marginTop:16}}>
        <label style={{fontWeight:600,fontSize:14}}>Kategori Pelapor <b style={{color:'#ef2b2b'}}>*</b></label>
        <div className="radio-list" style={{marginTop:8}}>
          {['Korban Langsung','Kuasa Korban','Bukan Korban'].map(x=>(
            <label key={x} className={data.category===x?'radio-selected':''} onClick={()=>{set('category',x);clrErr('category');}}>
              <input type="radio" name="category" checked={data.category===x} onChange={()=>{set('category',x);clrErr('category');}} readOnly/> {x}
            </label>
          ))}
        </div>
        {errors.category&&<span className="field-error"><AlertCircle size={13}/>{errors.category}</span>}
      </div>

      <div className="two-col">
        <Field label="Nomor Induk Kependudukan" value={data.nik} set={v=>{set('nik',v);clrErr('nik');}} placeholder="16 digit NIK" error={errors.nik}/>
        <Field label="Nama Lengkap" value={data.nama} set={v=>{set('nama',v);clrErr('nama');}} placeholder="Sesuai KTP" error={errors.nama}/>
        <Field label="Nomor HP" value={data.hp} set={v=>{set('hp',v);clrErr('hp');}} placeholder="08xxxxxxxxxx" error={errors.hp}/>
        <Field label="Email" type="email" value={data.email} set={v=>{set('email',v);clrErr('email');}} placeholder="nama@email.com" error={errors.email}/>
      </div>

      <Field label="Alamat Lengkap" value={data.alamat} set={v=>{set('alamat',v);clrErr('alamat');}} placeholder="Jalan, RT/RW, Kelurahan, Kecamatan" error={errors.alamat}/>

      <div className="two-col">
        <label className={'field'+(errors.provinsi?' field-has-error':'')}>
          Provinsi <b style={{color:'#ef2b2b'}}>*</b>
          <select value={data.provinsi} onChange={e=>{set('provinsi',e.target.value);clrErr('provinsi');}}>
            <option value="">Pilih provinsi</option>
            {PROVINCES.map(p=><option key={p}>{p}</option>)}
          </select>
          {errors.provinsi&&<span className="field-error"><AlertCircle size={13}/>{errors.provinsi}</span>}
        </label>
        <Field label="Kota/Kabupaten" required={false} value={data.kota} set={v=>set('kota',v)} placeholder="Nama kota/kabupaten"/>
      </div>

      <div className="privacy">
        ♢ <span>
          <b>Rahasiakan identitas saya dari pihak terlapor</b>
          <small>Identitas Anda akan dirahasiakan selama proses investigasi</small>
        </span>
        <input type="checkbox" checked={data.rahasiakan} onChange={e=>set('rahasiakan',e.target.checked)}/>
      </div>
    </>
  );
}

function StepDetail({data,set,errors,setErrors}:{data:ComplaintData,set:(k:keyof ComplaintData,v:string)=>void,errors:Record<string,string>,setErrors:(f:(e:Record<string,string>)=>Record<string,string>)=>void}){
  const clrErr=(k:string)=>setErrors(e=>({...e,[k]:''}));
  return (
    <>
      <h2>Detail Pengaduan</h2>
      <p>Jelaskan kronologi dan harapan Anda</p>
      <Field label="Perihal Laporan" value={data.perihal} set={v=>{set('perihal',v);clrErr('perihal');}} placeholder="Contoh: Penolakan Pembuatan Akta Kelahiran" error={errors.perihal}/>
      <Field label="Nama Instansi Terlapor" value={data.instansi} set={v=>{set('instansi',v);clrErr('instansi');}} placeholder="Contoh: Dinas Kependudukan Kota Jakarta" error={errors.instansi}/>
      <label className={'field'+(errors.kronologi?' field-has-error':'')}>
        Uraian Kronologi Laporan <b style={{color:'#ef2b2b'}}>*</b>
        <textarea value={data.kronologi} onChange={e=>{set('kronologi',e.target.value);clrErr('kronologi');}} placeholder="Jelaskan secara detail kronologi kejadian yang Anda alami. Tuliskan kapan, di mana, apa yang terjadi, siapa yang terlibat..."/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          {errors.kronologi&&<span className="field-error"><AlertCircle size={13}/>{errors.kronologi}</span>}
          <small style={{color:'#6b7280',marginLeft:'auto'}}>{data.kronologi.length} karakter</small>
        </div>
      </label>
      <label className={'field'+(errors.harapan?' field-has-error':'')}>
        Harapan Pelapor <b style={{color:'#ef2b2b'}}>*</b>
        <textarea value={data.harapan} onChange={e=>{set('harapan',e.target.value);clrErr('harapan');}} placeholder="Tuliskan apa yang Anda harapkan dari laporan ini..."/>
        {errors.harapan&&<span className="field-error"><AlertCircle size={13}/>{errors.harapan}</span>}
      </label>
    </>
  );
}

function StepEvidence({data,setData,errors,setErrors}:{data:EvidenceData,setData:React.Dispatch<React.SetStateAction<EvidenceData>>,errors:Record<string,string>,setErrors:(f:(e:Record<string,string>)=>Record<string,string>)=>void}){
  const addKtp=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const names=Array.from(e.target.files||[]).map(f=>f.name);
    setData(d=>({...d,ktpFiles:[...d.ktpFiles,...names]}));
    setErrors(e=>({...e,ktp:''}));
  };
  const addDoc=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const names=Array.from(e.target.files||[]).map(f=>f.name);
    setData(d=>({...d,docFiles:[...d.docFiles,...names]}));
  };
  const removeKtp=(i:number)=>setData(d=>({...d,ktpFiles:d.ktpFiles.filter((_,j)=>j!==i)}));
  const removeDoc=(i:number)=>setData(d=>({...d,docFiles:d.docFiles.filter((_,j)=>j!==i)}));

  return (
    <>
      <h2>Unggah Bukti</h2>
      <p>Lampirkan dokumen identitas dan pendukung</p>

      <label className={'field'+(errors.ktp?' field-has-error':'')}>
        Unggah Kartu Identitas (KTP/Paspor/KITAS) <b style={{color:'#ef2b2b'}}> *</b>
        <span className="drop">
          <Upload/><b>Klik atau drag file ke sini</b><small>Maks 20MB: JPG, PNG, PDF</small>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={addKtp}/>
        </span>
        {errors.ktp&&<span className="field-error"><AlertCircle size={13}/>{errors.ktp}</span>}
      </label>
      {data.ktpFiles.length>0&&(
        <div className="files">
          {data.ktpFiles.map((f,i)=>(
            <span key={i} className="file-item">
              <Check size={13}/> {f}
              <button className="file-remove" onClick={()=>removeKtp(i)} aria-label="Hapus file"><Trash2 size={13}/></button>
            </span>
          ))}
        </div>
      )}

      <label className="field">
        Unggah Dokumen Pendukung Peristiwa
        <span className="drop">
          <Upload/><b>Klik atau drag file ke sini</b><small>Maks 20MB: JPG, PNG, PDF (bisa lebih dari 1)</small>
          <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" onChange={addDoc}/>
        </span>
      </label>
      {data.docFiles.length>0&&(
        <div className="files">
          {data.docFiles.map((f,i)=>(
            <span key={i} className="file-item">
              <Check size={13}/> {f}
              <button className="file-remove" onClick={()=>removeDoc(i)} aria-label="Hapus file"><Trash2 size={13}/></button>
            </span>
          ))}
        </div>
      )}

      <label className={'terms'+(errors.consent?' terms-error':'')}>
        <input type="checkbox" checked={data.consent} onChange={e=>{setData(d=>({...d,consent:e.target.checked}));setErrors(er=>({...er,consent:''}));}}/>
        Saya menyatakan bahwa informasi yang diberikan adalah benar dan menyetujui <b>Syarat &amp; Ketentuan Pengaduan</b> Ombudsman RI.
      </label>
      {errors.consent&&<span className="field-error" style={{marginTop:8}}><AlertCircle size={13}/>{errors.consent}</span>}
    </>
  );
}

// ─── FAQ / Bantuan Page ───────────────────────────────────────────────────────
function FAQ(){
  const [cat,setCat]=useState('Semua');
  const [q,setQ]=useState('');
  const [open,setOpen]=useState<number|null>(null);
  const list=FAQS.filter(x=>(cat==='Semua'||x[0]===cat)&&(x[1].toLowerCase().includes(q.toLowerCase())||x[2].toLowerCase().includes(q.toLowerCase())));
  return (
    <Shell page="faq">
      <section className="blue-hero faq-hero">
        <HelpCircle/>
        <h1>Pusat Bantuan</h1>
        <p>Temukan jawaban atas pertanyaan umum seputar Ombudsman RI, tugas dan<br/>fungsinya, hak pelapor, dan informasi layanan publik.</p>
        <input value={q} onChange={e=>{setQ(e.target.value);setOpen(null);}} placeholder="Cari pertanyaan atau kata kunci..."/>
      </section>
      <main className="faq-main">
        <div className="chips">
          {['Semua','Tentang Ombudsman','Hak Pelapor','Layanan Publik','Dasar Hukum','Kontak & Akses'].map(x=>(
            <button className={cat===x?'selected':''} onClick={()=>{setCat(x);setOpen(null);}} key={x}>{x}</button>
          ))}
        </div>
        {list.length===0?(
          <div className="empty" style={{marginTop:32}}>
            <HelpCircle size={40}/>
            <h2>Pertanyaan tidak ditemukan</h2>
            <p>Coba kata kunci lain atau pilih kategori yang berbeda.</p>
            <Button onClick={()=>{setQ('');setCat('Semua');}}>Tampilkan Semua FAQ</Button>
          </div>
        ):(
          <div className="accordion">
            {list.map((x,i)=>(
              <button onClick={()=>setOpen(open===i?null:i)} key={x[1]}>
                <span><small>{x[0]}</small>{x[1]}{open===i&&<p>{x[2]}</p>}</span>
                <ChevronDown style={{transform:open===i?'rotate(180deg)':'',transition:'transform .2s'}}/>
              </button>
            ))}
          </div>
        )}
        <div className="faq-cta">
          <MessageSquare/>
          <span>
            <small>BUTUH BANTUAN LEBIH?</small>
            <h3>Masih ada pertanyaan lain?</h3>
            <p>Hubungi kami langsung atau lihat panduan prosedur pengaduan secara lengkap.</p>
          </span>
          <Button secondary onClick={()=>window.open('tel:+622157906277')}>☎　Hubungi Kami</Button>
          <Button secondary onClick={()=>go('prosedur')}>▣　Prosedur Pengaduan →</Button>
        </div>
      </main>
    </Shell>
  );
}

// ─── Information Search Page ──────────────────────────────────────────────────
const FILTER_KEYS=['Semua','FAQ','Prosedur','Berita','Dasar Hukum'];

function Information(){
  const [q,setQ]=useState(()=>typeof window!=='undefined'?getParam('q'):'');
  const [filter,setFilter]=useState(()=>typeof window!=='undefined'?getParam('category')||'Semua':'Semua');
  const [inputVal,setInputVal]=useState(()=>typeof window!=='undefined'?getParam('q'):'');
  const [newsModal,setNewsModal]=useState<string|null>(null);

  useEffect(()=>{
    const sync=()=>{
      const newQ=getParam('q');
      const newCat=getParam('category')||'Semua';
      setQ(newQ); setInputVal(newQ); setFilter(newCat);
    };
    window.addEventListener('popstate',sync);
    return()=>window.removeEventListener('popstate',sync);
  },[]);

  const handleSearch=()=>{
    if(!inputVal.trim()) return;
    setQ(inputVal.trim());
    setFilter('Semua');
    history.pushState({},'','/information?q='+encodeURIComponent(inputVal.trim()));
  };

  const handleFilterChange=(f:string)=>{
    setFilter(f);
    const params:Record<string,string>={};
    if(q) params.q=q;
    if(f&&f!=='Semua') params.category=f;
    const sp=new URLSearchParams(params);
    history.pushState({},'','/information'+(sp.toString()?'?'+sp.toString():''));
  };

  const result=useMemo(()=>{
    let list=RESULTS;
    if(filter!=='Semua') list=list.filter(r=>r.filterKey===filter);
    if(q){
      const lower=q.toLowerCase();
      list=list.filter(r=>r.title.toLowerCase().includes(lower)||r.snippet.toLowerCase().includes(lower)||r.category.toLowerCase().includes(lower));
    }
    return list;
  },[q,filter]);

  const handleResultClick=(item:ResultItem)=>{
    if(item.hasDetail&&DETAIL_MAP[item.id]){ goDetail(item.id); return; }
    if(item.articleId){ setNewsModal(item.articleId); return; }
    if(item.filterKey==='FAQ'){ go('faq'); return; }
    if(item.id==='pengaduan-online'){ go('validate'); return; }
    if(item.filterKey==='Dasar Hukum'){
      window.open('https://peraturan.go.id','_blank','noopener');
    }
  };

  const showBrowse=!q;

  return (
    <Shell page="information">
      {newsModal&&<NewsModal articleId={newsModal} onClose={()=>setNewsModal(null)}/>}
      <main className="search-page">
        <h1>
          {q?<>Hasil Pencarian untuk &quot;<em className="search-keyword">{q}</em>&quot;</>:'Informasi Ombudsman RI'}
        </h1>

        <div className="large-search">
          <Search size={18}/>
          <input value={inputVal} onChange={e=>setInputVal(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleSearch()}
            placeholder="Cari informasi Ombudsman..."
            aria-label="Cari informasi"/>
          <Button onClick={handleSearch}>Cari</Button>
        </div>

        <div className="search-filter-chips">
          {FILTER_KEYS.map(f=>(
            <button key={f} className={'filter-chip'+(filter===f?' active':'')} onClick={()=>handleFilterChange(f)}>
              {f==='FAQ'&&<HelpCircle size={13}/>}
              {f==='Prosedur'&&<ListChecks size={13}/>}
              {f==='Berita'&&<Newspaper size={13}/>}
              {f==='Dasar Hukum'&&<Gavel size={13}/>}
              {f}
            </button>
          ))}
        </div>

        <div className="search-results-area">
          {showBrowse&&!q&&(
            <p className="results-meta">Menampilkan <b>{result.length} informasi</b> tersedia — ketik untuk mencari</p>
          )}
          {q&&result.length>0&&(
            <p className="results-meta">Menampilkan <b>{result.length} hasil relevan</b> untuk &quot;{q}&quot;</p>
          )}

          {result.length>0?(
            result.map(r=>(
              <article className="result-card" key={r.id}>
                <div className="result-card-meta">
                  <span className="result-category-badge">{r.category}</span>
                </div>
                <h3>{r.title}</h3>
                <p>{r.snippet}</p>
                <button className="result-cta" onClick={()=>handleResultClick(r)}>
                  Baca selengkapnya <ArrowRight size={14}/>
                </button>
              </article>
            ))
          ):(
            <div className="empty">
              <Search size={40}/>
              <h2>Tidak menemukan informasi yang sesuai.</h2>
              <p>Coba gunakan kata kunci lain seperti <b>pengaduan</b>, <b>maladministrasi</b>, atau <b>hak pelapor</b>.</p>
              <div className="empty-actions">
                <Button onClick={()=>go('faq')}>Lihat Bantuan</Button>
                <Button secondary onClick={()=>go('validate')}>Prosedur Pengaduan</Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </Shell>
  );
}

// ─── Information Detail Page ──────────────────────────────────────────────────
function InformationDetail(){
  const id=typeof window!=='undefined'?getParam('id'):'cara-membuat-pengaduan';
  const data=DETAIL_MAP[id]||DETAIL_MAP['cara-membuat-pengaduan'];
  return (
    <Shell page="information-detail" searchQ={data.title}>
      <main className="detail-main">
        <section className="blue-hero detail-hero">
          <BookOpen size={48}/>
          <small className="detail-tag">PROSEDUR PENGADUAN</small>
          <h1>{data.title}</h1>
          <p>{data.intro}</p>
        </section>
        <div className="detail-content">
          {data.requirements&&(
            <section className="card detail-section">
              <h2><Shield size={20}/> Persyaratan</h2>
              <ul className="detail-checklist">
                {data.requirements.map((r,i)=><li key={i}><span className="check-icon">{r.icon}</span>{r.text}</li>)}
              </ul>
            </section>
          )}
          {data.steps&&(
            <section className="card detail-section">
              <h2><ListChecks size={20}/> Tahapan Pengaduan</h2>
              <div className="detail-steps">
                {data.steps.map(s=>(
                  <div className="detail-step" key={s.num}>
                    <div className="detail-step-num">{s.num}</div>
                    <div><b>{s.title}</b><p>{s.desc}</p></div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {data.documents&&(
            <section className="card detail-section">
              <h2><FileText size={20}/> Dokumen yang Diperlukan</h2>
              <ul className="detail-docs">
                {data.documents.map((d,i)=><li key={i}><ArrowRight size={14}/>{d}</li>)}
              </ul>
              {data.note&&<div className="detail-note">ⓘ {data.note}</div>}
            </section>
          )}
          <div className="detail-cta-box">
            <div>
              <h3>Siap untuk mengajukan pengaduan?</h3>
              <p>Proses pengaduan sepenuhnya gratis dan identitas Anda terlindungi.</p>
            </div>
            <div className="detail-cta-actions">
              <Button onClick={()=>go('validate')}>▣　Buat Pengaduan</Button>
              <Button secondary onClick={()=>go('information')}>← Kembali ke Hasil Pencarian</Button>
            </div>
          </div>
        </div>
      </main>
    </Shell>
  );
}

// ─── Prosedur Pengaduan Page — improved layout, responsive, no overflow ───────
function Prosedur(){
  return (
    <Shell page="prosedur">
      <main className="prosedur-main">
        {/* Hero */}
        <section className="blue-hero">
          <div className="prosedur-hero-badge">
            <ClipboardList size={22}/>
            <small className="detail-tag">TATA CARA</small>
          </div>
          <h1>Penyampaian Laporan/Pengaduan<br/>Pelayanan Publik</h1>
          <p>Panduan lengkap prosedur pengaduan maladministrasi kepada Ombudsman Republik Indonesia</p>
        </section>

        <div className="prosedur-content">

          {/* Yang Dapat Dilaporkan */}
          <section className="prosedur-card">
            <div className="prosedur-card-hd prosedur-hd-yellow">
              <AlertCircle size={18}/><h2>Yang Dapat Dilaporkan</h2>
            </div>
            <div className="prosedur-card-body">
              <p>
                Dugaan Maladministrasi pada penyelenggara pelayanan publik yang diselenggarakan oleh penyelenggara Negara dan Pemerintahan termasuk yang diselenggarakan oleh Badan Usaha Milik Negara, Badan Usaha Milik Daerah, dan Badan Hukum Milik Negara serta badan swasta atau perseorangan yang diberi tugas menyelenggarakan Pelayanan Publik tertentu.
              </p>
            </div>
          </section>

          <h2 className="prosedur-cat">Persyaratan Laporan</h2>

          {/* Syarat Administrasi */}
          <section className="prosedur-card">
            <div className="prosedur-card-hd prosedur-hd-blue">
              <Shield size={18}/><h2>Syarat Administrasi (Formil)</h2>
            </div>
            <div className="prosedur-card-body">
              <ol className="prosedur-ol">
                <li>Fotokopi/scan KTP (apabila WNI) atau Kartu Izin Tinggal Tetap (KITAP) atau Kartu Izin Tinggal Sementara (KITAS) atas nama Pelapor yang masih berlaku (apabila Pelapor adalah WNA dan merupakan penduduk).</li>
                <li>Kronologi dengan mencantumkan keterangan waktu (tanggal, bulan, tahun) uraian peristiwa yang disusun secara urut waktu tentang peristiwa/tindakan yang dilaporkan, instansi yang dilaporkan, serta harapan Laporan di Ombudsman.</li>
                <li>Peristiwa/Tindakan Pelayanan Publik sudah disampaikan secara langsung kepada pihak Terlapor tetapi <strong>TIDAK</strong> mendapat penyelesaian.</li>
                <li>Peristiwa/Tindakan Pelayanan Publik <strong>TIDAK LEBIH</strong> dari 2 (dua) tahun sejak terjadi.</li>
                <li>Nomor Telepon yang dapat dihubungi serta e-mail (jika ada).</li>
                <li>Surat kuasa khusus untuk melapor kepada Ombudsman apabila penyampaian Laporan dikuasakan kepada pihak lain.</li>
                <li>Dokumen pengesahan/legalitas seperti akta pendirian dan perubahan yang menunjukkan kedudukan Pelapor dengan institusi yang diwakili (untuk Pelapor yang mewakili Badan Hukum seperti perusahaan, Yayasan, dsb).</li>
                <li>Substansi yang dilaporkan tidak sedang dan/atau telah ditindaklanjuti oleh Ombudsman.</li>
              </ol>
            </div>
          </section>

          {/* Syarat Substantif */}
          <section className="prosedur-card">
            <div className="prosedur-card-hd prosedur-hd-blue">
              <Scale size={18}/><h2>Syarat Substantif (Materiel) Laporan</h2>
            </div>
            <div className="prosedur-card-body">
              <ol className="prosedur-ol">
                <li>Substansi Laporan tidak sedang dan/atau telah menjadi objek pemeriksaan pengadilan.</li>
                <li>Laporan tidak sedang dalam proses penyelesaian oleh instansi yang dilaporkan dan menurut Ombudsman proses penyelesaiannya masih dalam tenggang waktu yang patut.</li>
                <li>Pelapor belum memperoleh penyelesaian dari instansi yang dilaporkan.</li>
                <li>Substansi yang dilaporkan sesuai dengan ruang lingkup pelayanan publik yang diatur dalam Undang-Undang tentang Pelayanan Publik.</li>
              </ol>
            </div>
          </section>

          <h2 className="prosedur-cat">Cara Menyampaikan Laporan</h2>

          {/* Cara Menyampaikan */}
          <section className="prosedur-card prosedur-cara-card">
            <div className="prosedur-card-body" style={{textAlign:'center'}}>
              <p className="prosedur-cara-sub">Sampaikan laporan melalui website <strong>www.ombudsman.go.id</strong></p>
              <div className="prosedur-channels">
                <div><Mail size={20}/><span>info@ombudsman.go.id</span></div>
                <div><Phone size={20}/><span>(021) 5790-6277</span></div>
                <div><MapPin size={20}/><span>Kantor Ombudsman RI terdekat</span></div>
              </div>
            </div>
          </section>

          {/* Bukan Wewenang */}
          <section className="prosedur-card">
            <div className="prosedur-card-hd prosedur-hd-red">
              <AlertCircle size={18}/><h2>Contoh Substansi Laporan Bukan Wewenang Ombudsman RI</h2>
            </div>
            <div className="prosedur-card-body">
              <div className="prosedur-bukan-grid">
                <ul className="prosedur-ul">
                  <li>Permasalahan tindak pidana (korupsi, penganiayaan, pencurian)</li>
                  <li>Permasalahan perdata</li>
                </ul>
                <ul className="prosedur-ul">
                  <li>Permasalahan kode etik hakim</li>
                  <li>Permasalahan keberatan atas hasil pemilu</li>
                </ul>
                <ul className="prosedur-ul">
                  <li>Keberatan atas suatu Peraturan Perundang-Undangan</li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="prosedur-cta">
            <div className="prosedur-cta-icon"><FileText size={28}/></div>
            <h3>Siap untuk mengajukan pengaduan?</h3>
            <p>Proses pengaduan sepenuhnya gratis dan terjamin kerahasiaannya sesuai UU No. 37 Tahun 2008.</p>
            <div className="prosedur-cta-actions">
              <Button onClick={()=>go('validate')}>▣　Buat Pengaduan</Button>
              <Button secondary onClick={()=>go('track')}>⌕　Lacak Pengaduan</Button>
            </div>
          </div>

        </div>
      </main>
    </Shell>
  );
}

// ─── App Router ───────────────────────────────────────────────────────────────
export default function App(){
  const route=():Page=>{
    if(typeof window==='undefined') return 'home';
    const p=location.pathname.slice(1).split('?')[0] as Page;
    if(['track','validate','form','faq','information','information-detail','prosedur'].includes(p)) return p;
    return 'home';
  };
  const [page,setPage]=useState<Page>(()=>typeof window==='undefined'?'home':route());
  useEffect(()=>{
    const f=()=>setPage(route());
    addEventListener('popstate',f);
    return()=>removeEventListener('popstate',f);
  },[]);

  if(page==='home') return <Home/>;
  if(page==='track') return <Track/>;
  if(page==='validate') return <Validate/>;
  if(page==='form') return <Form/>;
  if(page==='faq') return <FAQ/>;
  if(page==='prosedur') return <Prosedur/>;
  if(page==='information-detail') return <InformationDetail/>;
  return <Information/>;
}
