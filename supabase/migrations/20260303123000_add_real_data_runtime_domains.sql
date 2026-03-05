-- Real-data runtime domains for compliance, relocation, billing, and public benchmark pages.

CREATE TABLE IF NOT EXISTS compliance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  compliance_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  risk_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  pay_equity_kpis JSONB NOT NULL DEFAULT '[]'::jsonb,
  equity_levels JSONB NOT NULL DEFAULT '[]'::jsonb,
  policy_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  regulatory_updates JSONB NOT NULL DEFAULT '[]'::jsonb,
  deadline_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  visa_stats JSONB NOT NULL DEFAULT '[]'::jsonb,
  visa_timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  document_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  audit_log_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id)
);

ALTER TABLE compliance_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view compliance snapshots in workspace" ON compliance_snapshots;
CREATE POLICY "Users can view compliance snapshots in workspace"
ON compliance_snapshots FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage compliance snapshots in workspace" ON compliance_snapshots;
CREATE POLICY "Admins can manage compliance snapshots in workspace"
ON compliance_snapshots FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE INDEX IF NOT EXISTS idx_compliance_snapshots_workspace ON compliance_snapshots(workspace_id);

CREATE TABLE IF NOT EXISTS relocation_city_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  flag TEXT NOT NULL,
  col_index NUMERIC(7,2) NOT NULL,
  rent NUMERIC(12,2) NOT NULL,
  transport NUMERIC(12,2) NOT NULL,
  food NUMERIC(12,2) NOT NULL,
  utilities NUMERIC(12,2) NOT NULL,
  other NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'seeded',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE relocation_city_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Relocation costs are readable by authenticated users" ON relocation_city_costs;
CREATE POLICY "Relocation costs are readable by authenticated users"
ON relocation_city_costs FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  monthly_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  annual_price NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'AED',
  description TEXT NOT NULL DEFAULT '',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES billing_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  next_billing_at TIMESTAMPTZ,
  payment_method_last4 TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id)
);

CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES workspace_billing_subscriptions(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'failed')),
  issued_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  provider_invoice_id TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, invoice_number)
);

ALTER TABLE workspace_billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspace billing subscriptions" ON workspace_billing_subscriptions;
CREATE POLICY "Users can view workspace billing subscriptions"
ON workspace_billing_subscriptions FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage workspace billing subscriptions" ON workspace_billing_subscriptions;
CREATE POLICY "Admins can manage workspace billing subscriptions"
ON workspace_billing_subscriptions FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can view workspace billing invoices" ON billing_invoices;
CREATE POLICY "Users can view workspace billing invoices"
ON billing_invoices FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage workspace billing invoices" ON billing_invoices;
CREATE POLICY "Admins can manage workspace billing invoices"
ON billing_invoices FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE INDEX IF NOT EXISTS idx_workspace_billing_subscriptions_workspace ON workspace_billing_subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_workspace ON billing_invoices(workspace_id, issued_at DESC);

CREATE TABLE IF NOT EXISTS public_benchmark_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  role_id TEXT NOT NULL,
  role_label TEXT NOT NULL,
  location_id TEXT NOT NULL,
  location_label TEXT NOT NULL,
  level_id TEXT NOT NULL,
  level_label TEXT NOT NULL,
  currency TEXT NOT NULL,
  p25 NUMERIC(12,2) NOT NULL,
  p50 NUMERIC(12,2) NOT NULL,
  p75 NUMERIC(12,2) NOT NULL,
  submissions_this_week INTEGER NOT NULL DEFAULT 0,
  mom_delta_p25 TEXT NOT NULL DEFAULT '0%',
  mom_delta_p50 TEXT NOT NULL DEFAULT '0%',
  mom_delta_p75 TEXT NOT NULL DEFAULT '0%',
  trend_delta TEXT NOT NULL DEFAULT '0%',
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public_benchmark_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public benchmark snapshots are readable by authenticated users" ON public_benchmark_snapshots;
CREATE POLICY "Public benchmark snapshots are readable by authenticated users"
ON public_benchmark_snapshots FOR SELECT
USING (is_public = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage workspace benchmark snapshots" ON public_benchmark_snapshots;
CREATE POLICY "Admins can manage workspace benchmark snapshots"
ON public_benchmark_snapshots FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE INDEX IF NOT EXISTS idx_public_benchmark_snapshots_workspace ON public_benchmark_snapshots(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_benchmark_snapshots_public ON public_benchmark_snapshots(is_public, updated_at DESC);

INSERT INTO billing_plans (code, name, monthly_price, annual_price, currency, description, features, is_active)
VALUES
  ('starter', 'Starter', 179, 1718, 'AED', 'For small teams getting started with compensation benchmarking.', '["Up to 5 team members","500 benchmark lookups/month","3 saved reports","Email support"]'::jsonb, true),
  ('professional', 'Professional', 549, 5260, 'AED', 'For growing teams that need more power and flexibility.', '["Up to 25 team members","Unlimited benchmark lookups","Unlimited reports","Priority support","Custom exports","API access"]'::jsonb, true),
  ('enterprise', 'Enterprise', 0, 0, 'AED', 'For large organizations with custom requirements.', '["Unlimited team members","Dedicated account manager","Custom integrations","SLA guarantee","SSO / SAML","On-premise option"]'::jsonb, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  currency = EXCLUDED.currency,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = now();
