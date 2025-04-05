def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome" in response.json()["message"]

def test_rate_limiting(client):
    # Test rate limiting by making multiple requests
    for _ in range(5):
        response = client.get("/")
        assert response.status_code == 200
    
    # The 6th request should be rate limited
    response = client.get("/")
    assert response.status_code == 429
    assert "rate limit exceeded" in response.json()["detail"].lower() 