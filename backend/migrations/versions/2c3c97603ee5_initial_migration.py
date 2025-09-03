"""initial migration

Revision ID: 2c3c97603ee5
Revises: 596e0ddd5cff
Create Date: 2025-09-01 15:46:48.907243

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2c3c97603ee5'
down_revision = '596e0ddd5cff'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('attachments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('comment_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_attachments_comment_id', 'comments', ['comment_id'], ['id'])

def downgrade():
    with op.batch_alter_table('attachments', schema=None) as batch_op:
        batch_op.drop_constraint('fk_attachments_comment_id', type_='foreignkey')
        batch_op.drop_column('comment_id')
