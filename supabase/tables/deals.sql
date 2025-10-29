CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    customer_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(12,2) DEFAULT 0,
    stage VARCHAR(50) NOT NULL DEFAULT 'Lead',
    expected_close_date DATE,
    probability INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);