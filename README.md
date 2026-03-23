# Finance AI — учёт личных финансов

Пет-проект на Nuxt 4: приложение для учёта доходов и расходов с дашбордом, бюджетами, графиками и импортом из CSV.

## Стек 

- **Nuxt 4** — full-stack фреймворк
- **Vue 3** — Composition API, `<script setup>`
- **TypeScript** — строгая типизация
- **Supabase** — auth, PostgreSQL (RLS)
- **TanStack Vue Query** — кэш, optimistic updates
- **Pinia** — глобальное состояние (минимально)
- **Tailwind CSS** — стили
- **Chart.js / vue-chartjs** — графики

## Функциональность

- Регистрация и вход (Supabase Auth)
- Транзакции: CRUD, пагинация, сортировка, фильтры
- Дашборд: баланс, доходы, расходы по дням/месяцам
- Бюджеты по категориям
- Прогноз на следующий месяц
- Импорт транзакций из CSV

## Запуск

### Требования

- Node.js 18+
- Аккаунт [Supabase](https://supabase.com)

### Установка

```bash
npm install
cp .env.example .env
```

Заполните `.env` значениями из Supabase (Settings → API):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Разработка

```bash
npm run dev
```

Приложение: http://localhost:3000

### Сборка

```bash
npm run build
npm run preview
```

## Структура проекта

```
├── components/          # Vue-компоненты
├── composables/         # useTransactions, useBudgets, useProfile, useForecast
├── layouts/             # default, auth
├── middleware/          # auth.global.ts
├── pages/               # index (дашборд), budgets, profile, login, register
├── server/api/          # Nitro API: transactions, budgets, auth
├── stores/              # Pinia
├── types/               # Transaction, Budget и т.д.
└── utils/               # date, форматирование, CSV-парсинг
```

## Безопасность

- Все API-роуты проверяют `serverSupabaseUser` — без авторизации 401
- `.env` в `.gitignore`, секреты не коммитятся
- Валидация и санитизация на сервере (amount, type, category, даты)
- RLS в Supabase — пользователь видит только свои данные

## Лицензия

MIT
