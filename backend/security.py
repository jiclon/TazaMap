from pwdlib import PasswordHash 

password_hasher = PasswordHash.recommended()

def hash_password(password: str) -> str: 
    hashed = password_hasher.hash(password)
    return hashed

def verify_password(password: str, password_hash: str) -> bool: 
    is_valid = password_hasher.verify(password, password_hash)
    return is_valid

