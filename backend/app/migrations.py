"""
Minimal schema migration helpers for additive changes in SQLite/dev.
"""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def _column_names(engine: Engine, table_name: str) -> set[str]:
    inspector = inspect(engine)
    return {column["name"] for column in inspector.get_columns(table_name)}


def run_minimal_migrations(engine: Engine) -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    if "extraction_runs" in tables:
        existing_columns = _column_names(engine, "extraction_runs")
        statements = []
        if "reviewed_by_id" not in existing_columns:
            statements.append("ALTER TABLE extraction_runs ADD COLUMN reviewed_by_id INTEGER")
        if "reviewed_at" not in existing_columns:
            statements.append("ALTER TABLE extraction_runs ADD COLUMN reviewed_at DATETIME")
        if "corrected_fields" not in existing_columns:
            statements.append("ALTER TABLE extraction_runs ADD COLUMN corrected_fields TEXT")

        if statements:
            with engine.begin() as connection:
                for statement in statements:
                    connection.execute(text(statement))

    if "payments" in tables:
        existing_columns = _column_names(engine, "payments")
        statements = []
        if "reference" not in existing_columns:
            statements.append("ALTER TABLE payments ADD COLUMN reference VARCHAR(255)")
        if "notes" not in existing_columns:
            statements.append("ALTER TABLE payments ADD COLUMN notes TEXT")

        if statements:
            with engine.begin() as connection:
                for statement in statements:
                    connection.execute(text(statement))

    if "invoices" in tables:
        existing_columns = _column_names(engine, "invoices")
        statements = []
        if "approval_status" not in existing_columns:
            statements.append("ALTER TABLE invoices ADD COLUMN approval_status VARCHAR(50) NOT NULL DEFAULT 'pending'")
        if "approved_by_id" not in existing_columns:
            statements.append("ALTER TABLE invoices ADD COLUMN approved_by_id INTEGER")
        if "approved_at" not in existing_columns:
            statements.append("ALTER TABLE invoices ADD COLUMN approved_at DATETIME")
        if "approval_note" not in existing_columns:
            statements.append("ALTER TABLE invoices ADD COLUMN approval_note TEXT")
        if "last_reminder_sent_at" not in existing_columns:
            statements.append("ALTER TABLE invoices ADD COLUMN last_reminder_sent_at DATETIME")
        if "purchase_order_id" not in existing_columns:
            statements.append("ALTER TABLE invoices ADD COLUMN purchase_order_id INTEGER")

        if statements:
            with engine.begin() as connection:
                for statement in statements:
                    connection.execute(text(statement))
