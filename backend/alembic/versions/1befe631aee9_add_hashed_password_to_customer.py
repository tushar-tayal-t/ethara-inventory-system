from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '1befe631aee9'
down_revision: Union[str, None] = 'f3a05c758960'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('customers', sa.Column('hashed_password', sa.String(), server_default='', nullable=False))

def downgrade() -> None:
    op.drop_column('customers', 'hashed_password')
