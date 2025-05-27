const apiUrl = 'http://localhost:3000';

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        const res = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await res.json();
        alert(result.message);
    });
}

// Cadastro de doações
const doacaoForm = document.getElementById('doacaoForm');
if (doacaoForm) {
    doacaoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(doacaoForm);

        const res = await fetch(`${apiUrl}/doacoes`, {
            method: 'POST',
            body: formData,
        });

        const result = await res.json();
        alert(result.message);
        loadDoacoes();
    });
}

// Carregar doações
async function loadDoacoes() {
    const res = await fetch(`${apiUrl}/doacoes`);
    const doacoes = await res.json();
    const lista = document.getElementById('listaDoacoes');
    if (lista) {
        lista.innerHTML = '';
        doacoes.forEach((item) => {
            const div = document.createElement('div');
            div.innerHTML = `
                <img src="${apiUrl}/uploads/${item.imagem}" alt="${item.descricao}" style="width: 100%; height: auto;"/>
                <h4>${item.categoria}</h4>
                <p><strong>Estado:</strong> ${item.estado}</p>
                <p><strong>Alimentício:</strong> ${item.alimenticio}</p>
                <p>${item.descricao}</p>
            `;
            lista.appendChild(div);
        });
    }
}

if (document.getElementById('listaDoacoes')) {
    loadDoacoes();
}

const cadastroForm = document.getElementById('cadastroForm');
if (cadastroForm) {
  cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(cadastroForm);
    const data = Object.fromEntries(formData.entries());
    
    const res = await fetch(`${apiUrl}/auth/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    alert(result.message);
    if (res.ok) {
      window.location.href = 'login.html';
    }
  });
}

// No evento de submit do login
if (res.ok) {
  // Supondo que o servidor retorne os dados do usuário em 'result.user'
  localStorage.setItem('usuarioLogado', JSON.stringify(result.user));
  alert('Login bem-sucedido');
  window.location.href = 'doacoes.html';
} else {
  alert(result.message);
}

const loginData = {
  username: "João Silva",
  password: "123456"
};

fetch('http://localhost:3000/api/login', {
  method: 'POST',
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(loginData)
})
.then(res => res.json())
.then(json => {
  if(json.token) {
    // salvar token para autenticação futura
    localStorage.setItem('token', json.token);
    alert('Login realizado com sucesso!');
  } else {
    alert('Falha no login: ' + json.message);
  }
})
.catch(err => {
  alert('Erro na requisição: ' + err.message);
});
