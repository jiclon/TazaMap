def test_create_user(client):
    data = {"phone": "+77010000001", "name": "Али"}
    response = client.post("/users", json=data)
    assert response.status_code == 201 
    assert response.json()["role"] == "user"
    assert "phone" not in response.json()
