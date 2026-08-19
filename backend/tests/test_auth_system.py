import pytest
from app.core.security import (
    validate_full_name,
    validate_username,
    validate_password_strength,
    normalize_email,
    generate_secure_otp,
    hash_otp,
    verify_otp_hash
)

def test_full_name_validation():
    # Valid names
    assert validate_full_name("Tony Stark") == "Tony Stark"
    assert validate_full_name("John Smith") == "John Smith"
    
    # Invalid names (numbers or special characters)
    with pytest.raises(Exception):
        validate_full_name("Tony123")
    with pytest.raises(Exception):
        validate_full_name("Tony@Stark")

def test_username_validation():
    assert validate_username("tony_stark") == "tony_stark"
    assert validate_username("user123") == "user123"
    
    with pytest.raises(Exception):
        validate_username("a") # Too short
    with pytest.raises(Exception):
        validate_username("tony stark") # Space not allowed

def test_email_normalization():
    assert normalize_email("  Developer@Spidy.AI  ") == "developer@spidy.ai"
    with pytest.raises(Exception):
        normalize_email("invalid-email")

def test_password_strength_validation():
    # Valid strong password
    validate_password_strength("Spidy@2026_Secure")
    
    # Missing uppercase
    with pytest.raises(Exception):
        validate_password_strength("spidy@2026_secure")
        
    # Missing special char
    with pytest.raises(Exception):
        validate_password_strength("Spidy2026Secure")
        
    # Too short
    with pytest.raises(Exception):
        validate_password_strength("S@1a")

def test_otp_generation_and_hashing():
    otp = generate_secure_otp()
    assert len(otp) == 6
    assert otp.isdigit()
    
    hashed = hash_otp(otp)
    assert verify_otp_hash(otp, hashed) is True
    assert verify_otp_hash("000000", hashed) is False
