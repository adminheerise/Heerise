"""
交互式脚本：将指定邮箱用户设置为 admin。

用法（PowerShell）：
  cd E:\Heerise\backend
  python scripts/make_admin.py

也可直接传参：
  python scripts/make_admin.py --email zzb@163.com
"""

from __future__ import annotations

import argparse
import os
import sqlite3
from pathlib import Path


def _resolve_sqlite_path() -> Path:
    """
    优先读取 DATABASE_URL（sqlite），否则默认使用 backend/app.db。
    支持：
      sqlite:///./app.db
      sqlite:////absolute/path/app.db
    """
    backend_dir = Path(__file__).resolve().parents[1]
    default_db = backend_dir / "app.db"

    url = os.getenv("DATABASE_URL", "").strip()
    if not url or not url.startswith("sqlite"):
        return default_db

    # 兼容 sqlite:///./app.db
    if url.startswith("sqlite:///"):
        raw = url[len("sqlite:///") :]
        p = Path(raw)
        return (backend_dir / p).resolve() if not p.is_absolute() else p

    # 兼容 sqlite:////abs/path/app.db
    if url.startswith("sqlite:////"):
        raw = url[len("sqlite:////") :]
        return Path("/" + raw).resolve()

    return default_db


def main() -> int:
    parser = argparse.ArgumentParser(description="Set a user role to admin by email.")
    parser.add_argument("--email", help="User email to promote to admin.")
    args = parser.parse_args()

    email = (args.email or "").strip()
    if not email:
        email = input("请输入要设置为 admin 的邮箱（例如 zzb@163.com）：").strip()

    if not email or "@" not in email:
        print("邮箱格式不正确，已退出。")
        return 2

    db_path = _resolve_sqlite_path()
    if not db_path.exists():
        print(f"未找到数据库文件：{db_path}")
        print("请确认后端是否已启动过（会自动创建 app.db），或检查 DATABASE_URL 配置。")
        return 3

    conn = sqlite3.connect(str(db_path))
    try:
        cur = conn.cursor()

        # 先确认用户存在
        cur.execute("select id, email, role from users where lower(email)=lower(?)", (email,))
        row = cur.fetchone()
        if not row:
            print(f"未找到用户：{email}")
            return 4

        user_id, found_email, old_role = row
        if old_role == "admin":
            print(f"用户已是 admin：{found_email} (id={user_id})")
            return 0

        cur.execute("update users set role='admin' where id=?", (user_id,))
        conn.commit()

        cur.execute("select email, role from users where id=?", (user_id,))
        verify = cur.fetchone()
        print(f"更新成功：{verify[0]} -> role={verify[1]}")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())


