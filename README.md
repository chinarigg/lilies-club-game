# quem é esse pokémon — Lilie's Club

Jogo diário com login (e-mail + pin), progresso salvo num banco de dados de verdade, e um painel `/admin` pra você acompanhar todo mundo.

## O que tem aqui

- `/jogo` — a página do desafio (login + jogo)
- `/admin` — painel protegido por senha, lista todo mundo ordenado por sequência
- Banco de dados Postgres (Vercel/Neon) guardando o progresso de cada conta

## Passo a passo pra colocar no ar

### 1. Criar conta no GitHub
Vá em github.com, crie uma conta gratuita.

### 2. Subir este projeto pro GitHub
A forma mais simples sem usar linha de comando:
1. No GitHub, clique em **New repository**, dê um nome (ex: `lilies-club-game`) e crie.
2. Na página do repositório vazio, clique em **uploading an existing file**.
3. Arraste **todos os arquivos e pastas** deste projeto (menos `node_modules` e `.next`, se existirem) pra lá.
4. Clique em **Commit changes**.

### 3. Criar conta no Vercel
Vá em vercel.com, clique em **Sign Up** e escolha **Continue with GitHub** (assim as duas contas já ficam conectadas).

### 4. Importar o projeto
No painel do Vercel, clique em **Add New > Project**, escolha o repositório que você acabou de criar, e clique em **Deploy**. Ele vai falhar na primeira vez (falta o banco de dados) — isso é esperado, vamos resolver no próximo passo.

### 5. Criar o banco de dados
1. No projeto dentro do Vercel, vá na aba **Storage**.
2. Clique em **Create Database**, escolha a opção de **Postgres** (via Neon).
3. Depois de criado, o Vercel já conecta ele automaticamente ao projeto e cria a variável `POSTGRES_URL` sozinho.

### 6. Configurar as outras variáveis de ambiente
Ainda no projeto, vá em **Settings > Environment Variables** e adicione:
- `JWT_SECRET`: qualquer texto longo e aleatório (pode gerar em [randomkeygen.com](https://randomkeygen.com), por exemplo).
- `ADMIN_PASSWORD`: a senha que você vai usar pra entrar em `/admin`.

### 7. Rodar o deploy de novo
Vá na aba **Deployments**, clique nos três pontinhos do último deploy (o que falhou) e escolha **Redeploy**. Dessa vez deve funcionar.

### 8. Colocar no seu domínio (opcional)
Em **Settings > Domains**, adicione algo como `jogo.chinaritcg.com.br`. O Vercel vai te mostrar um registro CNAME pra criar no painel de DNS do seu domínio — mesma lógica que fizemos com o Netlify, só que apontando pro Vercel dessa vez.

## Testando localmente (opcional, se algum dia quiser mexer no código)

```bash
npm install
npm run dev
```

Vai precisar de um arquivo `.env.local` com as mesmas variáveis do `.env.example`, e de um Postgres acessível (pode usar o mesmo do Vercel, copiando o valor de `POSTGRES_URL` de lá).
