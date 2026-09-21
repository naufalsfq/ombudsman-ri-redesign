export default function NotFound(){
  return (
    <html>
      <body>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',fontFamily:'Inter,sans-serif',textAlign:'center',padding:24}}>
          <h1 style={{fontSize:72,fontWeight:800,color:'#155dfc',margin:0}}>404</h1>
          <p style={{fontSize:20,color:'#374151',marginTop:8}}>Halaman tidak ditemukan</p>
          <a href="/" style={{marginTop:24,padding:'12px 28px',background:'#155dfc',color:'white',borderRadius:8,textDecoration:'none',fontWeight:600}}>Kembali ke Beranda</a>
        </div>
      </body>
    </html>
  );
}
