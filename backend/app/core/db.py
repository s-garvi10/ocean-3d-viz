from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# Schema: Extensible instrument + profile design
#
# Adding Glider, CTD, BGC, Mooring, ADCP support requires:
#   1. INSERT INTO data_sources
#   2. INSERT INTO instruments (type = 'GLIDER' / 'CTD' / etc.)
#   3. No schema changes required.
# ─────────────────────────────────────────────────────────────────────────────
SCHEMA_SQL = """
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── Data sources (NetCDF files, APIs, etc.) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS data_sources (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    source_type VARCHAR(50)  NOT NULL,  -- NETCDF, OPENDAP, ARGOVIS, ERDDAP
    base_url    TEXT,
    variables   TEXT[],
    time_start  TIMESTAMPTZ,
    time_end    TIMESTAMPTZ,
    bbox        GEOMETRY(POLYGON, 4326),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Instruments (extensible by type) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instruments (
    id              SERIAL PRIMARY KEY,
    platform_id     VARCHAR(40) UNIQUE NOT NULL,  -- WMO id, glider serial, etc.
    instrument_type VARCHAR(20) NOT NULL,
        -- ARGO | GLIDER | CTD | BGC | MOORING | ADCP
    geom            GEOMETRY(POINT, 4326),
    last_timestamp  TIMESTAMPTZ,
    source_id       INTEGER REFERENCES data_sources(id),
    metadata        JSONB DEFAULT '{}'
);

-- ── Profiles (one per dive / cast) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id              SERIAL PRIMARY KEY,
    instrument_id   INTEGER REFERENCES instruments(id),
    timestamp       TIMESTAMPTZ NOT NULL,
    geom            GEOMETRY(POINT, 4326),
    max_depth       REAL,
    quality_flag    SMALLINT DEFAULT 1  -- 1=good, 2=questionable, 4=bad
);

-- ── Profile measurements (per variable per depth level) ─────────────────────
CREATE TABLE IF NOT EXISTS profile_measurements (
    id          SERIAL PRIMARY KEY,
    profile_id  INTEGER REFERENCES profiles(id),
    depth       REAL NOT NULL,
    variable    VARCHAR(30) NOT NULL,  -- temperature, salinity, oxygen, etc.
    value       REAL,
    qc_flag     SMALLINT DEFAULT 1
);

-- ── Comparison results cache ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comparison_results (
    id              SERIAL PRIMARY KEY,
    instrument_id   INTEGER REFERENCES instruments(id),
    dataset_name    VARCHAR(100),
    variable        VARCHAR(30),
    time_window     TSTZRANGE,
    rmse            REAL,
    bias            REAL,
    skill_score     REAL,
    n_levels        INTEGER,
    computed_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Spatial indexes ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_instruments_geom    ON instruments    USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_profiles_geom       ON profiles       USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_profiles_ts         ON profiles       (timestamp);
CREATE INDEX IF NOT EXISTS idx_profiles_inst       ON profiles       (instrument_id);
CREATE INDEX IF NOT EXISTS idx_measurements_prof   ON profile_measurements (profile_id);
CREATE INDEX IF NOT EXISTS idx_measurements_var    ON profile_measurements (variable);

-- ── Backward-compatible views (for any code still using old table names) ─────
CREATE OR REPLACE VIEW floats AS
    SELECT
        id,
        platform_id AS wmo_id,
        geom,
        last_timestamp
    FROM instruments
    WHERE instrument_type = 'ARGO';
"""


def init_db():
    """Initialize database schema."""
    try:
        with engine.connect() as conn:
            conn.execute(text(SCHEMA_SQL))
            conn.commit()
        logger.info("✅ PostGIS schema initialized (instruments, profiles, comparison_results)")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise
