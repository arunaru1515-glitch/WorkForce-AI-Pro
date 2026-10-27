from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings
import logging

logger = logging.getLogger(__name__)

db_url = settings.get_database_url()

try:
    if "mysql" in db_url:
        try:
            import pymysql
            pre_conn = pymysql.connect(
                host=settings.MYSQL_HOST,
                user=settings.MYSQL_USER,
                password=settings.MYSQL_PASSWORD,
                port=int(settings.MYSQL_PORT)
            )
            with pre_conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{settings.MYSQL_DB}`;")
            pre_conn.close()
        except Exception as pre_err:
            logger.debug(f"Pre-creation check skipped: {pre_err}")

    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False
    )
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    logger.warning(f"Could not connect with MySQL URL ({db_url}): {e}. Using SQLite fallback for smooth development.")
    fallback_url = "sqlite:///./workforce_ai.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
