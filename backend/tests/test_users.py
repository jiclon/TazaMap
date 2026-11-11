import pytest
def test_create_user(client):
    data = {"phone": "+77010000001", "name": "Али", "password": "secret123"}
    response = client.post("/users", json=data)
    assert response.status_code == 201 
    assert response.json()["role"] == "user"
    assert "phone" not in response.json()

def test_duplicate_phone(client):
    data = {"phone": "+77010000002", "name": "Егор", "password": "secret123"}
    first = client.post("/users", json=data)
    second = client.post("/users", json=data)
    assert first.status_code == 201
    assert second.status_code == 409 


def test_role_admin_ignored(client):
    data = {"phone": "+77010000003","name": "Сергей", "role": "admin", "password": "secret123"}
    response = client.post("/users", json=data)
    assert response.status_code == 201
    assert response.json()["role"] == "user"


@pytest.mark.parametrize("bad_phone", ["", "1234", "+770100000011111", "+7701"])
def test_invalid_phone(client, bad_phone):
    data = {"phone": bad_phone, "name": "Кирилл", "password": "secret123"}
    response = client.post("/users", json=data)
    assert response.status_code == 422


@pytest.mark.parametrize("bad_name", [" ", "a", "x" * 100])
def test_invalid_name(client, bad_name):
    data = {"name": bad_name, "phone": "+77010000004", "password": "secret123"}
    response = client.post("/users", json=data)
    assert response.status_code == 422

def test_get_user_not_found(client):
    response = client.get("/users/9999")
    assert response.status_code == 404

def test_new_user_xp_is_zero(client):
    data = {"phone": "+77010000005", "name": "Серик", "password": "secret123"}
    response = client.post("/users", json=data)
    assert response.status_code == 201
    assert response.json()["xp"] == 0

def test_xp_cannot_be_set_on_create(client):
    data = {"phone": "+77010000005", "name": "Алишер", "xp": 9999, "password": "secret123"}
    response = client.post("/users", json=data)
    assert response.status_code == 201 
    assert response.json()["xp"] == 0


def test_duplicate_phone(client):
    data = {"phone": "+77010000006", "name": "Алихан", "password": "secret123"}
    first = client.post("/users", json=data)
    second = client.post("/users", json=data)
    assert first.status_code == 201 
    assert second.status_code == 409 
    assert second.json()["detail"] == "phone_taken"

def test_get_user_not_found(client):
    response = client.get("/users/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "user_not_found"



@pytest.mark.parametrize("bad_password", [" ", "a", "123"])
def test_short_password(client, bad_password):
    data = {"password": bad_password, "phone": "+77010000007", "name": "Питер",}
    response = client.post("/users", json=data)
    assert response.status_code == 422

def test_password_not_in_response(client): 
    data = {"phone": "+77010000008", "name": "Пирок", "password": "12345678"}
    response = client.post("/users", json=data)
    assert response.status_code == 201 
    assert "password" not in response.json()
    assert "password_hash" not in response.json()
