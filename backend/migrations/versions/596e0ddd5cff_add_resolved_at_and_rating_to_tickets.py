"""Add resolved_at and rating to tickets

Revision ID: 596e0ddd5cff
Revises: 962467e29b35
Create Date: 2025-08-22 15:14:28.651946
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '596e0ddd5cff'
down_revision = '962467e29b35'
branch_labels = None
depends_on = None


def upgrade():
    # Use batch mode for SQLite
    with op.batch_alter_table('tickets') as batch_op:
        batch_op.add_column(sa.Column('resolved_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('rating', sa.Integer(), nullable=True))
    
    # If you need the foreign keys, you have to ensure they already exist in SQLite
    # SQLite won't allow creating new foreign keys via ALTER TABLE

def downgrade():
    with op.batch_alter_table('tickets') as batch_op:
        batch_op.drop_column('rating')
        batch_op.drop_column('resolved_at')
