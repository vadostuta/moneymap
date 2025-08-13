"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Retro-categorize "Other" transactions using MCC from Monobank API.
 * Requirements:
 *  - NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env
 *  - Your monobank token(s) available in bank_integrations (provider='monobank')
 *  - Replace OTHER_CATEGORY_ID if different
 */
require("dotenv/config");
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY // needs write access under RLS
);
const OTHER_CATEGORY_ID = 'e6ae9d7d-1e91-447d-8bcb-9940a5d9d3a0';
const DATE_FROM = new Date('2025-07-01T00:00:00Z');
const DATE_TO = new Date('2025-08-13T00:00:00Z');
const MCC_CATEGORY_MAP = {
    5812: '446c89e7-e370-4f83-8e48-7f5b9a221358',
    5813: '446c89e7-e370-4f83-8e48-7f5b9a221358',
    5814: '446c89e7-e370-4f83-8e48-7f5b9a221358',
    5411: 'c665d97d-405a-4c6a-a7df-ef3c9f4fcd77',
    5499: 'c665d97d-405a-4c6a-a7df-ef3c9f4fcd77',
    5311: '139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6',
    5310: '139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6',
    5331: '139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6',
    5999: '139ccb90-5c2c-4dfa-8bb4-c4fcd1342fd6',
    5541: '1dce321c-5b29-4994-aa21-165c5efd7cd7',
    5542: '1dce321c-5b29-4994-aa21-165c5efd7cd7',
    4111: '1dce321c-5b29-4994-aa21-165c5efd7cd7',
    4121: '1dce321c-5b29-4994-aa21-165c5efd7cd7',
    4900: '9c3bf797-3cab-4774-b443-65707645c675',
    4899: '9c3bf797-3cab-4774-b443-65707645c675',
    7832: '2557ddce-7aec-45e5-8932-63fe3b1f2fd6',
    7841: '2557ddce-7aec-45e5-8932-63fe3b1f2fd6',
    7991: '2557ddce-7aec-45e5-8932-63fe3b1f2fd6',
    8011: 'ffcdbf34-5d88-419c-9e56-7a3e94b74927',
    8021: 'ffcdbf34-5d88-419c-9e56-7a3e94b74927',
    8041: 'ffcdbf34-5d88-419c-9e56-7a3e94b74927',
    8220: '5a1413cd-8b6c-4209-ab24-b91ea0cd18be',
    4511: '1428c16e-2359-4b37-b72c-30312d998fb7',
    4722: '1428c16e-2359-4b37-b72c-30312d998fb7',
    7230: '11fa4c3f-5cae-4c34-aa46-a892c1259b24',
    7298: '11fa4c3f-5cae-4c34-aa46-a892c1259b24'
};
function getCategoryFromMCC(mcc) {
    if (!mcc)
        return null;
    return MCC_CATEGORY_MAP[mcc] ?? null;
}
async function run() {
    // 1) Get all active monobank integrations (token + wallet)
    const { data: integrations, error: intErr } = await supabase
        .from('bank_integrations')
        .select('user_id, wallet_id, api_token')
        .eq('provider', 'monobank')
        .eq('is_active', true);
    if (intErr)
        throw intErr;
    let totalUpdated = 0;
    for (const integ of integrations ?? []) {
        // 2) Find candidate rows to fix (still in "Other")
        const { data: rows, error: txErr } = await supabase
            .from('transactions')
            .select('id, monobank_id, category_id, date')
            .eq('wallet_id', integ.wallet_id)
            .eq('category_id', OTHER_CATEGORY_ID)
            .eq('is_deleted', false)
            .gte('date', DATE_FROM.toISOString())
            .lt('date', DATE_TO.toISOString());
        if (txErr)
            throw txErr;
        if (!rows?.length)
            continue;
        // 3) Fetch bank statement for the range
        const fromUnix = Math.floor(DATE_FROM.getTime() / 1000);
        const toUnix = Math.floor(DATE_TO.getTime() / 1000);
        const res = await fetch(`https://api.monobank.ua/personal/statement/0/${fromUnix}/${toUnix}`, { headers: { 'X-Token': integ.api_token } });
        if (!res.ok) {
            console.warn(`Monobank fetch failed for wallet ${integ.wallet_id}: ${res.statusText}`);
            continue;
        }
        const bankTxs = await res.json();
        const byId = new Map(bankTxs.map(t => [t.id, t]));
        // 4) Compute updates
        const updates = [];
        for (const row of rows) {
            const src = row.monobank_id ? byId.get(row.monobank_id) : undefined;
            const cat = getCategoryFromMCC(src?.mcc ?? src?.originalMcc ?? null);
            if (cat)
                updates.push({ id: row.id, category_id: cat });
        }
        // 5) Apply updates in batches (VALUES + join for per-row categories)
        const batchSize = 200;
        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            if (!batch.length)
                continue;
            // Build one SQL statement per batch
            const values = batch
                .map(u => `($$${u.id}$$::uuid, $$${u.category_id}$$::uuid)`)
                .join(', ');
            const sql = `
        WITH patch(id, category_id) AS (
          VALUES ${values}
        )
        UPDATE public.transactions t
        SET category_id = p.category_id
        FROM patch p
        WHERE t.id = p.id
          AND t.category_id = '${OTHER_CATEGORY_ID}'::uuid
      `;
            const { error: updErr } = await supabase.rpc('exec_sql', { sql });
            // If you don't have a generic exec_sql RPC, fall back to per-row updates.
            if (updErr) {
                // Fallback: per-row
                await Promise.all(batch.map(u => supabase
                    .from('transactions')
                    .update({ category_id: u.category_id })
                    .eq('id', u.id)));
            }
            totalUpdated += batch.length;
        }
    }
    console.log(`✅ Updated ${totalUpdated} transactions.`);
}
run().catch(err => {
    console.error(err);
    process.exit(1);
});
