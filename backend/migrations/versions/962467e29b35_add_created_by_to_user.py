"""Add created_by to User

Revision ID: 962467e29b35
Revises: fe582513e652
Create Date: 2025-08-21 14:31:53.666884

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '962467e29b35'
down_revision = 'fe582513e652'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_users_created_by', 'users', ['created_by'], ['id'])


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('fk_users_created_by', type_='foreignkey')
        batch_op.drop_column('created_by')

