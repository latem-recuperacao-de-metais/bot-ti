# 🤖 Bot de Atendimento de TI - Latem Recuperação de Metais

Este projeto consiste num Assistente Virtual (Bot) para WhatsApp, desenvolvido em Node.js, com o objetivo de automatizar, centralizar e agilizar o suporte de Tecnologia da Informação (TI) da Latem Recuperação de Metais. O grande diferencial desta solução é a integração com Inteligência Artificial (Google Gemini) para atuar como Suporte de Nível 1.

## ✨ Funcionalidades Principais

* **Registo Inteligente:** Identifica novos colaboradores e guarda o seu nome automaticamente. Cumprimenta utilizadores recorrentes de forma personalizada.
* **Triagem com Inteligência Artificial:** Integração com o Google Gemini para analisar descrições e fotografias de erros, fornecendo passos de resolução imediata antes da abertura formal do chamado.
* **Abertura e Gestão de Chamados:** Fluxo intuitivo para os colaboradores abrirem chamados, categorizarem o problema (8 categorias disponíveis) e acompanharem o estado da sua solicitação em tempo real.
* **Comandos Administrativos:** Atalhos exclusivos via WhatsApp para a equipa de TI visualizar a fila de trabalho, iniciar ou concluir chamados diretamente pelo telemóvel.
* **Base de Dados Local e Segura:** Registo de todas as interações e chamados guardado de forma segura em ficheiros locais (`.xlsx` e `.json`), sem dependência de bases de dados na nuvem.
* **Estabilidade (Anti-Crash):** Temporizador de inatividade (timeout) de 5 minutos, ignorando mensagens de grupos, status e garantindo que o bot não entra em *loop*.

## 🛠️ Tecnologias Utilizadas

* **[Node.js](https://nodejs.org/):** Ambiente de execução.
* **[whatsapp-web.js](https://wwebjs.dev/):** Biblioteca para integração e controlo do WhatsApp Web via Puppeteer.
* **[@google/generative-ai](https://ai.google.dev/):** SDK oficial para comunicação com o modelo Gemini (Inteligência Artificial).
* **[xlsx](https://www.npmjs.com/package/xlsx):** Gestão e manipulação da base de dados em Excel.
* **[PM2](https://pm2.keymetrics.io/):** Gestor de processos para manter o bot a correr em segundo plano 24/7.

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de que a máquina servidor possui:
1. Node.js instalado (versão 18 ou superior).
2. O Google Chrome instalado (utilizado em segundo plano pelo Puppeteer).
3. Uma Chave de API válida do **Google AI Studio** (Gemini).

## 🚀 Como Instalar e Executar

1. **Instalação das dependências:**
   Abra o terminal na pasta do projeto e execute:
   ```bash
   npm install