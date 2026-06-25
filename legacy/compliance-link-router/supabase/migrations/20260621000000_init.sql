-- Migrations for Compliance-Shielded Link Routing

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own user data." ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own user data." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Table: links
CREATE TABLE public.links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text UNIQUE NOT NULL,
    default_target_url text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE INDEX idx_links_user_id ON public.links(user_id);
CREATE INDEX idx_links_slug ON public.links(slug);

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own links." ON public.links FOR ALL USING (auth.uid() = user_id);

-- Table: redirect_rules
CREATE TABLE public.redirect_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id uuid REFERENCES public.links(id) ON DELETE CASCADE NOT NULL,
    priority integer NOT NULL,
    rule_type text NOT NULL, 
    rule_value text NOT NULL, 
    target_url text NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);

CREATE INDEX idx_redirect_rules_link_id ON public.redirect_rules(link_id);

ALTER TABLE public.redirect_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage redirect rules for their links." ON public.redirect_rules FOR ALL USING (EXISTS ( SELECT 1 FROM public.links WHERE links.id = redirect_rules.link_id AND links.user_id = auth.uid()));

-- Table: ml_models
CREATE TABLE public.ml_models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    model_name text NOT NULL,
    version text NOT NULL,
    model_binary bytea NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT false NOT NULL
);

CREATE UNIQUE INDEX idx_ml_models_active ON public.ml_models(is_active) WHERE is_active = true;

ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage ML models." ON public.ml_models FOR ALL USING (EXISTS ( SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Service role can read active ML model." ON public.ml_models FOR SELECT USING (is_active = true);

-- Table: audit_logs
CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    event_type text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip_address inet
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all audit logs." ON public.audit_logs FOR SELECT USING (EXISTS ( SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Users can view their own audit logs." ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
