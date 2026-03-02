/* ========================================
   ATLAS PRO DASHBOARD - MÓDULO PRINCIPAL
   VERSÃO CORRIGIDA - RADAR FUNCIONAL
   ======================================== */

// ===== 1. CONFIGURAÇÕES GLOBAIS =====
const APP = {
    version: '1.0.0',
    name: 'Atlas Pro',
    author: 'Zynko'
};

// Estado global da aplicação
let state = {
    currentUser: null,
    metrics: [],
    goals: [],
    settings: {
        theme: 'dark',
        notifications: {
            goals: true,
            progress: true,
            reminders: true
        }
    }
};

// Objeto para armazenar os gráficos
let charts = {
    radar: null,
    progress: null,
    history: null
};

// ===== 2. INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadState();
        await initializeApp();
        setupEventListeners();
        
        // Pequeno delay para garantir que o DOM está pronto
        setTimeout(() => {
            loadPageData();
        }, 100);
    } catch (error) {
        console.error('Erro na inicialização:', error);
        showNotification('Erro ao carregar aplicação', 'error');
    }
});

async function loadState() {
    try {
        state.currentUser = JSON.parse(localStorage.getItem('atlasUser')) || null;
        state.metrics = JSON.parse(localStorage.getItem('atlasMetrics')) || getDefaultMetrics();
        state.goals = JSON.parse(localStorage.getItem('atlasGoals')) || [];
        state.settings = JSON.parse(localStorage.getItem('atlasSettings')) || state.settings;
    } catch (error) {
        console.error('Erro ao carregar estado:', error);
        state.metrics = getDefaultMetrics();
    }
}

async function initializeApp() {
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    applyTheme(state.settings.theme);
    checkAuth();
    
    if ('serviceWorker' in navigator) {
        registerServiceWorker();
    }
}

// ===== 3. DADOS PADRÃO =====
function getDefaultMetrics() {
    return [
        { name: "Lógica Técnica", value: 75, old: 0, goal: 90, tip: "Base técnica, lógica de sistemas.", history: [] },
        { name: "Programação", value: 60, old: 0, goal: 80, tip: "Habilidade em programação, código, algoritmos.", history: [] },
        { name: "Mentalidade Criativa", value: 80, old: 0, goal: 90, tip: "Criatividade, resolução de problemas.", history: [] },
        { name: "Mentalidade de Mercado", value: 70, old: 0, goal: 85, tip: "Compreensão de mercado, oportunidades.", history: [] },
        { name: "Matemática", value: 50, old: 0, goal: 80, tip: "Matemática aplicada, lógica, algoritmos.", history: [] },
        { name: "Inglês", value: 40, old: 0, goal: 80, tip: "Inglês essencial para oportunidades internacionais.", history: [] },
        { name: "Consistência", value: 70, old: 0, goal: 90, tip: "Consistência nos estudos, prática diária.", history: [] }
    ];
}

// ===== 4. UTILITÁRIOS =====
function saveState() {
    try {
        localStorage.setItem('atlasUser', JSON.stringify(state.currentUser));
        localStorage.setItem('atlasMetrics', JSON.stringify(state.metrics));
        localStorage.setItem('atlasGoals', JSON.stringify(state.goals));
        localStorage.setItem('atlasSettings', JSON.stringify(state.settings));
        return true;
    } catch (error) {
        console.error('Erro ao salvar estado:', error);
        showNotification('Erro ao salvar dados', 'error');
        return false;
    }
}

function showNotification(message, type = 'info') {
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#00ff6a' : 
                    type === 'warning' ? '#ffaa00' :
                    type === 'error' ? '#ff4c4c' : '#00d4ff',
        color: '#000',
        padding: '12px 20px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: '9999',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        animation: 'slideIn 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== 5. ONLINE/OFFLINE =====
function updateOnlineStatus() {
    const wasOffline = document.body.classList.contains('offline');
    document.body.classList.toggle('offline', !navigator.onLine);
    
    if (!navigator.onLine && !wasOffline) {
        showNotification('Modo offline ativado', 'warning');
    } else if (navigator.onLine && wasOffline) {
        showNotification('Conexão restabelecida', 'success');
        syncOfflineData();
    }
}

async function syncOfflineData() {
    showNotification('Sincronizando dados...', 'info');
}

// ===== 6. SERVICE WORKER =====
async function registerServiceWorker() {
    try {
        const registration = await navigator.serviceWorker.register('service-worker.js');
        console.log('ServiceWorker registrado:', registration.scope);
        
        registration.addEventListener('updatefound', () => {
            showNotification('Nova versão disponível! Atualize a página.', 'info');
        });
    } catch (error) {
        console.log('Erro no ServiceWorker:', error);
    }
}

// ===== 7. AUTENTICAÇÃO =====
function checkAuth() {
    const publicPages = ['login.html', 'register.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (!publicPages.includes(currentPage) && !state.currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    
    if (state.currentUser && document.getElementById('userName')) {
        document.getElementById('userName').textContent = state.currentUser.name;
    }
    
    return true;
}

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    
    if (!email || !password) {
        showNotification('Preencha todos os campos', 'warning');
        return;
    }
    
    try {
        const users = JSON.parse(localStorage.getItem('atlasUsers')) || [];
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            state.currentUser = user;
            localStorage.setItem('atlasUser', JSON.stringify(user));
            showNotification('Login realizado com sucesso!', 'success');
            setTimeout(() => window.location.href = 'index.html', 1000);
        } else {
            showNotification('Email ou senha inválidos', 'error');
        }
    } catch (error) {
        showNotification('Erro ao fazer login', 'error');
    }
});

// Registro
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('regName')?.value;
    const email = document.getElementById('regEmail')?.value;
    const password = document.getElementById('regPassword')?.value;
    const confirm = document.getElementById('regConfirmPassword')?.value;
    
    if (!name || !email || !password || !confirm) {
        showNotification('Preencha todos os campos', 'warning');
        return;
    }
    
    if (password !== confirm) {
        showNotification('As senhas não conferem', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('A senha deve ter no mínimo 6 caracteres', 'warning');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Email inválido', 'error');
        return;
    }
    
    try {
        const users = JSON.parse(localStorage.getItem('atlasUsers')) || [];
        
        if (users.some(u => u.email === email)) {
            showNotification('Email já cadastrado', 'error');
            return;
        }
        
        const newUser = {
            id: Date.now(),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('atlasUsers', JSON.stringify(users));
        
        state.currentUser = newUser;
        localStorage.setItem('atlasUser', JSON.stringify(newUser));
        
        showNotification('Cadastro realizado com sucesso!', 'success');
        setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (error) {
        showNotification('Erro ao cadastrar', 'error');
    }
});

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function switchTab(tab) {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(btn => btn.classList.remove('active'));
    forms.forEach(form => form.classList.remove('active'));
    
    if (tab === 'login') {
        tabs[0]?.classList.add('active');
        document.getElementById('loginForm')?.classList.add('active');
    } else {
        tabs[1]?.classList.add('active');
        document.getElementById('registerForm')?.classList.add('active');
    }
}

function logout() {
    state.currentUser = null;
    localStorage.removeItem('atlasUser');
    showNotification('Logout realizado', 'info');
    window.location.href = 'login.html';
}

// ===== 8. TEMA =====
function applyTheme(theme) {
    if (!['dark', 'light'].includes(theme)) theme = 'dark';
    
    document.body.className = theme + '-mode';
    state.settings.theme = theme;
    saveState();
    
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.classList.contains(theme));
    });
    
    // Atualizar tema dos gráficos
    updateChartsTheme();
}

function setTheme(theme) {
    applyTheme(theme);
}

function toggleTheme() {
    const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    applyTheme(newTheme);
    
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
        const icon = toggle.querySelector('i');
        const text = toggle.querySelector('span');
        icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        text.textContent = newTheme === 'dark' ? 'Modo Escuro' : 'Modo Claro';
    }
}

// ===== 9. GRÁFICOS CORRIGIDOS =====
function initRadarChart() {
    const canvas = document.getElementById('radarChart');
    if (!canvas) {
        console.log('Canvas do radar não encontrado');
        return;
    }
    
    // Destruir gráfico existente
    if (charts.radar) {
        charts.radar.destroy();
        charts.radar = null;
    }
    
    // Verificar se há métricas
    if (!state.metrics || state.metrics.length === 0) {
        console.log('Sem métricas para mostrar no radar');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Configuração específica para dark/light mode
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#fff' : '#333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
    const backgroundColor = isDarkMode ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 102, 204, 0.1)';
    const borderColor = isDarkMode ? '#00d4ff' : '#0066cc';
    const pointColor = isDarkMode ? '#00ff6a' : '#00cc66';
    
    // Truncar nomes longos
    const labels = state.metrics.map(m => 
        m.name.length > 15 ? m.name.substring(0, 12) + '...' : m.name
    );
    
    charts.radar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Nível Atual',
                    data: state.metrics.map(m => m.value),
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    borderWidth: 2,
                    pointBackgroundColor: pointColor,
                    pointBorderColor: isDarkMode ? '#000' : '#fff',
                    pointHoverBackgroundColor: borderColor,
                    pointHoverBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.1
                },
                {
                    label: 'Meta',
                    data: state.metrics.map(m => m.goal),
                    backgroundColor: 'transparent',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: textColor,
                        font: {
                            size: 12,
                            family: "'Segoe UI', sans-serif"
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    titleColor: isDarkMode ? '#fff' : '#000',
                    bodyColor: isDarkMode ? '#ddd' : '#333',
                    borderColor: borderColor,
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}%`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        color: textColor,
                        backdropColor: 'transparent',
                        font: {
                            size: 10,
                            family: "'Segoe UI', sans-serif"
                        },
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: gridColor,
                        circular: true
                    },
                    angleLines: {
                        color: gridColor
                    },
                    pointLabels: {
                        color: textColor,
                        font: {
                            size: 11,
                            weight: '500',
                            family: "'Segoe UI', sans-serif"
                        },
                        padding: 5
                    }
                }
            },
            elements: {
                line: {
                    borderWidth: 2
                }
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 20,
                    left: 10,
                    right: 10
                }
            }
        }
    });
    
    console.log('Radar chart inicializado com sucesso');
}

function initProgressChart() {
    const canvas = document.getElementById('progressChart');
    if (!canvas) return;
    
    if (charts.progress) {
        charts.progress.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    const history = generateProgressHistory();
    
    charts.progress = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map(h => h.date),
            datasets: [{
                label: 'Progresso Geral',
                data: history.map(h => h.value),
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0,212,255,0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#00ff6a',
                pointBorderColor: '#000',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { 
                    display: false 
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Progresso: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { 
                        color: 'rgba(255,255,255,0.1)' 
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function generateProgressHistory() {
    const history = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        let progress = 0;
        if (state.metrics && state.metrics.length > 0) {
            progress = state.metrics.reduce((sum, m) => sum + (m.value / m.goal * 100), 0) / state.metrics.length;
        }
        
        history.push({
            date: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
            value: Math.max(0, Math.min(100, progress + (Math.random() * 5 - 2.5)))
        });
    }
    
    return history;
}

function updateChartsTheme() {
    if (charts.radar) {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const textColor = isDarkMode ? '#fff' : '#333';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
        
        charts.radar.options.scales.r.ticks.color = textColor;
        charts.radar.options.scales.r.grid.color = gridColor;
        charts.radar.options.scales.r.angleLines.color = gridColor;
        charts.radar.options.scales.r.pointLabels.color = textColor;
        charts.radar.options.plugins.legend.labels.color = textColor;
        charts.radar.update();
    }
}

function updateRadar() {
    if (charts.radar && state.metrics && state.metrics.length > 0) {
        const labels = state.metrics.map(m => 
            m.name.length > 15 ? m.name.substring(0, 12) + '...' : m.name
        );
        
        charts.radar.data.labels = labels;
        charts.radar.data.datasets[0].data = state.metrics.map(m => m.value);
        charts.radar.data.datasets[1].data = state.metrics.map(m => m.goal);
        charts.radar.update();
    }
}

// ===== 10. MÉTRICAS =====
function renderMetrics() {
    const container = document.getElementById('metricsContainer');
    if (!container) return;
    
    if (!state.metrics || state.metrics.length === 0) {
        container.innerHTML = '<div class="loading-metrics">Nenhuma métrica cadastrada. Adicione uma acima!</div>';
        return;
    }
    
    container.innerHTML = '';
    
    state.metrics.forEach((metric, index) => {
        const div = createMetricElement(metric, index);
        container.appendChild(div);
    });
    
    // Pequeno delay para garantir que os elementos foram renderizados
    setTimeout(() => {
        animateBars();
        setupTooltips();
    }, 50);
    
    updateSummaryCards();
    updateRadar();
    saveState();
}

function createMetricElement(metric, index) {
    const div = document.createElement('div');
    div.className = 'metric';
    div.setAttribute('data-tip', metric.tip || 'Sem descrição');
    
    const icon = getMetricIcon(metric.name);
    
    div.innerHTML = `
        <div class="metric-name">
            <i class="fas ${icon}"></i>
            ${escapeHtml(metric.name)}
        </div>
        <div class="bar-bg">
            <div class="bar-old" style="width:${metric.old || 0}%"></div>
            <div class="bar-fill" data-value="${metric.value}">0%</div>
        </div>
        <div class="metric-actions">
            <button onclick="editMetric(${index})" class="btn-edit">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button onclick="removeMetric(${index})" class="btn-delete">
                <i class="fas fa-trash"></i> Remover
            </button>
        </div>
        <div class="tooltip"></div>
    `;
    
    return div;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getMetricIcon(metricName) {
    const icons = {
        'Lógica Técnica': 'fa-brain',
        'Programação': 'fa-code',
        'Mentalidade Criativa': 'fa-lightbulb',
        'Mentalidade de Mercado': 'fa-chart-bar',
        'Matemática': 'fa-calculator',
        'Inglês': 'fa-language',
        'Consistência': 'fa-calendar-check'
    };
    
    return icons[metricName] || 'fa-chart-line';
}

function animateBars() {
    document.querySelectorAll('.bar-fill').forEach((bar, i) => {
        if (!state.metrics[i]) return;
        
        let current = 0;
        const value = state.metrics[i].value;
        const old = state.metrics[i].old || 0;
        
        const oldBar = bar.previousElementSibling;
        if (oldBar) oldBar.style.width = old + '%';
        
        bar.style.width = '0%';
        bar.textContent = '0%';
        
        const interval = setInterval(() => {
            if (current >= value) {
                clearInterval(interval);
                bar.textContent = value + '%';
                bar.style.width = value + '%';
            } else {
                current++;
                bar.style.width = current + '%';
                bar.textContent = current + '%';
            }
        }, 15);
    });
}

function setupTooltips() {
    document.querySelectorAll('.metric').forEach(metric => {
        const name = metric.querySelector('.metric-name');
        const tooltip = metric.querySelector('.tooltip');
        const tipText = metric.getAttribute('data-tip');
        
        if (name && tooltip) {
            name.addEventListener('mouseenter', () => {
                tooltip.textContent = tipText;
                tooltip.style.opacity = '1';
            });
            
            name.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
            });
        }
    });
}

function updateSummaryCards() {
    if (!state.metrics || !state.metrics.length) return;
    
    const totalProgress = state.metrics.reduce((sum, m) => 
        sum + ((m.value / m.goal) * 100), 0) / state.metrics.length;
    
    const goalsAchieved = state.metrics.filter(m => m.value >= m.goal).length;
    
    const bestMetric = state.metrics.reduce((best, current) => 
        ((current.value / current.goal) > (best.value / best.goal)) ? current : best
    );
    
    const generalProgressEl = document.getElementById('generalProgress');
    const goalsAchievedEl = document.getElementById('goalsAchieved');
    const bestMetricEl = document.getElementById('bestMetric');
    
    if (generalProgressEl) generalProgressEl.textContent = totalProgress.toFixed(1) + '%';
    if (goalsAchievedEl) goalsAchievedEl.textContent = `${goalsAchieved}/${state.metrics.length}`;
    if (bestMetricEl) bestMetricEl.textContent = bestMetric.name;
}

// ===== 11. CRUD DE MÉTRICAS =====
function addMetric() {
    const nameInput = document.getElementById('newMetricName');
    const valueInput = document.getElementById('newMetricValue');
    const goalInput = document.getElementById('newMetricGoal');
    
    const name = nameInput?.value.trim();
    const value = parseInt(valueInput?.value);
    const goal = parseInt(goalInput?.value);
    
    if (!validateMetric(name, value, goal)) return;
    
    state.metrics.push({
        name: name,
        value: Math.min(Math.max(value, 0), 100),
        old: 0,
        goal: Math.min(Math.max(goal, 0), 100),
        tip: "Nova métrica",
        history: [],
        createdAt: new Date().toISOString()
    });
    
    nameInput.value = '';
    valueInput.value = '';
    goalInput.value = '';
    
    renderMetrics();
    showNotification('Métrica adicionada com sucesso!', 'success');
}

function validateMetric(name, value, goal) {
    if (!name) {
        showNotification('Digite um nome para a métrica', 'warning');
        return false;
    }
    
    if (isNaN(value) || value < 0 || value > 100) {
        showNotification('Valor deve ser entre 0 e 100', 'warning');
        return false;
    }
    
    if (isNaN(goal) || goal < 0 || goal > 100) {
        showNotification('Meta deve ser entre 0 e 100', 'warning');
        return false;
    }
    
    return true;
}

function editMetric(index) {
    if (!state.metrics[index]) return;
    
    const metric = state.metrics[index];
    
    const newValue = prompt(`Valor atual para "${metric.name}" (0-100):`, metric.value);
    if (newValue === null) return;
    
    const newGoal = prompt(`Meta para "${metric.name}" (0-100):`, metric.goal);
    if (newGoal === null) return;
    
    const parsedValue = parseInt(newValue);
    const parsedGoal = parseInt(newGoal);
    
    if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 100) {
        showNotification('Valor inválido', 'error');
        return;
    }
    
    if (isNaN(parsedGoal) || parsedGoal < 0 || parsedGoal > 100) {
        showNotification('Meta inválida', 'error');
        return;
    }
    
    metric.old = metric.value;
    metric.value = parsedValue;
    metric.goal = parsedGoal;
    
    renderMetrics();
    showNotification('Métrica atualizada!', 'success');
}

function removeMetric(index) {
    if (!state.metrics[index]) return;
    
    if (confirm(`Remover métrica "${state.metrics[index].name}"?`)) {
        state.metrics.splice(index, 1);
        renderMetrics();
        showNotification('Métrica removida', 'info');
    }
}

// ===== 12. METAS =====
function loadGoals() {
    const grid = document.getElementById('goalsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (!state.goals || !state.goals.length) {
        grid.innerHTML = '<p class="no-data">Nenhuma meta cadastrada</p>';
        return;
    }
    
    state.goals.forEach((goal, index) => {
        const card = createGoalCard(goal, index);
        grid.appendChild(card);
    });
}

function createGoalCard(goal, index) {
    const progress = (goal.current / goal.target) * 100;
    const completed = progress >= 100;
    const deadline = new Date(goal.deadline);
    const today = new Date();
    const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    
    const card = document.createElement('div');
    card.className = `goal-card ${completed ? 'completed' : ''}`;
    
    card.innerHTML = `
        <h3>${escapeHtml(goal.name)}</h3>
        <p class="goal-deadline">
            <i class="fas fa-calendar"></i>
            ${daysLeft > 0 ? `${daysLeft} dias restantes` : 'Prazo expirado'}
        </p>
        <div class="goal-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
            </div>
            <p>${goal.current}/${goal.target} (${progress.toFixed(1)}%)</p>
        </div>
        <div class="metric-actions">
            <button onclick="updateGoalProgress(${index})" class="btn-edit">
                <i class="fas fa-plus"></i> Atualizar
            </button>
            <button onclick="deleteGoal(${index})" class="btn-delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return card;
}

function addGoal() {
    const nameInput = document.getElementById('newGoalName');
    const targetInput = document.getElementById('newGoalTarget');
    const deadlineInput = document.getElementById('newGoalDeadline');
    
    const name = nameInput?.value.trim();
    const target = parseInt(targetInput?.value);
    const deadline = deadlineInput?.value;
    
    if (!name) {
        showNotification('Digite um nome para a meta', 'warning');
        return;
    }
    
    if (isNaN(target) || target <= 0) {
        showNotification('Digite uma meta válida', 'warning');
        return;
    }
    
    if (!deadline) {
        showNotification('Selecione uma data limite', 'warning');
        return;
    }
    
    state.goals.push({
        name,
        target,
        current: 0,
        deadline,
        createdAt: new Date().toISOString(),
        history: []
    });
    
    nameInput.value = '';
    targetInput.value = '';
    deadlineInput.value = '';
    
    saveState();
    loadGoals();
    showNotification('Meta adicionada!', 'success');
}

function updateGoalProgress(index) {
    const goal = state.goals[index];
    if (!goal) return;
    
    const increment = prompt(`Quanto deseja adicionar ao progresso de "${goal.name}"?`, '10');
    if (increment === null) return;
    
    const value = parseInt(increment);
    if (isNaN(value) || value <= 0) {
        showNotification('Valor inválido', 'error');
        return;
    }
    
    goal.current = Math.min(goal.current + value, goal.target);
    
    if (!goal.history) goal.history = [];
    goal.history.push({
        date: new Date().toISOString(),
        value: goal.current
    });
    
    saveState();
    loadGoals();
    showNotification('Progresso atualizado!', 'success');
    
    if (goal.current >= goal.target) {
        showNotification(`🎉 Parabéns! Meta "${goal.name}" concluída!`, 'success');
    }
}

function deleteGoal(index) {
    if (confirm('Remover esta meta?')) {
        state.goals.splice(index, 1);
        saveState();
        loadGoals();
        showNotification('Meta removida', 'info');
    }
}

// ===== 13. CONFIGURAÇÕES =====
function loadSettings() {
    const notifGoals = document.getElementById('notifGoals');
    const notifProgress = document.getElementById('notifProgress');
    const notifReminders = document.getElementById('notifReminders');
    
    if (notifGoals) notifGoals.checked = state.settings.notifications?.goals ?? true;
    if (notifProgress) notifProgress.checked = state.settings.notifications?.progress ?? true;
    if (notifReminders) notifReminders.checked = state.settings.notifications?.reminders ?? true;
    
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.classList.contains(state.settings.theme));
    });
}

function saveSettings() {
    const notifGoals = document.getElementById('notifGoals')?.checked;
    const notifProgress = document.getElementById('notifProgress')?.checked;
    const notifReminders = document.getElementById('notifReminders')?.checked;
    
    state.settings.notifications = {
        goals: notifGoals ?? true,
        progress: notifProgress ?? true,
        reminders: notifReminders ?? true
    };
    
    saveState();
    showNotification('Configurações salvas!', 'success');
}

// ===== 14. EXPORT/IMPORT =====
function exportData() {
    const data = {
        version: APP.version,
        exportDate: new Date().toISOString(),
        user: state.currentUser?.email || 'anonymous',
        metrics: state.metrics,
        goals: state.goals,
        settings: state.settings
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('Dados exportados!', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (!data.metrics && !data.goals) {
                    throw new Error('Arquivo inválido');
                }
                
                if (data.metrics) state.metrics = data.metrics;
                if (data.goals) state.goals = data.goals;
                if (data.settings) state.settings = { ...state.settings, ...data.settings };
                
                saveState();
                showNotification('Dados importados! Recarregando...', 'success');
                setTimeout(() => location.reload(), 1500);
            } catch (error) {
                showNotification('Arquivo inválido', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function clearData() {
    if (confirm('⚠️ TEM CERTEZA?\nIsso apagará TODOS os dados permanentemente!')) {
        if (prompt('Digite "CONFIRMAR" para prosseguir:') === 'CONFIRMAR') {
            localStorage.clear();
            showNotification('Dados apagados!', 'warning');
            setTimeout(() => window.location.href = 'login.html', 1500);
        }
    }
}

// ===== 15. CARREGAR DADOS DA PÁGINA =====
function loadPageData() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    
    switch(page) {
        case 'index.html':
            if (state.metrics && state.metrics.length > 0) {
                renderMetrics();
                initRadarChart();
                initProgressChart();
            } else {
                const container = document.getElementById('metricsContainer');
                if (container) {
                    container.innerHTML = '<div class="loading-metrics">Nenhuma métrica cadastrada. Adicione uma acima!</div>';
                }
            }
            break;
            
        case 'metrics.html':
            if (state.metrics && state.metrics.length) {
                loadMetricsTable();
            }
            break;
            
        case 'goals.html':
            loadGoals();
            break;
            
        case 'settings.html':
            loadSettings();
            break;
    }
}

function loadMetricsTable() {
    const tbody = document.getElementById('metricsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    state.metrics.forEach((metric, index) => {
        const row = document.createElement('tr');
        const progress = (metric.value / metric.goal * 100).toFixed(1);
        
        row.innerHTML = `
            <td>${escapeHtml(metric.name)}</td>
            <td>${metric.value}%</td>
            <td>${metric.goal}%</td>
            <td>
                <div class="progress-bar" style="width: 100px;">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                ${progress}%
            </td>
            <td>${new Date().toLocaleDateString()}</td>
            <td>
                <button onclick="editMetric(${index})" class="btn-edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="removeMetric(${index})" class="btn-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// ===== 16. EVENT LISTENERS =====
function setupEventListeners() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    document.querySelectorAll('#notifGoals, #notifProgress, #notifReminders').forEach(input => {
        if (input) {
            input.addEventListener('change', saveSettings);
        }
    });
}

// ===== 17. EXPORTAR FUNÇÕES GLOBAIS =====
window.state = state;
window.addMetric = addMetric;
window.editMetric = editMetric;
window.removeMetric = removeMetric;
window.addGoal = addGoal;
window.updateGoalProgress = updateGoalProgress;
window.deleteGoal = deleteGoal;
window.switchTab = switchTab;
window.setTheme = setTheme;
window.toggleTheme = toggleTheme;
window.exportData = exportData;
window.importData = importData;
window.clearData = clearData;
window.logout = logout;
window.saveSettings = saveSettings;

// ===== 18. ANIMAÇÕES CSS =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .btn-edit, .btn-delete {
        padding: 8px 12px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }
    
    .btn-edit { 
        background: #00d4ff; 
        color: #000; 
    }
    
    .btn-delete { 
        background: #ff4c4c; 
        color: #fff; 
    }
    
    .btn-edit:hover, .btn-delete:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    
    .no-data {
        text-align: center;
        padding: 40px;
        opacity: 0.5;
        font-style: italic;
    }
    
    .notification {
        animation: slideIn 0.3s ease;
    }
`;

document.head.appendChild(style);

// Detectar botão voltar do Android (para PWA)
document.addEventListener('backbutton', function() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        if (confirm('Deseja sair do Atlas Pro?')) {
            if (navigator.app && navigator.app.exitApp) {
                navigator.app.exitApp();
            } else {
                window.close();
            }
        }
    }
}, false);
