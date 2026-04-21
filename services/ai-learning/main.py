import os
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="Kealee AI Learning Service")


@app.get("/health")
async def health():
    return JSONResponse({"status": "ok", "service": "ai-learning"})


@app.get("/")
async def root():
    return {"service": "kealee-ai-learning", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port)
