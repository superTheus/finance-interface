# finance-app

## Configuração por ambiente

O Vite carrega `.env.development` com `npm run dev` e `.env.production` com
`npm run build`. Copie os modelos correspondentes antes de iniciar ou compilar:

```sh
cp .env.development.example .env.development
cp .env.production.example .env.production
```

Configure nestes arquivos:

| Variável | Uso |
| --- | --- |
| `VITE_API_BASE_URL` | URL base da API financeira, antes de `/login` e `/private` |
| `VITE_AGENT_URL_BASE` | URL base do agente financeiro; opcional até o agente ter uma URL pública |
| `VITE_GOOGLE_CLIENT_ID` | ID público do cliente OAuth usado no login com Google |

O modelo de produção já aponta a API para `https://apifinance.supertheus.site`.
Os arquivos com valores reais são ignorados pelo Git. As variáveis `VITE_*`
entram no código entregue ao navegador; não coloque segredos nelas. Reinicie o
servidor de desenvolvimento após alterar `.env.development` e gere uma nova
compilação após alterar `.env.production`.

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
yarn
```

### Compile and Hot-Reload for Development

```sh
yarn dev
```

### Type-Check, Compile and Minify for Production

```sh
yarn build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
yarn test:unit
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
yarn test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
yarn build
yarn test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
yarn lint
```
