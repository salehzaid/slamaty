#!/bin/bash

# =====================================================
# CAPA Dashboard Migration Script
# =====================================================
# This script applies the CAPA dashboard migration and
# inserts sample data for testing.
#
# Usage: ./apply_capa_dashboard_migration.sh
# =====================================================

set -e  # Exit on error

echo "=================================================="
echo "CAPA Dashboard Migration"
echo "=================================================="
echo ""

# Get database connection details from env.local
if [ -f "env.local" ]; then
    echo "✓ Found env.local file"
    source env.local
else
    echo "✗ env.local file not found!"
    echo "  Please create env.local with DATABASE_URL"
    exit 1
fi

# Extract connection details from DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "✗ DATABASE_URL not set in env.local"
    exit 1
fi

echo "✓ DATABASE_URL loaded"
echo ""

# Parse PostgreSQL connection string
# Format: postgresql://user:password@host:port/database
DB_URL=$DATABASE_URL

echo "=================================================="
echo "Step 1: Applying Database Schema Migration"
echo "=================================================="
echo ""

# Apply the migration
if psql "$DB_URL" -f migrations/add_capa_dashboard_tables.sql; then
    echo ""
    echo "✓ Schema migration applied successfully!"
else
    echo ""
    echo "✗ Schema migration failed!"
    exit 1
fi

echo ""
echo "=================================================="
echo "Step 2: Inserting Sample Data"
echo "=================================================="
echo ""

# Insert sample data
if psql "$DB_URL" -f migrations/insert_sample_capa_data.sql; then
    echo ""
    echo "✓ Sample data inserted successfully!"
else
    echo ""
    echo "✗ Sample data insertion failed!"
    exit 1
fi

echo ""
echo "=================================================="
echo "Migration Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Restart the backend server"
echo "2. Navigate to /capa-dashboard in the frontend"
echo "3. Login with your credentials"
echo "4. Explore the 5 dashboard sections:"
echo "   - نظرة عامة (Overview)"
echo "   - تتبع التقدم (Progress Tracking)"
echo "   - الجدول الزمني (Timeline)"
echo "   - التنبيهات (Alerts)"
echo "   - التقارير (Reports)"
echo ""
echo "✓ All data should now be visible!"
echo ""

