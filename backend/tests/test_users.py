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
