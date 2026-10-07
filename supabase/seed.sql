-- LOCAL ONLY. Runs on `supabase start` (first time) and every `supabase db reset`.
-- Never runs on prod: `supabase db push` applies migrations only, not this file.
--
-- After a reset there are no users. Sign in with Google on localhost:3000 and the
-- trigger at the bottom gives the new user mock data automatically.
-- To (re)seed an existing local user by hand, in Studio SQL editor:
--   select dev.seed_user('you@gmail.com');

-- ─── Reference data (copied from prod: system categories + public FX rates) ──
insert into public.categories (id, name, icon, color_bg, color_text, is_system, key) values
  ('446c89e7-e370-4f83-8e48-7f5b9a221358', 'Restaurants & Cafés', '🍽️', '#FDE68A', '#92400E', true, NULL),
  ('139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6', 'Clothing', '🛍️', '#FCA5A5', '#991B1B', true, NULL),
  ('1dce321c-5b29-4994-aa21-165c5efd7cd7', 'Transportation', '🚗', '#A7F3D0', '#065F46', true, NULL),
  ('9c3bf797-3cab-4774-b443-65707645c675', 'Bills & Utilities', '📱', '#C7D2FE', '#1E40AF', true, NULL),
  ('2557ddce-7aec-45e5-8932-63fe3b1f2fd6', 'Entertainment', '🎮', '#F9A8D4', '#831843', true, NULL),
  ('ffcdbf34-5d88-419c-9e56-7a3e94b74927', 'Healthcare', '🏥', '#FECACA', '#B91C1C', true, NULL),
  ('5a1413cd-8b6c-4209-ab24-b91ea0cd18be', 'Education', '📚', '#BFDBFE', '#1E3A8A', true, NULL),
  ('1428c16e-2359-4b37-b72c-30312d998fb7', 'Travel', '✈️', '#FDE68A', '#92400E', true, NULL),
  ('20fccda8-a29f-4d0e-a301-e36c715efd03', 'Presents', '🎁', '#FCA5A5', '#991B1B', true, NULL),
  ('e6ae9d7d-1e91-447d-8bcb-9940a5d9d3a0', 'Other', '📌', '#D1D5DB', '#374151', true, NULL),
  ('d3ff9c14-c203-4ec3-9827-f0ca2104c8fa', 'Donations', '🤝', '#A7F3D0', '#065F46', true, NULL),
  ('f55eb95a-62ce-4caa-be8e-4a90f8901aa2', 'Subscriptions', '📅', '#C7D2FE', '#1E40AF', true, NULL),
  ('c665d97d-405a-4c6a-a7df-ef3c9f4fcd77', 'Groceries', '🛒', '#FDE68A', '#92400E', true, NULL),
  ('7effbff6-edf0-49a0-9d0b-5ac86e6d880c', 'Car', '🚘', '#A7F3D0', '#065F46', true, NULL),
  ('0d7e7fde-1e1a-46b3-80f9-f463aec89144', 'Home', '🏠', '#C7D2FE', '#1E40AF', true, NULL),
  ('a2e466b5-d48e-417d-a703-b26f1d33762f', 'Taxes', '📝', '#FECACA', '#B91C1C', true, NULL),
  ('162ed636-dfcc-4252-9886-b2207e72cc39', 'Electronics', '💻', '#BFDBFE', '#1E3A8A', true, NULL),
  ('ccdf945f-037e-46fb-b579-54c74419ae93', 'Children', '👶', '#F9A8D4', '#831843', true, NULL),
  ('459aee82-b777-4fe9-a6a0-506f779a4823', 'Parents', '👨‍👩‍👧‍👦', '#FCA5A5', '#991B1B', true, NULL),
  ('a2aadb6f-738e-4763-aa0f-337c44940748', 'Pets', '🐾', '#A7F3D0', '#065F46', true, NULL),
  ('40d16b08-240d-4c28-8cdf-f1094b82100a', 'Sport', '🏋️', '#C7D2FE', '#1E40AF', true, NULL),
  ('11fa4c3f-5cae-4c34-aa46-a892c1259b24', 'Style and Beauty', '💇', '#F9A8D4', '#831843', true, NULL),
  ('852aa91c-2fa2-42e8-ae92-88dff59849b3', 'Extra', '➕', '#D1D5DB', '#374151', true, NULL),
  ('80b13350-77b5-433f-9567-02b88150f815', 'Salary', '💰', '#A7F3D0', '#065F46', true, NULL),
  ('6da4ff07-a036-4a20-bf7a-14d50f669add', 'Transfers', '💸', '#e0f2fe', '#0369a1', true, NULL)
on conflict (id) do nothing;

insert into public.fx_rates (rate_date, base, quote, rate, source) values
  ('2026-09-28', 'EUR', 'GBP', 0.85785, 'ecb'),
  ('2026-09-29', 'EUR', 'GBP', 0.85718, 'ecb'),
  ('2026-09-30', 'EUR', 'GBP', 0.85463, 'ecb'),
  ('2026-10-01', 'EUR', 'GBP', 0.85373, 'ecb'),
  ('2026-10-02', 'EUR', 'GBP', 0.85033, 'ecb'),
  ('2026-10-05', 'EUR', 'GBP', 0.8472, 'ecb'),
  ('2026-09-28', 'EUR', 'PLN', 4.373, 'ecb'),
  ('2026-09-29', 'EUR', 'PLN', 4.3653, 'ecb'),
  ('2026-09-30', 'EUR', 'PLN', 4.369, 'ecb'),
  ('2026-10-01', 'EUR', 'PLN', 4.3735, 'ecb'),
  ('2026-10-02', 'EUR', 'PLN', 4.3775, 'ecb'),
  ('2026-10-05', 'EUR', 'PLN', 4.3795, 'ecb'),
  ('2026-09-28', 'EUR', 'USD', 1.1378, 'ecb'),
  ('2026-09-29', 'EUR', 'USD', 1.1355, 'ecb'),
  ('2026-09-30', 'EUR', 'USD', 1.1355, 'ecb'),
  ('2026-10-01', 'EUR', 'USD', 1.1298, 'ecb'),
  ('2026-10-02', 'EUR', 'USD', 1.1225, 'ecb'),
  ('2026-10-05', 'EUR', 'USD', 1.1204, 'ecb'),
  ('2026-01-09', 'GBP', 'UAH', 57.7726, 'nbu'),
  ('2026-01-09', 'USD', 'UAH', 42.9904, 'nbu'),
  ('2026-01-09', 'EUR', 'UAH', 50.1762, 'nbu'),
  ('2026-01-09', 'PLN', 'UAH', 11.9242, 'nbu'),
  ('2026-01-02', 'EUR', 'GBP', 0.8719, 'ecb'),
  ('2026-01-05', 'EUR', 'GBP', 0.8676, 'ecb'),
  ('2026-01-06', 'EUR', 'GBP', 0.8663, 'ecb'),
  ('2026-01-07', 'EUR', 'GBP', 0.8664, 'ecb'),
  ('2026-01-08', 'EUR', 'GBP', 0.8687, 'ecb'),
  ('2026-01-09', 'EUR', 'GBP', 0.8677, 'ecb'),
  ('2026-01-02', 'EUR', 'PLN', 4.2123, 'ecb'),
  ('2026-01-05', 'EUR', 'PLN', 4.2178, 'ecb'),
  ('2026-01-06', 'EUR', 'PLN', 4.2105, 'ecb'),
  ('2026-01-07', 'EUR', 'PLN', 4.2148, 'ecb'),
  ('2026-01-08', 'EUR', 'PLN', 4.2093, 'ecb'),
  ('2026-01-09', 'EUR', 'PLN', 4.2138, 'ecb'),
  ('2026-01-02', 'EUR', 'USD', 1.1721, 'ecb'),
  ('2026-01-05', 'EUR', 'USD', 1.1664, 'ecb'),
  ('2026-01-06', 'EUR', 'USD', 1.1707, 'ecb'),
  ('2026-01-07', 'EUR', 'USD', 1.1684, 'ecb'),
  ('2026-01-08', 'EUR', 'USD', 1.1675, 'ecb'),
  ('2026-01-09', 'EUR', 'USD', 1.1642, 'ecb'),
  ('2023-04-03', 'EUR', 'GBP', 0.8779, 'ecb'),
  ('2023-04-04', 'EUR', 'GBP', 0.87333, 'ecb'),
  ('2023-04-05', 'EUR', 'GBP', 0.87685, 'ecb'),
  ('2023-04-06', 'EUR', 'GBP', 0.87495, 'ecb'),
  ('2023-04-03', 'EUR', 'PLN', 4.6765, 'ecb'),
  ('2023-04-04', 'EUR', 'PLN', 4.6718, 'ecb'),
  ('2023-04-05', 'EUR', 'PLN', 4.6818, 'ecb'),
  ('2023-04-06', 'EUR', 'PLN', 4.6863, 'ecb'),
  ('2023-04-03', 'EUR', 'USD', 1.087, 'ecb'),
  ('2023-04-04', 'EUR', 'USD', 1.0901, 'ecb'),
  ('2023-04-05', 'EUR', 'USD', 1.094, 'ecb'),
  ('2023-04-06', 'EUR', 'USD', 1.0915, 'ecb'),
  ('2023-05-09', 'GBP', 'UAH', 46.2575, 'nbu'),
  ('2023-05-09', 'USD', 'UAH', 36.5686, 'nbu'),
  ('2023-05-09', 'EUR', 'UAH', 40.348, 'nbu'),
  ('2023-05-09', 'PLN', 'UAH', 8.8304, 'nbu'),
  ('2023-05-22', 'EUR', 'GBP', 0.86846, 'ecb'),
  ('2023-05-23', 'EUR', 'GBP', 0.86993, 'ecb'),
  ('2023-05-24', 'EUR', 'GBP', 0.86993, 'ecb'),
  ('2023-05-25', 'EUR', 'GBP', 0.86793, 'ecb'),
  ('2023-05-26', 'EUR', 'GBP', 0.86813, 'ecb'),
  ('2023-05-29', 'EUR', 'GBP', 0.86805, 'ecb'),
  ('2023-05-22', 'EUR', 'PLN', 4.5133, 'ecb'),
  ('2023-05-23', 'EUR', 'PLN', 4.5018, 'ecb'),
  ('2023-05-24', 'EUR', 'PLN', 4.49, 'ecb'),
  ('2023-05-25', 'EUR', 'PLN', 4.511, 'ecb'),
  ('2023-05-26', 'EUR', 'PLN', 4.5354, 'ecb'),
  ('2023-05-29', 'EUR', 'PLN', 4.52, 'ecb'),
  ('2023-05-22', 'EUR', 'USD', 1.0822, 'ecb'),
  ('2023-05-23', 'EUR', 'USD', 1.0779, 'ecb'),
  ('2023-05-24', 'EUR', 'USD', 1.0785, 'ecb'),
  ('2023-05-25', 'EUR', 'USD', 1.0735, 'ecb'),
  ('2023-05-26', 'EUR', 'USD', 1.0751, 'ecb'),
  ('2023-05-29', 'EUR', 'USD', 1.0715, 'ecb'),
  ('2023-06-30', 'EUR', 'GBP', 0.85828, 'ecb'),
  ('2023-07-03', 'EUR', 'GBP', 0.8598, 'ecb'),
  ('2023-07-04', 'EUR', 'GBP', 0.85673, 'ecb'),
  ('2023-07-05', 'EUR', 'GBP', 0.85685, 'ecb'),
  ('2023-07-06', 'EUR', 'GBP', 0.8531, 'ecb'),
  ('2023-07-07', 'EUR', 'GBP', 0.85298, 'ecb'),
  ('2023-06-30', 'EUR', 'PLN', 4.4388, 'ecb'),
  ('2023-07-03', 'EUR', 'PLN', 4.4385, 'ecb'),
  ('2023-07-04', 'EUR', 'PLN', 4.4215, 'ecb'),
  ('2023-07-05', 'EUR', 'PLN', 4.4558, 'ecb'),
  ('2023-07-06', 'EUR', 'PLN', 4.4753, 'ecb'),
  ('2023-07-07', 'EUR', 'PLN', 4.4838, 'ecb'),
  ('2023-06-30', 'EUR', 'USD', 1.0866, 'ecb'),
  ('2023-07-03', 'EUR', 'USD', 1.0899, 'ecb'),
  ('2023-07-04', 'EUR', 'USD', 1.0895, 'ecb'),
  ('2023-07-05', 'EUR', 'USD', 1.0879, 'ecb'),
  ('2023-07-06', 'EUR', 'USD', 1.0899, 'ecb'),
  ('2023-07-07', 'EUR', 'USD', 1.0888, 'ecb'),
  ('2023-08-18', 'EUR', 'GBP', 0.85493, 'ecb'),
  ('2023-08-21', 'EUR', 'GBP', 0.85475, 'ecb'),
  ('2023-08-22', 'EUR', 'GBP', 0.85288, 'ecb'),
  ('2023-08-23', 'EUR', 'GBP', 0.85653, 'ecb'),
  ('2023-08-24', 'EUR', 'GBP', 0.8565, 'ecb'),
  ('2023-08-25', 'EUR', 'GBP', 0.85643, 'ecb'),
  ('2023-08-18', 'EUR', 'PLN', 4.4698, 'ecb'),
  ('2023-08-21', 'EUR', 'PLN', 4.4785, 'ecb'),
  ('2023-08-22', 'EUR', 'PLN', 4.4643, 'ecb'),
  ('2023-08-23', 'EUR', 'PLN', 4.4773, 'ecb'),
  ('2023-08-24', 'EUR', 'PLN', 4.4768, 'ecb'),
  ('2023-08-25', 'EUR', 'PLN', 4.469, 'ecb'),
  ('2023-08-18', 'EUR', 'USD', 1.0867, 'ecb'),
  ('2023-08-21', 'EUR', 'USD', 1.0908, 'ecb'),
  ('2023-08-22', 'EUR', 'USD', 1.0887, 'ecb'),
  ('2023-08-23', 'EUR', 'USD', 1.0805, 'ecb'),
  ('2023-08-24', 'EUR', 'USD', 1.084, 'ecb'),
  ('2023-08-25', 'EUR', 'USD', 1.0808, 'ecb'),
  ('2024-02-02', 'EUR', 'GBP', 0.85263, 'ecb'),
  ('2024-02-05', 'EUR', 'GBP', 0.85595, 'ecb'),
  ('2024-02-06', 'EUR', 'GBP', 0.8546, 'ecb'),
  ('2024-02-07', 'EUR', 'GBP', 0.85305, 'ecb'),
  ('2024-02-08', 'EUR', 'GBP', 0.85378, 'ecb'),
  ('2024-02-09', 'EUR', 'GBP', 0.8544, 'ecb'),
  ('2024-02-02', 'EUR', 'PLN', 4.3175, 'ecb'),
  ('2024-02-05', 'EUR', 'PLN', 4.3343, 'ecb'),
  ('2024-02-06', 'EUR', 'PLN', 4.3463, 'ecb'),
  ('2024-02-07', 'EUR', 'PLN', 4.3453, 'ecb'),
  ('2024-02-08', 'EUR', 'PLN', 4.3375, 'ecb'),
  ('2024-02-09', 'EUR', 'PLN', 4.3206, 'ecb'),
  ('2024-02-02', 'EUR', 'USD', 1.0883, 'ecb'),
  ('2024-02-05', 'EUR', 'USD', 1.0746, 'ecb'),
  ('2024-02-06', 'EUR', 'USD', 1.0743, 'ecb'),
  ('2024-02-07', 'EUR', 'USD', 1.0776, 'ecb'),
  ('2024-02-08', 'EUR', 'USD', 1.0758, 'ecb'),
  ('2024-02-09', 'EUR', 'USD', 1.0772, 'ecb'),
  ('2024-02-29', 'EUR', 'GBP', 0.85655, 'ecb'),
  ('2024-03-01', 'EUR', 'GBP', 0.85588, 'ecb'),
  ('2024-03-04', 'EUR', 'GBP', 0.85583, 'ecb'),
  ('2024-03-05', 'EUR', 'GBP', 0.85543, 'ecb'),
  ('2024-03-06', 'EUR', 'GBP', 0.85498, 'ecb'),
  ('2024-03-07', 'EUR', 'GBP', 0.85445, 'ecb'),
  ('2024-02-29', 'EUR', 'PLN', 4.3208, 'ecb'),
  ('2024-03-01', 'EUR', 'PLN', 4.318, 'ecb'),
  ('2024-03-04', 'EUR', 'PLN', 4.322, 'ecb'),
  ('2024-03-05', 'EUR', 'PLN', 4.3248, 'ecb'),
  ('2024-03-06', 'EUR', 'PLN', 4.3018, 'ecb'),
  ('2024-03-07', 'EUR', 'PLN', 4.302, 'ecb'),
  ('2024-02-29', 'EUR', 'USD', 1.0826, 'ecb'),
  ('2024-03-01', 'EUR', 'USD', 1.0813, 'ecb'),
  ('2024-03-04', 'EUR', 'USD', 1.0846, 'ecb'),
  ('2024-03-05', 'EUR', 'USD', 1.0849, 'ecb'),
  ('2024-03-06', 'EUR', 'USD', 1.0874, 'ecb'),
  ('2024-03-07', 'EUR', 'USD', 1.0895, 'ecb'),
  ('2024-04-15', 'EUR', 'GBP', 0.85405, 'ecb'),
  ('2023-04-08', 'GBP', 'UAH', 45.6266, 'nbu'),
  ('2023-04-08', 'USD', 'UAH', 36.5686, 'nbu'),
  ('2023-04-08', 'EUR', 'UAH', 39.9146, 'nbu'),
  ('2023-04-08', 'PLN', 'UAH', 8.518, 'nbu'),
  ('2023-05-02', 'EUR', 'GBP', 0.87868, 'ecb'),
  ('2023-05-03', 'EUR', 'GBP', 0.88265, 'ecb'),
  ('2023-05-04', 'EUR', 'GBP', 0.88015, 'ecb'),
  ('2023-05-05', 'EUR', 'GBP', 0.87378, 'ecb'),
  ('2023-05-08', 'EUR', 'GBP', 0.87228, 'ecb'),
  ('2023-05-09', 'EUR', 'GBP', 0.8699, 'ecb'),
  ('2023-05-02', 'EUR', 'PLN', 4.5758, 'ecb'),
  ('2023-05-03', 'EUR', 'PLN', 4.582, 'ecb'),
  ('2023-05-04', 'EUR', 'PLN', 4.5905, 'ecb'),
  ('2023-05-05', 'EUR', 'PLN', 4.577, 'ecb'),
  ('2023-05-08', 'EUR', 'PLN', 4.5693, 'ecb'),
  ('2023-05-09', 'EUR', 'PLN', 4.5723, 'ecb'),
  ('2023-05-02', 'EUR', 'USD', 1.0965, 'ecb'),
  ('2023-05-03', 'EUR', 'USD', 1.1043, 'ecb'),
  ('2023-05-04', 'EUR', 'USD', 1.1074, 'ecb'),
  ('2023-05-05', 'EUR', 'USD', 1.1014, 'ecb'),
  ('2023-05-08', 'EUR', 'USD', 1.1037, 'ecb'),
  ('2023-05-09', 'EUR', 'USD', 1.0959, 'ecb'),
  ('2023-05-29', 'GBP', 'UAH', 45.292, 'nbu'),
  ('2023-05-29', 'USD', 'UAH', 36.5686, 'nbu'),
  ('2023-05-29', 'EUR', 'UAH', 39.3167, 'nbu'),
  ('2023-05-29', 'PLN', 'UAH', 8.6684, 'nbu'),
  ('2023-07-07', 'GBP', 'UAH', 46.7127, 'nbu'),
  ('2023-07-07', 'USD', 'UAH', 36.5686, 'nbu'),
  ('2023-07-07', 'EUR', 'UAH', 39.8433, 'nbu'),
  ('2023-07-07', 'PLN', 'UAH', 8.8975, 'nbu'),
  ('2023-08-25', 'GBP', 'UAH', 46.2958, 'nbu'),
  ('2023-08-25', 'USD', 'UAH', 36.5686, 'nbu'),
  ('2023-08-25', 'EUR', 'UAH', 39.655, 'nbu'),
  ('2023-08-25', 'PLN', 'UAH', 8.8587, 'nbu'),
  ('2024-02-09', 'GBP', 'UAH', 47.3316, 'nbu'),
  ('2024-02-09', 'USD', 'UAH', 37.5707, 'nbu'),
  ('2024-02-09', 'EUR', 'UAH', 40.4129, 'nbu'),
  ('2024-02-09', 'PLN', 'UAH', 9.3124, 'nbu'),
  ('2024-03-07', 'GBP', 'UAH', 48.627, 'nbu'),
  ('2024-03-07', 'USD', 'UAH', 38.2664, 'nbu'),
  ('2024-03-07', 'EUR', 'UAH', 41.5918, 'nbu'),
  ('2024-03-07', 'PLN', 'UAH', 9.6774, 'nbu'),
  ('2024-04-20', 'GBP', 'UAH', 49.3858, 'nbu'),
  ('2024-04-20', 'USD', 'UAH', 39.6037, 'nbu'),
  ('2024-04-20', 'EUR', 'UAH', 42.2789, 'nbu'),
  ('2024-04-20', 'PLN', 'UAH', 9.769, 'nbu'),
  ('2024-06-02', 'GBP', 'UAH', 51.4756, 'nbu'),
  ('2024-06-02', 'USD', 'UAH', 40.5001, 'nbu'),
  ('2024-06-02', 'EUR', 'UAH', 43.8171, 'nbu'),
  ('2024-06-02', 'PLN', 'UAH', 10.2301, 'nbu'),
  ('2024-08-05', 'GBP', 'UAH', 52.5207, 'nbu'),
  ('2024-08-05', 'USD', 'UAH', 41.225, 'nbu'),
  ('2024-08-05', 'EUR', 'UAH', 44.6467, 'nbu'),
  ('2024-08-05', 'PLN', 'UAH', 10.4077, 'nbu'),
  ('2025-01-28', 'GBP', 'UAH', 52.5041, 'nbu'),
  ('2025-01-28', 'USD', 'UAH', 41.9479, 'nbu'),
  ('2025-01-28', 'EUR', 'UAH', 44.146, 'nbu'),
  ('2025-01-28', 'PLN', 'UAH', 10.4629, 'nbu'),
  ('2025-03-04', 'GBP', 'UAH', 52.7625, 'nbu'),
  ('2025-03-04', 'USD', 'UAH', 41.5911, 'nbu'),
  ('2025-03-04', 'EUR', 'UAH', 43.5417, 'nbu'),
  ('2025-03-04', 'PLN', 'UAH', 10.4382, 'nbu'),
  ('2025-05-23', 'GBP', 'UAH', 55.6929, 'nbu'),
  ('2025-05-23', 'USD', 'UAH', 41.4999, 'nbu'),
  ('2025-05-23', 'EUR', 'UAH', 46.9281, 'nbu'),
  ('2025-05-23', 'PLN', 'UAH', 11.0537, 'nbu'),
  ('2025-07-01', 'GBP', 'UAH', 57.2704, 'nbu'),
  ('2025-07-01', 'USD', 'UAH', 41.7788, 'nbu'),
  ('2025-07-01', 'EUR', 'UAH', 48.9856, 'nbu'),
  ('2025-07-01', 'PLN', 'UAH', 11.5478, 'nbu'),
  ('2025-11-21', 'GBP', 'UAH', 55.0417, 'nbu'),
  ('2025-11-21', 'USD', 'UAH', 42.1549, 'nbu'),
  ('2025-11-21', 'EUR', 'UAH', 48.5161, 'nbu'),
  ('2025-11-21', 'PLN', 'UAH', 11.4642, 'nbu'),
  ('2026-02-01', 'GBP', 'UAH', 59.1692, 'nbu'),
  ('2026-02-01', 'USD', 'UAH', 42.8483, 'nbu'),
  ('2026-02-01', 'EUR', 'UAH', 51.2423, 'nbu'),
  ('2026-02-01', 'PLN', 'UAH', 12.1898, 'nbu'),
  ('2026-05-03', 'GBP', 'UAH', 59.4204, 'nbu'),
  ('2026-05-03', 'USD', 'UAH', 43.963, 'nbu'),
  ('2026-05-03', 'EUR', 'UAH', 51.4587, 'nbu'),
  ('2026-05-03', 'PLN', 'UAH', 12.0784, 'nbu'),
  ('2026-08-17', 'GBP', 'UAH', 60.5124, 'nbu'),
  ('2026-08-17', 'USD', 'UAH', 44.7061, 'nbu'),
  ('2026-08-17', 'EUR', 'UAH', 51.708, 'nbu'),
  ('2026-08-17', 'PLN', 'UAH', 12.0022, 'nbu'),
  ('2024-04-16', 'EUR', 'GBP', 0.8544, 'ecb'),
  ('2024-04-17', 'EUR', 'GBP', 0.854, 'ecb'),
  ('2024-04-18', 'EUR', 'GBP', 0.85628, 'ecb'),
  ('2024-04-19', 'EUR', 'GBP', 0.8562, 'ecb'),
  ('2024-04-15', 'EUR', 'PLN', 4.2938, 'ecb'),
  ('2024-04-16', 'EUR', 'PLN', 4.3435, 'ecb'),
  ('2024-04-17', 'EUR', 'PLN', 4.3508, 'ecb'),
  ('2024-04-18', 'EUR', 'PLN', 4.3255, 'ecb'),
  ('2024-04-19', 'EUR', 'PLN', 4.33, 'ecb'),
  ('2024-04-15', 'EUR', 'USD', 1.0656, 'ecb'),
  ('2024-04-16', 'EUR', 'USD', 1.0637, 'ecb'),
  ('2024-04-17', 'EUR', 'USD', 1.0638, 'ecb'),
  ('2024-04-18', 'EUR', 'USD', 1.0679, 'ecb'),
  ('2024-04-19', 'EUR', 'USD', 1.0653, 'ecb'),
  ('2024-05-27', 'EUR', 'GBP', 0.8507, 'ecb'),
  ('2024-05-28', 'EUR', 'GBP', 0.8508, 'ecb'),
  ('2024-05-29', 'EUR', 'GBP', 0.8513, 'ecb'),
  ('2024-05-30', 'EUR', 'GBP', 0.85105, 'ecb'),
  ('2024-05-31', 'EUR', 'GBP', 0.85365, 'ecb'),
  ('2024-05-27', 'EUR', 'PLN', 4.2553, 'ecb'),
  ('2024-05-28', 'EUR', 'PLN', 4.2483, 'ecb'),
  ('2024-05-29', 'EUR', 'PLN', 4.264, 'ecb'),
  ('2024-05-30', 'EUR', 'PLN', 4.2848, 'ecb'),
  ('2024-05-31', 'EUR', 'PLN', 4.2645, 'ecb'),
  ('2024-05-27', 'EUR', 'USD', 1.0843, 'ecb'),
  ('2024-05-28', 'EUR', 'USD', 1.0882, 'ecb'),
  ('2024-05-29', 'EUR', 'USD', 1.0857, 'ecb'),
  ('2024-05-30', 'EUR', 'USD', 1.0815, 'ecb'),
  ('2024-05-31', 'EUR', 'USD', 1.0852, 'ecb'),
  ('2024-07-29', 'EUR', 'GBP', 0.84345, 'ecb'),
  ('2024-07-30', 'EUR', 'GBP', 0.8426, 'ecb'),
  ('2024-07-31', 'EUR', 'GBP', 0.8438, 'ecb'),
  ('2024-08-01', 'EUR', 'GBP', 0.84328, 'ecb'),
  ('2024-08-02', 'EUR', 'GBP', 0.85, 'ecb'),
  ('2024-08-05', 'EUR', 'GBP', 0.85878, 'ecb'),
  ('2024-07-29', 'EUR', 'PLN', 4.2938, 'ecb'),
  ('2024-07-30', 'EUR', 'PLN', 4.2838, 'ecb'),
  ('2024-07-31', 'EUR', 'PLN', 4.2908, 'ecb'),
  ('2024-08-01', 'EUR', 'PLN', 4.2958, 'ecb'),
  ('2024-08-02', 'EUR', 'PLN', 4.289, 'ecb'),
  ('2024-08-05', 'EUR', 'PLN', 4.3128, 'ecb'),
  ('2024-07-29', 'EUR', 'USD', 1.0817, 'ecb'),
  ('2024-07-30', 'EUR', 'USD', 1.0824, 'ecb'),
  ('2024-07-31', 'EUR', 'USD', 1.0828, 'ecb'),
  ('2024-08-01', 'EUR', 'USD', 1.0789, 'ecb'),
  ('2024-08-02', 'EUR', 'USD', 1.0835, 'ecb'),
  ('2024-08-05', 'EUR', 'USD', 1.0966, 'ecb'),
  ('2025-01-21', 'EUR', 'GBP', 0.84553, 'ecb'),
  ('2025-01-22', 'EUR', 'GBP', 0.84466, 'ecb'),
  ('2025-01-23', 'EUR', 'GBP', 0.84468, 'ecb'),
  ('2025-01-24', 'EUR', 'GBP', 0.84413, 'ecb'),
  ('2025-01-27', 'EUR', 'GBP', 0.84106, 'ecb'),
  ('2025-01-28', 'EUR', 'GBP', 0.83868, 'ecb'),
  ('2025-01-21', 'EUR', 'PLN', 4.2538, 'ecb'),
  ('2025-01-22', 'EUR', 'PLN', 4.23, 'ecb'),
  ('2025-01-23', 'EUR', 'PLN', 4.211, 'ecb'),
  ('2025-01-24', 'EUR', 'PLN', 4.2138, 'ecb'),
  ('2025-01-27', 'EUR', 'PLN', 4.2193, 'ecb'),
  ('2025-01-28', 'EUR', 'PLN', 4.2078, 'ecb'),
  ('2025-01-21', 'EUR', 'USD', 1.0357, 'ecb'),
  ('2025-01-22', 'EUR', 'USD', 1.0443, 'ecb'),
  ('2025-01-23', 'EUR', 'USD', 1.0404, 'ecb'),
  ('2025-01-24', 'EUR', 'USD', 1.0472, 'ecb'),
  ('2025-01-27', 'EUR', 'USD', 1.053, 'ecb'),
  ('2025-01-28', 'EUR', 'USD', 1.0421, 'ecb'),
  ('2025-02-25', 'EUR', 'GBP', 0.82908, 'ecb'),
  ('2025-02-26', 'EUR', 'GBP', 0.82868, 'ecb'),
  ('2025-02-27', 'EUR', 'GBP', 0.82673, 'ecb'),
  ('2025-02-28', 'EUR', 'GBP', 0.82608, 'ecb'),
  ('2025-03-03', 'EUR', 'GBP', 0.8253, 'ecb'),
  ('2025-03-04', 'EUR', 'GBP', 0.82788, 'ecb'),
  ('2025-02-25', 'EUR', 'PLN', 4.1393, 'ecb'),
  ('2025-02-26', 'EUR', 'PLN', 4.144, 'ecb'),
  ('2025-02-27', 'EUR', 'PLN', 4.1308, 'ecb'),
  ('2025-02-28', 'EUR', 'PLN', 4.1503, 'ecb'),
  ('2025-03-03', 'EUR', 'PLN', 4.1708, 'ecb'),
  ('2025-03-04', 'EUR', 'PLN', 4.1593, 'ecb'),
  ('2025-02-25', 'EUR', 'USD', 1.0497, 'ecb'),
  ('2025-02-26', 'EUR', 'USD', 1.0487, 'ecb'),
  ('2025-02-27', 'EUR', 'USD', 1.0477, 'ecb'),
  ('2025-02-28', 'EUR', 'USD', 1.0411, 'ecb'),
  ('2025-03-03', 'EUR', 'USD', 1.0465, 'ecb'),
  ('2025-03-04', 'EUR', 'USD', 1.0557, 'ecb'),
  ('2025-05-16', 'EUR', 'GBP', 0.8427, 'ecb'),
  ('2025-05-19', 'EUR', 'GBP', 0.8419, 'ecb'),
  ('2025-05-20', 'EUR', 'GBP', 0.8418, 'ecb'),
  ('2025-05-21', 'EUR', 'GBP', 0.8446, 'ecb'),
  ('2025-05-22', 'EUR', 'GBP', 0.8427, 'ecb'),
  ('2025-05-23', 'EUR', 'GBP', 0.8382, 'ecb'),
  ('2025-05-16', 'EUR', 'PLN', 4.26, 'ecb'),
  ('2025-05-19', 'EUR', 'PLN', 4.2688, 'ecb'),
  ('2025-05-20', 'EUR', 'PLN', 4.2488, 'ecb'),
  ('2025-05-21', 'EUR', 'PLN', 4.242, 'ecb'),
  ('2025-05-22', 'EUR', 'PLN', 4.246, 'ecb'),
  ('2025-05-23', 'EUR', 'PLN', 4.2603, 'ecb'),
  ('2025-05-16', 'EUR', 'USD', 1.1194, 'ecb'),
  ('2025-05-19', 'EUR', 'USD', 1.1262, 'ecb'),
  ('2025-05-20', 'EUR', 'USD', 1.1241, 'ecb'),
  ('2025-05-21', 'EUR', 'USD', 1.1321, 'ecb'),
  ('2025-05-22', 'EUR', 'USD', 1.1309, 'ecb'),
  ('2025-05-23', 'EUR', 'USD', 1.1301, 'ecb'),
  ('2025-06-24', 'EUR', 'GBP', 0.8527, 'ecb'),
  ('2025-06-25', 'EUR', 'GBP', 0.8526, 'ecb'),
  ('2025-06-26', 'EUR', 'GBP', 0.8535, 'ecb'),
  ('2025-06-27', 'EUR', 'GBP', 0.8529, 'ecb'),
  ('2025-06-30', 'EUR', 'GBP', 0.8555, 'ecb'),
  ('2025-07-01', 'EUR', 'GBP', 0.8588, 'ecb'),
  ('2025-06-24', 'EUR', 'PLN', 4.2538, 'ecb'),
  ('2025-06-25', 'EUR', 'PLN', 4.2478, 'ecb'),
  ('2025-06-26', 'EUR', 'PLN', 4.2468, 'ecb'),
  ('2025-06-27', 'EUR', 'PLN', 4.2378, 'ecb'),
  ('2025-06-30', 'EUR', 'PLN', 4.2423, 'ecb'),
  ('2025-07-01', 'EUR', 'PLN', 4.2443, 'ecb'),
  ('2025-06-24', 'EUR', 'USD', 1.1607, 'ecb'),
  ('2025-06-25', 'EUR', 'USD', 1.1598, 'ecb'),
  ('2025-06-26', 'EUR', 'USD', 1.1695, 'ecb'),
  ('2025-06-27', 'EUR', 'USD', 1.1704, 'ecb'),
  ('2025-06-30', 'EUR', 'USD', 1.172, 'ecb'),
  ('2025-07-01', 'EUR', 'USD', 1.181, 'ecb'),
  ('2025-11-14', 'EUR', 'GBP', 0.8846, 'ecb'),
  ('2025-11-17', 'EUR', 'GBP', 0.8795, 'ecb'),
  ('2025-11-18', 'EUR', 'GBP', 0.8821, 'ecb'),
  ('2025-11-19', 'EUR', 'GBP', 0.8827, 'ecb'),
  ('2025-11-20', 'EUR', 'GBP', 0.8815, 'ecb'),
  ('2025-11-21', 'EUR', 'GBP', 0.8803, 'ecb'),
  ('2025-11-14', 'EUR', 'PLN', 4.2328, 'ecb'),
  ('2025-11-17', 'EUR', 'PLN', 4.2228, 'ecb'),
  ('2025-11-18', 'EUR', 'PLN', 4.244, 'ecb'),
  ('2025-11-19', 'EUR', 'PLN', 4.2283, 'ecb'),
  ('2025-11-20', 'EUR', 'PLN', 4.232, 'ecb'),
  ('2025-11-21', 'EUR', 'PLN', 4.2448, 'ecb'),
  ('2025-11-14', 'EUR', 'USD', 1.1648, 'ecb'),
  ('2025-11-17', 'EUR', 'USD', 1.1593, 'ecb'),
  ('2025-11-18', 'EUR', 'USD', 1.159, 'ecb'),
  ('2025-11-19', 'EUR', 'USD', 1.1583, 'ecb'),
  ('2025-11-20', 'EUR', 'USD', 1.1514, 'ecb'),
  ('2025-11-21', 'EUR', 'USD', 1.152, 'ecb'),
  ('2026-01-26', 'EUR', 'GBP', 0.8675, 'ecb'),
  ('2026-01-27', 'EUR', 'GBP', 0.8683, 'ecb'),
  ('2026-01-28', 'EUR', 'GBP', 0.8685, 'ecb'),
  ('2026-01-29', 'EUR', 'GBP', 0.8662, 'ecb'),
  ('2026-01-30', 'EUR', 'GBP', 0.8662, 'ecb'),
  ('2026-01-26', 'EUR', 'PLN', 4.2085, 'ecb'),
  ('2026-01-27', 'EUR', 'PLN', 4.2023, 'ecb'),
  ('2026-01-28', 'EUR', 'PLN', 4.2028, 'ecb'),
  ('2026-01-29', 'EUR', 'PLN', 4.2033, 'ecb'),
  ('2026-01-30', 'EUR', 'PLN', 4.2073, 'ecb'),
  ('2026-01-26', 'EUR', 'USD', 1.1836, 'ecb'),
  ('2026-01-27', 'EUR', 'USD', 1.1929, 'ecb'),
  ('2026-01-28', 'EUR', 'USD', 1.1974, 'ecb'),
  ('2026-01-29', 'EUR', 'USD', 1.1968, 'ecb'),
  ('2026-01-30', 'EUR', 'USD', 1.1919, 'ecb'),
  ('2026-04-27', 'EUR', 'GBP', 0.8658, 'ecb'),
  ('2026-04-28', 'EUR', 'GBP', 0.86715, 'ecb'),
  ('2026-04-29', 'EUR', 'GBP', 0.86643, 'ecb'),
  ('2026-04-30', 'EUR', 'GBP', 0.86625, 'ecb'),
  ('2026-04-27', 'EUR', 'PLN', 4.2443, 'ecb'),
  ('2026-04-28', 'EUR', 'PLN', 4.2478, 'ecb'),
  ('2026-04-29', 'EUR', 'PLN', 4.2518, 'ecb'),
  ('2026-04-30', 'EUR', 'PLN', 4.2605, 'ecb'),
  ('2026-04-27', 'EUR', 'USD', 1.1749, 'ecb'),
  ('2026-04-28', 'EUR', 'USD', 1.168, 'ecb'),
  ('2026-04-29', 'EUR', 'USD', 1.1706, 'ecb'),
  ('2026-04-30', 'EUR', 'USD', 1.1702, 'ecb'),
  ('2026-08-10', 'EUR', 'GBP', 0.85565, 'ecb'),
  ('2026-08-11', 'EUR', 'GBP', 0.85483, 'ecb'),
  ('2026-08-12', 'EUR', 'GBP', 0.85358, 'ecb'),
  ('2026-08-13', 'EUR', 'GBP', 0.8549, 'ecb'),
  ('2026-08-14', 'EUR', 'GBP', 0.8545, 'ecb'),
  ('2026-08-17', 'EUR', 'GBP', 0.855, 'ecb'),
  ('2026-08-10', 'EUR', 'PLN', 4.2993, 'ecb'),
  ('2026-08-11', 'EUR', 'PLN', 4.2965, 'ecb'),
  ('2026-08-12', 'EUR', 'PLN', 4.3043, 'ecb'),
  ('2026-08-13', 'EUR', 'PLN', 4.3048, 'ecb'),
  ('2026-08-14', 'EUR', 'PLN', 4.3068, 'ecb'),
  ('2026-08-17', 'EUR', 'PLN', 4.3063, 'ecb'),
  ('2026-08-10', 'EUR', 'USD', 1.1555, 'ecb'),
  ('2026-08-11', 'EUR', 'USD', 1.154, 'ecb'),
  ('2026-08-12', 'EUR', 'USD', 1.1545, 'ecb'),
  ('2026-08-13', 'EUR', 'USD', 1.1534, 'ecb'),
  ('2026-08-14', 'EUR', 'USD', 1.1567, 'ecb'),
  ('2026-08-17', 'EUR', 'USD', 1.1593, 'ecb'),
  ('2026-10-05', 'GBP', 'UAH', 59.4068, 'nbu'),
  ('2026-10-05', 'USD', 'UAH', 44.9857, 'nbu'),
  ('2026-10-05', 'EUR', 'UAH', 50.5333, 'nbu'),
  ('2026-10-05', 'PLN', 'UAH', 11.5442, 'nbu')
on conflict do nothing;

-- ─── Mock data per user ─────────────────────────────────────────────────────
-- Lives in a `dev` schema so PostgREST doesn't expose it as an RPC.
create schema if not exists dev;

create or replace function dev.seed_user(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid        uuid;
  w_card     uuid;
  w_cash     uuid;
  w_savings  uuid;
  s_old      uuid;
  s_new      uuid;
  c_trip     uuid;
  c_fund     uuid;
  mp         uuid;
  v_month    date;
  i          integer;
begin
  select id into uid from auth.users where email = p_email;
  if uid is null then
    raise exception 'No local user with email %. Sign in on localhost first.', p_email;
  end if;

  -- wipe previous mock data so this is re-runnable
  delete from monthly_plans        where user_id = uid;
  delete from snapshot_allocations where user_id = uid;
  delete from wealth_snapshots     where user_id = uid;
  delete from claims               where user_id = uid;
  delete from transactions         where user_id = uid;
  delete from wallets              where user_id = uid;

  -- wallets
  insert into wallets (user_id, name, type, currency, is_primary)
    values (uid, 'Main card', 'bank', 'UAH', true) returning id into w_card;
  insert into wallets (user_id, name, type, currency)
    values (uid, 'Cash', 'cash', 'UAH') returning id into w_cash;
  insert into wallets (user_id, name, type, currency)
    values (uid, 'Savings', 'savings', 'EUR') returning id into w_savings;

  -- ~90 days of expenses: 1–3 per day, random category/amount
  insert into transactions (user_id, wallet_id, type, amount, description, label, date, category_id, source)
  select uid,
         case when random() < 0.8 then w_card else w_cash end,
         'expense',
         round((50 + random() * random() * 3000)::numeric, 2),
         c.name || ' (mock)',
         (array['Personal','Personal','Personal','Family','Business'])[1 + floor(random() * 5)::int]::transaction_label,
         d + (random() * interval '14 hours') + interval '8 hours',
         c.id,
         'manual'
  from generate_series(current_date - 90, current_date, interval '1 day') d
  cross join lateral generate_series(1, 1 + floor(random() * 3)::int) n
  cross join lateral (
    select id, name from categories
    where name not in ('Salary', 'Transfers') and d is not null  -- reference d → re-pick per row
    order by random() limit 1
  ) c;

  -- monthly salary
  insert into transactions (user_id, wallet_id, type, amount, description, label, date, category_id, source)
  select uid, w_card, 'income', 85000, 'Salary (mock)', 'Personal', m + interval '4 days 10 hours',
         (select id from categories where name = 'Salary'), 'manual'
  from generate_series(date_trunc('month', current_date) - interval '3 months',
                       date_trunc('month', current_date), interval '1 month') m
  where m + interval '4 days' <= now();

  -- claims (goals)
  insert into claims (user_id, name, target_amount, target_currency, target_date)
    values (uid, 'Japan trip', 4000, 'EUR', current_date + 200) returning id into c_trip;
  insert into claims (user_id, name, target_amount, target_currency)
    values (uid, 'Emergency fund', 6000, 'EUR') returning id into c_fund;

  -- two wealth snapshots (display currency EUR; converted = amount * rate)
  insert into wealth_snapshots (user_id, snapshot_date, note)
    values (uid, current_date - 30, 'Mock: last month') returning id into s_old;
  insert into snapshot_lines (user_id, snapshot_id, label, type, currency, amount, rate, converted_amount, is_liquid, sort_order, rate_source) values
    (uid, s_old, 'Main card',  'bank',       'UAH', 42000, 0.022, 924,  true,  0, 'mock'),
    (uid, s_old, 'Cash',       'cash',       'UAH', 6000,  0.022, 132,  true,  1, 'mock'),
    (uid, s_old, 'Savings',    'savings',    'EUR', 5200,  1,     5200, true,  2, 'mock'),
    (uid, s_old, 'ETF',        'investment', 'USD', 3000,  0.92,  2760, false, 3, 'mock');
  insert into snapshot_allocations (user_id, snapshot_id, claim_id, amount) values
    (uid, s_old, c_fund, 3000),
    (uid, s_old, c_trip, 1000);

  insert into wealth_snapshots (user_id, snapshot_date, note)
    values (uid, current_date, 'Mock: today') returning id into s_new;
  insert into snapshot_lines (user_id, snapshot_id, label, type, currency, amount, rate, converted_amount, is_liquid, sort_order, rate_source) values
    (uid, s_new, 'Main card',  'bank',       'UAH', 51000, 0.022, 1122, true,  0, 'mock'),
    (uid, s_new, 'Cash',       'cash',       'UAH', 4500,  0.022, 99,   true,  1, 'mock'),
    (uid, s_new, 'Savings',    'savings',    'EUR', 5800,  1,     5800, true,  2, 'mock'),
    (uid, s_new, 'ETF',        'investment', 'USD', 3300,  0.92,  3036, false, 3, 'mock'),
    (uid, s_new, 'BTC',        'crypto',     'USD', 900,   0.92,  828,  false, 4, 'mock');
  insert into snapshot_allocations (user_id, snapshot_id, claim_id, amount) values
    (uid, s_new, c_fund, 3500),
    (uid, s_new, c_trip, 1500);

  -- monthly plans for the two months before this one, both checked off.
  -- The current month is left empty so "New month" can copy the last one.
  for i in 1..2 loop
    v_month := (date_trunc('month', current_date) - make_interval(months => 3 - i))::date;
    insert into monthly_plans (user_id, month, currency, note, closed_at)
      values (uid, v_month, 'EUR', 'Mock plan', v_month + interval '1 month')
      returning id into mp;
    insert into plan_incomes (user_id, plan_id, label, currency, amount, rate, rate_source, converted_amount, sort_order) values
      (uid, mp, 'Salary', 'EUR', 3000, 1, null, 3000, 0),
      (uid, mp, 'Freelance', 'UAH', 10000 * i, 0.02, 'mock', 200 * i, 1);
    insert into plan_lines (user_id, plan_id, label, kind, value, flow, actual_amount, sort_order) values
      (uid, mp, 'Rent',        'fixed',   800, 'spend', 800,             0),
      (uid, mp, 'Family',      'fixed',   300, 'spend', 300,             1),
      (uid, mp, 'Me',          'percent', 10,  'spend', 250 + 80 * i,    2),
      (uid, mp, 'Sport & health', 'fixed', 120, 'spend', 95 + 40 * i,    3),
      (uid, mp, 'Groceries',   'fixed',   400, 'spend', 430 - 20 * i,    4),
      (uid, mp, 'Investments', 'percent', 15,  'save',  450 + 30 * i,    5);
  end loop;
end;
$$;

-- Auto-seed every new local user on first sign-in. Errors are swallowed so a
-- seed bug can never block login.
create or replace function dev.on_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform dev.seed_user(new.email);
  exception when others then
    raise warning 'dev.seed_user failed for %: %', new.email, sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists dev_seed_on_signup on auth.users;
create trigger dev_seed_on_signup
  after insert on auth.users
  for each row execute function dev.on_new_user();
