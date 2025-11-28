// Configurações e Estado da Aplicação
const AppState = {
    fontSize: 16,
    theme: 'light',
    font: 'open-sans',
    lineSpacing: 'normal',
    animations: true,
    readingMode: false,
    readingMask: false,
    textToSpeech: false,
    currentSpeech: null
};

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupIntersectionObserver();
    setupPanelScrollDetection();
});

// Inicializar aplicação
function initializeApp() {
    loadSavedSettings();
    updateUIFromState();
    setupTextToSpeech();
}

// Configurar ouvintes de evento
function setupEventListeners() {
    // Painel de Acessibilidade
    setupAccessibilityPanel();
    
    // Navegação
    setupMobileMenu();
    setupSmoothScrolling();
    setupBackToTop();
    
    // Funcionalidades de Acesso
    setupTextOnlyMode();
    setupPrintPage();
    
    // Leitura em voz alta
    setupReadAloudButtons();
}

// ===== PAINEL DE ACESSIBILIDADE MELHORADO =====
function setupAccessibilityPanel() {
    const panel = document.getElementById('accessibility-panel');
    const toggle = document.getElementById('accessibility-toggle');
    const decreaseFont = document.getElementById('decrease-font');
    const increaseFont = document.getElementById('increase-font');
    const themeSelector = document.getElementById('theme-selector');
    const fontSelector = document.getElementById('font-selector');
    const lineSpacing = document.getElementById('line-spacing');
    const animationToggle = document.getElementById('animation-toggle');
    const readingMode = document.getElementById('reading-mode');
    const readingMask = document.getElementById('reading-mask');
    const textToSpeech = document.getElementById('text-to-speech');
    const resetSettings = document.getElementById('reset-settings');

    // Alternar painel
    toggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Impedir que o evento se propague
        const isExpanded = panel.classList.toggle('expanded');
        toggle.setAttribute('aria-expanded', isExpanded);
        
        if (isExpanded) {
            announceToScreenReader('Painel de acessibilidade aberto. Use a rolagem para ver todas as opções.');
        } else {
            announceToScreenReader('Painel de acessibilidade fechado');
        }
    });

    // Fechar painel ao clicar fora
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !toggle.contains(e.target)) {
            panel.classList.remove('expanded');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });

    // Impedir que cliques dentro do painel fechem ele
    panel.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Controles de fonte
    decreaseFont.addEventListener('click', () => changeFontSize(-2));
    increaseFont.addEventListener('click', () => changeFontSize(2));

    // Seletores
    themeSelector.addEventListener('change', (e) => {
        AppState.theme = e.target.value;
        updateUIFromState();
        saveSettings();
        announceToScreenReader(`Tema alterado para ${e.target.options[e.target.selectedIndex].text}`);
    });

    fontSelector.addEventListener('change', (e) => {
        AppState.font = e.target.value;
        updateUIFromState();
        saveSettings();
        announceToScreenReader(`Fonte alterada para ${e.target.options[e.target.selectedIndex].text}`);
    });

    lineSpacing.addEventListener('change', (e) => {
        AppState.lineSpacing = e.target.value;
        updateUIFromState();
        saveSettings();
        announceToScreenReader(`Espaçamento alterado para ${e.target.options[e.target.selectedIndex].text}`);
    });

    // Botões de alternância
    setupToggleButton(animationToggle, 'animations', 'Animações', 'animations');
    setupToggleButton(readingMode, 'readingMode', 'Modo de leitura', 'readingMode');
    setupToggleButton(readingMask, 'readingMask', 'Máscara de leitura', 'readingMask');
    setupToggleButton(textToSpeech, 'textToSpeech', 'Leitura em voz alta', 'textToSpeech');

    // Redefinir configurações
    resetSettings.addEventListener('click', resetAllSettings);

    // Adicionar atalho de teclado para fechar o painel (ESC)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('expanded')) {
            panel.classList.remove('expanded');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.focus(); // Devolver foco para o botão toggle
            announceToScreenReader('Painel de acessibilidade fechado');
        }
    });
}

// ===== DETECÇÃO DE ROLAGEM NO PAINEL =====
function setupPanelScrollDetection() {
    const optionsContainer = document.querySelector('.accessibility-options');
    
    if (optionsContainer) {
        optionsContainer.addEventListener('scroll', () => {
            const scrollTop = optionsContainer.scrollTop;
            const scrollHeight = optionsContainer.scrollHeight;
            const clientHeight = optionsContainer.clientHeight;
            
            // Remover todas as classes primeiro
            optionsContainer.classList.remove('scroll-top', 'scroll-middle', 'scroll-bottom');
            
            // Adicionar classe baseada na posição de rolagem
            if (scrollTop === 0) {
                optionsContainer.classList.add('scroll-top');
            } else if (scrollTop + clientHeight >= scrollHeight - 5) {
                optionsContainer.classList.add('scroll-bottom');
            } else {
                optionsContainer.classList.add('scroll-middle');
            }
        });
        
        // Disparar evento de scroll inicial para definir estado correto
        setTimeout(() => {
            optionsContainer.dispatchEvent(new Event('scroll'));
        }, 100);
    }
}

// Configurar botão de alternância
function setupToggleButton(button, stateKey, label, saveKey = null) {
    button.addEventListener('click', () => {
        const isPressed = button.getAttribute('aria-pressed') === 'true';
        const newState = !isPressed;
        
        button.setAttribute('aria-pressed', newState);
        button.querySelector('.toggle-state').textContent = newState ? 'Desativar' : 'Ativar';
        AppState[stateKey] = newState;
        
        if (saveKey) {
            saveSettings();
        }
        
        updateUIFromState();
        announceToScreenReader(`${label} ${newState ? 'ativado' : 'desativado'}`);
        
        // Ações específicas
        if (stateKey === 'readingMask') {
            toggleReadingMask(newState);
        } else if (stateKey === 'textToSpeech') {
            toggleTextToSpeech(newState);
        }
    });
}

// Alterar tamanho da fonte
function changeFontSize(change) {
    const newSize = Math.max(12, Math.min(24, AppState.fontSize + change));
    
    if (newSize !== AppState.fontSize) {
        AppState.fontSize = newSize;
        updateUIFromState();
        saveSettings();
        
        const percentage = Math.round((newSize / 16) * 100);
        document.getElementById('current-font-size').textContent = `${percentage}%`;
        announceToScreenReader(`Tamanho da fonte alterado para ${percentage} por cento`);
    }
}

// ===== CONFIGURAÇÕES E PERSISTÊNCIA =====
function loadSavedSettings() {
    const saved = JSON.parse(localStorage.getItem('accessibilitySettings') || '{}');
    
    Object.keys(saved).forEach(key => {
        if (AppState.hasOwnProperty(key)) {
            AppState[key] = saved[key];
        }
    });
}

function saveSettings() {
    localStorage.setItem('accessibilitySettings', JSON.stringify(AppState));
}

function resetAllSettings() {
    // Redefinir estado
    AppState.fontSize = 16;
    AppState.theme = 'light';
    AppState.font = 'open-sans';
    AppState.lineSpacing = 'normal';
    AppState.animations = true;
    AppState.readingMode = false;
    AppState.readingMask = false;
    AppState.textToSpeech = false;
    
    // Parar leitura em voz alta se estiver ativa
    if (AppState.currentSpeech) {
        window.speechSynthesis.cancel();
        AppState.currentSpeech = null;
    }
    
    // Atualizar UI
    updateUIFromState();
    
    // Limpar armazenamento local
    localStorage.removeItem('accessibilitySettings');
    
    // Redefinir controles
    document.getElementById('current-font-size').textContent = '100%';
    document.getElementById('theme-selector').value = 'light';
    document.getElementById('font-selector').value = 'open-sans';
    document.getElementById('line-spacing').value = 'normal';
    
    // Redefinir botões de alternância
    document.querySelectorAll('.toggle-button').forEach(button => {
        button.setAttribute('aria-pressed', 'false');
        button.querySelector('.toggle-state').textContent = 'Ativar';
    });
    
    // Fechar painel
    document.getElementById('accessibility-panel').classList.remove('expanded');
    
    showNotification('Configurações redefinidas com sucesso!', 'success');
    announceToScreenReader('Todas as configurações foram redefinidas');
}

// Atualizar UI baseado no estado
function updateUIFromState() {
    // Tamanho da fonte
    document.documentElement.style.fontSize = `${AppState.fontSize}px`;
    
    // Tema
    document.documentElement.setAttribute('data-theme', AppState.theme);
    
    // Fonte
    document.body.setAttribute('data-font', AppState.font);
    
    // Espaçamento
    document.body.setAttribute('data-line-spacing', AppState.lineSpacing);
    
    // Animações
    document.documentElement.setAttribute('data-animations', AppState.animations ? 'enabled' : 'disabled');
    
    // Modo de leitura
    document.body.classList.toggle('reading-mode', AppState.readingMode);
    
    // Atualizar botões de alternância
    updateToggleButton('animation-toggle', AppState.animations);
    updateToggleButton('reading-mode', AppState.readingMode);
    updateToggleButton('reading-mask', AppState.readingMask);
    updateToggleButton('text-to-speech', AppState.textToSpeech);
}

function updateToggleButton(buttonId, state) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.setAttribute('aria-pressed', state);
        button.querySelector('.toggle-state').textContent = state ? 'Desativar' : 'Ativar';
    }
}

// ===== NAVEGAÇÃO MÓVEL =====
function setupMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('main-menu');

    menuToggle.addEventListener('click', () => {
        const isExpanded = navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
        menuToggle.setAttribute('aria-expanded', isExpanded);
        
        announceToScreenReader(`Menu ${isExpanded ? 'aberto' : 'fechado'}`);
    });

    // Fechar menu ao clicar em links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// ===== ROLAGEM SUAVE =====
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                
                const headerHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Atualizar URL
                history.pushState(null, null, href);
                
                // Focar no elemento alvo para acessibilidade
                target.setAttribute('tabindex', '-1');
                target.focus();
                
                announceToScreenReader(`Navegado para ${target.querySelector('h2')?.textContent || 'seção'}`);
            }
        });
    });
}

// ===== BOTÃO VOLTAR AO TOPO =====
function setupBackToTop() {
    const backToTop = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Focar no conteúdo principal para acessibilidade
        document.getElementById('main-content').focus();
        
        announceToScreenReader('Voltado ao topo da página');
    });
}

// ===== MÁSCARA DE LEITURA =====
function toggleReadingMask(active) {
    const mask = document.getElementById('reading-mask-overlay');
    
    if (active) {
        mask.classList.add('active');
        document.body.style.cursor = 'none';
        
        // Seguir o mouse
        document.addEventListener('mousemove', updateReadingMaskPosition);
    } else {
        mask.classList.remove('active');
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', updateReadingMaskPosition);
    }
}

function updateReadingMaskPosition(e) {
    const mask = document.getElementById('reading-mask-overlay');
    mask.style.backgroundPosition = `0px ${e.clientY - 50}px`;
}

// ===== LEITURA EM VOZ ALTA =====
function setupTextToSpeech() {
    // Verificar suporte
    if (!('speechSynthesis' in window)) {
        document.getElementById('text-to-speech').disabled = true;
        document.getElementById('text-to-speech').title = 'Leitura em voz alta não suportada neste navegador';
        return;
    }
    
    // Configurar voz em português se disponível
    const voices = window.speechSynthesis.getVoices();
    const portugueseVoice = voices.find(voice => 
        voice.lang.startsWith('pt') || voice.lang.includes('pt')
    );
    
    if (portugueseVoice) {
        window.preferredVoice = portugueseVoice;
    }
}

function toggleTextToSpeech(active) {
    if (active) {
        // Iniciar leitura da seção atual
        const currentSection = getCurrentSection();
        if (currentSection) {
            readSectionAloud(currentSection);
        }
    } else {
        // Parar leitura
        if (AppState.currentSpeech) {
            window.speechSynthesis.cancel();
            AppState.currentSpeech = null;
        }
    }
}

function setupReadAloudButtons() {
    // Botão de introdução
    document.getElementById('play-intro')?.addEventListener('click', () => {
        const heroSection = document.querySelector('.hero-section');
        readSectionAloud(heroSection);
    });
    
    // Botões de seção
    document.querySelectorAll('.section-read-aloud').forEach(button => {
        button.addEventListener('click', () => {
            const section = button.closest('.content-section');
            readSectionAloud(section);
        });
    });
}

function readSectionAloud(section) {
    if (!AppState.textToSpeech) return;
    
    // Parar leitura atual
    if (AppState.currentSpeech) {
        window.speechSynthesis.cancel();
    }
    
    // Extrair texto da seção
    const text = extractReadableText(section);
    
    if (!text) return;
    
    // Criar utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Usar voz preferida se disponível
    if (window.preferredVoice) {
        utterance.voice = window.preferredVoice;
    }
    
    // Eventos
    utterance.onstart = () => {
        AppState.currentSpeech = utterance;
        section.classList.add('reading-aloud');
        announceToScreenReader('Iniciando leitura em voz alta');
    };
    
    utterance.onend = () => {
        AppState.currentSpeech = null;
        section.classList.remove('reading-aloud');
        announceToScreenReader('Leitura em voz alta concluída');
    };
    
    utterance.onerror = (event) => {
        console.error('Erro na leitura em voz alta:', event);
        AppState.currentSpeech = null;
        section.classList.remove('reading-aloud');
        showNotification('Erro na leitura em voz alta', 'error');
    };
    
    // Iniciar leitura
    window.speechSynthesis.speak(utterance);
}

function extractReadableText(element) {
    // Clonar elemento para não modificar o original
    const clone = element.cloneNode(true);
    
    // Remover elementos não relevantes
    clone.querySelectorAll('.section-actions, .sr-only, [aria-hidden="true"]').forEach(el => el.remove());
    
    // Extrair texto
    return clone.textContent.replace(/\s+/g, ' ').trim();
}

function getCurrentSection() {
    const sections = document.querySelectorAll('.content-section');
    const headerHeight = document.querySelector('.navbar').offsetHeight;
    
    for (let section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= headerHeight + 100 && rect.bottom >= headerHeight + 100) {
            return section;
        }
    }
    
    return sections[0]; // Fallback para primeira seção
}

// ===== FUNCIONALIDADES ADICIONAIS =====
function setupTextOnlyMode() {
    document.getElementById('text-only')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.toggle('text-only-mode');
        
        const isActive = document.body.classList.contains('text-only-mode');
        showNotification(
            `Modo texto ${isActive ? 'ativado' : 'desativado'}`,
            isActive ? 'info' : 'success'
        );
        
        announceToScreenReader(`Modo texto ${isActive ? 'ativado' : 'desativado'}`);
    });
}

function setupPrintPage() {
    document.getElementById('print-page')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.print();
    });
}

// ===== OBSERVADOR DE INTERSEÇÃO (para animações) =====
function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observar elementos para animação
    document.querySelectorAll('.condition-card, .grid-item, .resource-item').forEach(el => {
        observer.observe(el);
    });
}

// ===== NOTIFICAÇÕES E FEEDBACK =====
function showNotification(message, type = 'info') {
    // Remover notificação existente
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        if (announcement.parentNode) {
            announcement.parentNode.removeChild(announcement);
        }
    }, 1000);
}

// ===== ATALHOS DE TECLADO =====
document.addEventListener('keydown', (e) => {
    // Alt + 1: Conteúdo principal
    if (e.altKey && e.key === '1') {
        e.preventDefault();
        document.getElementById('main-content').focus();
        announceToScreenReader('Navegado para o conteúdo principal');
    }
    
    // Alt + 2: Navegação
    if (e.altKey && e.key === '2') {
        e.preventDefault();
        document.querySelector('.navbar').focus();
        announceToScreenReader('Navegado para o menu principal');
    }
    
    // Alt + A: Painel de acessibilidade
    if (e.altKey && e.key === 'a') {
        e.preventDefault();
        document.getElementById('accessibility-toggle').click();
    }
    
    // Alt + S: Parar leitura em voz alta
    if (e.altKey && e.key === 's') {
        e.preventDefault();
        if (AppState.currentSpeech) {
            window.speechSynthesis.cancel();
            announceToScreenReader('Leitura em voz alta interrompida');
        }
    }
});

// ===== MELHORIAS DE ACESSIBILIDADE =====
// Melhorar foco para elementos interativos
document.addEventListener('focusin', (e) => {
    if (e.target.matches('button, a, input, select, [tabindex]')) {
        e.target.classList.add('focused');
    }
});

document.addEventListener('focusout', (e) => {
    if (e.target.matches('button, a, input, select, [tabindex]')) {
        e.target.classList.remove('focused');
    }
});

// Prevenir zoom com teclado em inputs (problema comum de acessibilidade)
document.addEventListener('wheel', (e) => {
    if (e.target.type === 'number') {
        e.preventDefault();
    }
}, { passive: false });

// Carregar vozes quando disponíveis
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = setupTextToSpeech;
}