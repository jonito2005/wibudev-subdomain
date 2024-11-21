   // public/js/main.js
   document.getElementById('subdomainForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    const resultDiv = document.getElementById('result');
    
    // Disable button and show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing...
    `;

    const desiredSubdomain = event.target.desiredSubdomain.value;
    const serverIP = event.target.serverIP.value;
    const proxyStatus = event.target.proxyStatus.checked;

    fetch('/get-subdomain', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            desiredSubdomain,
            serverIP,
            proxyStatus 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            resultDiv.innerHTML = `
                <div class="glass rounded-lg p-3 sm:p-4 text-slate-700">
                    <p class="text-sm sm:text-base flex items-center">
                        <i class="fas fa-check-circle text-green-500 mr-2"></i>
                        Subdomain berhasil dibuat!
                    </p>
                    <p class="font-bold text-sm sm:text-base break-all mt-2">
                        <i class="fas fa-link mr-2"></i>${data.subdomain}
                    </p>
                    <p class="text-xs sm:text-sm mt-2 text-slate-500">
                        <i class="fas fa-server mr-2"></i>Diarahkan ke IP: ${data.serverIP}
                    </p>
                    <p class="text-xs sm:text-sm mt-1 text-slate-500">
                        <i class="fas fa-shield-alt mr-2"></i>Cloudflare Proxy: ${data.proxied ? 'Aktif' : 'Nonaktif'}
                    </p>
                    <p class="text-xs sm:text-sm mt-2 text-slate-500">
                        <i class="fas fa-key mr-2"></i>Kode Unik: ${data.uniqueCode}
                    </p>
                    <p class="text-sm sm:text-base mt-4">
                        Untuk mengelola subdomain Anda, silakan <a href="/manage-subdomain" class="text-indigo-400 underline">Login</a> menggunakan <strong>Kode Unik</strong> tersebut.
                    </p>
                    <div class="mt-4 text-xs text-slate-500">
                        <p><i class="fas fa-info-circle mr-2"></i>Simpan kode unik ini dengan aman. Kode ini diperlukan untuk mengelola subdomain Anda.</p>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="glass rounded-lg p-3 sm:p-4 text-slate-600">
                    <p class="text-sm sm:text-base flex items-center">
                        <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
                        ${data.message}
                    </p>
                </div>
            `;
        }
    })
    .catch(error => {
        resultDiv.innerHTML = `
            <div class="glass rounded-lg p-3 sm:p-4 text-slate-600 text-sm sm:text-base">
                <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                Terjadi kesalahan: ${error.message}
            </div>
        `;
    })
    .finally(() => {
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = 'Dapatkan Subdomain';
    });
});

function reportAbuse() {
    const message = encodeURIComponent("Saya ingin melaporkan penyalahgunaan.");
    const phoneNumber = "6281244863011";
    const url = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(url, '_blank');
}

document.getElementById('searchDomain')?.addEventListener('input', function(e) {
    const searchValue = e.target.value.toLowerCase();
    const domainItems = document.querySelectorAll('.domain-item');
    
    domainItems.forEach(item => {
        const domainText = item.querySelector('span').textContent.toLowerCase();
        if (domainText.includes(searchValue)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
});