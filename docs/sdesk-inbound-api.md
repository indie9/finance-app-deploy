# SDESK → Finance AI: входящая интеграция

Документ для настройки обратного вызова из SDESK в приложение Finance AI.

## Базовый URL

```
https://<ваш-домен-amvera>
```

Пример:

```
https://finance-app.amvera.io
```

## Аутентификация

Как и исходящий вызов Finance → SDESK, доступ по **токену в query**:

```
?token=<SDESK_INBOUND_TOKEN>
```

Альтернатива — заголовок:

```http
Authorization: Bearer <SDESK_INBOUND_TOKEN>
```

При неверном или отсутствующем токене API вернёт **401**.

---

## 1. Проверка доступности

**GET** `/api/integrations/sdesk/health?token=<token>`

### Пример

```bash
curl -X GET "https://<host>/api/integrations/sdesk/health?token=your-token"
```

### Ответ 200

```json
{
  "ok": true,
  "service": "finance-ai-nuxt",
  "integration": "sdesk",
  "timestamp": "2026-07-09T12:00:00.000Z"
}
```

---

## 2. Создание транзакции

**POST** `/api/integrations/sdesk/transactions?token=<token>`

**Content-Type:** `application/json`

### Тело запроса

| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `user_id` | string (UUID) | да | ID пользователя Supabase — владелец транзакции |
| `amount` | number | да | Сумма > 0 |
| `type` | string | да | `income` или `expense` |
| `category` | string | да | Категория |
| `date` | string | нет | ISO-дата или `YYYY-MM-DD`; по умолчанию — текущая |
| `description` | string | нет | Описание |

### Пример

```bash
curl -X POST "https://<host>/api/integrations/sdesk/transactions?token=your-token" \
  -H "content-type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 1500.50,
    "type": "expense",
    "category": "Проверка интеграции",
    "date": "2026-07-09",
    "description": "Создано из SDESK, appeal #12345"
  }'
```

### Ответ 200

```json
{
  "ok": true,
  "source": "sdesk",
  "transaction": {
    "id": "...",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 1500.5,
    "type": "expense",
    "category": "Проверка интеграции",
    "date": "2026-07-09T00:00:00.000Z",
    "description": "Создано из SDESK, appeal #12345"
  }
}
```

### Ошибки

| HTTP | Причина |
|---|---|
| 401 | Неверный или отсутствующий `token` |
| 400 | Невалидное тело (сумма, тип, категория, `user_id`) |
| 404 | Пользователь с `user_id` не найден |
| 500 | Ошибка сервера / БД |

---

## Переменные окружения (сторона Finance AI)

| Переменная | Описание |
|---|---|
| `SDESK_INBOUND_TOKEN` | Секрет для входящих вызовов SDESK |
| `NUXT_SUPABASE_SERVICE_KEY` | Service role key Supabase (нужен для записи от имени интеграции) |

Если `SDESK_INBOUND_TOKEN` не задан, для dev используется fallback `SDESK_TOKEN`.

---

## Примечания

- Endpoint **не** вызывает обратно SDESK (нет зацикливания).
- `user_id` — UUID из Supabase Auth (Profile → User ID). SDESK должен передавать его в payload или хранить mapping appeal → user.
- Рекомендуется HTTPS и длинный случайный токен (≥ 32 символов).
