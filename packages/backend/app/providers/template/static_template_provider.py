import os
import json
from cachetools import cached, TTLCache
from typing import List, Dict, Optional

from .template_provider import TemplateProvider

very_long_ttl_cache = 120000
template_cache = TTLCache(maxsize=100, ttl=very_long_ttl_cache)


class StaticTemplateProvider(TemplateProvider):
    def __init__(self):
        self.templates_dir = os.getenv("TEMPLATES_DIR", "./templates")

    @cached(cache=template_cache)
    def get_templates(self, cursor=None):
        templates = []
        id = 0
        for filename in os.listdir(self.templates_dir):
            if filename.endswith(".json"):
                file_path = os.path.join(self.templates_dir, filename)
                with open(file_path, "r", encoding="utf-8") as file:
                    template_data = json.load(file)
                    template = {
                        "id": id,
                        "title": template_data.get("title", "No Title"),
                        "description": template_data.get(
                            "description", "No Description"
                        ),
                        "image": template_data.get("image", None),
                        "tags": template_data.get("tags", []),
                    }
                    templates.append(template)
                    id += 1
        return templates

    def get_template_by_id(self, template_id: int) -> Optional[Dict]:
        templates = self.get_templates()
        if 0 <= template_id < len(templates):
            file_path = os.path.join(
                self.templates_dir, os.listdir(self.templates_dir)[template_id]
            )
            with open(file_path, "r", encoding="utf-8") as file:
                template_data = json.load(file)
                return template_data.get("template", "Template content not found.")
        return None

    def save_template(self, template_data: Dict):
        id = len(os.listdir(self.templates_dir)) + 1
        file_path = os.path.join(self.templates_dir, f"template_{id}.json")
        with open(file_path, "w", encoding="utf-8") as file:
            json.dump(template_data, file, indent=4)
        self.invalidate_cache()

    def invalidate_cache(self):
        template_cache.clear()
