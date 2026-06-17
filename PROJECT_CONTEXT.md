Проект: Booking SaaS MVP для сервисных бизнесов (барбершопы, салоны)

Стек:
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Backend: Supabase (PostgreSQL, Auth)

Текущая стадия: MVP — флоу бронирования + дашборд

Что уже сделано:
- Auth: не реализован, нужно сделать одним из первых шагов
- Таблица Supabase "bookings": id (uuid, PK), created_at (timestamp), 
  name (text), service (text), booking_time (timestamptz)
- Страницы: "/" (главная), "/booking" (страница бронирования), 
  "/dashboard" (дашборд)

Известные проблемы / технический долг:
- Страницы /booking и /dashboard пока не подключены к Supabase 
  (предполагается, проверить в начале сессии)
- Нет авторизации — все страницы сейчас публичные

Правило: перед любым изменением — прочитать актуальную структуру папок 
и схему БД, не полагаться на память из прошлых сессий.