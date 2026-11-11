from security import hash_password, verify_password


def test_hash_is_not_password():
    result = hash_password("secret123")
    assert result != "secret123"


def test_verify_correct_password(): 
    hashed = hash_password("secret123") 
    result = verify_password("secret123", hashed)
    assert result == True

def test_verify_wrong_password(): 
    hashed = hash_password("secret123") 
    result = verify_password("wrong123", hashed)
    assert result == False


