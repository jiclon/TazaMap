import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base
from main import app 
from dependencies import get_db

engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(bind=engine)

def get_test_db():
    test_db = TestingSessionLocal()
    try:
        yield test_db
    finally:
        test_db.close()
        

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = get_test_db
    yield TestClient(app)
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
        