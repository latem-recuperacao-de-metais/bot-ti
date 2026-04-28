# 🤖 Bot de Atendimento de TI - Latem Recuperação de Metais

Este projeto consiste num sistema de Helpdesk automatizado via WhatsApp, desenvolvido em Node.js, para centralizar e agilizar o suporte de Tecnologia da Informação (TI) da Latem. O bot atua como um rececionista virtual rápido e direto, organizando a fila de trabalho da equipa técnica sem depender de serviços de Inteligência Artificial ou APIs externas na nuvem, garantindo máxima estabilidade.

## ✨ Funcionalidades Principais

* **Atendimento Ágil e Direto:** Fluxo otimizado onde o colaborador relata o problema, anexa uma foto e escolhe a categoria. O chamado é aberto instantaneamente, sem esperas.
* **Encaminhamento de Evidências:** Quando o utilizador envia uma fotografia (ou ficheiro) do erro, o bot faz o download e encaminha automaticamente essa evidência para o WhatsApp do Administrador de TI, junto com os detalhes do chamado.
* **Gestão de Categorias:** Triagem automática em 8 categorias de TI (Programas, Computadores, Internet, etc.).
* **Comandos Administrativos:** Atalhos exclusivos via WhatsApp para a equipa de TI visualizar a fila de trabalho, iniciar ou concluir chamados diretamente pelo telemóvel.
* **Base de Dados 100% Local:** Registo de todas as interações e chamados guardado de forma segura no próprio servidor em formato Excel (`.xlsx`) e JSON, garantindo privacidade e imunidade a falhas de internet externa.
* **Proteção Anti-Spam e Timeout:** Ignora mensagens de grupos e status, além de contar com um temporizador de inatividade de 5 minutos que encerra sessões abandonadas.

## 🛠️ Tecnologias Utilizadas

* **[Node.js](https://nodejs.org/):** Ambiente de execução principal.
* **[whatsapp-web.js](https://wwebjs.dev/):** Biblioteca para integração e controlo do WhatsApp Web via Puppeteer.
* **[xlsx](https://www.npmjs.com/package/xlsx):** Criação e manipulação da base de dados local em Excel.
* **[PM2](https://pm2.keymetrics.io/):** Gestor de processos para manter o bot online 24/7 em segundo plano.

## 📋 Pré-requisitos

Para rodar este bot na máquina servidor, é necessário:
1. **Node.js** instalado (versão 18 ou superior).
2. **Google Chrome** instalado (utilizado em segundo plano pelo Puppeteer).

## 🚀 Como Instalar e Executar

1. **Instalação das dependências:**
   Abra o terminal na pasta do projeto e instale os pacotes necessários:
   ```bash
   npm install whatsapp-web.js qrcode-terminal xlsx