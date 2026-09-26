-- schema_update.sql
-- Idempotent PostgreSQL Canonical Schema Architecture for Juspay Fintech Platform
-- Strictly eliminates duplicate tables, redundant columns, and conflicting schemas.

-- ============================================================================
-- 1. PURGE DUPLICATE & REDUNDANT TABLES (Zero duplicates, aliases, or shadow tables)
-- ============================================================================
DROP TABLE IF EXISTS accounts, profiles, members CASCADE;
DROP TABLE IF EXISTS user_deposits, deposit_requests, pending_deposits CASCADE;
DROP TABLE IF EXISTS payouts, withdrawal_requests, cashouts CASCADE;
DROP TABLE IF EXISTS referrals, commissions, referral_rewards, affiliates CASCADE;
DROP TABLE IF EXISTS ledger, history, user_activity CASCADE;
DROP TABLE IF EXISTS admin_settings, configs, rates CASCADE;
DROP TABLE IF EXISTS payment_tools CASCADE;

-- ============================================================================
-- 2. CANONICAL PLATFORM SETTINGS TABLE (Replaces settings, configs, admin_settings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Safely migrate legacy settings data if settings table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
        INSERT INTO platform_settings (key, value)
        SELECT key, value FROM settings
        ON CONFLICT (key) DO NOTHING;
        DROP TABLE IF EXISTS settings CASCADE;
    END IF;
END $$;

-- ============================================================================
-- 3. CANONICAL CASHBACK OFFERS & USER CLAIMED CASHBACK TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cashback_offers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    tag VARCHAR(100),
    min_deposit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    max_deposit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cashback_percent NUMERIC(5, 2) NOT NULL DEFAULT 4.00,
    bonus_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Immutable tracking table for claimed cashback per user and order ID
CREATE TABLE IF NOT EXISTS user_claimed_cashback (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id VARCHAR(50) NOT NULL,
    order_code VARCHAR(50),
    cashback_amount NUMERIC(15, 2) NOT NULL,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_order_claim UNIQUE (user_id, order_id)
);
CREATE INDEX IF NOT EXISTS idx_user_claimed_cashback_user ON user_claimed_cashback(user_id);

-- Migrate legacy admin_cashback_offers if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_cashback_offers') THEN
        INSERT INTO cashback_offers (id, title, tag, min_deposit, max_deposit, cashback_percent, bonus_amount, description, is_active, created_at, updated_at)
        SELECT id, title, tag, min_deposit, max_deposit, cashback_percent, bonus_amount, description, is_active, created_at, updated_at
        FROM admin_cashback_offers
        ON CONFLICT (id) DO NOTHING;
        DROP TABLE IF EXISTS admin_cashback_offers CASCADE;
    END IF;
    DROP TABLE IF EXISTS cashback_orders CASCADE;
END $$;

-- Seed default canonical cashback offers if empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cashback_offers) THEN
        INSERT INTO cashback_offers (title, tag, min_deposit, max_deposit, cashback_percent, bonus_amount, description, is_active) VALUES
        ('Standard Top Pick', 'Popular', 250.00, 250.00, 4.00, 10.00, 'Claim standard 4% cashback on your cumulative deposits above ₹250.', TRUE),
        ('Premium Tier', 'Hot', 450.00, 450.00, 4.00, 18.00, 'Claim premium 4% cashback on cumulative deposits above ₹450.', TRUE),
        ('VIP High Roller', 'Special', 12500.00, 12500.00, 4.00, 500.00, 'VIP cashback bracket for cumulative deposits above ₹12,500.', TRUE),
        ('Growth Bracket 180', '100-300', 180.00, 180.00, 4.00, 7.20, 'Cashback bracket for deposits above ₹180.', TRUE),
        ('Growth Bracket 290', '100-300', 290.00, 290.00, 4.00, 11.60, 'Cashback bracket for deposits above ₹290.', TRUE),
        ('Growth Bracket 420', '301-500', 420.00, 420.00, 4.00, 16.80, 'Cashback bracket for deposits above ₹420.', TRUE),
        ('Growth Bracket 680', '501-2000', 680.00, 680.00, 4.00, 27.20, 'Cashback bracket for deposits above ₹680.', TRUE);
    END IF;
END $$;

-- ============================================================================
-- 4. CANONICAL TASK REWARDS TABLE (Replaces admin_tasks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_rewards (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    task_type VARCHAR(50) NOT NULL DEFAULT 'deposit',
    reward_type VARCHAR(50) DEFAULT 'POINTS',
    reward_points INT NOT NULL DEFAULT 0,
    reward_amount_inr NUMERIC(14, 2) DEFAULT 0.00,
    target_count INT NOT NULL DEFAULT 1,
    target_amount NUMERIC(12, 2) DEFAULT 0.00,
    action_link TEXT,
    verification_type VARCHAR(50) DEFAULT 'instant',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrate legacy admin_tasks if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_tasks') THEN
        INSERT INTO task_rewards (id, title, description, category, task_type, reward_type, reward_points, reward_amount_inr, target_count, target_amount, action_link, verification_type, is_active, created_at)
        SELECT id, title, description, category, COALESCE(task_type, 'deposit'), COALESCE(reward_type, 'POINTS'), COALESCE(reward_points, 0), COALESCE(reward_amount_inr, 0.00), COALESCE(target_count, 1), COALESCE(target_amount, 0.00), action_link, COALESCE(verification_type, 'instant'), COALESCE(is_active, TRUE), COALESCE(created_at, CURRENT_TIMESTAMP)
        FROM admin_tasks
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- 5. CANONICAL USERS TABLE: COLUMN NORMALIZATION & PURGING REDUNDANT COLUMNS
-- ============================================================================
-- Ensure canonical columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS vault_balance NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_commissions NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR(50);

-- Consolidate legacy balances into canonical vault_balance
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='available_balance') THEN
        UPDATE users SET vault_balance = GREATEST(COALESCE(vault_balance, 0.00), COALESCE(available_balance, 0.00));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='inr_balance') THEN
        UPDATE users SET vault_balance = GREATEST(COALESCE(vault_balance, 0.00), COALESCE(inr_balance, 0.00));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='balance') THEN
        UPDATE users SET vault_balance = GREATEST(COALESCE(vault_balance, 0.00), COALESCE(balance, 0.00));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='wallet_balance') THEN
        UPDATE users SET vault_balance = GREATEST(COALESCE(vault_balance, 0.00), COALESCE(wallet_balance, 0.00));
    END IF;

    -- Consolidate commissions into total_commissions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='commissions_total') THEN
        UPDATE users SET total_commissions = GREATEST(COALESCE(total_commissions, 0.00), COALESCE(commissions_total, 0.00));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='commission_balance') THEN
        UPDATE users SET total_commissions = GREATEST(COALESCE(total_commissions, 0.00), COALESCE(commission_balance, 0.00));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='total_ref_earning') THEN
        UPDATE users SET total_commissions = GREATEST(COALESCE(total_commissions, 0.00), COALESCE(total_ref_earning, 0.00));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='referral_earnings') THEN
        UPDATE users SET total_commissions = GREATEST(COALESCE(total_commissions, 0.00), COALESCE(referral_earnings, 0.00));
    END IF;

    -- Consolidate referral code and uplines
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='upline_code') THEN
        UPDATE users SET referred_by = upline_code WHERE (referred_by IS NULL OR referred_by = '') AND upline_code IS NOT NULL AND upline_code != '';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='referrer_code') THEN
        UPDATE users SET referred_by = referrer_code WHERE (referred_by IS NULL OR referred_by = '') AND referrer_code IS NOT NULL AND referrer_code != '';
    END IF;
END $$;

-- Ensure all balance, commission, and referral columns are available and initialized
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_commission_total NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_commissions NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS commissions_total NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_balance NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_ref_earning NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_balance NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS available_balance NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS inr_balance NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS upline_code VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS upline_l2_code VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS upline_l3_code VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referrer_code VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS l1_commission NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS l2_commission NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS l3_commission NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS l1_referrals_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS l2_referrals_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS l3_referrals_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deposit_balance NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS withdrawal_balance NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_balance NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_paid_withdrawals NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sell_balance NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_inflow NUMERIC(15, 2) DEFAULT 0.00;

-- ============================================================================
-- 6. CANONICAL RELATIONAL TABLES & FOREIGN KEYS
-- ============================================================================

-- Ensure user_selling_cards table
CREATE TABLE IF NOT EXISTS user_selling_cards (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cards_balance INT DEFAULT 0,
    welcome_claimed BOOLEAN DEFAULT FALSE,
    last_daily_claimed_cycle DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reward points ledger
CREATE TABLE IF NOT EXISTS reward_points_ledger (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INT DEFAULT 0,
    equivalent_inr NUMERIC(14, 2) DEFAULT 0.00,
    source VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Task Progress pointing to task_rewards
CREATE TABLE IF NOT EXISTS user_task_progress (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id INT NOT NULL REFERENCES task_rewards(id) ON DELETE CASCADE,
    current_progress INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    is_claimed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, task_id)
);

-- Task Submissions pointing to task_rewards
CREATE TABLE IF NOT EXISTS task_submissions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id INT NOT NULL REFERENCES task_rewards(id) ON DELETE CASCADE,
    proof_image_url TEXT,
    proof_text TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe drop of legacy admin_tasks once FKs are remapped
DROP TABLE IF EXISTS admin_tasks CASCADE;

-- Canonical Payment Methods (single source of truth for payment tools)
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    account_holder VARCHAR(255),
    details TEXT,
    upi_id VARCHAR(255),
    is_bound BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_default INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Canonical Affiliate Commissions (single source of truth for referrals & commissions)
CREATE TABLE IF NOT EXISTS affiliate_commissions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    depositor_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    deposit_id TEXT NOT NULL,
    tier VARCHAR(20) NOT NULL,
    rate_applied NUMERIC(5, 4) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'settled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_deposit_tier_credit UNIQUE (deposit_id, tier)
);

-- Deposits table column checks
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS txid VARCHAR(66);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS inr_credit_amount NUMERIC(14, 2);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10, 2) DEFAULT 111.00;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS proof_image_url TEXT;

-- Withdrawals table column checks
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS tx_hash VARCHAR(64);
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS amount NUMERIC(14, 2);
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT 'Rejected by admin';

-- Transactions table column checks
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tx_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS utr_number TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(14, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tier VARCHAR(32);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source_user_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source_user_email TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source_deposit_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS proof_screenshot TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deposit_method TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS network TEXT;

-- Single active withdrawal constraint
CREATE UNIQUE INDEX IF NOT EXISTS single_active_withdrawal_idx 
ON transactions (user_id) 
WHERE type = 'WITHDRAWAL' AND LOWER(status) IN ('pending', 'processing', 'in_review');

-- Unique commission per deposit constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_commission_per_deposit 
ON transactions (user_id, source_deposit_id, tier) 
WHERE type = 'commission';

-- Safe network hash check constraints on deposits
ALTER TABLE deposits DROP CONSTRAINT IF EXISTS chk_bep20_hash;
ALTER TABLE deposits ADD CONSTRAINT chk_bep20_hash CHECK (
    network NOT IN ('BEP-20', 'BEP20', 'BSC') OR 
    txn_hash IS NULL OR 
    txn_hash = '' OR 
    txn_hash ~* '^0x[a-f0-9]{64}$'
);

ALTER TABLE deposits DROP CONSTRAINT IF EXISTS chk_trc20_hash;
ALTER TABLE deposits ADD CONSTRAINT chk_trc20_hash CHECK (
    network NOT IN ('TRC-20', 'TRC20', 'TRON') OR 
    txn_hash IS NULL OR 
    txn_hash = '' OR 
    txn_hash ~* '^[a-f0-9]{64}$'
);

-- ============================================================================
-- 7. STORED PROCEDURES (Atomic, canonical vault_balance & cashback_offers)
-- ============================================================================

-- A. claim_welcome_cards
CREATE OR REPLACE FUNCTION claim_welcome_cards(p_user_id INT)
RETURNS JSONB AS $$
DECLARE
    v_user RECORD;
    v_status RECORD;
    v_current_cards INT;
    v_new_cards INT;
    v_now TIMESTAMP := NOW();
    v_curr_cycle DATE;
    v_cycle_epoch BIGINT;
BEGIN
    SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not found');
    END IF;

    INSERT INTO user_selling_cards (user_id, cards_balance, welcome_claimed)
    VALUES (p_user_id, 0, FALSE)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_status 
    FROM user_selling_cards 
    WHERE user_id = p_user_id FOR UPDATE;

    IF COALESCE(v_status.welcome_claimed, FALSE) OR COALESCE(v_user.welcome_cards_claimed, FALSE) OR COALESCE(v_user.signup_cards_claimed, FALSE) OR COALESCE(v_user.has_claimed_signup_cards, FALSE) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Free Welcome Cards already claimed');
    END IF;

    v_curr_cycle := ((NOW() AT TIME ZONE 'Asia/Kolkata' - INTERVAL '23 hours')::date);
    v_cycle_epoch := FLOOR((EXTRACT(EPOCH FROM NOW()) - 63000) / 86400)::BIGINT;
    v_current_cards := COALESCE(v_user.usdt_cards_balance, v_user.selling_cards, v_status.cards_balance, 0);
    -- STRICT RULE: Welcome claim grants 2 cards total on Day 1. Max balance on Day 1 is 2.
    v_new_cards := 2;

    UPDATE user_selling_cards
    SET cards_balance = v_new_cards,
        welcome_claimed = TRUE,
        last_daily_claimed_cycle = v_curr_cycle,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    UPDATE users
    SET usdt_cards_balance = v_new_cards,
        usdt_selling_cards = v_new_cards,
        selling_cards = v_new_cards,
        welcome_cards_claimed = TRUE,
        signup_cards_claimed = TRUE,
        has_claimed_signup_cards = TRUE,
        last_card_claimed_at = v_now,
        last_card_claim_timestamp = EXTRACT(EPOCH FROM v_now)::BIGINT * 1000,
        last_claim_cycle_epoch = v_cycle_epoch
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'cards_added', 2,
        'cards_balance', v_new_cards,
        'welcome_claimed', true,
        'current_cycle_id', v_cycle_epoch,
        'last_card_claimed_at', v_now,
        'last_card_claim_timestamp', EXTRACT(EPOCH FROM v_now)::BIGINT * 1000,
        'message', 'Successfully claimed 2 Free Welcome USDT Selling Cards!'
    );
END;
$$ LANGUAGE plpgsql;

-- B. claim_daily_selling_card
CREATE OR REPLACE FUNCTION claim_daily_selling_card(p_user_id INT)
RETURNS JSONB AS $$
DECLARE
    v_user RECORD;
    v_status RECORD;
    v_current_cards INT;
    v_new_cards INT;
    v_now TIMESTAMP := NOW();
    v_curr_cycle DATE;
    v_cycle_epoch BIGINT;
    v_is_welcome_claimed BOOLEAN;
BEGIN
    SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not found');
    END IF;

    INSERT INTO user_selling_cards (user_id, cards_balance, welcome_claimed)
    VALUES (p_user_id, 0, FALSE)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_status 
    FROM user_selling_cards 
    WHERE user_id = p_user_id FOR UPDATE;

    v_curr_cycle := ((NOW() AT TIME ZONE 'Asia/Kolkata' - INTERVAL '23 hours')::date);
    v_cycle_epoch := FLOOR((EXTRACT(EPOCH FROM NOW()) - 63000) / 86400)::BIGINT;

    v_is_welcome_claimed := COALESCE(v_status.welcome_claimed, FALSE) OR COALESCE(v_user.welcome_cards_claimed, FALSE) OR COALESCE(v_user.signup_cards_claimed, FALSE) OR COALESCE(v_user.has_claimed_signup_cards, FALSE);

    -- Must have claimed welcome cards first
    IF NOT v_is_welcome_claimed THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Please claim your Free Welcome Cards first.'
        );
    END IF;

    -- Check 1: user_selling_cards.last_daily_claimed_cycle equals current cycle date
    IF v_status.last_daily_claimed_cycle IS NOT NULL AND v_status.last_daily_claimed_cycle = v_curr_cycle THEN
        RETURN jsonb_build_object(
            'success', false,
            'already_claimed', true,
            'current_cycle_id', v_cycle_epoch,
            'cards_balance', COALESCE(v_user.usdt_cards_balance, v_user.selling_cards, v_status.cards_balance, 0),
            'countdown_text', 'locked until 11:00 PM IST',
            'message', 'USDT selling card already claimed for this daily cycle. The next card will unlock after the 11:00 PM IST nightly reset.'
        );
    END IF;

    -- Check 2: users.last_claim_cycle_epoch equals current cycle epoch
    IF v_user.last_claim_cycle_epoch IS NOT NULL AND v_user.last_claim_cycle_epoch = v_cycle_epoch THEN
        RETURN jsonb_build_object(
            'success', false,
            'already_claimed', true,
            'current_cycle_id', v_cycle_epoch,
            'cards_balance', COALESCE(v_user.usdt_cards_balance, v_user.selling_cards, v_status.cards_balance, 0),
            'countdown_text', 'locked until 11:00 PM IST',
            'message', 'USDT selling card already claimed for this daily cycle. The next card will unlock after the 11:00 PM IST nightly reset.'
        );
    END IF;

    -- Check 3: users.last_card_claimed_at cycle date equals current cycle date
    IF v_user.last_card_claimed_at IS NOT NULL AND ((v_user.last_card_claimed_at AT TIME ZONE 'Asia/Kolkata' - INTERVAL '23 hours')::date) = v_curr_cycle THEN
        RETURN jsonb_build_object(
            'success', false,
            'already_claimed', true,
            'current_cycle_id', v_cycle_epoch,
            'cards_balance', COALESCE(v_user.usdt_cards_balance, v_user.selling_cards, v_status.cards_balance, 0),
            'countdown_text', 'locked until 11:00 PM IST',
            'message', 'USDT selling card already claimed for this daily cycle. The next card will unlock after the 11:00 PM IST nightly reset.'
        );
    END IF;

    -- Check 4: If welcome cards are already claimed, lock to current cycle!
    IF v_status.last_daily_claimed_cycle IS NULL OR v_user.last_claim_cycle_epoch IS NULL OR v_user.last_claim_cycle_epoch = 0 THEN
        UPDATE user_selling_cards
        SET last_daily_claimed_cycle = v_curr_cycle,
            welcome_claimed = TRUE,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        UPDATE users
        SET last_claim_cycle_epoch = v_cycle_epoch,
            welcome_cards_claimed = TRUE,
            signup_cards_claimed = TRUE,
            has_claimed_signup_cards = TRUE
        WHERE id = p_user_id;

        RETURN jsonb_build_object(
            'success', false,
            'already_claimed', true,
            'current_cycle_id', v_cycle_epoch,
            'cards_balance', COALESCE(v_user.usdt_cards_balance, v_user.selling_cards, v_status.cards_balance, 0),
            'countdown_text', 'locked until 11:00 PM IST',
            'message', 'USDT selling card already claimed for this daily cycle. The next card will unlock after the 11:00 PM IST nightly reset.'
        );
    END IF;

    v_current_cards := COALESCE(v_user.usdt_cards_balance, v_user.selling_cards, v_status.cards_balance, 0);
    v_new_cards := v_current_cards + 1;

    UPDATE user_selling_cards
    SET cards_balance = v_new_cards,
        last_daily_claimed_cycle = v_curr_cycle,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    UPDATE users
    SET usdt_cards_balance = v_new_cards,
        usdt_selling_cards = v_new_cards,
        selling_cards = v_new_cards,
        last_card_claimed_at = v_now,
        last_card_claim_timestamp = EXTRACT(EPOCH FROM v_now)::BIGINT * 1000,
        last_claim_cycle_epoch = v_cycle_epoch
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'cards_added', 1,
        'cards_balance', v_new_cards,
        'current_cycle_id', v_cycle_epoch,
        'last_card_claimed_at', v_now,
        'last_card_claim_timestamp', EXTRACT(EPOCH FROM v_now)::BIGINT * 1000,
        'message', 'Successfully claimed +1 Daily USDT Selling Card!'
    );
END;
$$ LANGUAGE plpgsql;

-- C. claim_cashback_order (Uses canonical cashback_offers & vault_balance)
CREATE OR REPLACE FUNCTION claim_cashback_order(p_user_id INT, p_order_id VARCHAR(50))
RETURNS JSONB AS $$
DECLARE
    v_cumulative_deposits NUMERIC(14, 2);
    v_user RECORD;
    v_min_deposit NUMERIC(14, 2);
    v_amount NUMERIC(14, 2);
    v_income NUMERIC(14, 2);
    v_tx_id TEXT;
    v_order_code TEXT;
BEGIN
    SELECT id, email, vault_balance, usdt_balance, points INTO v_user
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not found');
    END IF;

    -- Calculate cumulative approved deposits from canonical deposits table
    SELECT COALESCE(SUM(amount_inr), 0) INTO v_cumulative_deposits
    FROM deposits
    WHERE user_id = p_user_id AND LOWER(status) = 'approved';

    -- Match from canonical cashback_offers table
    SELECT min_deposit, bonus_amount, 'ORD-' || (7720 + id), min_deposit 
    INTO v_min_deposit, v_income, v_order_code, v_amount
    FROM cashback_offers
    WHERE CAST(id AS TEXT) = p_order_id
       OR 'ORD-' || (7720 + id) = p_order_id
       OR title = p_order_id
       OR tag = p_order_id;

    IF NOT FOUND THEN
        IF p_order_id = 'ord_1' OR p_order_id = 'ORD-7721' THEN
            v_min_deposit := 250.00; v_amount := 250.00; v_income := 10.00; v_order_code := 'ORD-7721';
        ELSIF p_order_id = 'ord_2' OR p_order_id = 'ORD-7722' THEN
            v_min_deposit := 450.00; v_amount := 450.00; v_income := 18.00; v_order_code := 'ORD-7722';
        ELSIF p_order_id = 'ord_top_high' OR p_order_id = 'ORD-7729' THEN
            v_min_deposit := 12500.00; v_amount := 12500.00; v_income := 500.00; v_order_code := 'ORD-7729';
        ELSIF p_order_id = 'ord_3' OR p_order_id = 'ORD-7723' THEN
            v_min_deposit := 180.00; v_amount := 180.00; v_income := 7.20; v_order_code := 'ORD-7723';
        ELSIF p_order_id = 'ord_4' OR p_order_id = 'ORD-7724' THEN
            v_min_deposit := 290.00; v_amount := 290.00; v_income := 11.60; v_order_code := 'ORD-7724';
        ELSIF p_order_id = 'ord_5' OR p_order_id = 'ORD-7725' THEN
            v_min_deposit := 420.00; v_amount := 420.00; v_income := 16.80; v_order_code := 'ORD-7725';
        ELSIF p_order_id = 'ord_6' OR p_order_id = 'ORD-7726' THEN
            v_min_deposit := 680.00; v_amount := 680.00; v_income := 27.20; v_order_code := 'ORD-7726';
        ELSE
            v_min_deposit := 250.00; v_amount := 250.00; v_income := 10.00; v_order_code := p_order_id;
        END IF;
    END IF;

    IF v_cumulative_deposits < v_min_deposit THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Requires cumulative approved deposits of ₹' || v_min_deposit || '. Your total is ₹' || v_cumulative_deposits
        );
    END IF;

    -- Prevent double claims in user_claimed_cashback & transactions table
    IF EXISTS (
        SELECT 1 FROM user_claimed_cashback 
        WHERE user_id = p_user_id AND (order_id = p_order_id OR order_id = v_order_code OR order_code = v_order_code)
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Order already claimed');
    END IF;

    SELECT id INTO v_tx_id 
    FROM transactions 
    WHERE user_id = p_user_id 
      AND (type IN ('Claim', 'cashback_reward') OR description LIKE '%Claimed %')
      AND (order_id = p_order_id OR description LIKE '%' || v_order_code || '%' OR notes LIKE '%' || v_order_code || '%');

    IF FOUND THEN
        -- Record in user_claimed_cashback if missing
        INSERT INTO user_claimed_cashback (user_id, order_id, order_code, cashback_amount)
        VALUES (p_user_id, p_order_id, v_order_code, v_income)
        ON CONFLICT (user_id, order_id) DO NOTHING;
        RETURN jsonb_build_object('success', false, 'message', 'Order already claimed');
    END IF;

    -- Insert into user_claimed_cashback (atomic duplicate guard)
    BEGIN
        INSERT INTO user_claimed_cashback (user_id, order_id, order_code, cashback_amount, claimed_at)
        VALUES (p_user_id, p_order_id, v_order_code, v_income, NOW());
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'message', 'Order already claimed');
    END;

    v_tx_id := 'CLM-' || FLOOR(100000 + RANDOM() * 900000)::TEXT;

    INSERT INTO transactions (user_id, user_email, type, order_id, tx_id, amount_usdt, amount_inr, amount, description, notes, status, created_at)
    VALUES (p_user_id, v_user.email, 'cashback_reward', p_order_id, v_tx_id, ROUND((v_income / 111.0)::numeric, 4), v_income, v_income, 'Claimed ' || v_order_code || ' for +₹' || v_income || ' cashback income', 'Claimed ' || v_order_code || ' for +₹' || v_income || ' cashback income', 'completed', NOW());

    -- Credit canonical vault_balance and total_rewards
    UPDATE users 
    SET vault_balance = COALESCE(vault_balance, 0.00) + v_income,
        total_rewards = COALESCE(total_rewards, 0.00) + v_income,
        usdt_balance = COALESCE(usdt_balance, 0.0000) + ROUND((v_income / 111.0)::numeric, 4),
        points = COALESCE(points, 0) + 15,
        reward_points = COALESCE(reward_points, 0) + 15
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true, 
        'income', v_income, 
        'new_vault_balance', COALESCE(v_user.vault_balance, 0.00) + v_income,
        'message', 'Claim processed successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- D. redeem_reward_points (Canonical vault_balance)
CREATE OR REPLACE FUNCTION redeem_reward_points(p_user_id INT, p_points_to_redeem INT)
RETURNS JSONB AS $$
DECLARE
    v_current_points INT;
    v_inr_amount NUMERIC(12, 2);
    v_new_vault NUMERIC(15, 2);
BEGIN
    SELECT COALESCE(points, reward_points, 0) INTO v_current_points 
    FROM users 
    WHERE id = p_user_id 
    FOR UPDATE;

    IF v_current_points IS NULL OR v_current_points < p_points_to_redeem THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient reward points balance');
    END IF;

    v_inr_amount := p_points_to_redeem * 1.00;

    UPDATE users 
    SET points = GREATEST(0, COALESCE(points, reward_points, 0) - p_points_to_redeem),
        reward_points = GREATEST(0, COALESCE(points, reward_points, 0) - p_points_to_redeem),
        vault_balance = COALESCE(vault_balance, 0.00) + v_inr_amount
    WHERE id = p_user_id
    RETURNING vault_balance INTO v_new_vault;

    RETURN jsonb_build_object(
        'success', true, 
        'points_deducted', p_points_to_redeem,
        'inr_credited', v_inr_amount,
        'new_vault_balance', v_new_vault
    );
END;
$$ LANGUAGE plpgsql;

-- E. request_withdrawal_atomic (Canonical vault_balance)
CREATE OR REPLACE FUNCTION request_withdrawal_atomic(
    p_user_id INT, 
    p_amount NUMERIC, 
    p_order_id TEXT DEFAULT NULL, 
    p_payout_details TEXT DEFAULT NULL, 
    p_method TEXT DEFAULT 'UPI'
)
RETURNS JSONB AS $$
DECLARE
    v_user RECORD;
    v_tx_id TEXT;
    v_current_vault NUMERIC;
    v_cards INT;
    v_existing_tx RECORD;
BEGIN
    SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not found');
    END IF;

    SELECT id, order_id, tx_id INTO v_existing_tx 
    FROM transactions 
    WHERE user_id = p_user_id 
      AND type = 'WITHDRAWAL' 
      AND LOWER(status) IN ('pending', 'processing', 'in_review')
    FOR UPDATE
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'You already have an active pending withdrawal (Order: ' || COALESCE(v_existing_tx.order_id, v_existing_tx.tx_id, v_existing_tx.id::TEXT) || '). Strictly 1 withdrawal at a time. Please wait for admin processing.',
            'order_id', COALESCE(v_existing_tx.order_id, v_existing_tx.tx_id, v_existing_tx.id::TEXT)
        );
    END IF;

    v_current_vault := COALESCE(v_user.vault_balance, 0.00);
    IF v_current_vault < p_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient available vault balance');
    END IF;

    v_cards := COALESCE(v_user.usdt_cards_balance, v_user.usdt_selling_cards, v_user.selling_cards, 0);
    IF v_cards < 1 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient USDT Selling Cards. At least 1 card is required to initiate a withdrawal');
    END IF;

    v_tx_id := COALESCE(p_order_id, 'WTH-' || FLOOR(10000 + RANDOM() * 90000)::TEXT);

    -- Deduct strictly from vault_balance and place into locked_balance
    UPDATE users 
    SET vault_balance = GREATEST(0.00, v_current_vault - p_amount),
        usdt_balance = GREATEST(0.0000, ROUND(((v_current_vault - p_amount) / 111.0)::numeric, 4)),
        locked_balance = COALESCE(locked_balance, 0.00) + p_amount,
        usdt_cards_balance = GREATEST(0, v_cards - 1),
        usdt_selling_cards = GREATEST(0, v_cards - 1),
        selling_cards = GREATEST(0, v_cards - 1),
        active_pending_order = v_tx_id,
        has_active_withdrawal = TRUE
    WHERE id = p_user_id;

    UPDATE user_selling_cards
    SET cards_balance = GREATEST(0, v_cards - 1),
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO transactions (user_id, user_email, type, order_id, tx_id, amount_usdt, amount_inr, amount, description, status, created_at)
    VALUES (p_user_id, COALESCE(v_user.email, 'user@juspay.io'), 'WITHDRAWAL', v_tx_id, v_tx_id, ROUND((p_amount / 111.0)::numeric, 4), p_amount, p_amount, 'Withdrawal request of ₹' || p_amount || ' via ' || p_method, 'PENDING', NOW());

    INSERT INTO withdrawals (order_id, tx_hash, user_id, user_email, amount_usdt, amount_inr, amount, method, payment_method, payment_details, status, created_at)
    VALUES (v_tx_id, v_tx_id, p_user_id, COALESCE(v_user.email, 'user@juspay.io'), ROUND((p_amount / 111.0)::numeric, 4), p_amount, p_amount, p_method, p_method, COALESCE(p_payout_details, p_method), 'pending', NOW());

    RETURN jsonb_build_object(
        'success', true, 
        'tx_id', v_tx_id, 
        'order_id', v_tx_id, 
        'new_vault_balance', v_current_vault - p_amount
    );
END;
$$ LANGUAGE plpgsql;

-- F. settle_withdrawal_atomic
CREATE OR REPLACE FUNCTION settle_withdrawal_atomic(p_tx_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_tx RECORD;
    v_user_id INT;
    v_amount NUMERIC;
BEGIN
    SELECT * INTO v_tx 
    FROM transactions 
    WHERE (order_id = p_tx_id OR tx_id = p_tx_id OR id::TEXT = p_tx_id) 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Transaction not found');
    END IF;

    IF UPPER(COALESCE(v_tx.status, '')) != 'PENDING' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Transaction already finalized');
    END IF;

    v_user_id := v_tx.user_id;
    v_amount := COALESCE(v_tx.amount, v_tx.amount_inr, 0.00);

    UPDATE users 
    SET locked_balance = GREATEST(0.00, COALESCE(locked_balance, 0.00) - v_amount),
        total_paid_withdrawals = COALESCE(total_paid_withdrawals, 0.00) + v_amount,
        total_withdrawal = COALESCE(total_withdrawal, 0.00) + (v_amount / 111.0),
        active_pending_order = NULL,
        has_active_withdrawal = FALSE
    WHERE id = v_user_id;

    UPDATE transactions 
    SET status = 'Settled', 
        updated_at = NOW() 
    WHERE (order_id = p_tx_id OR tx_id = p_tx_id OR id::TEXT = p_tx_id);

    UPDATE withdrawals 
    SET status = 'approved', 
        settled_at = NOW(), 
        approved_at = NOW(),
        updated_at = NOW() 
    WHERE (tx_hash = p_tx_id OR order_id = p_tx_id OR id::TEXT = p_tx_id);

    RETURN jsonb_build_object('success', true, 'message', 'Withdrawal settled successfully');
END;
$$ LANGUAGE plpgsql;

-- G. reject_withdrawal_atomic (Restores canonical vault_balance)
CREATE OR REPLACE FUNCTION reject_withdrawal_atomic(p_tx_id TEXT, p_reason TEXT DEFAULT 'Withdrawal rejected')
RETURNS JSONB AS $$
DECLARE
    v_tx RECORD;
    v_user_id INT;
    v_amount NUMERIC;
BEGIN
    SELECT * INTO v_tx 
    FROM transactions 
    WHERE (order_id = p_tx_id OR tx_id = p_tx_id OR id::TEXT = p_tx_id) 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Transaction not found');
    END IF;

    IF UPPER(COALESCE(v_tx.status, '')) != 'PENDING' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Transaction is not pending');
    END IF;

    v_user_id := v_tx.user_id;
    v_amount := COALESCE(v_tx.amount, v_tx.amount_inr, 0.00);

    -- Restore to canonical vault_balance
    UPDATE users 
    SET locked_balance = GREATEST(0.00, COALESCE(locked_balance, 0.00) - v_amount),
        vault_balance = COALESCE(vault_balance, 0.00) + v_amount,
        usdt_balance = ROUND(((COALESCE(vault_balance, 0.00) + v_amount) / 111.0)::numeric, 4),
        active_pending_order = NULL,
        has_active_withdrawal = FALSE
    WHERE id = v_user_id;

    UPDATE transactions 
    SET status = 'Rejected', 
        notes = p_reason,
        updated_at = NOW() 
    WHERE (order_id = p_tx_id OR tx_id = p_tx_id OR id::TEXT = p_tx_id);

    UPDATE withdrawals 
    SET status = 'rejected', 
        rejected_at = NOW(),
        rejection_reason = p_reason,
        updated_at = NOW() 
    WHERE (tx_hash = p_tx_id OR order_id = p_tx_id OR id::TEXT = p_tx_id);

    RETURN jsonb_build_object('success', true, 'message', 'Withdrawal rejected and vault_balance refunded');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. CANONICAL OTP & EMAIL VERIFICATIONS TABLES & USER SANITIZATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_verifications (
    email VARCHAR(255) PRIMARY KEY,
    otp_code VARCHAR(6) NOT NULL,
    expires_at BIGINT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'LOGIN',
    type VARCHAR(50) DEFAULT 'LOGIN',
    expires_at BIGINT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_email_purpose ON otps(email, purpose);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

-- Purge any corrupted or blank email records in users table
DELETE FROM users WHERE email IS NULL OR TRIM(email) = '';

-- Ensure unique index on normalized email for users table
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_normalized_email 
ON users (LOWER(TRIM(email))) 
WHERE email IS NOT NULL AND TRIM(email) != '';

-- ============================================================================
-- 9. CANONICAL INDIAN IDENTITY KYC VERIFICATIONS TABLE & USER KYC COLUMNS
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'NOT_SUBMITTED';
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS kyc_verifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    dob VARCHAR(50) NOT NULL,
    mobile_number VARCHAR(20),
    address TEXT NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    front_image_url TEXT NOT NULL,
    back_image_url TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON kyc_verifications(status);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_doc_number ON kyc_verifications(document_number);

