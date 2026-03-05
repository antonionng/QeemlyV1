-- Keep industry_market_signals synchronized for non-benchmark domains.
-- Adds trigger-based normalization for compliance, relocation, billing, and subscriptions.

CREATE OR REPLACE FUNCTION upsert_compliance_signal_rows()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  period_date DATE := COALESCE(DATE(NEW.updated_at), CURRENT_DATE);
  risks_count NUMERIC := COALESCE(jsonb_array_length(NEW.risk_items), 0);
BEGIN
  INSERT INTO industry_market_signals (
    workspace_id, source_slug, domain, industry, metric_key, metric_value_numeric,
    unit, currency, geo_region, period_start, observed_at, confidence, metadata, updated_at
  )
  VALUES
    (
      NEW.workspace_id, 'compliance_snapshots', 'compliance', 'general', 'compliance_score',
      NEW.compliance_score, 'score', NULL, 'GCC', period_date, now(), 'high', '{}'::jsonb, now()
    ),
    (
      NEW.workspace_id, 'compliance_snapshots', 'compliance', 'general', 'open_risk_count',
      risks_count, 'count', NULL, 'GCC', period_date, now(), 'high', '{}'::jsonb, now()
    )
  ON CONFLICT (workspace_id, source_slug, domain, industry, metric_key, period_start, role_id, location_id, level_id)
  DO UPDATE SET
    metric_value_numeric = EXCLUDED.metric_value_numeric,
    observed_at = EXCLUDED.observed_at,
    confidence = EXCLUDED.confidence,
    metadata = EXCLUDED.metadata,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compliance_snapshots_to_signals ON compliance_snapshots;
CREATE TRIGGER trg_compliance_snapshots_to_signals
AFTER INSERT OR UPDATE ON compliance_snapshots
FOR EACH ROW
EXECUTE FUNCTION upsert_compliance_signal_rows();

CREATE OR REPLACE FUNCTION upsert_relocation_signal_rows()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  period_date DATE := COALESCE(NEW.effective_date, CURRENT_DATE);
  monthly_total NUMERIC := COALESCE(NEW.rent, 0) + COALESCE(NEW.transport, 0) + COALESCE(NEW.food, 0) + COALESCE(NEW.utilities, 0) + COALESCE(NEW.other, 0);
BEGIN
  INSERT INTO industry_market_signals (
    workspace_id, source_slug, domain, industry, metric_key, metric_value_numeric,
    unit, currency, location_id, geo_region, period_start, observed_at, confidence, metadata, updated_at
  )
  SELECT
    w.id, 'relocation_city_costs', 'relocation', 'general', 'monthly_total_cost', monthly_total,
    'monthly_cost', NEW.currency, NEW.city_id, NEW.region, period_date, now(), 'medium',
    jsonb_build_object('city', NEW.name, 'country', NEW.country, 'col_index', NEW.col_index), now()
  FROM workspaces w
  ON CONFLICT (workspace_id, source_slug, domain, industry, metric_key, period_start, role_id, location_id, level_id)
  DO UPDATE SET
    metric_value_numeric = EXCLUDED.metric_value_numeric,
    currency = EXCLUDED.currency,
    geo_region = EXCLUDED.geo_region,
    observed_at = EXCLUDED.observed_at,
    confidence = EXCLUDED.confidence,
    metadata = EXCLUDED.metadata,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_relocation_city_costs_to_signals ON relocation_city_costs;
CREATE TRIGGER trg_relocation_city_costs_to_signals
AFTER INSERT OR UPDATE ON relocation_city_costs
FOR EACH ROW
EXECUTE FUNCTION upsert_relocation_signal_rows();

CREATE OR REPLACE FUNCTION upsert_billing_invoice_signal_rows()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  period_date DATE := COALESCE(DATE(NEW.issued_at), CURRENT_DATE);
BEGIN
  INSERT INTO industry_market_signals (
    workspace_id, source_slug, domain, industry, metric_key, metric_value_numeric,
    unit, currency, geo_region, period_start, observed_at, confidence, metadata, updated_at
  )
  VALUES (
    NEW.workspace_id, 'billing_invoices', 'billing', 'general', 'invoice_amount',
    NEW.amount, 'currency_amount', NEW.currency, 'GCC', period_date, now(), 'high',
    jsonb_build_object('invoice_number', NEW.invoice_number, 'status', NEW.status), now()
  )
  ON CONFLICT (workspace_id, source_slug, domain, industry, metric_key, period_start, role_id, location_id, level_id)
  DO UPDATE SET
    metric_value_numeric = EXCLUDED.metric_value_numeric,
    currency = EXCLUDED.currency,
    observed_at = EXCLUDED.observed_at,
    confidence = EXCLUDED.confidence,
    metadata = EXCLUDED.metadata,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_billing_invoices_to_signals ON billing_invoices;
CREATE TRIGGER trg_billing_invoices_to_signals
AFTER INSERT OR UPDATE ON billing_invoices
FOR EACH ROW
EXECUTE FUNCTION upsert_billing_invoice_signal_rows();

CREATE OR REPLACE FUNCTION upsert_subscription_signal_rows()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  period_date DATE := CURRENT_DATE;
  resolved_price NUMERIC := NULL;
  resolved_currency TEXT := 'AED';
BEGIN
  SELECT
    CASE
      WHEN NEW.billing_cycle = 'annual' THEN bp.annual_price
      ELSE bp.monthly_price
    END,
    bp.currency
  INTO resolved_price, resolved_currency
  FROM billing_plans bp
  WHERE bp.id = NEW.plan_id
  LIMIT 1;

  IF resolved_price IS NULL THEN
    resolved_price := 0;
  END IF;

  INSERT INTO industry_market_signals (
    workspace_id, source_slug, domain, industry, metric_key, metric_value_numeric,
    unit, currency, geo_region, period_start, observed_at, confidence, metadata, updated_at
  )
  VALUES (
    NEW.workspace_id, 'workspace_billing_subscriptions', 'billing', 'general', 'subscription_value',
    resolved_price, 'currency_amount', resolved_currency, 'GCC', period_date, now(), 'high',
    jsonb_build_object('status', NEW.status, 'billing_cycle', NEW.billing_cycle), now()
  )
  ON CONFLICT (workspace_id, source_slug, domain, industry, metric_key, period_start, role_id, location_id, level_id)
  DO UPDATE SET
    metric_value_numeric = EXCLUDED.metric_value_numeric,
    currency = EXCLUDED.currency,
    observed_at = EXCLUDED.observed_at,
    confidence = EXCLUDED.confidence,
    metadata = EXCLUDED.metadata,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspace_subscriptions_to_signals ON workspace_billing_subscriptions;
CREATE TRIGGER trg_workspace_subscriptions_to_signals
AFTER INSERT OR UPDATE ON workspace_billing_subscriptions
FOR EACH ROW
EXECUTE FUNCTION upsert_subscription_signal_rows();

-- Backfill existing rows so current tenants get normalized cross-domain signals immediately.
INSERT INTO industry_market_signals (
  workspace_id, source_slug, domain, industry, metric_key, metric_value_numeric, unit,
  geo_region, period_start, observed_at, confidence, metadata, updated_at
)
SELECT
  cs.workspace_id,
  'compliance_snapshots',
  'compliance',
  'general',
  'compliance_score',
  cs.compliance_score,
  'score',
  'GCC',
  COALESCE(DATE(cs.updated_at), CURRENT_DATE),
  now(),
  'high',
  '{}'::jsonb,
  now()
FROM compliance_snapshots cs
ON CONFLICT (workspace_id, source_slug, domain, industry, metric_key, period_start, role_id, location_id, level_id)
DO UPDATE SET
  metric_value_numeric = EXCLUDED.metric_value_numeric,
  observed_at = EXCLUDED.observed_at,
  updated_at = now();

INSERT INTO industry_market_signals (
  workspace_id, source_slug, domain, industry, metric_key, metric_value_numeric, unit,
  geo_region, period_start, observed_at, confidence, metadata, updated_at
)
SELECT
  cs.workspace_id,
  'compliance_snapshots',
  'compliance',
  'general',
  'open_risk_count',
  COALESCE(jsonb_array_length(cs.risk_items), 0),
  'count',
  'GCC',
  COALESCE(DATE(cs.updated_at), CURRENT_DATE),
  now(),
  'high',
  '{}'::jsonb,
  now()
FROM compliance_snapshots cs
ON CONFLICT (workspace_id, source_slug, domain, industry, metric_key, period_start, role_id, location_id, level_id)
DO UPDATE SET
  metric_value_numeric = EXCLUDED.metric_value_numeric,
  observed_at = EXCLUDED.observed_at,
  updated_at = now();

INSERT INTO industry_market_signals (
  workspace_id, source_slug, domain, industry, metric_key, metric_value_numeric, unit, currency,
  location_id, geo_region, period_start, observed_at, confidence, metadata, updated_at
)
SELECT
  w.id,
  'relocation_city_costs',
  'relocation',
  'general',
  'monthly_total_cost',
  COALESCE(rcc.rent, 0) + COALESCE(rcc.transport, 0) + COALESCE(rcc.food, 0) + COALESCE(rcc.utilities, 0) + COALESCE(rcc.other, 0),
  'monthly_cost',
  rcc.currency,
  rcc.city_id,
  rcc.region,
  COALESCE(rcc.effective_date, CURRENT_DATE),
  now(),
  'medium',
  jsonb_build_object('city', rcc.name, 'country', rcc.country, 'col_index', rcc.col_index),
  now()
FROM relocation_city_costs rcc
CROSS JOIN workspaces w
ON CONFLICT (workspace_id, source_slug, domain, industry, metric_key, period_start, role_id, location_id, level_id)
DO UPDATE SET
  metric_value_numeric = EXCLUDED.metric_value_numeric,
  currency = EXCLUDED.currency,
  observed_at = EXCLUDED.observed_at,
  metadata = EXCLUDED.metadata,
  updated_at = now();

INSERT INTO industry_market_signals (
  workspace_id, source_slug, domain, industry, metric_key, metric_value_numeric, unit, currency,
  geo_region, period_start, observed_at, confidence, metadata, updated_at
)
SELECT
  bi.workspace_id,
  'billing_invoices',
  'billing',
  'general',
  'invoice_amount',
  bi.amount,
  'currency_amount',
  bi.currency,
  'GCC',
  COALESCE(DATE(bi.issued_at), CURRENT_DATE),
  now(),
  'high',
  jsonb_build_object('invoice_number', bi.invoice_number, 'status', bi.status),
  now()
FROM billing_invoices bi
ON CONFLICT (workspace_id, source_slug, domain, industry, metric_key, period_start, role_id, location_id, level_id)
DO UPDATE SET
  metric_value_numeric = EXCLUDED.metric_value_numeric,
  currency = EXCLUDED.currency,
  observed_at = EXCLUDED.observed_at,
  metadata = EXCLUDED.metadata,
  updated_at = now();

INSERT INTO industry_market_signals (
  workspace_id, source_slug, domain, industry, metric_key, metric_value_numeric, unit, currency,
  geo_region, period_start, observed_at, confidence, metadata, updated_at
)
SELECT
  wbs.workspace_id,
  'workspace_billing_subscriptions',
  'billing',
  'general',
  'subscription_value',
  CASE WHEN wbs.billing_cycle = 'annual' THEN COALESCE(bp.annual_price, 0) ELSE COALESCE(bp.monthly_price, 0) END,
  'currency_amount',
  COALESCE(bp.currency, 'AED'),
  'GCC',
  CURRENT_DATE,
  now(),
  'high',
  jsonb_build_object('status', wbs.status, 'billing_cycle', wbs.billing_cycle),
  now()
FROM workspace_billing_subscriptions wbs
LEFT JOIN billing_plans bp ON bp.id = wbs.plan_id
ON CONFLICT (workspace_id, source_slug, domain, industry, metric_key, period_start, role_id, location_id, level_id)
DO UPDATE SET
  metric_value_numeric = EXCLUDED.metric_value_numeric,
  currency = EXCLUDED.currency,
  observed_at = EXCLUDED.observed_at,
  metadata = EXCLUDED.metadata,
  updated_at = now();
