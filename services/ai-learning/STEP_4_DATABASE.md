# Step 4: Configure Database Connection

## Configuration

### Option 1: PostgreSQL (Recommended for Production)

Update `services/ai-learning/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/kealee?schema=public
```

### Option 2: SQLite (For Development)

```env
DATABASE_URL=sqlite:///./ai_learning.db
```

## Test Connection

### Using Python

```python
from config.database_config import test_connection, DATABASE_URL

print(f"Testing connection to: {DATABASE_URL}")
if test_connection():
    print("✅ Database connection successful!")
else:
    print("❌ Database connection failed")
```

### Using SQLAlchemy Directly

```python
from sqlalchemy import create_engine
import os

database_url = os.getenv("DATABASE_URL")
engine = create_engine(database_url)

# Test connection
with engine.connect() as conn:
    result = conn.execute("SELECT 1")
    print("✅ Database connection successful!")
```

## Database Tables Needed

The AI learning service will need these tables (to be added to Prisma schema):

- `DataConsent` - Consent tracking
- `AnonymizedPermitData` - Training data
- `CorrectionPattern` - Correction patterns
- `InspectorFeedback` - Human feedback
- `ModelVersion` - Model versions
- `TrainingJob` - Training jobs
- `PerformanceMetric` - Performance metrics
- `ABTest` - A/B tests

## Verification

Run verification script:
```bash
python scripts/setup_complete.py
```

Or test manually:
```python
from config.database_config import test_connection
test_connection()
```

---

**Status**: Ready to configure database connection
