import httpx

from app.config import settings


class BackendClient:
    def __init__(self) -> None:
        self.base_url = settings.backend_api_url.rstrip("/")

    async def post(self, path: str, payload: dict) -> dict:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(f"{self.base_url}{path}", json=payload)
            response.raise_for_status()
            return response.json()

    async def get(self, path: str) -> dict:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{self.base_url}{path}")
            response.raise_for_status()
            return response.json()

    async def patch(self, path: str, payload: dict) -> dict:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.patch(f"{self.base_url}{path}", json=payload)
            response.raise_for_status()
            return response.json()


backend_client = BackendClient()
