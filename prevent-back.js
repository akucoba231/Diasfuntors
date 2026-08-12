/**
 * Mencegah pengguna menekan tombol "Back" bawaan browser.
 * Sangat berguna untuk aplikasi berbasis SPA (Single Page Application)
 * agar pengguna tidak sengaja keluar dari aplikasi.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Memaksa menambahkan satu riwayat manipulasi (dummy state)
    window.history.pushState(null, null, window.location.href);
    
    // Ketika pengguna mencoba menekan tombol kembali (back button),
    // event popstate akan terpicu.
    window.onpopstate = function(event) {
        // Mendorong kembali state buatan agar browser tidak bisa mundur
        window.history.pushState(null, null, window.location.href);
        
        // Memunculkan peringatan menggunakan alert kustom aplikasi (jika tersedia)
        if (typeof showModal === 'function') {
            //showModal("Perhatian", "Harap gunakan tombol navigasi (kembali) yang ada di dalam aplikasi, bukan tombol bawaan dari browser.");
            alert("Harap gunakan tombol navigasi (kembali) yang ada di dalam aplikasi, bukan tombol bawaan dari browser.");
        } else {
            console.warn("Tombol kembali dari browser dinonaktifkan untuk menjaga stabilitas aplikasi.");
        }
    };
});
