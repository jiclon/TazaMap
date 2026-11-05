import pytest
def test_create_user(client):
    data = {"phone": "+77010000001", "name": "Али"}
    response = client.post("/users", json=data)
    assert response.status_code == 201 
    assert response.json()["role"] == "user"
    assert "phone" not in response.json()

def test_duplicate_phone(client):
    data = {"phone": "+77010000002", "name": "Егор"}
    first = client.post("/users", json=data)
    second = client.post("/users", json=data)
    assert first.status_code == 201
    assert second.status_code == 409 


def test_role_admin_ignored(client):
    data = {"phone": "+77010000003","name": "Сергей", "role": "admin"}
    response = client.post("/users", json=data)
    assert response.status_code == 201
    assert response.json()["role"] == "user"


@pytest.mark.parametrize("bad_phone", ["", "1234", "+770100000011111", "+7701"])
def test_invalid_phone(client, bad_phone):
    data = {"phone": bad_phone, "name": "Кирилл"}
    response = client.post("/users", json=data)
    assert response.status_code == 422


@pytest.mark.parametrize("bad_name", [" ", "a", "x" * 100])
def test_invalid_name(client, bad_name):
    data = {"name": bad_name, "phone": "+77010000004"}
    response = client.post("/users", json=data)
    assert response.status_code == 422

def test_get_user_not_found(client):
    response = client.get("/users/9999")
    assert response.status_code == 404
