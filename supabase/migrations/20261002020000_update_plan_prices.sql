-- Novos preços: Pró Mensal R$ 34,90/mês e Fundador Vitalício R$ 110,90.
-- Assinaturas mensais já criadas no Mercado Pago mantêm o valor antigo.
update public.subscription_plans set price_cents = 3490 where id = 'pro_monthly';
update public.subscription_plans set price_cents = 11090 where id = 'founder_lifetime';
