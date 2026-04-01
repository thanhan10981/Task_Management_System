# Test Register API
$headers = @{ "Content-Type" = "application/json" }
$registerBody = @{
    email = "testuser@example.com"
    password = "Test@12345"
    fullName = "Test User"
} | ConvertTo-Json

Write-Host "========== TEST REGISTER API ==========" -ForegroundColor Green
Write-Host "URL: POST http://localhost:3000/auth/register"
Write-Host "Body: $registerBody"

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" `
        -Method POST `
        -Headers $headers `
        -Body $registerBody -Verbose

    Write-Host "✅ Register Success!" -ForegroundColor Green
    Write-Host ($registerResponse | ConvertTo-Json -Depth 10)
    
    # Extract token for next tests
    $accessToken = $registerResponse.data.accessToken
    $refreshToken = $registerResponse.data.refreshToken
    
    Write-Host "`n========== TEST LOGIN API ==========" -ForegroundColor Green
    $loginBody = @{
        email = "testuser@example.com"
        password = "Test@12345"
    } | ConvertTo-Json
    
    Write-Host "URL: POST http://localhost:3000/auth/login"
    Write-Host "Body: $loginBody"
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
        -Method POST `
        -Headers $headers `
        -Body $loginBody
    
    Write-Host "✅ Login Success!" -ForegroundColor Green
    Write-Host ($loginResponse | ConvertTo-Json -Depth 10)
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
    }
}
