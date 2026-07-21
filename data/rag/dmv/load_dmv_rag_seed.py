import json
import psycopg2

DATABASE_URL = "postgresql://postgres:password@localhost:5432/kealee"

def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS rag_data (
        id SERIAL PRIMARY KEY,
        type TEXT,
        jurisdiction TEXT,
        data JSONB
    )
    """)

    with open("data/rag/full/dmv_full_dataset.jsonl", "r") as f:
        count = 0
        for line in f:
            record = json.loads(line)

            cur.execute("""
            INSERT INTO rag_data (type, jurisdiction, data)
            VALUES (%s, %s, %s)
            """, (
                record.get("type"),
                record.get("jurisdiction", ""),
                json.dumps(record)
            ))

            count += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"Loaded {count} records into database")

if __name__ == "__main__":
    main()