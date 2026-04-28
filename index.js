const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const EXCEL_FILE = path.join(__dirname, 'banco_de_dados.xlsx');
const TICKETS_FILE = path.join(__dirname, 'chamados.json');
const TIMEOUT_MS = 5 * 60 * 1000; 
const NUMERO_ADMIN_TI = '5515997829881@c.us'; 

function initFiles() {
    let wb;
    if (!fs.existsSync(EXCEL_FILE)) {
        wb = xlsx.utils.book_new();
        const wsClientes = xlsx.utils.json_to_sheet([]);
        xlsx.utils.book_append_sheet(wb, wsClientes, 'Clientes');
        xlsx.utils.sheet_add_aoa(wsClientes, [['Telefone', 'Nome']], { origin: 'A1' });
        
        const wsChamados = xlsx.utils.json_to_sheet([]);
        xlsx.utils.book_append_sheet(wb, wsChamados, 'Chamados');
        xlsx.utils.sheet_add_aoa(wsChamados, [['ID', 'Data Abertura', 'Data Início', 'Data Conclusão', 'Telefone', 'Nome', 'Categoria', 'Problema', 'Status']], { origin: 'A1' });
        
        xlsx.writeFile(wb, EXCEL_FILE);
    } else {
        wb = xlsx.readFile(EXCEL_FILE);
        if (!wb.Sheets['Chamados']) {
            const wsChamados = xlsx.utils.json_to_sheet([]);
            xlsx.utils.book_append_sheet(wb, wsChamados, 'Chamados');
            xlsx.utils.sheet_add_aoa(wsChamados, [['ID', 'Data Abertura', 'Data Início', 'Data Conclusão', 'Telefone', 'Nome', 'Categoria', 'Problema', 'Status']], { origin: 'A1' });
            xlsx.writeFile(wb, EXCEL_FILE);
        }
    }
    if (!fs.existsSync(TICKETS_FILE)) fs.writeFileSync(TICKETS_FILE, JSON.stringify([]));
}
initFiles();

function getUsuarioExcel(telefone) {
    const wb = xlsx.readFile(EXCEL_FILE);
    const ws = wb.Sheets['Clientes'];
    const data = xlsx.utils.sheet_to_json(ws);
    return data.find(user => String(user.Telefone) === String(telefone.replace('@c.us', '')));
}

function salvarUsuarioExcel(telefone, nome) {
    const wb = xlsx.readFile(EXCEL_FILE);
    const ws = wb.Sheets['Clientes'];
    const data = xlsx.utils.sheet_to_json(ws);
    data.push({ Telefone: telefone.replace('@c.us', ''), Nome: nome });
    wb.Sheets['Clientes'] = xlsx.utils.json_to_sheet(data);
    xlsx.writeFile(wb, EXCEL_FILE);
}

function getChamados() {
    return JSON.parse(fs.readFileSync(TICKETS_FILE));
}

function criarChamado(telefone, nome, categoria, descricao) {
    const chamados = getChamados();
    const novoId = chamados.length > 0 ? chamados[chamados.length - 1].id + 1 : 1;
    const dataAtual = new Date().toLocaleString('pt-BR');
    
    const novoChamado = {
        id: novoId, telefone, nome, categoria, descricao,
        status: 'Aberto', dataAbertura: dataAtual, dataInicio: '', dataConclusao: ''
    };
    
    chamados.push(novoChamado);
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(chamados, null, 2));

    const wb = xlsx.readFile(EXCEL_FILE);
    const dataExcel = xlsx.utils.sheet_to_json(wb.Sheets['Chamados']);
    dataExcel.push({
        ID: novoId, 'Data Abertura': dataAtual, 'Data Início': '', 'Data Conclusão': '',
        Telefone: telefone.replace('@c.us', ''), Nome: nome, Categoria: categoria, Problema: descricao, Status: 'Aberto'
    });
    wb.Sheets['Chamados'] = xlsx.utils.json_to_sheet(dataExcel);
    xlsx.writeFile(wb, EXCEL_FILE);
    return novoId;
}

function atualizarStatusChamado(id, novoStatus, client) {
    const chamados = getChamados();
    const index = chamados.findIndex(c => c.id === id);
    if (index === -1) return false;

    const dataAtual = new Date().toLocaleString('pt-BR');
    chamados[index].status = novoStatus;
    if (novoStatus === 'Em Andamento') chamados[index].dataInicio = dataAtual;
    if (novoStatus === 'Concluído') chamados[index].dataConclusao = dataAtual;

    fs.writeFileSync(TICKETS_FILE, JSON.stringify(chamados, null, 2));

    const wb = xlsx.readFile(EXCEL_FILE);
    const dataExcel = xlsx.utils.sheet_to_json(wb.Sheets['Chamados']);
    const exIdx = dataExcel.findIndex(row => String(row.ID) === String(id));
    if (exIdx !== -1) {
        dataExcel[exIdx].Status = novoStatus;
        if (novoStatus === 'Em Andamento') dataExcel[exIdx]['Data Início'] = dataAtual;
        if (novoStatus === 'Concluído') dataExcel[exIdx]['Data Conclusão'] = dataAtual;
        wb.Sheets['Chamados'] = xlsx.utils.json_to_sheet(dataExcel);
        xlsx.writeFile(wb, EXCEL_FILE);
    }

    if (client) {
        const msgStatus = novoStatus === 'Em Andamento' 
            ? `👨‍💻 Olá! O seu chamado de TI (*#${id}*) foi *iniciado* pela nossa equipe.` 
            : `✅ Olá! O seu chamado de TI (*#${id}*) foi *concluído*.`;
        client.sendMessage(chamados[index].telefone, msgStatus);
    }
    return true;
}

const userSessions = {};
function clearSession(telefone) {
    if (userSessions[telefone]?.timeout) clearTimeout(userSessions[telefone].timeout);
    delete userSessions[telefone];
}

function resetTimeout(telefone, client) {
    if (userSessions[telefone]?.timeout) clearTimeout(userSessions[telefone].timeout);
    userSessions[telefone].timeout = setTimeout(() => {
        client.sendMessage(telefone, "⏳ Atendimento encerrado por inatividade. Se precisar, envie uma nova mensagem!");
        clearSession(telefone);
    }, TIMEOUT_MS);
}

function gerarMensagemMeusChamados(telefone) {
    const meus = getChamados().filter(c => c.telefone === telefone && c.status !== 'Concluído');
    let r = meus.length === 0 ? "Você não tem chamados ativos no momento." : "*--- SEUS CHAMADOS ATIVOS ---*\n\n";
    if (meus.length > 0) {
        meus.reverse().forEach(c => {
            r += `*ID:* #${c.id} [${c.status}]\n*Categoria:* ${c.categoria || 'Não informada'}\n*Problema:* ${c.descricao}\n\n`;
        });
    }
    r += "\n*0* - Voltar ao menu principal";
    return r;
}

// --- CLIENTE WHATSAPP ---
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] },
    webVersionCache: { type: 'remote', remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html' }
});

client.on('qr', (qr) => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('Bot Latem TI Pronto! (Modo Direto - Sem IA)'));

client.on('message', async (msg) => {
    if (msg.fromMe || msg.isStatus || msg.from.includes('@g.us')) return;

    const texto = msg.body ? msg.body.trim() : '';
    const telefone = msg.from;
    const comando = texto.toLowerCase();

    if (!texto && !msg.hasMedia) return;

    if (comando.startsWith('!')) {
        if (comando === '!status' || comando === '!meuschamados') {
            if (!userSessions[telefone]) userSessions[telefone] = { step: 'START', dados: {} };
            userSessions[telefone].step = 'WAIT_RETURN';
            resetTimeout(telefone, client);
            return client.sendMessage(telefone, gerarMensagemMeusChamados(telefone));
        }
        if (comando === '!chamados') {
            const todos = getChamados().filter(c => c.status !== 'Concluído');
            if (todos.length === 0) return client.sendMessage(telefone, "Sem chamados pendentes.");
            let r = "*--- CHAMADOS PENDENTES (TI) ---*\n\n";
            todos.forEach(c => r += `*#${c.id}* - ${c.nome}\nAssunto: ${c.descricao}\n\n`);
            return client.sendMessage(telefone, r);
        }
        if (comando.startsWith('!iniciar')) {
            const id = parseInt(comando.split(' ')[1]);
            const ok = atualizarStatusChamado(id, 'Em Andamento', client);
            return client.sendMessage(telefone, ok ? `Chamado #${id} iniciado.` : "ID inválido.");
        }
        if (comando.startsWith('!concluir') || comando.startsWith('!finalizar')) {
            const id = parseInt(comando.split(' ')[1]);
            const ok = atualizarStatusChamado(id, 'Concluído', client);
            return client.sendMessage(telefone, ok ? `Chamado #${id} concluído.` : "ID inválido.");
        }
        return;
    }

    if (!userSessions[telefone]) userSessions[telefone] = { step: 'START', dados: {} };
    resetTimeout(telefone, client);
    const session = userSessions[telefone];
    const userDB = getUsuarioExcel(telefone);

    switch (session.step) {
        case 'START':
            if (userDB) {
                session.dados.nome = userDB.Nome;
                await client.sendMessage(telefone, `Olá ${userDB.Nome}, bem-vindo(a) à Tecnologia da Informação da *Latem*! 👋\n\nComo podemos ajudar?\n\n*1* - Abrir Chamado de TI\n*2* - Consultar meus chamados\n*3* - Encerrar atendimento`);
                session.step = 'MENU';
            } else {
                await client.sendMessage(telefone, "Olá! Bem-vindo(a) ao suporte de TI da *Latem*. 👋\n\nQual seu nome completo?");
                session.step = 'NAME';
            }
            break;

        case 'NAME':
            session.dados.nome = texto;
            salvarUsuarioExcel(telefone, texto);
            await client.sendMessage(telefone, `Prazer, ${texto}! O que deseja fazer?\n\n*1* - Abrir Chamado de TI\n*2* - Consultar meus chamados\n*3* - Encerrar atendimento`);
            session.step = 'MENU';
            break;

        case 'MENU':
            if (texto === '1') {
                await client.sendMessage(telefone, "Descreva detalhadamente o problema:");
                session.step = 'PROB';
            } else if (texto === '2') {
                await client.sendMessage(telefone, gerarMensagemMeusChamados(telefone));
                session.step = 'WAIT_RETURN';
            } else if (texto === '3') {
                await client.sendMessage(telefone, "Atendimento encerrado. 👋");
                clearSession(telefone);
            } else {
                await client.sendMessage(telefone, "Opção inválida. Digite 1, 2 ou 3.");
            }
            break;

        case 'WAIT_RETURN':
            if (texto === '0') {
                await client.sendMessage(telefone, "Como podemos ajudar?\n\n*1* - Abrir Chamado de TI\n*2* - Consultar meus chamados\n*3* - Encerrar atendimento");
                session.step = 'MENU';
            }
            break;

        case 'PROB':
            session.dados.descricao = texto;
            await client.sendMessage(telefone, "Se tiver uma *foto* do erro, envie agora.\nCaso contrário, basta digitar *pular*.");
            session.step = 'PHOTO';
            break;

        case 'PHOTO':
            if (msg.hasMedia) {
                session.dados.media = await msg.downloadMedia();
            }
            
            await client.sendMessage(telefone, "Para direcionarmos seu atendimento, escolha a categoria:\n\n*1* - Programas | ERP\n*2* - Computador | Notebook\n*3* - Celular | Tablet\n*4* - Internet\n*5* - Perifericos | Equipamentos\n*6* - Impressora | Scanner\n*7* - Acesso | Contas\n*8* - Outros");
            session.step = 'CAT';
            break;

        case 'CAT':
            const cats = {'1':'Programas | ERP','2':'Computador | Notebook','3':'Celular | Tablet','4':'Internet','5':'Perifericos | Equipamentos','6':'Impressora | Scanner','7':'Acesso | Contas','8':'Outros'};
            if (cats[texto]) {
                const id = criarChamado(telefone, session.dados.nome, cats[texto], session.dados.descricao);
                
                await client.sendMessage(telefone, `✅ *Chamado #${id} aberto com sucesso!*\n\nAguarde o contato da nossa equipe.\nLembre-se: Você pode consultar o andamento no menu inicial ou digitando *!status* | *!meuschamados* a qualquer momento.`);
                
                await client.sendMessage(NUMERO_ADMIN_TI, `🚨 *NOVO CHAMADO (#${id})*\nUsuário: ${session.dados.nome}\nCategoria: ${cats[texto]}\nProblema: ${session.dados.descricao}`);
                
                if (session.dados.media) {
                     await client.sendMessage(NUMERO_ADMIN_TI, session.dados.media, { caption: `📷 Evidência anexada ao chamado #${id}` });
                }

                clearSession(telefone);
            } else {
                await client.sendMessage(telefone, "Opção inválida. Digite um número de 1 a 8.");
            }
            break;
    }
});

client.initialize();