Hey for the AI API updates, 

this is the latest return of /api/tenants/${tenantId}/gl/status
{
    "tenant_id": "c5f38d87-3877-485d-a49a-3ffef5dd5251",
    "user_id": "615d0617-73ff-41e7-ace8-5404a5c2584b",
    "ledger_scope_id": null,
    "scope_mode": "company_aggregate",
    "included_ledger_scope_ids": [],
    "fiscal_year": 2026,
    "last_updated": "2026-04-03T09:36:37.710384",
    "summary": {
        "total_debits": 0,
        "total_credits": 0,
        "is_balanced": true,
        "entries_count": 0,
        "accounts_with_activity": 0
    },
    "trial_balance": [],
    "recent_entries": []
}

this is the latest result of /api/tenants/${tenantId}/gl/transactions
{
    "tenant_id": "c5f38d87-3877-485d-a49a-3ffef5dd5251",
    "user_id": "615d0617-73ff-41e7-ace8-5404a5c2584b",
    "ledger_scope_id": null,
    "scope_mode": "company_aggregate",
    "included_ledger_scope_ids": [],
    "fiscal_year": 2026,
    "filters": {
        "account_code": null,
        "start_date": null,
        "end_date": null,
        "include_opening": true
    },
    "pagination": {
        "page": 1,
        "page_size": 100,
        "total_rows": 0,
        "has_next": false
    },
    "summary": {
        "total_debits": 0,
        "total_credits": 0,
        "is_balanced": true,
        "accounts_count": 0
    },
    "accounts": [],
    "rows": []
}

