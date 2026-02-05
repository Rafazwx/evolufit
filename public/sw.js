self.addEventListener('install', (e) => {
  console.log('EvoFit Service Worker Instalado');
});

self.addEventListener('fetch', (e) => {
  // Esse código vazio é necessário para o Chrome aceitar a instalação
});