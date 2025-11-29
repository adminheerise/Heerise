import json
def as_json(value) -> str:
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False)
