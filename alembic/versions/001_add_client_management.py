"""add client management

Revision ID: 001
Revises: 
Create Date: 2024-03-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create user_client_association table
    op.create_table(
        'user_client_association',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'client_id')
    )
    
    # Add role column to users table
    op.add_column('users', sa.Column('role', sa.String(), nullable=False, server_default='client_manager'))
    
    # Create clients table
    op.create_table(
        'clients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('campaign_keywords', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_clients_name'), 'clients', ['name'], unique=False)
    
    # Add client_id to campaigns table
    op.add_column('campaigns', sa.Column('client_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_campaigns_client_id',
        'campaigns', 'clients',
        ['client_id'], ['id']
    )
    
    # Create reports table
    op.create_table(
        'reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    # Drop reports table
    op.drop_table('reports')
    
    # Drop client_id from campaigns
    op.drop_constraint('fk_campaigns_client_id', 'campaigns', type_='foreignkey')
    op.drop_column('campaigns', 'client_id')
    
    # Drop clients table
    op.drop_index(op.f('ix_clients_name'), table_name='clients')
    op.drop_table('clients')
    
    # Drop role from users
    op.drop_column('users', 'role')
    
    # Drop user_client_association table
    op.drop_table('user_client_association') 