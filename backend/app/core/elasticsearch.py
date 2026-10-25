from typing import Any, Optional
from elasticsearch import AsyncElasticsearch
from app.core.config import settings

PRODUCTS_INDEX = "arustore_products"


class SearchEngineClient:
    """Async Elasticsearch wrapper with graceful SQL fallback when ES cluster is offline."""

    def __init__(self, url: str) -> None:
        self._url = url
        self._client: Optional[AsyncElasticsearch] = None
        self._available: Optional[bool] = None

    async def get_client(self) -> Optional[AsyncElasticsearch]:
        if self._available is False:
            return None
        if self._client is None:
            try:
                client = AsyncElasticsearch(
                    hosts=[self._url],
                    request_timeout=1.5,
                    max_retries=0,
                )
                ok = await client.ping()
                if not ok:
                    await client.close()
                    self._available = False
                    return None
                self._client = client
                self._available = True
            except Exception:
                self._available = False
                self._client = None
        return self._client

    async def ensure_index(self) -> bool:
        client = await self.get_client()
        if client is None:
            return False
        try:
            exists = await client.indices.exists(index=PRODUCTS_INDEX)
            if not exists:
                await client.indices.create(
                    index=PRODUCTS_INDEX,
                    mappings={
                        "properties": {
                            "id": {"type": "integer"},
                            "name": {"type": "text"},
                            "name_fa": {"type": "text"},
                            "description": {"type": "text"},
                            "description_fa": {"type": "text"},
                            "slug": {"type": "keyword"},
                            "brand_id": {"type": "integer"},
                            "category_id": {"type": "integer"},
                            "price": {"type": "float"},
                            "in_stock": {"type": "boolean"},
                        }
                    },
                )
            return True
        except Exception:
            self._available = False
            return False

    async def index_product(self, doc: dict[str, Any]) -> bool:
        client = await self.get_client()
        if client is None:
            return False
        try:
            await self.ensure_index()
            await client.index(index=PRODUCTS_INDEX, id=str(doc["id"]), document=doc)
            return True
        except Exception:
            return False

    async def delete_product(self, product_id: int) -> bool:
        client = await self.get_client()
        if client is None:
            return False
        try:
            await client.delete(
                index=PRODUCTS_INDEX, id=str(product_id), ignore=[404]
            )
            return True
        except Exception:
            return False

    async def search_product_ids(
        self, query: str, limit: int = 20
    ) -> Optional[list[int]]:
        client = await self.get_client()
        if client is None:
            return None
        try:
            res = await client.search(
                index=PRODUCTS_INDEX,
                size=limit,
                query={
                    "multi_match": {
                        "query": query,
                        "fields": [
                            "name^3",
                            "name_fa^3",
                            "description",
                            "description_fa",
                        ],
                        "fuzziness": "AUTO",
                    }
                },
            )
            hits = res.get("hits", {}).get("hits", [])
            return [int(h["_id"]) for h in hits]
        except Exception:
            return None

    async def close(self) -> None:
        if self._client is not None:
            await self._client.close()
            self._client = None


es_client = SearchEngineClient(settings.ELASTICSEARCH_URL)
