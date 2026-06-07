let KEY_DB_SISWA = "fms_siswa4";
let KEY_DB_ASESMEN = "fms_asesmen4";
let KEY_DB_AKUN = "akun-diasfuntors";

let db = {
    siswa: JSON.parse(localStorage.getItem(KEY_DB_SISWA)) || [],
    asesmen: JSON.parse(localStorage.getItem(KEY_DB_ASESMEN)) || [],
    pengaturan: JSON.parse(localStorage.getItem(KEY_DB_AKUN)) || {}
};

let state = { 
    history: [], 
    currentPage: '', 
    tempAsesmen: { id_materi: '', jenis_materi: '', nama_materi: '', idSiswa: null, namaSiswa: '' },
    dinilaiSesiIni : [],
    absensiSesiIni: {},
    kelasAktifAbsensi: "" 
};

// --- CUSTOM ALERT & CONFIRM ---
let customAlertAction = null;
function showCustomAlert(title, message, action = null) {
    document.getElementById('customAlertTitle').innerText = title;
    document.getElementById('customAlertMessage').innerText = message;
    customAlertAction = action;
    document.getElementById('modalCustomAlert').classList.add('active');
}
function tutupCustomAlert() {
    document.getElementById('modalCustomAlert').classList.remove('active');
    if (customAlertAction) customAlertAction();
}

let customConfirmAction = null;
function showCustomConfirm(title, message, action) {
    document.getElementById('customConfirmTitle').innerText = title;
    document.getElementById('customConfirmMessage').innerText = message;
    customConfirmAction = action;
    document.getElementById('modalCustomConfirm').classList.add('active');
}
function tutupCustomConfirm(isConfirmed) {
    document.getElementById('modalCustomConfirm').classList.remove('active');
    if (isConfirmed && customConfirmAction) {
        customConfirmAction();
    }
}

// --- INITIALIZATION & ROUTING ---
// --- INITIALIZATION & ROUTING ---
window.onload = function() {
    let needsUpdate = false;
    db.siswa.forEach(s => { 
        if (!s.nilai) { updateNilaiSiswaLatarBelakang(s.id_siswa || s.id); needsUpdate = true; } 
    });
    if(needsUpdate) { 
        localStorage.setItem(KEY_DB_SISWA, JSON.stringify(db.siswa)); 
    }

    // Selalu tampilkan halaman landing (page-home) saat aplikasi pertama kali dibuka
    showPage('page-home', 'DIASFUNTORS');
    updateBreadcrumb();
};

// Fungsi baru saat tombol MASUK di halaman awal diklik
function mulaiAplikasi() {
    if(db.pengaturan.gunakanLogin === true) {
        navigate('page-login', 'DIASFUNTORS');
    } else {
        muatDataProfil();
        navigate('page-profil', 'Profil Guru');
    }
}

function updateBreadcrumb() {
    let breadcrumb = document.getElementById('breadcrumbGuru');
    // Sembunyikan jika di halaman landing, login, profil, atau dashboard utama
    if(state.currentPage === 'page-home' || state.currentPage === 'page-login' || state.currentPage === 'page-profil' || state.currentPage === 'page-dashboard') {
        breadcrumb.style.display = 'none';
    } else {
        breadcrumb.style.display = 'block';
        document.getElementById('labelNamaGuru').innerText = db.pengaturan.nama || 'Nama Guru';
        document.getElementById('labelNIPGuru').innerText = `(NIP: ${db.pengaturan.nip || '-'})`;
    }
}

// --- LOGIN & PROFIL FLOW ---
function login() {
    let u = document.getElementById('loginUsername').value;
    let p = document.getElementById('loginPassword').value;

    // Login Bypass via root ATAU akun guru
    if ((u === 'root' && p === 'root') || (u === db.pengaturan.uname && p === db.pengaturan.pass)) {
        muatDataProfil();
        // Setelah login sukses, arahkan ke page-profil (bukan page-home lagi)
        navigate('page-profil', 'Profil Guru');
    } else {
        showCustomAlert('Akses Ditolak', 'Username atau Password salah!');
    }
}


function muatDataProfil() {
    document.getElementById('profilNama').value = db.pengaturan.nama || '';
    document.getElementById('profilNIP').value = db.pengaturan.nip || '';
    document.getElementById('profilSekolah').value = db.pengaturan.sekolah || '';
}

function simpanProfilDanLanjut() {
    let nama = document.getElementById('profilNama').value.trim();
    let nip = document.getElementById('profilNIP').value.trim();
    let sekolah = document.getElementById('profilSekolah').value.trim();

    if (!nama) return showCustomAlert('Peringatan', 'Nama Guru wajib diisi!');

    db.pengaturan.nama = nama;
    db.pengaturan.nip = nip;
    db.pengaturan.sekolah = sekolah;
    
    // Set default credential jika belum ada
    if (!db.pengaturan.uname) db.pengaturan.uname = 'admin';
    if (!db.pengaturan.pass) db.pengaturan.pass = 'admin';
    if (db.pengaturan.gunakanLogin === undefined) db.pengaturan.gunakanLogin = false;

    localStorage.setItem(KEY_DB_AKUN, JSON.stringify(db.pengaturan));
    updateBreadcrumb();
    navigate('page-dashboard', 'Menu Utama');
}

/*function logout() {
    showCustomConfirm('Keluar Aplikasi', 'Apakah Anda yakin ingin keluar?', () => { 
        document.getElementById('loginUsername').value = ''; 
        document.getElementById('loginPassword').value = ''; 
        
        if(db.pengaturan.gunakanLogin === true) {
            showPage('page-login', 'DIASFUNTORS');
        } else {
            muatDataProfil();
            showPage('page-home', 'DIASFUNTORS');
        }
    });
}*/

function logout() {
    showCustomConfirm('Keluar Aplikasi', 'Apakah Anda yakin ingin keluar?', () => { 
        // Bersihkan inputan form login demi keamanan
        document.getElementById('loginUsername').value = ''; 
        document.getElementById('loginPassword').value = ''; 
        
        // Selalu arahkan kembali ke halaman awal (Landing Page)
        // apa pun status pengaturan otentikasi login-nya
        showPage('page-home', 'DIASFUNTORS');
    });
}


// --- AUTO-UPDATE NILAI ---
function updateNilaiSiswaLatarBelakang(idSiswa) {
    let sIndex = db.siswa.findIndex(s => (s.id_siswa || s.id) === idSiswa); if(sIndex === -1) return;
    let s = db.siswa[sIndex]; if(!s.nilai) s.nilai = { 'Lokomotor': 0, 'Non Lokomotor': 0, 'Manipulatif': 0 };
    
    ['Lokomotor', 'Non Lokomotor', 'Manipulatif'].forEach(kat => {
        let asesmenKat = db.asesmen.filter(a => a.idSiswa === idSiswa && a.kategori === kat);
        if(asesmenKat.length > 0) {
            let tesTerbaru = asesmenKat;
            let totalNilai = 0, totalMax = 0; 
            Object.values(tesTerbaru).forEach(a => { totalNilai += a.nilai; totalMax += a.maxNilai; });
            s.nilai[kat] = Math.round((totalNilai / totalMax) * 100) || 0;
        } else { s.nilai[kat] = 0; }
    });
    db.siswa[sIndex] = s;
}

function updateNilaiSiswa(idSiswa) {
    updateNilaiSiswaLatarBelakang(idSiswa);
    localStorage.setItem(KEY_DB_SISWA, JSON.stringify(db.siswa));
}

// --- NAVIGATION LOGIC ---
function navigate(pageId, title = 'DIASFUNTORS') {
    if(state.currentPage !== 'page-login' && state.currentPage !== 'page-home') {
        state.history.push({ id: state.currentPage, title: document.getElementById('headerTitle').innerText });
    }
    showPage(pageId, title);
}

function showPage(pageId, title) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    state.currentPage = pageId;

    const btnBack = document.getElementById('btnBack');
    const headerLogoImg = document.getElementById('headerLogoImg');
    const headerTextContainer = document.getElementById('headerTextContainer');

    let tmp = headerLogoImg.parentNode.parentNode;
    
    if (pageId === 'page-home' || pageId === 'page-profil' || pageId === 'page-login' || pageId === 'page-dashboard' || pageId === 'page-pilih-siswa-asesmen')
 { 
        btnBack.style.display = 'none'; 
        state.history = []; 
        tmp.style.visibility = 'hidden';
        headerTextContainer.style.display = 'none';
        if(pageId === "page-pilih-siswa-asesmen"){
            tmp.style.visibility = 'visible';
            headerTextContainer.style.display = 'flex';
        }
    } else { 
        tmp.style.visibility = 'visible';
        btnBack.style.display = 'flex'; 
        headerLogoImg.style.display = 'none';
        headerTextContainer.style.display = 'flex';
        document.getElementById('headerTitle').innerText = 'DIASFUNTORS'; 
    }
    
    updateBreadcrumb();
}

function handleBack() {
    if (state.currentPage === 'page-form-asesmen') {
        return showCustomConfirm('Batal Penilaian', 'Data penilaian belum disimpan. Anda yakin ingin kembali?', goBackCore);
    }
    if (state.currentPage === 'page-pilih-siswa-asesmen') {
        return showCustomConfirm('Tutup Asesmen', 'Apakah Anda yakin menutup halaman asesmen?', goBackCore);
    }
    if (state.currentPage === 'page-absensi') {
        return showCustomConfirm('Batal Absensi', 'Data absensi belum disimpan. Anda yakin ingin kembali?', goBackCore);
    }
    goBackCore();
}

function goBackCore() {
    if (state.history.length > 0) { 
        let prev = state.history.pop(); 
        showPage(prev.id, prev.title); 
    } else { 
        showPage('page-dashboard', 'Menu Utama'); 
    }
}

// --- SISWA CRUD (TABLE DATATABLES) ---
let tabelManajemenSiswaDt;

function renderSiswa() {
    let listKelas = [...new Set(db.siswa.map(s => s.kelas || '-'))].filter(k => k !== '-');
    let ddlFilter = document.getElementById('filterKelasTabelSiswa');
    let currentFilter = ddlFilter.value;
    ddlFilter.innerHTML = '<option value="">Semua Kelas</option>' + listKelas.map(k => `<option value="${k}">${k}</option>`).join('');
    ddlFilter.value = currentFilter;

    document.getElementById('totalSiswaBadge').innerText = `Total: ${db.siswa.length}`;
    
    if ($.fn.DataTable.isDataTable('#tabelManajemenSiswa')) {
        $('#tabelManajemenSiswa').DataTable().destroy();
    }

    let tbody = document.querySelector('#tabelManajemenSiswa tbody');
    tbody.innerHTML = '';
    
    db.siswa.forEach(s => {
        let idReal = s.id_siswa || s.id;
        let nLoko = s.nilai && s.nilai['Lokomotor'] !== undefined ? s.nilai['Lokomotor'] + '%' : '-';
        let nNon = s.nilai && s.nilai['Non Lokomotor'] !== undefined ? s.nilai['Non Lokomotor'] + '%' : '-';
        let nMan = s.nilai && s.nilai['Manipulatif'] !== undefined ? s.nilai['Manipulatif'] + '%' : '-';

        tbody.innerHTML += `
            <tr>
                <td>${s.absen || '-'}</td>
                <td style="font-weight: 800; color: #2D3748;">${s.nama_siswa || s.nama}</td>
                <td>${s.nisn || '-'}</td>
                <td>${s.nis || '-'}</td>
                <td style="font-weight: bold;">${s.kelas || '-'}</td>
                <td>${s.jk || '-'}</td>
                <td>${s.asal_sekolah || '-'}</td>
                <td><span class="badge-nilai">${nLoko}</span></td>
                <td><span class="badge-nilai">${nNon}</span></td>
                <td><span class="badge-nilai">${nMan}</span></td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn" style="background:#e2e8f0; color:#475569; padding:6px 10px; margin:0; border-radius:6px; font-size:0.9rem;" onclick="bukaModalSiswa(${idReal})" title="Edit">✏️</button>
                        <button class="btn btn-danger" style="padding:6px 10px; margin:0; border-radius:6px; font-size:0.9rem;" onclick="hapusSiswa(${idReal})" title="Hapus">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });

    tabelManajemenSiswaDt = $('#tabelManajemenSiswa').DataTable({
        order: [[4, 'asc'], [0, 'asc']], 
        language: { search: "Cari Siswa:", emptyTable: "Data siswa masih kosong.", paginate: { next: "▶", previous: "◀" } },
        pageLength: 10, lengthChange: false, info: false, scrollX: true
    });

    $('#filterKelasTabelSiswa').off('change').on('change', function() {
        let val = $.fn.dataTable.util.escapeRegex($(this).val());
        tabelManajemenSiswaDt.column(4).search(val ? '^' + val + '$' : '', true, false).draw();
    });
    
    $('#filterKelasTabelSiswa').trigger('change');
}

function bukaModalSiswa(idEdit = null) {
    let title = document.getElementById('modalSiswaTitle');
    let formId = document.getElementById('formSiswaId'), formNama = document.getElementById('formSiswaNama');
    let formNISN = document.getElementById('formSiswaNISN'), formNIS = document.getElementById('formSiswaNIS');
    let formAbsen = document.getElementById('formSiswaAbsen'), formKelas = document.getElementById('formSiswaKelas');
    let formJK = document.getElementById('formSiswaJK'), formSekolah = document.getElementById('formSiswaSekolah');

    if(idEdit) {
        title.innerText = "Edit Data Siswa"; 
        let s = db.siswa.find(x => (x.id_siswa || x.id) === idEdit);
        formId.value = idEdit; formNama.value = s.nama_siswa || s.nama; 
        formNISN.value = s.nisn || ''; formNIS.value = s.nis || '';
        formAbsen.value = s.absen || ''; formKelas.value = s.kelas || ''; 
        formJK.value = s.jk || 'L'; formSekolah.value = s.asal_sekolah || '';
    } else { 
        title.innerText = "Tambah Siswa Baru"; 
        formId.value = ''; formNama.value = ''; formNISN.value = ''; formNIS.value = '';
        formAbsen.value = ''; formKelas.value = ''; formJK.value = 'L'; formSekolah.value = ''; 
    }
    document.getElementById('modalSiswa').classList.add('active');
}

function tutupModalSiswa() { document.getElementById('modalSiswa').classList.remove('active'); }

function simpanSiswa() {
    let idEdit = document.getElementById('formSiswaId').value;
    let nama = document.getElementById('formSiswaNama').value.trim();
    let nisn = document.getElementById('formSiswaNISN').value.trim();
    let nis = document.getElementById('formSiswaNIS').value.trim();
    let absen = document.getElementById('formSiswaAbsen').value.trim();
    let kelas = document.getElementById('formSiswaKelas').value.trim();
    let jk = document.getElementById('formSiswaJK').value;
    let sekolah = document.getElementById('formSiswaSekolah').value.trim();

    if (!nama) return showCustomAlert('Peringatan', 'Nama lengkap siswa wajib diisi!');

    if(idEdit) {
        let sIndex = db.siswa.findIndex(x => (x.id_siswa || x.id) == idEdit);
        if(sIndex !== -1) { 
            db.siswa[sIndex].nama_siswa = nama; db.siswa[sIndex].nama = nama; 
            db.siswa[sIndex].nisn = nisn; db.siswa[sIndex].nis = nis;
            db.siswa[sIndex].absen = absen; db.siswa[sIndex].kelas = kelas; 
            db.siswa[sIndex].jk = jk; db.siswa[sIndex].asal_sekolah = sekolah; 
        }
    } else {
        db.siswa.push({ 
            id_siswa: Date.now(), nama_siswa: nama, nama: nama,
            nisn: nisn, nis: nis, absen: absen, kelas: kelas, jk: jk, asal_sekolah: sekolah, 
            nilai: { 'Lokomotor': 0, 'Non Lokomotor': 0, 'Manipulatif': 0 } 
        });
    }
    localStorage.setItem(KEY_DB_SISWA, JSON.stringify(db.siswa)); 
    tutupModalSiswa(); 
    renderSiswa();
}

function hapusSiswa(id) {
    showCustomConfirm('Hapus Siswa', 'Hapus data siswa ini beserta nilai asesmennya?', () => {
        db.siswa = db.siswa.filter(s => (s.id_siswa || s.id) !== id);
        localStorage.setItem(KEY_DB_SISWA, JSON.stringify(db.siswa)); 
        renderSiswa();
    });
}

// --- EXCEL IMPORT BATCH ---
function bukaModalImport() {
    document.getElementById('fileExcelImport').value = '';
    document.getElementById('modalImportSiswa').classList.add('active');
}

function tutupModalImport() {
    document.getElementById('modalImportSiswa').classList.remove('active');
}

function unduhDummyExcel() {
    let dataDummy = [
        { "No Abs": 1, "Nama": "Budi Santoso", "NISN": "0012345678", "NIS": "1001", "Kelas": "5-A", "JK": "L", "Sekolah": "SDN 1 Nusantara" },
        { "No Abs": 2, "Nama": "Siti Aminah", "NISN": "0012345679", "NIS": "1002", "Kelas": "5-A", "JK": "P", "Sekolah": "SDN 1 Nusantara" }
    ];

    let ws = XLSX.utils.json_to_sheet(dataDummy);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DataSiswa");
    XLSX.writeFile(wb, "Template_Import_Siswa.xlsx");
}

function prosesImportExcel() {
    let fileInput = document.getElementById('fileExcelImport');
    if (!fileInput.files.length) return showCustomAlert('Peringatan', 'Silakan pilih file Excel (.xlsx) terlebih dahulu!');

    let reader = new FileReader();
    reader.onload = function(e) {
        let data = new Uint8Array(e.target.result);
        let workbook = XLSX.read(data, {type: 'array'});
        let firstSheetName = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[firstSheetName];
        let jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        if(jsonData.length === 0) return showCustomAlert('Error', 'File Excel kosong atau format tidak sesuai!');

        let successCount = 0;
        jsonData.forEach(row => {
            let nama = (row["Nama"] || "").toString().trim();
            if(nama) {
                db.siswa.push({
                    id_siswa: Date.now() + Math.random(),
                    nama_siswa: nama,
                    nama: nama,
                    nisn: (row["NISN"] || "").toString().trim(),
                    nis: (row["NIS"] || "").toString().trim(),
                    absen: (row["No Abs"] || "").toString().trim(),
                    kelas: (row["Kelas"] || "").toString().trim(),
                    jk: (row["JK"] || "L").toString().trim().toUpperCase(),
                    asal_sekolah: (row["Sekolah"] || "").toString().trim(),
                    nilai: { 'Lokomotor': 0, 'Non Lokomotor': 0, 'Manipulatif': 0 } 
                });
                successCount++;
            }
        });

        if(successCount > 0) {
            localStorage.setItem(KEY_DB_SISWA, JSON.stringify(db.siswa));
            tutupModalImport(); renderSiswa();
            showCustomAlert('Berhasil', `${successCount} data siswa berhasil diimpor!`);
        } else {
            showCustomAlert('Error', 'Tidak ada data valid yang ditemukan. Pastikan kolom "Nama" terisi.');
        }
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
}

// --- ASESMEN & ABSENSI FLOW ---
function pilihKategori(jenis_materi) {
    if (db.siswa.length === 0) { 
        return showCustomAlert('Data Kosong', 'Data siswa kosong! Isi daftar siswa terlebih dahulu.', () => { navigate('page-siswa', 'Daftar Siswa'); renderSiswa(); });
    }
    state.tempAsesmen.jenis_materi = jenis_materi; let container = document.getElementById('listSubMateri'); container.innerHTML = '';
    dbMateriFMS.filter(m => m.jenis_materi === jenis_materi).forEach(m => { container.innerHTML += `<div class="menu-item menu-item-sub" style="padding:25px 10px;" onclick="pilihSubMateri('${m.id_materi}')"><img src="./icon/${m.icon}" alt="" /><span style="">${m.nama_materi}</span></div>`; });
    navigate('page-pilih-sub', 'Unit: ' + jenis_materi);
}

function pilihSubMateri(id_materi) {
    let materiTerpilih = dbMateriFMS.find(m => m.id_materi === id_materi);
    state.tempAsesmen.id_materi = materiTerpilih.id_materi; 
    state.tempAsesmen.nama_materi = materiTerpilih.nama_materi;
    
    state.dinilaiSesiIni = []; state.absensiSesiIni = {}; state.kelasAktifAbsensi = "";

    document.getElementById('filterKelasAbsensi').value = "";
    document.getElementById('pesanPilihKelas').style.display = 'block';
    document.getElementById('wadahAbsensiInti').style.display = 'none';

    let listKelas = [...new Set(db.siswa.map(s => s.kelas || '-'))].filter(k => k !== '-');
    let ddlFilter = document.getElementById('filterKelasAbsensi');
    ddlFilter.innerHTML = '<option value="">-- Pilih Kelas --</option>' + listKelas.map(k => `<option value="${k}">${k}</option>`).join('');

    document.getElementById('lblMateriAbsensi').innerText = state.tempAsesmen.nama_materi;
    navigate('page-absensi', 'Absensi Kehadiran');
}

function pilihKelasAbsensi() {
    let kelasTerpilih = document.getElementById('filterKelasAbsensi').value;
    if (!kelasTerpilih) {
        document.getElementById('pesanPilihKelas').style.display = 'block';
        document.getElementById('wadahAbsensiInti').style.display = 'none';
        state.kelasAktifAbsensi = "";
        return;
    }
    state.kelasAktifAbsensi = kelasTerpilih;
    document.getElementById('pesanPilihKelas').style.display = 'none';
    document.getElementById('wadahAbsensiInti').style.display = 'block';

    state.absensiSesiIni = {};
    let siswaKelas = db.siswa.filter(s => (s.kelas || '-') === kelasTerpilih);
    siswaKelas.forEach(s => { state.absensiSesiIni[s.id_siswa || s.id] = 'Masuk'; });
    renderAbsensi();
}

function renderAbsensi() {
    let container = document.getElementById('listAbsensiContainer'); container.innerHTML = '';
    let siswaKelas = db.siswa.filter(s => (s.kelas || '-') === state.kelasAktifAbsensi);

    siswaKelas.forEach(s => {
        let idReal = s.id_siswa || s.id; let status = state.absensiSesiIni[idReal];
        let btnMasuk = status === 'Masuk' ? 'background: #6C63FF; color: white; box-shadow: 0 4px 6px rgba(108, 99, 255, 0.3);' : 'background: #e2e8f0; color: #475569;';
        let btnIzin = status === 'Izin' ? 'background: #FFB86C; color: white; box-shadow: 0 4px 6px rgba(255, 184, 108, 0.3);' : 'background: #e2e8f0; color: #475569;';
        let btnSakit = status === 'Sakit' ? 'background: #00B8D4; color: white; box-shadow: 0 4px 6px rgba(0, 184, 212, 0.3);' : 'background: #e2e8f0; color: #475569;';
        let btnAlfa = status === 'Alfa' ? 'background: #FF6B6B; color: white; box-shadow: 0 4px 6px rgba(255, 107, 107, 0.3);' : 'background: #e2e8f0; color: #475569;';

        container.innerHTML += `
            <div class="card" style="padding: 15px; margin-bottom: 15px; border-left: 5px solid #6C63FF;">
                <div class="truncate-text" style="font-weight: 800; font-size: 1.1rem; margin-bottom: 10px; color: #2D3748;">
                    👤 ${s.nama_siswa || s.nama} <span style="font-size: 0.8rem; color:#888;">(Absen: ${s.absen || '-'})</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px;">
                    <button class="btn" style="margin-bottom: 0; padding: 8px 0; font-size: 0.85rem; border-radius: 8px; ${btnMasuk}" onclick="setAbsen(${idReal}, 'Masuk')">Masuk</button>
                    <button class="btn" style="margin-bottom: 0; padding: 8px 0; font-size: 0.85rem; border-radius: 8px; ${btnIzin}" onclick="setAbsen(${idReal}, 'Izin')">Izin</button>
                    <button class="btn" style="margin-bottom: 0; padding: 8px 0; font-size: 0.85rem; border-radius: 8px; ${btnSakit}" onclick="setAbsen(${idReal}, 'Sakit')">Sakit</button>
                    <button class="btn" style="margin-bottom: 0; padding: 8px 0; font-size: 0.85rem; border-radius: 8px; ${btnAlfa}" onclick="setAbsen(${idReal}, 'Alfa')">Alfa</button>
                </div>
            </div>`;
    });
}

function setAbsen(idSiswa, status) { state.absensiSesiIni[idSiswa] = status; renderAbsensi(); }

function simpanAbsensiDanLanjut() {
    let materiTerpilih = dbMateriFMS.find(m => m.id_materi === state.tempAsesmen.id_materi);
    let nilaiMaksimal = materiTerpilih.kriteria.length * 2;
    let siswaKelas = db.siswa.filter(s => (s.kelas || '-') === state.kelasAktifAbsensi);

    siswaKelas.forEach(s => {
        let idReal = s.id_siswa || s.id; let status = state.absensiSesiIni[idReal];
        if (status !== 'Masuk') {
            db.asesmen.push({ 
                id: Date.now() + Math.random(), tanggal: new Date().toLocaleString('id-ID'), 
                id_materi: state.tempAsesmen.id_materi, kategori: state.tempAsesmen.jenis_materi, 
                sub: `${state.tempAsesmen.nama_materi} (${status})`, idSiswa: idReal, namaSiswa: s.nama_siswa || s.nama, 
                nilai_p1: 0, nilai_p2: 0, nilai: 0, maxNilai: nilaiMaksimal
            });
            state.dinilaiSesiIni.push(idReal); updateNilaiSiswa(idReal);
        }
    });
    localStorage.setItem(KEY_DB_ASESMEN, JSON.stringify(db.asesmen));
    renderSiswaAsesmen(); navigate('page-pilih-siswa-asesmen', 'Pilih Siswa');
}

function renderSiswaAsesmen() {
    document.getElementById('lblMateriAktif').innerText = state.tempAsesmen.nama_materi; 
    let container = document.getElementById('listSiswaAsesmenContainer'); container.innerHTML = '';
    
    let adaSiswaMasuk = false;
    let siswaKelas = db.siswa.filter(s => (s.kelas || '-') === state.kelasAktifAbsensi);

    siswaKelas.forEach(s => {
        let idReal = s.id_siswa || s.id; let status = state.absensiSesiIni[idReal];
        if (status === 'Masuk') {
            adaSiswaMasuk = true;
            let isAssessed = state.dinilaiSesiIni.includes(idReal);
            let statusBadge = isAssessed ? '<span style="background: #00B8D4; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; margin-left: 8px; font-weight: bold;">✅ Selesai</span>' : '';
            let actionText = isAssessed ? '<span style="color: #718096; font-size: 0.95rem;">Ulangi ➔</span>' : '<span style="color: #6C63FF; font-weight: 800;">NILAI ➔</span>';
            container.innerHTML += `<div class="list-item" onclick="bukaFormAsesmen(${idReal}, '${s.nama_siswa || s.nama}')" style="cursor:pointer; border-left-color: ${isAssessed ? '#00B8D4' : '#FFB86C'}; ${isAssessed ? 'opacity:0.85;' : ''}">
                <div style="flex: 1; min-width: 0; display: flex; align-items: center;"><span class="truncate-text" style="max-width: 70%; font-size:1.1rem;">${s.absen || '-'}. ${s.nama_siswa || s.nama}</span>${statusBadge}</div>${actionText}</div>`;
        }
    });

    if (!adaSiswaMasuk) container.innerHTML = `<div class="card" style="text-align:center; color:#888; font-weight: bold;">Tidak ada siswa kelas ${state.kelasAktifAbsensi} yang berstatus "Masuk" pada sesi ini.</div>`;
    container.innerHTML += `<div class="tutup-asesmen"><button class="btn btn-primary" onclick="return showCustomConfirm('Tutup Asesmen', 'Pastikan semua siswa sudah melakukan penilaian. Anda yakin ingin menutup?', ()=> { showPage('page-dashboard','DIASFUNTORS')});">Tutup Asesmen</button></div>`;
}

function bukaFormAsesmen(idSiswa, namaSiswa) {
    state.tempAsesmen.idSiswa = idSiswa; state.tempAsesmen.namaSiswa = namaSiswa;
    let materiTerpilih = dbMateriFMS.find(m => m.id_materi === state.tempAsesmen.id_materi);
    document.getElementById('namaSiswaDinilai').innerText = namaSiswa; document.getElementById('materiDinilai').innerText = materiTerpilih.nama_materi; 
    
    document.getElementById('instruksiGuruText').innerHTML = `
        <div style="margin-top: 15px; text-align: center;"><video controls style="width: 100%; border-radius: 12px; border: 2px solid #B2EBF2; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><source src="assets/${materiTerpilih.video}" type="video/mp4">Browser Anda tidak mendukung tag video.</video></div>${materiTerpilih.instruksi}`;
    
    let container = document.getElementById('kriteriaContainer'); container.innerHTML = '';
    
    let htmlP1 = `<div class="card" style="padding: 0; overflow: hidden; margin-bottom: 20px; border: 1px solid #E2E1FF;"><div style="background: #E2E1FF; color: #5A52D5; padding: 14px; text-align: center; font-weight: 900; font-size: 1.1rem; letter-spacing: 1px;">▶ PERCOBAAN 1</div><div style="padding: 5px 15px 15px 15px;">`;
    materiTerpilih.kriteria.forEach((k, i) => { htmlP1 += `<div style="display: grid; grid-template-columns: 3fr 1fr; align-items: center; padding: 14px 0; border-bottom: 1px dashed #e0e0e0;"><div style="font-size: 0.95rem; line-height: 1.5; color: #2D3748; padding-right: 15px;"><span style="color: #6C63FF; font-weight: 800; margin-right: 5px;">${i+1}.</span> ${k}</div><div style="display: flex; justify-content: center; align-items: center; height: 100%; border-left: 2px solid #f4f7f9;"><input type="checkbox" class="cek-p1" value="1" style="width: 28px; height: 28px; accent-color: #6C63FF; margin: 0; cursor: pointer;"></div></div>`; });
    htmlP1 += `</div></div>`;

    let htmlP2 = `<div class="card" style="padding: 0; overflow: hidden; margin-bottom: 25px; border: 1px solid #FFE0B2;"><div style="background: #FFE0B2; color: #D84315; padding: 14px; text-align: center; font-weight: 900; font-size: 1.1rem; letter-spacing: 1px;">▶ PERCOBAAN 2</div><div style="padding: 5px 15px 15px 15px;">`;
    materiTerpilih.kriteria.forEach((k, i) => { htmlP2 += `<div style="display: grid; grid-template-columns: 3fr 1fr; align-items: center; padding: 14px 0; border-bottom: 1px dashed #e0e0e0;"><div style="font-size: 0.95rem; line-height: 1.5; color: #2D3748; padding-right: 15px;"><span style="color: #D84315; font-weight: 800; margin-right: 5px;">${i+1}.</span> ${k}</div><div style="display: flex; justify-content: center; align-items: center; height: 100%; border-left: 2px solid #f4f7f9;"><input type="checkbox" class="cek-p2" value="1" style="width: 28px; height: 28px; accent-color: #D84315; margin: 0; cursor: pointer;"></div></div>`; });
    htmlP2 += `</div></div>`;

    container.innerHTML = htmlP1 + htmlP2;

    let btnSimpan = document.querySelector('#page-form-asesmen .btn-primary');
    btnSimpan.style.display = 'block'; btnSimpan.id = "btnSimpanPenilaian";
    
    let hasilContainer = document.getElementById('hasilPenilaianContainer');
    if(!hasilContainer) { hasilContainer = document.createElement('div'); hasilContainer.id = 'hasilPenilaianContainer'; container.parentNode.insertBefore(hasilContainer, btnSimpan.nextSibling); }
    hasilContainer.style.display = 'none'; hasilContainer.innerHTML = '';
    
    navigate('page-form-asesmen', 'Penilaian');
}

function simpanAsesmen() {
    let scoreP1 = 0; let scoreP2 = 0;
    document.querySelectorAll('#kriteriaContainer .cek-p1').forEach(c => { if(c.checked) scoreP1++; });
    document.querySelectorAll('#kriteriaContainer .cek-p2').forEach(c => { if(c.checked) scoreP2++; });

    let materiTerpilih = dbMateriFMS.find(m => m.id_materi === state.tempAsesmen.id_materi);
    let nilaiAkhir = scoreP1 + scoreP2; let maxPerPercobaan = materiTerpilih.kriteria.length; let nilaiMaksimal = maxPerPercobaan * 2;
    let persentase = Math.round((nilaiAkhir / nilaiMaksimal) * 100);

    let kategori = ""; let warnaKategori = ""; let iconKategori = "";
    if (persentase >= 85) { kategori = "Sangat Baik"; warnaKategori = "#2E7D32"; iconKategori = "⭐"; }
    else if (persentase >= 70) { kategori = "Baik"; warnaKategori = "#1976D2"; iconKategori = "👍"; }
    else if (persentase >= 55) { kategori = "Cukup"; warnaKategori = "#F57C00"; iconKategori = "⚖️"; }
    else { kategori = "Perlu Bimbingan"; warnaKategori = "#D32F2F"; iconKategori = "⚠️"; }

    db.asesmen.push({ id: Date.now(), tanggal: new Date().toLocaleString('id-ID'), id_materi: state.tempAsesmen.id_materi, kategori: state.tempAsesmen.jenis_materi, sub: state.tempAsesmen.nama_materi, idSiswa: state.tempAsesmen.idSiswa, namaSiswa: state.tempAsesmen.namaSiswa, nilai_p1: scoreP1, nilai_p2: scoreP2, nilai: nilaiAkhir, maxNilai: nilaiMaksimal });
    localStorage.setItem(KEY_DB_ASESMEN, JSON.stringify(db.asesmen));
    updateNilaiSiswa(state.tempAsesmen.idSiswa); state.dinilaiSesiIni.push(state.tempAsesmen.idSiswa);
    
    document.getElementById('btnSimpanPenilaian').style.display = 'none'; document.querySelectorAll('.cek-p1, .cek-p2').forEach(c => c.disabled = true);
    
    let hasilContainer = document.getElementById('hasilPenilaianContainer'); hasilContainer.style.display = 'block';
    hasilContainer.innerHTML = `<div style="background: #ffffff; border: 2px solid ${warnaKategori}; border-radius: 16px; padding: 25px 20px; text-align: center; margin-top: 15px; box-shadow: 0 8px 20px rgba(0,0,0,0.08);"><p style="color: #64748b; margin-bottom: 5px; font-weight: 700; font-size: 0.95rem;">✅ Asesmen Tersimpan!</p><h2 style="font-size: 4rem; font-weight: 900; color: ${warnaKategori}; margin: 5px 0; line-height: 1;">${persentase}<span style="font-size: 2rem;">%</span></h2><h4 style="font-size: 1.4rem; font-weight: 800; color: ${warnaKategori}; margin-bottom: 25px;">${iconKategori} ${kategori}</h4><div style="background: #f8fafc; border-radius: 12px; padding: 15px; margin: 15px 0; display:flex; justify-content:space-around; align-items: center; border: 1px solid #e2e8f0;"><div style="text-align: center;"><span style="font-size:0.85rem; color:#64748b; display:block; font-weight: 700;">Percobaan 1</span><b style="color:#6C63FF; font-size:1.4rem;">${scoreP1} <span style="font-size:0.9rem; color:#94a3b8;">/ ${maxPerPercobaan}</span></b></div><div style="width: 1px; height: 40px; background: #cbd5e1;"></div><div style="text-align: center;"><span style="font-size:0.85rem; color:#64748b; display:block; font-weight: 700;">Percobaan 2</span><b style="color:#D84315; font-size:1.4rem;">${scoreP2} <span style="font-size:0.9rem; color:#94a3b8;">/ ${maxPerPercobaan}</span></b></div></div><div style="margin-bottom: 25px;"><span style="font-size:0.95rem; color:#64748b; font-weight: 700;">Total Skor: </span><b style="font-size:1.2rem; color: #334155; background: #e2e8f0; padding: 4px 12px; border-radius: 8px;">${nilaiAkhir} / ${nilaiMaksimal}</b></div><button class="btn btn-tertiary" onclick="kembaliKeDaftarSiswaDinilai()" style="margin-bottom:0; width: 100%; padding: 15px; border-radius: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">➔ Kembali</button></div>`;
}

function kembaliKeDaftarSiswaDinilai() { renderSiswaAsesmen(); let prev = state.history.pop(); showPage(prev.id, prev.title); }

// --- HASIL, DETAIL & LAPORAN ---
function renderHasil() {
    // 1. Setup Filter Kelas untuk Hasil Evaluasi
    let listKelas = [...new Set(db.siswa.map(s => s.kelas || '-'))].filter(k => k !== '-');
    let ddlFilter = document.getElementById('filterKelasHasil'); // Pastikan elemen ini ada di page-hasil
    
    // Jika dropdown belum ada di HTML, Anda perlu menambahkannya di page-hasil nanti
    if(ddlFilter) {
        let currentFilter = ddlFilter.value;
        ddlFilter.innerHTML = '<option value="">Semua Kelas</option>' + listKelas.map(k => `<option value="${k}">${k}</option>`).join('');
        ddlFilter.value = currentFilter;
    }

    if ($.fn.DataTable.isDataTable('#tabelHasilEvaluasi')) {
        $('#tabelHasilEvaluasi').DataTable().destroy();
    }

    let tbody = document.querySelector('#tabelHasilEvaluasi tbody');
    tbody.innerHTML = '';
    
    db.siswa.forEach(s => {
        let idReal = s.id_siswa || s.id;
        let nLoko = s.nilai && s.nilai['Lokomotor'] !== undefined ? s.nilai['Lokomotor'] + '%' : '-';
        let nNon = s.nilai && s.nilai['Non Lokomotor'] !== undefined ? s.nilai['Non Lokomotor'] + '%' : '-';
        let nMan = s.nilai && s.nilai['Manipulatif'] !== undefined ? s.nilai['Manipulatif'] + '%' : '-';

        tbody.innerHTML += `
            <tr>
                <td>${s.absen || '-'}</td>
                <td style="font-weight: 800; color: #2D3748;">${s.nama_siswa || s.nama}</td>
                <td>${s.kelas || '-'}</td>
                <td><span class="badge-nilai">${nLoko}</span></td>
                <td><span class="badge-nilai">${nNon}</span></td>
                <td><span class="badge-nilai">${nMan}</span></td>
                <td>
                <button onclick="bukaDetailSiswa(${idReal})" style="cursor:pointer;" class="btn-sm btn-tertiary">
                Rincian
                </button>
                </td>
            </tr>
        `;
    });

    let dtHasil = $('#tabelHasilEvaluasi').DataTable({
        order: [[2, 'asc'], [0, 'asc']],
        language: { search: "Cari Siswa:", emptyTable: "Data siswa kosong.", paginate: { next: "▶", previous: "◀" } },
        pageLength: 10, lengthChange: false, info: false, scrollX: true
    });

    if(ddlFilter) {
        ddlFilter.onchange = function() {
            let val = $.fn.dataTable.util.escapeRegex(this.value);
            dtHasil.column(2).search(val ? '^' + val + '$' : '', true, false).draw();
        };
    }
}


// Fungsi Bantu Manipulasi XML DataTables Excel HTML5
function excelCustomizerTemplate(xlsx, reportTitle, colCountStr) {
    var sheet = xlsx.xl.worksheets['sheet1.xml'];
    var downrows = 4;
    var clRow = $('row', sheet);
    clRow.each(function() { var ind = parseInt($(this).attr('r')) + downrows; $(this).attr("r", ind); });
    $('row c', sheet).each(function() {
        var pre = $(this).attr('r').replace(/[0-9]/g, ''); var ind = parseInt($(this).attr('r').replace(/\D/g, '')) + downrows;
        $(this).attr("r", pre + ind);
    });
    function addRowXML(index, val) { return '<row r="'+index+'"><c t="inlineStr" r="A'+index+'"><is><t>'+val+'</t></is></c></row>'; }
    var r1 = addRowXML(1, reportTitle);
    var r2 = addRowXML(2, 'Nama Guru: ' + (db.pengaturan.nama || '-'));
    var r3 = addRowXML(3, 'NIP: ' + (db.pengaturan.nip || '-'));
    var sheetData = $('sheetData', sheet);
    sheetData.prepend(r3); sheetData.prepend(r2); sheetData.prepend(r1);
    
    var mergeCells = $('mergeCells', sheet);
    if(mergeCells.length === 0) { $(sheet).find('worksheet').append('<mergeCells count="1"><mergeCell ref="A1:'+colCountStr+'1"/></mergeCells>'); } 
    else { mergeCells.attr('count', parseInt(mergeCells.attr('count')) + 1); mergeCells.append('<mergeCell ref="A1:'+colCountStr+'1"/>'); }
}

let detailDataTable;
function bukaDetailSiswa(idSiswa) {
    let s = db.siswa.find(x => (x.id_siswa || x.id) === idSiswa); if(!s) return;
    let namaReal = s.nama_siswa || s.nama, absenReal = s.absen || '-', kelasReal = s.kelas || '-';
    let numLoko = s.nilai && s.nilai['Lokomotor'] !== undefined ? s.nilai['Lokomotor'] : 0; let numNon = s.nilai && s.nilai['Non Lokomotor'] !== undefined ? s.nilai['Non Lokomotor'] : 0; let numMan = s.nilai && s.nilai['Manipulatif'] !== undefined ? s.nilai['Manipulatif'] : 0;
    let pLoko = getKategoriPredikat(numLoko); let pNon = getKategoriPredikat(numNon); let pMan = getKategoriPredikat(numMan);

    document.getElementById('detailSiswaProfil').innerHTML = `<div style="text-align: center; margin-bottom: 25px;"><div style="font-size: 3.5rem; background: #F4F7F9; width: 90px; height: 90px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; box-shadow: 0 6px 15px rgba(108, 99, 255, 0.2);">👤</div><h3 style="color: #2D3748; font-size: 1.5rem; font-weight: 900; margin-bottom: 5px;">${namaReal}</h3><p style="color: #718096; font-size: 1rem; font-weight: 600;">No. Absen: <b style="color:#6C63FF;">${absenReal}</b> | Kelas: <b style="color:#6C63FF;">${kelasReal}</b></p></div><div style="display: flex; gap: 8px; justify-content: space-between; background: #fff; padding: 15px 5px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #E2E1FF; width: 100%; box-sizing: border-box;"><div style="text-align: center; flex: 1; min-width: 0; max-width: calc((100% - 16px) / 3); border-right: 1px dashed #e2e8f0; padding: 0 2px; display: flex; flex-direction: column; justify-content: space-between; align-items: center;"><div style="width: 100%;"><div class="truncate-text" title="Lokomotor" style="font-size: 0.75rem; color: #64748b; font-weight: 800; margin-bottom:5px; width: 100%; cursor: help;">Lokomotor</div><div style="font-size: 1.35rem; font-weight: 900; color: ${pLoko.warna}; line-height: 1;">${numLoko}%</div><div class="truncate-text" title="${pLoko.teks}" style="font-size: 0.65rem; color: ${pLoko.warna}; font-weight: 700; margin: 8px 0 12px; width: 100%; cursor: help;">${pLoko.icon} ${pLoko.teks}</div></div><button class="btn" style="background: #f1f5f9; color: #475569; padding: 8px 2px; font-size: 0.7rem; border-radius: 8px; box-shadow: none; margin: 0; width: 100%; letter-spacing: -0.5px;" onclick="bukaRincianKategori(${idSiswa}, 'Lokomotor')">Rincian</button></div><div style="text-align: center; flex: 1; min-width: 0; max-width: calc((100% - 16px) / 3); border-right: 1px dashed #e2e8f0; padding: 0 2px; display: flex; flex-direction: column; justify-content: space-between; align-items: center;"><div style="width: 100%;"><div class="truncate-text" title="Non Lokomotor" style="font-size: 0.75rem; color: #64748b; font-weight: 800; margin-bottom:5px; width: 100%; cursor: help;">Non-Loko</div><div style="font-size: 1.35rem; font-weight: 900; color: ${pNon.warna}; line-height: 1;">${numNon}%</div><div class="truncate-text" title="${pNon.teks}" style="font-size: 0.65rem; color: ${pNon.warna}; font-weight: 700; margin: 8px 0 12px; width: 100%; cursor: help;">${pNon.icon} ${pNon.teks}</div></div><button class="btn" style="background: #f1f5f9; color: #475569; padding: 8px 2px; font-size: 0.7rem; border-radius: 8px; box-shadow: none; margin: 0; width: 100%; letter-spacing: -0.5px;" onclick="bukaRincianKategori(${idSiswa}, 'Non Lokomotor')">Rincian</button></div><div style="text-align: center; flex: 1; min-width: 0; max-width: calc((100% - 16px) / 3); padding: 0 2px; display: flex; flex-direction: column; justify-content: space-between; align-items: center;"><div style="width: 100%;"><div class="truncate-text" title="Manipulatif" style="font-size: 0.75rem; color: #64748b; font-weight: 800; margin-bottom:5px; width: 100%; cursor: help;">Manipulatif</div><div style="font-size: 1.35rem; font-weight: 900; color: ${pMan.warna}; line-height: 1;">${numMan}%</div><div class="truncate-text" title="${pMan.teks}" style="font-size: 0.65rem; color: ${pMan.warna}; font-weight: 700; margin: 8px 0 12px; width: 100%; cursor: help;">${pMan.icon} ${pMan.teks}</div></div><button class="btn" style="background: #f1f5f9; color: #475569; padding: 8px 2px; font-size: 0.7rem; border-radius: 8px; box-shadow: none; margin: 0; width: 100%; letter-spacing: -0.5px;" onclick="bukaRincianKategori(${idSiswa}, 'Manipulatif')">Rincian</button></div></div>`;

    if ($.fn.DataTable.isDataTable('#tabelDetailSiswa')) $('#tabelDetailSiswa').DataTable().destroy();
    let tbody = document.querySelector('#tabelDetailSiswa tbody'); tbody.innerHTML = '';
    let riwayatSiswa = db.asesmen.filter(a => a.idSiswa === idSiswa);
    riwayatSiswa.forEach((a, idx) => {
        let tmpPersen = Math.round(parseFloat(a.nilai)/parseFloat(a.maxNilai)*100); let feedback = getKategoriPredikat(tmpPersen);
        tbody.innerHTML += `<tr><td>${idx + 1}</td><td style="color:#666; font-weight:bold;">${a.tanggal.split(',')[0]}</td><td><strong style="color:#2D3748; font-size:0.95rem;">${a.sub}</strong><br><span style="font-size:0.75rem; color:#718096;">${a.kategori}</span></td><td style="font-weight:900; color:#6C63FF; text-align:center; font-size:1.1rem;">${tmpPersen}</td><td style="font-weight:900; color: ${feedback.warna}; text-align:center; font-size:1.1rem;">${feedback.teks}</td></tr>`;
    });

    let excelFilename = `Riwayat Evaluasi Diasfuntor - ${namaReal} - ${db.pengaturan.sekolah || '-'}`;
    detailDataTable = $('#tabelDetailSiswa').DataTable({
        order: [[0, 'asc']], dom: '<"top"Bf>rt<"bottom"p><"clear">',
        buttons: [{ 
            extend: 'excelHtml5', text: '📥 Unduh Excel', 
            title: '', filename: excelFilename,
            customize: function(xlsx) { excelCustomizerTemplate(xlsx, 'Riwayat Evaluasi Siswa', 'E'); }
        }],
        language: { search: "Saring Data:", emptyTable: "Belum ada riwayat asesmen.", paginate: { next: "▶", previous: "◀" } },
        pageLength: 5, lengthChange: false, info: false, scrollX: true
    });
    navigate('page-detail-siswa', 'Rapor Siswa');
}

let myDataTable;
$.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
    if(settings.nTable.id !== 'tabelDataLaporan') return true; 
    let fDate = $('#filterTanggalDT').val(); if (!fDate) return true; 
    let parts = data[0].split(',')[0].trim().split(' ')[0].trim().split('/');
    if(parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}` === fDate;
    return true;
});

function renderLaporan() {
    if ($.fn.DataTable.isDataTable('#tabelDataLaporan')) $('#tabelDataLaporan').DataTable().destroy();
    let tbody = document.querySelector('#tabelDataLaporan tbody'); tbody.innerHTML = '';
    db.asesmen.forEach(a => { 
        let tmpPersen = Math.round(parseFloat(a.nilai) / parseFloat(a.maxNilai)*100); let feedback = getKategoriPredikat(tmpPersen);
        tbody.innerHTML += `<tr><td style="color:#666; font-weight:bold;">${a.tanggal.split(',')[0]}</td><td><strong style="color:#2D3748;">${a.namaSiswa}</strong></td><td>${a.kategori} - ${a.sub}</td><td style="font-weight:900; color:#6C63FF;">${tmpPersen}</td><td style="font-weight:900; color:${feedback.warna};">${feedback.teks}</td></tr>`; 
    });

    myDataTable = $('#tabelDataLaporan').DataTable({
        order: [[0, 'desc']], dom: '<"top"Bf>rt<"bottom"p><"clear">', 
        buttons: [{ 
            extend: 'excelHtml5', text: '📥 Unduh Laporan Excel',
            title: '', 
            filename: function() {
                let d = $('#filterTanggalDT').val();
                let txtTgl = d ? d : new Date().getFullYear();
                return `Laporan Asesmen Diasfuntors - ${db.pengaturan.sekolah || '-'} - ${txtTgl}`;
            },
            customize: function(xlsx) { excelCustomizerTemplate(xlsx, 'Laporan Asesmen Diasfuntors', 'E'); }
        }],
        language: { search: "Cari Data Siswa:", emptyTable: "Belum ada data riwayat tersimpan.", paginate: { next: "▶", previous: "◀" } },
        pageLength: 10, lengthChange: false, info: false, scrollX: true
    });
}

$('#filterTanggalDT').on('change', function() { if (myDataTable) myDataTable.draw(); });
function resetFilterDT() { $('#filterTanggalDT').val(''); if (myDataTable) myDataTable.draw(); }

function getKategoriPredikat(persentase) {
    if (persentase >= 85) return { teks: "Sangat Baik", warna: "#2E7D32", icon: "⭐" };
    if (persentase >= 70) return { teks: "Baik", warna: "#1976D2", icon: "👍" };
    if (persentase >= 55) return { teks: "Cukup", warna: "#F57C00", icon: "⚖️" };
    return { teks: "Perlu Bimbingan", warna: "#D32F2F", icon: "⚠️" };
}

function bukaRincianKategori(idSiswa, kategori) {
    document.getElementById('judulModalRincian').innerText = "Rincian " + kategori;
    let riwayat = db.asesmen.filter(a => a.idSiswa === idSiswa && a.kategori === kategori);
    if(riwayat.length === 0) {
        document.getElementById('kontenModalRincian').innerHTML = `<p style="text-align:center; color:#888;">Belum ada data asesmen untuk ${kategori}.</p>`; document.getElementById('modalRincian').classList.add('active'); return;
    }
    let tesTerbaru = riwayat; let totalNilai = 0; let totalMax = 0; let barisTabel = ''; let no = 1;
    Object.values(tesTerbaru).forEach(a => {
        totalNilai += a.nilai; totalMax += a.maxNilai;
        barisTabel += `<tr><td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">${no++}</td><td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #2D3748; font-weight: 700;">${a.sub}</td><td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 900; color: #6C63FF; text-align: center;">${a.nilai}</td></tr>`;
    });
    let tmpPersen = Math.round((totalNilai/totalMax)* 100); let ketPersen = getKategoriPredikat(tmpPersen);
    let htmlRincian = `<table style="width:100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.95rem;"><thead><tr style="background: #E2E1FF; color: #5A52D5;"><th style="padding: 12px 10px; text-align: left; border-radius: 10px 0 0 0;">No</th><th style="padding: 12px 10px; text-align: left;">Gerakan</th><th style="padding: 12px 10px; text-align: center; border-radius: 0 10px 0 0;">Skor</th></tr></thead><tbody>${barisTabel}</tbody></table><div style="background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;"><div style="font-size: 1.5rem;">📊</div><div><div style="font-size: 0.8rem; color: #64748b; font-weight: 700;">TOTAL SKOR ${kategori.toUpperCase()}</div><div style="font-size: 1.1rem; font-weight: 900; color: #2D3748;">Total = ${totalNilai}</div></div></div><div style="background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px; margin-bottom: 10px;"><div style="font-size: 1.5rem;">✅</div><div><div style="font-size: 0.8rem; color: #64748b; font-weight: 700;">SKOR MAKSIMAL</div><div style="font-size: 1.1rem; font-weight: 900; color: #2D3748;">Total = ${totalMax}</div></div></div><div style="background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px;"><div style="font-size: 1.5rem;">${ketPersen.icon}</div><div><div style="font-size: 0.8rem; color: #64748b; font-weight: 700;">PERSENTASE</div><div style="font-size: 1.1rem; font-weight: 900; color: #2D3748;">${tmpPersen} % <span style="color:${ketPersen.warna}">(${ketPersen.teks})</span></div></div></div>`;
    document.getElementById('kontenModalRincian').innerHTML = htmlRincian; document.getElementById('modalRincian').classList.add('active');
}

// --- PENGATURAN ---
function loadPengaturan() { 
    document.getElementById('setNamaGuru').value = db.pengaturan.nama || '';
    document.getElementById('setNIP').value = db.pengaturan.nip || '';
    document.getElementById('setSekolah').value = db.pengaturan.sekolah || '';
    document.getElementById('setUname').value = db.pengaturan.uname || 'admin'; 
    document.getElementById('setPass').value = db.pengaturan.pass || 'admin'; 
    document.getElementById('setGunakanLogin').checked = db.pengaturan.gunakanLogin === true;
}

function simpanPengaturan() { 
    db.pengaturan.nama = document.getElementById('setNamaGuru').value.trim();
    db.pengaturan.nip = document.getElementById('setNIP').value.trim();
    db.pengaturan.sekolah = document.getElementById('setSekolah').value.trim();
    db.pengaturan.uname = document.getElementById('setUname').value;
    db.pengaturan.pass = document.getElementById('setPass').value;
    db.pengaturan.gunakanLogin = document.getElementById('setGunakanLogin').checked;
    
    localStorage.setItem(KEY_DB_AKUN, JSON.stringify(db.pengaturan)); 
    updateBreadcrumb();
    
    // 1. Kembalikan scroll halaman pengaturan ke paling atas
    setTimeout(function() {
      
    document.getElementById('page-pengaturan').scrollTop = 0;
    }, 500);
    
    // 2. Tampilkan Alert (karena sudah di atas, modal akan langsung terlihat)
    // 3. Tetap gunakan handleBack() agar kembali ke dasbor setelah menekan "Baik"
    showCustomAlert('Berhasil', 'Pengaturan keamanan akun berhasil disimpan!', () => { 
        handleBack(); 
    }); 
}



function hapusSemuaRiwayat() {
    showCustomConfirm('PERINGATAN KERAS!', 'Anda yakin ingin menghapus SELURUH Riwayat Asesmen secara permanen? Tindakan ini tidak dapat dibatalkan!', () => {
        db.asesmen = [];
        localStorage.setItem(KEY_DB_ASESMEN, JSON.stringify(db.asesmen));
        db.siswa.forEach(s => { s.nilai = { 'Lokomotor': 0, 'Non Lokomotor': 0, 'Manipulatif': 0 }; });
        localStorage.setItem(KEY_DB_SISWA, JSON.stringify(db.siswa));
        showCustomAlert('Berhasil', 'Seluruh riwayat asesmen telah berhasil dihapus.', () => { handleBack(); });
    });
}
