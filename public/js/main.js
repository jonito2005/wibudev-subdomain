   // public/js/main.js
document.getElementById('subdomainForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const subdomainInput = document.getElementById('subdomain');
    const serverIPInput = document.getElementById('serverIP');
    const proxyStatusInput = document.getElementById('proxyStatus');

    if (!subdomainInput || !serverIPInput || !proxyStatusInput) {
        console.error('Form inputs not found');
        return;
    }

    const subdomain = subdomainInput.value.trim();
    const serverIP = serverIPInput.value.trim();
    const proxyStatus = proxyStatusInput.checked;

    if (!subdomain || !serverIP) {
        Swal.fire({
            title: 'Error',
            text: 'Subdomain dan IP Server harus diisi',
            icon: 'error',
            customClass: {
                popup: 'glass-modal'
            }
        });
        return;
    }

    // Validasi format IP (opsional)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(serverIP)) {
        Swal.fire({
            title: 'Error',
            text: 'Format IP Server tidak valid',
            icon: 'error',
            customClass: {
                popup: 'glass-modal'
            }
        });
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memproses...';

        // Cek ketersediaan subdomain terlebih dahulu
        const checkResponse = await fetch('/check-subdomain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subdomain })
        });

        const checkData = await checkResponse.json();

        if (!checkData.available) {
            Swal.fire({
                title: 'Error',
                text: 'Subdomain sudah digunakan. Silakan pilih nama lain.',
                icon: 'error',
                customClass: {
                    popup: 'glass-modal'
                }
            });
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-plus mr-2"></i>Buat Subdomain';
            return;
        }

        // Jika subdomain tersedia, lanjutkan dengan pembuatan
        const response = await fetch('/create-subdomain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subdomain,
                serverIP,
                proxyStatus
            })
        });

        const result = await response.json();
        
        if (response.status === 429) {
            // Rate limit error
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Anda harus menunggu 1 jam sebelum membuat subdomain baru',
                customClass: {
                    popup: 'glass-modal'
                }
            });
            return;
        }

        if (result.success) {
            Swal.fire({
                title: 'Berhasil!',
                html: `
                    Subdomain berhasil dibuat!<br><br>
                    <div class="text-lg font-bold mb-2">
                        Kode Unik Anda:<br>
                        <span class="text-indigo-400">${result.data.uniqueCode}</span>
                    </div>
                    <div class="text-sm text-gray-400">
                        Simpan kode unik ini untuk login dan mengelola subdomain Anda
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'OK',
                customClass: {
                    popup: 'glass-modal'
                }
            });

            event.target.reset();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'Terjadi kesalahan saat membuat subdomain',
            icon: 'error',
            customClass: {
                popup: 'glass-modal'
            }
        });
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-plus mr-2"></i>Buat Subdomain';
    }
});

function reportAbuse() {
    const message = encodeURIComponent("Saya ingin melaporkan penyalahgunaan.");
    const phoneNumber = "6281244863011";
    const url = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(url, '_blank');
}

// Fungsi untuk mengecek ketersediaan subdomain
async function checkSubdomain(value) {
    if (!value) return;
    
    try {
        const response = await fetch('/check-subdomain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subdomain: value.toLowerCase() })
        });
        
        const data = await response.json();
        const errorDiv = document.getElementById('subdomainError');
        
        if (data.exists) {
            errorDiv.textContent = 'Subdomain ini sudah digunakan. Silakan pilih nama lain.';
            errorDiv.classList.remove('hidden');
            document.querySelector('button[type="submit"]').disabled = true;
        } else {
            errorDiv.classList.add('hidden');
            document.querySelector('button[type="submit"]').disabled = false;
        }
    } catch (error) {
        console.error('Error checking subdomain:', error);
    }
}

// Add event listener for subdomain input
document.getElementById('subdomain')?.addEventListener('input', function(e) {
    checkSubdomain(e.target.value.trim());
});

// Add event listener for search domain
document.getElementById('searchDomain')?.addEventListener('input', function(e) {
    const searchValue = e.target.value.toLowerCase();
    const domainItems = document.querySelectorAll('.domain-item');
    
    domainItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchValue)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
});

// Hapus event listener untuk pengecekan realtime jika ada
document.getElementById('subdomain')?.removeEventListener('input', checkSubdomain);