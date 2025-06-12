// frontend/scripts.js

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5500';

// Função para decodificar JWT (simples, para uso no frontend)
function decodeJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Erro ao decodificar JWT:", e);
        return null;
    }
}

let currentUser = null; // Variável global para armazenar informações do usuário logado

// Função para verificar o status de login e o tipo de usuário
async function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const logoutLink = document.getElementById('logoutLink');
    const doacoesLink = document.getElementById('doacoesLink'); // Link para cadastrar doações
    const postDoacoesLink = document.getElementById('postDoacoesLink'); // Link para listar doações (sempre visível)

    if (token) {
        currentUser = decodeJwt(token);
        if (currentUser) {
            console.log('Usuário logado:', currentUser);
            if (loginLink) loginLink.style.display = 'none';
            if (registerLink) registerLink.style.display = 'none';
            if (logoutLink) logoutLink.style.display = 'inline-block';

            // Mostra o link de cadastro de doação para QUALQUER usuário logado
            if (doacoesLink) {
                doacoesLink.style.display = 'inline-block'; // Agora aparece para 'ong' e 'pessoa'
            }
        } else {
            localStorage.removeItem('token');
            if (loginLink) loginLink.style.display = 'inline-block';
            if (registerLink) registerLink.style.display = 'inline-block';
            if (logoutLink) logoutLink.style.display = 'none';
            if (doacoesLink) doacoesLink.style.display = 'none';
        }
    } else {
        if (loginLink) loginLink.style.display = 'inline-block';
        if (registerLink) registerLink.style.display = 'inline-block';
        if (logoutLink) logoutLink.style.display = 'none';
        if (doacoesLink) doacoesLink.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', checkLoginStatus);

const logoutButton = document.getElementById('logoutLink');
if (logoutButton) {
    logoutButton.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        alert('Você foi desconectado.');
        window.location.href = '/';
    });
}

const categoriaSelect = document.getElementById('categoria');
const descricaoContainer = document.getElementById('descricaoContainer');
if (categoriaSelect && descricaoContainer) {
    categoriaSelect.addEventListener('change', function() {
        if (this.value === 'outro') {
            descricaoContainer.style.display = 'block';
        } else {
            descricaoContainer.style.display = 'none';
            document.getElementById('descricaoPersonalizada').value = '';
        }
    });
}

const doacaoForm = document.getElementById('doacaoForm');
if (doacaoForm) {
    doacaoForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);

        let categoria = formData.get('categoria');
        if (categoria === 'outro') {
            categoria = formData.get('descricaoPersonalizada');
        }
        formData.set('categoria', categoria);

        if (formData.get('categoria') !== 'outro') {
            formData.delete('descricaoPersonalizada');
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Você precisa estar logado para cadastrar uma doação.');
            return;
        }

        const res = await fetch(`${apiUrl}/doacoes`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await res.json();
        alert(result.message);
        if (res.ok) {
            this.reset();
            window.location.href = 'postdoacoes.html';
        }
    });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const tipo = document.getElementById('tipo').value;

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, senha, tipo })
            });

            const result = await res.json();

            if (res.ok) {
                localStorage.setItem('token', result.token);
                alert(result.message);
                window.location.href = 'postdoacoes.html';
            } else {
                alert(result.message || 'Erro ao fazer login.');
            }
        } catch (error) {
            console.error('Erro na requisição de login:', error);
            alert('Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.');
        }
    });
}

const cadastroForm = document.getElementById('cadastroForm');
if (cadastroForm) {
    cadastroForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nome = this.elements.nome.value;
        const email = this.elements.email.value;
        const senha = this.elements.senha.value;
        const tipo = this.elements.tipo.value;

        try {
            const res = await fetch(`${API_BASE_URL}/auth/cadastro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome, email, senha, tipo })
            });

            const result = await res.json();
            alert(result.message);

            if (res.ok) {
                this.reset();
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Erro na requisição de cadastro:', error);
            alert('Ocorreu um erro ao tentar realizar o cadastro. Tente novamente mais tarde.');
        }
    });
}


// Função para carregar e exibir as doações
async function loadDoacoes() {
    const res = await fetch(`${API_BASE_URL}/doacoes`);
    const doacoes = await res.json();
    const lista = document.getElementById('listarDoacoes');

    if (lista) {
        lista.innerHTML = '';

        if (doacoes.length === 0) {
            lista.innerHTML = '<p>Nenhuma doação disponível no momento.</p>';
        } else {
            doacoes.forEach((item) => {
                const div = document.createElement('div');
                div.classList.add('doacao-item');

                let buttonHtml = '';
                let removeButtonHtml = '';
                let statusHtml = '';

                if (item.id_ong_reservou !== null) {
                    statusHtml = `<span class="reservado-badge">Reservado</span>`;
                }

                // Lógica para o BOTÃO "RESERVAR DOAÇÃO"
                if (currentUser && item.id_ong !== currentUser.id) {
                    if (item.id_ong_reservou === null) {
                        buttonHtml = `<button onclick="reservarDoacao(${item.id})" class="reservar-doacao-btn">Reservar Doação</button>`;
                    } else if (item.id_ong_reservou === currentUser.id) {
                        buttonHtml = `<button disabled class="reservada-por-voce-btn">Reservada por você</button>`;
                    } else {
                        buttonHtml = `<button disabled class="reservada-btn">Reservada</button>`;
                    }
                }

                // Lógica para o BOTÃO "REMOVER DOAÇÃO"
                if (currentUser && item.id_ong === currentUser.id) {
                    removeButtonHtml = `<button onclick="removeDoacao(${item.id})" class="remove-doacao-btn">Remover Doação</button>`;
                }


                div.innerHTML = `
                    <img src="${apiUrl}/uploads/${item.imagem}" alt="${item.descricao}" />
                    ${statusHtml}
                    <h2>${item.descricao}</h2> <h4>${item.categoria}</h4> <p><strong>Estado:</strong> ${item.estado}</p>
                    <p><strong>Alimentício:</strong> ${item.alimenticio === 'sim' ? 'Sim' : 'Não'}</p>
                    <div class="doacao-buttons"> ${buttonHtml}
                        ${removeButtonHtml}
                    </div>
                `;
                lista.appendChild(div);
            });
        }
    }
}

async function reservarDoacao(idDoacao) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado para reservar uma doação.');
        return;
    }

    const confirmacao = confirm('Tem certeza que deseja reservar esta doação?');
    if (!confirmacao) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/doacoes/${idDoacao}/reservar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await res.json();
        alert(result.message);
        if (res.ok) {
            loadDoacoes();
        }
    } catch (error) {
        console.error('Erro ao reservar doação:', error);
        alert('Ocorreu um erro ao tentar reservar a doação.');
    }
}

async function removeDoacao(idDoacao) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado para remover uma doação.');
        return;
    }

    const confirmacao = confirm('Tem certeza que deseja remover esta doação? Esta ação é irreversível.');
    if (!confirmacao) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/doacoes/${idDoacao}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await res.json();
        alert(result.message);
        if (res.ok) {
            loadDoacoes();
        }
    } catch (error) {
        console.error('Erro ao remover doação:', error);
        alert('Ocorreu um erro ao tentar remover a doação.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('listarDoacoes')) {
        loadDoacoes();
    }
});

